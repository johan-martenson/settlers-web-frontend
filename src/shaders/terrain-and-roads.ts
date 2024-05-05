/**
 * Takes coordinates in game form as input, together with normals and texture mapping
 * 
 * Provides brightness for linear interpolation (gouraud shading) to the fragment shader
 */
const textureAndLightingVertexShader = /* glsl */`#version 300 es
precision highp float;

in vec3 a_coords;   // game coordinate (x, y)
in vec3 a_normal;
in vec2 a_texture_mapping;

uniform vec3 u_light_vector; // light vector (x, y, z)
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_screen_height;
uniform float u_screen_width;
uniform float u_height_adjust;

// This is output for the fragment shader - values are interpolated for each pixel
out highp vec2 vTextureCoord;
out float v_brightness;

vec2 vertex;
vec2 adjusted_coord;

#define STANDARD_HEIGHT 10.0

void main (void) {

    // Adjust the the coordinate so that higher points are drawn slightly farther away, and lower points slightly closer
    adjusted_coord.x = a_coords.x;
    adjusted_coord.y = a_coords.y + ((a_coords.z - STANDARD_HEIGHT) / u_height_adjust);


    // CONVERT GAME POINT TO SCREEN POINT


    // Calculate the on-screen coordinates -- vertex = a_coords * u_scale + u_offset
    vertex.x = (((adjusted_coord.x * u_scale.x + u_offset.x) / u_screen_width) * 2.0) - 1.0;
    vertex.y = (((adjusted_coord.y * u_scale.y - u_offset.y) / u_screen_height) * 2.0) - 1.0;


    // Calculate the lighting
    v_brightness = (dot(a_normal, u_light_vector) * -1.0 / 3.0) - 0.1;


    // Texture and verticies have different coordinate spaces, we do this to invert Y axis
    vTextureCoord = a_texture_mapping;


    // Setting vertex position for shape assembler 
    //   -- 0.0 is a Z coordinate
    //   -- 1.1 is a W, special value needed for 3D math, just leave it 1 for now
    gl_Position = vec4(vertex, 0.0, 1.0);
}
`

const textureAndLightingFragmentShader = /* glsl */`#version 300 es
precision highp float;

in highp vec2 vTextureCoord;
in float v_brightness;

out vec4 pixel_color;

uniform sampler2D u_sampler;

vec2 coords;
vec4 texture_color;

void main(void) {
    coords = fract(vTextureCoord);

    texture_color = texture(u_sampler, coords);

    texture_color[0] = texture_color[0] + v_brightness;
    texture_color[1] = texture_color[1] + v_brightness;
    texture_color[2] = texture_color[2] + v_brightness;

    pixel_color = vec4(texture_color[0], texture_color[1], texture_color[2], texture_color[3]);
}
`

export {
    textureAndLightingVertexShader,
    textureAndLightingFragmentShader
}