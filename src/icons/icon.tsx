import React, { useEffect, useRef, useState } from 'react'
import { AnyBuilding, Direction, FlagType, Material, Nation, PlayerColor, WorkerType } from '../api/types'
import { Dimension, FlagAnimation, flagAnimations, houses, materialImageAtlasHandler, uiElementsImageAtlasHandler, workers } from '../assets'
import { resizeCanvasToDisplaySize } from '../utils'
import './icon.css'

// Types
interface WorkerIconProps {
    worker: WorkerType
    animate?: boolean
    nation: Nation
    direction?: Direction
    scale?: number
    color?: PlayerColor
    drawShadow?: boolean
}

interface InventoryIconProps {
    nation: Nation
    material: Material
    label?: string
    scale?: number
    inline?: boolean
    missing?: boolean
}

interface HouseProps {
    nation: Nation
    houseType: AnyBuilding
    scale?: number
    inline?: boolean
    drawShadow?: boolean
}

export type UiIconType = 'DESTROY_BUILDING' | 'SCISSORS' | 'INFORMATION' | 'GEOLOGIST' | 'ATTACK'

interface UiIconProps {
    type: UiIconType
    scale?: number
}

interface FlagIconProps {
    type: FlagType
    animate?: boolean
    nation: Nation
    scale?: number
    color?: PlayerColor
    drawShadow?: boolean
}

// Constants
export const SHADOW_COLOR = "#333333"

// State
const imageCache = new Map<HTMLImageElement, ImageBitmap>()

// React components
const WorkerIcon = ({ worker, nation, animate = false, direction = 'WEST', scale = 1, color = 'BLUE', drawShadow = false }: WorkerIconProps) => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [animationIndex, setAnimationIndex] = useState<number>(0)
    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    useEffect(() => {
        const loadAnimation = async () => {
            const animationHandler = workers.get(worker)
            if (!animationHandler) {
                return
            }

            await animationHandler.load()
            const image = animationHandler.getImageAtlasHandler().getSourceImage()
            //const cacheKey = `${worker}-${nation}-${direction}-${color}`

            if (image) {
                let imageBitmap = imageCache.get(image)
                if (!imageBitmap) {
                    console.log('Not in cache')

                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                } else {
                    console.log('Already in cache')
                }

                setSourceImage(imageBitmap)

                const drawArray = animationHandler.getAnimationFrame(nation, direction, color, 0, animationIndex)

                if (drawArray) {
                    setDimension({
                        width: Math.max(...drawArray.map(draw => draw.offsetX + draw.width)),
                        height: Math.max(...drawArray.map(draw => draw.offsetY + draw.height))
                    })
                }
            } else {
                console.error("No image available")
            }
        }

        loadAnimation()
    }, [worker, nation, direction, color, animationIndex])

    useEffect(() => {
        if (animate) {
            const intervalId = setInterval(() => {
                setAnimationIndex(previous => previous + 1)
            }, 100)
            return () => { clearInterval(intervalId) }
        }

        return () => { }
    }, [animate])

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

            resizeCanvasToDisplaySize(canvas)

            context.clearRect(0, 0, canvas.width, canvas.height)

            const animationHandler = workers.get(worker)

            const drawArray = animationHandler?.getAnimationFrame(nation, direction, color, 0, animationIndex)

            if (!drawArray) {
                console.error("No drawing information")

                return
            }

            const drawInfo = drawArray[0]
            const shadowInfo = drawArray[1]

            if (sourceImage) {
                if (drawShadow) {
                    context.drawImage(sourceImage,
                        shadowInfo.sourceX, shadowInfo.sourceY,
                        shadowInfo.width, shadowInfo.height,
                        (drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale,
                        shadowInfo.width * scale, shadowInfo.height * scale
                    )

                    context.globalCompositeOperation = "source-in"

                    context.fillStyle = SHADOW_COLOR
                    context.fillRect((drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale, shadowInfo.width * scale, shadowInfo.height * scale)
                    context.globalCompositeOperation = "source-over"
                }

                context.drawImage(sourceImage,
                    drawInfo.sourceX, drawInfo.sourceY,
                    drawInfo.width, drawInfo.height,
                    0, 0,
                    drawInfo.width * scale, drawInfo.height * scale
                )
            }
        })().then()

    }, [animationIndex, animate, worker, nation, direction, scale, sourceImage])

    return <canvas ref={canvasRef} width={dimension.width * scale} height={dimension.height * scale} />
}

