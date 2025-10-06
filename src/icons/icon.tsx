import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnyBuilding, Direction, FlagType, Material, Nation, PlayerColor, WorkerType } from '../api/types'
import { Dimension, DrawingInformation, flagAnimations, houses, materialImageAtlasHandler, uiElementsImageAtlasHandler, workers } from '../assets/assets'
import { resizeCanvasToDisplaySize } from '../utils/utils'
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
const imageCache = new Map<HTMLImageElement, ImageBitmap>()

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
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // eslint-disable-next-line
    const [animationIndexHolder, setAnimationIndexHolder] = useState<AnimationIndexHolder>({ animationIndex: 0 })
    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    const draw = useCallback(() => {
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

        resizeCanvasToDisplaySize(canvas)
        context.clearRect(0, 0, canvas.width, canvas.height)

        const animationHandler = workers.get(worker)
        const drawArray = animationHandler?.getAnimationFrame(nation, direction, color, 0, animationIndexHolder.animationIndex)

        if (!drawArray) {
            console.error('No drawing information')
            return
        }

        const drawInfo = drawArray[0]
        const shadowInfo = drawArray[1]

        if (sourceImage) {
            if (drawShadow) {
                context.drawImage(
                    sourceImage,
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
                sourceImage,
                drawInfo.sourceX, drawInfo.sourceY,
                drawInfo.width, drawInfo.height,
                0, 0,
                drawInfo.width * scale, drawInfo.height * scale
            )
        }
    }, [worker, nation, direction, scale, color, drawShadow, canvasRef, animationIndexHolder, sourceImage])

    useEffect(() => {
        const loadAnimation = async () => {
            const animationHandler = workers.get(worker)
            if (!animationHandler) {
                return
            }

            await animationHandler.load()
            const image = animationHandler.getImageAtlasHandler().getSourceImage()

            if (image) {
                let imageBitmap = imageCache.get(image)
                if (!imageBitmap) {
                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                }

                setSourceImage(imageBitmap)

                const drawArray = animationHandler.getAnimationFrame(nation, direction, color, 0, 0)

                if (drawArray) {
                    setDimension({
                        width: Math.max(...drawArray.map(draw => draw.offsetX + draw.width)),
                        height: Math.max(...drawArray.map(draw => draw.offsetY + draw.height))
                    })
                }
            } else {
                console.error('No image available')
            }
        }

        loadAnimation()
    }, [worker, nation, direction, color])

    useEffect(() => {
        if (animate) {
            const intervalId = setInterval(() => {
                animationIndexHolder.animationIndex = (animationIndexHolder.animationIndex + 1) % MAX_FRAMES

                requestAnimationFrame(draw)
            }, ANIMATION_INTERVAL)

            return () => clearInterval(intervalId)
        }
    }, [animate])

    useEffect(() => {
        if (!animate && sourceImage && dimension.width > 0 && dimension.height > 0) {
            draw() // Ensure the flag is drawn when image and dimensions are ready
        }
    }, [sourceImage, dimension, draw])

    return <canvas ref={canvasRef} width={dimension.width * scale} height={dimension.height * scale} />
}

const HouseIcon = ({ nation, houseType, scale = 1, drawShadow = false, onMouseEnter = undefined, onMouseLeave = undefined }: HouseProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    useEffect(() => {
        (async () => {
            await houses.load()
            const image = houses.getSourceImage()

            if (image) {
                let imageBitmap = imageCache.get(image)

                if (!imageBitmap) {
                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                }

                setSourceImage(imageBitmap)
            }

            const drawArray = houses.getDrawingInformationForHouseReady(nation, houseType)

            if (drawArray) {
                setDimension({
                    width: Math.max(
                        drawArray[0].offsetX,
                        drawArray[1].offsetX
                    ) + Math.max(
                        drawArray[0].width - drawArray[0].offsetX,
                        drawArray[1].width - drawArray[1].offsetX
                    ),
                    height: Math.max(
                        drawArray[0].offsetY,
                        drawArray[1].offsetY
                    ) + Math.max(
                        drawArray[0].height - drawArray[0].offsetY,
                        drawArray[1].height - drawArray[1].offsetY
                    )
                })
            } else {
                console.error('No image')
            }
        })()
    }, [nation, houseType])

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

            resizeCanvasToDisplaySize(canvas)
            context.clearRect(0, 0, canvas.width, canvas.height)

            const drawArray = houses?.getDrawingInformationForHouseReady(nation, houseType)

            if (!drawArray) {
                console.error('No drawing information')
                return
            }

            const drawInfo = drawArray[0]
            const shadowInfo = drawArray[1]

            if (sourceImage) {
                if (drawShadow) {
                    context.drawImage(
                        sourceImage,
                        shadowInfo.sourceX, shadowInfo.sourceY,
                        shadowInfo.width, shadowInfo.height,
                        (drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale,
                        shadowInfo.width * scale, shadowInfo.height * scale
                    )

                    context.globalCompositeOperation = 'source-in'
                    context.fillStyle = SHADOW_COLOR
                    context.fillRect((drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale, shadowInfo.width * scale, shadowInfo.height * scale)
                    context.globalCompositeOperation = 'source-over'
                }

                context.drawImage(
                    sourceImage,
                    drawInfo.sourceX, drawInfo.sourceY,
                    drawInfo.width, drawInfo.height,
                    0, 0,
                    drawInfo.width * scale, drawInfo.height * scale
                )
            }
        })()
    }, [nation, houseType, scale, drawShadow, sourceImage])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    />
}

