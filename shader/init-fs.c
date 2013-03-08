varying vec2 vTextureCoord;
uniform float uTexSize;
uniform float uTexStep;

// initial condition
// arguments in [-1,1]
float func(float x, float y) {
    float pi = 3.141592654;

    vec2 xy = vec2(x,y);
    
    /*CUSTOM*/
    return 0.;
    /*CUSTOM*/
}

void main(void)
{
    vec2 xy = 2.0 * vTextureCoord - vec2(1., 1.);
    
    float h = 0.5 * uTexStep; // 0.5 because we multiply the texture size by 2.0
    
    gl_FragColor = vec4(
                        func(xy.x - h, xy.y - h),
                        func(xy.x + h, xy.y - h),
                        func(xy.x - h, xy.y + h),
                        func(xy.x + h, xy.y + h)
                        );
}
