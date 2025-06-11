import { TerrainInformation, TerrainAtPoint, Point, RoadId, RoadInformation, Direction, Size, HouseInformation, SMALL_HOUSES, MEDIUM_HOUSES, MapInformation, PointInformation, PlayerColor, PLAYER_COLORS, PlayerInformation, WATER_1, WATER_2, BUILDABLE_WATER } from '../api/types'
import { api } from '../api/ws-api'
import { ScreenPoint, View } from '../render/game_render'
import { STANDARD_HEIGHT } from '../render/constants'
import { PointMap, PointSet } from './util_types'
import { playerToColor } from '../pretty_strings'

// Types
export type Point3D = {
    x: number
    y: number
    z: number
}

export type Vector = {
    x: number
    y: number
    z: number
}

export type NormalizedVector = Vector

export type Line = {
    k: number
    m: number
}

export type RgbColorArray = [number, number, number]

type MapRenderOptions = {
    scaleDown: number
    blockSize: number
    drawStartingPoints?: boolean
    drawFogOfWar?: boolean
}

// Constants
const STARTING_POINT_COLOR = 'yellow'

const RGB_SAVANNAH: RgbColorArray = [50, 82, 56]
const RGB_MOUNTAIN: RgbColorArray = [140, 140, 140]
const RGB_SNOW: RgbColorArray = [220, 220, 220]
const RGB_SWAMP: RgbColorArray = [0, 110, 0]
const RGB_DESERT: RgbColorArray = [110, 0, 110]
const RGB_WATER: RgbColorArray = [56, 62, 140]
const RGB_LAVA: RgbColorArray = [110, 57, 48]
const RGB_MAGENTA: RgbColorArray = [99, 61, 99]

const INT_TO_VEGETATION_COLOR = new Map<number, RgbColorArray>([
    [0, RGB_SAVANNAH],
    [1, RGB_MOUNTAIN],
    [2, RGB_SNOW],
    [3, RGB_SWAMP],
    [4, RGB_DESERT],
    [5, RGB_WATER],
    [6, RGB_WATER],
    [7, RGB_DESERT],
    [8, RGB_SAVANNAH],
    [9, RGB_SAVANNAH],
    [10, RGB_SAVANNAH],
    [11, RGB_MOUNTAIN],
    [12, RGB_MOUNTAIN],
    [13, RGB_MOUNTAIN],
    [14, RGB_DESERT],
    [15, RGB_SAVANNAH],
    [16, RGB_LAVA],
    [17, RGB_MAGENTA],
    [18, RGB_SAVANNAH],
    [19, RGB_WATER],
    [20, RGB_LAVA],
    [21, RGB_LAVA],
    [22, RGB_LAVA],
    [23, RGB_MOUNTAIN]
])

// Functions
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

            terrain[count] = {
                point: point,
                below: terrainInformation.straightBelow[count],
                downRight: terrainInformation.belowToTheRight[count],
                height: terrainInformation.heights[count]
            }
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

    return normalize(normal)
}

function getDotProduct(v1: Vector, v2: Vector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}

function sumVectors(v1: Vector | undefined, v2: Vector | undefined): Vector {
    const vector1: Vector = v1 ?? { x: 0, y: 0, z: 0 }
    const vector2: Vector = v2 ?? { x: 0, y: 0, z: 0 }

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

function getPointUp(point: Point): Point {
    return {
        x: point.x,
        y: point.y + 2
    }
}

function getPointDown(point: Point): Point {
    return {
        x: point.x,
        y: point.y - 2
    }
}

function arrayToRgbStyle(rgb: number[]): string {
    return `rgb(${Math.floor(rgb[0])}, ${Math.floor(rgb[1])}, ${Math.floor(rgb[2])})`
}

function isRoadAtPoint(point: Point, roads: Map<RoadId, RoadInformation>): boolean {
    return Array.from(roads.values()).some(road =>
        road.id !== 'LOCAL' && road.points.some(roadPoint => roadPoint.x === point.x && roadPoint.y === point.y)
    )
}

function same(point1: Point, point2: Point): boolean {
    return point1.x === point2.x && point1.y === point2.y
}

function loadImageNg(src: string): Promise<HTMLImageElement> {
    console.log(`Loading ${src}`)

    return new Promise((resolve, reject) => {
        const image = new Image()

        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
    })
}

function getDirectionForWalkingWorker(from: Point, to: Point): Direction {
    if (to.x === from.x + 1 && to.y === from.y - 1) {
        return 'SOUTH_EAST'
    } else if (to.x === from.x - 1 && to.y === from.y - 1) {
        return 'SOUTH_WEST'
    } else if (to.x === from.x - 2) {
        return 'WEST'
    } else if (to.x === from.x - 1 && to.y === from.y + 1) {
        return 'NORTH_WEST'
    } else if (to.x === from.x + 1 && to.y === from.y + 1) {
        return 'NORTH_EAST'
    }

    return 'EAST'
}

function getHouseSize(house: HouseInformation): Size {
    if (SMALL_HOUSES.find(houseType => houseType === house.type)) {
        return 'SMALL'
    } else if (MEDIUM_HOUSES.find(houseType => houseType === house.type)) {
        return 'MEDIUM'
    }

    return 'LARGE'
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth
        canvas.height = displayHeight
    }

    return needResize
}

