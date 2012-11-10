attribute vec2 aVertexPosition;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4(2.0 * aVertexPosition - vec2(1.0, 1.0), 1.0, 1.0);
    vTextureCoord = aVertexPosition;
}
