import React, { useCallback, useEffect, useRef } from 'react'
import { AvailableConstruction, CropInformation, Decoration, FallingTreeInformation, FlagInformation, HouseInformation, PlayerId, Point, ShipInformation, SignInformation, StoneInformation, TerrainAtPoint, TreeInformation, WildAnimalInformation, WorkerInformation } from '../api/types'
import { Duration } from '../utils/stats/duration'
import './game-render.css'
import { api, MonitoredBorderForPlayer } from '../api/ws-api'
import { addVariableIfAbsent, getAverageValueForVariable, getLatestValueForVariable, isLatestValueHighestForVariable, printVariables } from '../utils/stats/stats'
import { gamePointToScreenPointWithHeightAdjustment, getHouseSize, screenPointToGamePointNoHeightAdjustment, screenPointToGamePointWithHeightAdjustment } from '../utils/utils'
import { borderImageAtlasHandler, cargoImageAtlasHandler, cropsImageAtlasHandler, decorationsImageAtlasHandler, fireImageAtlasHandler, HOUSE_HANDLER, loadImageAsync, roadBuildingImageAtlasHandler, shipImageAtlas, signImageAtlasHandler, stoneImageAtlasHandler, treeImageAtlasHandler, uiElementsImageAtlasHandler } from '../assets/image_atlas_handlers'
import { DEFAULT_SCALE, STANDARD_HEIGHT } from './constants'
import { textures } from '../render/textures'
import { destroyProgram, draw, initProgram } from './webgl-utils'
import { ANIMAL_ANIMATIONS, donkeyAnimation, fatCarrierNoCargo, fatCarrierWithCargo, fireAnimations, FLAG_ANIMATIONS, thinCarrierNoCargo, thinCarrierWithCargo, TREE_ANIMATIONS, WORKER_ANIMATIONS, WorkerAnimation } from '../assets/animations'
import { buildingPretty } from '../utils/pretty_strings'
import { RenderState, ToDraw, View, WebGlState } from './types'
import { setDrawImageRenderingBuffers, setDrawShadowRenderingBuffers, setFogOfWarRenderingBuffers, setMapRenderingBuffers, setRoadRenderingBuffers } from './manage-buffers'
import { drawGroundProgramDescriptor, DrawGroundUniforms, drawImageProgramDescriptor, DrawImageUniforms, drawShadowProgramDescriptor, DrawShadowUniforms, fogOfWarProgramDescriptor, FogOfWarUniforms } from './webgl-program-definitions'
import { calculateNormalsForEachPoint, interpolateHeight } from './geometry'
import { useRenderStateSync } from './use-render-state'
import { useWebGlContext } from './use-webgl-context'
import { useRenderLoop } from './use-render-loop'
import { PointMap } from '../utils/util_types_ng'


// Types
export type ScreenPoint = {
    x: number
    y: number
}

export type CursorState = 'DRAGGING' | 'NOTHING' | 'BUILDING_ROAD' | 'BUILDING_ROAD_PRESSED'

type GameCanvasProps = {
    cursor?: CursorState
    selectedPoint?: Point
    possibleRoadConnections?: Point[]
    newRoad?: Point[]
    showAvailableConstruction: boolean
    showHouseTitles: boolean
    showFpsCounter?: boolean
    viewRef: React.RefObject<View>,
    hideHoverPoint?: boolean
    hideSelectedPoint?: boolean
    heightAdjust: number
    fogOfWar?: boolean

    onPointClicked?: ((point: Point) => void)
    onPointDoubleClick?: ((point: Point) => void)
    onKeyDown?: ((event: React.KeyboardEvent) => void)
}

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

// Configuration
export const RenderLogConfig = {
    lifecycle: false,      // startup, listeners, setup phases
    renderLoop: false,     // per-frame rendering / high-frequency paths
    gl: false,             // WebGL context, programs, critical failures
    assets: false,         // textures, atlases, asset loading
    textures: false,       // texture slots, bindings, lookups
    terrain: false,        // terrain types, tiles, mesh generation
    normals: false,        // normal vectors, geometry diagnostics
    roads: false,          // road buffers, callbacks, updates
    fogOfWar: false,       // discovery & visibility
    input: false,          // mouse / keyboard / interaction
    workers: false,        // worker rendering & state
    debug: false           // raw object dumps
}

// Constants
const ANIMATION_PERIOD = 100
const MOUSE_STYLES = new Map<CursorState, string>([
    ['NOTHING', 'default'],
    ['DRAGGING', 'url(assets/cursors/cursor-move.png), auto'],
    ['BUILDING_ROAD', 'url(assets/cursors/cursor-build-road.png), auto'],
    ['BUILDING_ROAD_PRESSED', 'url(assets/cursors/cursor-build-road-pressed.png), auto']
])

