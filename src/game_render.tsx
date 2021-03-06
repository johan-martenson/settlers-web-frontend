import React, { Component } from 'react'
import { WorkerType, materialToColor, Point, signToColor, WildAnimalType, Size } from './api'
import { AggregatedDuration, Duration } from './duration'
import './game_render.css'
import { houseImageMap, houseUnderConstructionImageMap, Filename } from './images'
import { listenToDiscoveredPoints, monitor } from './monitor'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from './stats'
import { AnimationUtil, camelCaseToWords, drawGradientTriangle, drawGradientTriangleWithImage, getBrightnessForNormals, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, getTimestamp, intToVegetationColor, isContext2D, loadImage, normalize, Point3D, same, Vector, vegetationToInt, WorkerAnimation, getDirectionForWalkingWorker, getHouseSize } from './utils'
import { PointMapFast } from './util_types'

export interface ScreenPoint {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD'

interface GameCanvasProps {
    cursorState: CursorState
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

const AVAILABLE_SMALL_BUILDING_FILE = "assets/ui-elements/available-small-building.png"
const AVAILABLE_MEDIUM_BUILDING_FILE = "assets/ui-elements/available-medium-building.png"
const AVAILABLE_LARGE_BUILDING_FILE = "assets/ui-elements/available-large-building.png"
const AVAILABLE_FLAG_FILE = "assets/ui-elements/available-flag.png"
const AVAILABLE_MINE_FILE = "assets/ui-elements/available-mine.png"

const SIGN_IRON_SMALL = "assets/signs/iron-sign-small.png"
const SIGN_IRON_MEDIUM = "assets/signs/iron-sign-medium.png"
const SIGN_IRON_LARGE = "assets/signs/iron-sign-large.png"

const SIGN_COAL_SMALL = "assets/signs/coal-sign-small.png"
const SIGN_COAL_MEDIUM = "assets/signs/coal-sign-medium.png"
const SIGN_COAL_LARGE = "assets/signs/coal-sign-large.png"

const SIGN_GRANITE_SMALL = "assets/signs/granite-sign-small.png"
const SIGN_GRANITE_MEDIUM = "assets/signs/granite-sign-medium.png"
const SIGN_GRANITE_LARGE = "assets/signs/granite-sign-large.png"

const SIGN_GOLD_SMALL = "assets/signs/gold-sign-small.png"
const SIGN_GOLD_MEDIUM = "assets/signs/gold-sign-medium.png"
const SIGN_GOLD_LARGE = "assets/signs/gold-sign-large.png"

const SIGN_WATER = "assets/signs/water-sign-large.png"
const SIGN_NOTHING = "assets/signs/nothing-sign.png"

const FLAG_FILE = "assets/roman-buildings/flag.png"

const SELECTED_POINT = "assets/ui-elements/selected-point.png"

const SAVANNAH_IMAGE_FILE = "assets/nature/terrain/greenland/savannah.png"
const MOUNTAIN_1_IMAGE_FILE = "assets/nature/terrain/greenland/mountain1.png"
const SNOW_IMAGE_FILE = "assets/nature/terrain/greenland/snow.png"
const SWAMP_IMAGE_FILE = "assets/nature/terrain/greenland/swamp.png"
const DESERT_IMAGE_FILE = "assets/nature/terrain/greenland/desert.png"
const WATER_IMAGE_FILE = "assets/nature/terrain/greenland/water.png"
const MEADOW_1_IMAGE_FILE = "assets/nature/terrain/greenland/meadow1.png"
const MEADOW_2_IMAGE_FILE = "assets/nature/terrain/greenland/meadow2.png"
const MEADOW_3_IMAGE_FILE = "assets/nature/terrain/greenland/meadow3.png"
const MOUNTAIN_2_IMAGE_FILE = "assets/nature/terrain/greenland/mountain2.png"
const MOUNTAIN_3_IMAGE_FILE = "assets/nature/terrain/greenland/mountain3.png"
const MOUNTAIN_4_IMAGE_FILE = "assets/nature/terrain/greenland/mountain4.png"
const MOUNTAIN_TERRAIN = "assets/nature/terrain/greenland/mountain1.png"
const STEPPE_IMAGE_FILE = "assets/nature/terrain/greenland/steppe.png"
const FLOWER_MEADOW_IMAGE_FILE = "assets/nature/terrain/greenland/flower-meadow.png"
const LAVA_IMAGE_FILE = "assets/nature/terrain/greenland/lava.png"
const MAGENTA_IMAGE_FILE = "assets/nature/terrain/greenland/magenta.png"
const MOUNTAIN_MEADOW_IMAGE_FILE = "assets/nature/terrain/greenland/mountain-meadow.png"

const PLANNED_HOUSE_IMAGE_FILE = "assets/roman-buildings/construction-started-sign.png"

const DEAD_TREE_IMAGE_FILE = "assets/nature/dead-tree.png"

const treeType1Animation = new AnimationUtil("assets/nature/tree-type-1-animation-", ".png", 8, 20)
const treeType2Animation = new AnimationUtil("assets/nature/tree-type-2-animation-", ".png", 8, 20)
const treeType3Animation = new AnimationUtil("assets/nature/tree-type-3-animation-", ".png", 8, 20)
const treeType4Animation = new AnimationUtil("assets/nature/tree-type-4-animation-", ".png", 8, 20)
const treeType5Animation = new AnimationUtil("assets/nature/tree-type-5-animation-", ".png", 8, 20)
const treeType6Animation = new AnimationUtil("assets/nature/tree-type-6-animation-", ".png", 8, 20)
const treeType7Animation = new AnimationUtil("assets/nature/tree-type-7-animation-", ".png", 8, 20)
const treeType8Animation = new AnimationUtil("assets/nature/tree-type-8-animation-", ".png", 8, 20)
const treeType9Animation = new AnimationUtil("assets/nature/tree-type-9-animation-", ".png", 8, 20)

const fire = new Map<Size, AnimationUtil>()

fire.set('SMALL', new AnimationUtil("assets/nature/small-fire-", ".png", 8, 10))
fire.set('MEDIUM', new AnimationUtil("assets/nature/medium-fire-", ".png", 8, 10))
fire.set('LARGE', new AnimationUtil("assets/nature/large-fire-", ".png", 8, 10))

const animals = new Map<WildAnimalType, WorkerAnimation>()

animals.set("DEER", new WorkerAnimation("assets/nature/animals/deer-", ".png", 8, 10))
animals.set("DEER_2", new WorkerAnimation("assets/nature/animals/deer-2-", ".png", 8, 10))
animals.set("DUCK", new WorkerAnimation("assets/nature/animals/duck-", ".png", 1, 10))
animals.set("DUCK_2", new WorkerAnimation("assets/nature/animals/duck-", ".png", 1, 10))
animals.set("FOX", new WorkerAnimation("assets/nature/animals/fox-", ".png", 8, 10))
animals.set("RABBIT", new WorkerAnimation("assets/nature/animals/rabbit-", ".png", 8, 10))
animals.set("SHEEP", new WorkerAnimation("assets/nature/animals/sheep-", ".png", 2, 10))
animals.set("STAG", new WorkerAnimation("assets/nature/animals/stag-", ".png", 8, 10))

const romanWorkers = new Map<WorkerType, WorkerAnimation>()

romanWorkers.set("Farmer", new WorkerAnimation("assets/romans-workers/farmer-", ".png", 8, 10))
romanWorkers.set("Fisherman", new WorkerAnimation("assets/romans-workers/fisher-", ".png", 8, 10))
romanWorkers.set("Courier", new WorkerAnimation("assets/romans-workers/helper-", ".png", 8, 10))
romanWorkers.set("StorageWorker", new WorkerAnimation("assets/romans-workers/helper-", ".png", 8, 10))
romanWorkers.set("Hunter", new WorkerAnimation("assets/romans-workers/hunter-", ".png", 8, 10))
romanWorkers.set("IronFounder", new WorkerAnimation("assets/romans-workers/iron_founder-", ".png", 8, 10))
romanWorkers.set("Metalworker", new WorkerAnimation("assets/romans-workers/metalworker-", ".png", 8, 10))
romanWorkers.set("Miller", new WorkerAnimation("assets/romans-workers/miller-", ".png", 8, 10))
romanWorkers.set("Miner", new WorkerAnimation("assets/romans-workers/miner-", ".png", 8, 10))
romanWorkers.set("Minter", new WorkerAnimation("assets/romans-workers/minter-", ".png", 8, 10))
//romanWorkers.set("Donkey", new WorkerAnimation("assets/romans-workers/pack_donkey-", ".png", 8, 10))
romanWorkers.set("PigBreeder", new WorkerAnimation("assets/romans-workers/pig_breeder-", ".png", 8, 10))
//romanWorkers.set("Planer", new WorkerAnimation("assets/romans-workers/planer-", ".png", 8, 10))
romanWorkers.set("Scout", new WorkerAnimation("assets/romans-workers/scout-", ".png", 8, 10))
//romanWorkers.set("ShipWright", new WorkerAnimation("assets/romans-workers/ship_wright-", ".png", 8, 10))
romanWorkers.set("DonkeyBreeder", new WorkerAnimation("assets/romans-workers/donkey_breeder-", ".png", 8, 10))
romanWorkers.set("Butcher", new WorkerAnimation("assets/romans-workers/butcher-", ".png", 8, 10))
romanWorkers.set("Builder", new WorkerAnimation("assets/romans-workers/builder-", ".png", 8, 10))
romanWorkers.set("Brewer", new WorkerAnimation("assets/romans-workers/brewer-", ".png", 8, 10))
romanWorkers.set("Baker", new WorkerAnimation("assets/romans-workers/baker-", ".png", 8, 10))
romanWorkers.set("Armorer", new WorkerAnimation("assets/romans-workers/armorer-", ".png", 8, 10))
romanWorkers.set("WoodcutterWorker", new WorkerAnimation("assets/romans-workers/woodcutter-", ".png", 8, 10))
romanWorkers.set("Forester", new WorkerAnimation("assets/romans-workers/forester-", ".png", 8, 10))
romanWorkers.set("SawmillWorker", new WorkerAnimation("assets/romans-workers/carpenter-", ".png", 8, 10))
romanWorkers.set("Stonemason", new WorkerAnimation("assets/romans-workers/stonemason-", ".png", 8, 10))
romanWorkers.set("Scout", new WorkerAnimation("assets/romans-workers/scout-", ".png", 8, 10))
romanWorkers.set("Private", new WorkerAnimation("assets/romans-workers/private-", ".png", 8, 10))
romanWorkers.set("Private_first_class", new WorkerAnimation("assets/romans-workers/private_first_class-", ".png", 8, 10))
romanWorkers.set("Sergeant", new WorkerAnimation("assets/romans-workers/sergeant-", ".png", 8, 10))
romanWorkers.set("Officer", new WorkerAnimation("assets/romans-workers/officer-", ".png", 8, 10))
romanWorkers.set("General", new WorkerAnimation("assets/romans-workers/general-", ".png", 8, 10))
romanWorkers.set("Geologist", new WorkerAnimation("assets/romans-workers/geologist-", ".png", 8, 10))

const romanNormalFlagAnimation = new AnimationUtil("assets/romans-flags/normal-", ".png", 8, 10)
const romanMainFlagAnimation = new AnimationUtil("assets/romans-flags/main-", ".png", 8, 10)
const romanMarineFlagAnimation = new AnimationUtil("assets/romans-flags/marine-", ".png", 8, 10)

let terrainCtx: CanvasRenderingContext2D | null = null
let overlayCtx: CanvasRenderingContext2D | null = null

let selectedImage: HTMLImageElement | undefined

let largeHouseAvailableImage: HTMLImageElement | undefined
let mediumHouseAvailableImage: HTMLImageElement | undefined
let smallHouseAvailableImage: HTMLImageElement | undefined
let flagAvailableImage: HTMLImageElement | undefined
let mineAvailableImage: HTMLImageElement | undefined

let plannedHouseImage: HTMLImageElement | undefined

let deadTreeImage: HTMLImageElement | undefined

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

