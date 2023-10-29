import React, { Component, MouseEventHandler, ReactNode, useState } from 'react'
import { texturedImageVertexShaderPixelPerfectStraightCoordinates, textureFragmentShader } from './shaders'
import { AnyBuilding, Direction, MaterialAllUpperCase, Nation, WorkerType } from './api/types'
import { houses, materialImageAtlasHandler, workers } from './assets'
import { Dimension, WorkerAnimation, makeShader, resizeCanvasToDisplaySize } from './utils'
import { DEFAULT_SCALE } from './game_render'
import './icon.css'

interface WorkerIconProps {
    worker: WorkerType
    animate: boolean
    nationality: Nation
    direction?: Direction
    scale?: number
}

interface WorkerIconState {
    animationIndex: number
    animationHandler: WorkerAnimation | undefined
    size: Dimension
    direction: Direction
    scale: number
}

class WorkerIcon extends Component<WorkerIconProps, WorkerIconState> {

    private workerIconCanvasRef = React.createRef<HTMLCanvasElement>()
    private drawImageProgram: WebGLProgram | null
    private drawImagePositionLocation: number
    private drawImageTexcoordLocation: number
    private drawImagePositionBuffer: WebGLBuffer | null
    private drawImageTexCoordBuffer: WebGLBuffer | null
    private gl: WebGL2RenderingContext | undefined

    constructor(props: WorkerIconProps) {
        super(props)

        const direction = (props.direction) ? props.direction : 'EAST'
        const animationHandler = workers.get(props.worker)
        let size = animationHandler?.getSize(props.nationality, direction)

        const scale = (props.scale) ? props.scale : 1

        console.log(size)

        if (!size) {
            console.error("No size for worker icon!")

            size = { width: 0, height: 0 }
        }

        console.log(size)

        this.state = {
            animationIndex: 0,
            animationHandler: workers.get(props.worker),
            direction,
            size,
            scale
        }
    }

    async componentDidMount(): Promise<void> {

        // Wait for the image data to load
        await this.state.animationHandler?.load()

        // Get the size of the image
        let size = this.state.animationHandler?.getSize(this.props.nationality, this.state.direction)

        console.log(size)

        if (!size) {
            console.error("No size for worker icon!")

            size = { width: 0, height: 0 }
        }

        this.setState({ size })

        console.log(size)

        // Set up webgl and prepare for drawing
        if (!this.workerIconCanvasRef?.current) {
            console.error("No canvas ref!")

            return
        }

        const canvas = this.workerIconCanvasRef.current
        const gl = this.workerIconCanvasRef.current.getContext("webgl2", { alpha: true })

        if (!gl) {
            console.error("No gl set!")

            return
        }

        this.gl = gl

        this.state.animationHandler?.makeTexture(gl)

        const drawImageVertexShader = makeShader(gl, texturedImageVertexShaderPixelPerfectStraightCoordinates, gl.VERTEX_SHADER)
        const drawImageFragmentShader = makeShader(gl, textureFragmentShader, gl.FRAGMENT_SHADER)


        if (!drawImageFragmentShader || !drawImageVertexShader) {
            console.error("Failed to load shaders!")

            return
        }

        this.drawImageProgram = gl.createProgram()

        if (!this.drawImageProgram) {
            console.error("No draw image program!")

            return
        }

        gl.attachShader(this.drawImageProgram, drawImageVertexShader)
        gl.attachShader(this.drawImageProgram, drawImageFragmentShader)
        gl.linkProgram(this.drawImageProgram)
        gl.useProgram(this.drawImageProgram)
        gl.viewport(0, 0, canvas.width, canvas.height)

        this.drawImagePositionLocation = gl.getAttribLocation(this.drawImageProgram, "a_position")
        this.drawImageTexcoordLocation = gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

        // Create the position buffer
        this.drawImagePositionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.drawImagePositionBuffer)

