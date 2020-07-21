import { GameId, getHousesForPlayer, getInformationOnPoint, PlayerId, Point, removeFlag, removeHouse, RoadInformation, TerrainInformation, TileInformation, RoadId, removeRoad } from './api'
import { TerrainAtPoint } from './game_render'

const vegetationToInt = new Map<TileInformation, number>()

vegetationToInt.set("G", 0)   // Grass
vegetationToInt.set("M", 1)   // Mountain
vegetationToInt.set("SW", 2)  // Swamp
vegetationToInt.set("W", 3)   // Water
vegetationToInt.set("DW", 4)  // Deep water
vegetationToInt.set("SN", 5)  // Snow
vegetationToInt.set("L", 6)   // Lava
vegetationToInt.set("MM", 7)  // Mountain meadow
vegetationToInt.set("ST", 8)  // Steppe
vegetationToInt.set("DE", 9)  // Desert
vegetationToInt.set("SA", 10) // Savannah

export type RgbColorArray = [number, number, number]

const intToVegetationColor = new Map<number, RgbColorArray>()

intToVegetationColor.set(0, [0, 120, 0])
intToVegetationColor.set(1, [140, 140, 140])
intToVegetationColor.set(2, [140, 140, 20])
intToVegetationColor.set(3, [0, 0, 205])
intToVegetationColor.set(4, [0, 0, 205])
intToVegetationColor.set(5, [220, 220, 220])
intToVegetationColor.set(6, [220, 0, 0])
intToVegetationColor.set(7, [140, 140, 140])
intToVegetationColor.set(8, [230, 110, 0])
intToVegetationColor.set(9, [230, 200, 0])
intToVegetationColor.set(10, [100, 70, 70])

const MINIMAL_DIFFERENCE = 0.0000001

// FIXME: make a proper implementation
function camelCaseToWords(camelCaseStr: string): string {
    return camelCaseStr
}

function isContext2D(context: RenderingContext): context is CanvasRenderingContext2D {
    return true
}

function terrainInformationToTerrainAtPointList(terrainInformation: TerrainInformation): Array<TerrainAtPoint> {
    let start = 1
    let count = 0

    const terrain = new Array(((terrainInformation.width * terrainInformation.height) / 2) + 1)

    for (let y = 1; y < terrainInformation.height; y++) {
        for (let x = start; x + 1 < terrainInformation.width; x += 2) {

            const point: Point = {
                x: Number(x),
                y: Number(y)
            }

            const tile = {
                point: point,
                straightBelow: vegetationToInt.get(terrainInformation.straightBelow[count]),
                belowToTheRight: vegetationToInt.get(terrainInformation.belowToTheRight[count]),
                height: terrainInformation.heights[count]
            }

            terrain[count] = tile
            count++
        }

        if (start === 1) {
            start = 2
        } else {
            start = 1
        }
    }

    return terrain
}

export interface Point3D {
    x: number
    y: number
    z: number
}

export interface Vector {
    x: number
    y: number
    z: number
}

export interface NormalizedVector extends Vector { }

function vectorFromPoints(p1: Point3D, p2: Point3D): Vector {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
        z: p1.z - p2.z
    }
}

function crossProduct(vector1: Vector, vector2: Vector): Vector {
    return {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x
    }
}

function lengthOfVector(vector: Vector): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
}

function normalize(vector: Vector): NormalizedVector {
    const length = lengthOfVector(vector)

    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    }
}

function getNormalForTriangle(p1: Point3D, p2: Point3D, p3: Point3D): NormalizedVector {

    const vector1 = vectorFromPoints(p1, p2)
    const vector2 = vectorFromPoints(p1, p3)

    const normal = crossProduct(vector1, vector2)

    const normalized = normalize(normal)

    return normalized
}

function getDotProduct(v1: Vector, v2: Vector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}

export interface Line {
    k: number
    m: number
}

function getLineBetweenPoints(p1: Point, p2: Point): Line {
    const k = (p1.y - p2.y) / (p1.x - p2.x)
    const m = p1.y - (k * p1.x)

    return {
        k: k,
        m: m
    }
}

function getOrthogonalLine(line: Line, point: Point): Line {
    const k = -1 / line.k
    const m = point.y - k * point.x

    return {
        k: k,
        m: m
    }
}

