'use strict';

Solver.components.push(function (solver, gl) {
    var current = null;
    
    function compileShader(name, type, source) {
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
        
        gl.shaderSource(shader, directives + '\n' + source);
        gl.compileShader(shader);
        
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            throw name + ' shader compile failed: ' + gl.getShaderInfoLog(shader);
        }

        return shader;
    }

    solver.Program = function (name, vertex, fragment) {

        this.program = gl.createProgram();
        this.name = name;
        this.uniform_cache = {};
        this.attrib_cache = {};
        this.vertex = vertex;
        this.fragment = fragment;
        
        gl.attachShader(this.program, compileShader(vertex.file, gl.VERTEX_SHADER, vertex.source));
        gl.attachShader(this.program, compileShader(fragment.file, gl.FRAGMENT_SHADER, fragment.source));
        
        gl.linkProgram(this.program);
        
        if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)){
            throw '\'' + name + '\'' + ' program link failed: '+ gl.getProgramInfoLog(this.program);
        }
    }

    solver.Program.prototype = {
        
        uniformLocation: function(uniform) {
            var location = this.uniform_cache[uniform];
            if (location === undefined) {
                location = gl.getUniformLocation(this.program, uniform);
                this.uniform_cache[uniform] = location;
            }
            return location;
        },
        
        attribLocation: function(attrib) {
            var location = this.attrib_cache[attrib];
            if (location === undefined) {
                location = gl.getAttribLocation(this.program, attrib);
                gl.enableVertexAttribArray(location);
                this.attrib_cache[attrib] = location;
            }
            return location;
        },
        
        set: function (name, value){
            this.use();
            if(typeof(name) == 'string'){
                var location = this.uniformLocation(name);
                if(location != undefined){
                    if(arguments.length == 2){
                        var type = value.type || typeof(value);
                        switch(type){
                            case 'number' : gl.uniform1f(location, value); break;
                            case 'Mat4' : gl.uniformMatrix4fv(location, false, value.data); break;
                            case 'Mat3' : gl.uniformMatrix3fv(location, false, value.data); break;
                            case 'Mat2' : gl.uniformMatrix2fv(location, false, value.data); break;
                            case 'Vec4' : gl.uniform4f(location, value.x, value.y, value.z, value.w); break;
                            case 'Vec3' : gl.uniform3f(location, value.x, value.y, value.z); break;
                            case 'Vec2' : gl.uniform2f(location, value.x, value.y); break;
                            case 'Texture' : this.sampler(name, location, value); break;
                            case 'object':
                                if(value instanceof Array){
                                    gl['uniform' + value.length + 'fv'](location, value);
                                }
                                break;
                        }
                    }
                    else{
                        var values = [];
                        for(var i=1; i<arguments.length; i++){
                            values.push(arguments[i]);
                        }
                        gl['uniform' + values.length + 'fv'](location, values);
                    }
                }
            }
            else{
                for(var uniform_name in name){
                    this.set(uniform_name, name[uniform_name]);
                }
            }
            return this;
        },
        
        setTexture: function (name, value){
            this.use();
            gl.uniform1i(this.uniformLocation(name), value);
        },
        
        use: function(uniforms){
            if(current != this){
                current = this;
                gl.useProgram(this.program);
            }
            if(uniforms){
                this.set(uniforms);
            }
        },
    };
});