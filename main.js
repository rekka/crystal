"use strict";

// extender that validates that an observable is
// 1) a number
// 2) in a given range
// It attaches an observable that reports any errors.
// Intercepts writes to the target observable
// and sets the error.
// Might not be a number if there's an error!
ko.extenders.numeric = function(target, range) {
    var hasError = ko.observable(null);
    
    range = $.extend({min: null, max: null}, range);
 
    function error(err) {
        if (err) {
            hasError(err);
        } else {
            hasError(null);
        }
    }
 
    function validateRange(x) {
        if ((range.min && (x < range.min)) || (range.max && (x > range.max))) {
            error('Out of range (' + range.min + ',' + range.max + ')');
            return false;
        }
        return true;
    }
    
    var computed = ko.computed({
        read: target,
        write: function (newValue) {
                if (isNaN(newValue)) {
                    error('Not a number');
                } else {
                    var x = parseFloat(newValue);
                    if (validateRange(x)) {
                        error(null);
                        target(x);
                        return;
                    }
                }
                target(newValue);
            }
        });
        
    validateRange(target());
    computed.hasError = hasError;
    return computed;
};

$(function() {
    
    
    $('#save-button').click(function() {
        var canvas = document.getElementById('main-canvas');
        var image = canvas.toDataURL('image/png');
        
        $.ajax({
            type: 'POST',
            url: 'http://localhost:8080/test.png',
            data: image,
            dataType: 'text'
        });
    });
    
    
    Solver.loadShaders(Solver.shaderSources, function () {
        var canvas = document.getElementById('main-canvas');
        var solver = new Solver(canvas);
        
        var viewModel = {
            computations: {
                'crystal': {
                        epsilon: ko.observable(0.0001).extend({numeric: {min: 0.000001, max: 1.0}}),
                    },
                'stefan': {},
            },
            
            displays: {
                'onephase': {},
                'twophase': {},
            },
            
            status: solver.status,
            
            toggleComputation: function() { solver.toggleComputation(); },
        };
            
        
        viewModel.computation = {
                size: ko.observable(512),
                program: ko.observable('stefan'),
                initFunc: ko.observable('max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                        '0.98 - pow(sin(x* 15.),6.0) * pow(sin(y* 15.),6.0))'),
                dirichletCode: ko.observable('step(distance(vec2(x,y),vec2(0.,0.)),0.1)'),
                
                sizes: [128, 256, 512, 1024, 2048],
                programs: Object.keys(viewModel.computations),
            };
        
        viewModel.computation.uniforms = ko.computed(function () { return viewModel.computations[viewModel.computation.program()]; }),
        viewModel.computation.uniformsArray = ko.computed(function () {
                var a = [];
                $.each(viewModel.computation.uniforms(), function (name, value) {
                    a.push({name: name, value: value});
                });
                return a;
            }),
        viewModel.computation.hasError = ko.computed(function() {
            var params = viewModel.computations[viewModel.computation.program()];
            var hasError = null;
            $.each(params, function (name, observable) {
                if (!hasError && observable.hasError) {
                    var err = observable.hasError();
                    if (err) {
                        hasError = name + ': ' + err;
                    }
                }
            });
            return hasError;            
        });
            
        viewModel.restartComputation = function () {
                
                var program = viewModel.computation.program();
                var uniforms = ko.toJS(viewModel.computations[program]);
                var size = viewModel.computation.size();
                
                var canvassize = Math.max(512, size);
                
                canvas.width = canvassize;
                canvas.height = canvassize;
                
                try {
                    solver.init({
                            size: size,
                            program: program,
                            uniforms: uniforms,
                            initFunc: viewModel.computation.initFunc(),
                            dirichletFunc: viewModel.computation.dirichletCode(),
                        }, 
                        viewModel.display.params
                    );
                }
                catch (e) {
                    alert(e);
                }
            };
        
        viewModel.display = {
                program: ko.observable('twophase'),
                programs: Object.keys(viewModel.displays),
                light: ko.observable((new Vec3(-1,-1,1)).normalize()),
            };

        viewModel.display.params = ko.computed(function () {
                var p = {};
                p.program = this.display.program();
                p.uniforms = {
                    light: this.display.light().normalize(),
                };
                return p;
            }, viewModel),
        
        viewModel.statusTable = [
            {name: 'nStep', value: solver.status.computation.nStep},
            {name: 'FPS', value: ko.computed(function () { return solver.status.display.fps().toFixed(1);}) },
            {name: 'steps/s', value: ko.computed(function () { return solver.status.computation.nStepsPerSec().toFixed(0);}) },
            ]
        
        ko.applyBindings(viewModel);

        viewModel.restartComputation();

        solver.toggleComputation(false);
        
        $('#main-canvas').mousemove(function(e) {
                var el = $(this);
                var parentOffset = el.offset();
                var relX = 2 * (e.pageX - parentOffset.left) / el.width() - 1;
                var relY = 2 * (e.pageY - parentOffset.top) / el.height() - 1;
                
                viewModel.display.light(new Vec3(relX, -relY, 1));
            }
        );        
    });
});