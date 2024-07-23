import React, { useRef, useState, useEffect } from "react"
import { Direction } from "../api/types"
import { Dimension, shipImageAtlas } from "../assets"
import { SHADOW_COLOR } from "./icon"

type ShipIconProps = {
    scale?: number
    drawShadow?: boolean
    direction?: Direction
}

const ShipIcon = ({ ...props }: ShipIconProps) => {
    const scale = props.scale ?? 1
    const drawShadow = props.drawShadow ?? false
    const direction = props.direction ?? 'EAST'

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    // Load image to draw from
    useEffect(() => {
        (async () => {
            await shipImageAtlas.load()

            // Read the source image data, convert it to a bitmap, and store it
            const image = shipImageAtlas.getSourceImage()

            if (image) {
                const imageBitmap = await createImageBitmap(image)

                setSourceImage(imageBitmap)
            } else {
                console.error("No image")
            }
        })().then(() => {
            const dimension = shipImageAtlas.getSize(direction)

            if (dimension) {
                setDimension(dimension)
            } else {
                console.error("Failed to set dimension")
            }
        })
    }, [])

    // Drawing
    useEffect(() => {
        (async () => {
            const canvas = canvasRef.current

            if (!canvas) {
                console.error("No canvas ref set")

                return
            }

            const context = canvas.getContext('2d')

            if (!context) {
                console.error("No context")

                return
            }

            // Read the source image data
            const drawArray = shipImageAtlas.getDrawingInformationForShip(direction)

            if (!drawArray) {
                console.error(`No drawing information. Direction is ${direction}`)

                return
            }

            const draw = drawArray[0]
            const shadow = drawArray[1]

            const width = draw.width * scale
            const height = draw.height * scale

            // Clear the background
            context.clearRect(0, 0, dimension.width * scale, dimension.height * scale)

            // Write the image data
            if (sourceImage) {
                if (drawShadow) {
                    context.drawImage(
                        sourceImage,
                        shadow.sourceX, shadow.sourceY,
                        shadow.width, shadow.height,
                        (draw.offsetX - shadow.offsetX) * scale, (draw.offsetY - shadow.offsetY) * scale,
                        shadow.width * scale, shadow.height * scale)
                }

                context.globalCompositeOperation = "source-in"

                context.fillStyle = SHADOW_COLOR
                context.fillRect((draw.offsetX - shadow.offsetX) * scale, (draw.offsetY - shadow.offsetY) * scale, shadow.width * scale, shadow.height * scale)
                context.globalCompositeOperation = "source-over"

                context.drawImage(sourceImage, draw.sourceX, draw.sourceY, draw.width, draw.height, 0, 0, width, height)
            }
        })().then()

    }, [ scale, sourceImage, drawShadow])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
    />
}

export { ShipIcon }