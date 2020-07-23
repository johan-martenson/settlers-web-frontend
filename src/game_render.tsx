import React, { Component } from 'react'
import { getCrops, getFlags, getHouses, getRoads, getTrees, getWorkers, materialToColor, Point, TerrainAtPoint } from './api'
import houseImageMap, { Filename } from './images'
import { monitor } from './monitor'
import { camelCaseToWords, drawGradientTriangle, getBrightnessForNormals, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, intToVegetationColor, isContext2D, normalize, Point3D, same, Vector, vegetationToInt, getTimestamp } from './utils'
import { PointMapFast } from './util_types'
import { Duration, AggregatedDuration } from './duration'
import { isLatestValueHighestForVariable, getLatestValueForVariable, getVariableNames, getAverageValueForVariable, getHighestValueForVariable, addVariableIfAbsent, printVariables } from './stats'
import './game_render.css'

export interface ScreenPoint {
    x: number
    y: number
}

interface GameCanvasProps {
    scale: number
    translateX: number
    translateY: number
    screenWidth: number
    screenHeight: number
    selectedPoint?: Point
    possibleRoadConnections?: Point[]
    newRoad?: Point[]
    showAvailableConstruction: boolean
    showHouseTitles: boolean

    width: number
    height: number

    onPointClicked: ((point: Point) => void)
    onDoubleClick: ((point: Point) => void)
    onKeyDown: ((event: React.KeyboardEvent) => void)
}

interface GameCanvasState {
    hoverPoint?: Point
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private overlayCanvasRef = React.createRef<HTMLCanvasElement>()
    private lightVector: Vector
    private debuggedPoint: Point | undefined
    private previousTimestamp?: number
    private brightnessMap?: PointMapFast<number>
    private terrainCanvasRef = React.createRef<HTMLCanvasElement>()
    private lastScale: number
    private lastScreenHeight: number
    private lastScreenWidth: number
    private lastTranslateX: number
    private lastTranslateY: number
    private terrainNeedsUpdate: boolean
    private images: Map<Filename, HTMLImageElement>

    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.getHeightForPoint = this.getHeightForPoint.bind(this)
        this.pointToPoint3D = this.pointToPoint3D.bind(this)

        this.images = new Map()

        this.loadImages(["tree.png", "stone.png", "worker.png", "rabbit-small-brown.png", "flag.png", "large-house-available.png", "medium-house-available.png", "small-house-available.png", "mine-available.png"])
        this.loadImages(houseImageMap.values())

        /* Define the light vector */
        this.lightVector = normalize({ x: -1, y: 1, z: -1 })

        addVariableIfAbsent("fps")

        this.lastScale = 0
        this.lastScreenHeight = 0
        this.lastScreenWidth = 0
        this.lastTranslateX = 0
        this.lastTranslateY = 0

        this.terrainNeedsUpdate = true

