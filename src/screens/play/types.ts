import { Point } from "../../api/types"

export type ImmediateState = {
    mouseDown: boolean
    mouseDownAt: Point
    mouseMoving: boolean
    touchMoveOngoing: boolean
    primaryTouchIdentifier: number
    translateAtMouseDown: Point
    screenSize: {
        width: number
        height: number
    }
    translate: Point
    scale: number
}

export type RoadBuildingState = {
    active: boolean
    road: Point[]
    possibleConnections: Point[]
}
