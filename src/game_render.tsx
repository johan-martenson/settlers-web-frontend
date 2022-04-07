import React, { Component } from 'react'
import { Direction, materialToColor, NationSmallCaps, Point, RoadInformation, VegetationIntegers, VEGETATION_INTEGERS, WildAnimalType, WorkerType } from './api'
import { Duration } from './duration'
import './game_render.css'
import { listenToDiscoveredPoints, listenToRoads, monitor, TileBelow, TileDownRight } from './monitor'
import { textureAndLightingFragmentShader, textureAndLightingVertexShader, texturedImageVertexShader, textureFragmentShader } from './shaders'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from './stats'
import { AnimalAnimation, BorderImageAtlasHandler, camelCaseToWords, CargoImageAtlasHandler, CropImageAtlasHandler, DecorationsImageAtlasHandler, DrawingInformation, FireAnimation, FlagAnimation, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, getTimestamp, HouseImageAtlasHandler, intToVegetationColor, loadImageNg as loadImageAsync, makeShader, makeTextureFromImage, normalize, resizeCanvasToDisplaySize, RoadBuildingImageAtlasHandler, same, SignImageAtlasHandler, StoneImageAtlasHandler, sumVectors, TreeAnimation, UiElementsImageAtlasHandler, Vector, vegetationToInt, WorkerAnimation } from './utils'
import { PointMapFast } from './util_types'

export interface ScreenPoint {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD'

interface ToDraw {
    source: DrawingInformation
    depth: number
    gamePoint: Point
}

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

let logOnce = true

// Temporary workaround until buildings are correct for all players and the monitor and the backend retrieves player nation correctly
const currentPlayerNation: NationSmallCaps = "romans"

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

const treeAnimations = new TreeAnimation("assets/nature/", 10)

const fireAnimations = new FireAnimation("assets/", 4)

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

const houses = new HouseImageAtlasHandler("assets/")

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

const flagAnimations = new FlagAnimation("assets/", 10)

interface RenderInformation {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private terrainCanvasRef = React.createRef<HTMLCanvasElement>()
    private overlayCanvasRef = React.createRef<HTMLCanvasElement>()
    private lightVector: Vector
    private debuggedPoint: Point | undefined
    private previousTimestamp?: number

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
    private drawImagePositionLocation?: number
    private drawImageTexcoordLocation?: number
    private drawImageTextureLocation?: WebGLUniformLocation | null
    private drawImageGamePointLocation?: WebGLUniformLocation | null
    private drawImageOffsetLocation?: WebGLUniformLocation | null
    private drawImageScaleLocation?: WebGLUniformLocation | null
    private drawImageSourceCoordinateLocation?: WebGLUniformLocation | null
    private drawImageSourceDimensionsLocation?: WebGLUniformLocation | null
    private drawImageScreenOffsetLocation?: WebGLUniformLocation | null
    private drawImageScreenDimensionLocation?: WebGLUniformLocation | null
    private drawImageTexCoordBuffer?: WebGLBuffer | null
    private drawImagePositionBuffer?: WebGLBuffer | null


    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)

        this.normals = new PointMapFast()

        /* Define the light vector */
        this.lightVector = normalize({ x: -1, y: 1, z: -1 })

        addVariableIfAbsent("fps")

        this.state = {}

        this.groundRenderProgram = null
        this.drawImageProgram = null
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

    shouldComponentUpdate(nextProps: GameCanvasProps, nextState: GameCanvasState) {
        return this.props.onKeyDown !== nextProps.onKeyDown
    }

