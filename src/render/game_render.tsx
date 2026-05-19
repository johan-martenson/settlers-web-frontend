import React, { useCallback, useEffect, useRef } from 'react'
import { Direction, Point, RoadInformation, VEGETATION_INTEGERS, TerrainAtPoint, FlagInformation } from '../api/types'
import { Duration } from '../utils/stats/duration'
import './game_render.css'
import { api, TileBelow, TileDownRight } from '../api/ws-api'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from '../utils/stats/stats'
import { gamePointToScreenPointWithHeightAdjustment, getDirectionForWalkingWorker, getHouseSize, getNormalForTriangle, getPointDown, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUp, getPointUpLeft, getPointUpRight, normalize, resizeCanvasToDisplaySize, screenPointToGamePointNoHeightAdjustment, screenPointToGamePointWithHeightAdjustment, sumAndNormalizeVectors, sumVectors, surroundingPoints, Vector } from '../utils/utils'
import { PointMap, PointSet } from '../utils/util_types'
import { borderImageAtlasHandler, cargoImageAtlasHandler, cropsImageAtlasHandler, decorationsImageAtlasHandler, fireImageAtlasHandler, houses, loadImageAsync, roadBuildingImageAtlasHandler, shipImageAtlas, signImageAtlasHandler, stoneImageAtlasHandler, treeImageAtlasHandler, uiElementsImageAtlasHandler } from '../assets/image_atlas_handlers'
import { fogOfWarFragmentShader, fogOfWarVertexShader } from '../shaders/fog-of-war'
import { shadowFragmentShader, textureFragmentShader, texturedImageVertexShaderPixelPerfect } from '../shaders/image-and-shadow'
import { textureAndLightingFragmentShader, textureAndLightingVertexShader } from '../shaders/terrain-and-roads'
import { NewRoad } from '../screens/play/play'
import { DEFAULT_SCALE, MAIN_ROAD_TEXTURE_MAPPING, MAIN_ROAD_WITH_FLAG, NORMAL_ROAD_TEXTURE_MAPPING, NORMAL_ROAD_WITH_FLAG, OVERLAPS, STANDARD_HEIGHT, TRANSITION_TEXTURE_MAPPINGS, UNIT_SQUARE, VEGETATION_TO_TEXTURE_MAPPING } from './constants'
import { textures } from '../render/textures'
import { ProgramDescriptor, ProgramInstance, destroyProgram, draw, initProgram, setBuffer } from './utils'
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
    viewRef: React.MutableRefObject<View>,
    hideHoverPoint?: boolean
    hideSelectedPoint?: boolean
    heightAdjust: number
    fogOfWar?: boolean

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
    fogOfWar: boolean

    // Map of the normal for each point on the map
    normals: PointMap<Vector>

    // Drawing program instances
    drawGroundProgramInstance?: ProgramInstance
    drawRoadsProgramInstance?: ProgramInstance
    drawImageProgramInstance?: ProgramInstance
    drawShadowProgramInstance?: ProgramInstance
    fogOfWarProgramInstance?: ProgramInstance

    visiblePoints: PointMap<TrianglesAtPoint>
    once: boolean

    // Render loop control
    renderLoopHandle: ReturnType<typeof requestAnimationFrame> | undefined
    renderLoopIsRunning?: boolean
    contextLost: boolean

    // Render loop caching
    toDrawNormal: ToDraw[]
    shadowsToDraw: ToDraw[]
    decorationsToDraw: ToDraw[]
    toDrawHover: ToDraw[]
}

type DoubleClickDetection = {
    timer?: ReturnType<typeof setTimeout> | undefined
}

