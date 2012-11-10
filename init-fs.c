varying vec2 vTextureCoord;
uniform float uTexSize;
uniform float uTexStep;

// initial condition
// arguments in [-1,1]
float func(float x, float y) {
    float pi = 3.141592;
    //return sin(pi*x + 10. * y) * sin(pi*y);
    
    //return x*x + y*y;
    float b = min(distance(vec2(x,y), vec2(-0.1,0.)), distance(vec2(x,y), vec2(0.5,0.)) + 0.4);
    float r = max(abs(x)*0.7,abs(y)*12.);
    //return max(min(b,r),0.2);
    //return max(min(b,r),0.3);
//    return max(b,0.5);

    float b1 = max(distance(vec2(x,y), vec2(-0.,0.)) - 0.5, 0.);
    float b2 = max(distance(vec2(x,y), vec2(0.59,0.)) - 0.1, 0.);
    
    return min(b1*10.,10.*b2-0.01);
}

void main(void)
{
    vec2 xy = 2.0 * vTextureCoord - vec2(1., 1.);
    
    float h = 0.5 * uTexStep;
    
    gl_FragColor = vec4(
                        func(xy.x - h, xy.y - h),
                        func(xy.x + h, xy.y - h),
                        func(xy.x - h, xy.y + h),
                        func(xy.x + h, xy.y + h)
                        );
}
