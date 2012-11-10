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
        if (par.x <= .5*uTexStep) {//odd pixel
            vec4 ux = grid(-uTexStep, 0.);
            if (par.y <= .5*uTexStep) {
                p = vec2(u00.y - ux.y, u00.z - grid(0., -uTexStep).z);
            } else {
                p = vec2(u00.w - ux.w, grid(0., uTexStep).x - u00.x);
            }
        } else {
            vec4 ux = grid(uTexStep, 0.);
            if (par.y <= .5*uTexStep) {
                p = vec2(ux.x - u00.x, u00.w - grid(0., -uTexStep).w);
            } else {
                p = vec2(ux.z - u00.z, grid(0., uTexStep).y - u00.y);
            }
        }
        
        // compute gradient
        vec2 D = p * uTexSize * 0.5;
        
        // surface normal
		vec3 n = vec3(D, 1.0);
		n = normalize(n);
        
		//vec3 light = normalize(vec3(2.0,1.0,1.0));
        
        
        // phong lightning
        float brightness = clamp(max(dot(n, light),0.0) * 0.7 + 0.3,0.0,1.0);
		
        // specularity
        vec3 refl = reflect(light, n);
		float spec = pow(max(-refl.z,0.0),8.0);
		
        // surface color
        vec3 color;
        color = vec3(1.0, 0.2, 0.4);
        
		gl_FragColor.rgb = color * brightness + spec;
        gl_FragColor.a = 1.0;
        
}