const TERRAIN_AND_ROADS_IMAGE_ATLAS_FILE = 'assets/nature/terrain/greenland/greenland-texture.png'


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
    onPointDoubleClick }: GameCanvasProps) {

    // References
    const normalCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const onPointClickedRef = useRef(onPointClicked)
    const onPointDoubleClickRef = useRef(onPointDoubleClick)

    // Constants
    const lightVector = [1, 1, -1]

    // Use the render state
    const {
        renderState,
        pushImage,
        pushImageWithShadow,
        clearRenderQueues
    } = useRenderStateSync({
        showAvailableConstruction,
        selectedPoint,
        newRoad,
        possibleRoadConnections,
        showHouseTitles,
        fogOfWar,
        showFpsCounter: showFpsCounter ?? false,
        hideHoverPoint: hideHoverPoint ?? false,
        hideSelectedPoint: hideSelectedPoint ?? false,
    })

    // Functions
    const drawImage = useCallback((toDraw: ToDraw, width: number, height: number) => {
        if (renderState.current.drawImageProgramInstance === undefined ||
            toDraw.gamePoint === undefined ||
            toDraw.source?.image === undefined) {
            return
        }

        const textureSlot = textures.activateTextureForRendering(renderState.current.gl!, toDraw.source.image)

        if (textureSlot === undefined) {
            console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

            return
        }

        draw<DrawImageUniforms>(
            renderState.current.drawImageProgramInstance,
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
        if (renderState.current.drawShadowProgramInstance === undefined ||
            toDraw.gamePoint === undefined ||
            toDraw.source?.image === undefined) {
            return
        }

        const textureSlot = textures.activateTextureForRendering(
            renderState.current.gl!,
            toDraw.source.image
        )

        if (textureSlot === undefined) {
            console.error(`Render (textures): Texture slot is undefined for ${toDraw.source.image}`)

            return
        }

        draw<DrawShadowUniforms>(
            renderState.current.drawShadowProgramInstance,
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
     * 
     * Render stages:
     * 1. Prepare webgl context and sizing
     * 2. Collect render information for visible objects
     * 3. Render each part:
     *    - terrain
     *    - decorations
     *       - shadows
     *       - images
     *    - roads
     *    - other game objects
     *       - shadows
     *       - images (sorted)
     *    - available construction overlay
     *    - possible road connections overlay
     *    - selected point overlay
     *    - Hover point overlay
     *    - House titles
     * 
     */
    const renderGame = useCallback((
        renderState: RenderState,
        navigationState: View,
        houses: Iterable<HouseInformation>,
        flags: Iterable<FlagInformation>,
        trees: Iterable<TreeInformation>,
        crops: Iterable<CropInformation>,
        stones: Iterable<StoneInformation>,
        signs: Iterable<SignInformation>,
        workers: Iterable<WorkerInformation>,
        decorations: Iterable<Decoration>,
        fallingTrees: Iterable<FallingTreeInformation>,
        animals: Iterable<WildAnimalInformation>,
        ships: Iterable<ShipInformation>,
        availableConstruction: PointMap<AvailableConstruction[]>,
        borders: Iterable<MonitoredBorderForPlayer>,
        selfPlayerId: PlayerId,
        terrain: PointMap<TerrainAtPoint>
    ) => {
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

        // Clear the render lists
        clearRenderQueues()


        /// Collect render information for all visible objects

        // Collect decorations
        for (const decoration of decorations) {
            const image = decorationsImageAtlasHandler.getDrawingInformationFor(decoration.decoration)
            pushImageWithShadow(image, decoration, 'DECORATION')
        }

        duration.after('collect decorations')


        // Collect borders to draw
        for (const borderForPlayer of borders) {
            borderForPlayer.points.forEach(borderPoint => {
                if (borderPoint.x < minXInGame - 1 || borderPoint.x > maxXInGame || borderPoint.y < minYInGame - 1 || borderPoint.y > maxYInGame + 1) {
                    return
                }

                const borderPointInfo = borderImageAtlasHandler.getDrawingInformation(borderForPlayer.nation, borderForPlayer.color, 'SUMMER')
                pushImage(borderPointInfo, borderPoint, 'OBJECT')
            })
        }

        duration.after('collect borders')


        // Collect the houses
        for (const house of houses) {
            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            if (house.state === 'PLANNED') {
                const plannedDrawInformation = HOUSE_HANDLER.getDrawingInformationForHouseJustStarted(house)
                pushImage(plannedDrawInformation, house, 'OBJECT')
            } else if (house.state === 'BURNING') {
                const size = getHouseSize(house)
                const fireDrawInformation = fireAnimations.getAnimationFrame(size, renderState.animationIndex)

                pushImageWithShadow(fireDrawInformation, house, 'OBJECT')
            } else if (house.state === 'DESTROYED') {
                const size = getHouseSize(house)
                const fireDrawInformation = fireImageAtlasHandler.getBurntDownDrawingInformation(size)

                pushImage(fireDrawInformation, house, 'OBJECT')
            } else if (house.state === 'UNFINISHED' && house.constructionProgress !== undefined) {
                const houseUnderConstruction = HOUSE_HANDLER.getDrawingInformationForHouseUnderConstruction(house)
                const houseDrawInformation = HOUSE_HANDLER.getPartialHouseReady(house)

                pushImageWithShadow(houseUnderConstruction, house, 'OBJECT')
                pushImageWithShadow(houseDrawInformation, house, 'OBJECT')
            } else {
                if ((house.type === 'Mill' && house.isWorking) ||
                    (house.type === 'Mint' && house.isWorking && house.nation === 'ROMANS') ||
                    (house.type === 'IronSmelter' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Armory' && house.nation === 'ROMANS' && house.isWorking) ||
                    (house.type === 'Harbor' && (house.nation === 'ROMANS' || house.nation === 'JAPANESE') && house.isWorking)) {
                    const houseDrawInformation = HOUSE_HANDLER.getDrawingInformationForWorkingHouse(house, renderState.animationIndex)
                    pushImageWithShadow(houseDrawInformation, house, 'OBJECT')
                } else {
                    const houseDrawInformation = HOUSE_HANDLER.getDrawingInformationForHouseReady(house)
                    pushImageWithShadow(houseDrawInformation, house, 'OBJECT')
                }

                if (house.door === 'OPEN') {
                    const door = HOUSE_HANDLER.getDrawingInformationForOpenDoor(house)
                    pushImage(door, house, 'OBJECT')
                }

                if (house.isWorking) {
                    const smokeDrawInformation = fireAnimations.getSmokeFrameForHouse(house, renderState.animationIndex)
                    pushImage(smokeDrawInformation, house, 'OBJECT')
                }

            }
        }

        duration.after('collect houses')


        // Collect the trees
        let treeIndex = 0
        for (const tree of trees) {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                continue
            }

            if (tree.size === 'FULL_GROWN') {
                const treeDrawInfo = TREE_ANIMATIONS.getAnimationFrame(tree.type, renderState.animationIndex, treeIndex)
                pushImageWithShadow(treeDrawInfo, tree, 'OBJECT')
            } else {
                const treeDrawInfo = treeImageAtlasHandler.getImageForGrowingTree(tree)
                pushImageWithShadow(treeDrawInfo, tree, 'OBJECT')
            }

            treeIndex++
        }

        for (const tree of fallingTrees) {
            if (tree.x + 2 < minXInGame || tree.x - 1 > maxXInGame || tree.y + 2 < minYInGame || tree.y - 2 > maxYInGame) {
                continue
            }

            const treeDrawInfo = TREE_ANIMATIONS.getFallingTree(tree)
            pushImageWithShadow(treeDrawInfo, tree, 'OBJECT')
        }

        duration.after('collect trees')


        // Collect the crops
        for (const crop of crops) {
            if (crop.x < minXInGame || crop.x > maxXInGame || crop.y < minYInGame || crop.y > maxYInGame) {
                continue
            }

            const cropDrawInfo = cropsImageAtlasHandler.getDrawingInformationFor(crop)
            pushImageWithShadow(cropDrawInfo, crop, 'OBJECT')
        }

        duration.after('collect crops')


        // Collect the signs
        for (const sign of signs) {
            if (sign.x < minXInGame || sign.x > maxXInGame || sign.y < minYInGame || sign.y > maxYInGame) {
                continue
            }

            const signDrawInfo = signImageAtlasHandler.getDrawingInformation(sign)
            pushImageWithShadow(signDrawInfo, sign, 'OBJECT')
        }

        duration.after('collect signs')


        // Collect the stones
        for (const stone of stones) {
            if (stone.x + 1 < minXInGame || stone.x - 1 > maxXInGame || stone.y + 1 < minYInGame || stone.y - 1 > maxYInGame) {
                continue
            }

            const stoneDrawInfo = stoneImageAtlasHandler.getDrawingInformationFor(stone)
            pushImageWithShadow(stoneDrawInfo, stone, 'OBJECT')
        }

        duration.after('collect stones')


        // Collect wild animals
        for (const animal of animals) {
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
            const animationImage = ANIMAL_ANIMATIONS.get(animal.type)?.getAnimationFrame(animal.direction, renderState.animationIndex)

            pushImageWithShadow(animationImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
        }

        duration.after('collect wild animals')


        // Collect ships
        for (const ship of ships) {

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

            pushImageWithShadow(shipImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
        }

        duration.after('collect ships')


        // Collect workers
        for (const worker of workers) {

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
                pushImageWithShadow(donkeyImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)

                if (worker.cargo) {
                    const cargoImage = donkeyAnimation.getImageAtlasHandler().getDrawingInformationForCargo(worker.cargo, worker.nation)
                    pushImage(cargoImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
                }

                // Draw other workers
            } else {

                // Find the correct animation provider for the worker
                let animationProvider: WorkerAnimation | undefined

                if (worker.type === 'Courier' || worker.type === 'StorehouseWorker') {
                    animationProvider = worker.bodyType === 'FAT' ? fatCarrierNoCargo : thinCarrierNoCargo
                } else {
                    animationProvider = WORKER_ANIMATIONS[worker.type]
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

                        pushImage(animationImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
                    }
                }

                // Draw in case no animation was drawn
                if (!didDrawAnimation) {
                    if (worker.cargo) {
                        const image = animationProvider.getAnimationFrame(worker, worker.betweenPoints ? renderState.animationIndex : 0, worker.percentageTraveled)
                        pushImageWithShadow(image, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
                    } else {
                        const image = animationProvider.getAnimationFrame(worker, worker.betweenPoints ? renderState.animationIndex : 0, worker.percentageTraveled)
                        pushImageWithShadow(image, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
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
                    animationProvider = WORKER_ANIMATIONS[worker.type]
                }

                const cargoImage = animationProvider?.getDrawingInformationForCargo(worker, renderState.animationIndex, worker.percentageTraveled / 10)
                pushImage(cargoImage, renderPosition.gamePoint, 'OBJECT', renderPosition.height)
            }
        }

        duration.after('collect workers')


        // Collect flags
        let flagCount = 0
        for (const flag of flags) {
            if (flag.x < minXInGame || flag.x > maxXInGame || flag.y < minYInGame || flag.y > maxYInGame) {
                continue
            }

            const flagDrawInfo = FLAG_ANIMATIONS.getAnimationFrame(flag, renderState.animationIndex, flagCount)
            pushImageWithShadow(flagDrawInfo, flag, 'OBJECT')

            if (flag.stackedCargo) {
                for (let i = 0; i < Math.min(flag.stackedCargo.length, 3); i++) {
                    const cargo = flag.stackedCargo[i]
                    const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                    pushImage(cargoDrawInfo, { x: flag.x - 0.3, y: flag.y - 0.1 * i + 0.3 }, 'OBJECT', terrain.get(flag)?.height)
                }

                if (flag.stackedCargo.length > 3) {
                    for (let i = 3; i < Math.min(flag.stackedCargo.length, 6); i++) {
                        const cargo = flag.stackedCargo[i]
                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                        pushImage(cargoDrawInfo, { x: flag.x + 0.08, y: flag.y - 0.1 * i + 0.2 }, 'OBJECT', terrain.get(flag)?.height)
                    }
                }

                if (flag.stackedCargo.length > 6) {
                    for (let i = 6; i < flag.stackedCargo.length; i++) {
                        const cargo = flag.stackedCargo[i]
                        const cargoDrawInfo = cargoImageAtlasHandler.getDrawingInformation(flag, cargo)
                        pushImage(cargoDrawInfo, { x: flag.x + 17 / 50, y: flag.y - 0.1 * (i - 4) + 0.2 }, 'OBJECT', terrain.get(flag)?.height)
                    }
                }
            }

            flagCount = flagCount + 1
        }

        duration.after('collect flags')


        // Collect available construction
        if (renderState.showAvailableConstruction) {
            for (const [gamePoint, available] of availableConstruction) {
                if (available.length === 0) {
                    continue
                }

                if (gamePoint.x + 1 < minXInGame || gamePoint.x - 1 > maxXInGame || gamePoint.y + 1 < minYInGame || gamePoint.y - 1 > maxYInGame) {
                    continue
                }

                if (available.includes('LARGE')) {
                    const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForLargeHouseAvailable()
                    pushImage(largeHouseAvailableInfo, gamePoint, 'OBJECT')
                } else if (available.includes('MEDIUM')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMediumHouseAvailable()
                    pushImage(mediumHouseAvailableInfo, gamePoint, 'OBJECT')
                } else if (available.includes('SMALL')) {
                    const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForSmallHouseAvailable()
                    pushImage(mediumHouseAvailableInfo, gamePoint, 'OBJECT')
                } else if (available.includes('MINE')) {
                    const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForMineAvailable()
                    pushImage(mineAvailableInfo, gamePoint, 'OBJECT')
                } else if (available.includes('FLAG')) {
                    const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForFlagAvailable()
                    pushImage(flagAvailableInfo, gamePoint, 'OBJECT')
                }
            }
        }

        duration.after('collect available construction')


        // Collect possible road connections
        if (renderState.newRoad?.possibleConnections) {
            if (renderState?.newRoad !== undefined) {
                const center = renderState.newRoad.newRoad[renderState.newRoad.newRoad.length - 1]
                const startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForStartPoint()

                pushImage(startPointInfo, center, 'POSSIBLE_ROAD_CONNECTIONS')

                const centerHeight = terrain.get(center)?.height ?? 0
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
                            const height = terrain.get(point)?.height ?? 0
                            let startPointInfo

                            if (height > centerHeight) {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForConnectionAbove(differenceToLevel(height, centerHeight))
                            } else if (height < centerHeight) {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForConnectionBelow(differenceToLevel(height, centerHeight))
                            } else {
                                startPointInfo = roadBuildingImageAtlasHandler.getDrawingInformationForSameLevelConnection()
                            }

                            pushImage(startPointInfo, point, 'POSSIBLE_ROAD_CONNECTIONS')
                        }
                    }
                )
            }
        }

        duration.after('collect possible road connections')


        // Collect the selected point
        if (!renderState.hideSelectedPoint) {
            if (renderState.selectedPoint) {
                const selectedPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForSelectedPoint()
                pushImage(selectedPointDrawInfo, renderState.selectedPoint, 'SELECTED_POINT')
            }
        }

        duration.after('collect selected point')


        // Collect the hover point
        if (!renderState.hideHoverPoint) {
            if (renderState.hoverPoint && renderState.hoverPoint.y >= 0 && renderState.hoverPoint.x >= 0) {
                const availableConstructionAtHoverPoint = availableConstruction.get(renderState.hoverPoint)

                if (availableConstructionAtHoverPoint !== undefined && availableConstructionAtHoverPoint.length > 0) {
                    if (availableConstructionAtHoverPoint.includes('LARGE')) {
                        const largeHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverLargeHouseAvailable()
                        pushImage(largeHouseAvailableInfo, renderState.hoverPoint, 'HOVER')
                    } else if (availableConstructionAtHoverPoint.includes('MEDIUM')) {
                        const mediumHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMediumHouseAvailable()
                        pushImage(mediumHouseAvailableInfo, renderState.hoverPoint, 'HOVER')
                    } else if (availableConstructionAtHoverPoint.includes('SMALL')) {
                        const smallHouseAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverSmallHouseAvailable()
                        pushImage(smallHouseAvailableInfo, renderState.hoverPoint, 'HOVER')
                    } else if (availableConstructionAtHoverPoint.includes('MINE')) {
                        const mineAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverMineAvailable()
                        pushImage(mineAvailableInfo, renderState.hoverPoint, 'HOVER')
                    } else if (availableConstructionAtHoverPoint.includes('FLAG')) {
                        const flagAvailableInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverFlagAvailable()
                        pushImage(flagAvailableInfo, renderState.hoverPoint, 'HOVER')
                    }
                } else {
                    const hoverPointDrawInfo = uiElementsImageAtlasHandler.getDrawingInformationForHoverPoint()
                    pushImage(hoverPointDrawInfo, renderState.hoverPoint, 'HOVER')
                }
            }
        }

        duration.after('collect hover point')


        // Collect house titles
        for (const house of houses) {
            if (house.playerId !== selfPlayerId) {
                continue
            }

            if (house.x + 2 < minXInGame || house.x - 2 > maxXInGame || house.y + 2 < minYInGame || house.y - 2 > maxYInGame) {
                continue
            }

            const screenPoint = gamePointToScreenPointWithHeightAdjustmentInternal(house)
            const houseDrawInformation = HOUSE_HANDLER.getDrawingInformationForHouseReady(house)

            let heightOffset = 0

            if (houseDrawInformation) {
                heightOffset = houseDrawInformation[0].offsetY * navigationState.scale / DEFAULT_SCALE
            }

            let houseTitle = buildingPretty(house.type)

            if (house.state === 'UNFINISHED') {
                houseTitle = `(${houseTitle})`
            } else if (house.state === 'UNOCCUPIED') {
                houseTitle = `${houseTitle} (unoccupied)`
            } else if (house.productivity !== undefined && house.state === 'OCCUPIED') {
                houseTitle = `${houseTitle} (${house.productivity}%)`
            }

            renderState.houseTitlesRenderQueue.push({
                text: houseTitle,
                gamePoint: screenPoint
            })
        }

        duration.after('collect house titles')


        /// Render from collected queues

        // Draw the terrain layer
        if (imageAtlasTerrainAndRoads) {
            const textureSlot = textures.activateTextureForRendering(renderState.gl, imageAtlasTerrainAndRoads)

            if (textureSlot !== undefined && renderState.drawGroundProgramInstance) {
                draw<DrawGroundUniforms>(renderState.drawGroundProgramInstance,
                    {
                        u_light_vector: lightVector,
                        u_scale: [navigationState.scale, navigationState.scale],
                        u_offset: [navigationState.translate.x, navigationState.translate.y],
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


        // Draw decoration shadows
        for (const toDraw of renderState.decorationsShadowRenderQueue) {
            drawShadow(toDraw, width, height)
        }

        // Draw decoration objects
        for (const toDraw of renderState.decorationsRenderQueue) {
            drawImage(toDraw, width, height)
        }

        duration.after('draw decorations')


        // Draw the road layer
        if (imageAtlasTerrainAndRoads) {
            const textureSlot = textures.activateTextureForRendering(renderState.gl, imageAtlasTerrainAndRoads)

            if (textureSlot !== undefined && renderState.drawRoadsProgramInstance) {
                draw<DrawGroundUniforms>(renderState.drawRoadsProgramInstance,
                    {
                        u_light_vector: lightVector,
                        u_scale: [navigationState.scale, navigationState.scale],
                        u_offset: [navigationState.translate.x, navigationState.translate.y],
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


        // Draw shadows for game objects without sorting
        if (renderState.drawShadowProgramInstance) {
            for (const shadow of renderState.gameObjectsShadowRenderQueue) {
                drawShadow(shadow, width, height)
            }
        }

        // Draw game objects with sorting based on y coordinate
        renderState.gameObjectsRenderQueue.sort((draw1, draw2) => {
            return draw2.gamePoint.y - draw1.gamePoint.y
        })

        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.gameObjectsRenderQueue) {
                drawImage(toDraw, width, height)
            }
        }

        duration.after('draw game objects')


        // Draw the possible road connections layer. Assume for now that it doesn't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.possibleRoadConnectionsRenderQueue) {
                drawImage(toDraw, width, height)
            }
        }

        duration.after('draw possible road connections layer')


        // Draw fog of war
        if (renderState.fogOfWar && renderState.fogOfWarProgramInstance) {
            draw<FogOfWarUniforms>(renderState.fogOfWarProgramInstance,
                {
                    u_scale: [navigationState.scale, navigationState.scale],
                    u_offset: [navigationState.translate.x, navigationState.translate.y],
                    u_screen_width: width,
                    u_screen_height: height
                },
                'NO_CLEAR_BEFORE_DRAW'
            )
        }

        duration.after('draw fog of war')


        // Draw the selected point layer. Assume for now that it doesn't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.selectedPointRenderQueue) {
                drawImage(toDraw, width, height)
            }
        }

        duration.after('draw selected point layer')


        // Draw the hover point layer. Assume for now that it doesn't need sorting
        if (renderState.drawImageProgramInstance !== undefined) {
            for (const toDraw of renderState.hoverPointRenderQueue) {
                drawImage(toDraw, width, height)
            }
        }

        duration.after('draw hover point layer')


        // Draw house titles on the overlay canvas
        if (renderState.showHouseTitles) {
            overlayCtx.font = 'bold 12px sans-serif'
            overlayCtx.strokeStyle = 'black'
            overlayCtx.fillStyle = 'yellow'

            for (const houseTitle of renderState.houseTitlesRenderQueue) {
                const widthOffset = overlayCtx.measureText(houseTitle.text).width / 2
                overlayCtx.strokeText(houseTitle.text, houseTitle.gamePoint.x - widthOffset, houseTitle.gamePoint.y - 5)
                overlayCtx.fillText(houseTitle.text, houseTitle.gamePoint.x - widthOffset, houseTitle.gamePoint.y - 5)
            }
        }

        duration.after('draw house titles')

        duration.reportStats()


        // List counters if the rendering time exceeded the previous maximum
        if (isLatestValueHighestForVariable('GameRender::renderGame.total')) {
            printVariables()
        }

        // Draw the FPS counter
        const timestamp = Date.now()

        if (renderState.showFpsCounter && renderState.previousTimestamp) {
            const fps = getLatestValueForVariable('GameRender::renderGame.total')

            overlayCtx.fillStyle = 'white'
            overlayCtx.fillRect(width - 100, 5, 100, 60)

            overlayCtx.closePath()

            overlayCtx.fillStyle = 'black'
            overlayCtx.fillText('' + fps, width - 100, 20)

            overlayCtx.fillText('' + getAverageValueForVariable('GameRender::renderGame.total'), width - 100, 40)
        }

        renderState.previousTimestamp = timestamp
    }, [drawImage, drawShadow, clearRenderQueues])

    const initWebgl = useCallback((renderState: WebGlState) => {
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

        // Set up the programs to render images and shadows - these will be updated with the correct coordinates in the render loop before drawing

        // Clear texture cache
        textures.clearTexturesForContext(gl)

        // Load textures
        for (const animation of Object.values(WORKER_ANIMATIONS)) {
            textures.registerTexture(gl, animation.getImage())
        }

        for (const animation of ANIMAL_ANIMATIONS.values()) {
            textures.registerTexture(gl, animation.getImage())
        }

        textures.registerTexture(gl, TREE_ANIMATIONS.getImage())
        textures.registerTexture(gl, FLAG_ANIMATIONS.getImage())
        textures.registerTexture(gl, HOUSE_HANDLER.getSourceImage())
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
    }, [])

    const cleanupWebgl = useCallback((renderState: WebGlState) => {
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
    }, [])

    // Use the render loop
    const { startRenderLoop, stopRenderLoop } = useRenderLoop({ renderState, navigationState: viewRef, renderGame })

    // Use webgl context for rendering and clean up on unmount
    useWebGlContext({ canvasRef: normalCanvasRef, renderState, initWebgl, cleanupWebgl, startRenderLoop, stopRenderLoop })

    // Effects
    // Effect: keep callback references in sync
    useEffect(() => {
        onPointClickedRef.current = onPointClicked
        onPointDoubleClickRef.current = onPointDoubleClick
    }, [onPointClicked, onPointDoubleClick])

    // Run once on mount
    useEffect(
        () => {
            addVariableIfAbsent('fps')

            api.allTiles.forEach(tile => renderState.current.visiblePoints.set(tile.point, { belowVisible: false, downRightVisible: false }))
        }, [renderState]
    )

    // Effect: 
    useEffect(
        () => {

            // Callback when monitoring is started
            function monitoringStarted(): void {
                if (RenderLogConfig.terrain) {
                    console.log('Render (terrain): Received monitoring started callback. Calculating normals')
                }

                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.current.normals)

                if (!renderState.current.drawRoadsProgramInstance) {
                    console.error('Render (roads): The road drawing program instance is undefined')

                    return
                }

                setRoadRenderingBuffers(
                    renderState.current.drawRoadsProgramInstance,
                    Array.from(api.roads.values()),
                    Array.from(api.flags.values()),
                    renderState.current.normals
                )
            }

            // Callback when roads are updated
            function roadsUpdated(): void {
                if (RenderLogConfig.roads) {
                    console.log('Render (roads): Received updated road callback')
                }

                if (!renderState.current.drawRoadsProgramInstance) {
                    console.error('Render (roads): The road drawing program instance is undefined')

                    return
                }

                setRoadRenderingBuffers(
                    renderState.current.drawRoadsProgramInstance,
                    Array.from(api.roads.values()),
                    Array.from(api.flags.values()),
                    renderState.current.normals
                )
            }

            // Callback when discovered points are updated
            function discoveredPointsUpdated(): void {

                // Update the calculated normals
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.current.normals)
                if (RenderLogConfig.fogOfWar) {
                    console.log('Render (fog-of-war): New discovered points - calculated normals')
                }

                // Update the map rendering and fog of war buffers
                if (!renderState.current.drawGroundProgramInstance) {
                    console.error('Render (gl): The terrain drawing program instance is undefined')

                    return
                }

                if (!renderState.current.fogOfWarProgramInstance) {
                    console.error('Render (fog-of-war): The fog of war program instance is undefined')

                    return
                }

                setMapRenderingBuffers(renderState.current.drawGroundProgramInstance, api.allTiles, renderState.current.normals)
                setFogOfWarRenderingBuffers(renderState.current.visiblePoints, renderState.current.fogOfWarProgramInstance, api.discoveredPoints, api.discoveredBelowTiles, api.discoveredDownRightTiles)
            }

            const gameStateListener = {
                onMonitoringStarted: monitoringStarted
            }

            // Load the assets
            async function loadAssets(): Promise<void> {
                const fileLoading: Promise<void | HTMLImageElement>[] = []

                Object.values(WORKER_ANIMATIONS).forEach(worker => fileLoading.push(worker.load()))
                Array.from(ANIMAL_ANIMATIONS.values()).forEach(animal => fileLoading.push(animal.load()))

                const allThingsToWaitFor: Promise<void | HTMLImageElement>[] = fileLoading.concat([
                    TREE_ANIMATIONS.load(),
                    FLAG_ANIMATIONS.load(),
                    HOUSE_HANDLER.load(),
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
                calculateNormalsForEachPoint(api.discoveredBelowTiles, api.discoveredDownRightTiles, renderState.current.normals)

                // Start tracking visible triangles
                if (renderState.current.visiblePoints.size === 0) {
                    api.allTiles.forEach(tile => renderState.current.visiblePoints.set(tile.point, { belowVisible: false, downRightVisible: false }))
                }

                // Set up WebGL context and programs
                initWebgl(renderState.current)

                // Set buffers
                if (!renderState.current.drawGroundProgramInstance ||
                    !renderState.current.fogOfWarProgramInstance ||
                    !renderState.current.drawRoadsProgramInstance ||
                    !renderState.current.drawImageProgramInstance ||
                    !renderState.current.drawShadowProgramInstance) {
                    console.error('Render (gl): One or more WebGL program instances are undefined')

                    return
                }

                setMapRenderingBuffers(renderState.current.drawGroundProgramInstance, api.allTiles, renderState.current.normals)

                setRoadRenderingBuffers(
                    renderState.current.drawRoadsProgramInstance,
                    Array.from(api.roads.values()),
                    Array.from(api.flags.values()),
                    renderState.current.normals
                )

                setFogOfWarRenderingBuffers(
                    renderState.current.visiblePoints,
                    renderState.current.fogOfWarProgramInstance,
                    api.discoveredPoints,
                    api.discoveredBelowTiles,
                    api.discoveredDownRightTiles
                )

                setDrawImageRenderingBuffers(renderState.current.drawImageProgramInstance)
                setDrawShadowRenderingBuffers(renderState.current.drawShadowProgramInstance)

                if (RenderLogConfig.lifecycle) {
                    console.log('Render (lifecycle): Finished setting up WebGL')
                }

                // Start listeners
                api.addRoadsListener(roadsUpdated)
                api.addGameStateListener(gameStateListener)
                api.addDiscoveredPointsListener(discoveredPointsUpdated)

                if (RenderLogConfig.lifecycle) {
                    console.log('Render (lifecycle): Started listeners')
                }
            }

            let cancelled = false

            loadAssetsAndSetupGl().then(() => {
                if (!cancelled) {
                    startRenderLoop()
                }
            })

            return () => {
                cancelled = true

                // Stop listeners
                api.removeGameStateListener(gameStateListener)
                api.removeRoadsListener(roadsUpdated)
                api.removeDiscoveredPointsListener(discoveredPointsUpdated)

                // Stop rendering loop
                stopRenderLoop()
            }
        }, [
        renderState,
        initWebgl,
        startRenderLoop,
        stopRenderLoop
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

    const onClick = useCallback((event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const gamePoint =
            screenPointToGamePointWithHeightAdjustmentInternal({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            })

        onPointClickedRef.current?.(gamePoint)

        event.stopPropagation()
    }, [screenPointToGamePointWithHeightAdjustmentInternal])

    const onDoubleClick = useCallback((event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const gamePoint =
            screenPointToGamePointWithHeightAdjustmentInternal({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            })

        onPointDoubleClickRef.current?.(gamePoint)

        event.stopPropagation()
    }, [screenPointToGamePointWithHeightAdjustmentInternal])

    return (
        <>
            <canvas
                className='game-canvas'
                onKeyDown={onKeyDown}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                style={{ cursor: MOUSE_STYLES.get(cursor ?? 'NOTHING') }}
                tabIndex={-1}
                ref={overlayCanvasRef}
                onMouseMove={
                    (event: React.MouseEvent) => {
                        if (overlayCanvasRef?.current) {
                            const rect = event.currentTarget.getBoundingClientRect()
                            const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top }

                            try {
                                const hoverPoint = screenPointToGamePointWithHeightAdjustmentInternal(screenPoint)

                                if (hoverPoint &&
                                    hoverPoint.y >= 0 &&
                                    hoverPoint.x >= 0 &&
                                    (!renderState.current.hoverPoint ||
                                        (hoverPoint.x !== renderState.current.hoverPoint.x || hoverPoint.y !== renderState.current.hoverPoint.y))) {
                                    renderState.current.hoverPoint = hoverPoint
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

export { GameCanvas }

