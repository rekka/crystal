"use strict";

var Solver = function (canvas) {
    var gl;
    var progs;

    var framebuffer;
    var texTgt;
    var texSrc;

    var vtxPosBuffer;
    

    gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
            
    var ext;
    try {
        ext = gl.getExtension("OES_texture_float");
    } catch(e) {}
    if ( !ext ) {
        throw "No OES_texture_float extension";
    }
    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0){
        throw "No vertex texture";
    }

    var self = this;
    // attach components
    Solver.components.forEach(function (component) {
        component(self, gl);
    });
    
    gl.viewport(0, 0, canvas.width, canvas.height);
 
    var PROGS_DESC = {
        'init':     {vs: 'flat-vs', fs: 'init'},
        'crystal':  {vs: 'flat-vs', fs: 'crystal'},
        'stefan':   {vs: 'flat-vs', fs: 'stefan'},
        'onephase': {vs: 'flat-vs', fs: 'onephase'},
        'twophase': {vs: 'flat-vs', fs: 'twophase'},
    };

    progs = {};
    $.each(PROGS_DESC, function (name, desc){
        progs[name] = new self.Program(name, Solver.shaderSources[desc.vs], Solver.shaderSources[desc.fs]);
    });
 
    // default display
    var PARAMS_DISPLAY = {
        program: 'onephase',
        uniforms: {
            light: (new Vec3(-1,-1,1)).normalize(),
        },
    };
 
    this.params = {
        computation: {}, // can be set up only once
        
        display: function () { return PARAMS_DISPLAY; }, // can change during computation
    };
    
    this.status = {// observable status of the solver
        computation: {
            running: ko.observable(false),
        },
        display: {
            
        },
    };

    function createFloatTexture(size) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return tex;
    };

    // initialize textures of size n
    this.initTextureFramebuffer = function(n) {
        // create storage textures
        texTgt = createFloatTexture(n);
        texSrc = createFloatTexture(n);

        // create framebuffer
        framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        framebuffer.width = n;
        framebuffer.height = n;

        // create renderbuffer for depth
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);

        // attach renderbuffer
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
      
        // release buffers
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    };

    this.initVtxBuffers = function() {
        
        vtxPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, triangleMesh(1), gl.STATIC_DRAW);
        vtxPosBuffer.itemSize = 2;
        vtxPosBuffer.numItems = 12;

    };

    // set the initial condition
    this.initState = function() {
        var prog = progs.init;
        prog.use({
            uTexSize: framebuffer.width,
            uTexStep: 1/framebuffer.width,
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
        gl.vertexAttribPointer(prog.attribLocation('aVertexPosition'), vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texSrc, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    // run nSteps of the computation
    this.updateState = function(nSteps) {
        
        var prog = progs[this.params.computation.program];
        
        prog.use({
            uTexSize: framebuffer.width,
            uTexStep: 1/framebuffer.width,
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
        gl.vertexAttribPointer(prog.attribLocation('aVertexPosition'), vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(prog.uSampler, 0); // texture on unit 0

        // output into the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        for (var i = 0; i < nSteps; i ++ ) {
            // set up source texture
            gl.bindTexture(gl.TEXTURE_2D, texSrc);
            
            // set up output texture
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texTgt, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
         
            // swap textures
            var t = texSrc;
            texSrc = texTgt;
            texTgt = t;
        }
        
        // unbind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    // output to canvas
    this.drawScene = function() {
        var display = this.params.display();
        var prog = progs[display.program];
        prog.use({
            uTexSize: framebuffer.width,
            uTexStep: 1/framebuffer.width,
        });
        
        prog.set(display.uniforms);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
        gl.vertexAttribPointer(prog.attribLocation('aVertexPosition'), vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texSrc);
        prog.setTexture('uSampler', 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    this.init = function(computation, display) {
        var self = this;

        this.params.computation = $.extend({},
            {
                size: 256,
                program: 'crystal',
            }, computation
        );
        
        if (typeof(display) === 'function') {
            this.params.display = display;
        } else {
            var temp = $.extend({}, PARAMS_DISPLAY, display);
            this.params.display = function () { return temp; };
        }
        
        // grid size
        var n = this.params.computation.size;
        canvas.height = n;
        canvas.width = n;
        
        self.initVtxBuffers();
        self.initTextureFramebuffer(n/2);
        self.initState();

        this.startAnimation();
    };
    
    this.startAnimation = function() {
        var lasttime = Date.now();
        var nFrame = 0; // current animation frame
        var nStep = 0; // current computation step
        var nStepsPerFrame = 20;
        var delay = 20; // ms, delay between frames
        var minfps = 20; // lowest framerate
        var maxfps = 30; // highest framerate
        var fps = null; // current framerate
        var waitFrames = 5; // wait to get a better accuracy
        var nextUpdateFrame = nFrame + waitFrames;
        
        var self = this;
        if (!this.interval) {
            this.interval = setInterval(function() {
                
                var simulationRunning = self.status.computation.running();
                if (simulationRunning) {
                    self.updateState(nStepsPerFrame);
                    nStep += nStepsPerFrame;
                }

                self.drawScene();
                nFrame ++;
                
                
                if (nFrame >= nextUpdateFrame) {
                    nextUpdateFrame = nFrame + waitFrames;
                    
                    var time = Date.now();
                    fps = 1000.0 * waitFrames/(time - lasttime);
                    lasttime = time;
                    
                    if (simulationRunning) {
                        if (fps < minfps) {
                            nStepsPerFrame = Math.round(nStepsPerFrame * fps / minfps);
                            if (nStepsPerFrame < 5) nStepsPerFrame = 5;
                        } else if (fps > maxfps) {
                            nStepsPerFrame = Math.round(nStepsPerFrame * fps / maxfps);
                        }
                    }
                
                    document.getElementById("framerate").innerHTML =
                        "step: " + nStep +
                        ", FPS: " + fps.toFixed(1) +
                        ", steps/s: " + Math.round(fps * nStepsPerFrame);
                }    
            }, delay);
        }
    };
    
    this.stopAnimation = function() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    };
    
    this.toggleComputation = function (on) {
        if (on === undefined) {
            this.status.computation.running(!this.status.computation.running());
        } else {
            this.status.computation.running(on);
        }
    }
    
    this.setLight = function(x,y,z) {
        this.params.display.light.set(x,y,z).normalize();
    };

};

// components from other files that depend on gl context
Solver.components = [];

// shader sources
Solver.shaderSources = {
    // vertex shaders
    'flat-vs': {file: 'flat-vs'},
    // initial data shaders
    'init': {file: 'init-fs'},
    // computation shaders
    'crystal': {file: 'crystal-fs'},
    'stefan': {file: 'stefan-fs'},
    // draw shaders
    'onephase': {file: 'flat-fs'},
    'twophase': {file: 'twophase-fs'},
};

// asynchronously load shader sources, call ready() when done
Solver.loadShaders = function(data, ready) {
    var count = 0;
    $.each(data, function(name, desc) {
        count += 1;

        $.ajax({
            mimeType: 'text/plain; charset=x-user-defined',
            url:         desc.file + '.c',
            type:        'GET',
            dataType:    'text',
            cache:       false,
            success:     function(source) {
                            desc.source = source;
                            count -= 1;
                            if (count == 0) {
                                ready();
                            }
                        }
        });
    });
}