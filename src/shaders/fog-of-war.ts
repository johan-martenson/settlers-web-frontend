
const fogOfWarFragmentShader = `#version 300 es
precision highp float;

in float v_brightness;

vec4 textureColor;

out vec4 outColor;

void main() {
   outColor = vec4(0.0, 0.0, 0.0, 1.0 - v_brightness);
}`

/**
 * Takes coordinates in game form as input, together with normals and texture mapping
 *
 * Provides brightness for linear interpolation (gouraud shading) to the fragment shader
 */
const fogOfWarVertexShader = `#version 300 es
in vec2 a_coordinates;   // game coordinate (x, y)
in float a_intensity;    // intensity: 0-1

uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_screen_height;
uniform float u_screen_width;

// This is output for the fragment shader - values are interpolated for each pixel
out float v_brightness;

vec2 vertex;
vec2 temp;

void main (void) {

    // Calculate the on-screen coordinates
    //vertex = a_coordinates * u_scale + u_offset;
    vertex.x = (((a_coordinates.x * u_scale.x + u_offset.x) / u_screen_width) * 2.0) - 1.0;
    vertex.y = (((a_coordinates.y * u_scale.y - u_offset.y) / u_screen_height) * 2.0) - 1.0;

    // Calculate the lighting
    v_brightness = a_intensity;

    // Setting vertex position for shape assembler
    gl_Position = vec4(vertex, 0.0, 1.0);
}
`

export {
    fogOfWarVertexShader,
    fogOfWarFragmentShader
}