varying vec2 vTextureCoord;
uniform float uTexSize;
uniform float uTexStep;

// initial condition
// arguments in [-1,1]
float func(float x, float y) {
    /*CUSTOM*/
    return 0.;
    /*CUSTOM*/
}

// normalize
float func1(float x, float y) {
    float v = func(x,y);
    return 1. - step(v, 0.0);
}

void main(void)
{
    vec2 xy = 2.0 * vTextureCoord - vec2(1., 1.);
    
    float h = 0.5 * uTexStep; // 0.5 because we multiply the texture size by 2.0
    
    gl_FragColor = vec4(
                        func1(xy.x - h, xy.y - h),
                        func1(xy.x + h, xy.y - h),
                        func1(xy.x - h, xy.y + h),
                        func1(xy.x + h, xy.y + h)
                        );
}
