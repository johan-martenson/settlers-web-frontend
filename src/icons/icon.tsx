import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnyBuilding, Direction, FlagType, Material, Nation, PlayerColor, WorkerType } from '../api/types'
import { flagImageAtlasHandler, houses, materialImageAtlasHandler, uiElementsImageAtlasHandler } from '../assets/image_atlas_handlers'
import './icon.css'
import { flagAnimations, workers } from '../assets/animations'
import { DrawingInformation } from '../assets/types'
import { useAnimatedSprite } from './utils'

// Types
export type UiIconType = 'DESTROY_BUILDING'
    | 'SCISSORS'
    | 'INFORMATION'
    | 'GEOLOGIST'
    | 'ATTACK'
    | 'BROKEN_FLAG'
    | 'FILM_CAMERA'
    | 'COIN_CROSSED_OUT'
    | 'ANGEL_WITH_QUESTION_MARK'
    | 'MAGNIFYING_GLASS'
    | 'PULL_DOWN_FLAG'
    | 'COIN'
    | 'SHRINK_SCREEN_AND_MAGNIFYING_GLASS'
    | 'ENLARGE_SCREEN_AND_MAGNIFYING_GLASS'
    | 'ONE_YELLOW_SHIELD'
    | 'FIVE_YELLOW_SHIELDS'
    | 'LIGHT_ROAD_IN_NATURE'
    | 'ROMAN_GENERAL'
    | 'ROMAN_PRIVATE'
    | 'GO_TO_POINT'
    | 'SEND_OUT_ARROWS'
    | 'ROAD_AND_FLAGS'
    | 'PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES'
    | 'PLUS_AVAILABLE_BUILDINGS'
    | 'RED_SMALL_AVAILABLE_BUILDING'
    | 'RED_MEDIUM_AVAILABLE_BUILDING'
    | 'RED_LARGE_AVAILABLE_BUILDING'
    | 'SHOVEL'
    | 'GEARS'
    | 'GEARS_CROSSED_OVER'
    | 'FORTRESS_WITH_PLUS'
    | 'FORTRESS_WITH_MINUS'
    | 'SMALLER_FORTRESS_WITH_PLUS'
    | 'SMALLER_FORTRESS_WITH_MINUS'
    | 'SMALLEST_FORTRESS_WITH_PLUS'
    | 'SMALLEST_FORTRESS_WITH_MINUS'
    | 'WEAK_SOLDIER_WITH_MINUS'
    | 'STRONG_SOLDIER_WITH_PLUS'
    | 'ONE_SHIELD_WITH_MINUS'
    | 'TWO_SHIELDS_WITH_PLUS'
    | 'MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_MINUS'
    | 'MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_PLUS'
    | 'MILITARY_BUILDING_WITH_SWORDS_AND_MINUS'
    | 'MILITARY_BUILDING_WITH_SWORDS_AND_PLUS'
    | 'MAP_WITH_QUESTION_MARK'
    | 'BUILDINGS_WITH_QUESTION_MARK'
    | 'WORKERS_WITH_QUESTION_MARK'
    | 'GOODS_WITH_QUESTION_MARK'
    | 'GENERAL_WITH_QUESTION_MARK'
    | 'COINS_WITH_QUESTION_MARK'
    | 'GEARS_WITH_QUESTION_MARK'
    | 'WREATH_ON_MAP'
    | 'GOODS_ON_MAP'
    | 'OWNED_BUILDINGS_ON_MAP'
    | 'WORKERS_GOODS_AND_QUESTION_MARK'
    | 'TRANSPORT_PRIORITY'
    | 'TOOLS_WITH_QUESTION_MARK'
    | 'HOUSE_WITH_GEARS_AND_PROGRESS_BAR'
    | 'WEAPONS_AND_SOLDIER'
    | 'SHIP_AND_ANCHOR'
    | 'HOUSE_ON_MAP'
    | 'WEAPONS_MOVING'
    | 'FOOD'
    | 'SAW_AND_PLUS'
    | 'SAW_AND_MINUS'
    | 'AXE_AND_MINUS'
    | 'AXE_AND_PLUS'
    | 'SHOVEL_AND_MINUS'
    | 'SHOVEL_AND_PLUS'
    | 'LINE_AND_HOOK_AND_MINUS'
    | 'LINE_AND_HOOK_AND_PLUS'
    | 'BOW_AND_MINUS'
    | 'BOW_AND_PLUS'
    | 'CLEAVER_AND_MINUS'
    | 'CLEAVER_AND_PLUS'
    | 'ROLLING_PIN_AND_MINUS'
    | 'ROLLING_PIN_AND_PLUS'
    | 'CRUCIBLE_AND_MINUS'
    | 'CRUCIBLE_AND_PLUS'
    | 'TONGS_AND_MINUS'
    | 'TONGS_AND_PLUS'
    | 'SCYTHE_AND_MINUS'
    | 'SCYTHE_AND_PLUS'
    | 'PICK_AXE_AND_MINUS'
    | 'PICK_AXE_AND_PLUS'
    | 'PLUS'
    | 'MINUS'
    | 'TWO_SWORDS'
    | 'UP_ARROW'
    | 'DOWN_ARROW'
    | 'ARROW_TO_TOP'
    | 'ARROW_TO_BOTTOM'
    | 'TRASHCAN'
    | 'SPRAY_CAN'
    | 'RIGHT_ARROW'
    | 'GLOBE_WITH_MAGNIFYING_GLASS'
    | 'OWNED_AREA_ON_MAP'
    | 'OWNED_ROADS_ON_MAP'
    | 'GRAPH_OF_OWNED_AREA_ON_MAP'
    | 'PLAY'
    | 'PAUSE'
    | 'FORWARD'
    | 'PLUS_RETURN_TO_HEADQUARTERS'

