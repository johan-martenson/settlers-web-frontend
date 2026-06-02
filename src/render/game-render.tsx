import React, { useCallback, useEffect, useRef } from 'react'
import { Point } from '../api/types'
import { Duration } from '../utils/stats/duration'
import './game-render.css'
import { api, TileBelow, TileDownRight } from '../api/ws-api'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from '../utils/stats/stats'
import { gamePointToScreenPointWithHeightAdjustment, getHouseSize, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, screenPointToGamePointNoHeightAdjustment, screenPointToGamePointWithHeightAdjustment, sumAndNormalizeVectors, Vector } from '../utils/utils'
import { PointMap } from '../utils/util_types_ng'
import { borderImageAtlasHandler, cargoImageAtlasHandler, cropsImageAtlasHandler, decorationsImageAtlasHandler, fireImageAtlasHandler, houses, loadImageAsync, roadBuildingImageAtlasHandler, shipImageAtlas, signImageAtlasHandler, stoneImageAtlasHandler, treeImageAtlasHandler, uiElementsImageAtlasHandler } from '../assets/image_atlas_handlers'
import { NewRoad } from '../screens/play/play'
import { DEFAULT_SCALE, STANDARD_HEIGHT, UNIT_SQUARE } from './constants'
import { textures } from '../render/textures'
import { ProgramInstance, destroyProgram, draw, initProgram, setBuffer } from './webgl-utils'
import { useNonTriggeringState } from '../utils/hooks/non_triggering'
import { animals, donkeyAnimation, fatCarrierNoCargo, fatCarrierWithCargo, fireAnimations, flagAnimations, thinCarrierNoCargo, thinCarrierWithCargo, treeAnimations, WorkerAnimation, workers } from '../assets/animations'
import { Dimension, DrawingInformation } from '../assets/types'
import { buildingPretty } from '../utils/pretty_strings'
import { MapRenderInformation, TrianglesAtPoint } from './types'
import { setDrawImageRenderingBuffers, setDrawShadowRenderingBuffers, setFogOfWarRenderingBuffers, setMapRenderingBuffers, setRoadRenderingBuffers } from './manage-buffers'
import { drawGroundProgramDescriptor, DrawGroundUniforms, DrawImageAttributes, drawImageProgramDescriptor, DrawImageUniforms, DrawShadowAttributes, drawShadowProgramDescriptor, DrawShadowUniforms, fogOfWarProgramDescriptor, FogOfWarUniforms } from './webgl-program-definitions'


