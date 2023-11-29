/*

 Vertex shader is responsible for:
   - For each vertex, translate coordinates to GL coordinates (-1.0 - 1.0) ((or is it 0.0 - 1.0??))
   - Produce input data for each fragment shader

 Fragment shader is responsible for:
   - Telling the color for an individual pixel

 Textures:
   - Texture space is 0.0 to 1.0

*/

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

const solidRedFragmentShader = `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 0, 0, 1);
}`

export {
  solidRedFragmentShader,
  passthroughVertexShader,
  texturedImageVertexShader,
  texturedImageVertexShaderPixelPerfectStraightCoordinates
}