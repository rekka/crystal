varying vec2 vTextureCoord;

uniform highp sampler2D uSampler;
uniform float uTexSize;
uniform float uTexStep;

// sample value from texture
vec4 grid(float dx, float dy) {
    return texture2D(uSampler, vec2(vTextureCoord.s + dx, vTextureCoord.t + dy));
}

vec4 chi(vec4 v) {
    return v - clamp(v, 0.0, 1.0);
}

void main(void)
{
    // retrieve data
    vec4 tpp = grid(uTexStep,uTexStep);
    vec4 tp0 = grid(uTexStep,0.0);
    vec4 tpm = grid(uTexStep,-uTexStep);
    vec4 t0p = grid(0.0,uTexStep);
    vec4 t00 = grid(0.0,0.0);
    vec4 t0m = grid(0.0,-uTexStep);
    vec4 tmp = grid(-uTexStep,uTexStep);
    vec4 tm0 = grid(-uTexStep,0.0);
    vec4 tmm = grid(-uTexStep,-uTexStep);
    
    // create shifts (see draw shader for data structure)
    vec4 upp = vec4(t00.w, tp0.z, t0p.y, tpp.x);
    vec4 up0 = vec4(t00.y, tp0.x, t00.w, tp0.z);
    vec4 upm = vec4(t0m.w, tpm.z, t00.y, tp0.x);
    vec4 u0p = vec4(t00.zw, t0p.xy);
    vec4 u00 = t00;
    vec4 u0m = vec4(t0m.zw, t00.xy);
    vec4 ump = vec4(tm0.w, t00.z, tmp.y, t0p.x);
    vec4 um0 = vec4(tm0.y, t00.x, tm0.w, t00.z);
    vec4 umm = vec4(tmm.w, t0m.z, tm0.y, t00.x);
    
    // compute
    float h = 1.0;
    float oh = 1.0/h;
    float oh2 = oh * oh;
    float dt = 0.25 * h;
    
    // symmetric gradient
    vec4 D1 = (up0 - um0) * oh * 0.5;
    vec4 D2 = (u0p - u0m) * oh * 0.5;
    
    // Hessian
    vec4 X11 = (up0 - 2.0 * u00 + um0) * oh2;
    vec4 X22 = (u0p - 2.0 * u00 + u0m) * oh2;
    vec4 X12 = (upp + umm - ump - upm) * oh2 * 0.25;
    
    vec4 Dnorm2 = D1 * D1 + D2 * D2;
    
    // approximation to stefan problem variation
    vec4 op = (chi(up0) + chi(u0p) + chi(um0) + chi(u0m) - 4.0 * chi(u00)) * oh2;
    
    vec4 newu00 = u00 + dt * op;
    
    gl_FragColor =  newu00;
}
