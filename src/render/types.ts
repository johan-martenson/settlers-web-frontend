import { Point } from '../api/types'
import { Dimension, DrawingInformation } from '../assets/types'
import { NewRoad } from '../screens/play/play'
import { PointMap } from '../utils/util_types_ng'
import { Vector } from '../utils/utils'
import { ProgramInstance } from './webgl-utils'


export type RenderType = 'TERRAIN' | 'DECORATION_SHADOW' | 'DECORATION' | 'ROAD' | 'OBJECT_SHADOW' | 'OBJECT' | 'HOVER' | 'AVAILABLE_CONSTRUCTION' | 'POSSIBLE_ROAD_CONNECTIONS' | 'SELECTED_POINT'

export type View = {
    screenSize: Dimension
    scale: number
    translate: Point
}

export type ToDraw = {
    source: DrawingInformation | undefined
    gamePoint: Point
    height?: number
}

export type TrianglesAtPoint = {
    belowVisible: boolean
    downRightVisible: boolean
}

export type ShadedPoint = {
    point: Point
    intensity: number
}

export type RenderInformation = {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

export type MapRenderInformation = {
    coordinates: number[]
    normals: number[]
    textureMapping: number[]
}

export type WebGlState = {
    gl?: WebGL2RenderingContext
    drawGroundProgramInstance?: ProgramInstance
    drawRoadsProgramInstance?: ProgramInstance
    drawImageProgramInstance?: ProgramInstance
    drawShadowProgramInstance?: ProgramInstance
    fogOfWarProgramInstance?: ProgramInstance
    contextLost: boolean
}

type ToDrawString = {
    text: string
    gamePoint: Point
}

export type RenderState = WebGlState & {
    previousTimestamp?: number
    previous: number
    overshoot: number

    animationIndex: number

    newRoad?: NewRoad

    selectedPoint?: Point
    hoverPoint?: Point
    newRoadCurrentLength: number

    showHouseTitles: boolean
    showAvailableConstruction: boolean
    fogOfWar: boolean
    showFpsCounter: boolean
    hideSelectedPoint: boolean
    hideHoverPoint: boolean

    // Map of the normal for each point on the map
    normals: PointMap<Vector>

    visiblePoints: PointMap<TrianglesAtPoint>

    // Render loop control
    renderLoopHandle: ReturnType<typeof requestAnimationFrame> | undefined
    renderLoopIsRunning?: boolean

    // Render loop caching
    decorationsRenderQueue: ToDraw[]
    decorationsShadowRenderQueue: ToDraw[]
    gameObjectsRenderQueue: ToDraw[]
    gameObjectsShadowRenderQueue: ToDraw[]
    availableConstructionRenderQueue: ToDraw[]
    possibleRoadConnectionsRenderQueue: ToDraw[]
    selectedPointRenderQueue: ToDraw[]
    hoverPointRenderQueue: ToDraw[]
    houseTitlesRenderQueue: ToDrawString[]
}