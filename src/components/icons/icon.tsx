import React, { useRef, useState } from 'react'
import { useAnimatedSprite } from './utils'
import { AnyBuilding, Direction, FlagType, Material, Nation, PlayerColor, WorkerType } from '../../api/types'
import { DrawingInformation } from '../../assets/types'
import { FLAG_ANIMATIONS, WORKER_ANIMATIONS } from '../../assets/animations'
import { flagImageAtlasHandler, HOUSE_HANDLER, materialImageAtlasHandler, uiElementsImageAtlasHandler } from '../../assets/image_atlas_handlers'

// Types
export type UiIconType = 'GRAY_BACKGROUND'
| 'RED_BACKGROUND'
| 'GREEN_FLAT_BACKGROUND'
| 'GREEN_BACKGROUND'
| 'ORANGE_BACKGROUND'
| 'BRICK_BACKGROUND'
| 'SHOVEL'
| 'SCISSORS'
| 'GEOLOGIST'
| 'INFORMATION'
| 'SHRINK_FLAG'
| 'HOUSE_BURNING'
| 'HOUSE_UNDER_CONSTRUCTION'
| 'SWORDS'
| 'SOLDIER_RUNNING'
| 'SCALES'
| 'ROMAN_SOLDIERS_ALL_TYPES'
| 'ROMAN_GENERAL'
| 'ROMAN_PRIVATE'
| 'CHECK_MARK'
| 'UP_ARROW'
| 'DOWN_ARROW'
| 'CIRCLE'
| 'MAGNIFYING_GLASS'
| 'SCREEN_AND_DISKETTE'
| 'LEFT_ARROW'
| 'RIGHT_ARROW'
| 'X_CLOSE_DRAWN'
| 'INTRO_LABEL_AND_CAMERA'
| 'INGAME_LABEL_AND_CAMERA'
| 'FILM_CAMERA'
| 'ROAD_AND_FLAGS'
| 'PULL_DOWN_FLAG'
| 'SPRAY_CAN'
| 'SAVE_ICON'
| 'LOAD_ICON'
| 'TO_DOS_LABEL_AND_SCREEN'
| 'GLOBE_WITH_MAGNIFYING_GLASS'
| 'YELLOW_GLOBE_WITH_MAGNIFYING_GLASS'
| 'DARK_GRAY_GLOBE_WITH_MAGNIFYING_GLASS'
| 'BAR_CHART'
| 'YELLOW_BAR_CHART'
| 'DARK_GRAY_BAR_CHART'
| 'SCREEN_AND_DISKETTE_2'
| 'YELLOW_SCREEN_AND_DISKETTE'
| 'GRAY_SCREEN_AND_DISKETTE'
| 'DOVE_ON_BRANCH'
| 'YELLOW_DOVE_ON_BRANCH'
| 'GRAY_DOVE_ON_BRANCH'
| 'BRANCH'
| 'YELLOW_BRANCH'
| 'GRAY_BRANCH'
| 'LIGHT_ROAD_IN_NATURE'
| 'DARK_ROAD_IN_NATURE'
| 'RED_SMALL_AVAILABLE_BUILDING'
| 'RED_MEDIUM_AVAILABLE_BUILDING'
| 'RED_LARGE_AVAILABLE_BUILDING'
| 'REGULAR_FLAG'
| 'MAIN_FLAG'
| 'GREEN_QUESTION_MARK'
| 'GREEN_EXCLAMATION_SIGN'
| 'RED_QUESTION_MARK'
| 'RED_EXCLAMATION_SIGN'
| 'RED_AVAILABLE_MINE'
| 'GERMAN_FLAG'
| 'US_AND_UK_FLAG'
| 'NOTE'
| 'FOOD'
| 'ANVIL'
| 'PLANKS'
| 'PLUS_AVAILABLE_BUILDINGS'
| 'OPEN_BOOK'
| 'OWNED_AREA_ON_MAP'
| 'OWNED_BUILDINGS_ON_MAP'
| 'OWNED_ROADS_ON_MAP'
| 'GRAPH_OF_OWNED_AREA_ON_MAP'
| 'WOOD'
| 'WHEAT'
| 'COAL'
| 'WATER'
| 'GOLD_OR_BEER'
| 'WATER_FLAG'
| 'WATER_ROAD_IN_NATURE'
| 'SCOUT'
| 'ONE_SWORD'
| 'TWO_SWORDS'
| 'THREE_SWORDS'
| 'TWO_SWORDS_AND_SHIELD'
| 'BURNING_HOUSE_WITH_SKELETON'
| 'PREVIOUS'
| 'REVERSE'
| 'FORWARD'
| 'NEXT'
| 'TRASHCAN'
| 'GO_TO_POINT'
| 'SHRINK_SCREEN_AND_MAGNIFYING_GLASS'
| 'ENLARGE_SCREEN_AND_MAGNIFYING_GLASS'
| 'X_CLOSE_DRAWN_2'
| 'WEAPONS_MOVING'
| 'CD'
| 'CD_2'
| 'BIRD_SINGING'
| 'BIRD_QUIET'
| 'HORN_PLAYING_WITH_SHEET_MUSIC'
| 'HORN_QUIET_WITH_SHEET_MUSIC'
| 'BROKEN_FLAG'
| 'WEAK_SOLDIER_WITH_MINUS'
| 'STRONG_SOLDIER_WITH_PLUS'
| 'ONE_SHIELD_WITH_MINUS'
| 'TWO_SHIELDS_WITH_PLUS'
| 'MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_MINUS'
| 'MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_PLUS'
| 'FORTRESS_WITH_MINUS'
| 'FORTRESS_WITH_PLUS'
| 'SMALLER_FORTRESS_WITH_MINUS'
| 'SMALLER_FORTRESS_WITH_PLUS'
| 'SMALLEST_FORTRESS_WITH_MINUS'
| 'SMALLEST_FORTRESS_WITH_PLUS'
| 'TOOL_AND_TIME'
| 'HOUSE_ON_MAP'
| 'WEAPONS_AND_SOLDIER'
| 'GOODS'
| 'GOODS_ON_MAP'
| 'HOUSE_WITH_GEARS_AND_PROGRESS_BAR'
| 'TOOLS_WITH_QUESTION_MARK'
| 'PLUS'
| 'MINUS'
| 'TONGS_AND_PLUS'
| 'TONGS_AND_MINUS'
| 'HAMMER_AND_PLUS'
| 'HAMMER_AND_MINUS'
| 'AXE_AND_PLUS'
| 'AXE_AND_MINUS'
| 'SAW_AND_PLUS'
| 'SAW_AND_MINUS'
| 'PICK_AXE_AND_PLUS'
| 'PICK_AXE_AND_MINUS'
| 'SHOVEL_AND_PLUS'
| 'SHOVEL_AND_MINUS'
| 'CRUCIBLE_AND_PLUS'
| 'CRUCIBLE_AND_MINUS'
| 'LINE_AND_HOOK_AND_PLUS'
| 'LINE_AND_HOOK_AND_MINUS'
| 'SCYTHE_AND_PLUS'
| 'SCYTHE_AND_MINUS'
| 'CLEAVER_AND_PLUS'
| 'CLEAVER_AND_MINUS'
| 'ROLLING_PIN_AND_PLUS'
| 'ROLLING_PIN_AND_MINUS'
| 'BOW_AND_PLUS'
| 'BOW_AND_MINUS'
| 'SOLDIER_RUNNING_WITH_CLOCK'
| 'TO_LABEL'
| 'WREATH_ON_MAP'
| 'MAP_WITH_QUESTION_MARK'
| 'BUILDINGS_WITH_QUESTION_MARK'
| 'WORKERS_WITH_QUESTION_MARK'
| 'GOODS_WITH_QUESTION_MARK'
| 'GENERAL_WITH_QUESTION_MARK'
| 'COINS_WITH_QUESTION_MARK'
| 'GEARS_WITH_QUESTION_MARK'
| 'YELLOW_ARROW_TO_DISKETTE'
| 'SHIP_AND_ANCHOR'
| 'SHIP_ON_SEA'
| 'ANCHOR'
| 'YELLOW_ARROW_TO_ANCHOR'
| 'PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES'
| 'PLUS_RETURN_TO_HEADQUARTERS'
| 'THIN_ARROW_DOWN_RIGHT'
| 'THIN_ARROW_DOWN'
| 'THIN_ARROW_DOWN_LEFT'
| 'THIN_ARROW_UP_LEFT'
| 'THIN_ARROW_UP'
| 'THIN_ARROW_UP_RIGHT'
| 'YELLOW_ANCHOR'
| 'GRAY_HOUSE_WITH_YELLOW_QUESTION_MARK'
| 'YELLOW_ARROWS_TO_SCROLL'
| 'PAPERS'
| 'RED_ARROWS_TO_MIDDLE'
| 'STATISTICS'
| 'LARGE_FORTRESS'
| 'SMALLER_FORTRESS'
| 'SMALLEST_FORTRESS'
| 'GEARS'
| 'GEARS_CROSSED_OVER'
| 'TRANSPORT_PRIORITY'
| 'ONE_BROWN_SHIELD'
| 'TWO_BROWN_SHIELDS'
| 'THREE_BROWN_SHIELDS'
| 'FOUR_BROWN_SHIELDS'
| 'ONE_YELLOW_SHIELD'
| 'TWO_YELLOW_SHIELDS'
| 'THREE_YELLOW_SHIELDS'
| 'FOUR_YELLOW_SHIELDS'
| 'FIVE_YELLOW_SHIELDS'
| 'MILITARY_BUILDING_WITH_SWORDS_AND_MINUS'
| 'MILITARY_BUILDING_WITH_SWORDS_AND_PLUS'
| 'GOODS_AND_SEND_OUT_ARROWS'
| 'BLOCKED_DOOR'
| 'BLOCKED_ANCHOR'
| 'WORKERS_GOODS_AND_QUESTION_MARK'
| 'ARROW_TO_TOP'
| 'ARROW_TO_BOTTOM'
| 'ANGEL_WITH_QUESTION_MARK'
| 'SHIP'
| 'BOAT'
| 'RED_X'
| 'SEND_OUT_ARROWS'
| 'BLOCK_CROSS'
| 'YELLOW_RELOAD_ARROWS'
| 'PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES_2'
| 'BLUE_QUESTION_MARK'
| 'COIN_CROSSED_OUT'
| 'COIN'
| 'OPEN_SCROLL'
| 'LOGO_GERMAN'
| 'LOGO_ENGLISH'
| 'X_CLOSE'

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
function drawImageAndShadow(
    image: CanvasImageSource,
    drawInfo: DrawingInformation,
    shadowInfo: DrawingInformation | undefined,
    drawShadow: boolean,
    canvas: HTMLCanvasElement,
    scale: number
): void {

    // Validate input early
    if (scale <= 0 || !Number.isFinite(scale)) {
        console.error('Invalid scale', scale)
        return
    }

    const context = canvas.getContext('2d')

    if (!context) {
        console.error('No 2d drawing context')
        return
    }

    const dpr = window.devicePixelRatio || 1

    // Pixel art should remain crisp
    context.imageSmoothingEnabled = false

    // Compute logical bounds
    let logicalWidth: number
    let logicalHeight: number
    let originX = 0
    let originY = 0

    if (drawShadow && shadowInfo) {

        // Distance from reference point to right/bottom edge
        const drawRight = drawInfo.width - drawInfo.offsetX
        const drawBottom = drawInfo.height - drawInfo.offsetY

        const shadowRight = shadowInfo.width - shadowInfo.offsetX
        const shadowBottom = shadowInfo.height - shadowInfo.offsetY

        // Combined reference-space bounds
        originX = Math.max(drawInfo.offsetX, shadowInfo.offsetX)
        originY = Math.max(drawInfo.offsetY, shadowInfo.offsetY)

        const right = Math.max(drawRight, shadowRight)
        const bottom = Math.max(drawBottom, shadowBottom)

        logicalWidth = Math.ceil((originX + right) * scale)
        logicalHeight = Math.ceil((originY + bottom) * scale)
    } else {
        logicalWidth = Math.ceil(drawInfo.width * scale)
        logicalHeight = Math.ceil(drawInfo.height * scale)
    }

    // Avoid invalid canvas sizes
    logicalWidth = Math.max(1, logicalWidth)
    logicalHeight = Math.max(1, logicalHeight)

    const physicalWidth = Math.max(1, Math.ceil(logicalWidth * dpr))
    const physicalHeight = Math.max(1, Math.ceil(logicalHeight * dpr))

    // Resize backing store only when necessary
    if (canvas.width !== physicalWidth ||
        canvas.height !== physicalHeight) {
        canvas.width = physicalWidth
        canvas.height = physicalHeight
    }

    // Keep CSS size stable
    const cssWidth = `${logicalWidth}px`
    const cssHeight = `${logicalHeight}px`

    if (canvas.style.width !== cssWidth) {
        canvas.style.width = cssWidth
    }

    if (canvas.style.height !== cssHeight) {
        canvas.style.height = cssHeight
    }

    // Always reset transform completely
    context.setTransform(1, 0, 0, 1, 0, 0)

    // Clear full physical canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Apply DPR scaling
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Draw shadow first
    if (drawShadow && shadowInfo) {
        const shadowX = (originX - shadowInfo.offsetX) * scale
        const shadowY = (originY - shadowInfo.offsetY) * scale
        const shadowWidth = shadowInfo.width * scale
        const shadowHeight = shadowInfo.height * scale

        // Draw shadow sprite mask
        context.drawImage(
            image,
            shadowInfo.sourceX,
            shadowInfo.sourceY,
            shadowInfo.width,
            shadowInfo.height,
            shadowX,
            shadowY,
            shadowWidth,
            shadowHeight
        )

        // Tint only the drawn pixels
        context.globalCompositeOperation = 'source-in'
        context.fillStyle = SHADOW_COLOR

        context.fillRect(
            shadowX,
            shadowY,
            shadowWidth,
            shadowHeight
        )

        // Restore normal drawing
        context.globalCompositeOperation = 'source-over'
    }

    // Draw foreground image
    const drawX = drawShadow && shadowInfo
        ? (originX - drawInfo.offsetX) * scale
        : 0

    const drawY = drawShadow && shadowInfo
        ? (originY - drawInfo.offsetY) * scale
        : 0

    context.drawImage(
        image,
        drawInfo.sourceX,
        drawInfo.sourceY,
        drawInfo.width,
        drawInfo.height,
        drawX,
        drawY,
        drawInfo.width * scale,
        drawInfo.height * scale
    )
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
            const handler = WORKER_ANIMATIONS[worker]
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

            const handler = WORKER_ANIMATIONS[worker]
            const drawArray = handler?.getAnimationFrame(
                {
                    nation,
                    direction,
                    color
                },
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
            await HOUSE_HANDLER.load()
            const image = HOUSE_HANDLER.getSourceImage()

            if (!image) {
                throw new Error('No image')
            }

            return { image }
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getFrame: (bitmap, frameIndex) => {
            const canvas = canvasRef.current
            if (!canvas) {
                return
            }

            const drawArray = HOUSE_HANDLER.getDrawingInformationForHouseReady(
                {
                    nation,
                    type: houseType
                }
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

    return <canvas ref={canvasRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{
        width: '1px',
        height: '1px'
    }} />
}

const InventoryIcon = ({ nation, material, scale = 1, inline = false, missing = false, onMouseEnter, onMouseLeave }: InventoryIconProps) => {

    // State
    const [image, setImage] = useState<HTMLImageElement>()

    // Rendering
    const url = materialImageAtlasHandler.getInventoryIconUrl(nation, material)

    const displayStyle = inline ? 'inline-block' : 'block'
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
                style={{
                    width: image ? image.naturalWidth * scale : 0,
                    height: image ? image.naturalHeight * scale : 0
                }}
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
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
            await FLAG_ANIMATIONS.load()

            const image = flagImageAtlasHandler.getSourceImage()
            if (!image) {
                throw new Error('FlagIcon: No image available')
            }

            return { image }
        },
        getFrame: (bitmap, frameIndex) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const drawArray = FLAG_ANIMATIONS.getAnimationFrame(
                {
                    nation,
                    color,
                    type
                },
                frameIndex,
                0
            )

            if (!drawArray) {
                return
            }

            const [draw, shadow] = drawArray
            drawImageAndShadow(bitmap, draw, shadow, drawShadow, canvas, scale)
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
    UiIcon,
    drawImageAndShadow
}