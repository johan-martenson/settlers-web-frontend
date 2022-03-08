import React, { Component } from 'react'
import { materialToColor, Point, RoadInformation, signToColor, Size, VegetationIntegers, VEGETATION_INTEGERS, WildAnimalType, WorkerType } from './api'
import { Duration } from './duration'
import './game_render.css'
import { Filename, houseImageMap, houseUnderConstructionImageMap } from './images'
import { listenToDiscoveredPoints, listenToRoads, monitor, TileBelow, TileDownRight } from './monitor'
import { shaded_repeated_fragment_shader, vert } from './shaders'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from './stats'
import { AnimationUtil, camelCaseToWords, Direction, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, getTimestamp, intToVegetationColor, loadImage, loadImageNg as loadImageAsync, normalize, Point3D, same, sumVectors, Vector, vegetationToInt, WorkerAnimation } from './utils'
import { PointMapFast } from './util_types'

export interface ScreenPoint {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD'

interface MapRenderInformation {
    coordinates: number[] //x, y
    normals: number[] //x, y, z
    textureMapping: number[]
}

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

const TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE = "assets/nature/terrain/greenland/greenland-texture.png"

interface BelowAndDownRight {
    below: number[]
    downRight: number[]
}
const vegetationToTextureMapping: Map<VegetationIntegers, BelowAndDownRight> = new Map()

vegetationToTextureMapping.set(0, { below: [0, 3, 0.5, 2, 1, 3].map(v => v * 48 / 256), downRight: [0, 2, 0.5, 3, 1, 2].map(v => v * 48 / 256) }) // Savannah
vegetationToTextureMapping.set(1, { below: [1, 1, 1.5, 0, 2, 1].map(v => v * 48 / 256), downRight: [1, 0, 1.5, 1, 2, 0].map(v => v * 48 / 256) }) // Mountain 1
vegetationToTextureMapping.set(2, { below: [0, 1, 0.5, 0, 1, 1].map(v => v * 48 / 256), downRight: [0, 0, 0.5, 1, 1, 0].map(v => v * 48 / 256) }) // Snow
vegetationToTextureMapping.set(3, { below: [2, 1, 2.5, 0, 3, 1].map(v => v * 48 / 256), downRight: [2, 0, 2.5, 1, 3, 0].map(v => v * 48 / 256) }) // Swamp
vegetationToTextureMapping.set(4, { below: [1, 1, 1.5, 0, 2, 1].map(v => v * 48 / 256), downRight: [1, 0, 1.5, 1, 2, 0].map(v => v * 48 / 256) }) // Desert 1
vegetationToTextureMapping.set(5, { below: [194, 76, 219, 50, 245, 76].map(v => v / 256), downRight: [194, 77, 219, 101, 245, 77].map(v => v / 256) }) // Water 1
vegetationToTextureMapping.set(6, { below: [194, 76, 219, 50, 245, 76].map(v => v / 256), downRight: [194, 77, 219, 101, 245, 77].map(v => v / 256) }) // Buildable water
vegetationToTextureMapping.set(7, { below: [1, 1, 1.5, 0, 2, 1].map(v => v * 48 / 256), downRight: [1, 0, 1.5, 1, 2, 0].map(v => v * 48 / 256) }) // Desert 2
vegetationToTextureMapping.set(8, { below: [1, 3, 1.5, 2, 2, 3].map(v => v * 48 / 256), downRight: [1, 2, 1.5, 3, 2, 2].map(v => v * 48 / 256) }) // Meadow 1
vegetationToTextureMapping.set(9, { below: [2, 3, 2.5, 2, 3, 3].map(v => v * 48 / 256), downRight: [2, 2, 2.5, 3, 3, 2].map(v => v * 48 / 256) }) // Meadow 2
vegetationToTextureMapping.set(10, { below: [146, 142, 146, 98, 190, 98].map(v => v / 256), downRight: [146, 142, 190, 142, 190, 98].map(v => v / 256) }) // Meadow 3
vegetationToTextureMapping.set(11, { below: [1, 2, 1.5, 1, 2, 2].map(v => v * 48 / 256), downRight: [1, 1, 1.5, 2, 2, 1].map(v => v * 48 / 256) }) // Mountain 2
vegetationToTextureMapping.set(12, { below: [2, 2, 2.5, 1, 3, 2].map(v => v * 48 / 256), downRight: [2, 1, 2.5, 3, 2, 1].map(v => v * 48 / 256) }) // Mountain 3
vegetationToTextureMapping.set(13, { below: [3, 2, 3.5, 1, 4, 2].map(v => v * 48 / 256), downRight: [3, 1, 3.5, 4, 2, 1].map(v => v * 48 / 256) }) // Mountain 4
vegetationToTextureMapping.set(14, { below: [2, 190, 2, 146, 45, 146].map(v => v / 256), downRight: [2, 190, 45, 146, 45, 190].map(v => v / 256) }) // Steppe
vegetationToTextureMapping.set(15, { below: [3, 1, 3.5, 0, 4, 1].map(v => v * 48 / 256), downRight: [3, 0, 3.5, 1, 4, 0].map(v => v * 48 / 256) }) // Flower meadow
vegetationToTextureMapping.set(16, { below: [192, 132, 219, 104, 247, 132].map(v => v / 256), downRight: [192, 133, 220, 160, 246, 132].map(v => v / 256) }) // Lava 1
vegetationToTextureMapping.set(17, { below: [2, 4, 2.5, 3, 3, 4].map(v => v * 48 / 256), downRight: [2, 3, 2.5, 4, 3, 3].map(v => v * 48 / 256) }) // Magenta
vegetationToTextureMapping.set(18, { below: [1, 4, 1.5, 3, 2, 4].map(v => v * 48 / 256), downRight: [1, 3, 1.5, 4, 2, 3].map(v => v * 48 / 256) }) // Mountain meadow
vegetationToTextureMapping.set(19, { below: [194, 76, 219, 50, 245, 76].map(v => v / 256), downRight: [194, 77, 219, 101, 245, 77].map(v => v / 256) }) // Water 2
vegetationToTextureMapping.set(20, { below: [192, 132, 219, 104, 247, 132].map(v => v / 256), downRight: [192, 133, 220, 160, 246, 132].map(v => v / 256) }) // Lava 2
vegetationToTextureMapping.set(21, { below: [192, 132, 219, 104, 247, 132].map(v => v / 256), downRight: [192, 133, 220, 160, 246, 132].map(v => v / 256) }) // Lava 3
vegetationToTextureMapping.set(22, { below: [192, 132, 219, 104, 247, 132].map(v => v / 256), downRight: [192, 133, 220, 160, 246, 132].map(v => v / 256) }) // Lava 4
vegetationToTextureMapping.set(23, { below: [1, 1, 1.5, 0, 2, 1].map(v => v * 48 / 256), downRight: [1, 0, 1.5, 1, 2, 0].map(v => v * 48 / 256) }) // Buildable mountain

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

let overlayCtx: CanvasRenderingContext2D | null = null

let selectedImage: HTMLImageElement | undefined

let largeHouseAvailableImage: HTMLImageElement | undefined
let mediumHouseAvailableImage: HTMLImageElement | undefined
let smallHouseAvailableImage: HTMLImageElement | undefined
let flagAvailableImage: HTMLImageElement | undefined
let mineAvailableImage: HTMLImageElement | undefined

let plannedHouseImage: HTMLImageElement | undefined

let deadTreeImage: HTMLImageElement | undefined

interface RenderInformation {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private overlayCanvasRef = React.createRef<HTMLCanvasElement>()
    private lightVector: Vector
    private debuggedPoint: Point | undefined
    private previousTimestamp?: number
    private terrainCanvasRef = React.createRef<HTMLCanvasElement>()
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

