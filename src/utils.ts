import { Vegetation, TerrainInformation, TerrainAtPoint, Point, RoadId, RoadInformation, Direction, Size, HouseInformation, SMALL_HOUSES, MEDIUM_HOUSES, MapInformation, PointInformation, PlayerColor, PLAYER_COLORS, PlayerInformation } from './api/types'
import { api } from './api/ws-api'
import { ScreenPoint } from './render/game_render'
import { STANDARD_HEIGHT } from './render/constants'
import { PointMapFast } from './util_types'

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

// Constants
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

const intToVegetationColor = new Map<number, RgbColorArray>()

intToVegetationColor.set(0, [50, 82, 56])       // Savannah
intToVegetationColor.set(1, [140, 140, 140])   // Mountain 1
intToVegetationColor.set(2, [220, 220, 220])   // Snow
intToVegetationColor.set(3, [0, 110, 0])       // Swamp
intToVegetationColor.set(4, [110, 0, 110])     // Desert 1
intToVegetationColor.set(5, [56, 62, 140])       // Water
intToVegetationColor.set(6, [56, 62, 140])       // Buildable water
intToVegetationColor.set(7, [110, 0, 110])     // Desert 2
intToVegetationColor.set(8, [50, 82, 56])       // Meadow 1
intToVegetationColor.set(9, [50, 82, 56])       // Meadow 2
intToVegetationColor.set(10, [50, 82, 56])      // Meadow 3
intToVegetationColor.set(11, [140, 140, 140])  // Mountain 2
intToVegetationColor.set(12, [140, 140, 140])  // Mountain 3
intToVegetationColor.set(13, [140, 140, 140])  // Mountain 4
intToVegetationColor.set(14, [110, 0, 110])    // Steppe
intToVegetationColor.set(15, [50, 82, 56])      // Flower meadow
intToVegetationColor.set(16, [110, 57, 48])      // Lava 1
intToVegetationColor.set(17, [99, 61, 99])  // Magenta
intToVegetationColor.set(18, [50, 82, 56])    // Mountain meadow
intToVegetationColor.set(19, [56, 62, 140])      // Water 2
intToVegetationColor.set(20, [110, 57, 48])      // Lava 2
intToVegetationColor.set(21, [110, 57, 48])      // Lava 3
intToVegetationColor.set(22, [110, 57, 48])      // Lava 4
intToVegetationColor.set(23, [140, 140, 140])  // Buildable mountain

// Functions
function camelCaseToWords(camelCaseStr: string): string {
    return camelCaseStr.replace(/([A-Z])/g, ' $1').trim();
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

async function removeHouseOrFlagOrRoadAtPointWebsocket(point: Point, monitor: any): Promise<void> {
    const pointInformation = monitor.getInformationOnPointLocal(point)

    console.log({ title: "Remove house/flag/road via websocket", localPointInformation: pointInformation })

    if (pointInformation.is === "building") {
        monitor.removeBuilding(pointInformation.buildingId)
    }

    if (pointInformation.is === 'flag') {
        monitor.removeFlag(pointInformation.flagId)
    }

    if (pointInformation.is === 'road') {
        monitor.removeRoad(pointInformation.roadId)
    }
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
        return "SOUTH_EAST"
    } else if (to.x === from.x - 1 && to.y === from.y - 1) {
        return "SOUTH_WEST"
    } else if (to.x === from.x - 2) {
        return "WEST"
    } else if (to.x === from.x - 1 && to.y === from.y + 1) {
        return "NORTH_WEST"
    } else if (to.x === from.x + 1 && to.y === from.y + 1) {
        return "NORTH_EAST"
    }

    return "EAST"
}

function getHouseSize(house: HouseInformation): Size {
    if (SMALL_HOUSES.find(houseType => houseType === house.type)) {
        return 'SMALL'
    } else if (MEDIUM_HOUSES.find(houseType => houseType === house.type)) {
        return 'MEDIUM'
    }

    return 'LARGE'
}

function makeShader(gl: WebGL2RenderingContext, shaderSource: string, shaderType: number): WebGLShader | null {
    const compiledShader = gl.createShader(shaderType)

    if (compiledShader) {
        gl.shaderSource(compiledShader, shaderSource)
        gl.compileShader(compiledShader)

        const shaderCompileLog = gl.getShaderInfoLog(compiledShader)

        if (shaderCompileLog === "") {
            console.info("Shader compiled correctly")
        } else {
            console.error(shaderCompileLog)
        }
    } else {
        console.error("Failed to get the shader")
    }

    return compiledShader
}

