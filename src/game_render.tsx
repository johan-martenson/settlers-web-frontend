import React, { Component } from 'react'
import { Direction, Nation, Point, RoadInformation, VegetationIntegers, VEGETATION_INTEGERS, WildAnimalType, WorkerType } from './api/types'
import { Duration } from './duration'
import './game_render.css'
import { listenToDiscoveredPoints, listenToRoads, monitor, TileBelow, TileDownRight } from './api/ws-api'
import { shadowFragmentShader, textureAndLightingFragmentShader, textureAndLightingVertexShader, texturedImageVertexShaderPixelPerfect, textureFragmentShader } from './shaders'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from './stats'
import { AnimalAnimation, BorderImageAtlasHandler, camelCaseToWords, CargoImageAtlasHandler, CropImageAtlasHandler, DecorationsImageAtlasHandler, DrawingInformation, FireAnimation, gamePointToScreenPoint, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, getTimestamp, loadImageNg as loadImageAsync, makeShader, makeTextureFromImage, normalize, resizeCanvasToDisplaySize, RoadBuildingImageAtlasHandler, same, screenPointToGamePoint, ShipImageAtlasHandler, SignImageAtlasHandler, StoneImageAtlasHandler, sumVectors, TreeAnimation, UiElementsImageAtlasHandler, Vector, WorkerAnimation } from './utils'
import { PointMapFast } from './util_types'
import { flagAnimations, houses } from './assets'

export const DEFAULT_SCALE = 35.0

export interface ScreenPoint {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD'

interface ToDraw {
    source: DrawingInformation | undefined
    depth: number
    gamePoint: Point
}

interface MapRenderInformation {
    coordinates: number[] //x, y
    normals: number[] //x, y, z
    textureMapping: number[] //u, v
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
    showFpsCounter?: boolean

    width: number
    height: number

    onPointClicked: ((point: Point) => void)
    onDoubleClick: ((point: Point) => void)
    onKeyDown: ((event: React.KeyboardEvent) => void)
}

interface GameCanvasState {
    hoverPoint?: Point
}

const ANIMATION_PERIOD = 100

const MOUSE_STYLES = new Map<CursorState, string>()

MOUSE_STYLES.set('NOTHING', 'default')
MOUSE_STYLES.set('DRAGGING', 'move')
MOUSE_STYLES.set('BUILDING_ROAD', "url(assets/ui-elements/building-road.png), pointer")

let newRoadCurrentLength = 0

// eslint-disable-next-line
let logOnce = true
let timer: ReturnType<typeof setTimeout>

// Temporary workaround until buildings are correct for all players and the monitor and the backend retrieves player nation correctly
const currentPlayerNation: Nation = "ROMANS"

const cargoImageAtlasHandler = new CargoImageAtlasHandler("assets/")

const roadBuildingImageAtlasHandler = new RoadBuildingImageAtlasHandler("assets/")

const signImageAtlasHandler = new SignImageAtlasHandler("assets/")

const cropsImageAtlasHandler = new CropImageAtlasHandler("assets/")

const uiElementsImageAtlasHandler = new UiElementsImageAtlasHandler("assets/", 0)

const decorationsImageAtlasHandler = new DecorationsImageAtlasHandler("assets/")

const borderImageAtlasHandler = new BorderImageAtlasHandler("assets/")

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
vegetationToTextureMapping.set(12, { below: [2, 2, 2.5, 1, 3, 2].map(v => v * 48 / 256), downRight: [2, 1, 2.5, 2, 3, 1].map(v => v * 48 / 256) }) // Mountain 3
vegetationToTextureMapping.set(13, { below: [3, 2, 3.5, 1, 4, 2].map(v => v * 48 / 256), downRight: [3, 1, 3.5, 2, 4, 1].map(v => v * 48 / 256) }) // Mountain 4
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

const treeAnimations = new TreeAnimation("assets/nature/", 2)
const treeImageAtlasHandler = treeAnimations.getImageAtlasHandler()

const fireAnimations = new FireAnimation("assets/", 2)
const fireImageAtlas = fireAnimations.getImageAtlasHandler()

const stoneImageAtlasHandler = new StoneImageAtlasHandler("assets/")

const animals = new Map<WildAnimalType, AnimalAnimation>()

animals.set("DEER", new AnimalAnimation("assets/nature/animals/", "deer", 10))
animals.set("DEER_2", new AnimalAnimation("assets/nature/animals/", "deer2", 10))
animals.set("DUCK", new AnimalAnimation("assets/nature/animals/", "duck", 10))
animals.set("DUCK_2", new AnimalAnimation("assets/nature/animals/", "duck", 10))
animals.set("FOX", new AnimalAnimation("assets/nature/animals/", "fox", 10))
animals.set("RABBIT", new AnimalAnimation("assets/nature/animals/", "rabbit", 10))
animals.set("SHEEP", new AnimalAnimation("assets/nature/animals/", "sheep", 10))
animals.set("STAG", new AnimalAnimation("assets/nature/animals/", "stag", 10))

const donkeyAnimation = new AnimalAnimation("assets/nature/animals/", "donkey", 10)

const shipImageAtlas = new ShipImageAtlasHandler("assets/")

const workers = new Map<WorkerType, WorkerAnimation>()

workers.set("Farmer", new WorkerAnimation("assets/", "farmer", 10))
workers.set("Fisherman", new WorkerAnimation("assets/", "fisher", 10))
workers.set("Courier", new WorkerAnimation("assets/", "helper", 10))
workers.set("StorageWorker", new WorkerAnimation("assets/", "helper", 10))
workers.set("Hunter", new WorkerAnimation("assets/", "hunter", 10))
workers.set("IronFounder", new WorkerAnimation("assets/", "iron_founder", 10))
workers.set("Metalworker", new WorkerAnimation("assets/", "metalworker", 10))
workers.set("Miller", new WorkerAnimation("assets/", "miller", 10))
workers.set("Miner", new WorkerAnimation("assets/", "miner", 10))
workers.set("Minter", new WorkerAnimation("assets/", "minter", 10))
workers.set("PigBreeder", new WorkerAnimation("assets/", "pig_breeder", 10))
workers.set("Planer", new WorkerAnimation("assets/", "planer", 10))
workers.set("Scout", new WorkerAnimation("assets/", "scout", 10))
workers.set("ShipWright", new WorkerAnimation("assets/", "ship_wright", 10))
workers.set("DonkeyBreeder", new WorkerAnimation("assets/", "donkey_breeder", 10))
workers.set("Butcher", new WorkerAnimation("assets/", "butcher", 10))
workers.set("Builder", new WorkerAnimation("assets/", "builder", 10))
workers.set("Brewer", new WorkerAnimation("assets/", "brewer", 10))
workers.set("Baker", new WorkerAnimation("assets/", "baker", 10))
workers.set("Armorer", new WorkerAnimation("assets/", "armorer", 10))
workers.set("WoodcutterWorker", new WorkerAnimation("assets/", "woodcutter", 10))
workers.set("Forester", new WorkerAnimation("assets/", "forester", 10))
workers.set("SawmillWorker", new WorkerAnimation("assets/", "carpenter", 10))
workers.set("Stonemason", new WorkerAnimation("assets/", "stonemason", 10))
workers.set("Scout", new WorkerAnimation("assets/", "scout", 10))
workers.set("Private", new WorkerAnimation("assets/", "private", 10))
workers.set("Private_first_class", new WorkerAnimation("assets/", "private_first_class", 10))
workers.set("Sergeant", new WorkerAnimation("assets/", "sergeant", 10))
workers.set("Officer", new WorkerAnimation("assets/", "officer", 10))
workers.set("General", new WorkerAnimation("assets/", "general", 10))
workers.set("Geologist", new WorkerAnimation("assets/", "geologist", 10))

const thinCarrierWithCargo = new WorkerAnimation("assets/", "thin-carrier-with-cargo", 10)
const fatCarrierWithCargo = new WorkerAnimation("assets/", "fat-carrier-with-cargo", 10)
const thinCarrierNoCargo = new WorkerAnimation("assets/", "thin-carrier-no-cargo", 10)
const fatCarrierNoCargo = new WorkerAnimation("assets/", "fat-carrier-no-cargo", 10)

interface RenderInformation {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private normalCanvasRef = React.createRef<HTMLCanvasElement>()
    private overlayCanvasRef = React.createRef<HTMLCanvasElement>()
    private lightVector: Vector
    private debuggedPoint: Point | undefined
    private previousTimestamp?: number
    private previous: number
    private overshoot: number

