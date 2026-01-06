import React, { useCallback, useEffect, useRef } from 'react'
import { Direction, Point, RoadInformation, VEGETATION_INTEGERS, TerrainAtPoint, FlagInformation } from '../api/types'
import { Duration } from '../utils/stats/duration'
import './game_render.css'
import { api, TileBelow, TileDownRight } from '../api/ws-api'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from '../utils/stats/stats'
import { gamePointToScreenPointWithHeightAdjustment, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDown, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, normalize, resizeCanvasToDisplaySize, screenPointToGamePointNoHeightAdjustment, screenPointToGamePointWithHeightAdjustment, sumVectors, surroundingPoints, Vector } from '../utils/utils'
import { PointMap, PointSet } from '../utils/util_types'
import { borderImageAtlasHandler, cargoImageAtlasHandler, cropsImageAtlasHandler, decorationsImageAtlasHandler, fireImageAtlasHandler, houses, loadImageAsync, roadBuildingImageAtlasHandler, shipImageAtlas, signImageAtlasHandler, stoneImageAtlasHandler, treeImageAtlasHandler, uiElementsImageAtlasHandler } from '../assets/image_atlas_handlers'
import { fogOfWarFragmentShader, fogOfWarVertexShader } from '../shaders/fog-of-war'
import { shadowFragmentShader, textureFragmentShader, texturedImageVertexShaderPixelPerfect } from '../shaders/image-and-shadow'
import { textureAndLightingFragmentShader, textureAndLightingVertexShader } from '../shaders/terrain-and-roads'
import { NewRoad } from '../screens/play/play'
import { DEFAULT_SCALE, MAIN_ROAD_TEXTURE_MAPPING, MAIN_ROAD_WITH_FLAG, NORMAL_ROAD_TEXTURE_MAPPING, NORMAL_ROAD_WITH_FLAG, OVERLAPS, STANDARD_HEIGHT, TRANSITION_TEXTURE_MAPPINGS, UNIT_SQUARE, VEGETATION_TO_TEXTURE_MAPPING } from './constants'
import { textures } from '../render/textures'
import { ProgramDescriptor, ProgramInstance, draw, initProgram, setBuffer } from './utils'
import { buildingPretty } from '../pretty_strings'
import { useNonTriggeringState } from '../utils/hooks/non_triggering'
import { animals, donkeyAnimation, fatCarrierNoCargo, fatCarrierWithCargo, fireAnimations, flagAnimations, thinCarrierNoCargo, thinCarrierWithCargo, treeAnimations, workers } from '../assets/animations'
import { Dimension, DrawingInformation } from '../assets/types'

// Types
export type ScreenPoint = {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD' | 'BUILDING_ROAD_PRESSED'

type FogOfWarRenderInformation = {
    coordinates: number[]
    intensities: number[]
}

type MapRenderInformation = {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

type ToDraw = {
    source: DrawingInformation | undefined
    gamePoint: Point
    height?: number
}

type TrianglesAtPoint = {
    belowVisible: boolean
    downRightVisible: boolean
}

export type View = {
    screenSize: Dimension
    scale: number
    translate: Point
}

type ShadedPoint = {
    point: Point
    intensity: number
}

type GameCanvasProps = {
    cursor?: CursorState
    selectedPoint?: Point
    possibleRoadConnections?: Point[]
    newRoad?: Point[]
    showAvailableConstruction: boolean
    showHouseTitles: boolean
    showFpsCounter?: boolean
    view: View
    hideHoverPoint?: boolean
    hideSelectedPoint?: boolean
    heightAdjust: number

    onPointClicked?: ((point: Point) => void)
    onDoubleClick?: ((point: Point) => void)
    onKeyDown?: ((event: React.KeyboardEvent) => void)
}

type RenderInformation = {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

type RenderState = {
    previousTimestamp?: number
    previous: number
    overshoot: number

    animationIndex: number
    mapRenderInformation?: MapRenderInformation
    gl?: WebGL2RenderingContext

    newRoad?: NewRoad

    selectedPoint?: Point
    hoverPoint?: Point
    newRoadCurrentLength: number

    showHouseTitles: boolean
    showAvailableConstruction: boolean

    // Map of the normal for each point on the map
    normals: PointMap<Vector>

    // Drawing program instances
    drawGroundProgramInstance?: ProgramInstance
    drawRoadsProgramInstance?: ProgramInstance
    drawImageProgramInstance?: ProgramInstance
    drawShadowProgramInstance?: ProgramInstance
    fogOfWarProgramInstance?: ProgramInstance

    allPointsVisibilityTracking: PointMap<TrianglesAtPoint>
    once: boolean
}

type DoubleClickDetection = {
    timer?: ReturnType<typeof setTimeout> | undefined
}

// Constants
const MAX_NUMBER_TRIANGLES = 500 * 500 * 2 // monitor.allTiles.keys.length * 2
const NORMAL_STRAIGHT_UP_VECTOR: Vector = { x: 0, y: 0, z: 1 }
const OVERLAP_FACTOR = (16.0 / 47.0)
const ANIMATION_PERIOD = 100
const MOUSE_STYLES = new Map<CursorState, string>()

MOUSE_STYLES.set('NOTHING', 'default')
MOUSE_STYLES.set('DRAGGING', 'url(assets/cursors/cursor-move.png), auto')
MOUSE_STYLES.set('BUILDING_ROAD', 'url(assets/cursors/cursor-build-road.png), auto')
MOUSE_STYLES.set('BUILDING_ROAD_PRESSED', 'url(assets/cursors/cursor-build-road-pressed.png), auto')

const TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE = 'assets/nature/terrain/greenland/greenland-texture.png'

// Web gl program definitions
const drawGroundProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: textureAndLightingVertexShader,
    fragmentShaderSource: textureAndLightingFragmentShader,
    uniforms: {
        'u_light_vector': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_offset': { type: 'FLOAT' },
        'u_screen_width': { type: 'FLOAT' },
        'u_screen_height': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_sampler': { type: 'INT' }
    },
    attributes: {
        'a_coords': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 3,
            elementsPerVertex: 3
        },
        'a_normal': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 3,
            elementsPerVertex: 3
        },
        'a_texture_mapping': {
            maxElements: MAX_NUMBER_TRIANGLES * 3 * 2,
            elementsPerVertex: 2
        }
    }
}

type DrawGroundUniforms = {
    u_light_vector: number[]
    u_scale: number[]
    u_offset: number[]
    u_screen_width: number
    u_screen_height: number
    u_height_adjust: number
    u_sampler: number
}

type DrawGroundAttributes = 'a_coords' | 'a_normal' | 'a_texture_mapping'

const drawImageProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: texturedImageVertexShaderPixelPerfect,
    fragmentShaderSource: textureFragmentShader,
    uniforms: {
        'u_texture': { type: 'INT' },
        'u_game_point': { type: 'FLOAT' },
        'u_screen_offset': { type: 'FLOAT' },
        'u_image_offset': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_source_coordinate': { type: 'FLOAT' },
        'u_source_dimensions': { type: 'FLOAT' },
        'u_screen_dimensions': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_height': { type: 'FLOAT' },
    },
    attributes: {
        'a_position': {
            elementsPerVertex: 2,
            maxElements: 12
        },
        'a_texcoord': {
            elementsPerVertex: 2,
            maxElements: 12
        }
    }
}