    async componentDidMount() {

        /* Load animations */
        workers.forEach((animation, workerType) => animation.load())
        animals.forEach((animation, animalType) => animation.load())

        await Promise.all([
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
            cargoImageAtlasHandler.load()
        ])

        /* Subscribe for new discovered points */
        listenToDiscoveredPoints((points) => {

            // Update the calculated normals
            this.calculateNormalsForEachPoint(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

            // Update the map rendering buffers
            if (this.gl && this.groundRenderProgram) {
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

            if (this.gl !== undefined && this.groundRenderProgram !== undefined &&
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

            const gl = canvas.getContext("webgl2", { alpha: false })

            if (gl) {

                // Make textures for the image atlases
                workers.forEach((animation, workerType) => animation.makeTexture(gl))
                animals.forEach((animation, animalType) => animation.makeTexture(gl))

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

                // Create and compile the shaders
                const lightingVertexShader = makeShader(gl, textureAndLightingVertexShader, gl.VERTEX_SHADER)
                const lightingFragmentShader = makeShader(gl, textureAndLightingFragmentShader, gl.FRAGMENT_SHADER)
                const drawImageVertexShader = makeShader(gl, texturedImageVertexShader, gl.VERTEX_SHADER)
                const drawImageFragmentShader = makeShader(gl, textureFragmentShader, gl.FRAGMENT_SHADER)

                // Setup the program to render the ground
                this.groundRenderProgram = gl.createProgram()

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
                    console.log("Failed to get prog")
                }

                // Setup the program to render images
                this.drawImageProgram = gl.createProgram()

                if (this.drawImageProgram && drawImageVertexShader && drawImageFragmentShader) {
                    gl.attachShader(this.drawImageProgram, drawImageVertexShader)
                    gl.attachShader(this.drawImageProgram, drawImageFragmentShader)

                    gl.linkProgram(this.drawImageProgram)
                    gl.useProgram(this.drawImageProgram)

                    gl.viewport(0, 0, canvas.width, canvas.height)

                    // Get attribute locations
                    this.drawImagePositionLocation = gl.getAttribLocation(this.drawImageProgram, "a_position")
                    this.drawImageTexcoordLocation = gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

                    // Get uniform locations
                    this.drawImageTextureLocation = gl.getUniformLocation(this.drawImageProgram, "u_texture")
                    this.drawImageGamePointLocation = gl.getUniformLocation(this.drawImageProgram, "u_game_point")
                    this.drawImageScreenOffsetLocation = gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
                    this.drawImageOffsetLocation = gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
                    this.drawImageScaleLocation = gl.getUniformLocation(this.drawImageProgram, "u_scale")
                    this.drawImageSourceCoordinateLocation = gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
                    this.drawImageSourceDimensionsLocation = gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
                    this.drawImageScreenDimensionLocation = gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

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

                }

            } else {
                console.log(gl)
            }

        } else {
            console.log("No canvasRef.current")
        }

        /* Create the rendering thread */
        this.renderGame()
    }

    renderGame(): void {

        const duration = new Duration("GameRender::renderGame")

        /* Ensure that the reference to the canvases are set */
        if (!this.overlayCanvasRef.current || !this.terrainCanvasRef.current) {
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
        resizeCanvasToDisplaySize(this.terrainCanvasRef.current)
        resizeCanvasToDisplaySize(this.overlayCanvasRef.current)

        const width = this.terrainCanvasRef.current.width
        const height = this.terrainCanvasRef.current.height

        this.gl?.viewport(0, 0, width, height)

        /* Clear the drawing list */
        let toDrawNormal: ToDraw[] = []


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

        /**
         * Draw according to the following layers:
         *    1. Terrain layer
         *    2. Road layer
         *    3. Normal layer: houses + names, flags, stones, trees, workers, animals, lanyards, etc.
         *    4. Hover layer: hover icon and selected icon
         */


        /* Draw the terrain layer, followed by the road layer */
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

                gl.uniform1i(this.uSampler, 1)

                gl.drawArrays(gl.TRIANGLES, 0, this.roadRenderInformation?.coordinates.length / 2)
            }
        }

        duration.after("draw terrain and roads")


        let ctx = overlayCtx

        // Handle the the Normal layer. First, collect information of what to draw for each type of object

        /* Collect borders to draw */
        for (const [playerId, borderForPlayer] of monitor.border) {

            borderForPlayer.points.forEach(borderPoint => {

                if (borderPoint.x < minXInGame || borderPoint.x > maxXInGame || borderPoint.y < minYInGame || borderPoint.y > maxYInGame) {
                    return
                }

                const borderPointInfo = borderImageAtlasHandler.getDrawingInformation('romans', 'LAND')

                if (borderPointInfo !== undefined) {
                    toDrawNormal.push({
                        source: borderPointInfo,
                        gamePoint: borderPoint,
                        depth: borderPoint.y
                    })
                }
            })
        }

        duration.after("draw borders")


        /* Collect the ongoing new road if it exists */
        if (this.props.newRoad !== undefined) {

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


        /* Collect the houses */
        let houseIndex = -1
        for (const house of monitor.houses.values()) {

            houseIndex = houseIndex + 1

            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            /* Draw the house next to the point, instead of on top */
            if (house.state === 'PLANNED') {
                const plannedDrawInformation = houses.getDrawingInformationForHouseJustStarted(currentPlayerNation)

                if (plannedDrawInformation !== undefined) {
                    toDrawNormal.push({
                        source: plannedDrawInformation,
                        gamePoint: house,
                        depth: house.y
                    })
                }

            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireAnimations.getAnimationFrame(size, this.animationIndex)

                if (fireDrawInformation !== undefined) {
                    toDrawNormal.push({
                        source: fireDrawInformation,
                        gamePoint: house,
                        depth: house.y
                    })
                }
            } else {

                let houseDrawInformation

                if (house.state === "UNFINISHED") {
                    houseDrawInformation = houses.getDrawingInformationForHouseUnderConstruction(currentPlayerNation, house.type)
                } else {
                    houseDrawInformation = houses.getDrawingInformationForHouseReady(currentPlayerNation, house.type)
                }

                if (houseDrawInformation !== undefined) {
                    toDrawNormal.push({
                        source: houseDrawInformation,
                        gamePoint: house,
                        depth: house.y
                    })

                }
            }
        }

        duration.after("draw houses")


        /* Collect the trees */
        let treeIndex = 0
        for (const tree of monitor.visibleTrees.values()) {

            if (tree.x + 1 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 1 < minYInGame || tree.y - 1 > maxYInGame) {
                continue
            }

            /* Draw the tree next to the point, instead of on top */
            let treeDrawInfo = treeAnimations.getAnimationFrame(tree.type, this.animationIndex, treeIndex)

            if (treeDrawInfo !== undefined) {
                toDrawNormal.push({
                    source: treeDrawInfo,
                    gamePoint: tree,
                    depth: tree.y
                })
            }

            treeIndex = treeIndex + 1
        }

        duration.after("draw trees")


        /* Collect dead trees */
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

            /* Draw the tree next to the point, instead of on top */
            const deadTreeInfo = decorationsImageAtlasHandler.getDrawingInformationFor("STANDING_DEAD_TREE")

            if (deadTreeInfo !== undefined) {
                toDrawNormal.push({
                    source: deadTreeInfo,
                    gamePoint: deadTree,
                    depth: deadTree.y
                })
            }
        }

        duration.after("draw dead trees")


        /* Collect the crops */
        for (const crop of monitor.crops) {

            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            // TODO: get type and growth state from the backend
            const cropDrawInfo = cropsImageAtlasHandler.getDrawingInformationFor('TYPE_1', 'FULLY_GROWN')

            if (cropDrawInfo !== undefined) {
                toDrawNormal.push({
                    source: cropDrawInfo,
                    gamePoint: crop,
                    depth: crop.y
                })
            }
        }

        duration.after("draw crops")


        /* Collect the signs */
        for (const sign of monitor.signs.values()) {

            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            let signDrawInfo

            if (sign.type !== undefined) {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation(sign.type, sign.amount)
            } else {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation("nothing", "LARGE")
            }

            if (signDrawInfo !== undefined) {
                toDrawNormal.push({
                    source: signDrawInfo,
                    gamePoint: sign,
                    depth: sign.y
                })
            }
        }

        duration.after("draw signs")


        /* Collect the stones */
        for (const stone of monitor.stones) {

            if (stone.x + 1 < minXInGame || stone.x - 1 > maxXInGame || stone.y + 1 < minYInGame || stone.y - 1 > maxYInGame) {
                continue
            }

            // TODO: pick the right type and size of stone
            const stoneDrawInfo = stoneImageAtlasHandler.getDrawingInformationFor('TYPE_2', 'MIDDLE')

            if (stoneDrawInfo !== undefined) {
                toDrawNormal.push({
                    source: stoneDrawInfo,
                    gamePoint: stone,
                    depth: stone.y
                })
            }
        }

        duration.after("draw stones")


        /* Collect wild animals */
        for (const animal of monitor.wildAnimals.values()) {
            if (animal.betweenPoints && animal.previous && animal.next) {

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

                if (animationImage !== undefined) {
                    toDrawNormal.push({
                        source: animationImage,
                        gamePoint: interpolatedGamePoint,
                        depth: animal.y
                    })
                }

            } else {

                if (animal.x < minXInGame || animal.x > maxXInGame || animal.y < minYInGame || animal.y > maxYInGame) {
                    continue
                }

                if (animal.previous) {
                    const direction = getDirectionForWalkingWorker(animal, animal.previous)

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                    if (animationImage !== undefined) {
                        toDrawNormal.push({
                            source: animationImage,
                            gamePoint: animal,
                            depth: animal.y
                        })
                    }

                    if (this.animationIndex % 100 === 0) {
                        console.log("not moving. previous exists")
                        console.log(direction)
                        console.log(animal)
                        console.log(animationImage)
                    }

                } else {
                    const direction = 'EAST'
                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                    if (animationImage !== undefined) {
                        toDrawNormal.push({
                            source: animationImage,
                            gamePoint: animal,
                            depth: animal.y
                        })
                    }
                }
            }
        }

        duration.after("draw wild animals")


        /* Collect workers */
        for (const worker of monitor.workers.values()) {

            // If worker is moving and not at a fixed point
            if (worker.betweenPoints && worker.previous && worker.next) {

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

                const direction = getDirectionForWalkingWorker(worker.next, worker.previous)

                if (worker.type === "Donkey") {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(direction, this.animationIndex, worker.percentageTraveled)

                    if (donkeyImage !== undefined) {
                        toDrawNormal.push({
                            source: donkeyImage,
                            gamePoint: interpolatedGamePoint,
                            depth: worker.y
                        })
                    }
                } else {
                    const animationImage = workers.get(worker.type)?.getAnimationFrame(direction, this.animationIndex, worker.percentageTraveled)

                    if (animationImage !== undefined) {
                        toDrawNormal.push({
                            source: animationImage,
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y + 0.5 },
                            depth: worker.y
                        })
                    }
                }

                if (worker.cargo) {
                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', worker.cargo) // TODO: use the right nationality

                    if (cargoDrawInfo !== undefined) {
                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: interpolatedGamePoint,
                            depth: worker.y
                        })
                    }
                }
            } else {

                if (worker.x < minXInGame || worker.x > maxXInGame || worker.y < minYInGame || worker.y > maxYInGame) {
                    continue
                }

                let direction: Direction = "WEST"

                if (worker.previous) {
                    direction = getDirectionForWalkingWorker(worker, worker.previous)
                }

                if (worker.type === "Donkey") {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(direction, 0, worker.percentageTraveled)

                    if (donkeyImage !== undefined) {
                        toDrawNormal.push({
                            source: donkeyImage,
                            gamePoint: worker,
                            depth: worker.y
                        })
                    }
                } else {

                    const animationImage = workers.get(worker.type)?.getAnimationFrame(direction, 0, worker.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage,
                            gamePoint: { x: worker.x, y: worker.y + 0.5 },
                            depth: worker.y
                        })
                    }
                }

