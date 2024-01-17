import React, { useEffect, useRef, useState } from 'react'
import { AnyBuilding, Direction, FlagType, MaterialAllUpperCase, Nation, WorkerType } from './api/types'
import { FlagAnimation, flagAnimations, houses, materialImageAtlasHandler, workers } from './assets'
import { Dimension, WorkerAnimation, resizeCanvasToDisplaySize } from './utils'
import './icon.css'

interface WorkerIconProps {
    worker: WorkerType
    animate?: boolean
    nation: Nation
    direction?: Direction
    scale?: number
}

const WorkerIcon = (props: WorkerIconProps) => {
    const worker = props.worker
    const animate = props.animate ?? false
    const nation = props.nation
    const direction = props.direction ?? 'WEST'
    const scale = props.scale ?? 1

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [animationIndex, setAnimationIndex] = useState<number>(0)
    const [animationHandler, setAnimationHandler] = useState<WorkerAnimation>()
    const [dimension, setDimension] = useState<Dimension>({ width: 0, height: 0 })
    const [sourceImage, setSourceImage] = useState<ImageBitmap>()

    // Load image to draw from
    useEffect(() => {
        const animationHandler = workers.get(worker)

        if (animationHandler) {
            (async () => {
                await animationHandler.load()

                // Read the source image data, convert it to a bitmap, and store it
                const image = animationHandler?.getImageAtlasHandler().getSourceImage()

                if (image) {
                    const imageBitmap = await createImageBitmap(image)

                    setSourceImage(imageBitmap)
                    setDimension(animationHandler.getSize(nation, direction) ?? {width: 0, height: 0})

                } else {
                    console.error("No image")
                }
            })().then(() => {
                setAnimationHandler(animationHandler)

                /*const dimension = animationHandler.getSize(nation, direction)

                if (dimension) {
                    setDimension(dimension)
                } else {
                    console.error("Failed to set dimension")
                }*/
            })
        }
    }, [worker])

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
            resizeCanvasToDisplaySize(canvas)

            const width = canvas.width
            const height = canvas.height

            // Clear the background
            context.clearRect(0, 0, width, height)

            // Read the source image data
            const drawArray = animationHandler?.getAnimationFrame(direction, 0, animationIndex)

            if (!drawArray) {
                console.error("No drawing information")

                return
            }

            const draw = drawArray[0]

            // Write the image data
            if (sourceImage) {
                context.drawImage(sourceImage, draw.sourceX, draw.sourceY, draw.width, draw.height, 0, 0, width, height)
            }
        })().then()

    }, [animationIndex, animate, worker, nation, direction, scale, animationHandler, sourceImage])

    return <canvas ref={canvasRef} width={dimension.width * scale} height={dimension.height * scale} />
}

interface HouseProps {
    nation: Nation
    houseType: AnyBuilding
    scale?: number
    inline?: boolean
}

const HouseIcon = ({ nation, houseType, scale }: HouseProps) => {
    const url = houses.getUrlForIndividualBuilding(nation, houseType)

    return (<span className="house-icon">
        <img
            src={url}
            onLoad={(event: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const img = event.target as HTMLImageElement

                img.width = img.naturalWidth * (scale ?? 1.0)
                img.height = img.naturalHeight * (scale ?? 1.0)
            }}
        />
    </span>)
}

interface InventoryIconProps {
    nation: Nation
    material: MaterialAllUpperCase
    label?: string
    scale?: number
    inline?: boolean
    missing?: boolean
}

const InventoryIcon = (props: InventoryIconProps) => {
    const url = materialImageAtlasHandler.getInventoryIconUrl(props.nation, props.material)
    const scale = (props?.scale !== undefined) ? props.scale : 1.0

    const displayStyle = (props.inline) ? 'inline' : 'block'
    const transparency = (props.missing) ? '0.5' : '1.0'

    return (<div className="inventory-icon" style={{ display: displayStyle, opacity: transparency }} >
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


interface FlagIconProps {
    type: FlagType
    animate?: boolean
    nation: Nation
    scale?: number
}

const FlagIcon = (props: FlagIconProps) => {
    const type = props.type
    const animate = props.animate ?? false
    const nation = props.nation
    const scale = props.scale ?? 1

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
                    const imageBitmap = await createImageBitmap(image)

                    setSourceImage(imageBitmap)
                } else {
                    console.error("No image")
                }
            })().then(() => {
                setAnimationHandler(flagAnimations)

                const dimension = flagAnimations.getSize(nation, type)

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
            const drawArray = animationHandler?.getAnimationFrame(nation, type, animationIndex, 0)

            if (!drawArray) {
                console.error("No drawing information")

                return
            }

            const draw = drawArray[0]

            const width = draw.width * scale
            const height = draw.height * scale

            canvas.width = width
            canvas.height = height

            // Clear the background
            context.clearRect(0, 0, width, height)

            // Write the image data
            if (sourceImage) {
                context.drawImage(sourceImage, draw.sourceX, draw.sourceY, draw.width, draw.height, 0, 0, width, height)
            }
        })().then()

    }, [animationIndex, animate, type, nation, scale, animationHandler, sourceImage])

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
    FlagIcon
}