import React, { Component } from 'react'
import { Direction, Point, RoadInformation, VegetationIntegers, VEGETATION_INTEGERS, WildAnimalType, WorkerType, TerrainAtPoint, SNOW_TEXTURE } from './api/types'
import { Duration } from './duration'
import './game_render.css'
import { monitor, TileBelow, TileDownRight } from './api/ws-api'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from './stats'
import { AnimalAnimation, BorderImageAtlasHandler, camelCaseToWords, CargoImageAtlasHandler, CropImageAtlasHandler, DecorationsImageAtlasHandler, DrawingInformation, FireAnimation, gamePointToScreenPoint, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDown, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUp, getPointUpLeft, getPointUpRight, getTimestamp, loadImageNg as loadImageAsync, makeShader, makeTextureFromImage, normalize, resizeCanvasToDisplaySize, RoadBuildingImageAtlasHandler, same, screenPointToGamePoint, ShipImageAtlasHandler, SignImageAtlasHandler, StoneImageAtlasHandler, sumVectors, surroundingPoints, TreeAnimation, Vector, WorkerAnimation } from './utils'
import { PointMapFast, PointSetFast } from './util_types'
import { flagAnimations, houses, uiElementsImageAtlasHandler } from './assets'
import { fogOfWarFragmentShader, fogOfWarVertexShader } from './shaders/fog-of-war'
import { shadowFragmentShader, textureFragmentShader, texturedImageVertexShaderPixelPerfect } from './shaders/image-and-shadow'
import { textureAndLightingFragmentShader, textureAndLightingVertexShader } from './shaders/terrain-and-roads'
import { immediateUxState } from './App'

export const DEFAULT_SCALE = 35.0
export const DEFAULT_HEIGHT_ADJUSTMENT = 10.0
export const STANDARD_HEIGHT = 10.0

const NORMAL_STRAIGHT_UP_VECTOR: Vector = { x: 0, y: 0, z: 1 }
const NORMAL_STRAIGHT_UP_AS_LIST = [0, 0, 1]

const SNOW_TRANSITION_TEXTURE_MAPPING = [192, 176, 255, 176, 225, 191].map(v => v / 255.0)
const OVERLAP_FACTOR = (16.0 / 47.0)

export interface ScreenPoint {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD'

interface TrianglesAtPoint {
    belowVisible: boolean
    downRightVisible: boolean
}

interface ToDraw {
    source: DrawingInformation | undefined
    gamePoint: Point
    height?: number
}

interface MapRenderInformation {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

interface GameCanvasProps {
    cursorState: CursorState
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

    heightAdjust: number

    onPointClicked: ((point: Point) => void)
    onDoubleClick: ((point: Point) => void)
    onKeyDown: ((event: React.KeyboardEvent) => void)
}

interface GameCanvasState {
    hoverPoint?: Point
}

interface BelowAndDownRight {
    below: number[]
    downRight: number[]
}

interface RenderInformation {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
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
const cargoImageAtlasHandler = new CargoImageAtlasHandler("assets/")

const roadBuildingImageAtlasHandler = new RoadBuildingImageAtlasHandler("assets/")

const signImageAtlasHandler = new SignImageAtlasHandler("assets/")

const cropsImageAtlasHandler = new CropImageAtlasHandler("assets/")

const decorationsImageAtlasHandler = new DecorationsImageAtlasHandler("assets/")

const borderImageAtlasHandler = new BorderImageAtlasHandler("assets/")

const TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE = "assets/nature/terrain/greenland/greenland-texture.png"

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

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {
    private normalCanvasRef = React.createRef<HTMLCanvasElement>()
    private overlayCanvasRef = React.createRef<HTMLCanvasElement>()
    private lightVector: number[]
    private debuggedPoint: Point | undefined
    private previousTimestamp?: number
    private previous: number
    private overshoot: number

    private animationIndex: number = 0
    private mapRenderInformation?: MapRenderInformation
    private gl?: WebGL2RenderingContext

    // Map of the normal for each point on the map
    private normals: PointMapFast<Vector>

    // Buffers for drawing the terrain
    private terrainCoordinatesBuffer?: WebGLBuffer | null
    private terrainNormalsBuffer?: WebGLBuffer | null
    private terrainTextureMappingBuffer?: WebGLBuffer | null

    // Buffers for drawing the roads
    private roadCoordinatesBuffer?: WebGLBuffer | null
    private roadNormalsBuffer?: WebGLBuffer | null
    private roadTextureMappingBuffer?: WebGLBuffer | null
    private roadRenderInformation?: RenderInformation

    // Define the program to draw things on the ground (terrain, roads)
    private drawGroundProgram: WebGLProgram | null

    private drawGroundLightVectorUniformLocation?: WebGLUniformLocation | null
    private drawGroundScaleUniformLocation?: WebGLUniformLocation | null
    private drawGroundOffsetUniformLocation?: WebGLUniformLocation | null
    private drawGroundHeightAdjustUniformLocation?: WebGLUniformLocation | null
    private drawGroundSamplerUniformLocation?: WebGLUniformLocation | null
    private drawGroundScreenWidthUniformLocation?: WebGLUniformLocation | null
    private drawGroundScreenHeightUniformLocation?: WebGLUniformLocation | null

    private drawGroundCoordAttributeLocation?: number
    private drawGroundNormalAttributeLocation?: number
    private drawGroundTextureMappingAttributeLocation?: number

    // Define the fog of war drawing program
    private fogOfWarRenderProgram: WebGLProgram | null

    private fogOfWarCoordAttributeLocation?: number
    private fogOfWarIntensityAttributeLocation?: number

    private fogOfWarScaleUniformLocation?: WebGLUniformLocation | null
    private fogOfWarOffsetUniformLocation?: WebGLUniformLocation | null
    private fogOfWarScreenHeightUniformLocation?: WebGLUniformLocation | null
    private fogOfWarScreenWidthUniformLocation?: WebGLUniformLocation | null

    // Buffers for drawing the fog of war
    private fogOfWarCoordBuffer?: WebGLBuffer | null
    private fogOfWarIntensityBuffer?: WebGLBuffer | null

    private fogOfWarCoordinates: number[] = []
    private fogOfWarIntensities: number[] = []

    // Define the webgl program to draw shadows (it shares buffers with the draw images program)
    private drawShadowProgram: WebGLProgram | null

    private drawShadowHeightAdjustmentUniformLocation?: WebGLUniformLocation | null
    private drawShadowHeightUniformLocation?: WebGLUniformLocation | null

    // Define the webgl draw image program
    private drawImageProgram: WebGLProgram | null

    private drawImagePositionLocation?: number
    private drawImageTexcoordLocation?: number

    private drawImageHeightAdjustmentLocation?: WebGLUniformLocation | null
    private drawImageHeightLocation?: WebGLUniformLocation | null

    // The buffers used by the draw image program. They are static and the content is set through uniforms
    private drawImageTexCoordBuffer?: WebGLBuffer | null
    private drawImagePositionBuffer?: WebGLBuffer | null
    private drawShadowTexCoordBuffer?: WebGLBuffer | null
    private drawShadowPositionBuffer?: WebGLBuffer | null

    private allPointsVisibilityTracking = new PointMapFast<TrianglesAtPoint>()

    constructor(props: GameCanvasProps) {
        super(props)

        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this)
        this.screenPointToGamePointNoHeightAdjustment = this.screenPointToGamePointNoHeightAdjustment.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.updateRoadDrawingBuffers = this.updateRoadDrawingBuffers.bind(this)
        this.onClickOrDoubleClick = this.onClickOrDoubleClick.bind(this)

        this.normals = new PointMapFast()

        /* Define the light vector */
        const lightVector = { x: 1, y: 1, z: -1 }
        this.lightVector = [lightVector.x, lightVector.y, lightVector.z]

        addVariableIfAbsent("fps")

        this.state = {}

        this.drawGroundProgram = null
        this.drawImageProgram = null
        this.drawShadowProgram = null

        this.previous = performance.now()
        this.overshoot = 0

        // Start tracking visible triangles
        monitor.allTiles.forEach(tile => this.allPointsVisibilityTracking.set(tile.point, { belowVisible: false, downRightVisible: false }))
    }

