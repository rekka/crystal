varying vec2 vTextureCoord;

uniform highp sampler2D uSampler;
uniform float uTexSize;
uniform float uTexStep;
uniform vec3 light;

// sample value from texture
vec4 grid(float dx, float dy) {
    return texture2D(uSampler, vec2(vTextureCoord.s + dx, vTextureCoord.t + dy));
}

void main(void)
{
        // compute gradient using symmetric difference
        // unpack floats based on parity
        // packed subtexel structure is 
        //      x ->
        //     -------
        //  y | x | y |    y odd
        //  | | - + - |
        //  V | z | w |    y even
        //     -------
        //   x: o   e
        //
		vec4 u00 = grid(0.0, 0.0);
        vec2 par = mod(vTextureCoord,uTexStep);
        vec2 p;
        float u;
        if (par.x <= .5*uTexStep) {//odd pixel
            vec4 ux = grid(-uTexStep, 0.);
            if (par.y <= .5*uTexStep) {
                p = vec2(u00.y - ux.y, u00.z - grid(0., -uTexStep).z);
                u = u00.x;
            } else {
                p = vec2(u00.w - ux.w, grid(0., uTexStep).x - u00.x);
                u = u00.z;
            }
        } else {
            vec4 ux = grid(uTexStep, 0.);
            if (par.y <= .5*uTexStep) {
                p = vec2(ux.x - u00.x, u00.w - grid(0., -uTexStep).w);
                u = u00.y;
            } else {
                p = vec2(ux.z - u00.z, grid(0., uTexStep).y - u00.y);
                u = u00.w;
            }
        }
        
        // compute gradient
        vec2 D = p * uTexSize * 0.5;
        
        // surface normal
		vec3 n = vec3(D, 1.0);
		n = normalize(n);
        
        // phong lightning
        float brightness = clamp(max(dot(n, light),0.0) * 0.7 + 0.3,0.0,1.0);
		
        // specularity
        vec3 refl = reflect(light, n);
		float spec = pow(max(-refl.z,0.0),5.0);
		
        // surface color
        vec3 color;
        if (u <= 0.0) {
            // ice
            color = vec3(1.0, 0.4, 0.4);
        } else if (u >= 1.0) {
            // water
            color = vec3(1.0, 1.0, 0.4);
        } else {
            // mushy
            color = vec3(0.4, 0.4, 1.0);
        }
        
		gl_FragColor.rgb = color * brightness + spec;
        gl_FragColor.a = 1.0;
        
}