type WorkerIconProps = {
    worker: WorkerType
    animate?: boolean
    nation: Nation
    direction?: Direction
    scale?: number
    color?: PlayerColor
    drawShadow?: boolean
}

type InventoryIconProps = {
    nation: Nation
    material: Material
    scale?: number
    inline?: boolean
    missing?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

type HouseProps = {
    nation: Nation
    houseType: AnyBuilding
    scale?: number
    drawShadow?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

type UiIconProps = {
    type: UiIconType
    scale?: number

    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onClick?: () => void
}

type FlagIconProps = {
    type: FlagType
    animate?: boolean
    nation: Nation
    scale?: number
    color?: PlayerColor
    drawShadow?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

// Constants
export const SHADOW_COLOR = '#333333'

// State

// Functions
function drawImageAndShadow(image: ImageBitmap, drawInfo: DrawingInformation, shadowInfo: DrawingInformation, drawShadow: boolean, canvas: HTMLCanvasElement, scale: number): void {
    const context = canvas.getContext('2d')

    if (!context) {
        console.error('No 2d drawing context')
        return
    }

    const dpr = window.devicePixelRatio || 1

    if (drawShadow) {

        // Calculate distance to center point in reference space
        // E.g., left is distance from edge of image to reference point. A higher value means the image is further to the left
        const aRight = drawInfo.width - drawInfo.offsetX
        const aBottom = drawInfo.height - drawInfo.offsetY

        const bRight = shadowInfo.width - shadowInfo.offsetX
        const bBottom = shadowInfo.height - shadowInfo.offsetY

        // Calculate distances for the combined image, still in reference space
        const offsetX = Math.max(drawInfo.offsetX, shadowInfo.offsetX)
        const offsetY = Math.max(drawInfo.offsetY, shadowInfo.offsetY)
        const right = Math.max(aRight, bRight)
        const bottom = Math.max(aBottom, bBottom)

        const logicalWidth = (offsetX + right) * scale
        const logicalHeight = (offsetY + bottom) * scale

        const physicalWidth = Math.ceil(logicalWidth * dpr)
        const physicalHeight = Math.ceil(logicalHeight * dpr)

        if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
            canvas.width = physicalWidth
            canvas.height = physicalHeight


            canvas.style.width = `${logicalWidth}px`
            canvas.style.height = `${logicalHeight}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        // Clear the area
        context.clearRect(0, 0, logicalWidth, logicalHeight)

        // Save the context before changing composite style
        context.save()

        // Draw the shadow
        context.drawImage(
            image,
            shadowInfo.sourceX, shadowInfo.sourceY,
            shadowInfo.width, shadowInfo.height,
            (offsetX - shadowInfo.offsetX) * scale, (offsetY - shadowInfo.offsetY) * scale,
            shadowInfo.width * scale, shadowInfo.height * scale
        )

        context.globalCompositeOperation = 'source-in'
        context.fillStyle = SHADOW_COLOR
        context.fillRect(
            (offsetX - shadowInfo.offsetX) * scale, (offsetY - shadowInfo.offsetY) * scale,
            shadowInfo.width * scale,
            shadowInfo.height * scale
        )

        context.restore()

        // Draw the foreground image
        context.drawImage(
            image,
            drawInfo.sourceX, drawInfo.sourceY,
            drawInfo.width, drawInfo.height,
            (offsetX - drawInfo.offsetX) * scale, (offsetY - drawInfo.offsetY) * scale,
            drawInfo.width * scale, drawInfo.height * scale)
    } else {
        const logicalWidth = drawInfo.width * scale
        const logicalHeight = drawInfo.height * scale

        const physicalWidth = Math.ceil(logicalWidth * dpr)
        const physicalHeight = Math.ceil(logicalHeight * dpr)

        if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
            canvas.width = physicalWidth
            canvas.height = physicalHeight

            canvas.style.width = `${logicalWidth}px`
            canvas.style.height = `${logicalHeight}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        context.clearRect(0, 0, logicalWidth, logicalHeight)

        // Draw the foreground image only
        context.drawImage(
            image,
            drawInfo.sourceX, drawInfo.sourceY,
            drawInfo.width, drawInfo.height,
            0, 0,
            drawInfo.width * scale, drawInfo.height * scale)
    }
}

// React components
const WorkerIcon = ({
    worker,
    nation,
    animate = false,
    direction = 'WEST',
    scale = 1,
    color = 'BLUE',
    drawShadow = false
}: WorkerIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useAnimatedSprite({
        animate,
        fps: 10,
        deps: [worker, nation, direction, color, scale, drawShadow],
        loader: async () => {
            const handler = workers.get(worker)
            if (!handler) {
                throw new Error(`No handler for ${worker}`)
            }

            await handler.load()
            const image = handler.getImageAtlasHandler().getSourceImage()
            if (!image) {
                throw new Error('No image')
            }

            return { image }
        },
        getFrame: (bitmap, frameIndex) => {
            const canvas = canvasRef.current
            if (!canvas) {
                return
            }

            const handler = workers.get(worker)
            const drawArray = handler?.getAnimationFrame(
                nation,
                direction,
                color,
                0,
                frameIndex
            )

            if (!drawArray) {
                return
            }

            const [drawInfo, shadowInfo] = drawArray

            drawImageAndShadow(
                bitmap,
                drawInfo,
                shadowInfo,
                drawShadow,
                canvas,
                scale
            )
        }
    })

    return <canvas ref={canvasRef} />
}

const HouseIcon = ({ nation, houseType, scale = 1, drawShadow = false, onMouseEnter, onMouseLeave }: HouseProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useAnimatedSprite({
        animate: false,
        fps: 10,
        deps: [nation, houseType, scale, drawShadow],
        loader: async () => {
            await houses.load()
            const image = houses.getSourceImage()
            if (!image) {
                throw new Error('No image')
            }

            return { image }
        },
        getFrame: (bitmap, frameIndex) => {
            const canvas = canvasRef.current
            if (!canvas) {
                return
            }

            const drawArray = houses.getDrawingInformationForHouseReady(nation, houseType)

            if (!drawArray) {
                return
            }

            const [drawInfo, shadowInfo] = drawArray

            drawImageAndShadow(
                bitmap,
                drawInfo,
                shadowInfo,
                drawShadow,
                canvas,
                scale
            )
        }
    })

    return <canvas ref={canvasRef} />
}

const InventoryIcon = ({ nation, material, scale = 1, inline = false, missing = false, onMouseEnter, onMouseLeave }: InventoryIconProps) => {

    // State
    const [image, setImage] = useState<HTMLImageElement>()

    // Effects
    // Effect: scale the image when it's loaded or when the scale is changed
    useEffect(() => {
        if (image) {
            image.width = image.naturalWidth * scale
            image.height = image.naturalHeight * scale
        }
    }, [scale, image])

    const url = materialImageAtlasHandler.getInventoryIconUrl(nation, material)

    const displayStyle = inline ? 'inline' : 'block'
    const transparency = missing ? '0.5' : '1.0'

    return (
        <div
            className='inventory-icon'
            style={{ display: displayStyle, opacity: transparency, width: (image?.naturalWidth ?? 1) * scale, height: (image?.naturalHeight ?? 1) * scale }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <img
                src={url}
                draggable={false}
                onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => setImage(event.target as HTMLImageElement)}
            />
        </div>
    )
}

const UiIcon = ({ type, scale = 1, onMouseEnter, onMouseLeave, onClick }: UiIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useAnimatedSprite({
        animate: false,
        fps: 10,
        deps: [type, scale],
        loader: async () => {
            await uiElementsImageAtlasHandler.load()
            const image = uiElementsImageAtlasHandler.getImage()
            if (!image) {
                throw new Error('No Ui image')
            }

            return { image }
        },
        getFrame: (bitmap, frameIndex) => {
            const canvas = canvasRef.current
            if (!canvas) {
                return
            }

            const drawInfo = uiElementsImageAtlasHandler.getUiElement(type)
            if (!drawInfo) {
                console.error('UiIcon: Failed to get draw info')
                return
            }

            drawImageAndShadow(
                bitmap,
                drawInfo,
                drawInfo,
                false,
                canvas,
                scale
            )
        }
    })

    return <canvas
        ref={canvasRef} />
}

const FlagIcon = ({
    type,
    nation,
    animate = false,
    scale = 1,
    color = 'BLUE',
    drawShadow = false,
    onMouseEnter,
    onMouseLeave
}: FlagIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useAnimatedSprite({
        animate,
        fps: 10,
        deps: [type, nation, color, scale, drawShadow],
        loader: async () => {
            await flagAnimations.load()

            const image = flagImageAtlasHandler.getImage()
            if (!image) {
                throw new Error('FlagIcon: No image available')
            }

            return { image }
        },
        getFrame: (bitmap, frameIndex) => {

            const canvas = canvasRef.current
            if (!canvas) return

            const drawArray = flagAnimations.getAnimationFrame(
                nation,
                color,
                type,
                frameIndex,
                0
            )

            if (!drawArray) return

            const [drawInfo, shadowInfo] = drawArray

            drawImageAndShadow(
                bitmap,
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
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    )
}

export {
    WorkerIcon,
    HouseIcon,
    InventoryIcon,
    FlagIcon,
    UiIcon
}