    private animationIndex: number = 0
    private mapRenderInformation?: MapRenderInformation
    private gl?: WebGL2RenderingContext

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
    private groundRenderProgram: WebGLProgram | null
    private drawImageProgram: WebGLProgram | null
    private drawShadowProgram: WebGLProgram | null
    private drawImagePositionLocation?: number
    private drawImageTexcoordLocation?: number
    private drawImageTexCoordBuffer?: WebGLBuffer | null
    private drawImagePositionBuffer?: WebGLBuffer | null
    private drawShadowTexCoordBuffer?: WebGLBuffer | null
    private drawShadowPositionBuffer?: WebGLBuffer | null


    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.updateRoadDrawingBuffers = this.updateRoadDrawingBuffers.bind(this)
        this.onClickOrDoubleClick = this.onClickOrDoubleClick.bind(this)

        this.normals = new PointMapFast()

        /* Define the light vector */
        this.lightVector = normalize({ x: 1, y: 1, z: -1 })

        addVariableIfAbsent("fps")

        this.state = {}

        this.groundRenderProgram = null
        this.drawImageProgram = null
        this.drawShadowProgram = null

        this.previous = performance.now()
        this.overshoot = 0
    }

    componentDidUpdate(prevProps: GameCanvasProps): void {

        if (prevProps.cursorState !== this.props.cursorState && this?.normalCanvasRef?.current) {

            if (this.props.cursorState === 'DRAGGING') {
                //this.normalCanvasRef.current.style.cursor = "url(assets/ui-elements/dragging.png), pointer"
                this.normalCanvasRef.current.style.cursor = 'move'
            } else if (this.props.cursorState === 'BUILDING_ROAD') {
                this.normalCanvasRef.current.style.cursor = "url(assets/ui-elements/building-road.png), pointer"
            } else {
                this.normalCanvasRef.current.style.cursor = "pointer"
            }
        }
    }

    // eslint-disable-next-line
    shouldComponentUpdate(nextProps: GameCanvasProps, nextState: GameCanvasState): boolean {
        return this.props.onKeyDown !== nextProps.onKeyDown ||
            this.props.cursorState !== nextProps.cursorState ||
            this.props?.selectedPoint?.x !== nextProps?.selectedPoint?.x ||
            this.props?.selectedPoint?.y !== nextProps?.selectedPoint?.y
    }