// Configuration
export const RenderLogConfig = {
    lifecycle: false,      // startup, listeners, setup phases
    renderLoop: false,    // per-frame rendering / high-frequency paths
    gl: false,             // WebGL context, programs, critical failures
    assets: false,         // textures, atlases, asset loading
    textures: false,       // texture slots, bindings, lookups
    terrain: false,        // terrain types, tiles, mesh generation
    normals: false,       // normal vectors, geometry diagnostics
    roads: false,          // road buffers, callbacks, updates
    fogOfWar: false,       // discovery & visibility
    input: false,          // mouse / keyboard / interaction
    workers: false,        // worker rendering & state
    debug: false          // raw object dumps
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

type FogOfWarAttributes = 'a_coordinates' | 'a_intensity'


type FogOfWarUniforms = {
    u_scale: number[]
    u_offset: number[]
    u_screen_height: number
    u_screen_width: number
}

// Functions
function makeInitRenderState(): RenderState {
    return {
        previous: performance.now(),
        overshoot: 0,
        newRoadCurrentLength: 0,
        animationIndex: 0,
        normals: new PointMap<Vector>(),
        visiblePoints: new PointMap<TrianglesAtPoint>(),
        once: true,
        showHouseTitles: false,
        showAvailableConstruction: false,
        renderLoopHandle: undefined,
        toDrawNormal: [],
        shadowsToDraw: [],
        decorationsToDraw: [],
        toDrawHover: [],
        contextLost: false,
        fogOfWar: true
    }
}

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
    viewRef,
    hideHoverPoint = false,
    hideSelectedPoint = false,
    fogOfWar = true,
    onPointClicked,
    onKeyDown,
    onDoubleClick }: GameCanvasProps) {

    // References
    const normalCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)

    // Constants
    const lightVector = [1, 1, -1]

    // State that doesn't trigger re-renders
    const renderState = useNonTriggeringState<RenderState>(makeInitRenderState())
    const doubleClickDetection = useNonTriggeringState<DoubleClickDetection>({})

    // Functions
    /**
     * Rendering uses two different coordinate/size systems:
     *
     * 1. CSS pixels
     *    - Logical screen coordinates used by mouse input, view transforms,
     *      overlay rendering, and game/screen coordinate conversions.
     *    - These come from:
     *          canvas.clientWidth
     *          canvas.clientHeight
     *          event.clientX/clientY
     *    - All game math must use CSS pixels.
     *
     * 2. Device pixels (framebuffer pixels)
     *    - Physical render resolution used internally by WebGL.
     *    - These are CSS pixels multiplied by devicePixelRatio (DPR).
     *    - These come from:
     *          canvas.width
     *          canvas.height
     *          gl.viewport(...)
     *    - Only WebGL framebuffer sizing should use device pixels.
     *
     * Relationship:
     *      framebufferSize = cssSize * devicePixelRatio
     *
     * Usage rules inside the render loop:
     *    - WebGL viewport and canvas backing resolution:
     *          use device pixels
     *
     *    - Mouse coordinates, view transforms, overlay drawing,
     *      culling, and game/screen conversions:
     *          use CSS pixels
     *
     * Mixing these coordinate systems causes:
     *    - incorrect mouse picking
     *    - shifted overlays/text
     *    - incorrect culling
     *    - scaling/rendering artifacts on high-DPI displays
     */
    const renderGame = useCallback(() => {
        const duration = new Duration('GameRender::renderGame')

        // Avoid trying to draw if the webgl context is lost
        if (renderState.contextLost) {
            return
        }

        // Only draw if the game data is available
        if (!api.isGameDataAvailable()) {
            return
        }

        // Handle the animation counter
        const now = performance.now()
        const timeSinceLastDraw = now - renderState.previous + renderState.overshoot

        renderState.animationIndex = (renderState.animationIndex + Math.floor(timeSinceLastDraw / ANIMATION_PERIOD)) % 64
        renderState.overshoot = timeSinceLastDraw % ANIMATION_PERIOD
        renderState.previous = now

        // Check if there are changes to the newRoads props array. In that case the buffers for drawing roads need to be updated.
        const newRoadsUpdatedLength = renderState.newRoad?.newRoad.length ?? 0

        if (renderState.newRoadCurrentLength !== newRoadsUpdatedLength) {
            renderState.newRoadCurrentLength = newRoadsUpdatedLength

            if (renderState.newRoad !== undefined) {
                // TODO: this should be moved out of the render loop

                api.placeLocalRoad(renderState.newRoad.newRoad)
            }

            updateRoadDrawingBuffers()
        }

        // Ensure that the reference to the canvases are set
        if (!overlayCanvasRef?.current || !normalCanvasRef?.current) {
            console.error('Render (render-loop): The canvas references are not set properly')

            return
        }

        // Get the rendering context for the overlay canvas
        const overlayCtx = overlayCanvasRef.current.getContext('2d')

        // Ensure that the canvas rendering context is valid
        if (!overlayCtx) {
            console.error('Render (gl): No or invalid context')

            return
        }

        // Set the resolution
        const dpr = window.devicePixelRatio || 1

        const normalCanvas = normalCanvasRef.current
        const overlayCanvas = overlayCanvasRef.current

        if (!normalCanvas || !overlayCanvas) {
            return
        }

        const displayWidth = Math.floor(normalCanvas.clientWidth * dpr)
        const displayHeight = Math.floor(normalCanvas.clientHeight * dpr)

        if (normalCanvas.width !== displayWidth ||
            normalCanvas.height !== displayHeight) {
            normalCanvas.width = displayWidth
            normalCanvas.height = displayHeight
        }

        if (overlayCanvas.width !== displayWidth ||
            overlayCanvas.height !== displayHeight) {
            overlayCanvas.width = displayWidth
            overlayCanvas.height = displayHeight
        }

        overlayCtx.setTransform(1, 0, 0, 1, 0, 0)
        overlayCtx.scale(dpr, dpr)

        // Make sure gl is available
        if (renderState.gl === undefined) {
            console.error('Render (gl): Gl is not available')

            return
        }

        const width = normalCanvas.clientWidth
        const height = normalCanvas.clientHeight

        renderState.gl.viewport(0, 0, displayWidth, displayHeight)

        // Clear the overlay - make it fully transparent
        overlayCtx.clearRect(0, 0, width, height)

        const upLeft = screenPointToGamePointNoHeightAdjustmentInternal({ x: 0, y: 0 })
        const downRight = screenPointToGamePointNoHeightAdjustmentInternal({ x: width, y: height })

        const minXInGame = upLeft.x
        const maxYInGame = upLeft.y
        const maxXInGame = downRight.x
        const minYInGame = downRight.y

        duration.after('init')

        // Clear the cached render lists
        renderState.toDrawNormal.length = 0
        renderState.shadowsToDraw.length = 0
        renderState.decorationsToDraw.length = 0
        renderState.toDrawHover.length = 0

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
                        u_scale: [viewRef.current.scale, viewRef.current.scale],
                        u_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
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
        api.decorations.forEach(decoration => {
            const image = decorationsImageAtlasHandler.getDrawingInformationFor(decoration.decoration)

            if (image) {
                renderState.decorationsToDraw.push({
                    source: image[0],
                    gamePoint: decoration,
                })

                renderState.shadowsToDraw.push({
                    source: image[1],
                    gamePoint: decoration,
                })
            }
        })

        // Draw decorations objects
        for (const toDraw of renderState.decorationsToDraw) {
            if (toDraw?.source?.image !== undefined && renderState.drawImageProgramInstance !== undefined) {
                const textureSlot = textures.activateTextureForRendering(renderState.drawImageProgramInstance.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: viewRef.current.scale,
                        u_source_coordinate: [toDraw.source.sourceX, toDraw.source.sourceY],
                        u_source_dimensions: [toDraw.source.width, toDraw.source.height],
                        u_screen_dimensions: [width, height],
                        u_height_adjust: heightAdjust,
                        u_height: api.getHeight(toDraw.gamePoint)
                    },
                    'NO_CLEAR_BEFORE_DRAW'
                )
            } else {
                console.error(`Render (textures): The texture for ${toDraw?.source?.image} is undefined`)
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
                        u_scale: [viewRef.current.scale, viewRef.current.scale],
                        u_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
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

                renderState.toDrawNormal.push({
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

                renderState.toDrawNormal.push({
                    source: plannedDrawInformation,
                    gamePoint: house,
                })
            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireAnimations.getAnimationFrame(size, renderState.animationIndex)

                if (fireDrawInformation) {
                    renderState.toDrawNormal.push({
                        source: fireDrawInformation[0],
                        gamePoint: house,
                    })

                    renderState.shadowsToDraw.push({
                        source: fireDrawInformation[1],
                        gamePoint: house,
                    })
                }
            } else if (house.state === 'DESTROYED') {
                const size = getHouseSize(house)

                const fireDrawInformation = fireImageAtlasHandler.getBurntDownDrawingInformation(size)

                renderState.toDrawNormal.push({
                    source: fireDrawInformation,
                    gamePoint: house,
                })
            } else if (house.state === 'UNFINISHED' && house.constructionProgress !== undefined) {
                const houseUnderConstruction = houses.getDrawingInformationForHouseUnderConstruction(house.nation, house.type)

                if (houseUnderConstruction) {
                    renderState.toDrawNormal.push({
                        source: houseUnderConstruction[0],
                        gamePoint: house,
                    })

                    renderState.shadowsToDraw.push({
                        source: houseUnderConstruction[1],
                        gamePoint: house,
                    })
                }

                const houseDrawInformation = houses.getPartialHouseReady(house.nation, house.type, house.constructionProgress)

                if (houseDrawInformation) {
                    renderState.toDrawNormal.push({
                        source: houseDrawInformation[0],
                        gamePoint: house,
                    })

                    renderState.shadowsToDraw.push({
                        source: houseDrawInformation[1],
                        gamePoint: house,
                    })
                }
            } else {

                if ((house.type === 'Mill' && house.isWorking) ||
                    (house.type === 'Mint' && house.isWorking && house.nation === 'ROMANS') ||
                    (house.type === 'IronSmelter' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Armory' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Harbor' && (house.nation === 'ROMANS' || house.nation === 'JAPANESE') && house.isWorking)) {
                    const houseDrawInformation = houses.getDrawingInformationForWorkingHouse(house.nation, house.type, renderState.animationIndex)

                    if (houseDrawInformation) {
                        renderState.toDrawNormal.push({
                            source: houseDrawInformation[0],
                            gamePoint: house,
                        })

                        renderState.shadowsToDraw.push({
                            source: houseDrawInformation[1],
                            gamePoint: house,
                        })
                    }
                } else {
                    const houseDrawInformation = houses.getDrawingInformationForHouseReady(house.nation, house.type)

                    if (houseDrawInformation) {
                        renderState.toDrawNormal.push({
                            source: houseDrawInformation[0],
                            gamePoint: house,
                        })

                        renderState.shadowsToDraw.push({
                            source: houseDrawInformation[1],
                            gamePoint: house,
                        })
                    }
                }

                if (house.door === 'OPEN') {
                    const door = houses.getDrawingInformationForOpenDoor(house.nation, house.type)

                    renderState.toDrawNormal.push({
                        source: door,
                        gamePoint: house,
                    })
                }

                if (house.isWorking) {
                    const smokeDrawInformation = fireAnimations.getSmokeFrameForHouse(house.nation, house.type, renderState.animationIndex)

                    if (smokeDrawInformation) {
                        renderState.toDrawNormal.push({
                            source: smokeDrawInformation,
                            gamePoint: house,
                        })
                    }
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
                    renderState.toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                    })

                    renderState.shadowsToDraw.push({
                        source: treeDrawInfo[1],
                        gamePoint: tree,
                    })
                }
            } else {
                treeDrawInfo = treeImageAtlasHandler.getImageForGrowingTree(tree.type, tree.size)

                if (treeDrawInfo) {
                    renderState.toDrawNormal.push({
                        source: treeDrawInfo[0],
                        gamePoint: tree,
                    })

                    renderState.shadowsToDraw.push({
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
                renderState.toDrawNormal.push({
                    source: treeDrawInfo[0],
                    gamePoint: tree,
                })

                renderState.shadowsToDraw.push({
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
                renderState.toDrawNormal.push({
                    source: cropDrawInfo[0],
                    gamePoint: crop,
                })

                renderState.shadowsToDraw.push({
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
                renderState.toDrawNormal.push({
                    source: signDrawInfo[0],
                    gamePoint: sign,
                })

                renderState.shadowsToDraw.push({
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
                renderState.toDrawNormal.push({
                    source: stoneDrawInfo[0],
                    gamePoint: stone
                })

                renderState.shadowsToDraw.push({
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

                const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex)

                if (animationImage) {
                    renderState.toDrawNormal.push({
                        source: animationImage[0],
                        gamePoint: interpolatedGamePoint,
                        height: interpolatedHeight
                    })

                    if (animationImage.length > 1) {
                        renderState.shadowsToDraw.push({
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

                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex)

                    if (animationImage) {
                        renderState.toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: animal
                        })

                        if (animationImage.length > 1) {
                            renderState.shadowsToDraw.push({
                                source: animationImage[1],
                                gamePoint: animal
                            })
                        }
                    }
                } else {
                    const direction = 'EAST'
                    const animationImage = animals.get(animal.type)?.getAnimationFrame(direction, renderState.animationIndex)

                    if (animationImage) {
                        renderState.toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: animal
                        })

                        if (animationImage.length > 1) {
                            renderState.shadowsToDraw.push({
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
                    renderState.toDrawNormal.push({
                        source: shipImage[0],
                        gamePoint: interpolatedGamePoint,
                        height: interpolatedHeight
                    })

                    renderState.shadowsToDraw.push({
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
                    renderState.toDrawNormal.push({
                        source: shipImage[0],
                        gamePoint: ship
                    })

                    renderState.shadowsToDraw.push({
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
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, renderState.animationIndex)

                    if (donkeyImage) {
                        renderState.toDrawNormal.push({
                            source: donkeyImage[0],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })

                        if (donkeyImage.length > 1) {
                            renderState.shadowsToDraw.push({
                                source: donkeyImage[1],
                                gamePoint: interpolatedGamePoint,
                                height: interpolatedHeight
                            })
                        }
                    }

                    if (worker.cargo) {
                        const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)

                        renderState.toDrawNormal.push({
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
                        renderState.toDrawNormal.push({
                            source: image[0],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })

                        renderState.shadowsToDraw.push({
                            source: image[1],
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    }
                } else {
                    const animationImage = workers[worker.type]?.getAnimationFrame(worker.nation, worker.direction, worker.color, renderState.animationIndex, worker.percentageTraveled)

                    if (animationImage) {
                        renderState.toDrawNormal.push({
                            source: animationImage[0],
                            gamePoint: { x: interpolatedGamePoint.x, y: interpolatedGamePoint.y },
                            height: interpolatedHeight
                        })

                        renderState.shadowsToDraw.push({
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
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        }

                        renderState.toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: interpolatedGamePoint,
                            height: interpolatedHeight
                        })
                    } else {
                        const cargo = workers[worker.type]?.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)

                        if (cargo) {
                            renderState.toDrawNormal.push({
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
                    const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, 0)

                    if (donkeyImage) {
                        renderState.toDrawNormal.push({
                            source: donkeyImage[0],
                            gamePoint: worker
                        })

                        renderState.shadowsToDraw.push({
                            source: donkeyImage[1],
                            gamePoint: worker
                        })
                    }


                    if (worker.cargo) {
                        const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)

                        renderState.toDrawNormal.push({
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

                                renderState.toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y }
                                })
                            }
                        } else if (worker.bodyType === 'THIN') {
                            const animationImage = thinCarrierNoCargo.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                            if (animationImage) {
                                didDrawAnimation = true

                                renderState.toDrawNormal.push({
                                    source: animationImage,
                                    gamePoint: { x: worker.x, y: worker.y }
                                })
                            }
                        } else {
                            console.error(`Render (workers): COURIER OR STOREHOUSE WORKER DOING ACTION AND IT'S NEITHER FAT NOR THIN`)

                            if (RenderLogConfig.debug) {
                                console.log(worker)
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
                            renderState.toDrawNormal.push({
                                source: image[0],
                                gamePoint: worker
                            })

                            renderState.shadowsToDraw.push({
                                source: image[1],
                                gamePoint: worker
                            })
                        }
                    }
                } else {
                    let didDrawAnimation = false

                    if (worker.action && worker.actionAnimationIndex !== undefined) {
                        const animationImage = workers[worker.type]?.getActionAnimation(worker.nation, worker.direction, worker.action, worker.color, worker.actionAnimationIndex)

                        if (animationImage) {
                            didDrawAnimation = true

                            renderState.toDrawNormal.push({
                                source: animationImage,
                                gamePoint: { x: worker.x, y: worker.y }
                            })
                        }
                    }

                    if (!didDrawAnimation) {
                        const animationImage = workers[worker.type]?.getAnimationFrame(worker.nation, worker.direction, worker.color, 0, worker.percentageTraveled / 10)

                        if (animationImage) {
                            renderState.toDrawNormal.push({
                                source: animationImage[0],
                                gamePoint: { x: worker.x, y: worker.y }
                            })

                            renderState.shadowsToDraw.push({
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
                            cargoDrawInfo = fatCarrierWithCargo.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        } else {
                            cargoDrawInfo = thinCarrierWithCargo.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)
                        }

                        renderState.toDrawNormal.push({
                            source: cargoDrawInfo,
                            gamePoint: worker
                        })
                    } else {
                        const cargo = workers[worker.type]?.getDrawingInformationForCargo(worker.nation, worker.direction, worker.cargo, renderState.animationIndex, worker.percentageTraveled / 10)

                        renderState.toDrawNormal.push({
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
                renderState.toDrawNormal.push({
                    source: flagDrawInfo[0],
                    gamePoint: flag
                })

                renderState.shadowsToDraw.push({
                    source: flagDrawInfo[1],
                    gamePoint: flag
                })
            }

            if (flag.stackedCargo) {
                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {
                    const cargo = flag.stackedCargo[i]

                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                    renderState.toDrawNormal.push({
                        source: cargoDrawInfo,
                        gamePoint: { x: flag.x - 0.3, y: flag.y - 0.1 * i + 0.3 },
                        height: api.getHeight(flag)
                    })
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {
                        const cargo = flag.stackedCargo[i]

                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag.nation, cargo)

                        renderState.toDrawNormal.push({
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

                        renderState.toDrawNormal.push({
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

                    renderState.toDrawNormal.push({
                        source: largeHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('MEDIUM')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()

                    renderState.toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('SMALL')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()

                    renderState.toDrawNormal.push({
                        source: mediumHouseAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('MINE')) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()

                    renderState.toDrawNormal.push({
                        source: mineAvailableInfo,
                        gamePoint
                    })
                } else if (available.includes('FLAG')) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()

                    renderState.toDrawNormal.push({
                        source: flagAvailableInfo,
                        gamePoint
                    })
                }
            }
        }

        duration.after('Collect available construction')


        // Draw the Shadow layer and the Normal layer
        if (renderState.drawShadowProgramInstance) {
            for (const shadow of renderState.shadowsToDraw) {
                if (shadow.gamePoint === undefined || shadow.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, shadow.source.image)

                if (textureSlot === undefined) {
                    console.error(`Render (textures): Texture slot is undefined for ${shadow.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawShadowUniforms>(renderState.drawShadowProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [shadow.gamePoint.x, shadow.gamePoint.y],
                        u_screen_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
                        u_image_offset: [shadow.source.offsetX, shadow.source.offsetY],
                        u_scale: viewRef.current.scale,
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
        renderState.toDrawNormal.sort((draw1, draw2) => {
            return draw2.gamePoint.y - draw1.gamePoint.y
        })


        // Draw normal objects
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.toDrawNormal) {
                if (toDraw.gamePoint === undefined || toDraw.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: viewRef.current.scale,
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

        // Draw possible road connections
        if (renderState.newRoad?.possibleConnections) {
            if (renderState?.newRoad !== undefined) {
                const center = renderState.newRoad.newRoad[renderState.newRoad.newRoad.length - 1]

                // Draw the starting point
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                renderState.toDrawHover.push({
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

                            renderState.toDrawHover.push({
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

                renderState.toDrawHover.push({
                    source: selectedPointDrawInfo,
                    gamePoint: renderState.selectedPoint
                })
            }
        }

        duration.after('collect selected point')


        // Draw the hover point
        if (!hideHoverPoint) {
            if (renderState.hoverPoint && renderState.hoverPoint.y >= 0 && renderState.hoverPoint.x >= 0) {
                const availableConstructionAtHoverPoint = api.availableConstruction.get(renderState.hoverPoint)

                if (availableConstructionAtHoverPoint !== undefined && availableConstructionAtHoverPoint.length > 0) {
                    if (availableConstructionAtHoverPoint.includes('LARGE')) {

                        const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverLargeHouseAvailable()

                        renderState.toDrawHover.push({
                            source: largeHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('MEDIUM')) {
                        const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()

                        renderState.toDrawHover.push({
                            source: mediumHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('SMALL')) {
                        const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()

                        renderState.toDrawHover.push({
                            source: smallHouseAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('MINE')) {
                        const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()

                        renderState.toDrawHover.push({
                            source: mineAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    } else if (availableConstructionAtHoverPoint.includes('FLAG')) {
                        const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()

                        renderState.toDrawHover.push({
                            source: flagAvailableInfo,
                            gamePoint: renderState.hoverPoint
                        })
                    }
                } else {
                    const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()

                    renderState.toDrawHover.push({
                        source: hoverPointDrawInfo,
                        gamePoint: renderState.hoverPoint
                    })
                }
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.toDrawHover) {
                if (toDraw.gamePoint === undefined || toDraw.source?.image === undefined) {
                    continue
                }

                const textureSlot = textures.activateTextureForRendering(renderState.gl, toDraw.source.image)

                if (textureSlot === undefined) {
                    console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

                    continue
                }

                // Set the constants and draw
                draw<DrawImageUniforms>(renderState.drawImageProgramInstance,
                    {
                        u_texture: textureSlot,
                        u_game_point: [toDraw.gamePoint.x, toDraw.gamePoint.y],
                        u_screen_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
                        u_image_offset: [toDraw.source.offsetX, toDraw.source.offsetY],
                        u_scale: viewRef.current.scale,
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
                    heightOffset = houseDrawInformation[0].offsetY * viewRef.current.scale / DEFAULT_SCALE
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
        if (renderState.fogOfWar && renderState.fogOfWarProgramInstance) {
            draw<FogOfWarUniforms>(renderState.fogOfWarProgramInstance,
                {
                    u_scale: [viewRef.current.scale, viewRef.current.scale],
                    u_offset: [viewRef.current.translate.x, viewRef.current.translate.y],
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
    }, [renderState])

    const updateRoadDrawingBuffers = useCallback(() => {
        if (RenderLogConfig.roads) {
            console.log('Render (roads): Should update road drawing buffers')
        }
        if (renderState.drawRoadsProgramInstance) {
            const roadRenderInformation = prepareToRenderRoads(api.roads.values(), api.flags.values(), renderState.normals)

            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_coords', roadRenderInformation?.coordinates)
            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_normal', roadRenderInformation.normals)
            setBuffer<DrawGroundAttributes>(renderState.drawRoadsProgramInstance, 'a_texture_mapping', roadRenderInformation.textureMapping)
        } else {
            console.error(`Render (roads): Failed to update road drawing buffers`)
        }
    }, [renderState])

    const initWebgl = useCallback(() => {
        if (renderState.mapRenderInformation === undefined) {
            console.error('Render (gl): Cannot initialize WebGL because the map render information is not available yet')

            return
        }

        if (!normalCanvasRef?.current) {
            console.error('Render (gl): No canvasRef.current')

            return
        }

        // Create WebGL2 context
        const canvas = normalCanvasRef.current
        const gl = canvas.getContext('webgl2', { alpha: false })

        if (!gl) {
            console.error('Render (gl): Failed to get WebGL2 context')

            return
        }

        renderState.gl = gl

        // For debug purposes.
        const loseExt = gl.getExtension('WEBGL_lose_context')
            ; (window as any).__gl = gl
            ; (window as any).__loseExt = loseExt

        // Set up WebGL programs
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

        // Set up the programs to render images and shadows - these will be updated with the correct coordinates in the render loop before drawing
        const positions = UNIT_SQUARE
        const texCoords = UNIT_SQUARE

        setBuffer<DrawImageAttributes>(renderState.drawImageProgramInstance, 'a_position', positions)
        setBuffer<DrawImageAttributes>(renderState.drawImageProgramInstance, 'a_texcoord', texCoords)

        setBuffer<DrawShadowAttributes>(renderState.drawShadowProgramInstance, 'a_position', positions)
        setBuffer<DrawShadowAttributes>(renderState.drawShadowProgramInstance, 'a_texcoord', texCoords)

        // Clear texture cache
        textures.clearTexturesForContext(gl)

        // Load textures
        for (const animation of Object.values(workers)) {
            textures.registerTexture(gl, animation.getImage())
        }

        for (const animation of animals.values()) {
            textures.registerTexture(gl, animation.getImage())
        }

        textures.registerTexture(gl, treeAnimations.getImage())
        textures.registerTexture(gl, flagAnimations.getImage())
        textures.registerTexture(gl, houses.getSourceImage())
        textures.registerTexture(gl, fireAnimations.getImage())
        textures.registerTexture(gl, signImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, uiElementsImageAtlasHandler.getImage())
        textures.registerTexture(gl, cropsImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, stoneImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, decorationsImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, donkeyAnimation.getImage())
        textures.registerTexture(gl, borderImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, roadBuildingImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, cargoImageAtlasHandler.getSourceImage())
        textures.registerTexture(gl, fatCarrierWithCargo.getImage())
        textures.registerTexture(gl, thinCarrierWithCargo.getImage())
        textures.registerTexture(gl, fatCarrierNoCargo.getImage())
        textures.registerTexture(gl, thinCarrierNoCargo.getImage())
        textures.registerTexture(gl, shipImageAtlas.getSourceImage())

        textures.registerTexture(gl, imageAtlasTerrainAndRoads)

        // Prepare buffers for road drawing
        updateRoadDrawingBuffers()

        // Set up fog of war rendering
        updateFogOfWarRendering(renderState.visiblePoints, renderState.fogOfWarProgramInstance!)
    }, [])

    const cleanupWebgl = useCallback(() => {
        destroyProgram(renderState.drawGroundProgramInstance)
        destroyProgram(renderState.drawRoadsProgramInstance)
        destroyProgram(renderState.drawImageProgramInstance)
        destroyProgram(renderState.drawShadowProgramInstance)
        destroyProgram(renderState.fogOfWarProgramInstance)

        renderState.drawGroundProgramInstance = undefined
        renderState.drawRoadsProgramInstance = undefined
        renderState.drawImageProgramInstance = undefined
        renderState.drawShadowProgramInstance = undefined
        renderState.fogOfWarProgramInstance = undefined

        renderState.gl = undefined
    }, [renderState])

    const startRenderLoop = useCallback(() => {
        if (renderState.renderLoopIsRunning) {
            return
        }

        renderState.renderLoopIsRunning = true
        renderState.previous = performance.now()
        renderState.overshoot = 0

        const loop = () => {
            if (!renderState.renderLoopIsRunning) {
                return
            }

            renderGame()
            renderState.renderLoopHandle = requestAnimationFrame(loop)
        }

        renderState.renderLoopHandle = requestAnimationFrame(loop)
    }, [renderState, renderGame])

    const stopRenderLoop = useCallback(() => {
        renderState.renderLoopIsRunning = false

        if (renderState.renderLoopHandle !== undefined) {
            cancelAnimationFrame(renderState.renderLoopHandle)
            renderState.renderLoopHandle = undefined
        }
    }, [renderState])

    // Effects
    // Effect: listen for webgl context loss
    useEffect(() => {
        const canvas = normalCanvasRef.current
        if (!canvas) return

        function onContextLost(event: Event) {
            event.preventDefault()

            console.warn('WebGL context lost')

            renderState.contextLost = true
            stopRenderLoop()
        }

        function onContextRestored() {
            console.warn('WebGL context restored')

            initWebgl()
            renderState.contextLost = false
            startRenderLoop()
        }

        canvas.addEventListener('webglcontextlost', onContextLost)
        canvas.addEventListener('webglcontextrestored', onContextRestored)

        return () => {
            canvas.removeEventListener('webglcontextlost', onContextLost)
            canvas.removeEventListener('webglcontextrestored', onContextRestored)
        }
    }, [renderState])

    // Effect: clean up doubleclick detection timer when the component is unmounted
    useEffect(() => {
        return () => {
            if (doubleClickDetection.timer !== undefined) {
                clearTimeout(doubleClickDetection.timer)
                doubleClickDetection.timer = undefined
            }
        }
    }, [doubleClickDetection])

    // Effect: pause rendering when the tab is not active to save resources
    useEffect(() => {
        function onVisibilityChange() {
            if (document.hidden) {
                stopRenderLoop()
            } else {
                startRenderLoop()
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    // Run once on mount
    useEffect(
        () => {
            addVariableIfAbsent('fps')

            api.allTiles.forEach(tile => renderState.visiblePoints.set(tile.point, { belowVisible: false, downRightVisible: false }))
        }, [renderState]
    )

    // Variables get captured by the closure of 'renderGame()' so pass the props in to it through renderState
    useEffect(
        () => {
            renderState.showAvailableConstruction = showAvailableConstruction
            renderState.selectedPoint = selectedPoint
            renderState.showHouseTitles = showHouseTitles
            renderState.fogOfWar = fogOfWar

            if (newRoad !== undefined) {
                renderState.newRoad = { newRoad: newRoad, possibleConnections: possibleRoadConnections ?? [] }
            } else {
                renderState.newRoad = undefined
            }
        }, [showAvailableConstruction, selectedPoint, newRoad, possibleRoadConnections, showHouseTitles, fogOfWar])

    // Effect: 
    useEffect(
        () => {

            // Callback when monitoring is started
            function monitoringStarted(): void {
                if (RenderLogConfig.terrain) {
                    console.log('Render (terrain): Received monitoring started callback. Calculating normals')
                }

                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)
                updateRoadDrawingBuffers()
            }

            // Callback when roads are updated
            function roadsUpdated(): void {
                if (RenderLogConfig.roads) {
                    console.log('Render (roads): Received updated road callback')
                }
                updateRoadDrawingBuffers()
            }

            // Callback when discovered points are updated
            function discoveredPointsUpdated(): void {

                // Update the calculated normals
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)
                if (RenderLogConfig.fogOfWar) {
                    console.log('Render (fog-of-war): New discovered points - calculated normals')
                }
                // Update the map rendering buffers
                renderState.mapRenderInformation = prepareToRenderFromTiles(api.allTiles, renderState.normals)

                if (renderState.drawGroundProgramInstance) {
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_coords', renderState.mapRenderInformation.coordinates)
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_normal', renderState.mapRenderInformation.normals)
                    setBuffer<DrawGroundAttributes>(renderState.drawGroundProgramInstance, 'a_texture_mapping', renderState.mapRenderInformation.textureMapping)
                } else {
                    console.error('Render (gl): The terrain drawing program instance is undefined')
                }

                // Update fog of war rendering
                updateFogOfWarRendering(renderState.visiblePoints, renderState.fogOfWarProgramInstance!)
            }

            const gameStateListener = {
                onMonitoringStarted: monitoringStarted
            }

            // Load the assets
            async function loadAssets(): Promise<void> {
                const fileLoading: Promise<void | HTMLImageElement>[] = []

                Object.values(workers).forEach(worker => fileLoading.push(worker.load()))
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
                    shipImageAtlas.load()
                ])

                if (imageAtlasTerrainAndRoads === undefined) {
                    const terrainAndRoadsPromise = loadImageAsync(TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE)

                    terrainAndRoadsPromise.then((image) => imageAtlasTerrainAndRoads = image)

                    allThingsToWaitFor.push(terrainAndRoadsPromise)
                }

                // Wait for the game data to be read from the backend and the websocket to be established
                await Promise.all(allThingsToWaitFor)
            }

            async function loadAssetsAndSetupGl(): Promise<void> {

                // Load assets
                await loadAssets()
                console.log('Render (assets): Download image atlases done. Connection to websocket backend established')

                // Wait for game data to be available
                await Promise.all([api.waitForConnection(), api.waitForGameDataAvailable()])
                console.log('Render (lifecycle): Game data is available')

                // Put together the render information from the discovered tiles
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)

                renderState.mapRenderInformation = prepareToRenderFromTiles(api.allTiles, renderState.normals)

                // Start tracking visible triangles
                if (renderState.visiblePoints.size === 0) {
                    api.allTiles.forEach(tile => renderState.visiblePoints.set(tile.point, { belowVisible: false, downRightVisible: false }))
                }

                // Set up WebGL context and programs
                initWebgl()

                // Start listeners
                api.addRoadsListener(roadsUpdated)
                api.addGameStateListener(gameStateListener)
                api.addDiscoveredPointsListener(discoveredPointsUpdated)
                console.log('Render (lifecycle): Started listeners')
            }

            let cancelled = false

            loadAssetsAndSetupGl().then(() => { if (!cancelled) { startRenderLoop() } })

            return () => {
                cancelled = true

                // Stop listeners
                api.removeGameStateListener(gameStateListener)
                api.removeRoadsListener(roadsUpdated)
                api.removeDiscoveredPointsListener(discoveredPointsUpdated)

                // Stop rendering loop
                stopRenderLoop()

                // Clean up webgl resources
                cleanupWebgl()
            }
        }, [
        renderState,
        updateRoadDrawingBuffers,
        initWebgl,
        startRenderLoop,
        stopRenderLoop,
        cleanupWebgl
    ])

    const gamePointToScreenPointWithHeightAdjustmentInternal = useCallback((gamePoint: Point) => {
        const height = api.getHeight(gamePoint)

        return gamePointToScreenPointWithHeightAdjustment(
            gamePoint,
            height,
            viewRef.current,
            heightAdjust,
            STANDARD_HEIGHT
        )
    }, [heightAdjust, viewRef])

    const screenPointToGamePointNoHeightAdjustmentInternal = useCallback((screenPoint: ScreenPoint) => {
        return screenPointToGamePointNoHeightAdjustment(screenPoint, viewRef.current)
    }, [viewRef])


    const screenPointToGamePointWithHeightAdjustmentInternal = useCallback((point: Point) => {
        return screenPointToGamePointWithHeightAdjustment(point, viewRef.current, heightAdjust)
    }, [viewRef, heightAdjust])

    const onClick = useCallback(async (event: React.MouseEvent) => {
        if (overlayCanvasRef?.current) {
            const rect = event.currentTarget.getBoundingClientRect()

            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            const gamePoint = screenPointToGamePointWithHeightAdjustmentInternal({ x, y })

            if (onPointClicked) {
                onPointClicked(gamePoint)
            }
        }
    }, [overlayCanvasRef, onPointClicked, screenPointToGamePointWithHeightAdjustmentInternal])

    const onDoubleClickInternal = useCallback((event: React.MouseEvent) => {
        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.error('Render (input): Received invalid double click event')

            return
        }

        if (overlayCanvasRef?.current) {
            const rect = event.currentTarget.getBoundingClientRect()

            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            const gamePoint = screenPointToGamePointWithHeightAdjustmentInternal({ x, y })

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
                tabIndex={-1}

                ref={overlayCanvasRef}
                onMouseMove={
                    (event: React.MouseEvent) => {

                        // Convert to game coordinates
                        if (overlayCanvasRef?.current) {
                            const rect = event.currentTarget.getBoundingClientRect()

                            const x = event.clientX - rect.left
                            const y = event.clientY - rect.top

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
    if (RenderLogConfig.roads) {
        console.log('Render (roads): Prepare to render roads')
    }
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
                console.error('Render (normals): Missing normals')

                if (RenderLogConfig.normals) {
                    console.log(normalLeft, normalRight)
                }

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
            allNormals.set(point, sumAndNormalizeVectors(vectors))
        } else {
            allNormals.set(point, { x: 0, y: 0, z: 1 })
        }
    }
}

function addTerrainRenderInformationForTileDownRight(
    point: Point,
    height: number,
    tileDownRight: TileDownRight,
    allTiles: PointMap<TerrainAtPoint>,
    allNormals: PointMap<Vector>,
    coordinates: number[],
    normals: number[],
    textureMappings: number[],
    transitionCoordinates: number[],
    transitionNormals: number[],
    transitionTextureMappings: number[]
): void {
    const pointUpRight = getPointUpRight(point)
    const pointRight = getPointRight(point)
    const pointDownRight = getPointDownRight(point)
    const pointDownLeft = getPointDownLeft(point)
    const pointRightDownRight = getPointDownRight(getPointRight(point))

    const terrainDownRight = tileDownRight.vegetation
    const terrainBelow = allTiles.get(point)
    const terrainUpRight = allTiles.get(pointUpRight)
    const terrainRight = allTiles.get(pointRight)

    if (VEGETATION_INTEGERS.indexOf(terrainDownRight) === -1) {
        console.log(`Render (terrain): UNKNOWN TERRAIN: ${terrainDownRight}`)
    }


    // Add the terrain tile to the buffers
    Array.prototype.push.apply(coordinates, [
        point.x, point.y, height,
        pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
        pointRight.x, pointRight.y, tileDownRight.heightRight
    ])

    const normalLeft = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR

    Array.prototype.push.apply(normals, [
        normalLeft.x, normalLeft.y, normalLeft.z,
        normalDownRight.x, normalDownRight.y, normalDownRight.z,
        normalRight.x, normalRight.y, normalRight.z
    ])

    Array.prototype.push.apply(textureMappings, VEGETATION_TO_TEXTURE_MAPPING.get(terrainDownRight)?.downRight ?? [0, 1, 0.5, 0, 1, 1])

    const overlap = OVERLAPS.get(terrainDownRight)
    const transitionTextureMapping = TRANSITION_TEXTURE_MAPPINGS.get(terrainDownRight)


    // Add the transition triangles on all three sides

    // Triangle below on the left
    if (overlap && terrainBelow && overlap.has(terrainBelow.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightLeft + tileDownRight.heightDown) / 2
        const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }

        Array.prototype.push.apply(transitionCoordinates, [
            pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
            point.x, point.y, tileDownRight.heightLeft,
            base.x + (pointDownLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointDownLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (allTiles.get(pointDownLeft)?.height ?? 0 - baseHeight) * OVERLAP_FACTOR
        ])

        const normalPoint = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalPoint, normalDownRight, normalDownLeft])

        Array.prototype.push.apply(transitionNormals, [
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            normalPoint.x, normalPoint.y, normalPoint.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Triangle above
    if (overlap && terrainUpRight && overlap.has(terrainUpRight.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightLeft + tileDownRight.heightRight) / 2
        const heightUp = allTiles.get(pointUpRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, tileDownRight.heightLeft,
            pointRight.x, pointRight.y, tileDownRight.heightRight,
            point.x + 1, point.y + OVERLAP_FACTOR, baseHeight + (heightUp - baseHeight) * OVERLAP_FACTOR
        ])

        const normalPoint = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalUpRight = allNormals.get(pointUpRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalPoint, normalRight, normalUpRight])

        Array.prototype.push.apply(transitionNormals, [
            normalPoint.x, normalPoint.y, normalPoint.z,
            normalRight.x, normalRight.y, normalRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Triangle below on the right
    if (overlap && terrainRight && overlap.has(terrainRight.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightRight + tileDownRight.heightDown) / 2
        const base = { x: (pointRight.x + pointDownRight.x) / 2, y: (pointRight.y + pointDownRight.y) / 2 }
        const heightRightDownRight = allTiles.get(pointRightDownRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            pointRight.x, pointRight.y, tileDownRight.heightRight,
            pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
            base.x + (pointRightDownRight.x - base.x) * 0.4, base.y + (pointRightDownRight.y - base.y) * 0.4, baseHeight + (heightRightDownRight - baseHeight) * 0.4
        ])

        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRightDownRight = allNormals.get(pointRightDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalRight, normalDownRight, normalRightDownRight])

        Array.prototype.push.apply(transitionNormals, [
            normalRight.x, normalRight.y, normalRight.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }
}

function addTerrainRenderInformationForTileBelow(
    point: Point,
    height: number,
    tileBelow: TileBelow,
    allTiles: PointMap<TerrainAtPoint>,
    allNormals: PointMap<Vector>,
    coordinates: number[],
    normals: number[],
    textureMappings: number[],
    transitionCoordinates: number[],
    transitionNormals: number[],
    transitionTextureMappings: number[]
): void {
    const pointRight = getPointRight(point)
    const pointLeft = getPointLeft(point)
    const pointDownLeft = getPointDownLeft(point)
    const pointDownRight = getPointDownRight(point)
    const pointDown = getPointDown(point)

    const terrainBelow = tileBelow.vegetation

    if (VEGETATION_INTEGERS.indexOf(terrainBelow) === -1) {
        console.error(`Render (terrain): UNKNOWN TERRAIN: ${terrainBelow}`)
    }

    // Add each terrain tile to the buffers (coordinates, normals, texture mapping)
    Array.prototype.push.apply(coordinates, [
        point.x, point.y, height,
        pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
        pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight
    ])

    const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR

    Array.prototype.push.apply(normals, [
        normal0.x, normal0.y, normal0.z,
        normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
        normalDownRight.x, normalDownRight.y, normalDownRight.z
    ])

    Array.prototype.push.apply(textureMappings,
        VEGETATION_TO_TEXTURE_MAPPING.get(terrainBelow)?.below ?? [0, 0, 0.5, 1, 1, 0] // TODO: is this default the wrong order?
    )

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

        Array.prototype.push.apply(transitionCoordinates, [
            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
            pointDown.x, pointDownLeft.y - 0.4, baseHeight + (downHeight - baseHeight) * 0.4
        ])

        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDown = allNormals.get(pointDown) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalDownLeft, normalDownRight, normalDown])

        Array.prototype.push.apply(transitionNormals, [
            normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Transition up-right
    if (overlap && terrain && overlap.has(terrain.downRight) && transitionTextureMapping) {
        const baseHeight = (height + tileBelow.heightDownRight) / 2
        const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }
        const heightRight = allTiles.get(pointRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, height,
            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
            base.x + (pointRight.x - base.x) * OVERLAP_FACTOR, base.y + (pointRight.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightRight - baseHeight) * OVERLAP_FACTOR
        ])

        const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normal0, normalDownRight, normalRight])

        Array.prototype.push.apply(transitionNormals, [
            normal0.x, normal0.y, normal0.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Transition up-left
    if (overlap && terrainLeft && overlap.has(terrainLeft?.downRight) && transitionTextureMapping) {
        const baseHeight = (tileBelow.heightDownLeft + height) / 2
        const base = { x: (point.x + pointDownLeft.x) / 2, y: (point.y + pointDownLeft.y) / 2 }
        const heightLeft = terrainLeft.height

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, height,
            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
            base.x + (pointLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightLeft - baseHeight) * OVERLAP_FACTOR
        ])

        const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalLeft = allNormals.get(pointLeft) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normal0, normalDownLeft, normalLeft])

        Array.prototype.push.apply(transitionNormals, [
            normal0.x, normal0.y, normal0.z,
            normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }
}

function prepareToRenderFromTiles(allTiles: PointMap<TerrainAtPoint>, allNormals: PointMap<Vector>): MapRenderInformation {
    const coordinates: number[] = []
    const normals: number[] = []
    const textureMappings: number[] = []

    const transitionCoordinates: number[] = []
    const transitionNormals: number[] = []
    const transitionTextureMappings: number[] = []

    // For all tiles, add the corresponding terrain tile to the buffers (coordinates, normals, texture mapping)
    allTiles.entries().forEach(([point, { height, below, downRight }]) => {
        const pointRight = getPointRight(point)
        const pointDownLeft = getPointDownLeft(point)
        const pointDownRight = getPointDownRight(point)


        addTerrainRenderInformationForTileBelow(
            point,
            height,
            {
                pointAbove: point,
                heightAbove: height,
                heightDownLeft: allTiles.get(pointDownLeft)?.height ?? 0,
                heightDownRight: allTiles.get(pointDownRight)?.height ?? 0,
                vegetation: below
            },
            allTiles,
            allNormals,
            coordinates,
            normals,
            textureMappings,
            transitionCoordinates,
            transitionNormals,
            transitionTextureMappings
        )

        addTerrainRenderInformationForTileDownRight(
            point,
            height,
            {
                pointLeft: point,
                heightLeft: height,
                heightDown: allTiles.get(pointDownRight)?.height ?? 0,
                heightRight: allTiles.get(pointRight)?.height ?? 0,
                vegetation: downRight
            },
            allTiles,
            allNormals,
            coordinates,
            normals,
            textureMappings,
            transitionCoordinates,
            transitionNormals,
            transitionTextureMappings
        )
    })

    return {
        coordinates: coordinates.concat(transitionCoordinates),
        normals: normals.concat(transitionNormals),
        textureMapping: textureMappings.concat(transitionTextureMappings)
    }
}

function updateFogOfWarRendering(allPointsVisibilityTracking: PointMap<TrianglesAtPoint>, fogOfWarProgramInstance: ProgramInstance): void {
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

    const fogOfWarRenderInformation = { coordinates: fogOfWarCoordinates, intensities: fogOfWarIntensities }


    setBuffer<FogOfWarAttributes>(fogOfWarProgramInstance, 'a_coordinates', fogOfWarRenderInformation.coordinates)
    setBuffer<FogOfWarAttributes>(fogOfWarProgramInstance, 'a_intensity', fogOfWarRenderInformation.intensities)
}

export { GameCanvas }

