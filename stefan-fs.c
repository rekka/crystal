varying vec2 vTextureCoord;

uniform highp sampler2D uSampler;
uniform highp sampler2D uDirichlet;
uniform float uTexSize;
uniform float uTexStep;

// sample value from texture
vec4 grid(float dx, float dy) {
    return texture2D(uSampler, vTextureCoord + vec2(dx,dy));
}

vec4 chi(vec4 v) {
    return v - clamp(v, 0.0, 1.0);
}

void main(void)
{
    // retrieve data
    vec4 tp0 = grid(uTexStep,0.0);
    vec4 t0p = grid(0.0,uTexStep);
    vec4 t00 = grid(0.0,0.0);
    vec4 t0m = grid(0.0,-uTexStep);
    vec4 tm0 = grid(-uTexStep,0.0);
    
    vec4 d00 = texture2D(uDirichlet, vTextureCoord);
    
    // create shifts (see draw shader for data structure)
    vec4 up0 = vec4(t00.y, tp0.x, t00.w, tp0.z);
    vec4 u0p = vec4(t00.zw, t0p.xy);
    vec4 u00 = t00;
    vec4 u0m = vec4(t0m.zw, t00.xy);
    vec4 um0 = vec4(tm0.y, t00.x, tm0.w, t00.z);
    
    // compute
    float h = 1.0;
    float oh = 1.0/h;
    float oh2 = oh * oh;
    float dt = 0.25 * h;
    
    // approximation to stefan problem variation
    vec4 op = (chi(up0) + chi(u0p) + chi(um0) + chi(u0m) - 4.0 * chi(u00)) * oh2;
    
    vec4 newu00 = u00 + dt * op * (1. - d00);
    
    gl_FragColor =  newu00;
}
