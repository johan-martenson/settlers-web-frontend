import React, { useRef } from 'react'
import { useAnimatedSprite } from './utils'
import { drawImageAndShadow } from './icon'
import { shipImageAtlas } from '../../assets/image_atlas_handlers'
import { Direction } from '../../api/types'

// Types
type ShipIconProps = {
    scale?: number
    drawShadow?: boolean
    direction?: Direction
}

// React components
const ShipIcon = ({
    scale = 1,
    drawShadow = false,
    direction = 'EAST'
}: ShipIconProps) => {

    // References
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useAnimatedSprite({
        animate: false,
        fps: 10,
        deps: [direction, scale, drawShadow],

        loader: async () => {
            await shipImageAtlas.load()

            const image = shipImageAtlas.getSourceImage()

            if (!image) {
                throw new Error('ShipIcon: No source image available')
            }

            return { image }
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getFrame: (image, frameIndex) => {
            const canvas = canvasRef.current

            if (!canvas) {
                return
            }

            const drawArray = shipImageAtlas.getDrawingInformationForShip(direction)

            if (!drawArray) {
                console.error(`ShipIcon: No drawing information for direction ${direction}`)
                return
            }

            const [drawInfo, shadowInfo] = drawArray

            drawImageAndShadow(
                image,
                drawInfo,
                shadowInfo,
                drawShadow,
                canvas,
                scale
            )
        }
    })

    return (
        <canvas
            ref={canvasRef}
            role='img'
            aria-label={`Ship facing ${direction.toLowerCase()}`}
        />
    )
}

export { ShipIcon }