function pointStringToPoint(pointString: string): Point {
    const [x, y] = pointString.split(',').map(Number)
    return { x, y }
}

async function makeImageFromMap(
    map: MapInformation,
    renderOptions: MapRenderOptions,
    discovered: PointSet | undefined,
    houses: Iterable<HouseInformation> | undefined,
    roads: Iterable<RoadInformation> | undefined,
    players: Iterable<PlayerInformation> | undefined
): Promise<HTMLImageElement | undefined> {

    // Utility functions
    const pixelWidth = renderOptions.blockSize
    const pixelHeight = renderOptions.blockSize
    function drawPixel(ctx: CanvasRenderingContext2D, point: Point, color: RgbColorArray | string, transparency = 1) {
        if (typeof color === 'string') {
            ctx.fillStyle = color
        } else {
            ctx.fillStyle = arrayToRgbStyle(color)
        }

        ctx.globalAlpha = transparency

        ctx.fillRect(
            (point.x * pixelWidth / renderOptions.scaleDown) * 2 + pixelWidth, // x
            (map.height - point.y) * pixelHeight / renderOptions.scaleDown, // y
            pixelWidth, // width
            pixelHeight) // height
    }

    // Load data
    const terrainInformation = await api.getTerrainForMap(map.id)
    const terrain = terrainInformationToTerrainAtPointList(terrainInformation)

    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = map.width * 2 * renderOptions.blockSize / renderOptions.scaleDown
    offscreenCanvas.height = map.height * renderOptions.blockSize / renderOptions.scaleDown

    const ctx = offscreenCanvas.getContext('2d', { alpha: false })

    if (!ctx) {
        return undefined
    }

    const waterColor = INT_TO_VEGETATION_COLOR.get(WATER_1)

    if (waterColor) {
        ctx.fillStyle = arrayToRgbStyle(waterColor)
    } else {
        ctx.fillStyle = 'gray'
    }

    //ctx.fillRect(0, 0, map.width * 2 * renderOptions.blockSize / renderOptions.scaleDown, map.height * renderOptions.blockSize / renderOptions.scaleDown)

    terrain.forEach(({ point, below, downRight }) => {
        if (point.x % renderOptions.scaleDown === 0 && point.y % renderOptions.scaleDown === 0) {
            const colorBelow = INT_TO_VEGETATION_COLOR.get(below)
            const colorDownRight = INT_TO_VEGETATION_COLOR.get(downRight)

            // Use height - y to translate between context 2d coordinate system where (0, 0) is upper left
            // and the settlers game point where (0, 0) is bottom left
            if (colorBelow && [WATER_1, BUILDABLE_WATER, WATER_2].includes(below)) {
                drawPixel(ctx, { x: point.x / 2, y: point.y }, colorBelow)

                //ctx.fillStyle = arrayToRgbStyle(colorBelow)
                //ctx.fillRect(point.x * renderOptions.blockSize / renderOptions.scaleDown, (map.height - point.y) * renderOptions.blockSize / renderOptions.scaleDown, renderOptions.blockSize, renderOptions.blockSize)
            }

            if (colorDownRight && ![WATER_1, BUILDABLE_WATER, WATER_2].includes(downRight)) {
                drawPixel(ctx, { x: (point.x / 2) + 1, y: point.y }, colorDownRight)

                //ctx.fillStyle = arrayToRgbStyle(colorDownRight)
                //ctx.fillStyle = arrayToRgbStyle(colorDownRight)
                //ctx.fillRect((point.x * renderOptions.blockSize / renderOptions.scaleDown) + renderOptions.blockSize, (map.height - point.y) * renderOptions.blockSize / renderOptions.scaleDown, renderOptions.blockSize, renderOptions.blockSize)
            }
        }
    })

    // Draw starting points
    if (renderOptions.drawStartingPoints) {
        ctx.fillStyle = STARTING_POINT_COLOR
        map.startingPoints.forEach(({ x, y }) => {
            ctx.beginPath()
            ctx.arc(x * renderOptions.blockSize / renderOptions.scaleDown, (map.height - y) * renderOptions.blockSize / renderOptions.scaleDown, 3, 0, 2 * Math.PI)
            ctx.fill()
        })
    }

    // Draw player land
    if (players) {
        for (const player of players) {
            const color = playerToColor(player.color)

            player.ownedLand.forEach(point => {
                drawPixel(ctx, { x: point.x / 2, y: point.y }, color, 0.3)
            })
        }
    }

    ctx.globalAlpha = 1

    // Draw roads
    if (roads) {
        for (const road of roads) {
            road.points.forEach(point => {
                drawPixel(ctx, { x: point.x / 2, y: point.y }, 'burlywood')
            })
        }
    }

    // Draw houses
    if (houses) {
        for (const house of houses) {
            drawPixel(ctx, { x: house.x / 2, y: house.y }, 'white')
        }
    }

    // Draw fog of war
    if (renderOptions.drawFogOfWar && discovered) {
        ctx.fillStyle = 'black'

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width * 2; x++) {
                if (!discovered?.has({ x: x * 2 + ((y % 2 == 0) ? 0 : 1), y })) {
                    drawPixel(ctx, { x, y }, [0, 0, 0])
                }
            }
        }
    }


    const image = new Image()

    image.src = offscreenCanvas.toDataURL()

    return image
}