        this.state = {}
    }

    buildHeightMap(): void {

        /* Calculate and store the normals per triangle */
        const straightBelowNormals = new PointMapFast<Vector>()
        const downRightNormals = new PointMapFast<Vector>()

        monitor.allTiles.forEach(
            (terrainAtPoint, point) => {
                const point3d = { x: terrainAtPoint.point.x, y: terrainAtPoint.point.y, z: terrainAtPoint.height }

                const pointDownLeft = getPointDownLeft(point)
                const pointDownRight = getPointDownRight(point)
                const pointRight = getPointRight(point)

                const downLeftHeight = this.getHeightForPoint(pointDownLeft)
                const downRightHeight = this.getHeightForPoint(pointDownRight)
                const rightHeight = this.getHeightForPoint(pointRight)

                if (downLeftHeight !== undefined && downRightHeight !== undefined) {
                    const pointDownLeft3d = { x: pointDownLeft.x, y: pointDownLeft.y, z: downLeftHeight }
                    const pointDownRight3d = { x: pointDownRight.x, y: pointDownRight.y, z: downRightHeight }

                    straightBelowNormals.set(point3d, getNormalForTriangle(point3d, pointDownLeft3d, pointDownRight3d))
                }

                if (downRightHeight !== undefined && rightHeight !== undefined) {
                    const pointRight3d = { x: pointRight.x, y: pointRight.y, z: rightHeight }
                    const pointDownRight3d = { x: pointDownRight.x, y: pointDownRight.y, z: downRightHeight }

                    downRightNormals.set(point3d, getNormalForTriangle(point3d, pointDownRight3d, pointRight3d))
                }
            }
        )

        /* Calculate the brightness in each point */
        const brightnessMap = new PointMapFast<number>()

        monitor.allTiles.forEach(
            (terrainAtPoint, point) => {
                const gamePoint = point
                const normals = [
                    straightBelowNormals.get(getPointUpLeft(gamePoint)),
                    downRightNormals.get(getPointUpLeft(gamePoint)),
                    straightBelowNormals.get(getPointUpRight(gamePoint)),
                    downRightNormals.get(gamePoint),
                    straightBelowNormals.get(gamePoint),
                    downRightNormals.get(getPointLeft(gamePoint))
                ]

                const brightness = getBrightnessForNormals(normals, this.lightVector)

                brightnessMap.set(gamePoint, brightness)
            }
        )

        this.brightnessMap = brightnessMap
    }

    loadImages(sources: string[] | IterableIterator<string>): void {
        for (let source of sources) {
            console.log("Loading " + source)

            const image = new Image()

            image.addEventListener("load",
                () => {
                    console.log("Loaded " + source)
                    this.images.set(source, image)
                }
            )

            image.src = source
        }
    }

    shouldComponentUpdate(nextProps: GameCanvasProps, nextState: GameCanvasState) {
        return this.props.scale !== nextProps.scale ||
            this.props.translateX !== nextProps.translateX ||
            this.props.translateY !== nextProps.translateY ||
            this.props.screenWidth !== nextProps.screenWidth ||
            this.props.screenHeight !== nextProps.screenHeight ||
            this.props.selectedPoint !== nextProps.selectedPoint ||
            this.props.possibleRoadConnections !== nextProps.possibleRoadConnections ||
            this.props.newRoad !== nextProps.newRoad ||
            (!this.state.hoverPoint && nextState.hoverPoint !== undefined) ||
            (this.state.hoverPoint !== undefined &&
                (this.state.hoverPoint !== nextState.hoverPoint ||
                 this.state.hoverPoint.x !== nextState.hoverPoint.x ||
                 this.state.hoverPoint.y !== nextState.hoverPoint.y))
    }

    getHeightForPoint(point: Point): number | undefined {
        const terrainAtPoint = monitor.allTiles.get(point)

        if (!terrainAtPoint) {
            return undefined
        }

        return terrainAtPoint.height
    }

    pointToPoint3D(point: Point): Point3D | undefined {
        const height = this.getHeightForPoint(point)

        if (height === undefined) {
            return undefined
        }

        return {
            x: point.x,
            y: point.y,
            z: height
        }
    }

    componentDidMount() {

        /* Handle update of heights if needed */
        if (!this.brightnessMap && monitor.allTiles && monitor.allTiles.size > 0) {
            console.info("Build height map during mount")
            this.buildHeightMap()
        }

        /* Create the rendering thread if it doesn't exist */
        this.renderGame()
    }

    renderGame(): void {

        if (!this.brightnessMap && monitor.allTiles && monitor.allTiles.size > 0) {
            console.info("Build height map during update")
            this.buildHeightMap()

            this.terrainNeedsUpdate = true
        }

        const duration = new Duration("GameRender::renderGame")

        /* Ensure that the references to the canvases are set */
        if (!this.overlayCanvasRef.current || !this.terrainCanvasRef.current) {
            console.error("The canvas references are not set properly")

            return
        }

        /* Get the rendering contexts for the canvases */
        const terrainCtx = this.terrainCanvasRef?.current?.getContext("2d", { alpha: false })
        const overlayCtx = this.overlayCanvasRef.current.getContext("2d")

        /* Ensure that both rendering contexts are valid */
        if (!overlayCtx || !isContext2D(overlayCtx) || !terrainCtx || !isContext2D(terrainCtx)) {
            console.error("No or invalid context")

            return
        }

        /*
          Make sure the width and height of the canvases match with the window

          Note: this will clear the screen - only set if needed

        */
        const width = this.overlayCanvasRef.current.width
        const height = this.overlayCanvasRef.current.height

        if (this.overlayCanvasRef.current.width !== this.props.width || this.overlayCanvasRef.current.height !== this.props.height) {
            this.overlayCanvasRef.current.width = this.props.width
            this.overlayCanvasRef.current.height = this.props.height

            this.terrainNeedsUpdate = true
        }

        if (this.terrainCanvasRef.current.width !== this.props.width || this.terrainCanvasRef.current.height !== this.props.height) {
            this.terrainCanvasRef.current.width = this.props.width
            this.terrainCanvasRef.current.height = this.props.height

            this.terrainNeedsUpdate = true
        }

        let ctx: CanvasRenderingContext2D

        /* Clear the overlay - make it fully transparent */
        overlayCtx.clearRect(0, 0, width, height)

        const scaleY = this.props.scale * 0.5

        let oncePerNewSelectionPoint = false

        const upLeft = this.screenPointToGamePoint({ x: 0, y: 0 })
        const downRight = this.screenPointToGamePoint({ x: width, y: height })

        const minXInGame = upLeft.x
        const maxYInGame = upLeft.y
        const maxXInGame = downRight.x
        const minYInGame = downRight.y

        if (this.props.selectedPoint && (!this.debuggedPoint || (this.debuggedPoint && !same(this.props.selectedPoint, this.debuggedPoint)))) {
            oncePerNewSelectionPoint = true
            this.debuggedPoint = this.props.selectedPoint
        }

        if (!this.brightnessMap || this.brightnessMap.size === 0) {
            requestAnimationFrame(this.renderGame.bind(this))

            return
        }

        duration.after("init")

        /* Draw the tiles */
        this.terrainNeedsUpdate = this.terrainNeedsUpdate ||
            this.lastScale !== this.props.scale ||
            this.lastScreenHeight !== this.props.screenHeight ||
            this.lastScreenWidth !== this.props.screenWidth ||
            this.lastTranslateX !== this.props.translateX ||
            this.lastTranslateY !== this.props.translateY;

        if (this.terrainNeedsUpdate) {
            const tileDuration = new AggregatedDuration("Tile drawing")

            /* Draw on the terrain canvas */
            ctx = terrainCtx

            /* Make it black before drawing the ground */
            ctx.clearRect(0, 0, width, height)

            for (const tile of monitor.discoveredBelowTiles) {

                const gamePoint = tile.pointAbove
                const gamePointDownLeft = getPointDownLeft(gamePoint)
                const gamePointDownRight = getPointDownRight(gamePoint)

                /* Filter tiles that are not on the screen */
                if (gamePointDownRight.x < minXInGame || gamePointDownLeft.x > maxXInGame || gamePointDownLeft.y < minYInGame || gamePoint.y > maxYInGame) {
                    continue
                }

                /* Get intensity for each point */
                const intensityPoint = this.brightnessMap.get(gamePoint)
                const intensityPointDownRight = this.brightnessMap.get(gamePointDownRight)
                const intensityPointDownLeft = this.brightnessMap.get(gamePointDownLeft)

                /* Draw the tile right below */
                const screenPoint = this.gamePointToScreenPoint(gamePoint)
                const screenPointDownLeft = this.gamePointToScreenPoint(gamePointDownLeft)
                const screenPointDownRight = this.gamePointToScreenPoint(gamePointDownRight)

                /* Get the brightness for the game point down left here because now we know that it is discovered */
                const colorBelow = intToVegetationColor.get(tile.vegetation)

                tileDuration.after("Tiles below: fetch intensity and calculate coordinates")

                /* Skip this draw if there is no defined color. This is an error */
                if (!colorBelow || intensityPoint === undefined || intensityPointDownLeft === undefined || intensityPointDownRight === undefined) {
                    console.log("NO COLOR FOR VEGETATION BELOW")
                    console.log(tile.vegetation)

                    continue
                }

                drawGradientTriangle(ctx,
                    colorBelow,
                    { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y - 1) },
                    { x: Math.round(screenPointDownLeft.x - 1), y: Math.round(screenPointDownLeft.y) },
                    { x: Math.round(screenPointDownRight.x + 1), y: Math.round(screenPointDownRight.y) },
                    intensityPoint,
                    intensityPointDownLeft,
                    intensityPointDownRight)

                tileDuration.after("Draw gradient triangle above")
            }

            duration.after("Draw tiles below")

            for (const tile of monitor.discoveredDownRightTiles) {

                const gamePoint = tile.pointLeft
                const gamePointDownRight = getPointDownRight(gamePoint)
                const gamePointRight = getPointRight(gamePoint)

                /* Filter tiles that are not on the screen */
                if (gamePointRight.x < minXInGame || gamePoint.x > maxXInGame || gamePointDownRight.y < minYInGame || gamePoint.y > maxYInGame) {
                    continue
                }

                /* Draw the tile down right */
                const screenPoint = this.gamePointToScreenPoint(gamePoint)
                const screenPointRight = this.gamePointToScreenPoint(gamePointRight)
                const screenPointDownRight = this.gamePointToScreenPoint(gamePointDownRight)

                /* Get the brightness for the game point right here because now we know that the point is discovered */
                const intensityPoint = this.brightnessMap.get(gamePoint)
                const intensityPointRight = this.brightnessMap.get(gamePointRight)
                const intensityPointDownRight = this.brightnessMap.get(gamePointDownRight)

                const colorDownRight = intToVegetationColor.get(tile.vegetation)

                tileDuration.after("Tiles above: fetch intensity and calculate coordinates")

                /* Skip this draw if there is no defined color. This is an error */
                if (!colorDownRight || intensityPoint === undefined || intensityPointDownRight === undefined || intensityPointRight === undefined) {
                    console.log("NO COLOR FOR VEGETATION DOWN RIGHT")
                    console.log(tile.vegetation)

                    continue
                }

                drawGradientTriangle(ctx,
                    colorDownRight,
                    { x: Math.round(screenPoint.x - 1), y: Math.round(screenPoint.y - 1) },
                    { x: Math.round(screenPointDownRight.x), y: Math.round(screenPointDownRight.y + 1) },
                    { x: Math.round(screenPointRight.x + 1), y: Math.round(screenPointRight.y - 1) },
                    intensityPoint,
                    intensityPointDownRight,
                    intensityPointRight)

                tileDuration.after("Draw gradient triangle below")
                tileDuration.reportStats()
            }

            this.lastScale = this.props.scale
            this.lastScreenHeight = this.props.screenHeight
            this.lastScreenWidth = this.props.screenWidth
            this.lastTranslateX = this.props.translateX
            this.lastTranslateY = this.props.translateY

            this.terrainNeedsUpdate = false
        }


        duration.after("draw tiles down-right")

        ctx = overlayCtx

        /* Draw the roads */
        ctx.fillStyle = 'yellow'

        for (const [id, road] of getRoads()) {
            const screenPoints = road.points.map(this.gamePointToScreenPoint)
            let previousScreenPoint = null

            for (let screenPoint of screenPoints) {

                if (previousScreenPoint) {

                    if ((previousScreenPoint.x < 0 && screenPoint.x < 0) || (previousScreenPoint.x > width && screenPoint.x > width) ||
                        (previousScreenPoint.y < 0 && screenPoint.y < 0) || (previousScreenPoint.y > height && screenPoint.y > height)) {
                        previousScreenPoint = screenPoint

                        continue
                    }

                    ctx.beginPath()

                    ctx.moveTo(screenPoint.x, screenPoint.y)
                    ctx.lineTo(previousScreenPoint.x, previousScreenPoint.y)

                    ctx.closePath()

                    ctx.stroke()
                }

                previousScreenPoint = screenPoint
            }
        }

        duration.after("draw roads")


        /* Draw the borders */
        ctx.fillStyle = 'blue'

        for (const [playerId, borderForPlayer] of monitor.border) {
            const borderColor = borderForPlayer.color

            for (const borderPoint of borderForPlayer.points) {

                if (borderPoint.x < minXInGame || borderPoint.x > maxXInGame || borderPoint.y < minYInGame || borderPoint.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(borderPoint)

                ctx.beginPath()
                ctx.arc(screenPoint.x, screenPoint.y, 5, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill()
            }
        }

        duration.after("draw borders")


        /* Draw the ongoing new road if it exists */
        if (this.props.newRoad) {

            let previous = null

            ctx.fillStyle = 'yellow'
            ctx.strokeStyle = 'yellow'

            for (let point of this.props.newRoad) {

                if (previous) {

                    const screenPointPrevious = this.gamePointToScreenPoint(previous)
                    const screenPointCurrent = this.gamePointToScreenPoint(point)

                    ctx.beginPath()

                    ctx.moveTo(screenPointCurrent.x, screenPointCurrent.y)
                    ctx.lineTo(screenPointPrevious.x, screenPointPrevious.y)

                    ctx.closePath()

                    ctx.stroke()
                }

                previous = point
            }
        }

        duration.after("draw ongoing road")


        /* Draw the houses */
        for (const [id, house] of getHouses()) {

            if (house.x < minXInGame || house.x > maxXInGame || house.y < minYInGame || house.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(house)

            /* Draw the house next to the point, instead of on top */
            const imageFilename = houseImageMap.get(house.type)

            if (imageFilename) {

                const houseImage = this.images.get(imageFilename)

                if (houseImage) {

                    if (houseImage.width > 300 || houseImage.height > 300) {
                        screenPoint.x -= 1.5 * this.props.scale
                        screenPoint.y -= 2 * scaleY

                        ctx.drawImage(houseImage, screenPoint.x, screenPoint.y, 3 * this.props.scale, 3 * scaleY)
                    } else {
                        screenPoint.x -= houseImage.width * this.props.scale / 40 / 1.4
                        screenPoint.y -= houseImage.height * this.props.scale / 40 / 1.1

                        ctx.drawImage(houseImage, screenPoint.x, screenPoint.y, houseImage.width * this.props.scale / 40, houseImage.height * this.props.scale / 40)
                    }
                } else {
                    screenPoint.x -= 1.5 * this.props.scale
                    screenPoint.y -= 2 * scaleY

                    ctx.fillStyle = 'yellow'

                    ctx.fillRect(screenPoint.x, screenPoint.y, 50, 50)
                }
            } else {
                screenPoint.x -= 1.5 * this.props.scale
                screenPoint.y -= 2 * scaleY

                ctx.fillStyle = 'red'

                ctx.fillRect(screenPoint.x, screenPoint.y, 50, 50)
            }
        }

        duration.after("draw houses")


        /* Draw the trees */
        for (const tree of getTrees()) {

            if (tree.x < minXInGame || tree.x > maxXInGame || tree.y < minYInGame || tree.y > maxYInGame) {
                continue
            }

            if (
                !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x - 2, y: tree.y }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 2, y: tree.y })
            ) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(tree)

            /* Draw the house next to the point, instead of on top */
            screenPoint.x -= 0.5 * this.props.scale
            screenPoint.y -= 2.5 * scaleY

            const treeImage = this.images.get("tree.png")

            if (treeImage) {
                ctx.drawImage(treeImage, screenPoint.x, screenPoint.y, this.props.scale, 3 * scaleY)
            }
        }

        duration.after("draw trees")


        /* Draw the crops */
        ctx.fillStyle = 'orange'

        for (const crop of getCrops()) {

            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(crop)

            ctx.beginPath()

            ctx.ellipse(screenPoint.x, screenPoint.y, this.props.scale, 0.5 * scaleY, 0, 0, 2 * Math.PI)
            ctx.closePath()

            ctx.fill()
        }

        duration.after("draw crops")


        /* Draw the signs */
        for (const [id, sign] of monitor.signs) {

            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(sign)

            const fillColor = materialToColor.get(sign.type)

            if (fillColor) {
                ctx.fillStyle = fillColor
            } else {
                ctx.fillStyle = "brown"
            }

            ctx.fillRect(screenPoint.x - 5, screenPoint.y - 5, 10, 10)
        }

        duration.after("draw signs")


        /* Draw the stones */
        for (const stone of monitor.stones) {

            if (stone.x < minXInGame || stone.x > maxXInGame || stone.y < minYInGame || stone.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(stone)

            /* Draw the stone next to the point, instead of on top */
            screenPoint.x -= (2 * this.props.scale) / 2
            screenPoint.y -= 3 * scaleY / 2

            const stoneImage = this.images.get("stone.png")

            if (stoneImage) {
                ctx.drawImage(stoneImage, screenPoint.x, screenPoint.y, 2 * this.props.scale, 3 * scaleY)
            }
        }

        duration.after("draw stones")


        /* Draw workers */
        const workerImage = this.images.get("worker.png")

        for (const [id, worker] of getWorkers()) {

            if (worker.betweenPoints && worker.previous && worker.next) {

                if (worker.previous.x < minXInGame || worker.previous.x > maxXInGame || worker.previous.y < minYInGame || worker.previous.y > maxYInGame) {
                    continue
                }

                if (worker.next.x < minXInGame || worker.next.x > maxXInGame || worker.next.y < minYInGame || worker.next.y > maxYInGame) {
                    continue
                }

                const screenPoint1 = this.gamePointToScreenPoint(worker.previous)
                const screenPoint2 = this.gamePointToScreenPoint(worker.next)

                const point = {
                    x: screenPoint1.x + (screenPoint2.x - screenPoint1.x) * (worker.percentageTraveled / 100),
                    y: screenPoint1.y + (screenPoint2.y - screenPoint1.y) * (worker.percentageTraveled / 100)
                }

                point.y -= scaleY

                if (workerImage) {
                    ctx.drawImage(workerImage, point.x, point.y, 0.25 * this.props.scale, 1.15 * scaleY)
                }
            } else {

                if (worker.x < minXInGame || worker.x > maxXInGame || worker.y < minYInGame || worker.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(worker)

                screenPoint.y -= scaleY

                if (workerImage) {
                    ctx.drawImage(workerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
                }
            }
        }

        duration.after("draw workers")


        /* Draw animals */
        const animalImage = this.images.get("rabbit-small-brown.png")

        for (const animal of monitor.animals) {
            if (animal.betweenPoints) {

                if (animal.previous.x < minXInGame || animal.previous.x > maxXInGame || animal.previous.y < minYInGame || animal.previous.y > maxYInGame) {
                    continue
                }

                if (animal.next.x < minXInGame || animal.next.x > maxXInGame || animal.next.y < minYInGame || animal.next.y > maxYInGame) {
                    continue
                }

                const screenPoint1 = this.gamePointToScreenPoint(animal.previous)
                const screenPoint2 = this.gamePointToScreenPoint(animal.next)

                const point = {
                    x: screenPoint1.x + (screenPoint2.x - screenPoint1.x) * (animal.percentageTraveled / 100),
                    y: screenPoint1.y + (screenPoint2.y - screenPoint1.y) * (animal.percentageTraveled / 100)
                }

                point.y -= 15

                if (animalImage) {
                    ctx.drawImage(animalImage, point.x, point.y, 20, 30)
                }
            } else {

                if (animal.x < minXInGame || animal.x > maxXInGame || animal.y < minYInGame || animal.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(animal)

                screenPoint.y -= 15

                if (animalImage) {
                    ctx.drawImage(animalImage, screenPoint.x, screenPoint.y, 20, 30)
                }
            }
        }

        duration.after("draw wild animals")


        /* Draw flags */
        const flagImage = this.images.get("flag.png")

        for (const [id, flag] of getFlags()) {

            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(flag)

            /* Draw the flag slightly above the point */
            screenPoint.y -= 25
            screenPoint.x = screenPoint.x - 3

            if (flagImage) {
                ctx.drawImage(flagImage, screenPoint.x, screenPoint.y, 10, 30)
            }
        }

        duration.after("draw flags")


        /* Draw available construction */
        const largeHouseAvailableImage = this.images.get("large-house-available.png")
        const mediumHouseAvailableImage = this.images.get("medium-house-available.png")
        const smallHouseAvailableImage = this.images.get("small-house-available.png")
        const mineAvailableImage = this.images.get("mine-available.png")

        if (this.props.showAvailableConstruction) {

            for (const [gamePoint, available] of monitor.availableConstruction.entries()) {

                if (available.length === 0) {
                    continue
                }

                if (gamePoint.x < minXInGame || gamePoint.x > maxXInGame || gamePoint.y < minYInGame || gamePoint.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(gamePoint)

                if (available.includes("large")) {

                    if (largeHouseAvailableImage) {
                        const offsetX = 0.2 * this.props.scale
                        const offsetY = 0.4 * scaleY

                        ctx.drawImage(largeHouseAvailableImage, screenPoint.x - offsetX, screenPoint.y - offsetY, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow'
                        ctx.strokeStyle = 'black'

                        ctx.fillRect(screenPoint.x - 7, screenPoint.y - 15, 15, 15)

                        ctx.strokeRect(screenPoint.x - 7, screenPoint.y - 15, 15, 15)
                    }
                } else if (available.includes("medium")) {

                    if (mediumHouseAvailableImage) {
                        const offsetX = 0.2 * this.props.scale
                        const offsetY = 0.4 * scaleY

                        ctx.drawImage(mediumHouseAvailableImage, screenPoint.x - offsetX, screenPoint.y - offsetY, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow'
                        ctx.strokeStyle = 'black'

                        ctx.fillRect(screenPoint.x - 5, screenPoint.y - 10, 10, 10)
                        ctx.strokeRect(screenPoint.x - 5, screenPoint.y - 10, 10, 10)
                    }
                } else if (available.includes("small")) {

                    if (smallHouseAvailableImage) {
                        const offsetX = 0.2 * this.props.scale
                        const offsetY = 0.4 * scaleY

                        ctx.drawImage(smallHouseAvailableImage, screenPoint.x - offsetX, screenPoint.y - offsetY, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow'
                        ctx.strokeStyle = 'black'

                        ctx.fillRect(screenPoint.x - 3, screenPoint.y - 6, 6, 6)
                        ctx.strokeRect(screenPoint.x - 3, screenPoint.y - 6, 6, 6)

                    }
                } else if (available.includes("mine")) {

                    if (mineAvailableImage) {
                        const offsetX = 0.2 * this.props.scale
                        const offsetY = 0.4 * scaleY

                        ctx.drawImage(mineAvailableImage, screenPoint.x - offsetX, screenPoint.y - offsetY, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow'
                        ctx.strokeStyle = 'black'

                        ctx.beginPath()
                        ctx.arc(screenPoint.x - 3, screenPoint.y - 6, 6, 0, 2 * Math.PI)
                        ctx.closePath()

                        ctx.fill()
                        ctx.stroke()
                    }

                } else if (available.includes("flag")) {
                    ctx.fillStyle = 'yellow'
                    ctx.strokeStyle = 'black'

                    ctx.beginPath()

                    ctx.moveTo(screenPoint.x - 2, screenPoint.y)
                    ctx.lineTo(screenPoint.x - 2, screenPoint.y - 10)
                    ctx.lineTo(screenPoint.x + 3, screenPoint.y - 10)
                    ctx.lineTo(screenPoint.x + 3, screenPoint.y - 5)
                    ctx.lineTo(screenPoint.x, screenPoint.y - 5)
                    ctx.lineTo(screenPoint.x, screenPoint.y)

                    ctx.closePath()

                    ctx.fill()
                    ctx.stroke()
                }
            }
        }

        duration.after("draw available construction")


        /* Draw house titles */
        if (this.props.showHouseTitles) {

            ctx.font = "20px sans-serif"
            ctx.fillStyle = 'yellow'

            for (const [id, house] of monitor.houses) {

                if (house.x < minXInGame || house.x > maxXInGame || house.y < minYInGame || house.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(house)

                /* Draw the house next to the point, instead of on top */
                screenPoint.x -= 1.5 * this.props.scale // 30
                screenPoint.y -= 2 * scaleY // 15

                let houseTitle = camelCaseToWords(house.type)

                if (house.state === "UNFINISHED") {
                    houseTitle = "(" + houseTitle + ")"
                } else if (house.productivity) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

                ctx.fillText(houseTitle, screenPoint.x, screenPoint.y - 5)
            }
        }

        duration.after("draw house titles")


        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {
            this.props.possibleRoadConnections.forEach(
                (point, index) => {

                    const screenPoint = this.gamePointToScreenPoint(point)

                    ctx.fillStyle = 'orange'
                    ctx.strokeStyle = 'black'

                    ctx.beginPath()
                    ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI)
                    ctx.closePath()

                    ctx.fill()
                    ctx.stroke()
                }
            )
        }

        duration.after("draw possible road connections")


        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.props.selectedPoint)

            ctx.fillStyle = 'yellow'
            ctx.strokeStyle = 'black'

            ctx.beginPath()
            ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI)
            ctx.closePath()

            ctx.fill()
            ctx.stroke()
        }

        duration.after("draw selected point")


        /* Draw the hover point */
        if (this.state.hoverPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.state.hoverPoint)

            ctx.fillStyle = 'yellow'
            ctx.strokeStyle = 'black'

            ctx.beginPath()
            ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI)
            ctx.closePath()

            ctx.fill()
            ctx.stroke()
        }

        duration.after("draw hover point")

        duration.reportStats()

        /* List counters if the rendering time exceeded the previous maximum */
        if (isLatestValueHighestForVariable("GameRender::renderGame.total")) {
            printVariables()
        }

        /* Draw the FPS counter */
        const timestamp = getTimestamp()

        if (this.previousTimestamp) {
            const fps = getLatestValueForVariable("GameRender::renderGame.total")

            ctx.fillStyle = 'white'
            ctx.fillRect(width - 100, 5, 100, 60)

            ctx.closePath()

            ctx.fillStyle = 'black'
            ctx.fillText("" + fps, width - 100, 20)

            ctx.fillText("" + getAverageValueForVariable("GameRender::renderGame.total"), width - 100, 40)
        }

        this.previousTimestamp = timestamp

        requestAnimationFrame(this.renderGame.bind(this))
    }

    gamePointToScreenPoint(gamePoint: Point): ScreenPoint {
        return {
            x: gamePoint.x * this.props.scale + this.props.translateX,
            y: this.props.screenHeight - gamePoint.y * this.props.scale * 0.5 + this.props.translateY
        }
    }

    screenPointToGamePoint(screenPoint: ScreenPoint): Point {

        const gameX = (screenPoint.x - this.props.translateX) / this.props.scale
        const gameY = (this.props.screenHeight - screenPoint.y + this.props.translateY) / (this.props.scale * 0.5)

        let roundedGameX = Math.round(gameX)
        let roundedGameY = Math.round(gameY)

        const faultX = gameX - roundedGameX
        const faultY = gameY - roundedGameY

        /* Call the handler directly if both points are odd or even */
        if ((roundedGameX + roundedGameY) % 2 !== 0) {

            /* Find the closest valid point (odd-odd, or even-even) */
            if (Math.abs(faultX) > Math.abs(faultY)) {

                if (faultX > 0) {
                    roundedGameX++
                } else {
                    roundedGameX--
                }
            } else if (Math.abs(faultX) < Math.abs(faultY)) {
                if (faultY > 0) {
                    roundedGameY++
                } else {
                    roundedGameY--
                }
            } else {
                roundedGameX++
            }
        }

        return { x: roundedGameX, y: roundedGameY }
    }

    async onClick(event: React.MouseEvent): Promise<void> {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.error("Received invalid click event")

            return
        }

        /* Convert to game coordinates */
        if (this.overlayCanvasRef.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

            const gamePoint = this.screenPointToGamePoint({ x: x, y: y })

            this.props.onPointClicked(gamePoint)
        }

        event.stopPropagation()
    }

    onDoubleClick(event: React.MouseEvent): void {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.error("Received invalid double click event")

            return
        }

        /* Convert to game coordinates */
        if (this.overlayCanvasRef.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

            const screenPoint = this.screenPointToGamePoint({ x: x, y: y })

            this.props.onDoubleClick(screenPoint)
        }

        event.stopPropagation()
    }

    render() {

        return (
            <>
                <canvas
                    className="GameCanvas"
                    onKeyDown={this.props.onKeyDown}
                    onClick={this.onClick}
                    onDoubleClick={this.onDoubleClick}
                    ref={this.overlayCanvasRef}
                    onMouseMove={
                        (event: React.MouseEvent) => {

                            /* Convert to game coordinates */
                            if (this.overlayCanvasRef.current) {
                                const rect = event.currentTarget.getBoundingClientRect()
                                const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
                                const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

                                const hoverPoint = this.screenPointToGamePoint({ x: x, y: y })

                                if (!this.state.hoverPoint ||
                                    this.state.hoverPoint.x !== hoverPoint.x ||
                                    this.state.hoverPoint.y !== hoverPoint.y) {

                                    this.setState(
                                        {
                                            hoverPoint: hoverPoint
                                        }
                                    )
                                }
                            }

                            /* Allow the event to propagate to make scrolling work */
                        }
                    }
                />

                <canvas ref={this.terrainCanvasRef} className="TerrainCanvas" />

            </>
        )
    }
}

export { houseImageMap, GameCanvas, intToVegetationColor, vegetationToInt }