function getIntersection(line1: Line, line2: Line): Point {
    const x = (line2.m - line1.m) / (line1.k - line2.k)
    const y = line1.k * x + line1.m

    return {
        x: x,
        y: y
    }
}

function almostEquals(a: number, b: number): boolean {
    const difference = a - b
    return difference < MINIMAL_DIFFERENCE && difference > -MINIMAL_DIFFERENCE
}

/**
 * Creates a gradient line for drawing a single-color shaded triangle given the brightness of the three points for use with the Canvas 2D rendering API.
 * 
 * @remarks
 * This function does not handle the case where the three intensities are all the same.
 * 
 * The Canvas 2D rendering API can be used to draw linear gradients defined by two or more points:
 * 
 * |||||  ||||  |||  ||  |  
 * |||||  ||||  |||  ||  |  
 * P(start)--------------P(end)
 * |||||  ||||  |||  ||  | 
 * |||||  ||||  |||  ||  |  
 * 
 * The function finds two points P(start) and P(end) that defines a gradient so that the max point is parallel with the P(start), the min point is 
 * parallel with the P(end), and the P(in-between) has the right intensity:
 * 
 * |||||  ||||  |||  ||  |  
 * P(max) ------------ P(min)  
 * | \ |  ||||  |||  /   |  
 * ||| \  ||||  || / ||  |  
 * ||||| \ |||   /   ||  |  
 * |||||   \ | / ||  ||  |  
 * |||||  || P(in-between)
 * |||||  ||||  |||  ||  |  
 * 
 * 
 * It does this by drawing the line from the max point to and through the in-between point it has to go to get the minimum intensity. Then it finds
 *  an orthogonal line against it that cuts through the starting point.
 * 
 * @param p1 - The first point
 * @param intensity1 - The intensity of the first point
 * @param p2 - The second point
 * @param intensity2 - The intensity of the second point
 * @param p3 - The third point
 * @param intensity3 - The intensity of the third point
 */