    componentDidUpdate(prevProps: GameCanvasProps): void {
        if (prevProps.cursorState !== this.props.cursorState && this?.normalCanvasRef?.current) {
            if (this.props.cursorState === 'DRAGGING') {
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

        if (this.gl !== undefined && this.drawGroundProgram !== undefined &&
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

    updateFogOfWarRendering() {
        const triangles = getTrianglesAffectedByFogOfWar(monitor.discoveredPoints, monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)

        this.fogOfWarCoordinates = []
        this.fogOfWarIntensities = []

        triangles.forEach(triangle => {
            this.fogOfWarCoordinates.push(triangle[0].point.x)
            this.fogOfWarCoordinates.push(triangle[0].point.y)

            this.fogOfWarCoordinates.push(triangle[1].point.x)
            this.fogOfWarCoordinates.push(triangle[1].point.y)

            this.fogOfWarCoordinates.push(triangle[2].point.x)
            this.fogOfWarCoordinates.push(triangle[2].point.y)

            this.fogOfWarIntensities.push(triangle[0].intensity)
            this.fogOfWarIntensities.push(triangle[1].intensity)
            this.fogOfWarIntensities.push(triangle[2].intensity)
        })

        // Add triangles to draw black
        monitor.discoveredBelowTiles.forEach(discoveredBelow => {
            const below = this.allPointsVisibilityTracking.get(discoveredBelow.pointAbove)

            if (below) {
                below.belowVisible = true
            }
        })

        monitor.discoveredDownRightTiles.forEach(discoveredDownRight => {
            const downRight = this.allPointsVisibilityTracking.get(discoveredDownRight.pointLeft)

            if (downRight) {
                downRight.downRightVisible = true
            }
        })

        this.allPointsVisibilityTracking.forEach((trianglesAtPoint, point) => {
            const downLeft = getPointDownLeft(point)
            const downRight = getPointDownRight(point)
            const right = getPointRight(point)

            if (!trianglesAtPoint.belowVisible) {
                this.fogOfWarCoordinates.push(point.x)
                this.fogOfWarCoordinates.push(point.y)

                this.fogOfWarCoordinates.push(downLeft.x)
                this.fogOfWarCoordinates.push(downLeft.y)

                this.fogOfWarCoordinates.push(downRight.x)
                this.fogOfWarCoordinates.push(downRight.y)

                this.fogOfWarIntensities.push(0)
                this.fogOfWarIntensities.push(0)
                this.fogOfWarIntensities.push(0)
            }

            if (!trianglesAtPoint.downRightVisible) {
                this.fogOfWarCoordinates.push(point.x)
                this.fogOfWarCoordinates.push(point.y)

                this.fogOfWarCoordinates.push(right.x)
                this.fogOfWarCoordinates.push(right.y)

                this.fogOfWarCoordinates.push(downRight.x)
                this.fogOfWarCoordinates.push(downRight.y)

                this.fogOfWarIntensities.push(0)
                this.fogOfWarIntensities.push(0)
                this.fogOfWarIntensities.push(0)
            }
        })
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


        // Start tracking visible triangles
        if (this.allPointsVisibilityTracking.size === 0) {
            monitor.allTiles.forEach(tile => this.allPointsVisibilityTracking.set(tile.point, { belowVisible: false, downRightVisible: false }))
        }

        this.updateFogOfWarRendering()

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
        monitor.listenToDiscoveredPoints(points => {

            // Update the calculated normals
            this.calculateNormalsForEachPoint(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles)
            console.log("New discovered points - calculated normals")

            // Update the map rendering buffers
            if (this.gl && this.drawGroundProgram) {
                if (this.terrainCoordinatesBuffer !== undefined && this.terrainNormalsBuffer !== undefined && this.terrainTextureMappingBuffer !== undefined) {

                    const mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles, monitor.allTiles)

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

            // Update fog of war rendering
            this.updateFogOfWarRendering()
        })

        console.log("Subscribed to changes in discovered points")

        /* Subscribe for added and removed roads */
        monitor.listenToRoads(this.updateRoadDrawingBuffers)

        console.log("Subscribed to changes in roads")

        /* Put together the render information from the discovered tiles */
        this.mapRenderInformation = this.prepareToRenderFromTiles(monitor.discoveredBelowTiles, monitor.discoveredDownRightTiles, monitor.allTiles)

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
                const drawFogOfWarVertexShader = makeShader(gl, fogOfWarVertexShader, gl.VERTEX_SHADER)
                const drawFogOfWarFragmentShader = makeShader(gl, fogOfWarFragmentShader, gl.FRAGMENT_SHADER)

                // Create the programs
                this.drawGroundProgram = gl.createProgram()
                this.drawImageProgram = gl.createProgram()
                this.drawShadowProgram = gl.createProgram()
                this.fogOfWarRenderProgram = gl.createProgram()

                // Setup the program to render the ground
                if (this.drawGroundProgram && lightingVertexShader && lightingFragmentShader) {
                    gl.attachShader(this.drawGroundProgram, lightingVertexShader)
                    gl.attachShader(this.drawGroundProgram, lightingFragmentShader)
                    gl.linkProgram(this.drawGroundProgram)
                    gl.useProgram(this.drawGroundProgram)
                    gl.viewport(0, 0, canvas.width, canvas.height)

                    const maxNumberTriangles = 500 * 500 * 2 // monitor.allTiles.keys.length * 2

                    // Get handles
                    this.drawGroundLightVectorUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_light_vector")
                    this.drawGroundScaleUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_scale")
                    this.drawGroundOffsetUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_offset")
                    this.drawGroundHeightAdjustUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_height_adjust")
                    this.drawGroundSamplerUniformLocation = gl.getUniformLocation(this.drawGroundProgram, 'u_sampler')
                    this.drawGroundScreenWidthUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_screen_width")
                    this.drawGroundScreenHeightUniformLocation = gl.getUniformLocation(this.drawGroundProgram, "u_screen_height")
                    this.drawGroundCoordAttributeLocation = gl.getAttribLocation(this.drawGroundProgram, "a_coords")
                    this.drawGroundNormalAttributeLocation = gl.getAttribLocation(this.drawGroundProgram, "a_normal")
                    this.drawGroundTextureMappingAttributeLocation = gl.getAttribLocation(this.drawGroundProgram, "a_texture_mapping")

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

                    // Get attribute and uniform locations
                    this.drawImagePositionLocation = gl.getAttribLocation(this.drawImageProgram, "a_position")
                    this.drawImageTexcoordLocation = gl.getAttribLocation(this.drawImageProgram, "a_texcoord")
                    this.drawImageHeightAdjustmentLocation = gl.getUniformLocation(this.drawImageProgram, "u_height_adjust")
                    this.drawImageHeightLocation = gl.getUniformLocation(this.drawImageProgram, "u_height")

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

                // Setup the program to render the fog of war
                if (this.fogOfWarRenderProgram && drawFogOfWarFragmentShader && drawFogOfWarVertexShader) {
                    gl.attachShader(this.fogOfWarRenderProgram, drawFogOfWarVertexShader)
                    gl.attachShader(this.fogOfWarRenderProgram, drawFogOfWarFragmentShader)

                    gl.linkProgram(this.fogOfWarRenderProgram)
                    gl.useProgram(this.fogOfWarRenderProgram)

                    // Get attribute locations
                    this.fogOfWarCoordAttributeLocation = gl.getAttribLocation(this.fogOfWarRenderProgram, "a_coordinates")
                    this.fogOfWarIntensityAttributeLocation = gl.getAttribLocation(this.fogOfWarRenderProgram, "a_intensity")
                    this.fogOfWarScaleUniformLocation = gl.getUniformLocation(this.fogOfWarRenderProgram, "u_scale")
                    this.fogOfWarOffsetUniformLocation = gl.getUniformLocation(this.fogOfWarRenderProgram, "u_offset")
                    this.fogOfWarScreenHeightUniformLocation = gl.getUniformLocation(this.fogOfWarRenderProgram, "u_screen_height")
                    this.fogOfWarScreenWidthUniformLocation = gl.getUniformLocation(this.fogOfWarRenderProgram, "u_screen_width")

                    // Create the coordinate buffer
                    this.fogOfWarCoordBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.fogOfWarCoordBuffer)

                    // Create the intensity buffer
                    this.fogOfWarIntensityBuffer = gl.createBuffer()
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.fogOfWarIntensityBuffer)

                    // Turn on the coordinate attribute and configure it
                    gl.enableVertexAttribArray(this.fogOfWarCoordAttributeLocation)

                    gl.vertexAttribPointer(this.fogOfWarCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0)

                    // Turn on the intensity attribute and configure it
                    gl.enableVertexAttribArray(this.fogOfWarIntensityAttributeLocation)

                    gl.vertexAttribPointer(this.fogOfWarIntensityAttributeLocation, 1, gl.FLOAT, false, 0, 0)
                }

                // Setup the program to render shadows
                if (this.drawShadowProgram && drawImageVertexShader && drawShadowFragmentShader) {
                    gl.attachShader(this.drawShadowProgram, drawImageVertexShader)
                    gl.attachShader(this.drawShadowProgram, drawShadowFragmentShader)

                    gl.linkProgram(this.drawShadowProgram)
                    gl.useProgram(this.drawImageProgram)

                    gl.viewport(0, 0, canvas.width, canvas.height)

                    // Get attribute and uniform locations
                    const positionLocation = gl.getAttribLocation(this.drawShadowProgram, "a_position")
                    const texcoordLocation = gl.getAttribLocation(this.drawShadowProgram, "a_texcoord")
                    this.drawShadowHeightAdjustmentUniformLocation = gl.getUniformLocation(this.drawShadowProgram, "u_height_adjust")
                    this.drawShadowHeightUniformLocation = gl.getUniformLocation(this.drawShadowProgram, "u_height")

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

        // Make sure gl is available
        if (this.gl === undefined) {
            console.error("Gl is not available")

            return
        }

        this.gl.viewport(0, 0, width, height)

        /* Clear the drawing list */
        const toDrawNormal: ToDraw[] = []
        const shadowsToDraw: ToDraw[] = []


        /* Clear the overlay - make it fully transparent */
        overlayCtx.clearRect(0, 0, width, height)

        let oncePerNewSelectionPoint = false

        const upLeft = this.screenPointToGamePointNoHeightAdjustment({ x: 0, y: 0 })
        const downRight = this.screenPointToGamePointNoHeightAdjustment({ x: width, y: height })

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
        if (this.drawGroundProgram &&
            this.mapRenderInformation &&
            this.drawGroundScreenWidthUniformLocation !== undefined &&
            this.drawGroundScreenHeightUniformLocation !== undefined &&
            this.drawGroundLightVectorUniformLocation !== undefined &&
            this.drawGroundScaleUniformLocation !== undefined &&
            this.drawGroundOffsetUniformLocation !== undefined &&
            this.drawGroundCoordAttributeLocation !== undefined &&
            this.drawGroundNormalAttributeLocation !== undefined &&
            this.drawGroundTextureMappingAttributeLocation !== undefined &&
            this.drawGroundSamplerUniformLocation !== undefined &&
            this.drawGroundHeightAdjustUniformLocation !== undefined &&
            this.terrainCoordinatesBuffer !== undefined &&
            this.terrainNormalsBuffer !== undefined &&
            this.terrainTextureMappingBuffer !== undefined &&
            this.mapRenderInformation) {

            const gl = this.gl

            gl.useProgram(this.drawGroundProgram)

            // Configure the drawing context
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            // Set the constants
            gl.uniform1f(this.drawGroundScreenWidthUniformLocation, width)
            gl.uniform1f(this.drawGroundScreenHeightUniformLocation, height)
            gl.uniform3fv(this.drawGroundLightVectorUniformLocation, this.lightVector)
            gl.uniform2f(this.drawGroundScaleUniformLocation, immediateUxState.scale, immediateUxState.scale)
            gl.uniform2f(this.drawGroundOffsetUniformLocation, immediateUxState.translate.x, immediateUxState.translate.y)
            gl.uniform1f(this.drawGroundHeightAdjustUniformLocation, this.props.heightAdjust)
            gl.uniform1i(this.drawGroundSamplerUniformLocation, 1)

            // Set up the buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainCoordinatesBuffer)
            gl.vertexAttribPointer(this.drawGroundCoordAttributeLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundCoordAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainNormalsBuffer)
            gl.vertexAttribPointer(this.drawGroundNormalAttributeLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundNormalAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.terrainTextureMappingBuffer)
            gl.vertexAttribPointer(this.drawGroundTextureMappingAttributeLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundTextureMappingAttributeLocation)

            // Fill the screen with black color
            gl.clearColor(0.0, 0.0, 0.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            // Draw the triangles: mode, offset (nr vertices), count (nr vertices)
            gl.drawArrays(gl.TRIANGLES, 0, this.mapRenderInformation.coordinates.length / 3)
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
                })

                shadowsToDraw.push({
                    source: image[1],
                    gamePoint: decoration,
                })
            } else if (oncePerNewSelectionPoint) {
                console.log({ title: 'No image!', decoration: decoration })
            }
        })

        // Set up webgl2 with the right shaders to prepare for drawing normal objects
        if (this.drawImageProgram &&
            this.drawImagePositionBuffer &&
            this.drawImageTexCoordBuffer &&
            this.drawImageHeightAdjustmentLocation &&
            this.drawImageHeightLocation) {

            this.gl.useProgram(this.drawImageProgram)

            this.gl.viewport(0, 0, width, height)

            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)

            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
            this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImagePositionLocation)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
            this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImageTexcoordLocation)

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawImageProgram, "u_screen_dimensions")