function canRemoveRoad(point: PointInformation): boolean {
    return point.is === 'ROAD'
}

function canRaiseFlag(point: PointInformation): boolean {
    return point.canBuild.includes('FLAG')
}

function canBuildHouse(point: PointInformation): boolean {
    return canBuildSmallHouse(point) || canBuildMediumHouse(point) || canBuildLargeHouse(point)
}

function canBuildLargeHouse(point: PointInformation): boolean {
    return point.canBuild.includes('LARGE')
}

function canBuildMediumHouse(point: PointInformation): boolean {
    return point.canBuild.includes('MEDIUM')
}

function canBuildSmallHouse(point: PointInformation): boolean {
    return point.canBuild.includes('SMALL')
}

function canBuildMine(point: PointInformation): boolean {
    return point.canBuild.includes('MINE')
}

function canBuildRoad(point: PointInformation): boolean {
    return point.is === 'FLAG'
}

function calcDistance(point0: Point, point1: Point): number {
    const dx = point0.x - point1.x
    const dy = point0.y - point1.y

    return Math.sqrt(dx * dx + dy * dy)
}

function findClosestHeightAdjustedPoint(
    screenPoint: Point,
    unadjustedGamePoint: Point,
    view: View,
    heightAdjust: number,
    allTiles: PointMap<TerrainAtPoint>
): Point | undefined {
    let distance = 2000
    let adjustedGamePoint: Point | undefined
    const downLeft = getPointDownLeft(unadjustedGamePoint)
    const downRight = getPointDownRight(unadjustedGamePoint)
    const down = getPointDown(unadjustedGamePoint)
    const downDownLeft = getPointDownLeft(down)
    const downDownRight = getPointDownRight(down)
    const downDown = getPointDown(down)
    const upLeft = getPointUpLeft(unadjustedGamePoint)
    const upRight = getPointUpRight(unadjustedGamePoint)
    const up = getPointUp(unadjustedGamePoint)
    const upUpLeft = getPointUpLeft(up)
    const upUpRight = getPointUpRight(up)

    const candidates = [
        unadjustedGamePoint,
        downLeft,
        downRight,
        down,
        downDownLeft,
        downDownRight,
        downDown,
        upLeft,
        upRight,
        up,
        upUpLeft,
        upUpRight
    ]

    for (const gamePoint of candidates) {
        const screenPointCandidate = gamePointToScreenPointWithHeightAdjustment(
            gamePoint,
            allTiles.get(gamePoint)?.height ?? 0,
            view,
            heightAdjust,
            STANDARD_HEIGHT
        )

        const candidateDistance = calcDistance(screenPointCandidate, screenPoint)

        if (candidateDistance < distance) {
            distance = candidateDistance
            adjustedGamePoint = gamePoint
        }
    }

    return adjustedGamePoint
}