// Types
export type ScreenPoint = {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD' | 'BUILDING_ROAD_PRESSED'

type ToDraw = {
    source: DrawingInformation | undefined
    gamePoint: Point
    height?: number
}

export type View = {
    screenSize: Dimension
    scale: number
    translate: Point
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

type RenderState = {
    previousTimestamp?: number
    previous: number
    overshoot: number

    animationIndex: number
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

    // Render loop control
    renderLoopHandle: ReturnType<typeof requestAnimationFrame> | undefined
    renderLoopIsRunning?: boolean
    contextLost: boolean

    // Render loop caching
    toDrawNormal: ToDraw[]
    shadowsToDraw: ToDraw[]
    toDrawHover: ToDraw[]
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
const ANIMATION_PERIOD = 100
const MOUSE_STYLES = new Map<CursorState, string>()

MOUSE_STYLES.set('NOTHING', 'default')
MOUSE_STYLES.set('DRAGGING', 'url(assets/cursors/cursor-move.png), auto')
MOUSE_STYLES.set('BUILDING_ROAD', 'url(assets/cursors/cursor-build-road.png), auto')
MOUSE_STYLES.set('BUILDING_ROAD_PRESSED', 'url(assets/cursors/cursor-build-road-pressed.png), auto')

const TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE = 'assets/nature/terrain/greenland/greenland-texture.png'

type InterpolatedPosition = {
    gamePoint: Point
    height: number
}

type RenderPosition = {
    gamePoint: Point
    height?: number
}

type Walker = Point & {
    betweenPoints: boolean
    percentageTraveled: number
    previous?: Point
    next?: Point
}


// Functions
function interpolateGamePosition(previous: Point, next: Point, percentageTraveled: number): InterpolatedPosition {
    const factor = percentageTraveled / 100

    return {
        gamePoint: {
            x: previous.x + (next.x - previous.x) * factor,
            y: previous.y + (next.y - previous.y) * factor
        },
        height: interpolateHeight(previous, next, factor)
    }
}

function getRenderPosition(walker: Walker): RenderPosition {
    if (walker.betweenPoints && walker.previous !== undefined && walker.next) {
        const interpolated = interpolateGamePosition(walker.previous, walker.next, walker.percentageTraveled)

        return {
            gamePoint: interpolated.gamePoint,
            height: interpolated.height
        }
    }

    return {
        gamePoint: walker
    }
}

function makeInitRenderState(): RenderState {
    return {
        previous: performance.now(),
        overshoot: 0,
        newRoadCurrentLength: 0,
        animationIndex: 0,
        normals: new PointMap<Vector>(),
        visiblePoints: new PointMap<TrianglesAtPoint>(),
        showHouseTitles: false,
        showAvailableConstruction: false,
        renderLoopHandle: undefined,
        toDrawNormal: [],
        shadowsToDraw: [],
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
    const onPointClickedRef = useRef(onPointClicked)
    const onDoubleClickRef = useRef(onDoubleClick)

    // Constants
    const lightVector = [1, 1, -1]

    // State that doesn't trigger re-renders
    const renderState = useNonTriggeringState<RenderState>(makeInitRenderState())

    // Functions
    const drawImage = useCallback((
        toDraw: ToDraw,
        width: number,
        height: number
    ) => {
        if (renderState.drawImageProgramInstance === undefined ||
            toDraw.gamePoint === undefined ||
            toDraw.source?.image === undefined) {
            return
        }

        const textureSlot = textures.activateTextureForRendering(renderState.gl!, toDraw.source.image)

        if (textureSlot === undefined) {
            console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

            return
        }

        draw<DrawImageUniforms>(
            renderState.drawImageProgramInstance,
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
    }, [renderState, viewRef, heightAdjust])

    const drawShadow = useCallback((toDraw: ToDraw, width: number, height: number) => {
        if (renderState.drawShadowProgramInstance === undefined ||
            toDraw.gamePoint === undefined ||
            toDraw.source?.image === undefined) {
            return
        }

        const textureSlot = textures.activateTextureForRendering(
            renderState.gl!,
            toDraw.source.image
        )

        if (textureSlot === undefined) {
            console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

            return
        }

        draw<DrawShadowUniforms>(
            renderState.drawShadowProgramInstance,
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
    }, [renderState, viewRef, heightAdjust])

    const pushNormalImage = useCallback((drawInfo: DrawingInformation | undefined, gamePoint: Point, height?: number) => {
        if (!drawInfo) {
            return
        }

        renderState.toDrawNormal.push({
            source: drawInfo,
            gamePoint,
            height
        })
    }, [renderState])

    const pushNormalImageWithShadow = useCallback((
        drawInfo: DrawingInformation[] | undefined,
        gamePoint: Point,
        height?: number
    ) => {
        if (!drawInfo) {
            return
        }

        renderState.toDrawNormal.push({
            source: drawInfo[0],
            gamePoint,
            height
        })

        renderState.shadowsToDraw.push({
            source: drawInfo[1],
            gamePoint,
            height
        })
    }, [renderState])

    const pushHoverImage = useCallback((drawInfo: DrawingInformation | undefined, gamePoint: Point) => {
        if (!drawInfo) {
            return
        }

        renderState.toDrawHover.push({
            source: drawInfo,
            gamePoint
        })
    }, [renderState])

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

        overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

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

            if (textureSlot !== undefined && renderState.drawGroundProgramInstance) {
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
            pushNormalImageWithShadow(image, decoration)
        })

        // Draw decoration shadows
        for (const toDraw of renderState.shadowsToDraw) {
            drawShadow(toDraw, width, height)
        }

        // Draw decorations objects
        for (const toDraw of renderState.toDrawNormal) {
            drawImage(toDraw, width, height)
        }

        // Clear the cached render lists
        renderState.shadowsToDraw.length = 0
        renderState.toDrawNormal.length = 0

        duration.after('drawing decorations')


        // Draw the road layer
        if (imageAtlasTerrainAndRoads) {
            const textureSlot = textures.activateTextureForRendering(renderState.gl, imageAtlasTerrainAndRoads)

            if (textureSlot !== undefined && renderState.drawRoadsProgramInstance) {
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
                pushNormalImage(borderPointInfo, borderPoint)
            })
        })

        duration.after('collect borders')


        // Collect the houses
        for (const house of api.houses.values()) {
            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            if (house.state === 'PLANNED') {
                const plannedDrawInformation = houses.getDrawingInformationForHouseJustStarted(house)
                pushNormalImage(plannedDrawInformation, house)
            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)
                const fireDrawInformation = fireAnimations.getAnimationFrame(size, renderState.animationIndex)

                pushNormalImageWithShadow(fireDrawInformation, house)
            } else if (house.state === 'DESTROYED') {
                const size = getHouseSize(house)
                const fireDrawInformation = fireImageAtlasHandler.getBurntDownDrawingInformation(size)

                pushNormalImage(fireDrawInformation, house)
            } else if (house.state === 'UNFINISHED' && house.constructionProgress !== undefined) {
                const houseUnderConstruction = houses.getDrawingInformationForHouseUnderConstruction(house)
                const houseDrawInformation = houses.getPartialHouseReady(house)

                pushNormalImageWithShadow(houseUnderConstruction, house)
                pushNormalImageWithShadow(houseDrawInformation, house)
            } else {
                if ((house.type === 'Mill' && house.isWorking) ||
                    (house.type === 'Mint' && house.isWorking && house.nation === 'ROMANS') ||
                    (house.type === 'IronSmelter' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Armory' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Harbor' && (house.nation === 'ROMANS' || house.nation === 'JAPANESE') && house.isWorking)) {
                    const houseDrawInformation = houses.getDrawingInformationForWorkingHouse(house, renderState.animationIndex)
                    pushNormalImageWithShadow(houseDrawInformation, house)
                } else {
                    const houseDrawInformation = houses.getDrawingInformationForHouseReady(house)
                    pushNormalImageWithShadow(houseDrawInformation, house)
                }

                if (house.door === 'OPEN') {
                    const door = houses.getDrawingInformationForOpenDoor(house)
                    pushNormalImage(door, house)
                }

                if (house.isWorking) {
                    const smokeDrawInformation = fireAnimations.getSmokeFrameForHouse(house, renderState.animationIndex)
                    pushNormalImage(smokeDrawInformation, house)
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
                pushNormalImageWithShadow(treeDrawInfo, tree)
            } else {
                treeDrawInfo = treeImageAtlasHandler.getImageForGrowingTree(tree)
                pushNormalImageWithShadow(treeDrawInfo, tree)
            }

            treeIndex = treeIndex + 1
        }

        api.fallingTrees.forEach(tree => {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                return
            }

            const treeDrawInfo = treeAnimations.getFallingTree(tree)
            pushNormalImageWithShadow(treeDrawInfo, tree)
        })

        duration.after('collect trees')


        // Collect the crops
        for (const crop of api.crops.values()) {
            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            const cropDrawInfo = cropsImageAtlasHandler.getDrawingInformationFor(crop)
            pushNormalImageWithShadow(cropDrawInfo, crop)
        }

        duration.after('collect crops')


        // Collect the signs
        for (const sign of api.signs.values()) {
            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            const signDrawInfo = signImageAtlasHandler.getDrawingInformation(sign)
            pushNormalImageWithShadow(signDrawInfo, sign)
        }

        duration.after('collect signs')


        // Collect the stones
        for (const stone of api.stones.values()) {
            if (stone.x + 1 < minXInGame || stone.x - 1 > maxXInGame || stone.y + 1 < minYInGame || stone.y - 1 > maxYInGame) {
                continue
            }

            const stoneDrawInfo = stoneImageAtlasHandler.getDrawingInformationFor(stone)
            pushNormalImageWithShadow(stoneDrawInfo, stone)
        }

        duration.after('collect stones')

        // Collect wild animals
        for (const animal of api.wildAnimals.values()) {

            // Filter animals outside the screen
            if (animal.previous && animal.next) {
                if (animal.previous.x < minXInGame || animal.previous.x > maxXInGame || animal.previous.y < minYInGame || animal.previous.y > maxYInGame) {
                    continue
                }

                if (animal.next.x < minXInGame || animal.next.x > maxXInGame || animal.next.y < minYInGame || animal.next.y > maxYInGame) {
                    continue
                }
            } else {
                if (animal.x < minXInGame || animal.x > maxXInGame || animal.y < minYInGame || animal.y > maxYInGame) {
                    continue
                }
            }

            const renderPosition = getRenderPosition(animal)
            const animationImage = animals.get(animal.type)?.getAnimationFrame(animal.direction, renderState.animationIndex)
            pushNormalImageWithShadow(animationImage, renderPosition.gamePoint, renderPosition.height)

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
            } else {
                if (ship.x < minXInGame || ship.x > maxXInGame || ship.y < minYInGame || ship.y > maxYInGame) {
                    continue
                }
            }

            const renderPosition = getRenderPosition(ship)
            const shipImage = ship.constructionState === 'READY'
                ? shipImageAtlas.getDrawingInformationForShip(ship)
                : shipImageAtlas.getDrawingInformationForShipUnderConstruction(ship)

            pushNormalImageWithShadow(shipImage, renderPosition.gamePoint, renderPosition.height)
        }


        // Collect workers
        for (const worker of api.workers.values()) {

            // Avoid drawing workers outside of the screen
            if (worker.betweenPoints) {
                const previous = worker.previous
                const next = worker.next

                if (!previous || !next) {
                    continue
                }

                if (previous.x < minXInGame - 1 || previous.x > maxXInGame || previous.y < minYInGame - 1 || previous.y > maxYInGame + 1) {
                    continue
                }

                if (next.x < minXInGame || next.x > maxXInGame || next.y < minYInGame || next.y > maxYInGame) {
                    continue
                }
            } else {
                if (worker.x < minXInGame - 1 || worker.x > maxXInGame || worker.y < minYInGame - 1 || worker.y > maxYInGame + 1) {
                    continue
                }
            }

            const renderPosition = getRenderPosition(worker)

            // Draw donkeys
            if (worker.type === 'Donkey') {
                const donkeyImage = donkeyAnimation.getAnimationFrame(worker.direction, worker.betweenPoints ? renderState.animationIndex : 0)
                pushNormalImageWithShadow(donkeyImage, renderPosition.gamePoint, renderPosition.height)

                if (worker.cargo) {
                    const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)
                    pushNormalImage(cargoImage, renderPosition.gamePoint, renderPosition.height)
                }

                // Draw other workers
            } else {

                // Find the correct animation provider for the worker
                let animationProvider: WorkerAnimation | undefined

                if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                    animationProvider = worker.bodyType === 'FAT' ? fatCarrierNoCargo : thinCarrierNoCargo
                } else {
                    animationProvider = workers[worker.type]
                }

                if (!animationProvider) {
                    console.error(`Render (workers): No animation provider found for worker type ${worker.type}`)

                    continue
                }

                let didDrawAnimation = false

                // Draw animation
                if (worker.action && worker.actionAnimationIndex !== undefined) {
                    const animationImage = animationProvider.getActionAnimation(worker)

                    if (animationImage) {
                        didDrawAnimation = true

                        pushNormalImage(animationImage, renderPosition.gamePoint, renderPosition.height)
                    }
                }

                // Draw in case no animation was drawn
                if (!didDrawAnimation) {
                    if (worker.cargo) {
                        const image = animationProvider.getAnimationFrame(worker, worker.betweenPoints ? renderState.animationIndex : 0, worker.percentageTraveled)
                        pushNormalImageWithShadow(image, renderPosition.gamePoint, renderPosition.height)
                    } else {
                        const image = animationProvider.getAnimationFrame(worker, worker.betweenPoints ? renderState.animationIndex : 0, worker.percentageTraveled)
                        pushNormalImageWithShadow(image, renderPosition.gamePoint, renderPosition.height)
                    }
                }
            }

            // Draw the cargo if the worker is carrying something
            if (worker.cargo) {
                let animationProvider: WorkerAnimation | undefined

                // Find the correct animation provider for the worker
                if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                    animationProvider = worker.bodyType === 'FAT' ? fatCarrierWithCargo : thinCarrierWithCargo
                } else {
                    animationProvider = workers[worker.type]
                }

                const cargoImage = animationProvider?.getDrawingInformationForCargo(worker, renderState.animationIndex, worker.percentageTraveled / 10)
                pushNormalImage(cargoImage, renderPosition.gamePoint, renderPosition.height)
            }
        }

        duration.after('collect workers')


        // Collect flags
        let flagCount = 0
        for (const flag of api.flags.values()) {
            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const flagDrawInfo = flagAnimations.getAnimationFrame(flag, renderState.animationIndex, flagCount)
            pushNormalImageWithShadow(flagDrawInfo, flag)

            if (flag.stackedCargo) {
                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {
                    const cargo = flag.stackedCargo[i]
                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                    pushNormalImage(cargoDrawInfo, { x: flag.x - 0.3, y: flag.y - 0.1 * i + 0.3 }, api.getHeight(flag))
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {
                        const cargo = flag.stackedCargo[i]
                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                        pushNormalImage(cargoDrawInfo, { x: flag.x + 0.08, y: flag.y - 0.1 * i + 0.2 }, api.getHeight(flag))
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {
                        const cargo = flag.stackedCargo[i]
                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                        pushNormalImage(cargoDrawInfo, { x: flag.x + 17 / 50, y: flag.y - 0.1 * (i - 4) + 0.2 }, api.getHeight(flag))
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
                    pushNormalImage(largeHouseAvailableInfo, gamePoint)
                } else if (available.includes('MEDIUM')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()
                    pushNormalImage(mediumHouseAvailableInfo, gamePoint)
                } else if (available.includes('SMALL')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()
                    pushNormalImage(mediumHouseAvailableInfo, gamePoint)
                } else if (available.includes('MINE')) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()
                    pushNormalImage(mineAvailableInfo, gamePoint)
                } else if (available.includes('FLAG')) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()
                    pushNormalImage(flagAvailableInfo, gamePoint)
                }
            }
        }

        duration.after('Collect available construction')


        // Draw the Shadow layer and the Normal layer
        if (renderState.drawShadowProgramInstance) {
            for (const shadow of renderState.shadowsToDraw) {
                drawShadow(shadow, width, height)
            }
        }

        // Sort the toDrawList so it first draws things further away
        renderState.toDrawNormal.sort((draw1, draw2) => {
            return draw2.gamePoint.y - draw1.gamePoint.y
        })


        // Draw normal objects
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.toDrawNormal) {
                drawImage(toDraw, width, height)
            }
        }

        // Handle the hover layer

        // Draw possible road connections
        if (renderState.newRoad?.possibleConnections) {
            if (renderState?.newRoad !== undefined) {
                const center = renderState.newRoad.newRoad[renderState.newRoad.newRoad.length - 1]
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                pushHoverImage(startPointInfo, center)

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

                            pushHoverImage(startPointInfo, point)
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
                pushHoverImage(selectedPointDrawInfo, renderState.selectedPoint)
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
                        pushHoverImage(largeHouseAvailableInfo, renderState.hoverPoint)
                    } else if (availableConstructionAtHoverPoint.includes('MEDIUM')) {
                        const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()
                        pushHoverImage(mediumHouseAvailableInfo, renderState.hoverPoint)
                    } else if (availableConstructionAtHoverPoint.includes('SMALL')) {
                        const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()
                        pushHoverImage(smallHouseAvailableInfo, renderState.hoverPoint)
                    } else if (availableConstructionAtHoverPoint.includes('MINE')) {
                        const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()
                        pushHoverImage(mineAvailableInfo, renderState.hoverPoint)
                    } else if (availableConstructionAtHoverPoint.includes('FLAG')) {
                        const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()
                        pushHoverImage(flagAvailableInfo, renderState.hoverPoint)
                    }
                } else {
                    const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()
                    pushHoverImage(hoverPointDrawInfo, renderState.hoverPoint)
                }
            }
        }

        // Draw the overlay layer. Assume for now that they don't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.toDrawHover) {
                drawImage(toDraw, width, height)
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
                const houseDrawInformation = houses.getDrawingInformationForHouseReady(house)

                let heightOffset = 0

                if (houseDrawInformation) {
                    heightOffset = houseDrawInformation[0].offsetY * viewRef.current.scale / DEFAULT_SCALE
                }

                let houseTitle = buildingPretty(house.type)

                if (house.state === 'UNFINISHED') {
                    houseTitle = `(${houseTitle})`
                } else if (house.state === 'UNOCCUPIED') {
                    houseTitle = `${houseTitle} (unoccupied)`
                } else if (house.productivity !== undefined && house.state === 'OCCUPIED') {
                    houseTitle = `${houseTitle} (${house.productivity}%)`
                }

                const widthOffset = overlayCtx.measureText(houseTitle).width / 2
                overlayCtx.strokeText(houseTitle, screenPoint.x - widthOffset, screenPoint.y - heightOffset - 5)
                overlayCtx.fillText(houseTitle, screenPoint.x - widthOffset, screenPoint.y - heightOffset - 5)
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

    const initWebgl = useCallback(() => {
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

        // Set up WebGL programs
        renderState.drawGroundProgramInstance = initProgram(drawGroundProgramDescriptor, gl)
        renderState.drawRoadsProgramInstance = initProgram(drawGroundProgramDescriptor, gl)
        renderState.drawImageProgramInstance = initProgram(drawImageProgramDescriptor, gl)
        renderState.drawShadowProgramInstance = initProgram(drawShadowProgramDescriptor, gl)
        renderState.fogOfWarProgramInstance = initProgram(fogOfWarProgramDescriptor, gl)

        // Setup the program to render the ground
        setMapRenderingBuffers(renderState.drawGroundProgramInstance, api.allTiles, renderState.normals)

        // Set up the programs to render images and shadows - these will be updated with the correct coordinates in the render loop before drawing

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

        // Set up buffers
        setRoadRenderingBuffers(
            renderState.drawRoadsProgramInstance,
            Array.from(api.roads.values()),
            Array.from(api.flags.values()),
            renderState.normals
        )

        setFogOfWarRenderingBuffers(
            renderState.visiblePoints,
            renderState.fogOfWarProgramInstance,
            api.discoveredPoints,
            api.discoveredBelowTiles,
            api.discoveredDownRightTiles
        )

        setDrawImageRenderingBuffers(renderState.drawImageProgramInstance)
        setDrawShadowRenderingBuffers(renderState.drawShadowProgramInstance)
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
    // Effect: keep callback references in sync
    useEffect(() => {
        onPointClickedRef.current = onPointClicked
        onDoubleClickRef.current = onDoubleClick
    }, [onPointClicked, onDoubleClick])

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

            if (newRoad !== undefined && newRoad.length > 0) {
                renderState.newRoad = { newRoad: newRoad, possibleConnections: possibleRoadConnections ?? [] }
            } else {
                renderState.newRoad = undefined
            }
        }, [showAvailableConstruction, selectedPoint, newRoad?.length, possibleRoadConnections?.length, showHouseTitles, fogOfWar])

    // Effect: 
    useEffect(
        () => {

            // Callback when monitoring is started
            function monitoringStarted(): void {
                if (RenderLogConfig.terrain) {
                    console.log('Render (terrain): Received monitoring started callback. Calculating normals')
                }

                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)

                if (!renderState.drawRoadsProgramInstance) {
                    console.error('Render (roads): The road drawing program instance is undefined')

                    return
                }

                setRoadRenderingBuffers(
                    renderState.drawRoadsProgramInstance,
                    Array.from(api.roads.values()),
                    Array.from(api.flags.values()),
                    renderState.normals
                )
            }

            // Callback when roads are updated
            function roadsUpdated(): void {
                if (RenderLogConfig.roads) {
                    console.log('Render (roads): Received updated road callback')
                }

                if (!renderState.drawRoadsProgramInstance) {
                    console.error('Render (roads): The road drawing program instance is undefined')

                    return
                }

                setRoadRenderingBuffers(
                    renderState.drawRoadsProgramInstance,
                    Array.from(api.roads.values()),
                    Array.from(api.flags.values()),
                    renderState.normals
                )
            }

            // Callback when discovered points are updated
            function discoveredPointsUpdated(): void {

                // Update the calculated normals
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)
                if (RenderLogConfig.fogOfWar) {
                    console.log('Render (fog-of-war): New discovered points - calculated normals')
                }

                // Update the map rendering and fog of war buffers
                if (!renderState.drawGroundProgramInstance) {
                    console.error('Render (gl): The terrain drawing program instance is undefined')

                    return
                }

                if (!renderState.fogOfWarProgramInstance) {
                    console.error('Render (fog-of-war): The fog of war program instance is undefined')

                    return
                }

                setMapRenderingBuffers(renderState.drawGroundProgramInstance, api.allTiles, renderState.normals)
                setFogOfWarRenderingBuffers(renderState.visiblePoints, renderState.fogOfWarProgramInstance, api.discoveredPoints, api.discoveredBelowTiles, api.discoveredDownRightTiles)
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

                if (RenderLogConfig.assets) {
                    console.log('Render (assets): Download image atlases done. Connection to websocket backend established')
                }

                // Wait for game data to be available
                await Promise.all([api.waitForConnection(), api.waitForGameDataAvailable()])

                if (RenderLogConfig.lifecycle) {
                    console.log('Render (lifecycle): Game data is available')
                }

                // Put together the render information from the discovered tiles
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.normals)

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

                if (RenderLogConfig.lifecycle) {
                    console.log('Render (lifecycle): Started listeners')
                }
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

    const onClickInternal = useCallback((event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect()

        const gamePoint =
            screenPointToGamePointWithHeightAdjustmentInternal({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            })

        onPointClickedRef.current?.(gamePoint)

        event.stopPropagation()
    }, [screenPointToGamePointWithHeightAdjustmentInternal])

    const onDoubleClickInternal = useCallback((event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect()

        const gamePoint =
            screenPointToGamePointWithHeightAdjustmentInternal({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            })

        onDoubleClickRef.current?.(gamePoint)

        event.stopPropagation()
    }, [screenPointToGamePointWithHeightAdjustmentInternal])

    return (
        <>
            <canvas
                className='game-canvas'
                onKeyDown={onKeyDown}
                onClick={onClickInternal}
                onDoubleClick={onDoubleClickInternal}
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

function interpolateHeight(previous: Point, next: Point, progress: number): number {
    const previousHeight = api.getHeight(previous)
    const nextHeight = api.getHeight(next)

    return previousHeight + (nextHeight - previousHeight) * progress
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

export { GameCanvas }