    private nothingSignImage: HTMLImageElement | undefined
    private waterSignImage: HTMLImageElement | undefined
    private coalSignLargeImage: HTMLImageElement | undefined
    private coalSignMediumImage: HTMLImageElement | undefined
    private coalSignalSmallImage: HTMLImageElement | undefined
    private ironSignLargeImage: HTMLImageElement | undefined
    private ironSignMediumImage: HTMLImageElement | undefined
    private ironSignalSmallImage: HTMLImageElement | undefined
    private goldSignLargeImage: HTMLImageElement | undefined
    private goldSignMediumImage: HTMLImageElement | undefined
    private goldSignalSmallImage: HTMLImageElement | undefined
    private graniteSignLargeImage: HTMLImageElement | undefined
    private graniteSignMediumImage: HTMLImageElement | undefined
    private graniteSignalSmallImage: HTMLImageElement | undefined

    private savannahImage: HTMLImageElement | undefined
    private mountainImage1: HTMLImageElement | undefined
    private snowImage: HTMLImageElement | undefined
    private swampImage: HTMLImageElement | undefined
    private desertImage: HTMLImageElement | undefined
    private waterImage: HTMLImageElement | undefined
    private meadowImage1: HTMLImageElement | undefined
    private meadowImage2: HTMLImageElement | undefined
    private meadowImage3: HTMLImageElement | undefined
    private mountainImage2: HTMLImageElement | undefined
    private mountainImage3: HTMLImageElement | undefined
    private mountainImage4: HTMLImageElement | undefined
    private steppeImage: HTMLImageElement | undefined
    private flowerMeadowImage: HTMLImageElement | undefined
    private lavaImage: HTMLImageElement | undefined
    private magentaImage: HTMLImageElement | undefined
    private mountainMeadowImage: HTMLImageElement | undefined
    private animationIndex: number = 0

    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.getHeightForPoint = this.getHeightForPoint.bind(this)
        this.pointToPoint3D = this.pointToPoint3D.bind(this)