    updateRoadDrawingBuffers(): void {
        console.log("Should update road drawing buffers")

        if (this.gl !== undefined && this.groundRenderProgram !== undefined &&
            this.roadCoordinatesBuffer !== undefined && this.roadNormalsBuffer !== undefined && this.roadTextureMappingBuffer !== undefined) {

            this.roadRenderInformation = this.prepareToRenderRoads(monitor.roads.values())

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.coordinates), this.gl.STATIC_DRAW)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadNormalsBuffer)
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.normals), this.gl.STATIC_DRAW)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.roadRenderInformation.textureMapping), this.gl.STATIC_DRAW)
        } else {
            console.error("Failed to update road drawing buffers. At least one input is undefined")
        }
    }

    async componentDidMount(): Promise<void> {

        /* Load animations */
        const fileLoading = []

        for (const worker of workers.values()) {
            fileLoading.push(worker.load())
        }

        for (const animal of animals.values()) {
            fileLoading.push(animal.load())
        }

        const allThingsToWaitFor = fileLoading.concat([
            treeAnimations.load(),
            flagAnimations.load(),
            houses.load(),
            fireAnimations.load(),
            signImageAtlasHandler.load(),
            uiElementsImageAtlasHandler.load(),
            cropsImageAtlasHandler.load(),
            stoneImageAtlasHandler.load(),
            decorationsImageAtlasHandler.load(),
            donkeyAnimation.load(),
            borderImageAtlasHandler.load(),
            roadBuildingImageAtlasHandler.load(),
            cargoImageAtlasHandler.load(),
            fatCarrierWithCargo.load(),
            thinCarrierWithCargo.load(),
            fatCarrierNoCargo.load(),
            thinCarrierNoCargo.load(),
            shipImageAtlas.load(),
            decorationsImageAtlasHandler.load()
        ])

        const monitorLoadingPromise = monitor.getLoadingPromise()

        if (monitorLoadingPromise !== undefined) {
            allThingsToWaitFor.push(monitorLoadingPromise)
        }

        await Promise.all(allThingsToWaitFor)

        console.log("Download image atlases done")


        /*
           Update the calculated normals -- avoid the race condition by doing this after subscription is established.
           This must be performed before subscribing for road changes
        */
        if (monitor.isGameDataAvailable() && this.normals.size === 0) {
            console.log("Game data available and no normals. Calculating before setting up listeners")

            this.calculateNormalsForEachPoint(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)
        }

        /* Subscribe for new discovered points */
        // eslint-disable-next-line
        listenToDiscoveredPoints((points) => {

            // Update the calculated normals
            this.calculateNormalsForEachPoint(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)
            console.log("New discovered points - calculated normals")

            // Update the map rendering buffers
            if (this.gl && this.groundRenderProgram) {
                if (this.terrainCoordinatesBuffer !== undefined && this.terrainNormalsBuffer !== undefined && this.terrainTextureMappingBuffer !== undefined) {

                    const mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

                    this.mapRenderInformation = mapRenderInformation

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainCoordinatesBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.coordinates), this.gl.STATIC_DRAW)

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainNormalsBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.normals), this.gl.STATIC_DRAW)

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.terrainTextureMappingBuffer)
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mapRenderInformation.textureMapping), this.gl.STATIC_DRAW)
                } else {
                    console.error("At least one render buffer was undefined")
                }
            } else {
                console.error("Gl or ground render pgrogram is undefined")
            }
        })

        console.log("Subscribed to changes in discovered points")

        /* Subscribe for added and removed roads */
        listenToRoads(this.updateRoadDrawingBuffers)

        console.log("Subscribed to changes in roads")

        /* Put together the render information from the discovered tiles */
        this.mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

        /*  Initialize webgl2 */
        if (this.normalCanvasRef?.current) {
            const canvas = this.normalCanvasRef.current

            const gl = canvas.getContext("webgl2", { alpha: false })

            if (gl) {

                // Make textures for the image atlases
                for (const animation of workers.values()) {
                    animation.makeTexture(gl)
                }

                for (const animation of animals.values()) {
                    animation.makeTexture(gl)
                }

                treeAnimations.makeTexture(gl)
                flagAnimations.makeTexture(gl)
                houses.makeTexture(gl)
                fireAnimations.makeTexture(gl)
                signImageAtlasHandler.makeTexture(gl)
                uiElementsImageAtlasHandler.makeTexture(gl)
                cropsImageAtlasHandler.makeTexture(gl)
                stoneImageAtlasHandler.makeTexture(gl)
                decorationsImageAtlasHandler.makeTexture(gl)
                donkeyAnimation.makeTexture(gl)
                borderImageAtlasHandler.makeTexture(gl)
                roadBuildingImageAtlasHandler.makeTexture(gl)
                cargoImageAtlasHandler.makeTexture(gl)
                fatCarrierWithCargo.makeTexture(gl)
                thinCarrierWithCargo.makeTexture(gl)
                fatCarrierNoCargo.makeTexture(gl)
                thinCarrierNoCargo.makeTexture(gl)
                shipImageAtlas.makeTexture(gl)
                decorationsImageAtlasHandler.makeTexture(gl)

                // Create and compile the shaders
                const lightingVertexShader = makeShader(gl, textureAndLightingVertexShader, gl.VERTEX_SHADER)
                const lightingFragmentShader = makeShader(gl, textureAndLightingFragmentShader, gl.FRAGMENT_SHADER)
                const drawImageVertexShader = makeShader(gl, texturedImageVertexShaderPixelPerfect, gl.VERTEX_SHADER)
                const drawImageFragmentShader = makeShader(gl, textureFragmentShader, gl.FRAGMENT_SHADER)
                const drawShadowFragmentShader = makeShader(gl, shadowFragmentShader, gl.FRAGMENT_SHADER)

                // Create the programs
                this.groundRenderProgram = gl.createProgram()
                this.drawImageProgram = gl.createProgram()
                this.drawShadowProgram = gl.createProgram()

                // Setup the program to render the ground
                if (this.groundRenderProgram && lightingVertexShader && lightingFragmentShader) {
                    gl.attachShader(this.groundRenderProgram, lightingVertexShader)
                    gl.attachShader(this.groundRenderProgram, lightingFragmentShader)
                    gl.linkProgram(this.groundRenderProgram)
                    gl.useProgram(this.groundRenderProgram)
                    gl.viewport(0, 0, canvas.width, canvas.height)

                    const maxNumberTriangles = 500 * 500 * 2 // monitor.allTiles.keys.length * 2

                    // Get handles
                    this.uLightVector = gl.getUniformLocation(this.groundRenderProgram, "u_light_vector")
                    this.uScale = gl.getUniformLocation(this.groundRenderProgram, "u_scale")
                    this.uOffset = gl.getUniformLocation(this.groundRenderProgram, "u_offset")
                    this.uSampler = gl.getUniformLocation(this.groundRenderProgram, 'u_sampler')
                    this.uScreenWidth = gl.getUniformLocation(this.groundRenderProgram, "u_screen_width")
                    this.uScreenHeight = gl.getUniformLocation(this.groundRenderProgram, "u_screen_height")
                    this.coordAttributeLocation = gl.getAttribLocation(this.groundRenderProgram, "a_coords")
                    this.normalAttributeLocation = gl.getAttribLocation(this.groundRenderProgram, "a_normal")
                    this.textureMappingAttributeLocation = gl.getAttribLocation(this.groundRenderProgram, "a_texture_mapping")

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
                    gl.activeTexture(gl.TEXTURE0 + 1)
                    gl.bindTexture(gl.TEXTURE_2D, textureTerrainAndRoadAtlas)

                    this.gl = gl
                } else {
                    console.error("Failed to create terrain rendering gl program")
                }

                // Setup the program to render images
                if (this.drawImageProgram && drawImageVertexShader && drawImageFragmentShader) {
                    gl.attachShader(this.drawImageProgram, drawImageVertexShader)
                    gl.attachShader(this.drawImageProgram, drawImageFragmentShader)

                    gl.linkProgram(this.drawImageProgram)
                    gl.useProgram(this.drawImageProgram)

                    gl.viewport(0, 0, canvas.width, canvas.height)

                    // Get attribute locations
                    this.drawImagePositionLocation = gl.getAttribLocation(this.drawImageProgram, "a_position")
                    this.drawImageTexcoordLocation = gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

                    // Create the position buffer
                    this.drawImagePositionBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.drawImagePositionBuffer)

                    const positions = [
                        0, 0,
                        0, 1,
                        1, 0,
                        1, 0,
                        0, 1,
                        1, 1,
                    ]

                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

                    // Turn on the attribute
                    gl.enableVertexAttribArray(this.drawImagePositionLocation)

                    // Configure how the attribute gets data
                    gl.vertexAttribPointer(this.drawImagePositionLocation, 2, gl.FLOAT, false, 0, 0)

                    // Handle the tex coord attribute
                    this.drawImageTexCoordBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)

                    const texCoords = [
                        0, 0,
                        0, 1,
                        1, 0,
                        1, 0,
                        0, 1,
                        1, 1
                    ]

                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)

                    // Turn on the attribute
                    gl.enableVertexAttribArray(this.drawImageTexcoordLocation)

                    // Configure how the attribute gets data
                    gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, gl.FLOAT, false, 0, 0)
                } else {
                    console.error("Failed to create image rendering gl program")
                }

                // Setup the program to render shadows
                if (this.drawShadowProgram && drawImageVertexShader && drawShadowFragmentShader) {
                    gl.attachShader(this.drawShadowProgram, drawImageVertexShader)
                    gl.attachShader(this.drawShadowProgram, drawShadowFragmentShader)

                    gl.linkProgram(this.drawShadowProgram)
                    gl.useProgram(this.drawImageProgram)

                    gl.viewport(0, 0, canvas.width, canvas.height)

                    // Get attribute locations
                    const positionLocation = gl.getAttribLocation(this.drawShadowProgram, "a_position")
                    const texcoordLocation = gl.getAttribLocation(this.drawShadowProgram, "a_texcoord")

                    // Create the position buffer
                    this.drawShadowPositionBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.drawShadowPositionBuffer)

                    const positions = [
                        0, 0,
                        0, 1,
                        1, 0,
                        1, 0,
                        0, 1,
                        1, 1,
                    ]

                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

                    // Turn on the attribute
                    gl.enableVertexAttribArray(positionLocation)

                    // Configure how the attribute gets data
                    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

                    // Handle the tex coord attribute
                    this.drawShadowTexCoordBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.drawShadowTexCoordBuffer)

                    const texCoords = [
                        0, 0,
                        0, 1,
                        1, 0,
                        1, 0,
                        0, 1,
                        1, 1
                    ]

                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)

                    // Turn on the attribute
                    gl.enableVertexAttribArray(texcoordLocation)

                    // Configure how the attribute gets data
                    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)
                }
            } else {
                console.error("Failed to create shadow rendering gl program")
            }

        } else {
            console.error("No canvasRef.current")
        }

        /* Prepare to draw roads */
        this.updateRoadDrawingBuffers()

        /* Create the rendering thread */
        this.renderGame()
    }

    renderGame(): void {

        const duration = new Duration("GameRender::renderGame")

        // Only draw if the game data is available
        if (!monitor.isGameDataAvailable()) {
            return
        }

        // Handle the animation counter
        const now = performance.now()
        const timeSinceLastDraw = now - this.previous + this.overshoot

        this.animationIndex = this.animationIndex + Math.floor(timeSinceLastDraw / ANIMATION_PERIOD)
        this.overshoot = timeSinceLastDraw % ANIMATION_PERIOD
        this.previous = now

        // Check if there are changes to the newRoads props array. In that case the buffers for drawing roads need to be updated.
        const newRoadsUpdatedLength = this.props.newRoad?.length || 0

        if (newRoadCurrentLength !== newRoadsUpdatedLength) {
            newRoadCurrentLength = newRoadsUpdatedLength

            console.log("New roads changed. Now it is " + JSON.stringify(this.props.newRoad))

            if (this.props.newRoad !== undefined) {
                monitor.placeLocalRoad(this.props.newRoad)
            }

            this.updateRoadDrawingBuffers()
        }

        /* Ensure that the reference to the canvases are set */
        if (!this.overlayCanvasRef.current || !this.normalCanvasRef.current) {
            console.error("The canvas references are not set properly")

            return
        }

        /* Get the rendering context for the overlay canvas */
        const overlayCtx = this.overlayCanvasRef.current.getContext("2d")

        /* Ensure that the canvas rendering context is valid */
        if (!overlayCtx) {
            console.error("No or invalid context")

            return
        }

        // Set the resolution
        resizeCanvasToDisplaySize(this.normalCanvasRef.current)
        resizeCanvasToDisplaySize(this.overlayCanvasRef.current)

        const width = this.normalCanvasRef.current.width
        const height = this.normalCanvasRef.current.height

        this.gl?.viewport(0, 0, width, height)

        /* Clear the drawing list */
        const toDrawNormal: ToDraw[] = []
        const shadowsToDraw: ToDraw[] = []


        /* Clear the overlay - make it fully transparent */
        overlayCtx.clearRect(0, 0, width, height)

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

        /**
         * Draw according to the following layers:
         *    1. Terrain layer
         *    2. Decorations
         *    3. Road layer
         *    4. Normal layer: houses + names, flags, stones, trees, workers, animals, lanyards, etc.
         *       3.1 Shadows (not implemented yet)
         *       3.2 Objects
         *    5. Hover layer: hover icon and selected icon
         */


        /* Draw the terrain layer */
        if (this.gl && this.groundRenderProgram && this.mapRenderInformation &&
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

            gl.useProgram(this.groundRenderProgram)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

            // Set screen width and height
            gl.uniform1f(this.uScreenWidth, width)
            gl.uniform1f(this.uScreenHeight, height)

            // Set the light vector
            const lightVector = [-1, 1, -1]
            gl.uniform3fv(this.uLightVector, lightVector)

            // Set the current values for the scale, offset and the sampler
            gl.uniform2f(this.uScale, this.props.scale, this.props.scale)
            gl.uniform2f(this.uOffset, this.props.translateX, this.props.translateY)

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
                    gl.uniform1i(this.uSampler, 1)

                    // mode, offset (nr vertices), count (nr vertices)
                    gl.drawArrays(gl.TRIANGLES, 0, this.mapRenderInformation.coordinates.length / 2)
                } else {
                    console.error("Map render information was missing when trying to draw the terrain")
                }
            } else {
                console.error("Buffers were undefined when trying to draw the terrain")
            }
        } else {
            console.error("Did not draw the terrain layer")
        }

        duration.after("draw terrain")


        /* Draw decorations on the ground */
        const decorationsToDraw: ToDraw[] = []

        monitor.decorations.forEach(decoration => {
            const image = decorationsImageAtlasHandler.getDrawingInformationFor(decoration.decoration)

            if (image) {
                decorationsToDraw.push({
                    source: image[0],
                    gamePoint: decoration,
                    depth: decoration.y
                })

                shadowsToDraw.push({
                    source: image[1],
                    gamePoint: decoration,
                    depth: decoration.y
                })
            } else if (oncePerNewSelectionPoint) {
                console.log({ title: 'No image!', decoration: decoration })
            }
        })

        // Set up webgl2 with the right shaders to prepare for drawing normal objects
        if (this.gl && this.drawImageProgram) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)

            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            if (this.drawImagePositionBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImagePositionLocation)
            }

            if (this.drawImageTexCoordBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImageTexcoordLocation)
            }

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

            // Draw decorations objects
            decorationsToDraw.forEach(draw => {

                if (draw.gamePoint !== undefined && draw.source && draw.source.texture !== undefined) {

                    if (this.gl && this.drawImageProgram && draw.gamePoint) {

                        this.gl.activeTexture(this.gl.TEXTURE3)
                        this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                        // Tell the fragment shader what texture to use
                        this.gl.uniform1i(drawImageTextureLocation, 3)

                        // Tell the vertex shader where to draw
                        this.gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                        this.gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)

                        // Tell the vertex shader how to draw
                        this.gl.uniform1f(drawImageScaleLocation, this.props.scale)
                        this.gl.uniform2f(drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                        this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)

                        // Tell the vertex shader what parts of the source image to draw
                        this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                        this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)

                        // Draw the quad (2 triangles = 6 vertices)
                        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                    }
                }
            })
        }

        duration.after("drawing decorations")


        /* Draw the road layer */
        if (this.gl && this.groundRenderProgram && this.mapRenderInformation &&
            this.uScreenWidth !== undefined &&
            this.uScreenHeight !== undefined &&
            this.uLightVector !== undefined &&
            this.uScale !== undefined &&
            this.uOffset !== undefined &&
            this.coordAttributeLocation !== undefined &&
            this.normalAttributeLocation !== undefined &&
            this.textureMappingAttributeLocation !== undefined &&
            this.uSampler !== undefined &&
            this.roadRenderInformation !== undefined &&
            this.roadCoordinatesBuffer !== undefined &&
            this.roadNormalsBuffer !== undefined &&
            this.roadTextureMappingBuffer !== undefined) {

            const gl = this.gl

            gl.useProgram(this.groundRenderProgram)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

            // Set screen width and height
            gl.uniform1f(this.uScreenWidth, width)
            gl.uniform1f(this.uScreenHeight, height)

            // Set the light vector
            const lightVector = [-1, 1, -1]
            gl.uniform3fv(this.uLightVector, lightVector)

            // Set the current values for the scale, offset and the sampler
            gl.uniform2f(this.uScale, this.props.scale, this.props.scale)
            gl.uniform2f(this.uOffset, this.props.translateX, this.props.translateY)

            // Draw the roads
            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
            gl.vertexAttribPointer(this.coordAttributeLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.coordAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadNormalsBuffer)
            gl.vertexAttribPointer(this.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.normalAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
            gl.vertexAttribPointer(this.textureMappingAttributeLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.textureMappingAttributeLocation)

            gl.uniform1i(this.uSampler, 1)

            gl.drawArrays(gl.TRIANGLES, 0, this.roadRenderInformation?.coordinates.length / 2)
        } else {
            console.error("Missing information to draw roads")
        }

        duration.after("draw roads")


        const ctx = overlayCtx

        // Handle the the Normal layer. First, collect information of what to draw for each type of object

        /* Collect borders to draw */
        for (const borderForPlayer of monitor.border.values()) {
            borderForPlayer.points.forEach(borderPoint => {

                if (borderPoint.x < minXInGame || borderPoint.x > maxXInGame || borderPoint.y < minYInGame || borderPoint.y > maxYInGame) {
                    return
                }

                const borderPointInfo = borderImageAtlasHandler.getDrawingInformation('romans', 'LAND')

                toDrawNormal.push({
                    source: borderPointInfo,
                    gamePoint: borderPoint,
                    depth: borderPoint.y
                })
            })
        }

        duration.after("collect borders")


        /* Collect the houses */
        for (const house of monitor.houses.values()) {

            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            if (house.state === 'PLANNED') {
                const plannedDrawInformation = houses.getDrawingInformationForHouseJustStarted(currentPlayerNation)

                toDrawNormal.push({
                    source: plannedDrawInformation,
                    gamePoint: house,
                    depth: house.y
                })
            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireAnimations.getAnimationFrame(size, this.animationIndex)

                if (fireDrawInformation) {
                    toDrawNormal.push({
                        source: fireDrawInformation[0],
                        gamePoint: house,
                        depth: house.y
                    })

                    shadowsToDraw.push({
                        source: fireDrawInformation[1],
                        gamePoint: house,
                        depth: house.y
                    })
                }
            } else if (house.state === 'DESTROYED') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireImageAtlas.getBurntDownDrawingInformation(size)

                toDrawNormal.push({
                    source: fireDrawInformation,
                    gamePoint: house,
                    depth: house.y
                })
            } else if (house.state === "UNFINISHED") {

                const houseDrawInformation = houses.getDrawingInformationForHouseUnderConstruction(currentPlayerNation, house.type)

                if (houseDrawInformation) {
                    toDrawNormal.push({
                        source: houseDrawInformation[0],
                        gamePoint: house,
                        depth: house.y
                    })

                    shadowsToDraw.push({
                        source: houseDrawInformation[1],
                        gamePoint: house,
                        depth: house.y
                    })
                }
            } else {
                const houseDrawInformation = houses.getDrawingInformationForHouseReady(currentPlayerNation, house.type)

                if (houseDrawInformation) {
                    toDrawNormal.push({
                        source: houseDrawInformation[0],
                        gamePoint: house,
                        depth: house.y
                    })

                    shadowsToDraw.push({
                        source: houseDrawInformation[1],
                        gamePoint: house,
                        depth: house.y
                    })
                }
            }
        }

        duration.after("collect houses")


        /* Collect the trees */
        let treeIndex = 0
        for (const tree of monitor.visibleTrees.values()) {

            if (tree.x + 1 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                continue
            }

            let treeDrawInfo

            if (tree.size === 'FULL_GROWN') {
                treeDrawInfo = treeAnimations.getAnimationFrame(tree.type, this.animationIndex, treeIndex)

                if (treeDrawInfo) {
                    toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                        depth: tree.y
                    })

                    shadowsToDraw.push({
                        source: treeDrawInfo[1],
                        gamePoint: tree,
                        depth: tree.y
                    })
                }
            } else {
                treeDrawInfo = treeImageAtlasHandler.getImageForGrowingTree(tree.type, tree.size)

                if (treeDrawInfo) {
                    toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                        depth: tree.y
                    })

                    shadowsToDraw.push({
                        source: treeDrawInfo[1],
                        gamePoint: tree,
                        depth: tree.y
                    })
                }
            }

            treeIndex = treeIndex + 1
        }

        duration.after("collect trees")


        /* Collect the crops */
        for (const crop of monitor.crops.values()) {

            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            // TODO: get type from the backend
            const cropDrawInfo = cropsImageAtlasHandler.getDrawingInformationFor('TYPE_1', crop.state)

            if (cropDrawInfo) {
                toDrawNormal.push({
                    source: cropDrawInfo[0],
                    gamePoint: crop,
                    depth: crop.y
                })

                shadowsToDraw.push({
                    source: cropDrawInfo[1],
                    gamePoint: crop,
                    depth: crop.y
                })
            }
        }

        duration.after("collect crops")


        /* Collect the signs */
        for (const sign of monitor.signs.values()) {

            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            let signDrawInfo

            if (sign.type !== undefined && sign.amount !== undefined) {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation(sign.type, sign.amount)
            } else {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation("nothing", "LARGE")
            }

            if (signDrawInfo) {

                toDrawNormal.push({
                    source: signDrawInfo[0],
                    gamePoint: sign,
                    depth: sign.y
                })

                shadowsToDraw.push({
                    source: signDrawInfo[1],
                    gamePoint: sign,
                    depth: sign.y
                })
            }
        }

        duration.after("collect signs")


        /* Collect the stones */
        for (const stone of monitor.stones) {

            if (stone.x + 1 < minXInGame || stone.x - 1 > maxXInGame || stone.y + 1 < minYInGame || stone.y - 1 > maxYInGame) {
                continue
            }

            // TODO: pick the right type and size of stone
            const stoneDrawInfo = stoneImageAtlasHandler.getDrawingInformationFor('TYPE_2', 'MIDDLE')

            if (stoneDrawInfo) {
                toDrawNormal.push({
                    source: stoneDrawInfo[0],
                    gamePoint: stone,
                    depth: stone.y
                })

                shadowsToDraw.push({
                    source: stoneDrawInfo[1],
                    gamePoint: stone,
                    depth: stone.y
                })
            }
        }

        duration.after("collect stones")


        /* Collect wild animals */
        for (const animal of monitor.wildAnimals.values()) {
            if (animal.previous && animal.next) {

                if (animal.previous.x < minXInGame || animal.previous.x > maxXInGame || animal.previous.y < minYInGame || animal.previous.y > maxYInGame) {
                    continue
                }

                if (animal.next.x < minXInGame || animal.next.x > maxXInGame || animal.next.y < minYInGame || animal.next.y > maxYInGame) {
                    continue
                }

                const interpolatedGamePoint = {
                    x: animal.previous.x + (animal.next.x - animal.previous.x) * (animal.percentageTraveled / 100),
                    y: animal.previous.y + (animal.next.y - animal.previous.y) * (animal.percentageTraveled / 100)
                }

                const direction = getDirectionForWalkingWorker(animal.next, animal.previous)

                const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                if (animationImage) {
                    toDrawNormal.push({
                        source: animationImage[0],
                        gamePoint: interpolatedGamePoint,
                        depth: interpolatedGamePoint.y
                    })

                    if (animationImage.length > 1) {
                        shadowsToDraw.push({
                            source: animationImage[1],
                            gamePoint: interpolatedGamePoint,
                            depth: interpolatedGamePoint.y
                        })
                    }
                }
            } else {

                if (animal.x < minXInGame || animal.x > maxXInGame || animal.y < minYInGame || animal.y > maxYInGame) {
                    continue
                }

                if (animal.previous) {
                    const direction = getDirectionForWalkingWorker(animal, animal.previous)

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: animal,
                            depth: animal.y
                        })

                        if (animationImage.length > 1) {
                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: animal,
                                depth: animal.y
                            })
                        }
                    }
                } else {
                    const direction = 'EAST'
                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: animal,
                            depth: animal.y
                        })

                        if (animationImage.length > 1) {
                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: animal,
                                depth: animal.y
                            })
                        }
                    }
                }
            }
        }

        duration.after("collect wild animals")


        /* Collect ships */
        for (const ship of monitor.ships.values()) {

            // If worker is moving and not at a fixed point
            if (ship.previous && ship.next) {

                if (ship.previous.x < minXInGame || ship.previous.x > maxXInGame || ship.previous.y < minYInGame || ship.previous.y > maxYInGame) {
                    continue
                }

                if (ship.next.x < minXInGame || ship.next.x > maxXInGame || ship.next.y < minYInGame || ship.next.y > maxYInGame) {
                    continue
                }

                const interpolatedGamePoint = {
                    x: ship.previous.x + (ship.next.x - ship.previous.x) * (ship.percentageTraveled / 100),
                    y: ship.previous.y + (ship.next.y - ship.previous.y) * (ship.percentageTraveled / 100)
                }

                const direction = getDirectionForWalkingWorker(ship.next, ship.previous)

                let shipImage

                if (ship.constructionState === 'READY') {
                    shipImage = shipImageAtlas.getDrawingInformationForShip(direction)
                } else {
                    shipImage = shipImageAtlas.getDrawingInformationForShipUnderConstruction(ship.constructionState)
                }

                if (shipImage) {
                    toDrawNormal.push({
                        source: shipImage[0],
                        gamePoint: interpolatedGamePoint,
                        depth: interpolatedGamePoint.y
                    })

                    shadowsToDraw.push({
                        source: shipImage[1],
                        gamePoint: interpolatedGamePoint,
                        depth: interpolatedGamePoint.y
                    })
                }

            } else {

                if (ship.x < minXInGame || ship.x > maxXInGame || ship.y < minYInGame || ship.y > maxYInGame) {
                    continue
                }

                let direction: Direction = "WEST"

                if (ship.previous) {
                    direction = getDirectionForWalkingWorker(ship, ship.previous)
                }

                let shipImage

                if (ship.constructionState === 'READY') {
                    shipImage = shipImageAtlas.getDrawingInformationForShip(direction)
                } else {
                    shipImage = shipImageAtlas.getDrawingInformationForShipUnderConstruction(ship.constructionState)
                }

                if (shipImage) {
                    toDrawNormal.push({
                        source: shipImage[0],
                        gamePoint: ship,
                        depth: ship.y
                    })

                    shadowsToDraw.push({
                        source: shipImage[1],
                        gamePoint: ship,
                        depth: ship.y
                    })
                }
            }
        }


        /* Collect workers */
        for (const worker of monitor.workers.values()) {

            // If worker is moving and not at a fixed point
            if (worker.betweenPoints && worker.previous !== undefined && worker.next) {

                if (worker.previous.x < minXInGame || worker.previous.x > maxXInGame || worker.previous.y < minYInGame || worker.previous.y > maxYInGame) {
                    continue
                }

                if (worker.next.x < minXInGame || worker.next.x > maxXInGame || worker.next.y < minYInGame || worker.next.y > maxYInGame) {
                    continue
                }

                const interpolatedGamePoint = {
                    x: worker.previous.x + (worker.next.x - worker.previous.x) * (worker.percentageTraveled / 100),
                    y: worker.previous.y + (worker.next.y - worker.previous.y) * (worker.percentageTraveled / 100)
                }

                if (worker.type === "Donkey") {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)

                    if (donkeyImage) {
                        toDrawNormal.push({
                            source: donkeyImage[0],
                            gamePoint: interpolatedGamePoint,
                            depth: interpolatedGamePoint.y
                        })

                        if (donkeyImage.length > 1) {
                            shadowsToDraw.push({
                                source: donkeyImage[1],
                                gamePoint: interpolatedGamePoint,
                                depth: interpolatedGamePoint.y
                            })
                        }
                    }
                } else if (worker.type === "Courier" || worker.type === 'StorageWorker') {

                    let image

                    if (worker.cargo) {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierWithCargo.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierWithCargo.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)
                        }
                    } else {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierNoCargo.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierNoCargo.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)
                        }
                    }

                    if (image) {
                        toDrawNormal.push({
                            source: image[0],
                            gamePoint: interpolatedGamePoint,
                            depth: interpolatedGamePoint.y
                        })

                        shadowsToDraw.push({
                            source: image[1],
                            gamePoint: interpolatedGamePoint,
                            depth: interpolatedGamePoint.y
                        })
                    }
                } else {
                    const animationImage = workers.get(worker.type)?.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y },
                            depth: interpolatedGamePoint.y
                        })

                        shadowsToDraw.push({
                            source: animationImage[1],
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y },
                            depth: interpolatedGamePoint.y
                        })
                    }
                }

                if (worker.cargo) {

                    if (worker.type === 'Courier' || worker.type === 'StorageWorker') {
                        let cargoDrawInfo

                        if (worker?.bodyType === 'FAT') {
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)
                        }

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: interpolatedGamePoint,
                            depth: interpolatedGamePoint.y
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)

                        if (cargo) {
                            toDrawNormal.push({
                                source: cargo,
                                gamePoint: interpolatedGamePoint,
                                depth: interpolatedGamePoint.y
                            })
                        }
                    }

                }
            } else {

                if (worker.x < minXInGame || worker.x > maxXInGame || worker.y < minYInGame || worker.y > maxYInGame) {
                    continue
                }

                if (worker.type === "Donkey") {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, 0, worker.percentageTraveled)

                    if (donkeyImage) {
                        toDrawNormal.push({
                            source: donkeyImage[0],
                            gamePoint: worker,
                            depth: worker.y
                        })

                        shadowsToDraw.push({
                            source: donkeyImage[1],
                            gamePoint: worker,
                            depth: worker.y
                        })
                    }
                } else if (worker.type === "Courier" || worker.type === 'StorageWorker') {

                    let didDrawAnimation = false

                    if (worker.action && worker.actionAnimationIndex !== undefined) {

                        if (worker.bodyType === 'FAT') {
                            const animationImage = fatCarrierNoCargo.getActionAnimation(worker.direction, worker.action, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y },
                                    depth: worker.y
                                })
                            }
                        } else {
                            const animationImage = thinCarrierNoCargo.getActionAnimation(worker.direction, worker.action, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y },
                                    depth: worker.y
                                })
                            }
                        }
                    }

                    if (!didDrawAnimation) {
                        let image

                        if (worker.cargo) {
                            if (worker?.bodyType === 'FAT') {
                                image = fatCarrierWithCargo.getAnimationFrame(worker.direction, 0, worker.percentageTraveled)
                            } else {
                                image = thinCarrierWithCargo.getAnimationFrame(worker.direction, 0, worker.percentageTraveled)
                            }
                        } else {
                            if (worker?.bodyType === 'FAT') {
                                image = fatCarrierNoCargo.getAnimationFrame(worker.direction, 0, worker.percentageTraveled)
                            } else {
                                image = thinCarrierNoCargo.getAnimationFrame(worker.direction, 0, worker.percentageTraveled)
                            }
                        }

                        if (image) {
                            toDrawNormal.push({
                                source: image[0],
                                gamePoint: worker,
                                depth: worker.y
                            })

                            shadowsToDraw.push({
                                source: image[1],
                                gamePoint: worker,
                                depth: worker.y
                            })
                        }
                    }
                } else {

                    let didDrawAnimation = false

                    if (worker.action && worker.actionAnimationIndex !== undefined) {
                        const animationImage = workers.get(worker.type)?.getActionAnimation(worker.direction, worker.action, worker.actionAnimationIndex)

                        if (animationImage) {
                            didDrawAnimation = true

                            toDrawNormal.push({
                                source: animationImage,
                                gamePoint: { x: worker.x, y: worker.y },
                                depth: worker.y
                            })
                        }
                    }

                    if (!didDrawAnimation) {
                        const animationImage = workers.get(worker.type)?.getAnimationFrame(worker.direction, 0, worker.percentageTraveled / 10)

                        if (animationImage) {
                            toDrawNormal.push({
                                source: animationImage[0],
                                gamePoint: { x: worker.x, y: worker.y },
                                depth: worker.y
                            })

                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: { x: worker.x, y: worker.y },
                                depth: worker.y
                            })
                        }
                    }
                }

                if (worker.cargo) {

                    if (worker.type === 'Courier' || worker.type === 'StorageWorker') {
                        let cargoDrawInfo

                        if (worker?.bodyType === 'FAT') {
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)
                        }

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: worker,
                            depth: worker.y
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)

                        if (cargo) {
                            toDrawNormal.push({
                                source: cargo,
                                gamePoint: worker,
                                depth: worker.y
                            })
                        }
                    }
                }
            }
        }

        duration.after("collect workers")


        /* Collect flags */
        let flagCount = 0
        for (const flag of monitor.flags.values()) {

            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const flagDrawInfo = flagAnimations.getAnimationFrame(flag.nation, flag.type, this.animationIndex, flagCount)

            if (flagDrawInfo) {
                toDrawNormal.push({
                    source: flagDrawInfo[0],
                    gamePoint: flag,
                    depth: flag.y
                })

                shadowsToDraw.push({
                    source: flagDrawInfo[1],
                    gamePoint: flag,
                    depth: flag.y
                })
            }

            if (flag.stackedCargo) {

                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {

                    const cargo = flag.stackedCargo[i]

                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                    toDrawNormal.push({
                        source: cargoDrawInfo,
                        gamePoint: { x: flag.x - 0.3, y: flag.y - 0.1 * i + 0.3 },
                        depth: flag.y
                    })
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {

                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x + 0.08, y: flag.y - 0.1 * i + 0.2 },
                            depth: flag.y
                        })
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {

                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x + 17 / 50, y: flag.y - 0.1 * (i - 4) + 0.2 },
                            depth: flag.y
                        })
                    }
                }
            }

            flagCount = flagCount + 1
        }

        duration.after("collect flags")


        /* Collect available construction */
        if (this.props.showAvailableConstruction) {

            for (const [gamePoint, available] of monitor.availableConstruction.entries()) {

                if (available.length === 0) {
                    continue
                }

                if (gamePoint.x + 1 < minXInGame || gamePoint.x - 1 > maxXInGame || gamePoint.y + 1 < minYInGame || gamePoint.y - 1 > maxYInGame) {
                    continue
                }

                if (available.includes("large")) {

                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForLargeHouseAvailable()

                    toDrawNormal.push({
                        source: largeHouseAvailableInfo,
                        gamePoint,
                        depth: gamePoint.y
                    })
                } else if (available.includes("medium")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint,
                        depth: gamePoint.y
                    })
                } else if (available.includes("small")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint,
                        depth: gamePoint.y
                    })
                } else if (available.includes("mine")) {

                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()

                    toDrawNormal.push({
                        source: mineAvailableInfo,
                        gamePoint,
                        depth: gamePoint.y
                    })
                } else if (available.includes("flag")) {

                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()

                    toDrawNormal.push({
                        source: flagAvailableInfo,
                        gamePoint,
                        depth: gamePoint.y
                    })
                }
            }
        }

        duration.after("Collect available construction")

        // Draw the Shadow layer and the Normal layer

        // Sort the toDrawList so it first draws things further away
        const sortedToDrawList = toDrawNormal.sort((draw1, draw2) => {
            return draw2.depth - draw1.depth
        })


        // Set up webgl2 with the right shaders to prepare for drawing shadows
        if (this.gl && this.drawShadowProgram) {
            this.gl.useProgram(this.drawShadowProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)


            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawShadowProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawShadowProgram, "a_texcoord")

            if (this.drawImagePositionBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImagePositionLocation)
            }

            if (this.drawImageTexCoordBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImageTexcoordLocation)
            }

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_screen_dimensions")

            // Draw all shadows
            shadowsToDraw.forEach(shadow => {

                if (shadow.gamePoint !== undefined && shadow.source && shadow.source.texture !== undefined) {

                    if (this.gl && this.drawShadowProgram && shadow.gamePoint) {

                        this.gl.activeTexture(this.gl.TEXTURE3)
                        this.gl.bindTexture(this.gl.TEXTURE_2D, shadow.source.texture)

                        // Tell the fragment shader what texture to use
                        this.gl.uniform1i(drawImageTextureLocation, 3)

                        // Tell the vertex shader where to draw
                        this.gl.uniform2f(drawImageGamePointLocation, shadow.gamePoint.x, shadow.gamePoint.y)
                        this.gl.uniform2f(drawImageOffsetLocation, shadow.source.offsetX, shadow.source.offsetY)

                        // Tell the vertex shader how to draw
                        this.gl.uniform1f(drawImageScaleLocation, this.props.scale)
                        this.gl.uniform2f(drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                        this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)

                        // Tell the vertex shader what parts of the source image to draw
                        this.gl.uniform2f(drawImageSourceCoordinateLocation, shadow.source.sourceX, shadow.source.sourceY)
                        this.gl.uniform2f(drawImageSourceDimensionsLocation, shadow.source.width, shadow.source.height)

                        // Draw the quad (2 triangles = 6 vertices)
                        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                    }
                }
            })
        }

        // Set up webgl2 with the right shaders to prepare for drawing normal objects
        if (this.gl && this.drawImageProgram) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)


            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            if (this.drawImagePositionBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImagePositionLocation)
            }

            if (this.drawImageTexCoordBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(drawImageTexcoordLocation)
            }

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

            // Draw normal objects
            sortedToDrawList.forEach(draw => {

                if (draw.gamePoint !== undefined && draw.source && draw.source.texture !== undefined) {

                    if (this.gl && this.drawImageProgram && draw.gamePoint) {

                        this.gl.activeTexture(this.gl.TEXTURE3)
                        this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                        // Tell the fragment shader what texture to use
                        this.gl.uniform1i(drawImageTextureLocation, 3)

                        // Tell the vertex shader where to draw
                        this.gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                        this.gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)

                        // Tell the vertex shader how to draw
                        this.gl.uniform1f(drawImageScaleLocation, this.props.scale)
                        this.gl.uniform2f(drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                        this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)

                        // Tell the vertex shader what parts of the source image to draw
                        this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                        this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)

                        // Draw the quad (2 triangles = 6 vertices)
                        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                    }
                }
            })
        }


        // Handle the hover layer
        const toDrawHover: ToDraw[] = []

        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {

            if (this.props.newRoad !== undefined) {

                const center = this.props.newRoad[this.props.newRoad.length - 1]

                // Draw the starting point
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                toDrawHover.push({
                    source: startPointInfo,
                    gamePoint: center,
                    depth: center.y
                })
            }

            this.props.possibleRoadConnections.forEach(
                (point) => {

                    const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForSameLevelConnection()

                    toDrawHover.push({
                        source: startPointInfo,
                        gamePoint: point,
                        depth: point.y
                    })
                }
            )
        }

        duration.after("collect possible road connections")


        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const selectedPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForSelectedPoint()

            toDrawHover.push({
                source: selectedPointDrawInfo,
                gamePoint: this.props.selectedPoint,
                depth: this.props.selectedPoint.y
            })
        }

        duration.after("collect selected point")


        /* Draw the hover point */
        if (this.state.hoverPoint && this.state.hoverPoint.y > 0) {

            const availableConstructionAtHoverPoint = monitor.availableConstruction.get(this.state.hoverPoint)

            if (availableConstructionAtHoverPoint !== undefined && availableConstructionAtHoverPoint.length > 0) {

                if (availableConstructionAtHoverPoint.includes("large")) {

                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverLargeHouseAvailable()

                    toDrawHover.push({
                        source: largeHouseAvailableInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                } else if (availableConstructionAtHoverPoint.includes("medium")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()

                    toDrawHover.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                } else if (availableConstructionAtHoverPoint.includes("small")) {

                    const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()

                    toDrawHover.push({
                        source: smallHouseAvailableInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                } else if (availableConstructionAtHoverPoint.includes("mine")) {

                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()

                    toDrawHover.push({
                        source: mineAvailableInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                } else if (availableConstructionAtHoverPoint.includes("flag")) {

                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()

                    toDrawHover.push({
                        source: flagAvailableInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                }
            } else {

                const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()

                toDrawHover.push({
                    source: hoverPointDrawInfo,
                    gamePoint: this.state.hoverPoint,
                    depth: this.state.hoverPoint.y
                })
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting

        // Set up webgl2 with the right shaders
        if (this.gl && this.drawImageProgram) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)


            // Re-assign the attribute locations
            this.drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            this.drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            if (this.drawImagePositionBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                this.gl.vertexAttribPointer(this.drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(this.drawImagePositionLocation)
            }

            if (this.drawImageTexCoordBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                this.gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                this.gl.enableVertexAttribArray(this.drawImageTexcoordLocation)
            }

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

            // Go through the images to draw
            toDrawHover.forEach(draw => {

                if (draw.gamePoint !== undefined && draw.source && draw.source.texture !== undefined) {

                    if (this.gl && this.drawImageProgram && draw.gamePoint) {

                        this.gl.activeTexture(this.gl.TEXTURE3)
                        this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                        // Tell the fragment shader what texture to use
                        this.gl.uniform1i(drawImageTextureLocation, 3)

                        // Tell the vertex shader where to draw
                        this.gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                        this.gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)

                        // Tell the vertex shader how to scale
                        this.gl.uniform1f(drawImageScaleLocation, this.props.scale)
                        this.gl.uniform2f(drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                        this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)

                        // Tell the vertex shader what parts of the source image to draw
                        this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                        this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)

                        // Draw the quad (2 triangles = 6 vertices)
                        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                    }
                } else if (oncePerNewSelectionPoint) {
                    console.log({ title: "Can't draw", draw })
                }
            })
        }

        duration.after("draw normal layer")


        /* Draw house titles */
        if (this.props.showHouseTitles) {

            ctx.font = "bold 12px sans-serif"
            ctx.strokeStyle = 'black'
            ctx.fillStyle = 'yellow'

            for (const house of monitor.houses.values()) {

                if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(house)

                const houseDrawInformation = houses.getDrawingInformationForHouseReady(currentPlayerNation, house.type)

                let heightOffset = 0

                if (houseDrawInformation) {
                    heightOffset = houseDrawInformation[0].offsetY * this.props.scale / DEFAULT_SCALE
                }

                let houseTitle = camelCaseToWords(house.type)

                if (house.state === "UNFINISHED") {
                    houseTitle = "(" + houseTitle + ")"
                } else if (house.productivity !== undefined) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

                const widthOffset = ctx.measureText(houseTitle).width / 2

                screenPoint.x -= widthOffset
                screenPoint.y -= heightOffset

                ctx.strokeText(houseTitle, screenPoint.x, screenPoint.y - 5)
                ctx.fillText(houseTitle, screenPoint.x, screenPoint.y - 5)
            }
        }

        duration.after("draw house titles")


        duration.reportStats()

        /* List counters if the rendering time exceeded the previous maximum */
        if (isLatestValueHighestForVariable("GameRender::renderGame.total")) {
            printVariables()
        }

        /* Draw the FPS counter */
        const timestamp = getTimestamp()

        if (this.props.showFpsCounter && this.previousTimestamp) {
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
        return gamePointToScreenPoint(gamePoint, this.props.translateX, this.props.translateY, this.props.scale, this.props.screenHeight)
    }

    screenPointToGamePoint(screenPoint: ScreenPoint): Point {
        return screenPointToGamePoint(screenPoint, this.props.translateX, this.props.translateY, this.props.scale, this.props.screenHeight)
    }

    async onClickOrDoubleClick(event: React.MouseEvent): Promise<void> {

        // Save currentTarget. This field becomes null directly after
        const currentTarget = event.currentTarget

        // Distinguish between single and doubleclick
        if (event.detail === 1) {
            timer = setTimeout(() => {
                event.currentTarget = currentTarget

                this.onClick(event)
            }, 200)
        } else {

            if (timer) {
                clearTimeout(timer)
            }

            event.currentTarget = currentTarget

            this.onDoubleClick(event)
        }

        event.stopPropagation()
    }

    async onClick(event: React.MouseEvent): Promise<void> {

        /* Convert to game coordinates */
        if (this.overlayCanvasRef.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

            const gamePoint = this.screenPointToGamePoint({ x: x, y: y })

            this.props.onPointClicked(gamePoint)
        }
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
    }

    render(): JSX.Element {

        return (
            <>
                <canvas
                    className="GameCanvas"
                    onKeyDown={this.props.onKeyDown}
                    onClick={this.onClickOrDoubleClick}
                    style={{ cursor: MOUSE_STYLES.get(this.props.cursorState) }}

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

                <canvas ref={this.normalCanvasRef} className="TerrainCanvas" />

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
        for (const point of monitor.discoveredPoints) {
            const normals = [
                straightBelowNormals.get(getPointUpLeft(point)),
                downRightNormals.get(getPointUpLeft(point)),
                straightBelowNormals.get(getPointUpRight(point)),
                downRightNormals.get(point),
                straightBelowNormals.get(point),
                downRightNormals.get(getPointLeft(point))
            ]

            // Calculate the combined normal as the average of the normal for the surrounding triangles
            const vectors: Vector[] = []

            for (const normal of normals) {
                if (normal) {
                    vectors.push(normal)
                }
            }

            if (vectors.length > 0) {
                const combinedVector = vectors.reduce(sumVectors)

                const normalized = normalize(combinedVector)

                this.normals.set(point, normalized)
            } else {
                this.normals.set(point, { x: 0, y: 0, z: 1 })
            }
        }
    }

    prepareToRenderRoads(roads: Iterable<RoadInformation>): RenderInformation {

        console.log("Prepare to render roads")

        // Create the render information for the roads
        const coordinatesList: number[] = []
        const normalsList: number[] = []
        const textureMappinglist: number[] = []

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
                    console.error("Missing normals")
                    console.log(normalPrevious)
                    console.log(normalPoint)

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

                    if (road.type === 'NORMAL') {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                                0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                1.0, 0.059
                            ]
                        )
                    }

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

                    if (road.type === 'NORMAL') {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                                0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                1.0, 0.059
                            ]
                        )
                    }

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

                    if (road.type === 'NORMAL') {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                                0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                1.0, 0.059
                            ]
                        )
                    }

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

                    if (road.type === 'NORMAL') {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                                0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                1.0, 0.059
                            ]
                        )
                    }

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

                    if (road.type === 'NORMAL') {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 1 - 0.941, 0.75, 1 - 1.0, 1.0, 1 - 0.941,
                                0.75, 1 - 1.0, 1.0, 1 - 0.941, 1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMappinglist,
                            [
                                0.75, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                0.75, 0.059,
                                1.0, 0.118,
                                1.0, 0.059
                            ]
                        )
                    }
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

export { GameCanvas }

