import { FlagInformation, HouseInformation, Point, PointInformation, RoadId } from "../../api/types"

type HouseWindow = {
    type: 'HOUSE'
    house: HouseInformation
}

type ToolsWindow = {
    type: 'TOOLS'
}

type FlagWindow = {
    type: 'FLAG'
    flag: FlagInformation
}

type ConstructionWindow = {
    type: 'CONSTRUCTION_WINDOW'
    pointInformation: PointInformation
}

type StatisticsWindow = {
    type: 'STATISTICS'
}

type GuideWindow = {
    type: 'GUIDE'
}

type DebugWindow = {
    type: 'DEBUG'
}

type QuotaWindow = {
    type: 'QUOTA'
}

type RoadWindow = {
    type: 'ROAD_INFO'
    roadId: RoadId
}

type TransportPriorityWindow = {
    type: 'TRANSPORT_PRIORITY'
}

type FollowWindow = {
    type: 'FOLLOW'
    point: Point
}

type NoActionWindow = {
    type: 'NO_ACTION'
    point: Point
}

type MapWindow = {
    type: 'MAP'
}

type WindowType =
    | HouseWindow
    | FlagWindow
    | ConstructionWindow
    | StatisticsWindow
    | GuideWindow
    | DebugWindow
    | QuotaWindow
    | RoadWindow
    | TransportPriorityWindow
    | FollowWindow
    | ToolsWindow
    | NoActionWindow
    | MapWindow

export type Window = { id: number } & WindowType

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