    private animationIndex: number = 0
    private mapRenderInformation?: MapRenderInformation
    private gl?: WebGL2RenderingContext
    private prog?: WebGLProgram

    private terrainCoordinatesBuffer?: WebGLBuffer | null
    private terrainNormalsBuffer?: WebGLBuffer | null
    private terrainTextureMappingBuffer?: WebGLBuffer | null

    private roadCoordinatesBuffer?: WebGLBuffer | null
    private roadNormalsBuffer?: WebGLBuffer | null
    private roadTextureMappingBuffer?: WebGLBuffer | null
    private roadRenderInformation?: RenderInformation
    private normals: PointMapFast<Vector>
    private uLightVector?: WebGLUniformLocation | null
    private uScale?: WebGLUniformLocation | null
    private uOffset?: WebGLUniformLocation | null
    private uSampler?: WebGLUniformLocation | null
    private uScreenWidth?: WebGLUniformLocation | null
    private uScreenHeight?: WebGLUniformLocation | null
    private coordAttributeLocation?: number
    private normalAttributeLocation?: number
    private textureMappingAttributeLocation?: number

    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.getHeightForPoint = this.getHeightForPoint.bind(this)
        this.pointToPoint3D = this.pointToPoint3D.bind(this)

        this.images = new Map()
        this.normals = new PointMapFast()

