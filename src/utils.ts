import { Dir } from 'fs'
import { GameId, getHousesForPlayer, getInformationOnPoint, PlayerId, Point, removeFlag, removeHouse, RoadInformation, TerrainInformation, Vegetation, RoadId, removeRoad, TerrainAtPoint, WorkerInformation } from './api'

const vegetationToInt = new Map<Vegetation, number>()

vegetationToInt.set("SA", 0)    // Savannah
vegetationToInt.set("MO1", 1)   // Mountain 1
vegetationToInt.set("SN", 2)    // Snow
vegetationToInt.set("SW", 3)    // Swamp
vegetationToInt.set("D1", 4)    // Desert 1
vegetationToInt.set("W1", 5)    // Water (ships can pass)
vegetationToInt.set("B", 6)     // Buildable water
vegetationToInt.set("D2", 7)    // Desert 2
vegetationToInt.set("ME1", 8)   // Meadow 1
vegetationToInt.set("ME2", 9)   // Meadow 2
vegetationToInt.set("ME3", 10)  // Meadow 3
vegetationToInt.set("MO2", 11)  // Mountain 2
vegetationToInt.set("MO3", 12)  // Mountain 3
vegetationToInt.set("MO4", 13)  // Mountain 4
vegetationToInt.set("ST", 14)   // Steppe
vegetationToInt.set("FM", 15)   // Flower meadow
vegetationToInt.set("L1", 16)   // Lava 1
vegetationToInt.set("MA", 17)   // Magenta
vegetationToInt.set("MM", 18)   // Mountain meadow
vegetationToInt.set("W2", 19)   // Water 2
vegetationToInt.set("L2", 20)   // Lava 2
vegetationToInt.set("L3", 21)   // Lava 3
vegetationToInt.set("L4", 22)   // Lava 4
vegetationToInt.set("BM", 23)   // Buildable mountain

export type RgbColorArray = [number, number, number]

const intToVegetationColor = new Map<number, RgbColorArray>()

intToVegetationColor.set(0, [0, 120, 0])       // Savannah
intToVegetationColor.set(1, [140, 140, 140])   // Mountain 1
intToVegetationColor.set(2, [220, 220, 220])   // Snow
intToVegetationColor.set(3, [0, 110, 0])       // Swamp
intToVegetationColor.set(4, [110, 0, 110])     // Desert 1
intToVegetationColor.set(5, [0, 0, 220])       // Water
intToVegetationColor.set(6, [0, 0, 220])       // Buildable water
intToVegetationColor.set(7, [110, 0, 110])     // Desert 2
intToVegetationColor.set(8, [0, 110, 0])       // Meadow 1
intToVegetationColor.set(9, [0, 110, 0])       // Meadow 2
intToVegetationColor.set(10, [0, 110, 0])      // Meadow 3
intToVegetationColor.set(11, [140, 140, 140])  // Mountain 2
intToVegetationColor.set(12, [140, 140, 140])  // Mountain 3
intToVegetationColor.set(13, [140, 140, 140])  // Mountain 4
intToVegetationColor.set(14, [110, 0, 110])    // Steppe
intToVegetationColor.set(15, [0, 110, 0])      // Flower meadow
intToVegetationColor.set(16, [220, 0, 0])      // Lava 1
intToVegetationColor.set(17, [140, 140, 140])  // Magenta
intToVegetationColor.set(18, [230, 110, 0])    // Mountain meadow
intToVegetationColor.set(19, [0, 0, 220])      // Water 2
intToVegetationColor.set(20, [220, 0, 0])      // Lava 2
intToVegetationColor.set(21, [220, 0, 0])      // Lava 3
intToVegetationColor.set(22, [220, 0, 0])      // Lava 4
intToVegetationColor.set(23, [140, 140, 140])  // Buildable mountain

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
                below: vegetationToInt.get(terrainInformation.straightBelow[count]),
                downRight: vegetationToInt.get(terrainInformation.belowToTheRight[count]),
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

function drawGradientTriangleWithImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, point1: Point, point2: Point, point3: Point, intensity1: number, intensity2: number, intensity3: number) {

    const minIntensityBelow = Math.min(intensity1, intensity2, intensity3)
    const maxIntensityBelow = Math.max(intensity1, intensity2, intensity3)

    const colorValue = 0
    const maxAlpha = 1 - (maxIntensityBelow + 1) / 2
    const minAlpha = 1 - (minIntensityBelow + 1) / 2

    const rgbString = colorValue + ', ' + colorValue + ", " + colorValue

    if (Math.abs(minIntensityBelow - maxIntensityBelow) < 0.05) {
        ctx.fillStyle = 'rgba(' + rgbString + ', ' + maxAlpha + ')'
    } else {

        const gradientScreenPoints = getGradientLineForTriangle(point1, intensity1, point2, intensity2, point3, intensity3)

        const gradient = ctx.createLinearGradient(
            Math.round(gradientScreenPoints[0].x), Math.round(gradientScreenPoints[0].y),
            Math.round(gradientScreenPoints[1].x), Math.round(gradientScreenPoints[1].y)
        )


        gradient.addColorStop(0, 'rgba(' + rgbString + ', ' + maxAlpha + ')') // 1 - no transparency, 0 - full transparency
        gradient.addColorStop(1, 'rgba(' + rgbString + ', ' + minAlpha + ')')

        ctx.fillStyle = gradient
    }

    const oldFillstyle = ctx.fillStyle

    /* Draw the image */
    const pattern = ctx.createPattern(image, 'repeat')

    if (!pattern) {
        return
    }

    ctx.fillStyle = pattern

    ctx.beginPath()

    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.lineTo(point3.x, point3.y)

    ctx.closePath()

    ctx.fill()

    /* Draw shading on top */
    ctx.fillStyle = oldFillstyle

    ctx.beginPath()

    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.lineTo(point3.x, point3.y)

    ctx.closePath()

    ctx.fill()
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

function loadImage(source: string, onLoad: ((image: HTMLImageElement, source: string) => void)): void {
    console.log("Loading " + source)

    const image = new Image()

    image.addEventListener("load",
        () => {
            console.log("Loaded " + source)
            onLoad(image, source)
        }
    )

    image.src = source
}

function loadImages(sources: string[] | IterableIterator<string>, onLoad: ((image: HTMLImageElement, source: string) => void)): void {
    for (let source of sources) {
        console.log("Loading " + source)

        const image = new Image()

        image.addEventListener("load",
            () => {
                console.log("Loaded " + source)
                onLoad(image, source)
            }
        )

        image.src = source
    }
}

export type Direction = "EAST" | "SOUTH_EAST" | "SOUTH_WEST" | "WEST" | "NORTH_WEST" | "NORTH_EAST"

class WorkerAnimation {
    animations: Map<Direction, AnimationUtil>

    constructor(prefix: string, postfix: string, length: number, speedAdjust: number) {
        this.animations = new Map<Direction, AnimationUtil>()

        this.animations.set("EAST",       new AnimationUtil(prefix + "east-", postfix, length, speedAdjust))
        this.animations.set("SOUTH_EAST", new AnimationUtil(prefix + "south-east-", postfix, length, speedAdjust))
        this.animations.set("SOUTH_WEST", new AnimationUtil(prefix + "south-west-", postfix, length, speedAdjust))
        this.animations.set("WEST",       new AnimationUtil(prefix + "west-", postfix, length, speedAdjust))
        this.animations.set("NORTH_WEST", new AnimationUtil(prefix + "north-west-", postfix, length, speedAdjust))
        this.animations.set("NORTH_EAST", new AnimationUtil(prefix + "north-east-", postfix, length, speedAdjust))
    }

    load() {
        this.animations.get("EAST")?.load()
        this.animations.get("SOUTH_EAST")?.load()
        this.animations.get("SOUTH_WEST")?.load()
        this.animations.get("WEST")?.load()
        this.animations.get("NORTH_WEST")?.load()
        this.animations.get("NORTH_EAST")?.load()
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): HTMLImageElement | undefined {
        const animation = this.animations.get(direction)

        if (animation === undefined) {
            return undefined
        }

        const frame = animation.getAnimationElement(animationIndex, percentageTraveled)

        return frame
    }
}

class AnimationUtil {
    length: number
    postfix: string
    prefix: string
    frames: (HTMLImageElement | undefined)[]
    speedAdjust: number

    constructor(prefix: string, postfix: string, length: number, speedAdjust: number) {
        this.prefix = prefix
        this.postfix = postfix
        this.length = length
        this.speedAdjust = speedAdjust

        this.frames = []
    }

    async load() {
        for (let i = 0; i < this.length; i++) {
            this.frames.push(undefined)

            const filename = this.prefix + i + this.postfix

            loadImage(filename, (image, filename) => this.frames[i] = image)
        }
    }

    getAnimationElement(animationCounter: number, offset: number): HTMLImageElement | undefined {
        const treeImage = this.frames[(Math.floor(animationCounter / this.speedAdjust) + offset) % this.frames.length]

        return treeImage
    }
}

function getDirectionForWalkingWorker(next: Point, previous: Point): Direction {

    if (next.x === previous.x + 1 && next.y === previous.y - 1) {
        return "SOUTH_EAST"
    } else if (next.x === previous.x - 1 && next.y === previous.y - 1) { // SOUTH WEST
        return "SOUTH_WEST"
    } else if (next.x === previous.x - 2) { // WEST
        return "WEST"
    } else if (next.x === previous.x - 1 && next.y === previous.y + 1) { // NORTH WEST
        return "NORTH_WEST"
    } else if (next.x === previous.x + 1 && next.y === previous.y + 1) { // NORTH EAST
        return "NORTH_EAST"
    }

    return "EAST"
}

export { getDirectionForWalkingWorker, WorkerAnimation, AnimationUtil, loadImage, loadImages, drawGradientTriangleWithImage, getTimestamp, drawGradientTriangle, normalize, same, removeHouseOrFlagOrRoadAtPoint, isRoadAtPoint, almostEquals, removeHouseAtPoint, isContext2D, terrainInformationToTerrainAtPointList, arrayToRgbStyle, getGradientLineForTriangle, getBrightnessForNormals, getPointLeft, getPointRight, getPointDownLeft, getPointDownRight, getPointUpLeft, getPointUpRight, getLineBetweenPoints, getDotProduct, getNormalForTriangle, camelCaseToWords, vegetationToInt, intToVegetationColor }


