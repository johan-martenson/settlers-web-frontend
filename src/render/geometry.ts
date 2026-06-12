import { Point } from '../api/types'
import { api, TileBelow, TileDownRight } from '../api/ws-api'
import { PointMap } from '../utils/point-value-collections'
import { getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, sumAndNormalizeVectors, Vector } from '../utils/utils'

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

// Exports
export {
    interpolateHeight,
    calculateNormalsForEachPoint
}
