import { Point } from "../api/types"
import { Dimension } from "../assets"
import { makeShader } from "../utils"

export const glUtilsDebug = {
    setBuffer: false,
    draw: false,
    initProgram: false
}

type UniformName = string
type AttributeName = string

type UniformDescriptor = {
    type: 'FLOAT' | 'INT'
}

type UniformInstance = {
    location?: WebGLUniformLocation
    type: 'FLOAT' | 'INT'
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

function setBuffer<Attribute extends string>(program: ProgramInstance, attributeName: Attribute, content: number[]): void {
    const attributeInstance = program.attributes.get(attributeName)

    if (attributeInstance === undefined) {
        console.error(`Attribute instance ${attributeName} is undefined`)

        return
    }

    if (attributeInstance.buffer) {
        program.gl.bindBuffer(program.gl.ARRAY_BUFFER, attributeInstance.buffer)
        program.gl.bufferData(program.gl.ARRAY_BUFFER, new Float32Array(content), program.gl.STATIC_DRAW)

        attributeInstance.numberElements = content.length

        glUtilsDebug.setBuffer && console.log(`Set buffer ${attributeName} to size ${content.length}`)
    } else {
        console.error(`Buffer is invalid for ${attributeName}`)
    }
}

function draw<Uniforms extends object>(
    program: ProgramInstance,
    uniforms: Uniforms,
    clearMode: 'NO_CLEAR_BEFORE_DRAW' | 'CLEAR_BEFORE_DRAW'
): void {
    if (program.program === undefined) {
        console.error(`Program is undefined`)

        return
    }

    program.gl.useProgram(program.program)

    program.gl.enable(program.gl.BLEND)
    program.gl.blendFunc(program.gl.SRC_ALPHA, program.gl.ONE_MINUS_SRC_ALPHA)

    // Set uniforms
    for (const [uniformName, value] of Object.entries(uniforms)) {
        const uniformInstance = program.uniforms.get(uniformName)

        if (uniformInstance === undefined) {
            console.error(`Uniform ${uniformName} is undefined`)

            continue
        }

        if (uniformInstance.type === 'FLOAT') {
            if (typeof value === 'number') {
                program.gl.uniform1f(uniformInstance.location ?? null, value)
            } else if (value.length === 2) {
                program.gl.uniform2fv(uniformInstance.location ?? null, value)
            } else if (value.length === 3) {
                program.gl.uniform3fv(uniformInstance.location ?? null, value)
            }
        } else {
            if (typeof value === 'number') {
                program.gl.uniform1i(uniformInstance.location ?? null, value)
            } else if (value.length === 2) {
                program.gl.uniform2iv(uniformInstance.location ?? null, value)
            } else if (value.length === 3) {
                program.gl.uniform3iv(uniformInstance.location ?? null, value)
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

        program.gl.bindBuffer(program.gl.ARRAY_BUFFER, attributeInstance.buffer ?? null)
        program.gl.vertexAttribPointer(attributeInstance.location, attributeInstance.elementsPerVertex, program.gl.FLOAT, false, 0, 0)
        program.gl.enableVertexAttribArray(attributeInstance.location)

        const candidateLength = (attributeInstance?.numberElements ?? 0) / attributeInstance.elementsPerVertex

        if (length === 0) {
            length = candidateLength
        } else if (length !== 0 && length !== candidateLength) {
            console.error(`Mismatch in length ${attributeName}`)
        }
    }

    if (clearMode === 'CLEAR_BEFORE_DRAW') {
        program.gl.clearColor(0.0, 0.0, 0.0, 1.0)
        program.gl.clear(program.gl.COLOR_BUFFER_BIT)
    }

    // Draw the triangles: mode, offset (nr vertices), count (nr vertices)
    program.gl.drawArrays(program.gl.TRIANGLES, 0, length)
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

            glUtilsDebug.initProgram && console.log(`Set attribute instance ${attributeName}`)
        }
    }

    return programInstance
}

function calcTranslation(prevScale: number, newScale: number, prevTranslate: Point, dimension: Dimension) {
    const centerGamePoint = findCenterGamePoint(dimension, prevScale, prevTranslate)

    const newTranslate = {
        x: dimension.width / 2 - centerGamePoint.x * newScale,
        y: dimension.height / 2 - dimension.height + centerGamePoint.y * newScale
    }

    return newTranslate
}

function findCenterGamePoint(dimension: Dimension, scale: number, translate: Point) {
    return {
        x: (dimension.width / 2 - translate.x) / scale,
        y: (dimension.height / 2 + translate.y) / (scale)
    }
}

export {
    calcTranslation,
    findCenterGamePoint,
    initProgram,
    setBuffer,
    draw
}