        this.loadImages(["tree.png", "stone.png", "worker.png",
            AVAILABLE_LARGE_BUILDING_FILE, AVAILABLE_MEDIUM_BUILDING_FILE, AVAILABLE_SMALL_BUILDING_FILE, AVAILABLE_MINE_FILE, AVAILABLE_FLAG_FILE,
            SIGN_IRON_SMALL, SIGN_IRON_MEDIUM, SIGN_IRON_LARGE,
            SIGN_COAL_SMALL, SIGN_COAL_MEDIUM, SIGN_COAL_LARGE,
            SIGN_GRANITE_SMALL, SIGN_GRANITE_MEDIUM, SIGN_GRANITE_LARGE,
            SIGN_GOLD_SMALL, SIGN_GOLD_MEDIUM, SIGN_GOLD_LARGE,
            SIGN_WATER, SIGN_NOTHING,
            SELECTED_POINT,
            PLANNED_HOUSE_IMAGE_FILE,
            DEAD_TREE_IMAGE_FILE
        ])

        this.loadImages(houseImageMap.values())
        this.loadImages(houseUnderConstructionImageMap.values())

        /* Define the light vector */
        this.lightVector = normalize({ x: -1, y: 1, z: -1 })

        addVariableIfAbsent("fps")

        this.state = {}
    }

