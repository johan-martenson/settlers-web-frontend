import { Point } from "../api/types"
import { Dimension } from "../assets/types"

// Types
type UniformName = string
type AttributeName = string

type UniformDescriptor = {
    type: 'FLOAT' | 'INT' | 'MATRIX'
}

type UniformInstance = {
    location?: WebGLUniformLocation
    type: 'FLOAT' | 'INT' | 'MATRIX'
}

type AttributeDescriptor = {
    maxElements: number
    elementsPerVertex: number
}

type AttributeInstance = {
    location?: number
    buffer?: WebGLBuffer
    maxElements: number
    elementsPerVertex: number
    numberElements?: number
}

export type ProgramDescriptor = {
    vertexShaderSource: string
    fragmentShaderSource: string

    program?: WebGLProgram

    uniforms: { [key in UniformName]: UniformDescriptor }
    attributes: { [key in AttributeName]: AttributeDescriptor }
}

export type ProgramInstance = {
    program?: WebGLProgram
    uniforms: Map<UniformName, UniformInstance>
    attributes: Map<AttributeName, AttributeInstance>
    gl: WebGL2RenderingContext
}

// Constants

// Sample code
const SAMPLE_MAX_ELEMENTS = 20

const sampleVertexShader = "..."
const sampleFragmentShader = "..."

// eslint-disable-next-line
const sampleProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: sampleVertexShader,
    fragmentShaderSource: sampleFragmentShader,
    uniforms: {
        'u_light_vector': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_offset': { type: 'FLOAT' },
        'u_screen_width': { type: 'FLOAT' },
        'u_screen_height': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_sampler': { type: 'INT' },
        'u_matrix': { type: 'MATRIX' }
    },
    attributes: {
        'a_coords': {
            maxElements: SAMPLE_MAX_ELEMENTS,
            elementsPerVertex: 3
        },
        'a_normal': {
            maxElements: SAMPLE_MAX_ELEMENTS,
            elementsPerVertex: 3
        },
        'a_texture_mapping': {
            maxElements: SAMPLE_MAX_ELEMENTS,
            elementsPerVertex: 2
        }
    }
}

// eslint-disable-next-line
type SampleUniforms = {
    u_light_vector: number[]
    u_scale: number[]
    u_offset: number[]
    u_screen_width: number
    u_screen_height: number
    u_height_adjust: number
    u_sampler: number
    u_matrix: Float32Array
}

// eslint-disable-next-line
type SampleAttributes = 'a_coords' | 'a_normal' | 'a_texture_mapping'

// State

// Configuration
export const glUtilsDebug = {
    setBuffer: false,
    draw: false,
    initProgram: false
}

// Functions
function setBuffer<Attribute extends string>(program: ProgramInstance, attributeName: Attribute, content: number[]): void {
    const attributeInstance = program.attributes.get(attributeName)

    if (attributeInstance === undefined) {
        console.error(`Attribute instance ${attributeName} is undefined`)

        return
    }

    if (attributeInstance.buffer) {
        const { gl } = program

        gl.bindBuffer(gl.ARRAY_BUFFER, attributeInstance.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(content), gl.STATIC_DRAW)

        attributeInstance.numberElements = content.length

        if (glUtilsDebug.setBuffer) {
            console.log(`Set buffer ${attributeName} to size ${content.length}`)
        }
    } else {
        console.error(`Buffer is invalid for ${attributeName}`)
    }
}

function draw<Uniforms extends object>(
    program: ProgramInstance,
    uniforms: Uniforms,
    clearMode: 'NO_CLEAR_BEFORE_DRAW' | 'CLEAR_BEFORE_DRAW'
): void {
    const { gl } = program

    if (program.program === undefined) {
        console.error(`Program is undefined`)

        return
    }

    gl.useProgram(program.program)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Set uniforms
    for (const [uniformName, value] of Object.entries(uniforms)) {
        const uniformInstance = program.uniforms.get(uniformName)

        if (uniformInstance === undefined) {
            console.error(`Uniform ${uniformName} is undefined`)

            continue
        }

        const { location, type } = uniformInstance

        if (type === 'FLOAT') {
            if (typeof value === 'number') {
                gl.uniform1f(location ?? null, value)
            } else if (value.length === 2) {
                gl.uniform2fv(location ?? null, value)
            } else if (value.length === 3) {
                gl.uniform3fv(location ?? null, value)
            }
        } else if (type === 'INT') {
            if (typeof value === 'number') {
                gl.uniform1i(location ?? null, value)
            } else if (value.length === 2) {
                gl.uniform2iv(location ?? null, value)
            } else if (value.length === 3) {
                gl.uniform3iv(location ?? null, value)
            }
        } else if (type === 'MATRIX') {
            if (value.length === 4) {
                gl.uniformMatrix2fv(location ?? null, false, value)
            } else if (value.length === 9) {
                gl.uniformMatrix3fv(location ?? null, false, value)
            } else if (value.length === 16) {
                gl.uniformMatrix4fv(location ?? null, false, value)
            }
        }
    }

    // Set buffers
    let length = 0

    for (const [attributeName, attributeInstance] of Array.from(program.attributes.entries())) {
        if (attributeInstance.buffer === undefined || attributeInstance.location === undefined || attributeInstance.buffer === undefined) {
            console.error(`Attribute ${attributeName} is partly undefined`)

            continue
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, attributeInstance.buffer ?? null)
        gl.vertexAttribPointer(attributeInstance.location, attributeInstance.elementsPerVertex, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attributeInstance.location)

        const candidateLength = (attributeInstance?.numberElements ?? 0) / attributeInstance.elementsPerVertex

        if (length === 0) {
            length = candidateLength
        } else if (length !== 0 && length !== candidateLength) {
            console.error(`Mismatch in length ${attributeName}`)
        }
    }

    if (clearMode === 'CLEAR_BEFORE_DRAW') {
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
    }

    // Draw the triangles: mode, offset (nr vertices), count (nr vertices)
    gl.drawArrays(gl.TRIANGLES, 0, length)
}