        this.images = new Map()

        this.loadImages(["tree.png", "stone.png", "worker.png", "rabbit-small-brown.png", FLAG_FILE,
            AVAILABLE_LARGE_BUILDING_FILE, AVAILABLE_MEDIUM_BUILDING_FILE, AVAILABLE_SMALL_BUILDING_FILE, AVAILABLE_MINE_FILE, AVAILABLE_FLAG_FILE,
            SIGN_IRON_SMALL, SIGN_IRON_MEDIUM, SIGN_IRON_LARGE,
            SIGN_COAL_SMALL, SIGN_COAL_MEDIUM, SIGN_COAL_LARGE,
            SIGN_GRANITE_SMALL, SIGN_GRANITE_MEDIUM, SIGN_GRANITE_LARGE,
            SIGN_GOLD_SMALL, SIGN_GOLD_MEDIUM, SIGN_GOLD_LARGE,
            SIGN_WATER, SIGN_NOTHING,
            SELECTED_POINT,
            SAVANNAH_IMAGE_FILE, MOUNTAIN_1_IMAGE_FILE, SNOW_IMAGE_FILE, SWAMP_IMAGE_FILE,
            DESERT_IMAGE_FILE, WATER_IMAGE_FILE, MEADOW_1_IMAGE_FILE, MEADOW_2_IMAGE_FILE,
            MEADOW_3_IMAGE_FILE, MOUNTAIN_2_IMAGE_FILE, MOUNTAIN_3_IMAGE_FILE,
            MOUNTAIN_4_IMAGE_FILE, MOUNTAIN_TERRAIN, STEPPE_IMAGE_FILE,
            FLOWER_MEADOW_IMAGE_FILE, LAVA_IMAGE_FILE, MAGENTA_IMAGE_FILE,
            MOUNTAIN_MEADOW_IMAGE_FILE,
            PLANNED_HOUSE_IMAGE_FILE,
            DEAD_TREE_IMAGE_FILE
        ])

        this.loadImages(houseImageMap.values())
        this.loadImages(houseUnderConstructionImageMap.values())

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

        listenToDiscoveredPoints(() => { this.terrainNeedsUpdate = true })
    }