const InventoryIcon = ({ nation, material, scale = 1, inline = false, missing = false, onMouseEnter = undefined, onMouseLeave = undefined }: InventoryIconProps) => {
    const [image, setImage] = useState<HTMLImageElement>()

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
                onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const image = event.target as HTMLImageElement

                    setImage(image)
                }}
            />
        </div>
    )
}
const UiIcon = ({ type, scale = 1, onMouseEnter, onMouseLeave, onClick }: UiIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [drawInfo, setDrawInfo] = useState<DrawingInformation>()
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    useEffect(() => {
        (async () => {
            await uiElementsImageAtlasHandler.load()
            const image = uiElementsImageAtlasHandler.getImage()

            if (!image) {
                console.error('UiIcon: Failed to get image')
                return
            }

            let imageBitmap = imageCache.get(image)

            if (!imageBitmap) {
                imageBitmap = await createImageBitmap(image)
                imageCache.set(image, imageBitmap)
            } else {
                console.log('UiIcon: Image bitmap was not in the cache')
            }

            const info = uiElementsImageAtlasHandler.getUiElement(type)
            if (!info) {
                console.error('UiIcon: Failed to get draw info')
                return
            }

            setSourceImage(imageBitmap)
            setDrawInfo(info)
        })()
    }, [type])

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

            if (!sourceImage) {
                console.error(`No source image for ${type}`)
                return
            }

            if (!drawInfo) {
                console.error('No draw info')
                return
            }

            const width = drawInfo.width * scale
            const height = drawInfo.height * scale

            canvas.width = width
            canvas.height = height

            context.clearRect(0, 0, width, height)

            context.drawImage(
                sourceImage,
                drawInfo.sourceX, drawInfo.sourceY,
                drawInfo.width, drawInfo.height,
                0, 0,
                width, height
            )
        })()

    }, [scale, sourceImage, canvasRef, drawInfo])

    const scaledWidth = (drawInfo?.width ?? 1) * scale
    const scaledHeight = (drawInfo?.height ?? 1) * scale

    return <canvas
        ref={canvasRef}
        width={scaledWidth}
        height={scaledHeight}
        style={{ width: scaledWidth, height: scaledHeight, imageRendering: 'pixelated' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
    />
}

const FlagIcon = ({ type, nation, animate = false, scale = 1, color = 'BLUE', drawShadow = false, onMouseEnter = undefined, onMouseLeave = undefined }: FlagIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // eslint-disable-next-line
    const [animationIndexHolder, setAnimationIndexHolder] = useState<AnimationIndexHolder>({ animationIndex: 0 })
    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    const draw = useCallback(() => {
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

        const drawArray = flagAnimations.getAnimationFrame(
            nation,
            color,
            type,
            animationIndexHolder.animationIndex, 0
        )

        if (!drawArray) {
            console.error('No drawing information', [nation, color, type])
            return
        }

        const [draw, shadow] = drawArray
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
            context.fillRect(
                (draw.offsetX - shadow.offsetX) * scale,
                (draw.offsetY - shadow.offsetY) * scale,
                shadow.width * scale, shadow.height * scale
            )
            context.globalCompositeOperation = 'source-over'

            context.drawImage(
                sourceImage,
                draw.sourceX, draw.sourceY,
                draw.width, draw.height,
                0, 0,
                width, height
            )
        }
    }, [canvasRef, nation, color, type, animationIndexHolder, sourceImage, drawShadow, dimension, scale])

    // Load image to draw from
    useEffect(() => {
        (async () => {
            await flagAnimations.load()

            const image = flagAnimations?.getImageAtlasHandler().getImage()

            if (image) {
                let imageBitmap = imageCache.get(image)

                if (!imageBitmap) {
                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                }

                setSourceImage(imageBitmap)
            } else {
                console.error('No image available')
            }

            const newDimension = drawShadow
                ? flagAnimations.getSizeWithShadow(nation, type)
                : flagAnimations.getSize(nation, type)

            if (newDimension) {
                setDimension(newDimension)
            } else {
                console.error('Failed to set dimension')
            }
        })()
    }, [type, nation, drawShadow])

    // Animation
    useEffect(() => {
        if (animate) {
            const intervalId = setInterval(() => {
                animationIndexHolder.animationIndex = (animationIndexHolder.animationIndex + 1) % MAX_FRAMES
                requestAnimationFrame(draw)
            }, ANIMATION_INTERVAL)
            return () => clearInterval(intervalId)
        }
    }, [animate, draw, animationIndexHolder])

    useEffect(() => {
        if (!animate && sourceImage && dimension.width > 0 && dimension.height > 0) {
            draw() // Ensure the flag is drawn when image and dimensions are ready
        }
    }, [sourceImage, dimension, draw])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
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