function screenPointToGamePointWithHeightAdjustment(screenPoint: Point, view: View, heightAdjust: number): Point {
    const unadjustedGamePoint = screenPointToGamePointNoHeightAdjustment(screenPoint, view)

    const adjustedGamePoint = findClosestHeightAdjustedPoint(screenPoint, unadjustedGamePoint, view, heightAdjust, api.allTiles)

    return adjustedGamePoint ?? unadjustedGamePoint
}

function screenPointToGamePointNoHeightAdjustment(screenPoint: ScreenPoint, view: View): Point {
    const gameX = (screenPoint.x - view.translate.x) / view.scale
    const gameY = (view.screenSize.height - screenPoint.y + view.translate.y) / (view.scale)

    let roundedGameX = Math.round(gameX)
    let roundedGameY = Math.round(gameY)

    const faultX = gameX - roundedGameX
    const faultY = gameY - roundedGameY

    // Adjust to nearest valid point
    if ((roundedGameX + roundedGameY) % 2 !== 0) {
        if (Math.abs(faultX) > Math.abs(faultY)) {
            roundedGameX += faultX > 0 ? 1 : -1
        } else {
            roundedGameY += faultY > 0 ? 1 : -1
        }
    }

    return { x: roundedGameX, y: roundedGameY }
}

function gamePointToScreenPointWithHeightAdjustment(gamePoint: Point, height: number, view: View, heightAdjust: number, standardHeight: number): ScreenPoint {
    const adjustedPoint = {
        x: gamePoint.x,
        y: gamePoint.y + ((height - standardHeight) / heightAdjust)
    }

    return {
        x: adjustedPoint.x * view.scale + view.translate.x,
        y: view.screenSize.height - adjustedPoint.y * view.scale + view.translate.y
    }
}

function surroundingPoints(point: Point): Point[] {
    return [
        { x: point.x - 2, y: point.y },
        { x: point.x - 1, y: point.y + 1 },
        { x: point.x + 1, y: point.y + 1 },
        { x: point.x + 2, y: point.y },
        { x: point.x + 1, y: point.y - 1 },
        { x: point.x - 1, y: point.y - 1 }
    ]
}

function getFreeColor(players: PlayerInformation[]): PlayerColor | undefined {
    const colorsRemaining = new Set<PlayerColor>(PLAYER_COLORS)

    players.forEach(player => colorsRemaining.delete(player.color))

    return colorsRemaining.values().next().value
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export {
    getHouseSize,
    getDirectionForWalkingWorker,
    normalize,
    same,
    isRoadAtPoint,
    isContext2D,
    terrainInformationToTerrainAtPointList,
    arrayToRgbStyle,
    getPointLeft,
    getPointRight,
    getPointDownLeft,
    getPointDownRight,
    getPointUpLeft,
    getPointUpRight,
    getPointDown,
    getPointUp,
    getDotProduct,
    getNormalForTriangle,
    INT_TO_VEGETATION_COLOR,
    sumVectors,
    loadImageNg,
    resizeCanvasToDisplaySize,
    pointStringToPoint,
    makeImageFromMap,
    canRemoveRoad,
    canRaiseFlag,
    canBuildHouse,
    canBuildLargeHouse,
    canBuildMediumHouse,
    canBuildSmallHouse,
    canBuildMine,
    canBuildRoad,
    screenPointToGamePointNoHeightAdjustment,
    gamePointToScreenPointWithHeightAdjustment,
    surroundingPoints,
    screenPointToGamePointWithHeightAdjustment,
    calcDistance,
    getFreeColor,
    delay
}