    componentDidUpdate(prevProps: GameCanvasProps): void {
        if (prevProps.screenWidth !== this.props.screenWidth || prevProps.screenHeight !== this.props.screenHeight) {
            this.terrainNeedsUpdate = true
        }

        if (prevProps.cursorState !== this.props.cursorState && this?.terrainCanvasRef?.current) {

            if (this.props.cursorState === 'DRAGGING') {
                this.terrainCanvasRef.current.style.cursor = "url(assets/ui-elements/dragging.png), pointer"
            } else if (this.props.cursorState === 'BUILDING_ROAD') {
                this.terrainCanvasRef.current.style.cursor = "url(assets/ui-elements/building-road.png), pointer"
            } else  {
                this.terrainCanvasRef.current.style.cursor = "pointer"
            }
        }
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
            (_terrainAtPoint, point) => {
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

            loadImage(source,
                (image, filename) => {
                    this.images.set(source, image)
                }
            )
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

    async componentDidMount() {

        /* Load animations */
        treeType1Animation.load()
        treeType2Animation.load()
        treeType3Animation.load()
        treeType4Animation.load()
        treeType5Animation.load()
        treeType6Animation.load()
        treeType7Animation.load()
        treeType8Animation.load()
        treeType9Animation.load()

        romanNormalFlagAnimation.load()
        romanMainFlagAnimation.load()
        romanMarineFlagAnimation.load()

        romanWorkers.forEach((animation, workerType) => animation.load())

        animals.forEach((animation, animalType) => animation.load())

        fire.forEach((animation, fireSize) => animation.load())

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
        if (terrainCtx === null) {
            terrainCtx = this.terrainCanvasRef?.current?.getContext("2d", { alpha: false })
        }

        if (overlayCtx === null) {
            overlayCtx = this.overlayCanvasRef.current.getContext("2d")
        }

        /* Ensure that both rendering contexts are valid */
        if (!overlayCtx /*|| !isContext2D(overlayCtx)*/ || !terrainCtx /*|| !isContext2D(terrainCtx)*/) {
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
            //ctx.clearRect(0, 0, width, height) -- buggy in Firefox (?)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, width, height)

            /* Collect terrain textures to use */
            if (this.savannahImage === undefined) {
                this.savannahImage = this.images.get(SAVANNAH_IMAGE_FILE)
            }

            if (this.mountainImage1 === undefined) {
                this.mountainImage1 = this.images.get(MOUNTAIN_1_IMAGE_FILE)
            }

            if (this.snowImage === undefined) {
                this.snowImage = this.images.get(SNOW_IMAGE_FILE)
            }

            if (this.swampImage === undefined) {
                this.swampImage = this.images.get(SWAMP_IMAGE_FILE)
            }

            if (this.desertImage === undefined) {
                this.desertImage = this.images.get(DESERT_IMAGE_FILE)
            }

            if (this.waterImage === undefined) {
                this.waterImage = this.images.get(WATER_IMAGE_FILE)
            }

            if (this.meadowImage1 === undefined) {
                this.meadowImage1 = this.images.get(MEADOW_1_IMAGE_FILE)
            }

            if (this.meadowImage2 === undefined) {
                this.meadowImage2 = this.images.get(MEADOW_2_IMAGE_FILE)
            }

            if (this.meadowImage3 === undefined) {
                this.meadowImage3 = this.images.get(MEADOW_3_IMAGE_FILE)
            }

            if (this.mountainImage2 === undefined) {
                this.mountainImage2 = this.images.get(MOUNTAIN_2_IMAGE_FILE)
            }

            if (this.mountainImage3 === undefined) {
                this.mountainImage3 = this.images.get(MOUNTAIN_3_IMAGE_FILE)
            }

            if (this.mountainImage4 === undefined) {
                this.mountainImage4 = this.images.get(MOUNTAIN_4_IMAGE_FILE)
            }

            if (this.steppeImage === undefined) {
                this.steppeImage = this.images.get(STEPPE_IMAGE_FILE)
            }

            if (this.flowerMeadowImage === undefined) {
                this.flowerMeadowImage = this.images.get(FLOWER_MEADOW_IMAGE_FILE)
            }

            if (this.lavaImage === undefined) {
                this.lavaImage = this.images.get(LAVA_IMAGE_FILE)
            }

            if (this.magentaImage === undefined) {
                this.magentaImage = this.images.get(MAGENTA_IMAGE_FILE)
            }

            if (this.mountainMeadowImage === undefined) {
                this.mountainMeadowImage = this.images.get(MOUNTAIN_MEADOW_IMAGE_FILE)
            }

            for (const tile of monitor.discoveredBelowTiles) {

                const gamePoint = tile.pointAbove
                const gamePointDownLeft = getPointDownLeft(gamePoint)
                const gamePointDownRight = getPointDownRight(gamePoint)

                /* Filter tiles that are not on the screen */
                if (gamePointDownRight.x < minXInGame || gamePointDownLeft.x > maxXInGame || gamePoint.y < minYInGame || gamePointDownLeft.y > maxYInGame) {
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

                let terrainImage

                if (tile.vegetation === 0) {
                    terrainImage = this.savannahImage
                } else if (tile.vegetation === 1) {
                    terrainImage = this.mountainImage1
                } else if (tile.vegetation === 2) {
                    terrainImage = this.snowImage
                } else if (tile.vegetation === 3) {
                    terrainImage = this.swampImage
                } else if (tile.vegetation === 4) {
                    terrainImage = this.desertImage
                } else if (tile.vegetation === 5 || tile.vegetation === 6 || tile.vegetation === 19) {
                    terrainImage = this.waterImage
                } else if (tile.vegetation === 7) {
                    terrainImage = this.desertImage
                } else if (tile.vegetation === 8) {
                    terrainImage = this.meadowImage1
                } else if (tile.vegetation === 9) {
                    terrainImage = this.meadowImage2
                } else if (tile.vegetation === 10) {
                    terrainImage = this.meadowImage3
                } else if (tile.vegetation === 11) {
                    terrainImage = this.mountainImage2
                } else if (tile.vegetation === 12) {
                    terrainImage = this.mountainImage3
                } else if (tile.vegetation === 13) {
                    terrainImage = this.mountainImage4
                } else if (tile.vegetation === 14) {
                    terrainImage = this.steppeImage
                } else if (tile.vegetation === 15) {
                    terrainImage = this.flowerMeadowImage
                } else if (tile.vegetation === 16 || tile.vegetation === 20 || tile.vegetation === 21 || tile.vegetation === 22) {
                    terrainImage = this.lavaImage
                } else if (tile.vegetation === 17) {
                    terrainImage = this.magentaImage
                } else if (tile.vegetation === 18) {
                    terrainImage = this.mountainMeadowImage
                } else if (tile.vegetation === 23) {
                    terrainImage = this.mountainImage1
                }

                if (terrainImage) {
                    drawGradientTriangleWithImage(ctx,
                        terrainImage,
                        { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y - 1) },
                        { x: Math.round(screenPointDownLeft.x - 1), y: Math.round(screenPointDownLeft.y) },
                        { x: Math.round(screenPointDownRight.x + 1), y: Math.round(screenPointDownRight.y) },
                        intensityPoint,
                        intensityPointDownLeft,
                        intensityPointDownRight)
                } else {
                    drawGradientTriangle(ctx,
                        colorBelow,
                        { x: Math.round(screenPoint.x), y: Math.round(screenPoint.y - 1) },
                        { x: Math.round(screenPointDownLeft.x - 1), y: Math.round(screenPointDownLeft.y) },
                        { x: Math.round(screenPointDownRight.x + 1), y: Math.round(screenPointDownRight.y) },
                        intensityPoint,
                        intensityPointDownLeft,
                        intensityPointDownRight)
                }

                tileDuration.after("Draw gradient triangle above")
            }

            duration.after("Draw tiles below")

            for (const tile of monitor.discoveredDownRightTiles) {

                const gamePoint = tile.pointLeft
                const gamePointDownRight = getPointDownRight(gamePoint)
                const gamePointRight = getPointRight(gamePoint)

                /* Filter tiles that are not on the screen */
                if (gamePointRight.x < minXInGame || gamePoint.x > maxXInGame || gamePoint.y < minYInGame || gamePointDownRight.y > maxYInGame) {
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

                let terrainImage

                if (tile.vegetation === 0) {
                    terrainImage = this.savannahImage
                } else if (tile.vegetation === 1) {
                    terrainImage = this.mountainImage1
                } else if (tile.vegetation === 2) {
                    terrainImage = this.snowImage
                } else if (tile.vegetation === 3) {
                    terrainImage = this.swampImage
                } else if (tile.vegetation === 4) {
                    terrainImage = this.desertImage
                } else if (tile.vegetation === 5 || tile.vegetation === 6 || tile.vegetation === 19) {
                    terrainImage = this.waterImage
                } else if (tile.vegetation === 7) {
                    terrainImage = this.desertImage
                } else if (tile.vegetation === 8) {
                    terrainImage = this.meadowImage1
                } else if (tile.vegetation === 9) {
                    terrainImage = this.meadowImage2
                } else if (tile.vegetation === 10) {
                    terrainImage = this.meadowImage3
                } else if (tile.vegetation === 11) {
                    terrainImage = this.mountainImage2
                } else if (tile.vegetation === 12) {
                    terrainImage = this.mountainImage3
                } else if (tile.vegetation === 13) {
                    terrainImage = this.mountainImage4
                } else if (tile.vegetation === 14) {
                    terrainImage = this.steppeImage
                } else if (tile.vegetation === 15) {
                    terrainImage = this.flowerMeadowImage
                } else if (tile.vegetation === 16 || tile.vegetation === 20 || tile.vegetation === 21 || tile.vegetation === 22) {
                    terrainImage = this.lavaImage
                } else if (tile.vegetation === 17) {
                    terrainImage = this.magentaImage
                } else if (tile.vegetation === 18) {
                    terrainImage = this.mountainMeadowImage
                } else if (tile.vegetation === 23) {
                    terrainImage = this.mountainImage1
                }

                if (terrainImage) {

                    drawGradientTriangleWithImage(ctx,
                        terrainImage,
                        { x: Math.round(screenPoint.x - 1), y: Math.round(screenPoint.y - 1) },
                        { x: Math.round(screenPointDownRight.x), y: Math.round(screenPointDownRight.y + 1) },
                        { x: Math.round(screenPointRight.x + 1), y: Math.round(screenPointRight.y - 1) },
                        intensityPoint,
                        intensityPointDownRight,
                        intensityPointRight)
                } else {
                    drawGradientTriangle(ctx,
                        colorDownRight,
                        { x: Math.round(screenPoint.x - 1), y: Math.round(screenPoint.y - 1) },
                        { x: Math.round(screenPointDownRight.x), y: Math.round(screenPointDownRight.y + 1) },
                        { x: Math.round(screenPointRight.x + 1), y: Math.round(screenPointRight.y - 1) },
                        intensityPoint,
                        intensityPointDownRight,
                        intensityPointRight)
                }

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

        for (const [id, road] of monitor.roads) {
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

            ctx.fillStyle = borderForPlayer.color

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
        if (plannedHouseImage === undefined) {
            plannedHouseImage = this.images.get(PLANNED_HOUSE_IMAGE_FILE)
        }

        let houseIndex = -1
        for (const [id, house] of monitor.houses) {

            houseIndex = houseIndex + 1

            if (house.x < minXInGame || house.x > maxXInGame || house.y < minYInGame || house.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(house)

            /* Draw the house next to the point, instead of on top */
            let imageFilename

            if (house.state === 'PLANNED') {
                if (plannedHouseImage) {
                    ctx.drawImage(plannedHouseImage, screenPoint.x, screenPoint.y)
                }

            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)

                const fireImage = fire.get(size)?.getAnimationElement(this.animationIndex, houseIndex)

                if (fireImage) {
                    ctx.drawImage(fireImage, screenPoint.x, screenPoint.y)
                }

            } else {

                if (house.state === "UNFINISHED") {
                    imageFilename = houseUnderConstructionImageMap.get(house.type)
                } else {
                    imageFilename = houseImageMap.get(house.type)
                }

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

                            ctx.drawImage(houseImage, Math.floor(screenPoint.x), Math.floor(screenPoint.y), Math.floor(houseImage.width * this.props.scale / 40), Math.floor(houseImage.height * this.props.scale / 40))
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
        }

        duration.after("draw houses")

        /* Draw the trees */
        let treeIndex = 0
        for (const [treeId, tree] of monitor.visibleTrees) {

            if (tree.x < minXInGame || tree.x > maxXInGame || tree.y < minYInGame || tree.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(tree)

            /* Draw the tree next to the point, instead of on top */
            screenPoint.x -= 0.5 * this.props.scale
            screenPoint.y -= 2.5 * scaleY

            let treeImage
            if (tree.type === "BIRCH") {
                treeImage = treeType1Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "CHERRY") {
                treeImage = treeType2Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "CYPRESS") {
                treeImage = treeType3Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "FIR") {
                treeImage = treeType4Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "OAK") {
                treeImage = treeType5Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "PALM_1") {
                treeImage = treeType6Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "PALM_2") {
                treeImage = treeType7Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "PINE") {
                treeImage = treeType8Animation.getAnimationElement(this.animationIndex, treeIndex)
            } else if (tree.type === "PINE_APPLE") {
                treeImage = treeType9Animation.getAnimationElement(this.animationIndex, treeIndex)
            }

            if (treeImage === undefined) {
                treeImage = this.images.get("tree.png")
            }

            if (treeImage) {
                ctx.drawImage(treeImage, Math.floor(screenPoint.x), Math.floor(screenPoint.y), Math.floor(this.props.scale), Math.floor(3 * scaleY))
            }

            treeIndex = treeIndex + 1
        }

        duration.after("draw trees")

        /* Draw dead trees */
        if (monitor.deadTrees.size() > 0) {
            if (deadTreeImage === undefined) {
                deadTreeImage = this.images.get(DEAD_TREE_IMAGE_FILE)
            }
        }

        for (const deadTree of monitor.deadTrees) {

            if (deadTree.x < minXInGame || deadTree.x > maxXInGame || deadTree.y < minYInGame || deadTree.y > maxYInGame) {
                continue
            }

            if (
                !monitor.discoveredPoints.has({ x: deadTree.x - 1, y: deadTree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: deadTree.x - 1, y: deadTree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: deadTree.x + 1, y: deadTree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: deadTree.x + 1, y: deadTree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: deadTree.x - 2, y: deadTree.y }) ||
                !monitor.discoveredPoints.has({ x: deadTree.x + 2, y: deadTree.y })
            ) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(deadTree)

            /* Draw the tree next to the point, instead of on top */
            screenPoint.x -= 0.5 * this.props.scale
            screenPoint.y -= 2 * scaleY

            if (deadTreeImage) {
                ctx.drawImage(deadTreeImage, Math.floor(screenPoint.x), Math.floor(screenPoint.y), Math.floor(this.props.scale), Math.floor(2 * scaleY))
            } else {
                ctx.fillStyle = 'yellow'
                ctx.fillRect(screenPoint.x, screenPoint.y, 10, 10)
            }
        }


        /* Draw the crops */
        ctx.fillStyle = 'orange'

        for (const crop of monitor.crops) {

            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(crop)

            ctx.beginPath()

            ctx.ellipse(screenPoint.x, screenPoint.y, 0.8 * this.props.scale, 0.4 * scaleY, 0, 0, 2 * Math.PI)
            ctx.closePath()

            ctx.fill()
        }

        duration.after("draw crops")


        /* Draw the signs */
        if (monitor.signs.size > 0) {

            if (this.nothingSignImage === undefined) {
                this.nothingSignImage = this.images.get(SIGN_NOTHING)
            }
            if (this.waterSignImage === undefined) {
                this.waterSignImage = this.images.get(SIGN_WATER)
            }
            if (this.coalSignLargeImage === undefined) {
                this.coalSignLargeImage = this.images.get(SIGN_COAL_LARGE)
            }
            if (this.coalSignMediumImage === undefined) {
                this.coalSignMediumImage = this.images.get(SIGN_COAL_MEDIUM)
            }
            if (this.coalSignalSmallImage === undefined) {
                this.coalSignalSmallImage = this.images.get(SIGN_COAL_SMALL)
            }
            if (this.ironSignLargeImage === undefined) {
                this.ironSignLargeImage = this.images.get(SIGN_IRON_LARGE)
            }
            if (this.ironSignMediumImage === undefined) {
                this.ironSignMediumImage = this.images.get(SIGN_IRON_MEDIUM)
            }
            if (this.ironSignalSmallImage === undefined) {
                this.ironSignalSmallImage = this.images.get(SIGN_IRON_SMALL)
            }
            if (this.goldSignLargeImage === undefined) {
                this.goldSignLargeImage = this.images.get(SIGN_GOLD_LARGE)
            }
            if (this.goldSignMediumImage === undefined) {
                this.goldSignMediumImage = this.images.get(SIGN_GOLD_MEDIUM)
            }
            if (this.goldSignalSmallImage === undefined) {
                this.goldSignalSmallImage = this.images.get(SIGN_GOLD_SMALL)
            }
            if (this.graniteSignLargeImage === undefined) {
                this.graniteSignLargeImage = this.images.get(SIGN_GRANITE_LARGE)
            }
            if (this.graniteSignMediumImage === undefined) {
                this.graniteSignMediumImage = this.images.get(SIGN_GRANITE_MEDIUM)
            }
            if (this.graniteSignalSmallImage === undefined) {
                this.graniteSignalSmallImage = this.images.get(SIGN_GRANITE_SMALL)
            }
        }

        for (const [id, sign] of monitor.signs) {

            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(sign)

            let signImage

            if (!sign.type) {
                signImage = this.nothingSignImage
            } else if (sign.type === "coal" && sign.amount === "LARGE") {
                signImage = this.coalSignLargeImage
            } else if (sign.type === "coal" && sign.amount === "MEDIUM") {
                signImage = this.coalSignMediumImage
            } else if (sign.type === "coal" && sign.amount === "SMALL") {
                signImage = this.coalSignalSmallImage
            } else if (sign.type === "iron" && sign.amount === "LARGE") {
                signImage = this.ironSignLargeImage
            } else if (sign.type === "iron" && sign.amount === "MEDIUM") {
                signImage = this.ironSignMediumImage
            } else if (sign.type === "iron" && sign.amount === "SMALL") {
                signImage = this.ironSignalSmallImage
            } else if (sign.type === "stone" && sign.amount === "LARGE") {
                signImage = this.graniteSignLargeImage
            } else if (sign.type === "stone" && sign.amount === "MEDIUM") {
                signImage = this.graniteSignMediumImage
            } else if (sign.type === "stone" && sign.amount === "SMALL") {
                signImage = this.graniteSignalSmallImage
            } else if (sign.type === "gold" && sign.amount === "LARGE") {
                signImage = this.goldSignLargeImage
            } else if (sign.type === "gold" && sign.amount === "MEDIUM") {
                signImage = this.goldSignMediumImage
            } else if (sign.type === "gold" && sign.amount === "SMALL") {
                signImage = this.goldSignalSmallImage
            } else if (sign.type === "water") {
                signImage = this.waterSignImage
            }

            if (signImage) {
                ctx.drawImage(signImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 0.5 * scaleY)
            } else {

                let fillColor = "brown"

                if (sign.type) {
                    const colorLookup = signToColor.get(sign.type)

                    if (colorLookup) {
                        fillColor = colorLookup
                    }
                }

                ctx.fillStyle = fillColor

                ctx.fillRect(screenPoint.x - 5, screenPoint.y - 5, 10, 10)

                console.log(sign)
            }
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
                ctx.drawImage(stoneImage, Math.floor(screenPoint.x), Math.floor(screenPoint.y), Math.floor(2 * this.props.scale), Math.floor(3 * scaleY))
            }
        }

        duration.after("draw stones")

        /* Draw wild animals */
        let fallbackWorkerImage = this.images.get("worker.png")
        for (const [id, animal] of monitor.wildAnimals) {
            if (animal.betweenPoints && animal.previous && animal.next) {

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

                point.y -= scaleY

                const direction = getDirectionForWalkingWorker(animal.next, animal.previous)

                const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                if (this.animationIndex % 100 === 0) {
                    console.log("moving")
                    console.log(direction)
                    console.log(animal)
                    console.log(animationImage)
                }

                if (animationImage) {
                    ctx.drawImage(animationImage, point.x, point.y)
                } else if (fallbackWorkerImage) {
                    ctx.drawImage(fallbackWorkerImage, point.x, point.y, 0.25 * this.props.scale, 1.15 * scaleY)
                }

            } else {

                if (animal.x < minXInGame || animal.x > maxXInGame || animal.y < minYInGame || animal.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(animal)

                screenPoint.y -= scaleY

                if (animal.previous) {
                    const direction = getDirectionForWalkingWorker(animal, animal.previous)

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, 0, animal.percentageTraveled)

                    if (animationImage) {
                        ctx.drawImage(animationImage, screenPoint.x, screenPoint.y)
                    } else if (fallbackWorkerImage) {
                        ctx.drawImage(fallbackWorkerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
                    }

                    if (this.animationIndex % 100 === 0) {
                        console.log("not moving. previous exists")
                        console.log(direction)
                        console.log(animal)
                        console.log(animationImage)
                    }

                } else {
                    const direction = 'EAST'

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, 0, animal.percentageTraveled)

                    if (this.animationIndex % 100 === 0) {
                        console.log("not moving. no previous")
                        console.log(direction)
                        console.log(animal)
                        console.log(animationImage)
                    }

                    if (animationImage) {
                        ctx.drawImage(animationImage, screenPoint.x, screenPoint.y)
                    } else if (fallbackWorkerImage) {
                        ctx.drawImage(fallbackWorkerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
                    }
                }
            }
        }

        duration.after("draw wild animals")

        /* Draw workers */
        let workerImage = this.images.get("worker.png")

        for (const [id, worker] of monitor.workers) {

            let materialColor = 'black'

            if (worker.cargo) {
                const color = materialToColor.get(worker.cargo)

                if (color) {
                    materialColor = color
                }
            }

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

                const direction = getDirectionForWalkingWorker(worker.next, worker.previous)

                const animationImage = romanWorkers.get(worker.type)?.getAnimationFrame(direction, this.animationIndex, worker.percentageTraveled)

                if (animationImage) {
                    ctx.drawImage(animationImage, point.x, point.y)
                } else if (workerImage) {
                    ctx.drawImage(workerImage, point.x, point.y, 0.25 * this.props.scale, 1.15 * scaleY)
                }

                if (worker.cargo) {
                    ctx.fillStyle = materialColor

                    ctx.fillRect(point.x + 0.15 * this.props.scale, point.y + 0.5 * scaleY, 0.2 * this.props.scale, 0.3 * scaleY)
                }

            } else {

                if (worker.x < minXInGame || worker.x > maxXInGame || worker.y < minYInGame || worker.y > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(worker)

                screenPoint.y -= scaleY

                if (worker.previous) {
                    const direction = getDirectionForWalkingWorker(worker, worker.previous)

                    const animationImage = romanWorkers.get(worker.type)?.getAnimationFrame(direction, 0, worker.percentageTraveled)

                    if (animationImage) {
                        ctx.drawImage(animationImage, screenPoint.x, screenPoint.y)
                    } else if (workerImage) {
                        ctx.drawImage(workerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
                    }
                } else {
                    if (workerImage) {
                        ctx.drawImage(workerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
                    }
                }

                if (worker.cargo) {
                    ctx.fillStyle = materialColor

                    ctx.fillRect(screenPoint.x + 0.15 * this.props.scale, screenPoint.y + 0.5 * scaleY, 0.2 * this.props.scale, 0.3 * scaleY)
                }
            }
        }

        duration.after("draw workers")

        /* Draw flags */
        let flagImage = this.images.get(FLAG_FILE)

        let flagCount = 0
        for (const [id, flag] of monitor.flags) {

            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const screenPoint = this.gamePointToScreenPoint(flag)

            /* Draw the flag slightly above the point */
            screenPoint.y -= 29
            screenPoint.x = screenPoint.x - 2

            const fallback = flagImage

            flagImage = romanNormalFlagAnimation.getAnimationElement(this.animationIndex, flagCount)

            if (flagImage === undefined) {
                flagImage = fallback
            }

            if (flagImage) {
                ctx.drawImage(flagImage, screenPoint.x, screenPoint.y, 10, 30)
            }

            if (flag.stackedCargo) {

                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {

                    const cargo = flag.stackedCargo[i]
                    const color = materialToColor.get(cargo)

                    if (color === undefined) {
                        continue
                    }

                    ctx.fillStyle = color

                    ctx.fillRect(screenPoint.x - 15, screenPoint.y - 10 * i + 35, 10, 7)
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {

                        const cargo = flag.stackedCargo[i]
                        const color = materialToColor.get(cargo)

                        if (color === undefined) {
                            continue
                        }

                        ctx.fillStyle = color

                        ctx.fillRect(screenPoint.x + 4, screenPoint.y - 10 * (i - 4) + 45, 10, 7)
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {

                        const cargo = flag.stackedCargo[i]
                        const color = materialToColor.get(cargo)

                        if (color === undefined) {
                            continue
                        }

                        ctx.fillStyle = color

                        ctx.fillRect(screenPoint.x + 17, screenPoint.y - 10 * (i - 4) + 35, 10, 7)
                    }
                }
            }
        }

        duration.after("draw flags")


        /* Draw available construction */

        if (this.props.showAvailableConstruction) {

            if (largeHouseAvailableImage === undefined) {
                largeHouseAvailableImage = this.images.get(AVAILABLE_LARGE_BUILDING_FILE)
            }
    
            if (mediumHouseAvailableImage === undefined) {
                mediumHouseAvailableImage = this.images.get(AVAILABLE_MEDIUM_BUILDING_FILE)
            }

            if (smallHouseAvailableImage === undefined) {
                smallHouseAvailableImage = this.images.get(AVAILABLE_SMALL_BUILDING_FILE)
            }

            if (flagAvailableImage === undefined) {
                flagAvailableImage = this.images.get(AVAILABLE_FLAG_FILE)
            }

            if (mineAvailableImage === undefined) {
                mineAvailableImage = this.images.get(AVAILABLE_MINE_FILE)
            }
    

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

                        ctx.drawImage(largeHouseAvailableImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY), 20, 20)
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

                        ctx.drawImage(mediumHouseAvailableImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY), 20, 20)
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

                        ctx.drawImage(smallHouseAvailableImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY), 20, 20)
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

                        ctx.drawImage(mineAvailableImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY), 20, 20)
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

                    if (flagAvailableImage) {
                        const offsetX = 4
                        const offsetY = 15

                        ctx.drawImage(flagAvailableImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY), 15, 15)
                    } else {
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
                } else if (house.productivity !== undefined) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

                ctx.fillText(houseTitle, screenPoint.x, screenPoint.y - 5)
            }
        }

        duration.after("draw house titles")


        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {
            this.props.possibleRoadConnections.forEach(
                (point, _index) => {

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
        if (selectedImage === undefined) {
            selectedImage = this.images.get(SELECTED_POINT)
        }

        if (this.props.selectedPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.props.selectedPoint)

            if (selectedImage) {
                const offsetX = selectedImage.width / 2
                const offsetY = selectedImage.height / 2

                ctx.drawImage(selectedImage, Math.floor(screenPoint.x - offsetX), Math.floor(screenPoint.y - offsetY))
            } else {

                ctx.fillStyle = 'yellow'
                ctx.strokeStyle = 'black'

                ctx.beginPath()
                ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI)
                ctx.closePath()

                ctx.fill()
                ctx.stroke()
            }
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

        if (this.animationIndex === 1000) {
            this.animationIndex = 0
        } else {
            this.animationIndex = this.animationIndex + 1
        }

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

