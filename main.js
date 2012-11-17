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
        
        var solver = new Solver(document.getElementById('main-canvas'));
        
        var viewModel = {
            computations: {
                'crystal': {},
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
                sizes: [128, 256, 512, 1024],
                program: ko.observable('stefan'),
                programs: Object.keys(viewModel.computations),
            };
        
        viewModel.display = {
                program: ko.observable('onephase'),
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
            
        
        ko.applyBindings(viewModel);

        solver.init({
                size: 512,
                program: 'stefan',
            }, 
            viewModel.display.params
        );

        solver.toggleComputation(true);
        
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