    componentDidUpdate(prevProps: GameCanvasProps): void {
        if (prevProps.cursorState !== this.props.cursorState && this?.terrainCanvasRef?.current) {

            if (this.props.cursorState === 'DRAGGING') {
                this.terrainCanvasRef.current.style.cursor = "url(assets/ui-elements/dragging.png), pointer"
            } else if (this.props.cursorState === 'BUILDING_ROAD') {
                this.terrainCanvasRef.current.style.cursor = "url(assets/ui-elements/building-road.png), pointer"
            } else {
                this.terrainCanvasRef.current.style.cursor = "pointer"
            }
        }
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
        return this.props.onKeyDown !== nextProps.onKeyDown
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

        /* Subscribe for new discovered points */
        listenToDiscoveredPoints((points) => {

            // Update the calculated normals
            this.calculateNormalsForEachPoint(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

            // Update the map rendering buffers
            if (this.gl && this.prog) {
                if (this.terrainCoordinatesBuffer !== undefined && this.terrainNormalsBuffer !== undefined && this.terrainTextureMappingBuffer !== undefined) {

                    const mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

                    this.mapRenderInformation = mapRenderInformation

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainCoordinatesBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.coordinates), this.gl.STATIC_DRAW);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainNormalsBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.normals), this.gl.STATIC_DRAW);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainTextureMappingBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.textureMapping), this.gl.STATIC_DRAW)
                }
            }
        })

        /* Subscribe for added and removed roads */
        listenToRoads(roads => {

            if (this.gl !== undefined && this.prog !== undefined &&
                this.roadCoordinatesBuffer !== undefined && this.roadNormalsBuffer !== undefined && this.roadTextureMappingBuffer !== undefined) {

                this.roadRenderInformation = this.prepareToRenderRoads(roads)

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.coordinates), this.gl.STATIC_DRAW)

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadNormalsBuffer)
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.normals), this.gl.STATIC_DRAW)

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.textureMapping), this.gl.STATIC_DRAW)
            }
        })

        /* Put together the render information from the discovered tiles */
        this.mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)


        /*  Initialize webgl2 */
        if (this.terrainCanvasRef?.current) {
            const canvas = this.terrainCanvasRef.current

            // Set the resolution
            canvas.width = document.documentElement.scrollWidth
            canvas.height = document.documentElement.scrollHeight

            const gl = canvas.getContext("webgl2", { alpha: false })

            if (gl) {

                // Create and compile the vertex shader
                const vertSh = gl.createShader(gl.VERTEX_SHADER)

                if (vertSh) {
                    gl.shaderSource(vertSh, vert)
                    gl.compileShader(vertSh)

                    const shaderCompileLog = gl.getShaderInfoLog(vertSh)

                    if (shaderCompileLog === "") {
                        console.info("Vertex shader compiled correctly")
                    } else {
                        console.error(shaderCompileLog)
                    }
                } else {
                    console.log("Failed to get the vertex shader")
                }

                // Create and compile the fragment shader
                const fragSh = gl.createShader(gl.FRAGMENT_SHADER)

                if (fragSh) {
                    gl.shaderSource(fragSh, shaded_repeated_fragment_shader)
                    gl.compileShader(fragSh)

                    const shaderCompileLog = gl.getShaderInfoLog(fragSh)

                    if (shaderCompileLog === "") {
                        console.info("Fragment shader compiled correctly")
                    } else {
                        console.error(gl.getShaderInfoLog(fragSh))
                    }
                } else {
                    console.log("Failed to get fragment shader")
                }

                // Link the program and pass it to GPU
                const prog = gl.createProgram()

                if (prog && vertSh && fragSh) {
                    gl.attachShader(prog, vertSh)
                    gl.attachShader(prog, fragSh)
                    gl.linkProgram(prog)
                    gl.useProgram(prog)
                    gl.viewport(0, 0, canvas.width, canvas.height)

                    const maxNumberTriangles = 500 * 500 * 2 // monitor.allTiles.keys.length * 2

                    // Get handles
                    this.uLightVector = gl.getUniformLocation(prog, "u_light_vector")
                    this.uScale = gl.getUniformLocation(prog, "u_scale")
                    this.uOffset = gl.getUniformLocation(prog, "u_offset")
                    this.uSampler = gl.getUniformLocation(prog, 'u_sampler')
                    this.uScreenWidth = gl.getUniformLocation(prog, "u_screen_width")
                    this.uScreenHeight = gl.getUniformLocation(prog, "u_screen_height")
                    this.coordAttributeLocation = gl.getAttribLocation(prog, "a_coords")
                    this.normalAttributeLocation = gl.getAttribLocation(prog, "a_normal")
                    this.textureMappingAttributeLocation = gl.getAttribLocation(prog, "a_texture_mapping")

                    // Set up the buffer attributes
                    this.terrainCoordinatesBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainCoordinatesBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * maxNumberTriangles * 3 * 2, gl.STATIC_DRAW)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mapRenderInformation.coordinates), gl.STATIC_DRAW)

                    this.terrainNormalsBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainNormalsBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * maxNumberTriangles * 3 * 3, gl.STATIC_DRAW)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mapRenderInformation.normals), gl.STATIC_DRAW)

                    this.terrainTextureMappingBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainTextureMappingBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * maxNumberTriangles * 3 * 2, gl.STATIC_DRAW)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mapRenderInformation.textureMapping), gl.STATIC_DRAW)

                    this.roadCoordinatesBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW)

                    this.roadNormalsBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.roadNormalsBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW)

                    this.roadTextureMappingBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW)

                    // Load the image atlas for terrain and roads
                    const imageAtlasTerrainAndRoads = await loadImageAsync(TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE)

                    // Create the road texture
                    const textureTerrainAndRoadAtlas = makeTextureFromImage(gl, imageAtlasTerrainAndRoads)

                    // Bind the terrain and road image atlas texture
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, textureTerrainAndRoadAtlas)

                    this.gl = gl
                    this.prog = prog
                } else {
                    console.log("Failed to get prog")
                }

            } else {
                console.log(gl)
            }

        } else {
            console.log("No canvasRef.current")
        }

        /* Create the rendering thread if it doesn't exist */
        this.renderGame()
    }

    renderGame(): void {

        const duration = new Duration("GameRender::renderGame")

        /* Ensure that the reference to the overlay canvas is set */
        if (!this.overlayCanvasRef.current) {
            console.error("The overlay canvas reference is not set properly")

            return
        }

        /* Get the rendering context for the overlay canvas */
        if (overlayCtx === null) {
            overlayCtx = this.overlayCanvasRef.current.getContext("2d")
        }

        /* Ensure that the canvas rendering context is valid */
        if (!overlayCtx) {
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


        if (oncePerNewSelectionPoint && this.props.selectedPoint !== undefined) {
            console.log({
                title: "Information about selection point",
                point: this.props.selectedPoint,
                vegetationBelow: monitor.allTiles.get(this.props.selectedPoint)?.below,
                vegetationDownRight: monitor.allTiles.get(this.props.selectedPoint)?.downRight
            })
        }

        duration.after("init")

        /* Do the accelerated drawing of terrain and roads */
        if (this.gl && this.prog && this.mapRenderInformation &&
            this.uScreenWidth !== undefined &&
            this.uScreenHeight !== undefined &&
            this.uLightVector !== undefined &&
            this.uScale !== undefined &&
            this.uOffset !== undefined &&
            this.coordAttributeLocation !== undefined &&
            this.normalAttributeLocation !== undefined &&
            this.textureMappingAttributeLocation !== undefined &&
            this.uSampler !== undefined) {

            const gl = this.gl

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            // Set screen width and height
            gl.uniform1f(this.uScreenWidth, width)
            gl.uniform1f(this.uScreenHeight, height)

            // Set the light vector
            const lightVector = [-1, 1, -1]
            gl.uniform3fv(this.uLightVector, lightVector)

            // Set the current values for the scale, offset and the sampler
            gl.uniform2f(this.uScale, this.props.scale, this.props.scale)
            gl.uniform2fv(this.uOffset, [this.props.translateX, this.props.translateY])

            // Fill the screen with black color
            gl.clearColor(0.0, 0.0, 0.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            // Draw each terrain
            if (this.terrainCoordinatesBuffer !== undefined && this.terrainNormalsBuffer !== undefined && this.terrainTextureMappingBuffer !== undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainCoordinatesBuffer)
                gl.vertexAttribPointer(this.coordAttributeLocation, 2, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.coordAttributeLocation)

                gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainNormalsBuffer)
                gl.vertexAttribPointer(this.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.normalAttributeLocation)

                gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainTextureMappingBuffer)
                gl.vertexAttribPointer(this.textureMappingAttributeLocation, 2, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.textureMappingAttributeLocation)

                if (this.mapRenderInformation) {
                    gl.uniform1i(this.uSampler, 0)

                    // mode, offset (nr vertices), count (nr vertices)
                    gl.drawArrays(gl.TRIANGLES, 0, this.mapRenderInformation.coordinates.length / 2)
                }
            }

            // Draw the roads
            if (this.roadRenderInformation !== undefined &&
                this.roadCoordinatesBuffer !== undefined && this.roadNormalsBuffer !== undefined && this.roadTextureMappingBuffer !== undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
                gl.vertexAttribPointer(this.coordAttributeLocation, 2, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.coordAttributeLocation)

                gl.bindBuffer(gl.ARRAY_BUFFER, this.roadNormalsBuffer)
                gl.vertexAttribPointer(this.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.normalAttributeLocation)

                gl.bindBuffer(gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
                gl.vertexAttribPointer(this.textureMappingAttributeLocation, 2, gl.FLOAT, false, 0, 0)
                gl.enableVertexAttribArray(this.textureMappingAttributeLocation)

                gl.uniform1i(this.uSampler, 0)

                gl.drawArrays(gl.TRIANGLES, 0, this.roadRenderInformation?.coordinates.length / 2)
            }
        }

        duration.after("draw terrain and roads")


        ctx = overlayCtx


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

            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
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

        duration.after("draw dead trees")

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

                let direction: Direction = "WEST"

                if (worker.previous) {
                    direction = getDirectionForWalkingWorker(worker, worker.previous)
                }

                const animationImage = romanWorkers.get(worker.type)?.getAnimationFrame(direction, 0, worker.percentageTraveled)

                if (animationImage) {
                    ctx.drawImage(animationImage, screenPoint.x, screenPoint.y)
                } else if (workerImage) {
                    ctx.drawImage(workerImage, screenPoint.x, screenPoint.y, 0.25 * this.props.scale, 1.15 * scaleY)
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

                if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
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

                                if (!this.state.hoverPoint || this.state.hoverPoint.x !== hoverPoint.x || this.state.hoverPoint.y !== hoverPoint.y) {

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

    prepareToRenderFromTiles(tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>): MapRenderInformation {

        // Count number of triangles per type of terrain and create a list of triangle information for each terrain
        const coordinates: number[] = []
        const normals: number[] = []
        const textureMapping: number[] = []

        tilesBelow.forEach(tileBelow => {

            const point = tileBelow.pointAbove
            const pointDownLeft = getPointDownLeft(point)
            const pointDownRight = getPointDownRight(point)

            const normal = this.normals.get(point)
            const normalDownLeft = this.normals.get(pointDownLeft)
            const normalDownRight = this.normals.get(pointDownRight)

            const terrainBelow = tileBelow.vegetation

            if (VEGETATION_INTEGERS.indexOf(terrainBelow) === -1) {
                console.log("UNKNOWN TERRAIN: " + terrainBelow)
            }

            // Add the coordinates for each triangle to the coordinates buffer
            Array.prototype.push.apply(
                coordinates,
                [
                    point.x, point.y,
                    pointDownLeft.x, pointDownLeft.y,
                    pointDownRight.x, pointDownRight.y,
                ])

            // Add the normal for each triangle to the normals buffer
            if (normal !== undefined && normalDownLeft !== undefined && normalDownRight !== undefined) {
                Array.prototype.push.apply(
                    normals,
                    [
                        normal.x, normal.y, normal.z,
                        normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
                        normalDownRight.x, normalDownRight.y, normalDownRight.z
                    ])
            } else {

                // Place dummy normals
                Array.prototype.push.apply(
                    normals,
                    [
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                    ])
            }

            // Add the texture mapping for the triangles
            //    --  Texture coordinates go from 0, 0 to 1, 1.
            //    --  To map to pixel coordinates:
            //            texcoordX = pixelCoordX / (width  - 1)
            //            texcoordY = pixelCoordY / (height - 1)
            const textureMappingToAdd = vegetationToTextureMapping.get(terrainBelow)?.below

            if (textureMappingToAdd !== undefined) {
                Array.prototype.push.apply(textureMapping, textureMappingToAdd)
            } else {
                console.error("No matching texture mapping for " + terrainBelow)

                Array.prototype.push.apply(textureMapping, [0, 0, 0.5, 1, 1, 0]) // Place dummy texture mapping
            }
        })


        tilesDownRight.forEach(tile => {

            const point = tile.pointLeft
            const pointDownRight = getPointDownRight(point)
            const pointRight = getPointRight(point)

            const normal = this.normals.get(point)
            const normalDownRight = this.normals.get(pointDownRight)
            const normalRight = this.normals.get(pointRight)

            const terrainDownRight = tile.vegetation

            if (VEGETATION_INTEGERS.indexOf(terrainDownRight) === -1) {
                console.log("UNKNOWN TERRAIN: " + terrainDownRight)
            }

            // Add the coordinates for each triangle to the coordinates buffer
            Array.prototype.push.apply(
                coordinates,
                [
                    point.x, point.y,
                    pointDownRight.x, pointDownRight.y,
                    pointRight.x, pointRight.y,
                ]
            )

            // Add the normals for each triangle to the normals buffer
            if (normal !== undefined && normalDownRight !== undefined && normalRight !== undefined) {
                Array.prototype.push.apply(
                    normals,
                    [
                        normal.x, normal.y, normal.z,
                        normalDownRight.x, normalDownRight.y, normalDownRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ]
                )
            } else {

                // Place dummy normals
                Array.prototype.push.apply(
                    normals,
                    [
                        0, 0, 1,
                        0, 0, 1,
                        0, 0, 1,
                    ]
                )
            }

            // Add the texture mapping for the triangles
            //    --  Texture coordinates go from 0, 0 to 1, 1.
            //    --  To map to pixel coordinates:
            //            texcoordX = pixelCoordX / (width  - 1)
            //            texcoordY = pixelCoordY / (height - 1)
            const textureMappingToAdd = vegetationToTextureMapping.get(terrainDownRight)?.downRight

            if (textureMappingToAdd !== undefined) {
                Array.prototype.push.apply(textureMapping, textureMappingToAdd)
            } else {
                console.error("No matching texture mapping for " + terrainDownRight)

                Array.prototype.push.apply(textureMapping, [0, 1, 0.5, 0, 1, 1]) // Place dummy texture mapping
            }
        })

        return {
            coordinates: coordinates,
            normals: normals,
            textureMapping: textureMapping
        }
    }

    calculateNormalsForEachPoint(tilesBelow: Iterable<TileBelow>, tilesDownRight: Iterable<TileDownRight>): void {

        // Calculate the normals for each triangle
        const straightBelowNormals = new PointMapFast<Vector>()
        const downRightNormals = new PointMapFast<Vector>()

        for (const terrainAtPoint of tilesBelow) {

            const point = terrainAtPoint.pointAbove
            const height = terrainAtPoint.heightAbove

            const point3d = { x: point.x, y: point.y, z: height }

            const pointDownLeft = getPointDownLeft(point)
            const pointDownRight = getPointDownRight(point)

            const pointDownLeft3d = { x: pointDownLeft.x, y: pointDownLeft.y, z: terrainAtPoint.heightDownLeft }
            const pointDownRight3d = { x: pointDownRight.x, y: pointDownRight.y, z: terrainAtPoint.heightDownRight }

            straightBelowNormals.set(point, getNormalForTriangle(point3d, pointDownLeft3d, pointDownRight3d))
        }

        for (const terrainAtPoint of tilesDownRight) {

            const point = terrainAtPoint.pointLeft
            const height = terrainAtPoint.heightLeft

            const point3d = { x: point.x, y: point.y, z: height }

            const pointDownRight = getPointDownRight(point)
            const pointRight = getPointRight(point)

            const pointDownRight3d = { x: pointDownRight.x, y: pointDownRight.y, z: terrainAtPoint.heightDown }
            const pointRight3d = { x: pointRight.x, y: pointRight.y, z: terrainAtPoint.heightRight }

            downRightNormals.set(point, getNormalForTriangle(point3d, pointDownRight3d, pointRight3d))
        }

        // Calculate the normal for each point
        for (let point of monitor.discoveredPoints) {
            const normals = [
                straightBelowNormals.get(getPointUpLeft(point)),
                downRightNormals.get(getPointUpLeft(point)),
                straightBelowNormals.get(getPointUpRight(point)),
                downRightNormals.get(point),
                straightBelowNormals.get(point),
                downRightNormals.get(getPointLeft(point))
            ]

            // Calculate the combined normal as the average of the normal for the surrounding triangles
            let vectors: Vector[] = []

            for (let normal of normals) {
                if (normal) {
                    vectors.push(normal)
                }
            }

            const combinedVector = vectors.reduce(sumVectors)

            const normalized = normalize(combinedVector)

            this.normals.set(point, normalized)
        }
    }

    prepareToRenderRoads(roads: Iterable<RoadInformation>): RenderInformation {

        // Create the render information for the roads
        let coordinatesList: number[] = []
        let normalsList: number[] = []
        let textureMappinglist: number[] = []

        for (const road of roads) {

            // Iterate through each segment of the road
            let previous: Point | undefined = undefined

            for (const point of road.points) {

                if (previous === undefined) {
                    previous = point

                    continue
                }

                const normalPrevious = this.normals?.get(previous)
                const normalPoint = this.normals?.get(point)

                if (normalPrevious === undefined || normalPoint === undefined) {
                    continue
                }

                // Handle horizontal roads
                if (previous.y === point.y) {

                    Array.prototype.push.apply(
                        coordinatesList,
                        [
                            previous.x, previous.y, previous.x, previous.y + 0.4, point.x, point.y,
                            previous.x, previous.y + 0.4, point.x, point.y, point.x, point.y + 0.4
                        ]
                    )

                    Array.prototype.push.apply(normalsList,
                        [
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPoint.x, normalPoint.y, normalPoint.z
                        ])

                    Array.prototype.push.apply(
                        textureMappinglist,
                        [
                            0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                            0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                        ]
                    )

                    // Handle road up-right
                } else if (previous.x < point.x && previous.y < point.y) {

                    Array.prototype.push.apply(
                        coordinatesList,
                        [
                            previous.x + 0.2, previous.y, previous.x - 0.2, previous.y + 0.4, point.x, point.y,
                            previous.x - 0.2, previous.y + 0.4, point.x, point.y, point.x - 0.2, point.y + 0.4
                        ]
                    )

                    Array.prototype.push.apply(normalsList,
                        [
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPoint.x, normalPoint.y, normalPoint.z
                        ])

                    Array.prototype.push.apply(
                        textureMappinglist,
                        [
                            0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                            0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                        ]
                    )

                    // Handle road down-right
                } else if (previous.x < point.x && previous.y > point.y) {

                    Array.prototype.push.apply(
                        coordinatesList,
                        [
                            previous.x - 0.2, previous.y, previous.x + 0.2, previous.y + 0.4, point.x, point.y,
                            previous.x + 0.2, previous.y + 0.4, point.x, point.y, point.x + 0.2, point.y + 0.4
                        ]
                    )

                    Array.prototype.push.apply(normalsList,
                        [
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPoint.x, normalPoint.y, normalPoint.z
                        ])

                    Array.prototype.push.apply(
                        textureMappinglist,
                        [
                            0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                            0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                        ]
                    )

                    // Handle road up-left
                } else if (previous.x > point.x && previous.y < point.y) {

                    Array.prototype.push.apply(
                        coordinatesList,
                        [
                            previous.x - 0.2, previous.y, previous.x + 0.2, previous.y + 0.4, point.x, point.y,
                            previous.x + 0.2, previous.y + 0.4, point.x, point.y, point.x + 0.2, point.y + 0.4
                        ]
                    )

                    Array.prototype.push.apply(normalsList,
                        [
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPoint.x, normalPoint.y, normalPoint.z
                        ])

                    Array.prototype.push.apply(
                        textureMappinglist,
                        [
                            0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                            0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                        ]
                    )

                    // Handle road down-left
                } else if (previous.x > point.x && previous.y > point.y) {

                    Array.prototype.push.apply(
                        coordinatesList,
                        [
                            previous.x + 0.2, previous.y, previous.x - 0.2, previous.y + 0.4, point.x, point.y,
                            previous.x - 0.2, previous.y + 0.4, point.x, point.y, point.x - 0.2, point.y + 0.4
                        ]
                    )

                    Array.prototype.push.apply(normalsList,
                        [
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPrevious.x, normalPrevious.y, normalPrevious.z,
                            normalPoint.x, normalPoint.y, normalPoint.z,
                            normalPoint.x, normalPoint.y, normalPoint.z
                        ])

                    Array.prototype.push.apply(
                        textureMappinglist,
                        [
                            0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                            0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                        ]
                    )
                }

                previous = point
            }
        }


        return {
            coordinates: coordinatesList,
            normals: normalsList,
            textureMapping: textureMappinglist
        }
    }

}

export { houseImageMap, GameCanvas, intToVegetationColor, vegetationToInt }

function makeTextureFromImage(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture | null {

    const texture = gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    return texture;
}
