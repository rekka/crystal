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

var ViewModel = function (solver, canvas) {
    var self = this;
    
    self.presets = Solver.presets;
    
    self.preset = ko.observable();
    
    self.computations = {
        'crystal': {
                epsilon: ko.observable(0.0001).extend({numeric: {min: 0.000001, max: 1.0}}),
            },
        'square-crystal': {
                epsilon: ko.observable(0.0001).extend({numeric: {min: 0.000001, max: 1.0}}),
            },
        'stefan': {},
    };
    
    self.displays = {
        'onephase': {},
        'twophase': {},
    };
    
    self.status = solver.status;
    
    self.toggleComputation = function() { solver.toggleComputation(); };
        
    self.computation = {
            size: ko.observable(512),
            program: ko.observable('stefan'),
            initFunc: ko.observable(),
            dirichletFunc: ko.observable(),
            
            sizes: [128, 256, 512, 1024, 2048],
            programs: Object.keys(self.computations),
        };
        
    self.computation.uniforms = ko.computed(function () { return self.computations[self.computation.program()]; });
    self.computation.uniformsArray = ko.computed(function () {
            var a = [];
            $.each(self.computation.uniforms(), function (name, value) {
                a.push({name: name, value: value});
            });
            return a;
        });
        
    self.computation.hasError = ko.computed(function() {
        var params = self.computations[self.computation.program()];
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
        
    self.restartComputation = function () {
            
            var size = self.computation.size();
            
            var canvassize = Math.max(512, size);
            
            canvas.width = canvassize;
            canvas.height = canvassize;
            
            try {
                solver.init(
                    self.computationToJS(), 
                    self.display.params
                );
            }
            catch (e) {
                alert(e);
            }
        };
    
    self.display = {
            program: ko.observable('twophase'),
            programs: Object.keys(self.displays),
            light: ko.observable((new Vec3(-1,-1,1)).normalize()),
        };

    self.display.params = ko.computed(function () {
            var p = {};
            p.program = self.display.program();
            p.uniforms = {
                light: self.display.light().normalize(),
            };
            return p;
        });
    
    self.statusTable = [
        {name: 'nStep', value: solver.status.computation.nStep},
        {name: 'FPS', value: ko.computed(function () { return solver.status.display.fps().toFixed(1);}) },
        {name: 'steps/s', value: ko.computed(function () {
                            if (solver.status.computation.running()) {
                                return solver.status.computation.nStepsPerSec().toFixed(0);
                            }
                            return 'N/A';
                        })
        },
    ];
    
    // store computation parameters as a JS object
    self.computationToJS = function () {
        var program =  self.computation.program();
        
        var data = {
            program: program,
            size: self.computation.size(),
            uniforms: ko.toJS(self.computations[program]),
            initFunc: self.computation.initFunc(),
            dirichletFunc: self.computation.dirichletFunc(),
        }
        
        return data;
    };
    
    // set computation parameters based on the data
    self.computationFromJS = function (data) {
        ['program','size','initFunc','dirichletFunc'].forEach(function (item) {
            self.computation[item](data[item]);
        });
        
        var uo = self.computations[data.program];
        
        $.each(data.uniforms, function (name, value) {
                uo[name](value);
        });
    };
    
    self.computationJSON = ko.computed(function () {
        return JSON.stringify(self.computationToJS());
    });
    
    self.loadPreset = function () {
        self.computationFromJS(self.preset().data);
        self.restartComputation();
    };
    
    self.computationFromJS({
            program: 'stefan',
            size: 512,
            initFunc: null,
            dirichletFunc: null,
            uniforms: {},
        });
}

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
        
        var viewModel = new ViewModel(solver, canvas);
        
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