function makeTextureFromImage(gl: WebGLRenderingContext, image: HTMLImageElement, flipYAxis: "FLIP_Y" | "NO_FLIP_Y" = "NO_FLIP_Y"): WebGLTexture | null {
    const texture = gl.createTexture()
    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE

    if (flipYAxis === "FLIP_Y") {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    } else {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    gl.generateMipmap(gl.TEXTURE_2D)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    return texture
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
    const indexOfComma = pointString.indexOf(',')

    const x = pointString.substring(0, indexOfComma)
    const y = pointString.substring(indexOfComma + 1, pointString.length)

    return { x: parseInt(x), y: parseInt(y) }
}

async function makeImageFromMap(map: MapInformation, scaleDown: number, blockSize: number): Promise<HTMLImageElement | undefined> {
    const terrainInformation = await api.getTerrainForMap(map.id)

    const terrain = terrainInformationToTerrainAtPointList(terrainInformation)

    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = map.width * 2 * blockSize / scaleDown
    offscreenCanvas.height = map.height * blockSize / scaleDown

    const ctx = offscreenCanvas.getContext("2d", { alpha: false })

    if (!ctx) {
        return undefined
    }

    const waterIntValue0 = vegetationToInt.get("W1")
    const waterIntValue1 = vegetationToInt.get("W2")
    const waterIntValue2 = vegetationToInt.get("B")

    if (waterIntValue0 !== undefined && waterIntValue1 !== undefined && waterIntValue2 !== undefined) {
        const waterColor = intToVegetationColor.get(waterIntValue0)

        if (waterColor) {
            ctx.fillStyle = arrayToRgbStyle(waterColor)
        } else {
            ctx.fillStyle = "gray"
        }
    }

    ctx.rect(0, 0, map.width * 2 * blockSize / scaleDown, map.height * blockSize / scaleDown)

    ctx.fill()

    terrain.forEach(pointTerrainInformation => {
        const point = pointTerrainInformation.point

        if (point.x % scaleDown === 0 && point.y % scaleDown === 0) {
            const colorStraightBelow = intToVegetationColor.get(pointTerrainInformation.below)
            const colorBelowToTheRight = intToVegetationColor.get(pointTerrainInformation.downRight)

            // Use height - y to translate between context 2d coordinate system where (0, 0) is upper left
            // and the settlers game point where (0, 0) is bottom left
            if (colorStraightBelow &&
                pointTerrainInformation.below !== waterIntValue0 &&
                pointTerrainInformation.below !== waterIntValue1 &&
                pointTerrainInformation.below !== waterIntValue2) {
                ctx.beginPath()
                ctx.fillStyle = arrayToRgbStyle(colorStraightBelow)
                ctx.rect(point.x * blockSize / scaleDown, (map.height - point.y) * blockSize / scaleDown, blockSize, blockSize)
                ctx.fill()
            }

            if (colorBelowToTheRight &&
                pointTerrainInformation.downRight !== waterIntValue0 &&
                pointTerrainInformation.downRight !== waterIntValue1 &&
                pointTerrainInformation.downRight !== waterIntValue2) {
                ctx.beginPath()
                ctx.fillStyle = arrayToRgbStyle(colorBelowToTheRight)
                ctx.rect((point.x * blockSize / scaleDown) + blockSize, (map.height - point.y) * blockSize / scaleDown, blockSize, blockSize)
                ctx.fill()
            }
        }
    })

    /* Draw the starting points */
    ctx.fillStyle = 'yellow'
    map.startingPoints.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x * blockSize / scaleDown, (map.height - point.y) * blockSize / scaleDown, 3, 0, 2 * Math.PI)
        ctx.fill()
    })

    const image = new Image()

    image.src = offscreenCanvas.toDataURL()

    return image
}


function canRemoveRoad(point: PointInformation): boolean {
    if (point.is === "road") {
        return true
    }

    return false
}

function canRaiseFlag(point: PointInformation): boolean {
    if (point.canBuild.find(x => x === "flag")) {
        return true
    }

    return false
}

