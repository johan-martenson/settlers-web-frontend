/*

 Vertex shader is responsible for:
   - For each vertex, translate coordinates to GL coordinates (-1.0 - 1.0) ((or is it 0.0 - 1.0??))
   - Produce input data for each fragment shader

 Fragment shader is responsible for:
   - Telling the color for an individual pixel

 Textures:
   - Texture space is 0.0 to 1.0

*/

/**
 * Takes coordinates in game form as input, together with normals and texture mapping
 * 
 * Provides brightness for linear interpolation (gouraud shading) to the fragment shader
 */
const textureAndLightingVertexShader = `#version 300 es
in vec2 a_coords;   // game coordinate (x, y)
in vec3 a_normal;
in vec2 a_texture_mapping;

uniform vec3 u_light_vector; // light vector (x, y, z)
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_screen_height;
uniform float u_screen_width;

// This is output for the fragment shader - values are interpolated for each pixel
out highp vec2 vTextureCoord;
out float v_brightness;

vec2 vertex;
vec2 temp;

void main (void) {

    // Calculate the on-screen coordinates
    //vertex = a_coords * u_scale + u_offset;
    vertex.x = (((a_coords.x * u_scale.x + u_offset.x) / u_screen_width) * 2.0) - 1.0;
    vertex.y = (((a_coords.y * u_scale.y - u_offset.y) / u_screen_height) * 2.0) - 1.0;

    //vertex[1] = 1.0 - vertex[1];

    // Calculate the lighting
    v_brightness = dot(a_normal, u_light_vector) * -1.0 / 4.0;
    //v_brightness = 0.0;

    // Texture and verticies have different coordinate spaces, we do this to invert Y axis
    //vTextureCoord = -vertex;
    vTextureCoord = a_texture_mapping;

    // Setting vertex position for shape assembler 
    //   -- 0.0 is a Z coordinate
    //   -- 1.1 is a W, special value needed for 3D math, just leave it 1 for now
    gl_Position = vec4(vertex, 0.0, 1.0);
}
`

const textureAndLightingFragmentShader = `#version 300 es
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

const texturedImageVertexShader = `#version 300 es

in vec2 a_position;
in vec2 a_texcoord;
 
uniform vec2 u_game_point;
uniform vec2 u_screen_offset;
uniform vec2 u_image_offset;
uniform float u_scale;
uniform vec2 u_source_coordinate;
uniform vec2 u_source_dimensions;
uniform vec2 u_screen_dimensions;
uniform sampler2D u_texture;

vec2 image_center;
vec2 adjusted_image_center;
vec2 vertex;
vec2 onePixel;
vec2 pixel_scale;

out vec2 v_texcoord;

// At default screen size, to get pixel correct results: PIXEL_SCALE = (default_scale * width|height_in_pixels) / 2
#define DEFAULT_SCALE 35.0

void main() {

  // Calculate the on-screen center of the image
  image_center.x = (((u_game_point.x * u_scale + u_screen_offset.x) / u_screen_dimensions.x) * 2.0) - 1.0;
  image_center.y = (((u_game_point.y * u_scale - u_screen_offset.y) / u_screen_dimensions.y) * 2.0) - 1.0;

  // Calculate the pixel_scale factor to make drawing pixel-perfect at the default scale
  pixel_scale.x = (DEFAULT_SCALE * float(u_screen_dimensions.x)) / 2.0;
  pixel_scale.y = (DEFAULT_SCALE * float(u_screen_dimensions.y)) / 2.0;

  // Adjust for the image's own offset
  //   -- For the y axis, the u_image_offset.y variable is the distance to the top of the image but we need the distance to the bottom
  adjusted_image_center.x = image_center.x - u_image_offset.x * u_scale / pixel_scale.x;
  adjusted_image_center.y = image_center.y - (u_source_dimensions.y - u_image_offset.y) * u_scale / pixel_scale.y;

  // Get the individual vertex coordinate
  vertex.x = adjusted_image_center.x + a_position.x * u_scale * u_source_dimensions.x / pixel_scale.x;
  vertex.y = adjusted_image_center.y + a_position.y * u_scale * u_source_dimensions.y / pixel_scale.y;

  // Find the coordinates within the texture
  onePixel = vec2(1) / vec2(textureSize(u_texture, 0));

  v_texcoord.x = u_source_coordinate.x * onePixel.x + u_source_dimensions.x * onePixel.x * a_texcoord.x;
  v_texcoord.y = u_source_coordinate.y * onePixel.y + u_source_dimensions.y * onePixel.y - u_source_dimensions.y * onePixel.y * a_texcoord.y;

  // Setting vertex position for shape assembler 
  //   -- 0.0 is a Z coordinate
  //   -- 1.1 is a W, special value needed for 3D math, just leave it 1 for now
  gl_Position = vec4(vertex, 0.0, 1.0);
}`

const texturedImageVertexShaderPixelPerfect = `#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

uniform vec2 u_game_point;
uniform vec2 u_screen_offset;
uniform vec2 u_image_offset;
uniform float u_scale;
uniform vec2 u_source_coordinate;
uniform vec2 u_source_dimensions;
uniform vec2 u_screen_dimensions;
uniform sampler2D u_texture;