type DrawImageUniforms = {
    u_texture: number
    u_game_point: number[]
    u_screen_offset: number[]
    u_image_offset: number[]
    u_scale: number
    u_source_coordinate: number[]
    u_source_dimensions: number[]
    u_screen_dimensions: number[]
    u_height_adjust: number
    u_height: number
}

type DrawImageAttributes = 'a_position' | 'a_texcoord'

const drawShadowProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: texturedImageVertexShaderPixelPerfect,
    fragmentShaderSource: shadowFragmentShader,
    uniforms: {
        'u_texture': { type: 'INT' },
        'u_game_point': { type: 'FLOAT' },
        'u_screen_offset': { type: 'FLOAT' },
        'u_image_offset': { type: 'FLOAT' },
        'u_scale': { type: 'FLOAT' },
        'u_source_coordinate': { type: 'FLOAT' },
        'u_source_dimensions': { type: 'FLOAT' },
        'u_screen_dimensions': { type: 'FLOAT' },
        'u_height_adjust': { type: 'FLOAT' },
        'u_height': { type: 'FLOAT' },
    },
    attributes: {
        'a_position': {
            elementsPerVertex: 2,
            maxElements: 12
        },
        'a_texcoord': {
            elementsPerVertex: 2,
            maxElements: 12
        }
    }
}

type DrawShadowUniforms = {
    u_texture: number
    u_game_point: number[]
    u_screen_offset: number[]
    u_image_offset: number[]
    u_scale: number
    u_source_coordinate: number[]
    u_source_dimensions: number[]
    u_screen_dimensions: number[]
    u_height_adjust: number
    u_height: number
}

type DrawShadowAttributes = 'a_position' | 'a_texcoord'

const fogOfWarProgramDescriptor: ProgramDescriptor = {
    vertexShaderSource: fogOfWarVertexShader,
    fragmentShaderSource: fogOfWarFragmentShader,
    uniforms: {
        'u_scale': { type: 'FLOAT' },
        'u_offset': { type: 'FLOAT' },
        'u_screen_height': { type: 'FLOAT' },
        'u_screen_width': { type: 'FLOAT' }
    },
    attributes: {
        'a_coordinates': {
            elementsPerVertex: 2,
            maxElements: 500
        },
        'a_intensity': {
            elementsPerVertex: 1,
            maxElements: 500
        }
    }
}

type FogOfWarUniforms = {
    u_scale: number[]
    u_offset: number[]
    u_screen_height: number
    u_screen_width: number
}

type FogOfWarAttributes = 'a_coordinates' | 'a_intensity'


// State
let imageAtlasTerrainAndRoads: HTMLImageElement | undefined = undefined

