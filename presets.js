
Solver.presets = [
    {
        name: 'default',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: null,
            dirichletFunc: null,
            uniforms: {},
        }
    },

    {
        name: 'homogenization',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98 - pow(sin(x* 15.),6.0) * pow(sin(y* 15.),6.0))',
            dirichletFunc: 'step(distance(vec2(x,y),vec2(0.,0.)),0.1)',
            uniforms: {},
        }
    },

    {
        name: 'homogenization 1/2',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98 - pow(sin(x* 30.),6.0) * pow(sin(y* 30.),6.0))',
            dirichletFunc: 'step(distance(vec2(x,y),vec2(0.,0.)),0.1)',
            uniforms: {},
        }
    },

    {
        name: 'homogenization 1/4',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98 - pow(sin(x* 60.),6.0) * pow(sin(y* 60.),6.0))',
            dirichletFunc: 'step(distance(vec2(x,y),vec2(0.,0.)),0.1)',
            uniforms: {},
        }
    },

    {
        name: 'homogeneous',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98)',
            dirichletFunc: 'step(distance(vec2(x,y),vec2(0.,0.)),0.1)',
            uniforms: {},
        }
    },

    {
        name: 'vertical homogenization 1/2',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98 - 0.5*pow(sin(x* 30.),6.0))',
            dirichletFunc: 'step(distance(vec2(x,y),vec2(0.,0.)),0.1)',
            uniforms: {},
        }
    },

    {
        name: 'facet breaking',
        data: {
            program: 'crystal',
            size: 512,
            initFunc: 'min(10. * max(distance(xy, vec2(-0.,0.)) - 0.5, 0.),10.*max(distance(xy, vec2(0.59,0.)) - 0.1, 0.)-0.01)',
            dirichletFunc: null,
            uniforms: {epsilon: 0.0001},
        }
    },

    {
        name: 'flat homogenization',
        data: {"program":"stefan","size":512,"uniforms":{},"initFunc":"max(min(1.05,1.+5.*(-y-0.8)),0.98 *(1. - pow(sin(x* pi*5.),6.0) * pow(sin(y* pi*5.),6.0)))","dirichletFunc":"step(0.,5.*(-y-0.8)-0.05)+step(0.95,y)"}
    },

    {
        name: 'flat homogenization - vertical',
        data: {"program":"stefan","size":512,"uniforms":{},"initFunc":"max(min(1.05,1.+5.*(-y-0.8)),0.98 *(1. - 0.3* pow(sin(x* pi*5.),6.0)))","dirichletFunc":"step(0.,5.*(-y-0.8)-0.05)+step(0.95,y)"}
    },

    {
        name: 'holes',
        data: {
            program: 'stefan',
            size: 512,
            initFunc: 'max(min(1.05,1.45 - 4.*distance(vec2(x,y), vec2(0.,0.))),'+
                                    '0.98)',
            dirichletFunc: 'max(step(distance(vec2(x,y),vec2(0.,0.)),0.1),' +
            '1.0-step(pow(sin(x* 10.),6.0) * pow(sin(y* 10.),6.0),0.8))',
            uniforms: {},
        }
    },
]
