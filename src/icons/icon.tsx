import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnyBuilding, Direction, FlagType, Material, Nation, PlayerColor, WorkerType } from '../api/types'
import { DrawingInformation, flagAnimations, houses, materialImageAtlasHandler, uiElementsImageAtlasHandler, workers } from '../assets/assets'
import './icon.css'

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
    | 'BROKEN_FLAG'
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
    | 'PULL_DOWN_FLAG'
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
    | 'ANGEL_WITH_QUESTION_MARK'
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
    | 'OWNED_BUILDINGS_ON_MAP'
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

type AnimationIndexHolder = {
    animationIndex: number
}

// Constants
export const SHADOW_COLOR = '#333333'
const ANIMATION_INTERVAL = 100
const MAX_FRAMES = 10

// State
const imageCache = new WeakMap<HTMLImageElement, ImageBitmap>()

// Functions
function drawImageAndShadow(image: ImageBitmap, drawInfo: DrawingInformation, shadowInfo: DrawingInformation, drawShadow: boolean, canvas: HTMLCanvasElement, scale: number): void {
    canvas.width = Math.max(drawInfo.width, shadowInfo.width) * scale
    canvas.height = Math.max(drawInfo.height, shadowInfo.height) * scale

    const context = canvas.getContext('2d')

    if (!context) {
        console.error('No 2d drawing context')
        return
    }

    // TODO: improve the dimensions by calculating differently depending on whether the shadow should be drawn

    if (drawShadow) {
        context.drawImage(
            image,
            shadowInfo.sourceX, shadowInfo.sourceY,
            shadowInfo.width, shadowInfo.height,
            (drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale,
            shadowInfo.width * scale, shadowInfo.height * scale
        )

        context.globalCompositeOperation = 'source-in'
        context.fillStyle = SHADOW_COLOR
        context.fillRect(
            (drawInfo.offsetX - shadowInfo.offsetX) * scale,
            (drawInfo.offsetY - shadowInfo.offsetY) * scale,
            shadowInfo.width * scale,
            shadowInfo.height * scale
        )
        context.globalCompositeOperation = 'source-over'
    }

    context.drawImage(
        image,
        drawInfo.sourceX, drawInfo.sourceY,
        drawInfo.width, drawInfo.height,
        0, 0,
        drawInfo.width * scale, drawInfo.height * scale)
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

    // References
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // State
    // eslint-disable-next-line
    const [animationIndexHolder, setAnimationIndexHolder] = useState<AnimationIndexHolder>({ animationIndex: 0 })

    // Functions
    const drawWorker = useCallback((image: ImageBitmap, worker: WorkerType, nation: Nation, direction: Direction, color: PlayerColor, animationIndex: number) => {
        const canvas = canvasRef.current

        if (!canvas) {
            console.error('No canvas ref set')
            return
        }

        const animationHandler = workers.get(worker)
        const drawArray = animationHandler?.getAnimationFrame(nation, direction, color, 0, animationIndex)

        if (!drawArray) {
            console.error('No drawing information')
            return
        }

        const drawInfo = drawArray[0]
        const shadowInfo = drawArray[1]

        drawImageAndShadow(image, drawInfo, shadowInfo, drawShadow, canvas, scale)
    }, [canvasRef])

    // Effects
    // Load image and drawing information
    useEffect(() => {
        let isCancelled = false;

        (async () => {
            const animationHandler = workers.get(worker)
            if (!animationHandler) {
                console.error(`No animation handler for worker: ${worker}`)
                return
            }

            await animationHandler.load()

            if (isCancelled) {
                return
            }

            const image = animationHandler.getImageAtlasHandler().getSourceImage()

            if (!image) {
                console.error(`No image available for worker: ${worker}`)
                return
            }

            let imageBitmap = imageCache.get(image)

            if (!imageBitmap) {
                imageBitmap = await createImageBitmap(image)
                imageCache.set(image, imageBitmap)

                if (isCancelled) {
                    return
                }
            }

            drawWorker(imageBitmap, worker, nation, direction, color, 0)

            if (animate) {
                const intervalId = setInterval(() => {
                    animationIndexHolder.animationIndex = (animationIndexHolder.animationIndex + 1) % MAX_FRAMES

                    requestAnimationFrame(() => drawWorker(imageBitmap, worker, nation, direction, color, animationIndexHolder.animationIndex))
                }, ANIMATION_INTERVAL)

                return () => clearInterval(intervalId)
            }
        })()

        return () => {
            isCancelled = true
        }
    }, [worker, nation, direction, color, animate])

    return <canvas ref={canvasRef} width={1} height={1} />
}

const HouseIcon = ({ nation, houseType, scale = 1, drawShadow = false, onMouseEnter, onMouseLeave }: HouseProps) => {

    // References
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Functions

    // Effects
    // Effect: load the image and drawing information, and draw
    useEffect(() => {
        let isCancelled = false

        async function drawHouse() {
            await houses.load()

            if (isCancelled) {
                return
            }

            const canvas = canvasRef.current

            if (!canvas) {
                console.error('No canvas ref set')
                return
            }

            const image = houses.getSourceImage()

            if (image === undefined) {
                console.error('No image available')
                return
            }

            let imageBitmap = imageCache.get(image)

            if (!imageBitmap) {
                imageBitmap = await createImageBitmap(image)

                if (isCancelled) {
                    return
                }

                imageCache.set(image, imageBitmap)
            }

            const drawArray = houses.getDrawingInformationForHouseReady(nation, houseType)

            if (!drawArray) {
                console.error('No drawing information')
                return
            }

            const drawInfo = drawArray[0]
            const shadowInfo = drawArray[1]

            drawImageAndShadow(imageBitmap, drawInfo, shadowInfo, drawShadow, canvas, scale)
        }

        drawHouse()

        return () => {
            isCancelled = true
        }
    }, [nation, houseType, scale, drawShadow])

    return <canvas
        ref={canvasRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    />
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
            style={{ display: displayStyle, opacity: transparency, width: image?.naturalWidth ?? 1 * scale, height: image?.naturalHeight ?? 1 * scale }}
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

    // References
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Effects
    // Effect: load and draw the image
    useEffect(() => {
        let isCancelled = false;

        (async () => {
            await uiElementsImageAtlasHandler.load()

            if (isCancelled) {
                return
            }

            const image = uiElementsImageAtlasHandler.getImage()

            if (!image) {
                console.error('UiIcon: Failed to get image')
                return
            }

            let imageBitmap = imageCache.get(image)

            if (!imageBitmap) {
                imageBitmap = await createImageBitmap(image)
                imageCache.set(image, imageBitmap)


                if (isCancelled) {
                    return
                }
            }

            const drawInfo = uiElementsImageAtlasHandler.getUiElement(type)
            if (!drawInfo) {
                console.error('UiIcon: Failed to get draw info')
                return
            }

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

            const width = drawInfo.width * scale
            const height = drawInfo.height * scale

            canvas.width = width
            canvas.height = height

            context.clearRect(0, 0, width, height)

            context.drawImage(
                imageBitmap,
                drawInfo.sourceX, drawInfo.sourceY,
                drawInfo.width, drawInfo.height,
                0, 0,
                width, height
            )
        })()

        return () => {
            isCancelled = true
        }
    }, [type])

    return <canvas
        ref={canvasRef}
        width={1}
        height={1}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
    />
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

    // References
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // State
    // eslint-disable-next-line
    const [animationIndexHolder, setAnimationIndexHolder] = useState<AnimationIndexHolder>({ animationIndex: 0 })

    // Functions
    const drawFlag = useCallback((image: ImageBitmap, nation: Nation, color: PlayerColor, type: FlagType, animationIndex: number) => {
        const canvas = canvasRef.current
        if (!canvas) {
            console.error('No canvas ref set')
            return
        }

        const drawArray = flagAnimations.getAnimationFrame(
            nation,
            color,
            type,
            animationIndex,
            0
        )

        if (!drawArray) {
            console.error('No drawing information', [nation, color, type])
            return
        }

        const [drawInformation, shadowInformation] = drawArray

        drawImageAndShadow(image, drawInformation, shadowInformation, drawShadow, canvas, scale)

    }, [canvasRef, animationIndexHolder, drawShadow, scale])

    // Load image, draw, and start animation (if requested)
    useEffect(() => {
        let isCancelled = false;

        (async () => {
            await flagAnimations.load()

            if (isCancelled) {
                return
            }

            const image = flagAnimations?.getImageAtlasHandler().getImage()

            if (!image) {
                console.error('No image available')
                return
            }

            let imageBitmap = imageCache.get(image)

            if (!imageBitmap) {
                imageBitmap = await createImageBitmap(image)

                if (isCancelled) {
                    return
                }

                imageCache.set(image, imageBitmap)
            }

            drawFlag(imageBitmap, nation, color, type, 0)

            if (animate) {
                const intervalId = setInterval(() => {
                    animationIndexHolder.animationIndex = (animationIndexHolder.animationIndex + 1) % MAX_FRAMES
                    requestAnimationFrame(() => drawFlag(imageBitmap, nation, color, type, animationIndexHolder.animationIndex))
                }, ANIMATION_INTERVAL)
                return () => clearInterval(intervalId)

            }
        })()

        return () => {
            isCancelled = true
        }
    }, [type, nation, drawShadow])

    return <canvas
        ref={canvasRef}
        width={1}
        height={1}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    />
}

export {
    WorkerIcon,
    HouseIcon,
    InventoryIcon,
    FlagIcon,
    UiIcon
}