function getGradientLineForTriangle(p1: Point, intensity1: number, p2: Point, intensity2: number, p3: Point, intensity3: number): Point[] {

    const intensityMax = Math.max(intensity1, intensity2, intensity3)
    const intensityMin = Math.min(intensity1, intensity2, intensity3)
    const intensityFullRange = intensityMax - intensityMin

    let partialIntensity

    let pointHigh: Point
    let pointLow: Point
    let pointInBetween: Point

    /* Find the highest point */
    if (intensity1 === intensityMax) {
        pointHigh = p1
    } else if (intensity2 === intensityMax) {
        pointHigh = p2
    } else {
        pointHigh = p3
    }

    /* Find the lowest point */
    if (intensity1 === intensityMin) {
        pointLow = p1
    } else if (intensity2 === intensityMin) {
        pointLow = p2
    } else {
        pointLow = p3
    }

    /* Find the mid point */
    if (p1 !== pointHigh && p1 !== pointLow) {
        pointInBetween = p1
        partialIntensity = intensity1
    } else if (p2 !== pointHigh && p2 !== pointLow) {
        pointInBetween = p2
        partialIntensity = intensity2
    } else {
        pointInBetween = p3
        partialIntensity = intensity3
    }

    /**
     * Handle the special case where partial and full intensity are the same -- p4 and pointHigh are on the same line 
     * 
     * E.g.:
     * 
     * |||||  ||||  |||  ||  |  
     * P(max) -- P(min)  ||  |
     * | |||   / |  |||  ||  |  
     * | ||| / |||  |||  ||  |  
     * | | /  ||||  |||  ||  |  
     * | / |  ||||  |||  ||  |  
     * P(in-between) ||  ||  |
     * |||||  ||||  |||  ||  |  
     *
     * or
     * 
     * P(max) ||||  |||  ||  |  
     * | \ |  ||||  |||  ||  |  
     * | | \  ||||  |||  ||  |  
     * | ||| \ |||  |||  ||  |  
     * | |||   \ |  |||  ||  |  
     * | |||  || P(min)  ||  |
     * | |||   / |  |||  ||  |  
     * | ||| / |||  |||  ||  |  
     * | | /  ||||  |||  ||  |  
     * | / |  ||||  |||  ||  |  
     * P(in-between) ||  ||  |
     * |||||  ||||  |||  ||  |  
     * 
     */
    if (almostEquals(intensityMax, partialIntensity)) {

        /* Handle the special case where pointHigh and pointMedium are on the same vertical line */
        if (almostEquals(pointHigh.x, pointInBetween.x)) {
            const result = [
                {
                    x: pointHigh.x,
                    y: pointLow.y
                },
                pointLow
            ]

            return result
        }

        /* Handle the special case where pointHigh and pointMedium are on the same horizontal line */
        if (almostEquals(pointHigh.y, pointInBetween.y)) {

            const result = [
                {
                    x: pointLow.x,
                    y: pointHigh.y
                },
                pointLow
            ]

            return result
        }

        /* Get the line that goes through the maximum and in-between points */
        const lineMaximum = getLineBetweenPoints(pointHigh, pointInBetween)

        /* Get the line that is orthogonal to the maximum line and crosses the minimum point */
        const lineOrthogonal = getOrthogonalLine(lineMaximum, pointLow)

        /* Find intersection between the maximum line and its orthogonal line that crosses through the minimum point */
        const pointIntersect = getIntersection(lineMaximum, lineOrthogonal)

        const result = [pointIntersect, pointLow]

        return result
    } else {

        /* Handle the cases where the maximum and in-between intensities are not equal */
        const intensityPartialRange = intensityMax - partialIntensity

        /* Get the point where a line that cuts through the in-between point reaches the minimum intensity */
        const dx = pointInBetween.x - pointHigh.x
        const dy = pointInBetween.y - pointHigh.y

        const pointSecondMinimum = {
            x: (intensityFullRange * dx) / intensityPartialRange + pointHigh.x,
            y: (intensityFullRange * dy) / intensityPartialRange + pointHigh.y
        }

        /* Handle the case where the line is parallel with the X axis */
        if (almostEquals(pointSecondMinimum.y, pointLow.y)) {
            const result = [
                pointHigh,
                {
                    x: pointHigh.x,
                    y: pointInBetween.y
                }
            ]

            return result
        }

        /* Handle the case where the line is parallel with the y axis */
        if (almostEquals(pointSecondMinimum.x, pointLow.x)) {
            return [
                pointHigh,
                {
                    x: pointSecondMinimum.x,
                    y: pointHigh.y
                }
            ]
        }

        /* Get the line that cuts through p4 and the minimum point */
        const lineMinimum = getLineBetweenPoints(pointSecondMinimum, pointLow)

        /* Get the line that is orthogonal to the minimum line and cuts through the maximum point */
        const lineOrthogonal = getOrthogonalLine(lineMinimum, pointHigh)

        /* Get point where the minimum line and its orthogonal line through the maximum point intersect */
        const pointIntersect = getIntersection(lineMinimum, lineOrthogonal)

        const result = [pointHigh, pointIntersect]

        return result
    }
}

function sumVectors(v1: Vector | undefined, v2: Vector | undefined): Vector {

    let vector1: Vector
    let vector2: Vector

    if (v1) {
        vector1 = v1
    } else {
        vector1 = {
            x: 0,
            y: 0,
            z: 0
        }
    }

    if (v2) {
        vector2 = v2
    } else {
        vector2 = {
            x: 0,
            y: 0,
            z: 0
        }
    }

    return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y,
        z: vector1.z + vector2.z
    }
}

function getPointDownLeft(point: Point): Point {
    return {
        x: point.x - 1,
        y: point.y - 1
    }
}

function getPointDownRight(point: Point): Point {
    return {
        x: point.x + 1,
        y: point.y - 1
    }
}

function getPointUpLeft(point: Point): Point {
    return {
        x: point.x - 1,
        y: point.y + 1
    }
}

function getPointUpRight(point: Point): Point {
    return {
        x: point.x + 1,
        y: point.y + 1
    }
}

function getPointRight(point: Point): Point {
    return {
        x: point.x + 2,
        y: point.y
    }
}

function getPointLeft(point: Point): Point {
    return {
        x: point.x - 2,
        y: point.y
    }
}

function getBrightnessForNormals(normals: (Vector | undefined)[], lightVector: Vector): number {

    let vectors: Vector[] = []

    for (let normal of normals) {
        if (normal) {
            vectors.push(normal)
        }
    }

    const combinedVector = vectors.reduce(sumVectors)

    const normalized = normalize(combinedVector)

    return -getDotProduct(normalized, lightVector)
}