        const positions = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ]

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

        // Turn on the attribute
        gl.enableVertexAttribArray(this.drawImagePositionLocation)

        // Configure how the attribute gets data
        gl.vertexAttribPointer(this.drawImagePositionLocation, 2, gl.FLOAT, false, 0, 0)

        // Handle the tex coord attribute
        this.drawImageTexCoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)

        const texCoords = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1
        ]

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)

        // Turn on the attribute
        gl.enableVertexAttribArray(this.drawImageTexcoordLocation)

        // Configure how the attribute gets data
        gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, gl.FLOAT, false, 0, 0)

        this.renderIcon()
    }

    renderIcon(): void {
        if (!this.workerIconCanvasRef?.current) {
            console.error("The canvas references are not set properly")

            return
        }

        /* Get the rendering context for the overlay canvas */
        const ctx = this.workerIconCanvasRef.current.getContext("webgl2")

        /* Ensure that the canvas rendering context is valid */
        if (!ctx) {
            console.error("No or invalid context")

            return
        }

        // Set the resolution
        resizeCanvasToDisplaySize(this.workerIconCanvasRef.current)

        const width = this.workerIconCanvasRef.current.width
        const height = this.workerIconCanvasRef.current.height


        this.gl?.viewport(0, 0, width, height)

        if (this.gl && this.drawImageProgram) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)
            this.gl.clearColor(0, 0, 0, 0)
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)


            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            if (this.drawImagePositionBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImagePositionLocation)
            }

            if (this.drawImageTexCoordBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImageTexcoordLocation)
            }

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

            // Draw normal objects
            const drawArray = this.state.animationHandler?.getAnimationFrame(this.state.direction, 0, this.state.animationIndex)

            if (!drawArray) {
                console.error("No draw array!")

                return
            }

            const draw = drawArray[0]

            if (!draw.texture) {
                console.error("No texture!")

                return
            }

            const scale = DEFAULT_SCALE * ((this.props.scale) ? this.props.scale : 1)

            this.gl.activeTexture(this.gl.TEXTURE0)
            this.gl.bindTexture(this.gl.TEXTURE_2D, draw.texture)

            // Tell the fragment shader what texture to use
            this.gl.uniform1i(drawImageTextureLocation, 0)

            // Tell the vertex shader how to draw
            this.gl.uniform1f(drawImageScaleLocation, scale)
            this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)

            // Tell the vertex shader what parts of the source image to draw
            this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.sourceX, draw.sourceY)
            this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.width, draw.height)

            // Draw the quad (2 triangles = 6 vertices)
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
        }

        if (this.props.animate) {
            this.setState({ animationIndex: this.state.animationIndex + 1 })

            setTimeout(() => this.renderIcon(), 80)
        }
    }

    render(): ReactNode {
        return (
            <div>
                <canvas className="worker-icon-canvas"
                    ref={this.workerIconCanvasRef}
                    style={{ width: this.state.size.width * this.state.scale, height: this.state.size.height * this.state.scale }} />
            </div>
        )
    }
}

interface HouseProps {
    nation: Nation
    houseType: AnyBuilding
    scale?: number
}

const HouseIcon = (houseProps: HouseProps) => {
    const url = houses.getUrlForIndividualBuilding(houseProps.nation, houseProps.houseType)
    const scale = (houseProps.scale !== undefined) ? houseProps.scale : 1.0

    return (<div className="house-icon">
        <img
            src={url}
            onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = event.target as HTMLImageElement

                img.width = img.naturalWidth * scale
                img.height = img.naturalHeight * scale
            }}
        />
    </div>)
}

interface InventoryIconProps {
    nation: Nation
    material: MaterialAllUpperCase
    label?: string
    scale?: number
}

const InventoryIcon = (inventoryIconProps: InventoryIconProps) => {
    const url = materialImageAtlasHandler.getInventoryIconUrl(inventoryIconProps.nation, inventoryIconProps.material)
    const material = inventoryIconProps.material
    const scale = (inventoryIconProps?.scale !== undefined) ? inventoryIconProps.scale : 1.0

    const [showLabel, setShowLabel] = useState(false)
    const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 })

    return (<span className="inventory-icon"
        onMouseEnter={(event: React.MouseEvent<HTMLDivElement>) => {
            setShowLabel(true)

            setLabelPosition({ x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop - 20 })
        }}
        onMouseLeave={() => setShowLabel(false)}
    >
        <img
            src={url}
            onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = event.target as HTMLImageElement

                img.width = img.naturalWidth * scale
                img.height = img.naturalHeight * scale
            }}
        />

        {inventoryIconProps.label && showLabel &&
            <div
                className="inventory-icon-tooltip"
                style={{
                    left: labelPosition.x,
                    top: labelPosition.y
                }}
            >
                {inventoryIconProps.label}
            </div>
        }
    </span>)
}

export {
    WorkerIcon,
    HouseIcon,
    InventoryIcon
}