// React components
function GameCanvas({
    cursor,
    newRoad,
    selectedPoint,
    showAvailableConstruction,
    heightAdjust,
    possibleRoadConnections,
    showHouseTitles,
    showFpsCounter,
    view,
    hideHoverPoint = false,
    hideSelectedPoint = false,
    onPointClicked,
    onKeyDown,
    onDoubleClick }: GameCanvasProps) {
    const visiblePoints = new PointMap<TrianglesAtPoint>()

    const initRenderState = {
        previous: performance.now(),
        overshoot: 0,
        screenSize: { width: 0, height: 0 },
        showHouseTitles,
        showAvailableConstruction,
        scale: 0,
        translate: { x: 0, y: 0 },
        newRoadCurrentLength: 0,
        animationIndex: 0,
        normals: new PointMap<Vector>(),
        fogOfWarRenderProgram: null,
        fogOfWarCoordinates: [],
        fogOfWarIntensities: [],
        drawShadowProgram: null,
        drawImageProgram: null,
        allPointsVisibilityTracking: visiblePoints,
        once: true
    }

    const normalCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const lightVector = [1, 1, -1]

    // State that doesn't trigger re-renders
    const renderState = useNonTriggeringState<RenderState>(initRenderState)
    const doubleClickDetection = useNonTriggeringState<DoubleClickDetection>({})

    // Run once on mount
    useEffect(
        () => {
            addVariableIfAbsent('fps')

            api.allTiles.forEach(tile => visiblePoints.set(tile.point, { belowVisible: false, downRightVisible: false }))
        }, []
    )

    // Variables get captured by the closure of 'renderGame()' so pass the props in to it through renderState
    useEffect(
        () => {
            renderState.showAvailableConstruction = showAvailableConstruction
            renderState.selectedPoint = selectedPoint
            renderState.showHouseTitles = showHouseTitles

            if (newRoad !== undefined) {
                renderState.newRoad = { newRoad: newRoad, possibleConnections: possibleRoadConnections ?? [] }
            } else {
                renderState.newRoad = undefined
            }
        }, [showAvailableConstruction, selectedPoint, newRoad, possibleRoadConnections, showHouseTitles])

    const updateRoadDrawingBuffers = useCallback(() => {
        console.log('Should update road drawing buffers')
        if (renderState.drawRoadsProgramInstance) {
            const roadRenderInformation = prepareToRenderRoads(api.roads.values(), api.flags.values(), renderState.normals)

            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_coords', roadRenderInformation?.coordinates)
            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_normal', roadRenderInformation.normals)
            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_texture_mapping', roadRenderInformation.textureMapping)
        } else {
            console.error(`Failed to update road drawing buffers`)
        }
    }, [renderState])

    useEffect(
        () => {

            // Callback when monitoring is started
            function monitoringStarted(): void {
                console.log('Received monitoring started callback. Calculating normals')

                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)

                updateRoadDrawingBuffers()
            }

            // Callback when roads are updated
            function roadsUpdated(): void {
                console.log('Received updated road callback')

                updateRoadDrawingBuffers()
            }

            // Callback when discovered points are updated
            function discoveredPointsUpdated(): void {

                // Update the calculated normals
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)
                console.log('New discovered points - calculated normals')

                // Update the map rendering buffers
                renderState.mapRenderInformation = prepareToRenderFromTiles(api.discoveredBelowTiles, api.discoveredDownRightTiles, api.allTiles, renderState.normals)

                if (renderState.drawGroundProgramInstance) {
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_coords', renderState.mapRenderInformation.coordinates)
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_normal', renderState.mapRenderInformation.normals)
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_texture_mapping', renderState.mapRenderInformation.textureMapping)
                } else {
                    console.error(`The terrain drawing program instance is undefined`)
                }

                // Update fog of war rendering
                if (renderState.fogOfWarProgramInstance) {
                    const fogOfWarRenderInformation = updateFogOfWarRendering(renderState.allPointsVisibilityTracking)

                    setBuffer<FogOfWarAttributes>(renderState.fogOfWarProgramInstance, 'a_coordinates', fogOfWarRenderInformation.coordinates)
                    setBuffer<FogOfWarAttributes>(renderState.fogOfWarProgramInstance, 'a_intensity', fogOfWarRenderInformation.intensities)
                }
            }

            const gameStateListener = {
                onMonitoringStarted: monitoringStarted
            }

            async function loadAssetsAndSetupGl(): Promise<void> {
                const fileLoading: Promise<void | HTMLImageElement>[] = []

                Array.from(workers.values()).forEach(worker => fileLoading.push(worker.load()))
                Array.from(animals.values()).forEach(animal => fileLoading.push(animal.load()))

                const allThingsToWaitFor: Promise<void | HTMLImageElement>[] = fileLoading.concat([
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

                if (imageAtlasTerrainAndRoads === undefined) {
                    const terrainAndRoadsPromise = loadImageAsync(TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE)

                    terrainAndRoadsPromise.then((image) => imageAtlasTerrainAndRoads = image)

                    allThingsToWaitFor.push(terrainAndRoadsPromise)
                }

                // Wait for the game data to be read from the backend and the websocket to be established
                await Promise.all([api.waitForConnection(), api.waitForGameDataAvailable()])

                // Put together the render information from the discovered tiles
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)

                renderState.mapRenderInformation = prepareToRenderFromTiles(api.discoveredBelowTiles, api.discoveredDownRightTiles, api.allTiles, renderState.normals)

                //  Initialize webgl2
                if (normalCanvasRef?.current) {
                    const canvas = normalCanvasRef.current
                    const gl = canvas.getContext('webgl2', { alpha: false })

                    if (gl) {
                        renderState.drawGroundProgramInstance = initProgram(drawGroundProgramDescriptor, gl)
                        renderState.drawRoadsProgramInstance = initProgram(drawGroundProgramDescriptor, gl)
                        renderState.drawImageProgramInstance = initProgram(drawImageProgramDescriptor, gl)
                        renderState.drawShadowProgramInstance = initProgram(drawShadowProgramDescriptor, gl)
                        renderState.fogOfWarProgramInstance = initProgram(fogOfWarProgramDescriptor, gl)

                        // Setup the program to render the ground
                        setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_coords', renderState.mapRenderInformation.coordinates)
                        setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_normal', renderState.mapRenderInformation.normals)
                        setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_texture_mapping', renderState.mapRenderInformation.textureMapping)

                        setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_coords', [])
                        setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_normal', [])
                        setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_texture_mapping', [])

                        renderState.gl = gl

                        const positions = UNIT_SQUARE
                        const texCoords = UNIT_SQUARE

                        setBuffer<DrawImageAttributes>(renderState.drawImageProgramInstance, 'a_position', positions)
                        setBuffer<DrawImageAttributes>(renderState.drawImageProgramInstance, 'a_texcoord', texCoords)

                        setBuffer<DrawShadowAttributes>(renderState.drawShadowProgramInstance, 'a_position', positions)
                        setBuffer<DrawShadowAttributes>(renderState.drawShadowProgramInstance, 'a_texcoord', texCoords)
                    } else {
                        console.error('Failed to create shadow rendering gl program')
                    }
                } else {
                    console.error('No canvasRef.current')
                }

                // Start tracking visible triangles
                if (renderState.allPointsVisibilityTracking.size === 0) {
                    api.allTiles.forEach(tile => renderState.allPointsVisibilityTracking.set(tile.point, { belowVisible: false, downRightVisible: false }))
                }

                if (renderState.fogOfWarProgramInstance) {
                    const fogOfWarRenderInformation = updateFogOfWarRendering(renderState.allPointsVisibilityTracking)

                    setBuffer<FogOfWarAttributes>(renderState.fogOfWarProgramInstance, 'a_coordinates', fogOfWarRenderInformation.coordinates)
                    setBuffer<FogOfWarAttributes>(renderState.fogOfWarProgramInstance, 'a_intensity', fogOfWarRenderInformation.intensities)
                }

                // Start listeners
                api.addRoadsListener(roadsUpdated)
                api.addGameStateListener(gameStateListener)
                api.addDiscoveredPointsListener(discoveredPointsUpdated)

                console.log('Started listeners')


                // Wait for asset loading to finish and for the websocket connection to be established
                await Promise.all(allThingsToWaitFor)

                console.log('Download image atlases done. Connection to websocket backend established')


                // Make textures for the image atlases
                if (renderState.gl) {
                    for (const animation of workers.values()) {
                        textures.registerTexture(renderState.gl, animation.getImage())
                    }

                    for (const animation of animals.values()) {
                        textures.registerTexture(renderState.gl, animation.getImage())
                    }

                    textures.registerTexture(renderState.gl, treeAnimations.getImage())
                    textures.registerTexture(renderState.gl, flagAnimations.getImage())
                    textures.registerTexture(renderState.gl, houses.getSourceImage())
                    textures.registerTexture(renderState.gl, fireAnimations.getImage())
                    textures.registerTexture(renderState.gl, signImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, uiElementsImageAtlasHandler.getImage())
                    textures.registerTexture(renderState.gl, cropsImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, stoneImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, decorationsImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, donkeyAnimation.getImage())
                    textures.registerTexture(renderState.gl, borderImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, roadBuildingImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, cargoImageAtlasHandler.getSourceImage())
                    textures.registerTexture(renderState.gl, fatCarrierWithCargo.getImage())
                    textures.registerTexture(renderState.gl, thinCarrierWithCargo.getImage())
                    textures.registerTexture(renderState.gl, fatCarrierNoCargo.getImage())
                    textures.registerTexture(renderState.gl, thinCarrierNoCargo.getImage())
                    textures.registerTexture(renderState.gl, shipImageAtlas.getSourceImage())

                    textures.registerTexture(renderState.gl, imageAtlasTerrainAndRoads)

                    // Bind the terrain and road image atlas texture
                }

                // Prepare to draw roads
                updateRoadDrawingBuffers()
            }

            loadAssetsAndSetupGl().then(() => renderGame())

            return () => {
                api.removeGameStateListener(gameStateListener)
                api.removeRoadsListener(roadsUpdated)
                api.removeDiscoveredPointsListener(discoveredPointsUpdated)
            }
        }, []
    )

    function renderGame(): void {
        const duration = new Duration('GameRender::renderGame')

        // Only draw if the game data is available
        if (!api.isGameDataAvailable()) {
            return
        }

        // Handle the animation counter
        const now = performance.now()
        const timeSinceLastDraw = now - renderState.previous + renderState.overshoot

        renderState.animationIndex = renderState.animationIndex + Math.floor(timeSinceLastDraw / ANIMATION_PERIOD)
        renderState.overshoot = timeSinceLastDraw % ANIMATION_PERIOD
        renderState.previous = now

        // Check if there are changes to the newRoads props array. In that case the buffers for drawing roads need to be updated.
        const newRoadsUpdatedLength = renderState.newRoad?.newRoad.length ?? 0

        if (renderState.newRoadCurrentLength !== newRoadsUpdatedLength) {
            renderState.newRoadCurrentLength = newRoadsUpdatedLength

            if (renderState.newRoad !== undefined) {
                api.placeLocalRoad(renderState.newRoad.newRoad)
            }

            updateRoadDrawingBuffers()
        }

        // Ensure that the reference to the canvases are set
        if (!overlayCanvasRef?.current || !normalCanvasRef?.current) {
            console.error('The canvas references are not set properly')

            return
        }

        // Get the rendering context for the overlay canvas
        const overlayCtx = overlayCanvasRef.current.getContext('2d')

        // Ensure that the canvas rendering context is valid
        if (!overlayCtx) {
            console.error('No or invalid context')

            return
        }

        // Set the resolution
        resizeCanvasToDisplaySize(normalCanvasRef.current)
        resizeCanvasToDisplaySize(overlayCanvasRef.current)

        const { width, height } = normalCanvasRef.current ?? { width: 0, height: 0 }

        // Make sure gl is available
        if (renderState.gl === undefined) {
            console.error('Gl is not available')

            return
        }

        renderState.gl.viewport(0, 0, width, height)

        // Clear the drawing list
        const toDrawNormal: ToDraw[] = []
        const shadowsToDraw: ToDraw[] = []


        // Clear the overlay - make it fully transparent
        overlayCtx.clearRect(0, 0, width, height)

        const upLeft = screenPointToGamePointNoHeightAdjustmentInternal({ x: 0, y: 0 })
        const downRight = screenPointToGamePointNoHeightAdjustmentInternal({ x: width, y: height })

        const minXInGame = upLeft.x
        const maxYInGame = upLeft.y
        const maxXInGame = downRight.x
        const minYInGame = downRight.y

        duration.after('init')

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


        // Draw the terrain layer
        if (imageAtlasTerrainAndRoads) {
            const textureSlot = textures.activateTextureForRendering(renderState.gl, imageAtlasTerrainAndRoads)

            if (textureSlot !== undefined && renderState.drawGroundProgramInstance && renderState.mapRenderInformation) {
                draw<DrawGroundUniforms>(renderState.drawGroundProgramInstance,
                    {
                        u_light_vector: lightVector,
                        u_scale: [view.scale, view.scale],
                        u_offset: [view.translate.x, view.translate.y],
                        u_screen_width: width,
                        u_screen_height: height,
                        u_height_adjust: heightAdjust,
                        u_sampler: textureSlot
                    },
                    'CLEAR_BEFORE_DRAW'
                )
            }
        }

        duration.after('draw terrain')


        // Draw decorations on the ground
        const decorationsToDraw: ToDraw[] = []

        api.decorations.forEach(decoration => {
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
            }
        })

        // Draw decorations objects
        for (const toDraw of decorationsToDraw) {
            if (toDraw?.source?.image !== undefined && renderState.drawImageProgramInstance !== undefined) {
                const textureSlot = textures.activateTextureForRendering(renderState.drawImageProgramInstance.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [view.translate.x, view.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: view.scale,
                        u_source_coordinate: [toDraw.source.sourceX, toDraw.source.sourceY],
                        u_source_dimensions: [toDraw.source.width, toDraw.source.height],
                        u_screen_dimensions: [width, height],
                        u_height_adjust: heightAdjust,
                        u_height: api.getHeight(toDraw.gamePoint)
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            } else {
                console.error(`The texture for ${toDraw?.source?.image} is undefined`)
            }
        }

        duration.after('drawing decorations')


        // Draw the road layer
        if (imageAtlasTerrainAndRoads) {
            const textureSlot = textures.activateTextureForRendering(renderState.gl, imageAtlasTerrainAndRoads)

            if (textureSlot !== undefined && renderState.drawRoadsProgramInstance && renderState.mapRenderInformation) {
                draw<DrawGroundUniforms>(renderState.drawRoadsProgramInstance,
                    {
                        u_light_vector: lightVector,
                        u_scale: [view.scale, view.scale],
                        u_offset: [view.translate.x, view.translate.y],
                        u_screen_width: width,
                        u_screen_height: height,
                        u_height_adjust: heightAdjust,
                        u_sampler: textureSlot
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            }
        }

        duration.after('draw roads')


        // Handle the the Normal layer. First, collect information of what to draw for each type of object

        // Collect borders to draw
        api.border.forEach((borderForPlayer) => {
            borderForPlayer.points.forEach(borderPoint => {
                if (borderPoint.x < minXInGame - 1 || borderPoint.x > maxXInGame || borderPoint.y < minYInGame - 1 || borderPoint.y > maxYInGame + 1) {
                    return
                }

                const borderPointInfo = borderImageAtlasHandler.getDrawingInformation(borderForPlayer.nation, borderForPlayer.color, 'SUMMER')

                toDrawNormal.push({
                    source: borderPointInfo,
                    gamePoint: borderPoint,
                })
            })
        })

        duration.after('collect borders')


        // Collect the houses
        for (const house of api.houses.values()) {
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

                const fireDrawInformation = fireAnimations.getAnimationFrame(size, renderState.animationIndex)

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

                const fireDrawInformation = fireImageAtlasHandler.getBurntDownDrawingInformation(size)

                toDrawNormal.push({
                    source: fireDrawInformation,
                    gamePoint: house,
                })
            } else if (house.state === 'UNFINISHED' && house.constructionProgress !== undefined) {
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
                if ((house.type === 'Mill' && house.isWorking) ||
                    (house.type === 'Harbor' && (house.nation === 'ROMANS' || house.nation === 'JAPANESE') && house.isWorking)) {
                    const houseDrawInformation = houses.getDrawingInformationForWorkingHouse(house.nation, house.type, renderState.animationIndex)

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

        duration.after('collect houses')


        // Collect the trees
        let treeIndex = 0
        for (const tree of api.trees.values()) {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                continue
            }

            let treeDrawInfo

            if (tree.size === 'FULL_GROWN') {
                treeDrawInfo = treeAnimations.getAnimationFrame(tree.type, renderState.animationIndex, treeIndex)

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

        api.fallingTrees.forEach(tree => {
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

        duration.after('collect trees')


        // Collect the crops
        for (const crop of api.crops.values()) {
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

        duration.after('collect crops')


        // Collect the signs
        for (const sign of api.signs.values()) {
            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            let signDrawInfo

            if (sign.type !== undefined && sign.amount !== undefined) {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation(sign.type, sign.amount)
            } else {
                signDrawInfo = signImageAtlasHandler.getDrawingInformation('NOTHING', 'LARGE')
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

        duration.after('collect signs')


        // Collect the stones
        for (const stone of api.stones.values()) {
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

        duration.after('collect stones')


        // Collect wild animals
        for (const animal of api.wildAnimals.values()) {

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

                const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex, animal.percentageTraveled)

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

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex, animal.percentageTraveled)

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
                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex, animal.percentageTraveled)

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

        duration.after('collect wild animals')


        // Collect ships
        for (const ship of api.ships.values()) {

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

                let direction: Direction = 'WEST'

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


        // Collect workers
        for (const worker of api.workers.values()) {

            // Worker is moving and not at a fixed point
            if (worker.betweenPoints && worker.previous !== undefined && worker.next) {
                if (worker.previous.x < minXInGame - 1 || worker.previous.x > maxXInGame || worker.previous.y < minYInGame - 1 || worker.previous.y > maxYInGame + 1) {
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

                if (worker.type === 'Donkey') {
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, renderState.animationIndex, worker.percentageTraveled)

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
                } else if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                    let image

                    if (worker.cargo) {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierWithCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)
                        }
                    } else {
                        if (worker?.bodyType === 'FAT') {
                            image = fatCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)
                        } else {
                            image = thinCarrierNoCargo.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)
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
                    const animationImage = workers.get(worker.type)?.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)

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
                    if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                        let cargoDrawInfo

                        if (worker?.bodyType === 'FAT') {
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        }

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)

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
                if (worker.x < minXInGame - 1 || worker.x > maxXInGame || worker.y < minYInGame - 1 || worker.y > maxYInGame + 1) {
                    continue
                }

                if (worker.type === 'Donkey') {
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
                } else if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
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
                        } else if (worker.bodyType === 'THIN') {
                            const animationImage = thinCarrierNoCargo.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y }
                                })
                            }
                        } else {
                            console.error(`COURIER OR STOREHOUSE WORKER DOING ACTION AND IT'S NEITHER FAT NOR THIN`)
                            console.log(worker)
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
                    if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                        let cargoDrawInfo

                        if (worker?.bodyType === 'FAT') {
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        }

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: worker
                        })
                    } else {
                        const cargo = workers.get(worker.type)?.getDrawingInformationForCargo(worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)

                        toDrawNormal.push({
                            source: cargo,
                            gamePoint: worker
                        })
                    }
                }
            }
        }

        duration.after('collect workers')


        // Collect flags
        let flagCount = 0
        for (const flag of api.flags.values()) {
            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const flagDrawInfo = flagAnimations.getAnimationFrame(flag.nation, flag.color, flag.type, renderState.animationIndex, flagCount)

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
                        height: api.getHeight(flag)
                    })
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {
                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                        toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: { x: flag.x + 0.08, y: flag.y - 0.1 * i + 0.2 },
                            height: api.getHeight(flag)
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
                            height: api.getHeight(flag)
                        })
                    }
                }
            }

            flagCount = flagCount + 1
        }

        duration.after('collect flags')


        // Collect available construction
        if (renderState.showAvailableConstruction) {
            for (const [gamePoint, available] of api.availableConstruction.entries()) {
                if (available.length === 0) {
                    continue
                }

                if (gamePoint.x + 1 < minXInGame || gamePoint.x - 1 > maxXInGame || gamePoint.y + 1 < minYInGame || gamePoint.y - 1 > maxYInGame) {
                    continue
                }

                if (available.includes('LARGE')) {
                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForLargeHouseAvailable()

                    toDrawNormal.push({
                        source: largeHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('MEDIUM')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('SMALL')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()

                    toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('MINE')) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()

                    toDrawNormal.push({
                        source: mineAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('FLAG')) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()

                    toDrawNormal.push({
                        source: flagAvailableInfo,
                        gamePoint
                    })
                }
            }
        }

        duration.after('Collect available construction')


        // Draw the Shadow layer and the Normal layer
        if (renderState.drawShadowProgramInstance) {
            for (const shadow of shadowsToDraw) {
                if (shadow.gamePoint === undefined || shadow.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, shadow.source.image)

                if (textureSlot === undefined) {
                    console.error(`Texture slot is undefined for ${shadow.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawShadowUniforms>(renderState.drawShadowProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [shadow.gamePoint.x, shadow.gamePoint.y],
                        u_screen_offset: [view.translate.x, view.translate.y],
                        u_image_offset: [shadow.source.offsetX, shadow.source.offsetY],
                        u_scale: view.scale,
                        u_source_coordinate: [shadow.source.sourceX, shadow.source.sourceY],
                        u_source_dimensions: [shadow.source.width, shadow.source.height],
                        u_screen_dimensions: [width, height],
                        u_height_adjust: heightAdjust,
                        u_height: shadow.height ?? api.getHeight(shadow.gamePoint)
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            }
        }

        // Sort the toDrawList so it first draws things further away
        const sortedToDrawList = toDrawNormal.sort((draw1, draw2) => {
            return draw2.gamePoint.y - draw1.gamePoint.y
        })


        // Draw normal objects
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of sortedToDrawList) {
                if (toDraw.gamePoint === undefined || toDraw.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [view.translate.x, view.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: view.scale,
                        u_source_coordinate: [toDraw.source.sourceX, toDraw.source.sourceY],
                        u_source_dimensions: [toDraw.source.width, toDraw.source.height],
                        u_screen_dimensions: [width, height],
                        u_height_adjust: heightAdjust,
                        u_height: toDraw.height ?? api.getHeight(toDraw.gamePoint)
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            }
        }

        // Handle the hover layer
        const toDrawHover: ToDraw[] = []

        // Draw possible road connections
        if (renderState.newRoad?.possibleConnections) {
            if (renderState?.newRoad !== undefined) {
                const center = renderState.newRoad.newRoad[renderState.newRoad.newRoad.length - 1]

                // Draw the starting point
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                toDrawHover.push({
                    source: startPointInfo,
                    gamePoint: center
                })

                const centerHeight = api.getHeight(center)

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

                renderState.newRoad.possibleConnections.forEach(
                    (point) => {
                        if (renderState.newRoad?.newRoad.find(newRoadPoint => newRoadPoint.x === point.x && newRoadPoint.y === point.y) === undefined) {
                            const height = api.getHeight(point)
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

        duration.after('collect possible road connections')


        // Draw the selected point
        if (!hideSelectedPoint) {
            if (renderState.selectedPoint) {
                const selectedPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForSelectedPoint()

                toDrawHover.push({
                    source: selectedPointDrawInfo,
                    gamePoint: renderState.selectedPoint
                })
            }
        }

        duration.after('collect selected point')


        // Draw the hover point
        if (!hideHoverPoint) {
            if (renderState.hoverPoint && renderState.hoverPoint.y > 0 && renderState.hoverPoint.x > 0) {
                const availableConstructionAtHoverPoint = api.availableConstruction.get(renderState.hoverPoint)

                if (availableConstructionAtHoverPoint !== undefined && availableConstructionAtHoverPoint.length > 0) {
                    if (availableConstructionAtHoverPoint.includes('LARGE')) {

                        const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverLargeHouseAvailable()

                        toDrawHover.push({
                            source: largeHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('MEDIUM')) {
                        const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()

                        toDrawHover.push({
                            source: mediumHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('SMALL')) {
                        const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()

                        toDrawHover.push({
                            source: smallHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('MINE')) {
                        const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()

                        toDrawHover.push({
                            source: mineAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('FLAG')) {
                        const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()

                        toDrawHover.push({
                            source: flagAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    }
                } else {
                    const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()

                    toDrawHover.push({
                        source: hoverPointDrawInfo,
                        gamePoint: renderState.hoverPoint
                    })
                }
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of toDrawHover) {
                if (toDraw.gamePoint === undefined || toDraw.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants and draw
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [view.translate.x, view.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: view.scale,
                        u_source_coordinate: [toDraw.source.sourceX, toDraw.source.sourceY],
                        u_source_dimensions: [toDraw.source.width, toDraw.source.height],
                        u_screen_dimensions: [width, height],
                        u_height_adjust: heightAdjust,
                        u_height: toDraw.height ?? api.getHeight(toDraw.gamePoint)
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            }
        }

        duration.after('draw normal layer')


        // Draw house titles
        if (renderState.showHouseTitles) {
            overlayCtx.font = 'bold 12px sans-serif'
            overlayCtx.strokeStyle = 'black'
            overlayCtx.fillStyle = 'yellow'

            for (const house of api.houses.values()) {
                if (api.playerId === undefined || house.playerId !== api.playerId) {
                    continue
                }

                if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                    continue
                }

                const screenPoint = gamePointToScreenPointWithHeightAdjustmentInternal(house)

                const houseDrawInformation = houses.getDrawingInformationForHouseReady(house.nation, house.type)

                let heightOffset = 0

                if (houseDrawInformation) {
                    heightOffset = houseDrawInformation[0].offsetY * view.scale / DEFAULT_SCALE
                }

                let houseTitle = buildingPretty(house.type)

                if (house.state === 'UNFINISHED') {
                    houseTitle = '(' + houseTitle + ')'
                } else if (house.state === 'UNOCCUPIED') {
                    houseTitle = houseTitle + ' (unoccupied)'
                } else if (house.productivity !== undefined && house.state === 'OCCUPIED') {
                    houseTitle = houseTitle + ' (' + house.productivity + '%)'
                }

                const widthOffset = overlayCtx.measureText(houseTitle).width / 2

                screenPoint.x -= widthOffset
                screenPoint.y -= heightOffset

                overlayCtx.strokeText(houseTitle, screenPoint.x, screenPoint.y - 5)
                overlayCtx.fillText(houseTitle, screenPoint.x, screenPoint.y - 5)
            }
        }

        duration.after('draw house titles')


        // Fill in the buffers to draw fog of war
        if (renderState.fogOfWarProgramInstance) {
            draw<FogOfWarUniforms>(renderState.fogOfWarProgramInstance,
                {
                    u_scale: [view.scale, view.scale],
                    u_offset: [view.translate.x, view.translate.y],
                    u_screen_width: width,
                    u_screen_height: height
                },
                'NO_CLEAR_BEFORE_DRAW'
            )
        }

        duration.reportStats()


        // List counters if the rendering time exceeded the previous maximum
        if (isLatestValueHighestForVariable('GameRender::renderGame.total')) {
            printVariables()
        }

        // Draw the FPS counter
        const timestamp = Date.now()

        if (showFpsCounter && renderState.previousTimestamp) {
            const fps = getLatestValueForVariable('GameRender::renderGame.total')

            overlayCtx.fillStyle = 'white'
            overlayCtx.fillRect(width - 100, 5, 100, 60)

            overlayCtx.closePath()

            overlayCtx.fillStyle = 'black'
            overlayCtx.fillText('' + fps, width - 100, 20)

            overlayCtx.fillText('' + getAverageValueForVariable('GameRender::renderGame.total'), width - 100, 40)
        }

        renderState.previousTimestamp = timestamp

        requestAnimationFrame(renderGame)
    }

    const gamePointToScreenPointWithHeightAdjustmentInternal = useCallback((gamePoint: Point) => {
        const height = api.getHeight(gamePoint)

        return gamePointToScreenPointWithHeightAdjustment(
            gamePoint,
            height,
            view,
            heightAdjust,
            STANDARD_HEIGHT
        )
    }, [renderState, heightAdjust])

    const screenPointToGamePointNoHeightAdjustmentInternal = useCallback((screenPoint: ScreenPoint) => {
        return screenPointToGamePointNoHeightAdjustment(screenPoint, view)
    }, [renderState])

    const onClick = useCallback(async (event: React.MouseEvent) => {
        if (overlayCanvasRef?.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * overlayCanvasRef.current.height)

            const gamePoint = screenPointToGamePointWithHeightAdjustmentInternal({ x: x, y: y })

            if (onPointClicked) {
                onPointClicked(gamePoint)
            }
        }
    }, [overlayCanvasRef, onPointClicked])

    const screenPointToGamePointWithHeightAdjustmentInternal = useCallback((point: Point) => {
        return screenPointToGamePointWithHeightAdjustment(point, view, heightAdjust)
    }, [view, heightAdjust])

    const onDoubleClickInternal = useCallback((event: React.MouseEvent) => {
        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.error('Received invalid double click event')

            return
        }

        if (overlayCanvasRef?.current) {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * overlayCanvasRef.current.width)
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * overlayCanvasRef.current.height)

            const gamePoint = screenPointToGamePointWithHeightAdjustmentInternal({ x: x, y: y })

            onDoubleClick && onDoubleClick(gamePoint)
        }
    }, [overlayCanvasRef, screenPointToGamePointWithHeightAdjustmentInternal, onDoubleClick])

    const onClickOrDoubleClick = useCallback((event: React.MouseEvent) => {

        // Save currentTarget. This field becomes null directly after
        const currentTarget = event.currentTarget

        // Distinguish between single and doubleclick
        if (event.detail === 1) {
            doubleClickDetection.timer = setTimeout(() => {
                event.currentTarget = currentTarget

                onClick(event)
            }, 200)
        } else {
            if (doubleClickDetection.timer) {
                clearTimeout(doubleClickDetection.timer)
            }

            event.currentTarget = currentTarget

            onDoubleClickInternal(event)
        }

        event.stopPropagation()
    }, [doubleClickDetection, onClick, onDoubleClickInternal])

    return (
        <>
            <canvas
                className='game-canvas'
                onKeyDown={onKeyDown}
                onClick={onClickOrDoubleClick}
                style={{ cursor: MOUSE_STYLES.get(cursor ?? 'NOTHING') }}

                ref={overlayCanvasRef}
                onMouseMove={
                    (event: React.MouseEvent) => {

                        // Convert to game coordinates
                        if (overlayCanvasRef?.current) {
                            const rect = event.currentTarget.getBoundingClientRect()
                            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * overlayCanvasRef.current.width)
                            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * overlayCanvasRef.current.height)

                            try {
                                const hoverPoint = screenPointToGamePointWithHeightAdjustmentInternal({ x, y })

                                if (hoverPoint &&
                                    hoverPoint.y >= 0 &&
                                    hoverPoint.x >= 0 &&
                                    (!renderState.hoverPoint ||
                                        (hoverPoint.x !== renderState.hoverPoint.x || hoverPoint.y !== renderState.hoverPoint.y))) {
                                    renderState.hoverPoint = hoverPoint
                                }
                            } catch (error) {
                                console.error(error)
                            }
                        }

                        // Allow the event to propagate to make scrolling work
                    }
                }
            />

            <canvas ref={normalCanvasRef} className='terrain-canvas' />
        </>
    )
}

function isOnEdgeOfDiscovery(point: Point, discovered: PointSet): boolean {
    const surrounding = surroundingPoints(point)

    // TODO: filter points outside of the map
    const foundInside = surrounding.filter(neighbor => neighbor.x > 0 && discovered.has(neighbor)).length > 0
    const foundOutside = surrounding.filter(neighbor => neighbor.x > 0 && !discovered.has(neighbor)).length > 0

    return foundInside && foundOutside
}

function getTrianglesAffectedByFogOfWar(discovered: PointSet, tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>): ShadedPoint[][] {
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
    const previousHeight = api.getHeight(previous)
    const nextHeight = api.getHeight(next)

    return previousHeight + (nextHeight - previousHeight) * progress
}

function prepareToRenderRoads(roads: Iterable<RoadInformation>, flags: Iterable<FlagInformation>, allNormals: PointMap<Vector>): RenderInformation {
    console.log('Prepare to render roads')

    const coordinates: number[] = []
    const normals: number[] = []
    const textureMapping: number[] = []

    const mainRoadFlagPoints = new PointSet()
    const normalRoadFlagPoints = new PointSet()

    // Iterate through each segment of the road
    for (const road of roads) {
        let previous: Point | undefined = undefined

        if (road.type === 'MAIN') {
            mainRoadFlagPoints.add(road.points[0])
            mainRoadFlagPoints.add(road.points[road.points.length - 1])
        } else {
            normalRoadFlagPoints.add(road.points[0])
            normalRoadFlagPoints.add(road.points[road.points.length - 1])
        }

        for (const point of road.points) {
            if (previous === undefined) {
                previous = point

                continue
            }

            let left
            let right

            if (previous.x < point.x) {
                left = previous
                right = point
            } else {
                left = point
                right = previous
            }

            const normalLeft = allNormals?.get(left)
            const normalRight = allNormals?.get(right)

            if (normalLeft === undefined || normalRight === undefined) {
                console.error('Missing normals')
                console.log(normalLeft)
                console.log(normalRight)

                continue
            }

            // Handle horizontal roads
            if (left.y === right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x, left.y - 0.15, heightLeft,
                        left.x, left.y + 0.15, heightLeft,
                        right.x, right.y - 0.15, heightRight,
                        left.x, left.y + 0.15, heightLeft,
                        right.x, right.y - 0.15, heightRight,
                        right.x, right.y + 0.15, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)

                // Handle road up-right
            } else if (left.y < right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x + 0.1, left.y - 0.1, heightLeft,
                        left.x - 0.1, left.y + 0.1, heightLeft,
                        right.x + 0.1, right.y - 0.1, heightRight,
                        left.x - 0.1, left.y + 0.1, heightLeft,
                        right.x + 0.1, right.y - 0.1, heightRight,
                        right.x - 0.1, right.y + 0.1, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)

                // Handle road down-right
            } else if (left.y > right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x - 0.1, left.y - 0.1, heightLeft,
                        left.x + 0.1, left.y + 0.1, heightLeft,
                        right.x - 0.1, right.y - 0.1, heightRight,
                        left.x + 0.1, left.y + 0.1, heightLeft,
                        right.x - 0.1, right.y - 0.1, heightRight,
                        right.x + 0.1, right.y + 0.1, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)
            }

            previous = point
        }
    }

    // Add a circle of 'road' for each flag
    for (const flag of flags) {
        const isNormal = normalRoadFlagPoints.has(flag)
        const isMain = mainRoadFlagPoints.has(flag)

        if (!isNormal && !isMain) {
            continue
        }

        const height = api.allTiles.get(flag)?.height ?? 0
        const normal = allNormals.get(flag) ?? { x: 0, y: 0, z: 1 }

        // TODO: read out height and normals surrounding and then interpolate

        Array.prototype.push.apply(
            coordinates,
            [
                flag.x - 0.15, flag.y - 0.15, height,
                flag.x - 0.15, flag.y + 0.15, height,
                flag.x + 0.15, flag.y - 0.15, height,
                flag.x - 0.15, flag.y + 0.15, height,
                flag.x + 0.15, flag.y - 0.15, height,
                flag.x + 0.15, flag.y + 0.15, height
            ]
        )

        Array.prototype.push.apply(normals,
            [
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z
            ])

        Array.prototype.push.apply(textureMapping, isMain ? MAIN_ROAD_WITH_FLAG : NORMAL_ROAD_WITH_FLAG)
    }

    return {
        coordinates,
        normals,
        textureMapping
    }
}

function calculateNormalsForEachPoint(tilesBelow: Iterable<TileBelow>, tilesDownRight: Iterable<TileDownRight>, allNormals: PointMap<Vector>): void {
    const straightBelowNormals = new PointMap<Vector>()
    const downRightNormals = new PointMap<Vector>()

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
    for (const point of api.discoveredPoints) {
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

            allNormals.set(point, normalized)
        } else {
            allNormals.set(point, { x: 0, y: 0, z: 1 })
        }
    }
}

function prepareToRenderFromTiles(tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>, allTiles: PointMap<TerrainAtPoint>, allNormals: PointMap<Vector>): MapRenderInformation {
    const coordinates: number[] = []
    const normals: number[] = []
    const textureMappings: number[] = []

    const transitionCoordinates: number[] = []
    const transitionNormals: number[] = []
    const transitionTextureMappings: number[] = []

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
            console.error('UNKNOWN TERRAIN: ' + terrainBelow)
        }

        // Add each terrain tile to the buffers (coordinates, normals, texture mapping)
        triangleBelow.forEach(point => Array.prototype.push.apply(coordinates, [point.x, point.y, allTiles.get(point)?.height ?? 0]))

        triangleBelow
            .map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR)
            .forEach(normal => Array.prototype.push.apply(normals, [normal.x, normal.y, normal.z]))

        Array.prototype.push.apply(textureMappings, VEGETATION_TO_TEXTURE_MAPPING.get(terrainBelow)?.below ?? [0, 0, 0.5, 1, 1, 0])

        // Add transition triangles
        const terrainAtDownLeft = allTiles.get(pointDownLeft)
        const terrainAtDown = allTiles.get(pointDown)
        const terrain = allTiles.get(point)
        const terrainLeft = allTiles.get(pointLeft)

        const overlap = OVERLAPS.get(terrainBelow)
        const transitionTextureMapping = TRANSITION_TEXTURE_MAPPINGS.get(terrainBelow)

        // Transition below
        if (overlap && terrainAtDownLeft && overlap.has(terrainAtDownLeft.downRight) && transitionTextureMapping && terrainAtDown) {
            const baseHeight = (tileBelow.heightDownLeft + tileBelow.heightDownRight) / 2
            const downHeight = terrainAtDown.height

            Array.prototype.push.apply(
                transitionCoordinates,
                [
                    pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
                    pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
                    pointDown.x, pointDownLeft.y - 0.4, baseHeight + (downHeight - baseHeight) * 0.4
                ]
            )

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [pointDownLeft, pointDownRight, pointDown]

            // TODO: interpolate the normal
            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
        }

        // Transition up-right
        if (overlap && terrain && overlap.has(terrain.downRight) && transitionTextureMapping) {
            const baseHeight = (tileBelow.heightAbove + tileBelow.heightDownRight) / 2
            const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }
            const heightRight = allTiles.get(pointRight)?.height ?? 0

            Array.prototype.push.apply(
                transitionCoordinates,
                [
                    point.x, point.y, tileBelow.heightAbove,
                    pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
                    base.x + (pointRight.x - base.x) * OVERLAP_FACTOR, base.y + (pointRight.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightRight - baseHeight) * OVERLAP_FACTOR
                ])

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [point, pointDownRight, pointRight]

            // TODO: interpolate the normal
            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
        }

        // Transition up-left
        if (overlap && terrainLeft && overlap.has(terrainLeft?.downRight) && transitionTextureMapping) {
            const baseHeight = (tileBelow.heightDownLeft, tileBelow.heightAbove) / 2
            const base = { x: (point.x + pointDownLeft.x) / 2, y: (point.y + pointDownLeft.y) / 2 }
            const heightLeft = terrainLeft.height

            Array.prototype.push.apply(
                transitionCoordinates,
                [
                    point.x, point.y, tileBelow.heightAbove,
                    pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
                    base.x + (pointLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightLeft - baseHeight) * OVERLAP_FACTOR
                ])

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [point, pointDownLeft, pointLeft]

            // TODO: interpolate the normal
            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
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
            console.log('UNKNOWN TERRAIN: ' + terrainDownRight)
        }

        // Add each terrain tile to the buffers (coordinates, normals, texture mapping)
        triangleDownRight.forEach(point => Array.prototype.push.apply(coordinates, [point.x, point.y, allTiles.get(point)?.height ?? 0]))

        triangleDownRight
            .map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR)
            .forEach(normal => Array.prototype.push.apply(normals, [normal.x, normal.y, normal.z]))

        Array.prototype.push.apply(textureMappings, VEGETATION_TO_TEXTURE_MAPPING.get(terrainDownRight)?.downRight ?? [0, 1, 0.5, 0, 1, 1])

        const overlap = OVERLAPS.get(terrainDownRight)
        const transitionTextureMapping = TRANSITION_TEXTURE_MAPPINGS.get(terrainDownRight)

        // Add transition triangles

        // Triangle below on the left
        if (overlap && terrainBelow && overlap.has(terrainBelow.below) && transitionTextureMapping) {
            const baseHeight = (tile.heightLeft, tile.heightDown) / 2
            const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }

            Array.prototype.push.apply(transitionCoordinates,
                [
                    pointDownRight.x, pointDownRight.y, tile.heightDown,
                    point.x, point.y, tile.heightLeft,
                    base.x + (pointDownLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointDownLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (allTiles.get(pointDownLeft)?.height ?? 0 - baseHeight) * OVERLAP_FACTOR
                ])

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [pointDownRight, point, pointDownLeft]

            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
        }

        // Triangle above
        if (overlap && terrainUpRight && overlap.has(terrainUpRight.below) && transitionTextureMapping) {
            const baseHeight = (tile.heightLeft, tile.heightRight) / 2
            const heightUp = allTiles.get(pointUpRight)?.height ?? 0

            Array.prototype.push.apply(transitionCoordinates,
                [
                    point.x, point.y, tile.heightLeft,
                    pointRight.x, pointRight.y, tile.heightRight,
                    point.x + 1, point.y + OVERLAP_FACTOR, baseHeight + (heightUp - baseHeight) * OVERLAP_FACTOR
                ]
            )

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [point, pointRight, pointUpRight]

            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
        }

        // Triangle below on the right
        if (overlap && terrainRight && overlap.has(terrainRight.below) && transitionTextureMapping) {
            const baseHeight = (tile.heightRight + tile.heightDown) / 2
            const base = { x: (pointRight.x + pointDownRight.x) / 2, y: (pointRight.y + pointDownRight.y) / 2 }
            const heightRightDownRight = allTiles.get(pointRightDownRight)?.height ?? 0

            Array.prototype.push.apply(transitionCoordinates,
                [
                    pointRight.x, pointRight.y, tile.heightRight,
                    pointDownRight.x, pointDownRight.y, tile.heightDown,
                    base.x + (pointRightDownRight.x - base.x) * 0.4, base.y + (pointRightDownRight.y - base.y) * 0.4, baseHeight + (heightRightDownRight - baseHeight) * 0.4
                ]
            )

            Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)

            const points = [pointRight, pointDownRight, pointRightDownRight]

            points.map(point => allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR).forEach(
                normal => Array.prototype.push.apply(transitionNormals, [normal.x, normal.y, normal.z])
            )
        }
    })

    return {
        coordinates: coordinates.concat(transitionCoordinates),
        normals: normals.concat(transitionNormals),
        textureMapping: textureMappings.concat(transitionTextureMappings)
    }
}

function updateFogOfWarRendering(allPointsVisibilityTracking: PointMap<TrianglesAtPoint>): FogOfWarRenderInformation {
    const triangles = getTrianglesAffectedByFogOfWar(api.discoveredPoints, api.discoveredBelowTiles, api.discoveredDownRightTiles)

    const fogOfWarCoordinates: number[] = []
    const fogOfWarIntensities: number[] = []

    triangles.forEach(triangle => {
        fogOfWarCoordinates.push(triangle[0].point.x)
        fogOfWarCoordinates.push(triangle[0].point.y)

        fogOfWarCoordinates.push(triangle[1].point.x)
        fogOfWarCoordinates.push(triangle[1].point.y)

        fogOfWarCoordinates.push(triangle[2].point.x)
        fogOfWarCoordinates.push(triangle[2].point.y)

        fogOfWarIntensities.push(triangle[0].intensity)
        fogOfWarIntensities.push(triangle[1].intensity)
        fogOfWarIntensities.push(triangle[2].intensity)
    })

    // Add triangles to draw black
    api.discoveredBelowTiles.forEach(discoveredBelow => {
        const below = allPointsVisibilityTracking.get(discoveredBelow.pointAbove)

        if (below) {
            below.belowVisible = true
        }
    })

    api.discoveredDownRightTiles.forEach(discoveredDownRight => {
        const downRight = allPointsVisibilityTracking.get(discoveredDownRight.pointLeft)

        if (downRight) {
            downRight.downRightVisible = true
        }
    })

    allPointsVisibilityTracking.forEach((trianglesAtPoint, point) => {
        const downLeft = getPointDownLeft(point)
        const downRight = getPointDownRight(point)
        const right = getPointRight(point)

        if (!trianglesAtPoint.belowVisible) {
            fogOfWarCoordinates.push(point.x)
            fogOfWarCoordinates.push(point.y)

            fogOfWarCoordinates.push(downLeft.x)
            fogOfWarCoordinates.push(downLeft.y)

            fogOfWarCoordinates.push(downRight.x)
            fogOfWarCoordinates.push(downRight.y)

            fogOfWarIntensities.push(0)
            fogOfWarIntensities.push(0)
            fogOfWarIntensities.push(0)
        }

        if (!trianglesAtPoint.downRightVisible) {
            fogOfWarCoordinates.push(point.x)
            fogOfWarCoordinates.push(point.y)

            fogOfWarCoordinates.push(right.x)
            fogOfWarCoordinates.push(right.y)

            fogOfWarCoordinates.push(downRight.x)
            fogOfWarCoordinates.push(downRight.y)

            fogOfWarIntensities.push(0)
            fogOfWarIntensities.push(0)
            fogOfWarIntensities.push(0)
        }
    })

    return { coordinates: fogOfWarCoordinates, intensities: fogOfWarIntensities }
}

export { GameCanvas }

