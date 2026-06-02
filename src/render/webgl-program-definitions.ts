import { ProgramDescriptor } from './webgl-utils'
import { textureAndLightingFragmentShader, textureAndLightingVertexShader } from './shaders/terrain-and-roads'
import { shadowFragmentShader, texturedImageVertexShaderPixelPerfect, textureFragmentShader } from './shaders/image-and-shadow'
import { fogOfWarFragmentShader, fogOfWarVertexShader } from './shaders/fog-of-war'

// Constants
const MAX_NUMBER_TRIANGLES = 500 * 500 * 2 // monitor.allTiles.keys.length * 2

// Web gl program definitions
const drawGroundProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: textureAndLightingVertexShader,
    fragmentShaderSource: textureAndLightingFragmentShader,
    uniforms: {
        'u_light_vector': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_offset': { type: 'FLOAT' },
        'u_screen_width': { type: 'FLOAT' },
        'u_screen_height': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_sampler': { type: 'INT' }
    },
    attributes: {
        'a_coords': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 3,
            elementsPerVertex: 3
        },
        'a_normal': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 3,
            elementsPerVertex: 3
        },
        'a_texture_mapping': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 2,
            elementsPerVertex: 2
        }
    }
}

export type DrawGroundUniforms = {
    u_light_vector: number[]
    u_scale: number[]
    u_offset: number[]
    u_screen_width: number
    u_screen_height: number
    u_height_adjust: number
    u_sampler: number
}

export type DrawGroundAttributes = 'a_coords' | 'a_normal' | 'a_texture_mapping'

const drawImageProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: texturedImageVertexShaderPixelPerfect,
    fragmentShaderSource: textureFragmentShader,
    uniforms: {
        'u_texture': { type: 'INT' },
        'u_game_point': { type: 'FLOAT' },
        'u_screen_offset': { type: 'FLOAT' },
        'u_image_offset': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_source_coordinate': { type: 'FLOAT' },
        'u_source_dimensions': { type: 'FLOAT' },
        'u_screen_dimensions': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_height': { type: 'FLOAT' },
    },
    attributes: {
        'a_position': {
            elementsPerVertex: 2,
            maxElements: 12
        },
        'a_texcoord': {
            elementsPerVertex: 2,
            maxElements: 12
        }
    }
}

export type DrawImageUniforms = {
    u_texture: number
    u_game_point: number[]
    u_screen_offset: number[]
    u_image_offset: number[]
    u_scale: number
    u_source_coordinate: number[]
    u_source_dimensions: number[]
    u_screen_dimensions: number[]
    u_height_adjust: number
    u_height: number
}

export type DrawImageAttributes = 'a_position' | 'a_texcoord'

const drawShadowProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: texturedImageVertexShaderPixelPerfect,
    fragmentShaderSource: shadowFragmentShader,
    uniforms: {
        'u_texture': { type: 'INT' },
        'u_game_point': { type: 'FLOAT' },
        'u_screen_offset': { type: 'FLOAT' },
        'u_image_offset': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_source_coordinate': { type: 'FLOAT' },
        'u_source_dimensions': { type: 'FLOAT' },
        'u_screen_dimensions': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_height': { type: 'FLOAT' },
    },
    attributes: {
        'a_position': {
            elementsPerVertex: 2,
            maxElements: 12
        },
        'a_texcoord': {
            elementsPerVertex: 2,
            maxElements: 12
        }
    }
}

export type DrawShadowUniforms = {
    u_texture: number
    u_game_point: number[]
    u_screen_offset: number[]
    u_image_offset: number[]
    u_scale: number
    u_source_coordinate: number[]
    u_source_dimensions: number[]
    u_screen_dimensions: number[]
    u_height_adjust: number
    u_height: number
}

export type DrawShadowAttributes = 'a_position' | 'a_texcoord'

const fogOfWarProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: fogOfWarVertexShader,
    fragmentShaderSource: fogOfWarFragmentShader,
    uniforms: {
        'u_scale': { type: 'FLOAT' },
        'u_offset': { type: 'FLOAT' },
        'u_screen_height': { type: 'FLOAT' },
        'u_screen_width': { type: 'FLOAT' }
    },
    attributes: {
        'a_coordinates': {
            elementsPerVertex: 2,
            maxElements: 500
        },
        'a_intensity': {
            elementsPerVertex: 1,
            maxElements: 500
        }
    }
}

export type FogOfWarAttributes = 'a_coordinates' | 'a_intensity'

export type FogOfWarUniforms = {
    u_scale: number[]
    u_offset: number[]
    u_screen_height: number
    u_screen_width: number
}

export {
    drawGroundProgramDescriptor,
    drawImageProgramDescriptor,
    drawShadowProgramDescriptor,
    fogOfWarProgramDescriptor
}