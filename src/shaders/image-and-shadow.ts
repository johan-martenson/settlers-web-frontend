const texturedImageVertexShaderPixelPerfect = /*glsl*/`#version 300 es

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
uniform float u_height_adjust;
uniform float u_height;

vec2 image_center;
vec2 adjusted_image_center;
vec2 vertex_pixels;
vec2 vertex;
vec2 onePixel;
vec2 pixel_scale;
vec2 adjusted_coord;

out vec2 v_texcoord;

// At default screen size, to get pixel correct results: PIXEL_SCALE = (default_scale * width|height_in_pixels) / 2
#define DEFAULT_SCALE 35.0
#define STANDARD_HEIGHT 10.0

void main() {

   // Start by adjusting the coordinate based on the height
   adjusted_coord.x = u_game_point.x + ((u_height - STANDARD_HEIGHT) / u_height_adjust);
   adjusted_coord.y = u_game_point.y + ((u_height - STANDARD_HEIGHT) / u_height_adjust);


   // Calculate the on-screen center of the image (pixel coordinates)
   image_center.x = adjusted_coord.x * u_scale + u_screen_offset.x;
   image_center.y = adjusted_coord.y * u_scale - u_screen_offset.y;


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

export {
   texturedImageVertexShaderPixelPerfect,
   textureFragmentShader,
   shadowFragmentShader
}