import { Point } from "../api/types"

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