            const gl = this.gl

            // Draw decorations objects
            for (const draw of decorationsToDraw) {
                if (draw?.source?.texture !== undefined) {

                    gl.activeTexture(gl.TEXTURE3)
                    gl.bindTexture(gl.TEXTURE_2D, draw.source.texture)

                    // Set the constants
                    gl.uniform1i(drawImageTextureLocation, 3)
                    gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                    gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)
                    gl.uniform1f(drawImageScaleLocation, immediateUxState.scale)
                    gl.uniform2f(drawImageScreenOffsetLocation, immediateUxState.translate.x, immediateUxState.translate.y)
                    gl.uniform2f(drawImageScreenDimensionLocation, width, height)
                    gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                    gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)
                    gl.uniform1f(this.drawImageHeightAdjustmentLocation, this.props.heightAdjust)
                    gl.uniform1f(this.drawImageHeightLocation, monitor.getHeight(draw.gamePoint))

                    // Draw the quad (2 triangles = 6 vertices)
                    gl.drawArrays(gl.TRIANGLES, 0, 6)
                }
            }
        }

        duration.after("drawing decorations")


        /* Draw the road layer */
        if (this.drawGroundProgram && this.mapRenderInformation &&
            this.drawGroundScreenWidthUniformLocation !== undefined &&
            this.drawGroundScreenHeightUniformLocation !== undefined &&
            this.drawGroundLightVectorUniformLocation !== undefined &&
            this.drawGroundScaleUniformLocation !== undefined &&
            this.drawGroundOffsetUniformLocation !== undefined &&
            this.drawGroundCoordAttributeLocation !== undefined &&
            this.drawGroundNormalAttributeLocation !== undefined &&
            this.drawGroundTextureMappingAttributeLocation !== undefined &&
            this.drawGroundSamplerUniformLocation !== undefined &&
            this.roadRenderInformation !== undefined &&
            this.roadCoordinatesBuffer !== undefined &&
            this.roadNormalsBuffer !== undefined &&
            this.roadTextureMappingBuffer !== undefined &&
            this.drawGroundHeightAdjustUniformLocation !== undefined) {

            const gl = this.gl

            gl.useProgram(this.drawGroundProgram)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

            // Set screen width and height
            gl.uniform1f(this.drawGroundScreenWidthUniformLocation, width)
            gl.uniform1f(this.drawGroundScreenHeightUniformLocation, height)

            // Set the light vector
            gl.uniform3fv(this.drawGroundLightVectorUniformLocation, this.lightVector)

            // Set the current values for the scale, offset and the sampler
            gl.uniform2f(this.drawGroundScaleUniformLocation, immediateUxState.scale, immediateUxState.scale)
            gl.uniform2f(this.drawGroundOffsetUniformLocation, immediateUxState.translate.x, immediateUxState.translate.y)

            // Draw the roads
            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadCoordinatesBuffer)
            gl.vertexAttribPointer(this.drawGroundCoordAttributeLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundCoordAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadNormalsBuffer)
            gl.vertexAttribPointer(this.drawGroundNormalAttributeLocation, 3, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundNormalAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.roadTextureMappingBuffer)
            gl.vertexAttribPointer(this.drawGroundTextureMappingAttributeLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.drawGroundTextureMappingAttributeLocation)

            gl.uniform1i(this.drawGroundSamplerUniformLocation, 1)
            gl.uniform1f(this.drawGroundHeightAdjustUniformLocation, this.props.heightAdjust)

            gl.drawArrays(gl.TRIANGLES, 0, this.roadRenderInformation?.coordinates.length / 3)
        } else {
            console.error("Missing information to draw roads")
        }

        duration.after("draw roads")


        // Handle the the Normal layer. First, collect information of what to draw for each type of object

        /* Collect borders to draw */
        monitor.border.forEach((borderForPlayer) => {
            borderForPlayer.points.forEach(borderPoint => {
                if (borderPoint.x < minXInGame || borderPoint.x > maxXInGame || borderPoint.y < minYInGame || borderPoint.y > maxYInGame) {
                    return
                }

                const borderPointInfo = borderImageAtlasHandler.getDrawingInformation(borderForPlayer.nation, borderForPlayer.color, 'LAND')

                toDrawNormal.push({
                    source: borderPointInfo,
                    gamePoint: borderPoint,
                })
            })
        })

        duration.after("collect borders")


        /* Collect the houses */
        for (const house of monitor.houses.values()) {
            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            if (house.state === 'PLANNED') {
                const plannedDrawInformation = houses.getDrawingInformationForHouseJustStarted(house.nation)

                toDrawNormal.push({
                    source: plannedDrawInformation,
                    gamePoint: house,
                })
            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireAnimations.getAnimationFrame(size, this.animationIndex)

                if (fireDrawInformation) {
                    toDrawNormal.push({
                        source: fireDrawInformation[0],
                        gamePoint: house,
                    })

                    shadowsToDraw.push({
                        source: fireDrawInformation[1],
                        gamePoint: house,
                    })
                }
            } else if (house.state === 'DESTROYED') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireImageAtlas.getBurntDownDrawingInformation(size)

                toDrawNormal.push({
                    source: fireDrawInformation,
                    gamePoint: house,
                })
            } else if (house.state === "UNFINISHED" && house.constructionProgress !== undefined) {
                const houseUnderConstruction = houses.getDrawingInformationForHouseUnderConstruction(house.nation, house.type)

                if (houseUnderConstruction) {
                    toDrawNormal.push({
                        source: houseUnderConstruction[0],
                        gamePoint: house,
                    })

                    shadowsToDraw.push({
                        source: houseUnderConstruction[1],
                        gamePoint: house,
                    })
                }

                const houseDrawInformation = houses.getPartialHouseReady(house.nation, house.type, house.constructionProgress)

                if (houseDrawInformation) {
                    toDrawNormal.push({
                        source: houseDrawInformation[0],
                        gamePoint: house,
                    })

                    shadowsToDraw.push({
                        source: houseDrawInformation[1],
                        gamePoint: house,
                    })
                }
            } else {
                const houseDrawInformation = houses.getDrawingInformationForHouseReady(house.nation, house.type)

                if (houseDrawInformation) {
                    toDrawNormal.push({
                        source: houseDrawInformation[0],
                        gamePoint: house,
                    })

                    shadowsToDraw.push({
                        source: houseDrawInformation[1],
                        gamePoint: house,
                    })
                }

                if (house.door === 'OPEN') {
                    const door = houses.getDrawingInformationForOpenDoor(house.nation, house.type)

                    toDrawNormal.push({
                        source: door,
                        gamePoint: house,
                    })
                }
            }
        }

        duration.after("collect houses")


        /* Collect the trees */
        let treeIndex = 0
        for (const tree of monitor.trees.values()) {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                continue
            }

            let treeDrawInfo

            if (tree.size === 'FULL_GROWN') {
                treeDrawInfo = treeAnimations.getAnimationFrame(tree.type, this.animationIndex, treeIndex)

                if (treeDrawInfo) {
                    toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                    })

                    shadowsToDraw.push({
                        source: treeDrawInfo[1],
                        gamePoint: tree,
                    })
                }
            } else {
                treeDrawInfo = treeImageAtlasHandler.getImageForGrowingTree(tree.type, tree.size)

                if (treeDrawInfo) {
                    toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                    })

                    shadowsToDraw.push({
                        source: treeDrawInfo[1],
                        gamePoint: tree,
                    })
                }
            }

            treeIndex = treeIndex + 1
        }

        monitor.fallingTrees.forEach(tree => {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                return
            }

            const treeDrawInfo = treeAnimations.getFallingTree(tree.type, tree.animation)

            if (treeDrawInfo) {
                toDrawNormal.push({
                    source: treeDrawInfo[0],
                    gamePoint: tree,
                })

                shadowsToDraw.push({
                    source: treeDrawInfo[1],
                    gamePoint: tree,
                })
            }
        })

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
                })

                shadowsToDraw.push({
                    source: cropDrawInfo[1],
                    gamePoint: crop,
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
                signDrawInfo = signImageAtlasHandler.getDrawingInformation("NOTHING", "LARGE")
            }

            if (signDrawInfo) {
                toDrawNormal.push({
                    source: signDrawInfo[0],
                    gamePoint: sign,
                })

                shadowsToDraw.push({
                    source: signDrawInfo[1],
                    gamePoint: sign,
                })
            }
        }

        duration.after("collect signs")


        /* Collect the stones */
        for (const stone of monitor.stones.values()) {
            if (stone.x + 1 < minXInGame || stone.x - 1 > maxXInGame || stone.y + 1 < minYInGame || stone.y - 1 > maxYInGame) {
                continue
            }

            const stoneDrawInfo = stoneImageAtlasHandler.getDrawingInformationFor(stone.type, stone.amount)

            if (stoneDrawInfo) {
                toDrawNormal.push({
                    source: stoneDrawInfo[0],
                    gamePoint: stone
                })

                shadowsToDraw.push({
                    source: stoneDrawInfo[1],
                    gamePoint: stone
                })
            }
        }

        duration.after("collect stones")


        /* Collect wild animals */
        for (const animal of monitor.wildAnimals.values()) {

            // Animal is walking between fixed points
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

                const interpolatedHeight = interpolateHeight(animal.previous, animal.next, animal.percentageTraveled / 100)

                const direction = getDirectionForWalkingWorker(animal.next, animal.previous)

                const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                if (animationImage) {
                    toDrawNormal.push({
                        source: animationImage[0],
                        gamePoint: interpolatedGamePoint,
                        height: interpolatedHeight
                    })

                    if (animationImage.length > 1) {
                        shadowsToDraw.push({
                            source: animationImage[1],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    }
                }

                // Animal is standing at a fixed point
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
                            gamePoint: animal
                        })

                        if (animationImage.length > 1) {
                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: animal
                            })
                        }
                    }
                } else {
                    const direction = 'EAST'
                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, this.animationIndex, animal.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: animal
                        })

                        if (animationImage.length > 1) {
                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: animal
                            })
                        }
                    }
                }
            }
        }

        duration.after("collect wild animals")


        /* Collect ships */
        for (const ship of monitor.ships.values()) {

            // ship is moving and not at a fixed point
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

                const interpolatedHeight = interpolateHeight(ship.previous, ship.next, ship.percentageTraveled / 100)

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
                        height: interpolatedHeight
                    })

                    shadowsToDraw.push({
                        source: shipImage[1],
                        gamePoint: interpolatedGamePoint,
                        height: interpolatedHeight
                    })
                }

                // Ship is at a fixed point
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
                        gamePoint: ship
                    })

                    shadowsToDraw.push({
                        source: shipImage[1],
                        gamePoint: ship
                    })
                }
            }
        }


        /* Collect workers */
        for (const worker of monitor.workers.values()) {

            // Worker is moving and not at a fixed point
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

                const interpolatedHeight = interpolateHeight(worker.previous, worker.next, worker.percentageTraveled / 100)

                if (worker.type === "Donkey") {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, this.animationIndex, worker.percentageTraveled)

                    if (donkeyImage) {
                        toDrawNormal.push({
                            source: donkeyImage[0],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })

                        if (donkeyImage.length > 1) {
                            shadowsToDraw.push({
                                source: donkeyImage[1],
                                gamePoint: interpolatedGamePoint,
                                height: interpolatedHeight
                            })
                        }
                    }

                    if (worker.cargo) {
                        const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)

                        toDrawNormal.push({
                            source: cargoImage,
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    }
                } else if (worker.type === "Courier" || worker.type === 'StorageWorker') {
                    let image

                    if (worker.cargo) {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, this.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, this.animationIndex, worker.percentageTraveled)
                        }
                    } else {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, this.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, this.animationIndex, worker.percentageTraveled)
                        }
                    }

                    if (image) {
                        toDrawNormal.push({
                            source: image[0],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })

                        shadowsToDraw.push({
                            source: image[1],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    }
                } else {
                    const animationImage = workers.get(worker.type)?.getAnimationFrame(worker.nation, worker.direction, worker.color, this.animationIndex, worker.percentageTraveled)

                    if (animationImage) {
                        toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y },
                            height: interpolatedHeight
                        })

                        shadowsToDraw.push({
                            source: animationImage[1],
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y },
                            height: interpolatedHeight
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
                            height: interpolatedHeight
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)

                        if (cargo) {
                            toDrawNormal.push({
                                source: cargo,
                                gamePoint: interpolatedGamePoint,
                                height: interpolatedHeight
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
                            gamePoint: worker
                        })

                        shadowsToDraw.push({
                            source: donkeyImage[1],
                            gamePoint: worker
                        })
                    }


                    if (worker.cargo) {
                        const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)

                        toDrawNormal.push({
                            source: cargoImage,
                            gamePoint: worker
                        })
                    }
                } else if (worker.type === "Courier" || worker.type === 'StorageWorker') {
                    let didDrawAnimation = false

                    if (worker.action && worker.actionAnimationIndex !== undefined) {
                        if (worker.bodyType === 'FAT') {
                            const animationImage = fatCarrierNoCargo.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y }
                                })
                            }
                        } else {
                            const animationImage = thinCarrierNoCargo.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y }
                                })
                            }
                        }
                    }

                    if (!didDrawAnimation) {
                        let image

                        if (worker.cargo) {
                            if (worker?.bodyType === 'FAT') {
                                image = fatCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled)
                            } else {
                                image = thinCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled)
                            }
                        } else {
                            if (worker?.bodyType === 'FAT') {
                                image = fatCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled)
                            } else {
                                image = thinCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled)
                            }
                        }

                        if (image) {
                            toDrawNormal.push({
                                source: image[0],
                                gamePoint: worker
                            })

                            shadowsToDraw.push({
                                source: image[1],
                                gamePoint: worker
                            })
                        }
                    }
                } else {
                    let didDrawAnimation = false

                    if (worker.action && worker.actionAnimationIndex !== undefined) {
                        const animationImage = workers.get(worker.type)?.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                        if (animationImage) {
                            didDrawAnimation = true

                            toDrawNormal.push({
                                source: animationImage,
                                gamePoint: { x: worker.x, y: worker.y }
                            })
                        }
                    }

                    if (!didDrawAnimation) {
                        const animationImage = workers.get(worker.type)?.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled / 10)

                        if (animationImage) {
                            toDrawNormal.push({
                                source: animationImage[0],
                                gamePoint: { x: worker.x, y: worker.y }
                            })

                            shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: { x: worker.x, y: worker.y }
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
                            gamePoint: worker
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, this.animationIndex, worker.percentageTraveled / 10)

                        toDrawNormal.push({
                            source: cargo,
                            gamePoint: worker
                        })
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

            const flagDrawInfo = flagAnimations.getAnimationFrame(flag.nation, flag.color, flag.type, this.animationIndex, flagCount)

            if (flagDrawInfo) {
                toDrawNormal.push({
                    source: flagDrawInfo[0],
                    gamePoint: flag
                })

                shadowsToDraw.push({
                    source: flagDrawInfo[1],
                    gamePoint: flag
                })
            }

            if (flag.stackedCargo) {
                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {
                    const cargo = flag.stackedCargo[i]

                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                    toDrawNormal.push({
                        source: cargoDrawInfo,
                        gamePoint: { x: flag.x - 0.3, y: flag.y - 0.1 * i + 0.3 },
                        height: monitor.getHeight(flag)
                    })
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {
                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x + 0.08, y: flag.y - 0.1 * i + 0.2 },
                            height: monitor.getHeight(flag)
                        })
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {
                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x + 17 / 50, y: flag.y - 0.1 * (i - 4) + 0.2 },
                            height: monitor.getHeight(flag)
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
                        gamePoint
                    })
                } else if (available.includes("medium")) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes("small")) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes("mine")) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()

                    toDrawNormal.push({
                        source: mineAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes("flag")) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()

                    toDrawNormal.push({
                        source: flagAvailableInfo,
                        gamePoint
                    })
                }
            }
        }

        duration.after("Collect available construction")


        // Draw the Shadow layer and the Normal layer

        // Sort the toDrawList so it first draws things further away
        const sortedToDrawList = toDrawNormal.sort((draw1, draw2) => {
            return draw2.gamePoint.y - draw1.gamePoint.y
        })


        // Set up webgl2 with the right shaders to prepare for drawing shadows
        if (this.drawShadowProgram &&
            this.drawImagePositionBuffer &&
            this.drawImageTexCoordBuffer &&
            this.drawShadowHeightAdjustmentUniformLocation !== undefined &&
            this.drawShadowHeightUniformLocation !== undefined) {

            // Use the shadow drawing gl program
            this.gl.useProgram(this.drawShadowProgram)

            // Configure the drawing
            this.gl.viewport(0, 0, width, height)
            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)

            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawShadowProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawShadowProgram, "a_texcoord")

            // Re-assign the uniform locations
            const drawImageTextureLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_texture")
            const drawImageGamePointLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_game_point")
            const drawImageScreenOffsetLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_screen_offset")
            const drawImageOffsetLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_image_offset")
            const drawImageScaleLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_scale")
            const drawImageSourceCoordinateLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_source_coordinate")
            const drawImageSourceDimensionsLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_source_dimensions")
            const drawImageScreenDimensionLocation = this.gl.getUniformLocation(this.drawShadowProgram, "u_screen_dimensions")

            // Set the buffers
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
            this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImagePositionLocation)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
            this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImageTexcoordLocation)

            // Draw all shadows
            for (const shadow of shadowsToDraw) {
                if (shadow.gamePoint === undefined || shadow.source?.texture === undefined) {
                    continue
                }

                // Set the texture
                this.gl.activeTexture(this.gl.TEXTURE3)
                this.gl.bindTexture(this.gl.TEXTURE_2D, shadow.source.texture)

                // Set the constants
                this.gl.uniform1i(drawImageTextureLocation, 3)
                this.gl.uniform2f(drawImageGamePointLocation, shadow.gamePoint.x, shadow.gamePoint.y)
                this.gl.uniform2f(drawImageOffsetLocation, shadow.source.offsetX, shadow.source.offsetY)
                this.gl.uniform1f(drawImageScaleLocation, immediateUxState.scale)
                this.gl.uniform2f(drawImageScreenOffsetLocation, immediateUxState.translate.x, immediateUxState.translate.y)
                this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)
                this.gl.uniform2f(drawImageSourceCoordinateLocation, shadow.source.sourceX, shadow.source.sourceY)
                this.gl.uniform2f(drawImageSourceDimensionsLocation, shadow.source.width, shadow.source.height)
                this.gl.uniform1f(this.drawShadowHeightAdjustmentUniformLocation, this.props.heightAdjust)

                if (shadow.height !== undefined) {
                    this.gl.uniform1f(this.drawShadowHeightUniformLocation, shadow.height)
                } else {
                    this.gl.uniform1f(this.drawShadowHeightUniformLocation, monitor.getHeight(shadow.gamePoint))
                }

                // Draw the quad (2 triangles = 6 vertices)
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
            }
        }

        // Set up webgl2 with the right shaders to prepare for drawing normal objects
        if (this.drawImageProgram &&
            this.drawImageHeightAdjustmentLocation &&
            this.drawImageHeightLocation &&
            this.drawImagePositionBuffer &&
            this.drawImageTexCoordBuffer) {

            // Use the draw image program
            this.gl.useProgram(this.drawImageProgram)

            // Configure the drawing
            this.gl.viewport(0, 0, width, height)
            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)

            // Re-assign the attribute locations
            const drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            const drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
            this.gl.vertexAttribPointer(drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImagePositionLocation)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
            this.gl.vertexAttribPointer(drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(drawImageTexcoordLocation)

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
            for (const draw of sortedToDrawList) {
                if (draw.gamePoint === undefined || draw.source?.texture === undefined) {
                    continue
                }

                // Set the texture
                this.gl.activeTexture(this.gl.TEXTURE3)
                this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                // Set the constants
                this.gl.uniform1i(drawImageTextureLocation, 3)
                this.gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                this.gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)
                this.gl.uniform1f(drawImageScaleLocation, immediateUxState.scale)
                this.gl.uniform2f(drawImageScreenOffsetLocation, immediateUxState.translate.x, immediateUxState.translate.y)
                this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)
                this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)
                this.gl.uniform1f(this.drawImageHeightAdjustmentLocation, this.props.heightAdjust)

                if (draw.height !== undefined) {
                    this.gl.uniform1f(this.drawImageHeightLocation, draw.height)
                } else {
                    this.gl.uniform1f(this.drawImageHeightLocation, monitor.getHeight(draw.gamePoint))
                }

                // Draw the quad (2 triangles = 6 vertices)
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
            }
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
                    gamePoint: center
                })

                const centerHeight = monitor.getHeight(center)

                const differenceToLevel = (a: number, b: number) => {
                    const diff = Math.abs(a - b)

                    if (diff === 1) {
                        return 'LITTLE'
                    } else if (diff == 2) {
                        return 'MEDIUM'
                    } else {
                        return 'HIGH'
                    }
                }

                this.props.possibleRoadConnections.forEach(
                    (point) => {
                        if (this.props.newRoad?.find(newRoadPoint => newRoadPoint.x === point.x && newRoadPoint.y === point.y) === undefined) {
                            const height = monitor.getHeight(point)
                            let startPointInfo

                            if (height > centerHeight) {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForConnectionAbove(differenceToLevel(height, centerHeight))
                            } else if (height < centerHeight) {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForConnectionBelow(differenceToLevel(height, centerHeight))
                            } else {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForSameLevelConnection()
                            }

                            toDrawHover.push({
                                source: startPointInfo,
                                gamePoint: point
                            })
                        }
                    }
                )
            }
        }

        duration.after("collect possible road connections")


        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const selectedPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForSelectedPoint()

            toDrawHover.push({
                source: selectedPointDrawInfo,
                gamePoint: this.props.selectedPoint
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
                        gamePoint: this.state.hoverPoint
                    })
                } else if (availableConstructionAtHoverPoint.includes("medium")) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()

                    toDrawHover.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint: this.state.hoverPoint
                    })
                } else if (availableConstructionAtHoverPoint.includes("small")) {
                    const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()

                    toDrawHover.push({
                        source: smallHouseAvailableInfo,
                        gamePoint: this.state.hoverPoint
                    })
                } else if (availableConstructionAtHoverPoint.includes("mine")) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()

                    toDrawHover.push({
                        source: mineAvailableInfo,
                        gamePoint: this.state.hoverPoint
                    })
                } else if (availableConstructionAtHoverPoint.includes("flag")) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()

                    toDrawHover.push({
                        source: flagAvailableInfo,
                        gamePoint: this.state.hoverPoint
                    })
                }
            } else {
                const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()

                toDrawHover.push({
                    source: hoverPointDrawInfo,
                    gamePoint: this.state.hoverPoint
                })
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting

        // Set up webgl2 with the right shaders
        if (this.drawImageProgram &&
            this.drawImageHeightAdjustmentLocation !== undefined &&
            this.drawImageHeightLocation !== undefined &&
            this.drawImagePositionBuffer &&
            this.drawImageTexCoordBuffer) {

            // Use the draw image program
            this.gl.useProgram(this.drawImageProgram)

            // Configure the drawing
            this.gl.viewport(0, 0, width, height)
            this.gl.enable(this.gl.BLEND)
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
            this.gl.disable(this.gl.DEPTH_TEST)

            // Re-assign the attribute locations
            this.drawImagePositionLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_position")
            this.drawImageTexcoordLocation = this.gl.getAttribLocation(this.drawImageProgram, "a_texcoord")

            // Set the buffers
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImagePositionBuffer)
            this.gl.vertexAttribPointer(this.drawImagePositionLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(this.drawImagePositionLocation)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.drawImageTexCoordBuffer)
            this.gl.vertexAttribPointer(this.drawImageTexcoordLocation, 2, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(this.drawImageTexcoordLocation)

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
            for (const draw of toDrawHover) {
                if (draw.gamePoint === undefined || draw.source?.texture === undefined) {
                    continue
                }

                // Set the texture
                this.gl.activeTexture(this.gl.TEXTURE3)
                this.gl.bindTexture(this.gl.TEXTURE_2D, draw.source.texture)

                // Set the constants
                this.gl.uniform1i(drawImageTextureLocation, 3)
                this.gl.uniform2f(drawImageGamePointLocation, draw.gamePoint.x, draw.gamePoint.y)
                this.gl.uniform2f(drawImageOffsetLocation, draw.source.offsetX, draw.source.offsetY)
                this.gl.uniform1f(drawImageScaleLocation, immediateUxState.scale)
                this.gl.uniform2f(drawImageScreenOffsetLocation, immediateUxState.translate.x, immediateUxState.translate.y)
                this.gl.uniform2f(drawImageScreenDimensionLocation, width, height)
                this.gl.uniform2f(drawImageSourceCoordinateLocation, draw.source.sourceX, draw.source.sourceY)
                this.gl.uniform2f(drawImageSourceDimensionsLocation, draw.source.width, draw.source.height)
                this.gl.uniform1f(this.drawImageHeightAdjustmentLocation, this.props.heightAdjust)

                if (draw.height !== undefined) {
                    this.gl.uniform1f(this.drawImageHeightLocation, draw.height)
                } else {
                    this.gl.uniform1f(this.drawImageHeightLocation, monitor.getHeight(draw.gamePoint))
                }

                // Draw the quad (2 triangles = 6 vertices)
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
            }
        }

        duration.after("draw normal layer")


        /* Draw house titles */
        if (this.props.showHouseTitles) {
            overlayCtx.font = "bold 12px sans-serif"
            overlayCtx.strokeStyle = 'black'
            overlayCtx.fillStyle = 'yellow'

            for (const house of monitor.houses.values()) {
                if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(house)

                const houseDrawInformation = houses.getDrawingInformationForHouseReady(house.nation, house.type)

                let heightOffset = 0

                if (houseDrawInformation) {
                    heightOffset = houseDrawInformation[0].offsetY * immediateUxState.scale / DEFAULT_SCALE
                }

                let houseTitle = camelCaseToWords(house.type)

                if (house.state === "UNFINISHED") {
                    houseTitle = "(" + houseTitle + ")"
                } else if (house.productivity !== undefined) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

                const widthOffset = overlayCtx.measureText(houseTitle).width / 2

                screenPoint.x -= widthOffset
                screenPoint.y -= heightOffset

                overlayCtx.strokeText(houseTitle, screenPoint.x, screenPoint.y - 5)
                overlayCtx.fillText(houseTitle, screenPoint.x, screenPoint.y - 5)
            }
        }

        duration.after("draw house titles")


        // Fill in the buffers to draw fog of war
        if (this.fogOfWarCoordBuffer && this.fogOfWarIntensityBuffer) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fogOfWarCoordBuffer)
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.fogOfWarCoordinates), this.gl.STATIC_DRAW)

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fogOfWarIntensityBuffer)
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.fogOfWarIntensities), this.gl.STATIC_DRAW)
        }

        /* Draw the fog of war layer */
        if (this.fogOfWarRenderProgram &&
            this.fogOfWarScreenWidthUniformLocation !== undefined &&
            this.fogOfWarScreenHeightUniformLocation !== undefined &&
            this.fogOfWarScaleUniformLocation !== undefined &&
            this.fogOfWarOffsetUniformLocation !== undefined &&
            this.fogOfWarCoordAttributeLocation !== undefined &&
            this.fogOfWarIntensityAttributeLocation !== undefined &&
            this.fogOfWarCoordBuffer !== undefined &&
            this.fogOfWarIntensityBuffer !== undefined) {

            const gl = this.gl

            // Use the fog of war program
            gl.useProgram(this.fogOfWarRenderProgram)

            // Configure drawing
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

            // Set the constants
            gl.uniform1f(this.fogOfWarScreenWidthUniformLocation, width)
            gl.uniform1f(this.fogOfWarScreenHeightUniformLocation, height)
            gl.uniform2f(this.fogOfWarScaleUniformLocation, immediateUxState.scale, immediateUxState.scale)
            gl.uniform2f(this.fogOfWarOffsetUniformLocation, immediateUxState.translate.x, immediateUxState.translate.y)
            gl.clearColor(0.0, 0.0, 0.0, 1.0)

            // Set the buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.fogOfWarCoordBuffer)
            gl.vertexAttribPointer(this.fogOfWarCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.fogOfWarCoordAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.fogOfWarIntensityBuffer)
            gl.vertexAttribPointer(this.fogOfWarIntensityAttributeLocation, 1, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(this.fogOfWarIntensityAttributeLocation)

            // Draw the triangles -- mode, offset (nr vertices), count (nr vertices)
            gl.drawArrays(gl.TRIANGLES, 0, this.fogOfWarCoordinates.length / 2)
        } else {
            console.error("Did not draw the fog of war layer")
        }

        duration.reportStats()

        /* List counters if the rendering time exceeded the previous maximum */
        if (isLatestValueHighestForVariable("GameRender::renderGame.total")) {
            printVariables()
        }

        /* Draw the FPS counter */
        const timestamp = getTimestamp()

        if (this.props.showFpsCounter && this.previousTimestamp) {
            const fps = getLatestValueForVariable("GameRender::renderGame.total")

            overlayCtx.fillStyle = 'white'
            overlayCtx.fillRect(width - 100, 5, 100, 60)

            overlayCtx.closePath()

            overlayCtx.fillStyle = 'black'
            overlayCtx.fillText("" + fps, width - 100, 20)

            overlayCtx.fillText("" + getAverageValueForVariable("GameRender::renderGame.total"), width - 100, 40)
        }

        this.previousTimestamp = timestamp

        requestAnimationFrame(this.renderGame.bind(this))
    }

    gamePointToScreenPoint(gamePoint: Point): ScreenPoint {
        const height = monitor.getHeight(gamePoint)

        return gamePointToScreenPoint(
            gamePoint,
            height,
            immediateUxState.translate.x,
            immediateUxState.translate.y,
            immediateUxState.scale,
            this.props.screenHeight,
            this.props.heightAdjust,
            //DEFAULT_HEIGHT_ADJUSTMENT,
            STANDARD_HEIGHT
        )
    }

    screenPointToGamePointNoHeightAdjustment(screenPoint: ScreenPoint): Point {
        return screenPointToGamePoint(screenPoint, immediateUxState.translate.x, immediateUxState.translate.y, immediateUxState.scale, this.props.screenHeight)
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
        if (this.overlayCanvasRef.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

            const gamePoint = this.screenPointToGamePointWithHeightAdjustment({ x: x, y: y })

            this.props.onPointClicked(gamePoint)
        }
    }

    screenPointToGamePointWithHeightAdjustment(screenPoint: Point): Point {
        const unadjustedGamePoint = this.screenPointToGamePointNoHeightAdjustment(screenPoint)

        let distance = 2000
        let adjustedGamePoint: Point | undefined
        const downLeft = getPointDownLeft(unadjustedGamePoint)
        const downRight = getPointDownRight(unadjustedGamePoint)
        const down = getPointDown(unadjustedGamePoint)
        const downDownLeft = getPointDownLeft(down)
        const downDownRight = getPointDownRight(down)
        const downDown = getPointDown(down)
        const upLeft = getPointUpLeft(unadjustedGamePoint)
        const upRight = getPointUpRight(unadjustedGamePoint)
        const up = getPointUp(unadjustedGamePoint)
        const upUpLeft = getPointUpLeft(up)
        const upUpRight = getPointUpRight(up)

        const candidates = [
            unadjustedGamePoint,
            downLeft,
            downRight,
            down,
            downDownLeft,
            downDownRight,
            downDown,
            upLeft,
            upRight,
            up,
            upUpLeft,
            upUpRight
        ]

        for (const gamePoint of candidates) {
            const screenPointCandidate = this.gamePointToScreenPoint(gamePoint)
            const dx = screenPointCandidate.x - screenPoint.x
            const dy = screenPointCandidate.y - screenPoint.y
            const candidateDistance = Math.sqrt(dx * dx + dy * dy)

            if (candidateDistance < distance) {
                distance = candidateDistance
                adjustedGamePoint = gamePoint
            }
        }

        return adjustedGamePoint ?? unadjustedGamePoint
    }

    onDoubleClick(event: React.MouseEvent): void {
        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.error("Received invalid double click event")

            return
        }

        if (this.overlayCanvasRef.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.overlayCanvasRef.current.height)

            const gamePoint = this.screenPointToGamePointWithHeightAdjustment({ x: x, y: y })

            this.props.onDoubleClick(gamePoint)
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

                                try {
                                    const hoverPoint = this.screenPointToGamePointWithHeightAdjustment({ x, y })

                                    if (hoverPoint &&
                                        hoverPoint.y >= 0 &&
                                        (!this.state.hoverPoint || this.state.hoverPoint.x !== hoverPoint.x || this.state.hoverPoint.y !== hoverPoint.y)) {
                                        this.setState({ hoverPoint })
                                    }
                                } catch (error) {
                                    console.error(error)
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

    prepareToRenderFromTiles(tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>, allTiles: PointMapFast<TerrainAtPoint>): MapRenderInformation {
        const coordinates: number[] = []
        const normals: number[] = []
        const textureMapping: number[] = []

        const transitionCoordinates: number[] = []
        const transitionNormals: number[] = []
        const transitionTextureMapping: number[] = []

        tilesBelow.forEach(tileBelow => {
            const point = tileBelow.pointAbove
            const pointRight = getPointRight(point)
            const pointLeft = getPointLeft(point)
            const pointDownLeft = getPointDownLeft(point)
            const pointDownRight = getPointDownRight(point)
            const pointDown = getPointDown(point)

            const triangleBelow = [point, pointDownLeft, pointDownRight]

            const terrainBelow = tileBelow.vegetation

            if (VEGETATION_INTEGERS.indexOf(terrainBelow) === -1) {
                console.error("UNKNOWN TERRAIN: " + terrainBelow)
            }

            // Add the coordinates for each triangle to the coordinates buffer
            triangleBelow.forEach(point => Array.prototype.push.apply(coordinates, [point.x, point.y, allTiles.get(point)?.height ?? 0]))

            // Add the normals
            triangleBelow
                .map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR)
                .forEach(normal => Array.prototype.push.apply(normals, [normal.x, normal.y, normal.z]))

            Array.prototype.push.apply(textureMapping, vegetationToTextureMapping.get(terrainBelow)?.below ?? [0, 0, 0.5, 1, 1, 0])

            // Add a transition triangle to make the border between two textures nicer
            if (terrainBelow === SNOW_TEXTURE) {
                const terrainAtDownLeft = allTiles.get(pointDownLeft)
                const terrainAtDown = allTiles.get(pointDown)
                const terrain = allTiles.get(point)
                const terrainLeft = allTiles.get(pointLeft)

                // Transition below
                if (terrainAtDownLeft && terrainAtDownLeft.downRight !== SNOW_TEXTURE && terrainAtDown) {
                    const baseHeight = (tileBelow.heightDownLeft + tileBelow.heightDownRight) / 2
                    const downHeight = terrainAtDown.height

                    // Add coordinates
                    Array.prototype.push.apply(
                        transitionCoordinates,
                        [
                            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
                            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
                            pointDown.x, pointDownLeft.y - 0.25, baseHeight + (downHeight - baseHeight) * 0.25
                        ]
                    )

                    // Add texture mapping
                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    // Add normals
                    const points = [pointDownLeft, pointDownRight, pointDown]

                    // TODO: interpolate the normal
                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }

                // Transition up-right
                if (terrain && terrain.downRight !== SNOW_TEXTURE) {
                    const baseHeight = (tileBelow.heightAbove + tileBelow.heightDownRight) / 2
                    const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }
                    const heightRight = allTiles.get(pointRight)?.height ?? 0

                    // Add coordinates
                    Array.prototype.push.apply(
                        transitionCoordinates,
                        [
                            point.x, point.y, tileBelow.heightAbove,
                            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
                            base.x + (pointRight.x - base.x) * OVERLAP_FACTOR, base.y + (pointRight.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightRight - baseHeight) * OVERLAP_FACTOR
                        ])

                    // Add texture mapping
                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    // Add normals
                    const points = [point, pointDownRight, pointRight]

                    // TODO: interpolate the normal
                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }

                // Transition up-left
                if (terrainLeft && terrainLeft.downRight !== SNOW_TEXTURE) {
                    const baseHeight = (tileBelow.heightDownLeft, tileBelow.heightAbove) / 2
                    const base = { x: (point.x + pointDownLeft.x) / 2, y: (point.y + pointDownLeft.y) / 2 }
                    const heightLeft = terrainLeft.height

                    Array.prototype.push.apply(
                        transitionCoordinates,
                        [
                            point.x, point.y, tileBelow.heightAbove,
                            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
                            base.x + (pointLeft.x - base.x) * 0.7, base.y + (pointLeft.y - base.y) * 0.7, baseHeight + (heightLeft - baseHeight) * 0.7
                        ])

                    // Add texture mapping
                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    // Add normals
                    //const points = [point, pointDownLeft, pointLeft]
                    const points = [point, pointDownLeft, pointLeft]

                    // TODO: interpolate the normal
                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }
            }
        })


        tilesDownRight.forEach(tile => {
            const point = tile.pointLeft
            const pointUpRight = getPointUpRight(point)
            const pointRight = getPointRight(point)
            const pointDownRight = getPointDownRight(point)
            const pointDownLeft = getPointDownLeft(point)
            const pointRightDownRight = getPointDownRight(getPointRight(point))

            const triangleDownRight = [point, pointDownRight, pointRight]

            const terrainDownRight = tile.vegetation
            const terrainBelow = allTiles.get(point)
            const terrainUpRight = allTiles.get(pointUpRight)
            const terrainRight = allTiles.get(pointRight)

            if (VEGETATION_INTEGERS.indexOf(terrainDownRight) === -1) {
                console.log("UNKNOWN TERRAIN: " + terrainDownRight)
            }

            // Add the coordinates for each triangle to the coordinates buffer
            triangleDownRight.forEach(point => Array.prototype.push.apply(coordinates, [point.x, point.y, allTiles.get(point)?.height ?? 0]))

            // Add the normals for each triangle to the normals buffer
            triangleDownRight
                .map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR)
                .forEach(normal => Array.prototype.push.apply(normals, [normal.x, normal.y, normal.z]))

            // Add the texture mapping for the triangles
            Array.prototype.push.apply(textureMapping, vegetationToTextureMapping.get(terrainDownRight)?.downRight ?? [0, 1, 0.5, 0, 1, 1])

            // Add transitions
            if (terrainDownRight === SNOW_TEXTURE) {

                // Triangle below on the left
                if (terrainBelow && terrainBelow.below !== SNOW_TEXTURE) {
                    const baseHeight = (tile.heightLeft, tile.heightDown) / 2
                    const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }

                    Array.prototype.push.apply(transitionCoordinates,
                        [
                            pointDownRight.x, pointDownRight.y, tile.heightDown,
                            point.x, point.y, tile.heightLeft,
                            base.x + (pointDownLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointDownLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (allTiles.get(pointDownLeft)?.height ?? 0 - baseHeight) * OVERLAP_FACTOR
                        ])

                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    const points = [pointDownRight, point, pointDownLeft]

                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }

                // Triangle above
                if (terrainUpRight && terrainUpRight.below !== SNOW_TEXTURE) {
                    const baseHeight = (tile.heightLeft, tile.heightRight) / 2
                    const heightUp = allTiles.get(pointUpRight)?.height ?? 0

                    Array.prototype.push.apply(transitionCoordinates,
                        [
                            point.x, point.y, tile.heightLeft,
                            pointRight.x, pointRight.y, tile.heightRight,
                            point.x + 1, point.y + 0.8, baseHeight + (heightUp - baseHeight) * 0.8
                        ]
                    )

                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    const points = [point, pointRight, pointUpRight]

                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }

                // Triangle below on the right
                if (terrainRight && terrainRight.below !== SNOW_TEXTURE) {
                    const baseHeight = (tile.heightRight + tile.heightDown) / 2
                    const base = {x: (pointRight.x + pointDownRight.x) / 2, y: (pointRight.y + pointDownRight.y) / 2}
                    const heightRightDownRight = allTiles.get(pointRightDownRight)?.height ?? 0

                    Array.prototype.push.apply(transitionCoordinates,
                        [
                            pointRight.x, pointRight.y, tile.heightRight,
                            pointDownRight.x, pointDownRight.y, tile.heightDown,
                            base.x + (pointRightDownRight.x - base.x) * 0.4, base.y + (pointRightDownRight.y - base.y) * 0.4, baseHeight + (heightRightDownRight - baseHeight) * 0.4
                        ]
                    )

                    Array.prototype.push.apply(transitionTextureMapping, SNOW_TRANSITION_TEXTURE_MAPPING)

                    const points = [pointRight, pointDownRight, pointRightDownRight]

                    points.map(point => this.normals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                        normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
                    )
                }
            }
        })

        return {
            coordinates: coordinates.concat(transitionCoordinates),
            normals: normals.concat(transitionNormals),
            textureMapping: textureMapping.concat(transitionTextureMapping)
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
        const coordinates: number[] = []
        const normals: number[] = []
        const textureMapping: number[] = []

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
                    const height0 = monitor.getHeight(previous)
                    const height1 = monitor.getHeight(point)

                    Array.prototype.push.apply(
                        coordinates,
                        [
                            previous.x, previous.y, height0,
                            previous.x, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            previous.x, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            point.x, point.y + 0.4, height1
                        ]
                    )

                    Array.prototype.push.apply(normals,
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
                            textureMapping,
                            [
                                0.75, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMapping,
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
                    const height0 = monitor.getHeight(previous)
                    const height1 = monitor.getHeight(point)

                    Array.prototype.push.apply(
                        coordinates,
                        [
                            previous.x + 0.2, previous.y, height0,
                            previous.x - 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            previous.x - 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            point.x - 0.2, point.y + 0.4, height1
                        ]
                    )

                    Array.prototype.push.apply(normals,
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
                            textureMapping,
                            [
                                0.75, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMapping,
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
                    const height0 = monitor.getHeight(previous)
                    const height1 = monitor.getHeight(point)

                    Array.prototype.push.apply(
                        coordinates,
                        [
                            previous.x - 0.2, previous.y, height0,
                            previous.x + 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            previous.x + 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            point.x + 0.2, point.y + 0.4, height1
                        ]
                    )

                    Array.prototype.push.apply(normals,
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
                            textureMapping,
                            [
                                0.75, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMapping,
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
                    const height0 = monitor.getHeight(previous)
                    const height1 = monitor.getHeight(point)

                    Array.prototype.push.apply(
                        coordinates,
                        [
                            previous.x - 0.2, previous.y, height0,
                            previous.x + 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            previous.x + 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            point.x + 0.2, point.y + 0.4, height1
                        ]
                    )

                    Array.prototype.push.apply(normals,
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
                            textureMapping,
                            [
                                0.75, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMapping,
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
                    const height0 = monitor.getHeight(previous)
                    const height1 = monitor.getHeight(point)

                    Array.prototype.push.apply(
                        coordinates,
                        [
                            previous.x + 0.2, previous.y, height0,
                            previous.x - 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            previous.x - 0.2, previous.y + 0.4, height0,
                            point.x, point.y, height1,
                            point.x - 0.2, point.y + 0.4, height1
                        ]
                    )

                    Array.prototype.push.apply(normals,
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
                            textureMapping,
                            [
                                0.75, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                0.75, 1 - 1.0,
                                1.0, 1 - 0.941,
                                1.0, 1 - 1.0
                            ]
                        )
                    } else {
                        Array.prototype.push.apply(
                            textureMapping,
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
            coordinates,
            normals,
            textureMapping
        }
    }
}

function isOnEdgeOfDiscovery(point: Point, discovered: PointSetFast): boolean {
    const surrounding = surroundingPoints(point)

    // TODO: filter points outside of the map
    const foundInside = surrounding.filter(neighbor => discovered.has(neighbor)).length > 0
    const foundOutside = surrounding.filter(neighbor => !discovered.has(neighbor)).length > 0

    return foundInside && foundOutside
}

interface ShadedPoint {
    point: Point
    intensity: number
}

function getTrianglesAffectedByFogOfWar(discovered: PointSetFast, tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>) {
    const triangles: ShadedPoint[][] = []

    tilesBelow.forEach(tileBelow => {
        const up = tileBelow.pointAbove
        const right = getPointDownRight(tileBelow.pointAbove)
        const left = getPointDownLeft(tileBelow.pointAbove)

        const isUpOnEdge = isOnEdgeOfDiscovery(up, discovered)
        const isRightOnEdge = isOnEdgeOfDiscovery(right, discovered)
        const isLeftOnEdge = isOnEdgeOfDiscovery(left, discovered)

        if (isUpOnEdge || isRightOnEdge || isLeftOnEdge) {
            triangles.push([
                { point: up, intensity: isUpOnEdge ? 0 : 1 },
                { point: right, intensity: isRightOnEdge ? 0 : 1 },
                { point: left, intensity: isLeftOnEdge ? 0 : 1 }
            ])
        }
    })

    tilesDownRight.forEach(tileDownRight => {
        const left = tileDownRight.pointLeft
        const right = getPointRight(tileDownRight.pointLeft)
        const down = getPointDownRight(tileDownRight.pointLeft)

        const isLeftOnEdge = isOnEdgeOfDiscovery(left, discovered)
        const isRightOnEdge = isOnEdgeOfDiscovery(right, discovered)
        const isDownOnEdge = isOnEdgeOfDiscovery(down, discovered)

        if (isLeftOnEdge || isRightOnEdge || isDownOnEdge) {
            triangles.push([
                { point: left, intensity: isLeftOnEdge ? 0 : 1 },
                { point: right, intensity: isRightOnEdge ? 0 : 1 },
                { point: down, intensity: isDownOnEdge ? 0 : 1 }
            ])
        }
    })

    return triangles
}

function interpolateHeight(previous: Point, next: Point, progress: number): number {
    const previousHeight = monitor.getHeight(previous)
    const nextHeight = monitor.getHeight(next)

    return previousHeight + (nextHeight - previousHeight) * progress
}

export { GameCanvas }