function arrayToRgbStyle(rgb: number[]): string {
    return 'rgb(' + Math.floor(rgb[0]) + ', ' + Math.floor(rgb[1]) + ', ' + Math.floor(rgb[2]) + ')'
}

function getPointAtLineGivenX(line: Line, x: number): Point {
    return {
        x: x,
        y: x * line.k + line.m
    }
}

async function removeHouseAtPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {

    /* Get the player's houses */
    const buildings = await getHousesForPlayer(playerId, gameId)

    /* Find the one on the point */
    let buildingOnPoint

    for (const building of buildings) {
        if (building.x === point.x && building.y === point.y) {
            buildingOnPoint = building

            break
        }
    }

    if (buildingOnPoint) {
        await removeHouse(buildingOnPoint.id, playerId, gameId)
    }
}

function isRoadAtPoint(point: Point, roads: Map<RoadId, RoadInformation>): boolean {

    for (const [id, road] of roads) {
        road.points.forEach(
            roadPoint => {

                if (point.x === roadPoint.x && point.y === roadPoint.y) {

                    return true
                }
            }
        )
    }

    return false
}

async function removeHouseOrFlagOrRoadAtPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {

    const pointInformation = await getInformationOnPoint(point, gameId, playerId)

    if (pointInformation.is === "building" && pointInformation.buildingId) {
        await removeHouse(pointInformation.buildingId, playerId, gameId)
    } else if (pointInformation.is === "flag" && pointInformation.flagId) {
        await removeFlag(pointInformation.flagId, gameId, playerId)
    } else if (pointInformation.is === "road" && pointInformation.roadId) {
        await removeRoad(pointInformation.roadId, gameId, playerId)
    }
}

function same(point1: Point, point2: Point): boolean {
    return point1.x === point2.x && point1.y === point2.y
}

function drawGradientTriangle(ctx: CanvasRenderingContext2D, color: RgbColorArray, point1: Point, point2: Point, point3: Point, intensity1: number, intensity2: number, intensity3: number) {

    const minIntensityBelow = Math.min(intensity1, intensity2, intensity3)
    const maxIntensityBelow = Math.max(intensity1, intensity2, intensity3)

    const minColorBelow: RgbColorArray = [
        color[0] + 40 * minIntensityBelow,
        color[1] + 40 * minIntensityBelow,
        color[2] + 40 * minIntensityBelow
    ]

    const maxColorBelow: RgbColorArray = [
        color[0] + 40 * maxIntensityBelow,
        color[1] + 40 * maxIntensityBelow,
        color[2] + 40 * maxIntensityBelow
    ]

    if (Math.abs(minIntensityBelow - maxIntensityBelow) < 0.05) {
        ctx.fillStyle = arrayToRgbStyle(minColorBelow)
    } else {

        const gradientScreenPoints = getGradientLineForTriangle(point1, intensity1, point2, intensity2, point3, intensity3)

        const gradient = ctx.createLinearGradient(
            Math.round(gradientScreenPoints[0].x), Math.round(gradientScreenPoints[0].y),
            Math.round(gradientScreenPoints[1].x), Math.round(gradientScreenPoints[1].y)
        )

        gradient.addColorStop(0, arrayToRgbStyle(maxColorBelow))
        gradient.addColorStop(1, arrayToRgbStyle(minColorBelow))

        ctx.fillStyle = gradient
    }

    ctx.beginPath()

    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.lineTo(point3.x, point3.y)

    ctx.closePath()

    ctx.fill()
}

function getTimestamp(): number {
    const date = new Date()
    const timestamp = date.getTime()

    return timestamp
}


export { getTimestamp, drawGradientTriangle, normalize, same, removeHouseOrFlagOrRoadAtPoint as removeHouseOrFlagAtPoint, isRoadAtPoint, almostEquals, removeHouseAtPoint, isContext2D, terrainInformationToTerrainAtPointList, arrayToRgbStyle, getGradientLineForTriangle, getBrightnessForNormals, getPointLeft, getPointRight, getPointDownLeft, getPointDownRight, getPointUpLeft, getPointUpRight, getLineBetweenPoints, getDotProduct, getNormalForTriangle, camelCaseToWords, vegetationToInt, intToVegetationColor }

