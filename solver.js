"use strict";

var extend = function(a, b){
            var result = {};
            for(var name in a){
                result[name] = a[name];
            }
            for(var name in b){
                result[name] = b[name];
            }
            return result;
        };

function triangleMesh(n) {
        var h = 1/n,  p = 0;
        var pt = new Float32Array(12*n*n);
        for(var i = 0; i < n; i++ ) {
            for(var j = 0; j < n; j++ ){
                pt[p++] = h*j;  pt[p++] = h*i;
                pt[p++] = h*(j+1);  pt[p++] = h*i;
                pt[p++] = h*j;  pt[p++] = h*(i+1);
                pt[p++] = h*(j+1);  pt[p++] = h*i;
                pt[p++] = h*j;  pt[p++] = h*(i+1);
                pt[p++] = h*(j+1);  pt[p++] = h*(i+1);
            }
        }
        return pt;
    }        


var Solver = function() {
    var gl;
    var progs;

    var framebuffer;
    var texTgt;
    var texSrc;

    var lightVec = (new Vec3(-1,-1,1)).normalize();
    var vtxPosBuffer;

    
    
    var shaderSources = {
        'flat-vs': 'flat-vs',
        'flat-fs': 'flat-fs',
        'init-fs': 'init-fs',
        'crystal-fs': 'crystal-fs',
        'stefan-fs': 'stefan-fs',
        'twophase-fs': 'twophase-fs',
    }

    var PROGS_DESC = {
        'init': {
            'vs': 'flat-vs',
            'fs': 'init-fs',
            'attribs': ['aVertexPosition'],
            'uniforms': ['uTexSize','uTexStep']
        },
        'crystal': {
            'vs': 'flat-vs',
            'fs': 'crystal-fs',
            'attribs': ['aVertexPosition'],
            'uniforms': ['uSampler', 'uTexSize','uTexStep']
        },
        'stefan': {
            'vs': 'flat-vs',
            'fs': 'stefan-fs',
            'attribs': ['aVertexPosition'],
            'uniforms': ['uSampler', 'uTexSize','uTexStep']
        },
        'plain': {
            'vs': 'flat-vs',
            'fs': 'flat-fs',
            'attribs': ['aVertexPosition'],
            'uniforms': ['uSampler','uTexSize','uTexStep','light']
        },
        'twophase': {
            'vs': 'flat-vs',
            'fs': 'twophase-fs',
            'attribs': ['aVertexPosition'],
            'uniforms': ['uSampler','uTexSize','uTexStep','light']
        }
    };

    return {
    
        params: {},

        initGL: function(canvas) {
            gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
            
            var ext;
            try {
                ext = gl.getExtension("OES_texture_float");
            } catch(e) {}
            if ( !ext ) {
                alert(err + "OES_texture_float extension"); return;
            }
            if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0){
                alert(err + "Vertex texture"); return;
            }

            gl.viewport(0, 0, canvas.width, canvas.height);
            
        },

        getShader: function(name, type) {
            var shader;
            shader = gl.createShader(type);

             var directives = [
                        '#version 100',
                        'precision highp int;',
                        'precision highp float;',
                        'precision highp vec2;',
                        'precision highp vec3;',
                        'precision highp vec4;',
                    ].join('\n');
            
            gl.shaderSource(shader, directives + '\n' + shaderSources[name]);
            gl.compileShader(shader);
            if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
                throw name + ' shader compile failed: ' + gl.getShaderInfoLog(shader);
            }

            return shader;
        },

        loadProgs: function(desc) {
            var progs = {};
            for (var id in desc) {
                var program = gl.createProgram();
                progs[id] = program;
                gl.attachShader(program, this.getShader(desc[id].vs, gl.VERTEX_SHADER));
                gl.attachShader(program, this.getShader(desc[id].fs, gl.FRAGMENT_SHADER));
                gl.linkProgram(program);
                if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
                    throw id + ' program link failed: '+ gl.getProgramInfoLog(program);
                }
                
                // enable atributes and cache their location
                for (var i = 0; i < desc[id].attribs.length; i++) {
                    progs[id][desc[id].attribs[i]] = gl.getAttribLocation(progs[id], desc[id].attribs[i]);
                    gl.enableVertexAttribArray(progs[id][desc[id].attribs[i]]);
                }
                
                // cache uniform locations
                for (var i = 0; i < desc[id].uniforms.length; i++) {
                    progs[id][desc[id].uniforms[i]] = gl.getUniformLocation(progs[id], desc[id].uniforms[i]);
                }
            }
            return progs;
        },

        initShaders: function() {
            progs = this.loadProgs(PROGS_DESC);
        },

        createFloatTexture: function(size) {
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            return tex;
        },

        // initialize textures of size n
        initTextureFramebuffer: function(n) {
            // create storage textures
            texTgt = this.createFloatTexture(n);
            texSrc = this.createFloatTexture(n);

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
        },

     


        initVtxBuffers: function() {
            
            vtxPosBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, triangleMesh(1), gl.STATIC_DRAW);
            vtxPosBuffer.itemSize = 2;
            vtxPosBuffer.numItems = 12;

        },

        // set the initial condition
        initState: function() {
            gl.useProgram(progs.init);
            gl.uniform1f(progs.init.uTexSize, framebuffer.width);
            gl.uniform1f(progs.init.uTexStep, 1/framebuffer.width);

            gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
            gl.vertexAttribPointer(progs.init.aVertexPosition, vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texSrc, 0);
            
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },

        // run nSteps of the computation
        updateState: function(nSteps) {
            
            var prog = progs[this.params.computation];
            
            gl.useProgram(prog);
            gl.uniform1f(prog.uTexSize, framebuffer.width);
            gl.uniform1f(prog.uTexStep, 1/framebuffer.width);

            gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
            gl.vertexAttribPointer(prog.aVertexPosition, vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(prog.uSampler, 0); // texture on unit 0

            // output into the framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            
            for (var i = 0; i < nSteps; i ++ ) {
                // set up source texture
                gl.bindTexture(gl.TEXTURE_2D, texSrc);
                
                // set up output texture
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texTgt, 0);
                //gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
             
                // swap textures
                var t = texSrc;
                texSrc = texTgt;
                texTgt = t;
            }
            
            // unbind framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },


        // output to canvas
        drawScene: function() {
            var program = progs[this.params.display];
            gl.useProgram(program);
            
            gl.uniform1f(program.uTexSize, framebuffer.width);
            gl.uniform1f(program.uTexStep, 1/framebuffer.width);
            
            lightVec.storeUniform(gl, program.light);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, vtxPosBuffer);
            gl.vertexAttribPointer(program.aVertexPosition, vtxPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
            
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texSrc);
            gl.uniform1i(program.uSampler, 0);
            
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },

        

        // asynchronous loading of external files
        loadShaders: function(data, ready) {
            var count = 0;
            $.each(data, function(name, path) {
                count += 1;

                $.ajax({
                    mimeType: 'text/plain; charset=x-user-defined',
                    url:         path + '.c',
                    type:        'GET',
                    dataType:    'text',
                    cache:       false,
                    success:     function(source) {
                                    data[name] = source;
                                    count -= 1;
                                    if (count == 0) {
                                        ready();
                                    }
                                }
                });
            });
        },

        

        webGLStart: function(params) {
            var self = this;
            var canvas = document.getElementById("main-canvas");

            this.params = extend(
                {
                    size: 256,
                    computation: 'crystal',
                    display: 'plain',
                }, params
            );
            
            // grid size
            var n = this.params.size;
            canvas.height = n;
            canvas.width = n;
            
            this.loadShaders(shaderSources, function() {
            
                self.initGL(canvas);
                try {
                    self.initShaders();
                }
                catch (e) {
                    alert('Shaders: ' + e);
                    throw e;
                }
                self.initVtxBuffers();
                self.initTextureFramebuffer(n/2);

                self.initState();
                
                self.start();
             });
        },
        
        start: function() {
            var lasttime = Date.now();
            var nframes = 0;
            var nstepsframe = 20;
            var nsteps = 0;
            
            var self = this;
    
            setInterval(function() {
                
                self.updateState(nstepsframe);
                nsteps += nstepsframe;

                self.drawScene();
                nframes ++;
                
                var waitFrames = 5;
                if (nframes >= waitFrames) {
                    var time = Date.now();
                    var fps = 1000.0*waitFrames/(time - lasttime);
                    document.getElementById("framerate").innerHTML =
                        "step: " + nsteps +
                        ", FPS: " + fps.toFixed(1) +
                        ", steps/s: " + (1000.0*waitFrames*nstepsframe/(time - lasttime)).toFixed(1);
                    nframes = 0;
                    lasttime = time;
                    
                    var maxfps = 30;
                    if (fps < 20) {
                        nstepsframe -= 2;
                        if (nstepsframe < 5) nstepsframe = 5;
                    } else if (fps > maxfps) {
                        nstepsframe = Math.round(nstepsframe * fps / maxfps);
                    }
                }    
            }, 20);
        },
        
        setLight: function(x,y,z) {
            lightVec.set(x,y,z).normalize();
        }
    }
}();