const HouseIcon = ({ nation, houseType, scale = 1, drawShadow = false }: HouseProps) => {
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
                    console.log('Not in cache')

                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                } else {
                    console.log('Already in cache')
                }

                setSourceImage(imageBitmap)
            }

            const drawArray = houses.getDrawingInformationForHouseReady(nation, houseType)

            if (drawArray) {
                setDimension({
                    width: Math.max(drawArray[0].offsetX, drawArray[1].offsetX) + Math.max(drawArray[0].width - drawArray[0].offsetX, drawArray[1].width - drawArray[1].offsetX),
                    height: Math.max(drawArray[0].offsetY, drawArray[1].offsetY) + Math.max(drawArray[0].height - drawArray[0].offsetY, drawArray[1].height - drawArray[1].offsetY)
                })
            } else {
                console.error("No image")
            }
        })().then()
    }, [nation, houseType])

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

            resizeCanvasToDisplaySize(canvas)

            context.clearRect(0, 0, canvas.width, canvas.height)

            const drawArray = houses?.getDrawingInformationForHouseReady(nation, houseType)

            if (!drawArray) {
                console.error("No drawing information")
                console.error([nation, houseType])

                return
            }

            const drawInfo = drawArray[0]
            const shadowInfo = drawArray[1]

            if (sourceImage) {
                console.log("Drawing")

                if (drawShadow) {
                    context.drawImage(sourceImage,
                        shadowInfo.sourceX, shadowInfo.sourceY,
                        shadowInfo.width, shadowInfo.height,
                        (drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale,
                        shadowInfo.width * scale, shadowInfo.height * scale
                    )

                    context.globalCompositeOperation = "source-in"

                    context.fillStyle = SHADOW_COLOR
                    context.fillRect((drawInfo.offsetX - shadowInfo.offsetX) * scale, (drawInfo.offsetY - shadowInfo.offsetY) * scale, shadowInfo.width * scale, shadowInfo.height * scale)
                    context.globalCompositeOperation = "source-over"
                }

                context.drawImage(sourceImage,
                    drawInfo.sourceX, drawInfo.sourceY,
                    drawInfo.width, drawInfo.height,
                    0, 0,
                    drawInfo.width * scale, drawInfo.height * scale
                )
            }
        })().then()
    }, [nation, houseType, scale, drawShadow, sourceImage])

    return <canvas ref={canvasRef} width={dimension.width * scale} height={dimension.height * scale} />
}

const InventoryIcon = ({ nation, material, scale = 1, inline = false, missing = false }: InventoryIconProps) => {
    const url = materialImageAtlasHandler.getInventoryIconUrl(nation, material)

    const displayStyle = inline ? 'inline' : 'block'
    const transparency = missing ? '0.5' : '1.0'

    return (<div className="inventory-icon" style={{ display: displayStyle, opacity: transparency }} >
        <img
            src={url}
            draggable={false}
            onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = event.target as HTMLImageElement

                img.width = img.naturalWidth * scale
                img.height = img.naturalHeight * scale
            }}
        />
    </div>)
}

const UiIcon = ({ type, scale = 1 }: UiIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    useEffect(() => {
        (async () => {
            await uiElementsImageAtlasHandler.load()

            const image = uiElementsImageAtlasHandler.getImage()

            if (image) {
                let imageBitmap = imageCache.get(image)

                if (!imageBitmap) {
                    console.log('Not in cache')

                    imageBitmap = await createImageBitmap(image)
                    imageCache.set(image, imageBitmap)
                } else {
                    console.log('Already in cache')
                }

                setSourceImage(imageBitmap)
            }

            const drawInfo = uiElementsImageAtlasHandler.getUiElement(type)

            if (drawInfo) {
                setDimension({ width: drawInfo.width, height: drawInfo.height })
            }
        })().then()
    }, [type])

    // Drawing
    useEffect(() => {
        (async () => {
            console.log("Drawing image")

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
            const drawInfo = uiElementsImageAtlasHandler.getUiElement(type)

            if (!drawInfo) {
                console.error("No drawing information")

                return
            }

            const width = drawInfo.width * scale
            const height = drawInfo.height * scale

            canvas.width = width
            canvas.height = height

            context.clearRect(0, 0, width, height)

            if (sourceImage) {
                console.log("Did draw image")

                context.drawImage(sourceImage, drawInfo.sourceX, drawInfo.sourceY, drawInfo.width, drawInfo.height, 0, 0, width, height)
            }
        })().then()

    }, [type, scale, sourceImage])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
    />
}

const FlagIcon = ({ type, nation, animate = false, scale = 1, color = 'BLUE', drawShadow = false }: FlagIconProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [animationIndex, setAnimationIndex] = useState<number>(0)
    const [animationHandler, setAnimationHandler] = useState<FlagAnimation>()
    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    // Load image to draw from
    useEffect(() => {
        if (flagAnimations) {
            (async () => {
                await flagAnimations.load()

                // Read the source image data, convert it to a bitmap, and store it
                const image = flagAnimations?.getImageAtlasHandler().getImage()

                if (image) {
                    let imageBitmap = imageCache.get(image)

                    if (!imageBitmap) {
                        console.log('Not in cache')

                        imageBitmap = await createImageBitmap(image)
                        imageCache.set(image, imageBitmap)
                    } else {
                        console.log('Already in cache')
                    }

                    setSourceImage(imageBitmap)
                }
            })().then(() => {
                setAnimationHandler(flagAnimations)

                const dimension = drawShadow ? flagAnimations.getSizeWithShadow(nation, type) : flagAnimations.getSize(nation, type)

                if (dimension) {
                    setDimension(dimension)
                } else {
                    console.error("Failed to set dimension")
                }
            })
        }
    }, [type, nation])

    // Animation
    useEffect(() => {
        if (animate) {
            const intervalId = setInterval(() => {
                setAnimationIndex(previous => previous + 1)
            }, 100)
            return () => { clearInterval(intervalId) }
        }

        return () => { }
    }, [animate])

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
            const drawArray = animationHandler?.getAnimationFrame(nation, color, type, animationIndex, 0)

            if (!drawArray) {
                console.error("No drawing information")
                console.error([nation, color, type])

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

    }, [animationIndex, animate, type, nation, scale, animationHandler, sourceImage, drawShadow])

    return <canvas
        ref={canvasRef}
        width={dimension.width * scale}
        height={dimension.height * scale}
        style={{ width: dimension.width * scale, height: dimension.height * scale }}
    />
}

export {
    WorkerIcon,
    HouseIcon,
    InventoryIcon,
    FlagIcon,
    UiIcon
}