function canBuildHouse(point: PointInformation): boolean {
    if (canBuildSmallHouse(point) || canBuildMediumHouse(point) || canBuildLargeHouse(point)) {
        return true
    }

    return false
}

function canBuildLargeHouse(point: PointInformation): boolean {
    if (point.canBuild.find(x => x === "large")) {
        return true
    }

    return false
}

function canBuildMediumHouse(point: PointInformation): boolean {
    if (point.canBuild.find(x => x === "medium")) {
        return true
    }

    return false
}

function canBuildSmallHouse(point: PointInformation): boolean {
    if (point.canBuild.find(x => x === "small")) {
        return true
    }

    return false
}

function canBuildMine(point: PointInformation): boolean {
    if (point.canBuild.find(x => x === "mine")) {
        return true
    }

    return false
}

function canBuildRoad(point: PointInformation): boolean {
    return point.is === "flag"
}

function calcDistance(point0: Point, point1: Point): number {
    const dx = point0.x - point1.x
    const dy = point0.y - point1.y

    return Math.sqrt(dx * dx + dy * dy)
}

function findClosestHeightAdjustedPoint(
    screenPoint: Point,
    unadjustedGamePoint: Point,
    translate: Point,
    scale: number,
    screenHeight: number,
    heightAdjust: number,
    allTiles: PointMapFast<TerrainAtPoint>
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
            translate.x,
            translate.y,
            scale,
            screenHeight,
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

function screenPointToGamePointWithHeightAdjustment(screenPoint: Point, translate: Point, scale: number, screenHeight: number, heightAdjust: number): Point {
    const unadjustedGamePoint = screenPointToGamePointNoHeightAdjustment(
        screenPoint,
        translate.x,
        translate.y,
        scale,
        screenHeight
    )

    const adjustedGamePoint = findClosestHeightAdjustedPoint(screenPoint, unadjustedGamePoint, translate, scale, screenHeight, heightAdjust, api.allTiles)

    return adjustedGamePoint ?? unadjustedGamePoint
}

function screenPointToGamePointNoHeightAdjustment(screenPoint: ScreenPoint, translateX: number, translateY: number, scale: number, screenHeight: number): Point {
    const gameX = (screenPoint.x - translateX) / scale
    const gameY = (screenHeight - screenPoint.y + translateY) / (scale)

    let roundedGameX = Math.round(gameX)
    let roundedGameY = Math.round(gameY)

    const faultX = gameX - roundedGameX
    const faultY = gameY - roundedGameY

    /* Call the handler directly if both points are odd or even */
    if ((roundedGameX + roundedGameY) % 2 !== 0) {

        /* Find the closest valid point (odd-odd, or even-even) */
        if (Math.abs(faultX) > Math.abs(faultY)) {

            if (faultX > 0) {
                roundedGameX++
            } else {
                roundedGameX--
            }
        } else if (Math.abs(faultX) < Math.abs(faultY)) {
            if (faultY > 0) {
                roundedGameY++
            } else {
                roundedGameY--
            }
        } else {
            roundedGameX++
        }
    }

    return { x: roundedGameX, y: roundedGameY }
}

function gamePointToScreenPointWithHeightAdjustment(gamePoint: Point, height: number, translateX: number, translateY: number, scale: number, screenHeight: number, heightAdjust: number, standardHeight: number): ScreenPoint {
    const adjustedPoint = {
        x: gamePoint.x,
        y: gamePoint.y + ((height - standardHeight) / heightAdjust)
    }

    return {
        x: adjustedPoint.x * scale + translateX,
        y: screenHeight - adjustedPoint.y * scale + translateY
    }
}

function surroundingPoints(point: Point) {
    return [
        { x: point.x - 2, y: point.y },
        { x: point.x - 1, y: point.y + 1 },
        { x: point.x + 1, y: point.y + 1 },
        { x: point.x + 2, y: point.y },
        { x: point.x + 1, y: point.y - 1 },
        { x: point.x - 1, y: point.y - 1 }
    ]
}

function getFreeColor(players: PlayerInformation[]): PlayerColor {
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
    camelCaseToWords,
    vegetationToInt,
    intToVegetationColor,
    sumVectors,
    loadImageNg,
    makeShader,
    makeTextureFromImage,
    resizeCanvasToDisplaySize,
    removeHouseOrFlagOrRoadAtPointWebsocket,
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