vec2 image_center;
vec2 adjusted_image_center;
vec2 vertex_pixels;
vec2 vertex;
vec2 onePixel;
vec2 pixel_scale;

out vec2 v_texcoord;

// At default screen size, to get pixel correct results: PIXEL_SCALE = (default_scale * width|height_in_pixels) / 2
#define DEFAULT_SCALE 35.0

void main() {

  // Calculate the on-screen center of the image (pixel coordinates)
  image_center.x = u_game_point.x * u_scale + u_screen_offset.x;
  image_center.y = u_game_point.y * u_scale - u_screen_offset.y;

  // Adjust for the image's own offset (pixel space)
  //   -- For the y axis, the u_image_offset.y variable is the distance to the top of the image but we need the distance to the bottom
  adjusted_image_center.x = image_center.x - (u_image_offset.x * u_scale / DEFAULT_SCALE);
  adjusted_image_center.y = image_center.y - (u_source_dimensions.y - u_image_offset.y) * u_scale / DEFAULT_SCALE;

  // Get the individual vertex coordinate (pixel space)
  vertex_pixels.x = round(adjusted_image_center.x + a_position.x * u_source_dimensions.x * u_scale / DEFAULT_SCALE);
  vertex_pixels.y = round(adjusted_image_center.y + a_position.y * u_source_dimensions.y * u_scale / DEFAULT_SCALE);

  // Convert to gl space
  vertex.x = (float(vertex_pixels.x) / u_screen_dimensions.x) * 2.0 - 1.0;
  vertex.y = (float(vertex_pixels.y) / u_screen_dimensions.y) * 2.0 - 1.0;

  // Find the coordinates within the texture
  onePixel = vec2(1) / vec2(textureSize(u_texture, 0));

  v_texcoord.x = u_source_coordinate.x * onePixel.x + u_source_dimensions.x * onePixel.x * a_texcoord.x;
  v_texcoord.y = u_source_coordinate.y * onePixel.y + u_source_dimensions.y * onePixel.y - u_source_dimensions.y * onePixel.y * a_texcoord.y;

  // Setting vertex position for shape assembler
  //   -- 0.0 is a Z coordinate
  //   -- 1.1 is a W, special value needed for 3D math, just leave it 1 for now
  gl_Position = vec4(vertex, 0.0, 1.0);
}`

const texturedImageVertexShaderPixelPerfectStraightCoordinates = `#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

// Always draws in the top left corner with given scale. No translation and no offset.

uniform float u_scale;
uniform vec2 u_source_coordinate;
uniform vec2 u_source_dimensions;
uniform vec2 u_screen_dimensions;
uniform sampler2D u_texture;

vec2 image_center;
vec2 vertex_pixels;
vec2 vertex;
vec2 onePixel;
vec2 pixel_scale;

out vec2 v_texcoord;

// At default screen size, to get pixel correct results: PIXEL_SCALE = (default_scale * width|height_in_pixels) / 2
#define DEFAULT_SCALE 35.0

void main() {

  // Get the individual vertex coordinate (pixel space)
  vertex_pixels.x = round(a_position.x * u_source_dimensions.x * u_scale / DEFAULT_SCALE);
  vertex_pixels.y = round(a_position.y * u_source_dimensions.y * u_scale / DEFAULT_SCALE);

  // Convert to gl space
  vertex.x = (float(vertex_pixels.x) / u_screen_dimensions.x) * 2.0 - 1.0;
  vertex.y = (float(vertex_pixels.y) / u_screen_dimensions.y) * 2.0 - 1.0;

  // Find the coordinates within the texture
  onePixel = vec2(1) / vec2(textureSize(u_texture, 0));

  v_texcoord.x = u_source_coordinate.x * onePixel.x + u_source_dimensions.x * onePixel.x * a_texcoord.x;
  v_texcoord.y = u_source_coordinate.y * onePixel.y + u_source_dimensions.y * onePixel.y - u_source_dimensions.y * onePixel.y * a_texcoord.y;

  // Setting vertex position for shape assembler
  //   -- 0.0 is a Z coordinate
  //   -- 1.1 is a W, special value needed for 3D math, just leave it 1 for now
  gl_Position = vec4(vertex, 0.0, 1.0);
}`

const passthroughVertexShader = `#version 300 es

in vec2 a_coord;
in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {

  v_texcoord = a_texcoord;
  gl_Position = vec4(a_coord, 0, 1.0);
}
`

const textureFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texcoord;
 
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
   outColor = texture(u_texture, v_texcoord);
}`

const shadowFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

vec4 textureColor;

out vec4 outColor;

void main() {
   textureColor = texture(u_texture, v_texcoord);

   outColor = vec4(0.0, 0.0, 0.0, textureColor[3] * 0.6);
}`

const solidRedFragmentShader = `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 0, 0, 1);
}`

export {
  solidRedFragmentShader,
  passthroughVertexShader,
  textureAndLightingVertexShader,
  textureAndLightingFragmentShader,
  texturedImageVertexShader,
  textureFragmentShader,
  shadowFragmentShader,
  texturedImageVertexShaderPixelPerfect,
  texturedImageVertexShaderPixelPerfectStraightCoordinates
}