function initProgram(programDescriptor: ProgramDescriptor, gl: WebGL2RenderingContext): ProgramInstance {
    const compiledVertexShader = makeShader(gl, programDescriptor.vertexShaderSource, gl.VERTEX_SHADER)
    const compiledFragmentShader = makeShader(gl, programDescriptor.fragmentShaderSource, gl.FRAGMENT_SHADER)

    const programInstance: ProgramInstance = {
        gl,
        uniforms: new Map(),
        attributes: new Map()
    }

    programInstance.program = gl.createProgram() ?? undefined

    if (programInstance.program && compiledVertexShader && compiledFragmentShader) {

        // Attach shaders
        gl.attachShader(programInstance.program, compiledVertexShader)
        gl.attachShader(programInstance.program, compiledFragmentShader)

        gl.linkProgram(programInstance.program)

        gl.detachShader(programInstance.program, compiledVertexShader)
        gl.detachShader(programInstance.program, compiledFragmentShader)

        gl.deleteShader(compiledVertexShader)
        gl.deleteShader(compiledFragmentShader)

        gl.useProgram(programInstance.program)

        // Fill in uniform locations
        for (const [uniformName, uniformDescriptor] of Object.entries(programDescriptor.uniforms)) {
            const uniformInstance: UniformInstance = {
                type: uniformDescriptor.type,
                location: gl.getUniformLocation(programInstance.program, uniformName) ?? undefined
            }

            programInstance.uniforms.set(uniformName, uniformInstance)
        }

        // Find attribute locations
        for (const [attributeName, attributeDescriptor] of Object.entries(programDescriptor.attributes)) {
            const buffer = gl.createBuffer() ?? undefined

            if (buffer === undefined) {
                console.error(`Failed to create buffer for ${attributeName}`)

                continue
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * attributeDescriptor.maxElements, gl.STATIC_DRAW)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW)

            programInstance.attributes.set(attributeName, {
                elementsPerVertex: attributeDescriptor.elementsPerVertex,
                maxElements: attributeDescriptor.maxElements,
                location: gl.getAttribLocation(programInstance.program, attributeName) ?? undefined,
                buffer
            })

            if (glUtilsDebug.initProgram) {
                console.log(`Set attribute instance for ${attributeName}`)
            }
        }
    }

    return programInstance
}

function calcTranslation(prevScale: number, newScale: number, prevTranslate: Point, dimension: Dimension): Point {
    const centerGamePoint = findCenterGamePoint(dimension, prevScale, prevTranslate)

    return {
        x: dimension.width / 2 - centerGamePoint.x * newScale,
        y: dimension.height / 2 - dimension.height + centerGamePoint.y * newScale
    }
}

function findCenterGamePoint(dimension: Dimension, scale: number, translate: Point): Point {
    return {
        x: (dimension.width / 2 - translate.x) / scale,
        y: (dimension.height / 2 + translate.y) / (scale)
    }
}

function makeShader(gl: WebGL2RenderingContext, shaderSource: string, shaderType: number): WebGLShader | null {
    const compiledShader = gl.createShader(shaderType)

    if (compiledShader) {
        gl.shaderSource(compiledShader, shaderSource)
        gl.compileShader(compiledShader)

        const shaderCompileLog = gl.getShaderInfoLog(compiledShader)

        if (shaderCompileLog === '') {
            console.info('Shader compiled correctly')
        } else {
            console.error(shaderCompileLog)
        }
    } else {
        console.error('Failed to get the shader')
    }

    return compiledShader
}

function makeTextureFromImage(gl: WebGLRenderingContext, image: HTMLImageElement, flipYAxis: 'FLIP_Y' | 'NO_FLIP_Y' = 'NO_FLIP_Y'): WebGLTexture | null {
    const texture = gl.createTexture()
    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipYAxis === 'FLIP_Y')

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    gl.generateMipmap(gl.TEXTURE_2D)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    return texture
}

export {
    calcTranslation,
    findCenterGamePoint,
    initProgram,
    setBuffer,
    draw,
    makeTextureFromImage
}