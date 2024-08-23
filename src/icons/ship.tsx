import React, { useRef, useState, useEffect } from 'react'
import { Direction } from '../api/types'
import { Dimension, shipImageAtlas } from '../assets'
import { SHADOW_COLOR } from './icon'

// Types
type ShipIconProps = {
    scale?: number
    drawShadow?: boolean
    direction?: Direction
}

// State
const imageCache = new Map<HTMLImageElement, ImageBitmap>()

// React components
const ShipIcon = ({ scale = 1, drawShadow = false, direction = 'EAST' }: ShipIconProps) => {
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
                let imageBitmap = imageCache.get(image)

                if (!imageBitmap) {
                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                }

                setSourceImage(imageBitmap)
            } else {
                console.error('No image')
            }

            const dimension = shipImageAtlas.getSize(direction)

            if (dimension) {
                setDimension(dimension)
            } else {
                console.error('Failed to set dimension')
            }
        })()
    }, [direction])

    // Drawing
    useEffect(() => {
        (async () => {
            const canvas = canvasRef.current

            if (!canvas) {
                console.error('No canvas ref set')
                return
            }

            const context = canvas.getContext('2d')

            if (!context) {
                console.error('No context')
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

            context.clearRect(0, 0, dimension.width * scale, dimension.height * scale)

            if (sourceImage) {
                if (drawShadow) {
                    context.drawImage(
                        sourceImage,
                        shadow.sourceX, shadow.sourceY,
                        shadow.width, shadow.height,
                        (draw.offsetX - shadow.offsetX) * scale, (draw.offsetY - shadow.offsetY) * scale,
                        shadow.width * scale, shadow.height * scale)
                }

                context.globalCompositeOperation = 'source-in'
                context.fillStyle = SHADOW_COLOR
                context.fillRect((draw.offsetX - shadow.offsetX) * scale, (draw.offsetY - shadow.offsetY) * scale, shadow.width * scale, shadow.height * scale)
                context.globalCompositeOperation = 'source-over'

                context.drawImage(sourceImage, draw.sourceX, draw.sourceY, draw.width, draw.height, 0, 0, width, height)
            }
        })()

    }, [scale, sourceImage, drawShadow, dimension, direction])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
    />
}

export { ShipIcon }