                if (worker.cargo) {
                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', worker.cargo) // TODO: use the right nationality

                    if (cargoDrawInfo !== undefined) {
                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: worker,
                            depth: worker.y
                        })
                    }
                }
            }
        }

        duration.after("draw workers")


        /* Collect flags */
        let flagCount = 0
        for (const flag of monitor.flags.values()) {

            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const flagDrawInfo = flagAnimations.getAnimationFrame("romans", "NORMAL", this.animationIndex, flagCount)

            if (flagDrawInfo?.image !== undefined) {
                toDrawNormal.push({
                    source: flagDrawInfo,
                    gamePoint: flag,
                    depth: flag.y
                })
            }

            if (flag.stackedCargo) {

                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {

                    const cargo = flag.stackedCargo[i]
                    const color = materialToColor.get(cargo)

                    if (color === undefined) {
                        continue
                    }

                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                    if (cargoDrawInfo !== undefined) {
                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x - 0.5, y: flag.y - 0.5 * i + 0.1 },
                            depth: flag.y
                        })
                    }
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {

                        const cargo = flag.stackedCargo[i]
                        const color = materialToColor.get(cargo)

                        if (color === undefined) {
                            continue
                        }

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                        if (cargoDrawInfo !== undefined) {
                            toDrawNormal.push({
                                source: cargoDrawInfo,
                                gamePoint: { x: flag.x + 0.08, y: flag.y - 0.2 * (i - 4) + 0.3 },
                                depth: flag.y
                            })
                        }
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {

                        const cargo = flag.stackedCargo[i]
                        const color = materialToColor.get(cargo)

                        if (color === undefined) {
                            continue
                        }

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation('ROMANS', cargo) // TODO: use the right nationality

                        if (cargoDrawInfo !== undefined) {
                            toDrawNormal.push({
                                source: cargoDrawInfo,
                                gamePoint: { x: flag.x + 17 / 50, y: flag.y - 0.2 * (i - 4) + 0.1 },
                                depth: flag.y
                            })
                        }

                    }
                }
            }
        }

        duration.after("draw flags")


        /* Collect available construction */
        if (this.props.showAvailableConstruction) {

            for (const [gamePoint, available] of monitor.availableConstruction.entries()) {

                if (available.length === 0) {
                    continue
                }

                if (gamePoint.x < minXInGame || gamePoint.x > maxXInGame || gamePoint.y < minYInGame || gamePoint.y > maxYInGame) {
                    continue
                }

                if (available.includes("large")) {

                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForLargeHouseAvailable()

                    if (largeHouseAvailableInfo !== undefined) {
                        toDrawNormal.push({
                            source: largeHouseAvailableInfo,
                            gamePoint,
                            depth: gamePoint.y
                        })
                    }
                } else if (available.includes("medium")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()

                    if (mediumHouseAvailableInfo !== undefined) {
                        toDrawNormal.push({
                            source: mediumHouseAvailableInfo,
                            gamePoint,
                            depth: gamePoint.y
                        })
                    }
                } else if (available.includes("small")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()

                    if (mediumHouseAvailableInfo !== undefined) {
                        toDrawNormal.push({
                            source: mediumHouseAvailableInfo,
                            gamePoint,
                            depth: gamePoint.y
                        })
                    }
                } else if (available.includes("mine")) {

                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()

                    if (mineAvailableInfo !== undefined) {
                        toDrawNormal.push({
                            source: mineAvailableInfo,
                            gamePoint,
                            depth: gamePoint.y
                        })
                    }
                } else if (available.includes("flag")) {

                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()

                    if (flagAvailableInfo !== undefined) {
                        toDrawNormal.push({
                            source: flagAvailableInfo,
                            gamePoint,
                            depth: gamePoint.y
                        })
                    }

                }
            }
        }

        duration.after("Collect available construction")

        // Draw the Normal layer

        // Sort the toDrawList so it first draws things further away
        const sortedToDrawList = toDrawNormal.sort((draw1, draw2) => {
            return draw2.depth - draw1.depth
        })


        // Draw all regular queued up images in order
        // TODO: add scaling
        // Set up webgl2 with the right shaders
        if (this.gl) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)
        }

        sortedToDrawList.forEach(draw => {

            if (draw.gamePoint !== undefined && draw.source.texture !== undefined) {

                if (this.gl && this.drawImageProgram && draw.gamePoint) {

                    if (oncePerNewSelectionPoint) {
                        console.log("About to draw!")

                        console.log(draw)
                    }

                    this.gl.activeTexture(this.gl.TEXTURE3)
                    this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                    // Re-assign the attribute locations
                    this.drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
                    this.drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

                    if (this.drawImagePositionBuffer) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                        this.gl.vertexAttribPointer(this.drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                        this.gl.enableVertexAttribArray(this.drawImagePositionLocation)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Can't re-init position buffer")
                    }

                    if (this.drawImageTexCoordBuffer) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                        this.gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                        this.gl.enableVertexAttribArray(this.drawImageTexcoordLocation)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Can't re-init tex buffer")
                    }

                    // Re-assign the uniform locations
                    this.drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
                    this.drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
                    this.drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
                    this.drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
                    this.drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
                    this.drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
                    this.drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
                    this.drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")


                    // Tell the fragment shader what texture to use
                    if (this.drawImageTextureLocation !== null) {
                        this.gl.uniform1i(this.drawImageTextureLocation, 3)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Texture uniform not used in the shader")
                    }

                    // Tell the vertex shader where to draw
                    if (this.drawImageGamePointLocation !== null) {
                        this.gl.uniform2f(this.drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Game point uniform not used in the shader")
                    }

                    if (this.drawImageOffsetLocation !== null) {
                        this.gl.uniform2f(this.drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Image offset not used in the shader")
                    }

                    // Tell the vertex shader how to scale
                    if (this.drawImageScaleLocation !== null) {
                        this.gl.uniform1f(this.drawImageScaleLocation, this.props.scale)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Scale not used in the shader")
                    }

                    if (this.drawImageScreenOffsetLocation !== null) {
                        this.gl.uniform2f(this.drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Screen offset not used in the shader")
                    }

                    if (this.drawImageScreenDimensionLocation !== null) {
                        this.gl.uniform2f(this.drawImageScreenDimensionLocation, width, height)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Screen dimension not used in the shader")
                    }

                    // Tell the vertex shader what parts of the source image to draw
                    if (this.drawImageSourceCoordinateLocation !== null) {
                        this.gl.uniform2f(this.drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Source coordinate not used in the shader")
                    }

                    if (this.drawImageSourceDimensionsLocation !== null) {
                        this.gl.uniform2f(this.drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Source dimensions not used in the shader")
                    }

                    if (oncePerNewSelectionPoint) {
                        console.log({
                            u_texture: draw.source.textureIndex,
                            u_game_point: draw.gamePoint,
                            u_screen_offset: [this.props.translateX, this.props.translateY],
                            u_image_offset: [draw.source.offsetX, draw.source.offsetY],
                            u_scale: this.props.scale,
                            u_source_coordinate: [draw.source.sourceX, draw.source.sourceY],
                            u_source_dimensions: [draw.source.width, draw.source.height],
                            u_screen_dimensions: [width, height]
                        })
                    }

                    // Draw the quad (2 triangles = 6 vertices)
                    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                }
            }
        })


        // Handle the hover layer
        let toDrawHover: ToDraw[] = []

        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {

            if (this.props.newRoad !== undefined) {

                const center = this.props.newRoad[this.props.newRoad.length - 1]

                // Draw the starting point
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                if (startPointInfo !== undefined) {
                    toDrawHover.push({
                        source: startPointInfo,
                        gamePoint: center,
                        depth: center.y
                    })
                }
            }

            this.props.possibleRoadConnections.forEach(
                (point, _index) => {

                    const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForSameLevelConnection()

                    if (startPointInfo !== undefined) {
                        toDrawHover.push({
                            source: startPointInfo,
                            gamePoint: point,
                            depth: point.y
                        })
                    }
                }
            )
        }

        duration.after("draw possible road connections")


        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const selectedPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForSelectedPoint()

            if (selectedPointDrawInfo !== undefined) {
                toDrawHover.push({
                    source: selectedPointDrawInfo,
                    gamePoint: this.props.selectedPoint,
                    depth: this.props.selectedPoint.y
                })
            }
        }

        duration.after("draw selected point")


        /* Draw the hover point */
        if (this.state.hoverPoint && this.state.hoverPoint.y > 0) {

            const availableConstructionAtHoverPoint = monitor.availableConstruction.get(this.state.hoverPoint)

            if (availableConstructionAtHoverPoint !== undefined && availableConstructionAtHoverPoint.length > 0) {

                if (availableConstructionAtHoverPoint.includes("large")) {

                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverLargeHouseAvailable()

                    if (largeHouseAvailableInfo !== undefined) {
                        toDrawHover.push({
                            source: largeHouseAvailableInfo,
                            gamePoint: this.state.hoverPoint,
                            depth: this.state.hoverPoint.y
                        })
                    }
                } else if (availableConstructionAtHoverPoint.includes("medium")) {

                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()

                    if (mediumHouseAvailableInfo !== undefined) {
                        toDrawHover.push({
                            source: mediumHouseAvailableInfo,
                            gamePoint: this.state.hoverPoint,
                            depth: this.state.hoverPoint.y
                        })
                    }
                } else if (availableConstructionAtHoverPoint.includes("small")) {

                    const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()

                    if (smallHouseAvailableInfo !== undefined) {
                        toDrawHover.push({
                            source: smallHouseAvailableInfo,
                            gamePoint: this.state.hoverPoint,
                            depth: this.state.hoverPoint.y
                        })
                    }
                } else if (availableConstructionAtHoverPoint.includes("mine")) {

                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()

                    if (mineAvailableInfo !== undefined) {
                        toDrawHover.push({
                            source: mineAvailableInfo,
                            gamePoint: this.state.hoverPoint,
                            depth: this.state.hoverPoint.y
                        })
                    }
                } else if (availableConstructionAtHoverPoint.includes("flag")) {

                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()

                    if (flagAvailableInfo !== undefined) {
                        toDrawHover.push({
                            source: flagAvailableInfo,
                            gamePoint: this.state.hoverPoint,
                            depth: this.state.hoverPoint.y
                        })
                    }
                }
            } else {

                const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()

                if (hoverPointDrawInfo !== undefined) {
                    toDrawHover.push({
                        source: hoverPointDrawInfo,
                        gamePoint: this.state.hoverPoint,
                        depth: this.state.hoverPoint.y
                    })
                }
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting

        // Set up webgl2 with the right shaders
        if (this.gl) {
            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)
        }

        // Go through the images to draw
        toDrawHover.forEach(draw => {

            if (draw.gamePoint !== undefined && draw.source.texture !== undefined) {

                if (this.gl && this.drawImageProgram && draw.gamePoint) {

                    if (oncePerNewSelectionPoint) {
                        console.log("About to draw!")

                        console.log(draw)
                    }

                    this.gl.activeTexture(this.gl.TEXTURE3)
                    this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                    // Re-assign the attribute locations
                    this.drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
                    this.drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

                    if (this.drawImagePositionBuffer) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
                        this.gl.vertexAttribPointer(this.drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
                        this.gl.enableVertexAttribArray(this.drawImagePositionLocation)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Can't re-init position buffer")
                    }

                    if (this.drawImageTexCoordBuffer) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
                        this.gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
                        this.gl.enableVertexAttribArray(this.drawImageTexcoordLocation)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Can't re-init tex buffer")
                    }

                    // Re-assign the uniform locations
                    this.drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
                    this.drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
                    this.drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
                    this.drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
                    this.drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
                    this.drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
                    this.drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
                    this.drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")


                    // Tell the fragment shader what texture to use
                    if (this.drawImageTextureLocation !== null) {
                        this.gl.uniform1i(this.drawImageTextureLocation, 3)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Texture uniform not used in the shader")
                    }

                    // Tell the vertex shader where to draw
                    if (this.drawImageGamePointLocation !== null) {
                        this.gl.uniform2f(this.drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Game point uniform not used in the shader")
                    }

                    if (this.drawImageOffsetLocation !== null) {
                        this.gl.uniform2f(this.drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Image offset not used in the shader")
                    }

                    // Tell the vertex shader how to scale
                    if (this.drawImageScaleLocation !== null) {
                        this.gl.uniform1f(this.drawImageScaleLocation, this.props.scale)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Scale not used in the shader")
                    }

                    if (this.drawImageScreenOffsetLocation !== null) {
                        this.gl.uniform2f(this.drawImageScreenOffsetLocation, this.props.translateX, this.props.translateY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Screen offset not used in the shader")
                    }

                    if (this.drawImageScreenDimensionLocation !== null) {
                        this.gl.uniform2f(this.drawImageScreenDimensionLocation, width, height)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Screen dimension not used in the shader")
                    }

                    // Tell the vertex shader what parts of the source image to draw
                    if (this.drawImageSourceCoordinateLocation !== null) {
                        this.gl.uniform2f(this.drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Source coordinate not used in the shader")
                    }

                    if (this.drawImageSourceDimensionsLocation !== null) {
                        this.gl.uniform2f(this.drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)
                    } else if (oncePerNewSelectionPoint) {
                        console.error("Source dimensions not used in the shader")
                    }

                    if (oncePerNewSelectionPoint) {
                        console.log({
                            u_texture: draw.source.textureIndex,
                            u_game_point: draw.gamePoint,
                            u_screen_offset: [this.props.translateX, this.props.translateY],
                            u_image_offset: [draw.source.offsetX, draw.source.offsetY],
                            u_scale: this.props.scale,
                            u_source_coordinate: [draw.source.sourceX, draw.source.sourceY],
                            u_source_dimensions: [draw.source.width, draw.source.height],
                            u_screen_dimensions: [width, height]
                        })
                    }

                    // Draw the quad (2 triangles = 6 vertices)
                    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
                }
            } else if (oncePerNewSelectionPoint) {
                console.log({ title: "Can't draw", draw })
            }
        })

        duration.after("draw hover point")


        /* Draw house titles */
        if (this.props.showHouseTitles) {

            ctx.font = "bold 10px sans-serif"
            ctx.strokeStyle = 'black'
            ctx.fillStyle = 'yellow'

            for (const house of monitor.houses.values()) {

                if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(house)

                /* Draw the house next to the point, instead of on top */
                screenPoint.x -= 0.8 * this.props.scale // 30
                screenPoint.y -= 1 * scaleY // 15

                let houseTitle = camelCaseToWords(house.type)

                if (house.state === "UNFINISHED") {
                    houseTitle = "(" + houseTitle + ")"
                } else if (house.productivity !== undefined) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

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

export { GameCanvas, intToVegetationColor, vegetationToInt }

