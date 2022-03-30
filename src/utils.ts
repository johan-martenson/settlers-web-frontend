import { AnyBuilding, CropGrowth, CropType, DecorationType, Direction, FireSize, FlagType, GameId, getHousesForPlayer, getInformationOnPoint, HouseInformation, Material, MEDIUM_HOUSES, Nation, NationSmallCaps, PlayerId, Point, removeFlag, removeHouse, removeRoad, RoadId, RoadInformation, SignTypes, Size, SMALL_HOUSES, StoneAmount, StoneType, TerrainAtPoint, TerrainInformation, TreeType, Vegetation } from './api'

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

function arrayToRgbStyle(rgb: number[]): string {
    return 'rgb(' + Math.floor(rgb[0]) + ', ' + Math.floor(rgb[1]) + ', ' + Math.floor(rgb[2]) + ')'
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

function getTimestamp(): number {
    const date = new Date()
    const timestamp = date.getTime()

    return timestamp
}

function loadImageNg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
    })
}

function loadImage(source: string, onLoad: ((image: HTMLImageElement, source: string) => void)): void {
    const image = new Image()

    image.addEventListener("load",
        () => {
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

class FlagAnimation {
    private imageAtlasHandler: FlagImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new FlagImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    async load() {
        this.imageAtlasHandler.load()
    }

    getAnimationFrame(nation: NationSmallCaps, flagType: FlagType, animationIndex: number, offset: number) {
        return this.imageAtlasHandler.getDrawingInformationFor(nation, flagType, Math.floor((animationIndex + offset) / this.speedAdjust))
    }
}

class TreeAnimation {
    private imageAtlasHandler: TreeImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new TreeImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    async load() {
        this.imageAtlasHandler.load()
    }

    getAnimationFrame(treeType: TreeType, animationIndex: number, offset: number) {
        return this.imageAtlasHandler.getDrawingInformationFor(treeType, Math.floor((animationIndex + offset) / this.speedAdjust))
    }
}

class FireAnimation {
    private imageAtlasHandler: FireImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new FireImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    async load() {
        this.imageAtlasHandler.load()
    }

    getAnimationFrame(size: FireSize, animationIndex: number) {
        return this.imageAtlasHandler.getDrawingInformation(size, Math.floor(animationIndex / this.speedAdjust))
    }
}

class AnimalAnimation {

    private imageAtlasHandler: AnimalImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, name: string, speedAdjust: number) {
        this.imageAtlasHandler = new AnimalImageAtlasHandler(prefix, name)
        this.speedAdjust = speedAdjust
    }

    async load() {
        this.imageAtlasHandler.load()
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(direction, Math.floor((animationIndex + percentageTraveled) / this.speedAdjust))
    }
}

class WorkerAnimationNew {
    private imageAtlasHandler: ImageAtlasHandler

    private speedAdjust: number

    constructor(prefix: string, postfix: string, speedAdjust: number) {

        this.imageAtlasHandler = new ImageAtlasHandler(prefix, postfix)

        this.speedAdjust = speedAdjust
    }

    load() {
        this.imageAtlasHandler.load()
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor("romans", direction, Math.floor(animationIndex / this.speedAdjust), percentageTraveled)
    }
}

interface OneDirectionImageAtlasAnimationInfo {
    height: number
    width: number
    nrImages: number
    startX: number
    startY: number
    offsetX?: number
    offsetY?: number
}

export interface DrawingInformation {
    sourceX: number
    sourceY: number
    width: number
    height: number
    offsetX: number
    offsetY: number
    image: HTMLImageElement
}

class ImageAtlasHandler {
    private pathPrefix: string
    private name: string
    private imageAtlasInfo?: Record<NationSmallCaps, Record<Direction, OneDirectionImageAtlasAnimationInfo>>
    private image?: HTMLImageElement

    constructor(prefix: string, name: string) {

        this.pathPrefix = prefix
        this.name = name
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-" + this.name + ".json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-" + this.name + ".png")
    }

    getDrawingInformationFor(nation: NationSmallCaps, direction: Direction, animationCounter: number, offset: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerNation = this.imageAtlasInfo[nation]

        if (infoPerNation === undefined) {
            return undefined
        }

        const infoPerDirection = infoPerNation[direction]

        const frameIndex = (animationCounter + offset) % infoPerDirection.nrImages

        return {
            sourceX: infoPerDirection.startX + frameIndex * infoPerDirection.width,
            sourceY: infoPerDirection.startY,
            width: infoPerDirection.width,
            height: infoPerDirection.height, // Verify that this goes in the right direction
            offsetX: 0,
            offsetY: 0,
            image: this.image
        }
    }
}

interface HouseImageInformation {
    y: number
    readyAtX: number
    readyWidth: number
    readyHeight: number,
    readyOffsetX: number
    readyOffsetY: number
    underConstructionAtX: number
    underConstructionWidth: number
    underConstructionHeight: number
    underConstructionOffsetX: number
    underConstructionOffsetY: number
}

interface HouseImageAtlasInformation {
    buildings: Record<NationSmallCaps, Record<AnyBuilding, HouseImageInformation>>
    constructionPlanned: Record<NationSmallCaps, OneImageInformation>
    constructionJustStarted: Record<NationSmallCaps, OneImageInformation>
}

class HouseImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: HouseImageAtlasInformation
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-buildings.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-buildings.png")

        console.log({ info: imageAtlasInfo, image: this.image })
    }

    getDrawingInformationForHouseJustStarted(nation: NationSmallCaps): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionJustStarted[nation]

        return {
            sourceX: houseInformation.x,
            sourceY: houseInformation.y,
            width: houseInformation.width,
            height: houseInformation.height,
            offsetX: houseInformation.offsetX,
            offsetY: houseInformation.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHousePlanned(nation: NationSmallCaps): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionPlanned[nation]

        return {
            sourceX: houseInformation.x,
            sourceY: houseInformation.y,
            width: houseInformation.width,
            height: houseInformation.height,
            offsetX: houseInformation.offsetX,
            offsetY: houseInformation.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHouseReady(nation: NationSmallCaps, houseType: AnyBuilding): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformationForNation = this.imageAtlasInfo.buildings[nation]

        const houseInformation = houseInformationForNation[houseType]

        return {
            sourceX: houseInformation.readyAtX,
            sourceY: houseInformation.y,
            width: houseInformation.readyWidth,
            height: houseInformation.readyHeight,
            offsetX: houseInformation.readyOffsetX,
            offsetY: houseInformation.readyOffsetY,
            image: this.image
        }
    }

    getDrawingInformationForHouseUnderConstruction(nation: NationSmallCaps, houseType: AnyBuilding): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformationForNation = this.imageAtlasInfo.buildings[nation]

        const houseInformation = houseInformationForNation[houseType]

        return {
            sourceX: houseInformation.underConstructionAtX,
            sourceY: houseInformation.y,
            width: houseInformation.underConstructionWidth,
            height: houseInformation.underConstructionHeight,
            offsetX: houseInformation.underConstructionOffsetX,
            offsetY: houseInformation.underConstructionOffsetY,
            image: this.image
        }
    }
}

interface OneImageInformation {
    x: number
    y: number
    width: number
    height: number
    offsetX: number
    offsetY: number
}

class BorderImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<NationSmallCaps, Record<"landBorder" | "coastBorder", OneImageInformation>>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-border.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-border.png")

        console.log({ info: imageAtlasInfo, image: this.image })
    }

    getDrawingInformation(nation: NationSmallCaps, type: "LAND" | "COAST"): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerNation = this.imageAtlasInfo[nation]

        let imageInfo = infoPerNation["landBorder"]

        if (type === "COAST") {
            imageInfo = infoPerNation["coastBorder"]
        }

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image
        }
    }
}

class SignImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<SignTypes, Record<Size, OneImageInformation>>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-signs.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-signs.png")

        console.log({ info: imageAtlasInfo, image: this.image })
    }

    getDrawingInformation(signType: SignTypes, size: Size): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerSize = this.imageAtlasInfo[signType]

        const imageInfo = infoPerSize[size]

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image
        }
    }
}

class FireImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<FireSize, OneDirectionImageAtlasAnimationInfo>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-fire.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-fire.png")

        console.log({ info: imageAtlasInfo, image: this.image })
    }

    getDrawingInformation(size: FireSize, animationIndex: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerFireSize = this.imageAtlasInfo[size]

        const frameIndex = animationIndex % infoPerFireSize.nrImages

        let offsetX = 0
        let offsetY = 0

        if (infoPerFireSize.offsetX !== undefined) {
            offsetX = infoPerFireSize.offsetX
        }

        if (infoPerFireSize.offsetY !== undefined) {
            offsetY = infoPerFireSize.offsetY
        }

        return {
            sourceX: infoPerFireSize.startX + frameIndex * infoPerFireSize.width,
            sourceY: infoPerFireSize.startY,
            width: infoPerFireSize.width,
            height: infoPerFireSize.height,
            offsetX: offsetX,
            offsetY: offsetY,
            image: this.image
        }
    }
}

class FlagImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<NationSmallCaps, Record<FlagType, OneDirectionImageAtlasAnimationInfo>>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-flags.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-flags.png")
    }

    getDrawingInformationFor(nation: NationSmallCaps, flagType: FlagType, animationCounter: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerNation = this.imageAtlasInfo[nation]

        const infoPerFlagType = infoPerNation[flagType]

        const frameIndex = (animationCounter) % infoPerFlagType.nrImages

        let offsetX = 0
        let offsetY = 0

        if (infoPerFlagType.offsetX !== undefined) {
            offsetX = infoPerFlagType.offsetX
        }

        if (infoPerFlagType.offsetY !== undefined) {
            offsetY = infoPerFlagType.offsetY
        }

        return {
            sourceX: infoPerFlagType.startX + frameIndex * infoPerFlagType.width,
            sourceY: infoPerFlagType.startY,
            width: infoPerFlagType.width,
            height: infoPerFlagType.height, // Verify that this goes in the right direction
            offsetX: offsetX,
            offsetY: offsetY,
            image: this.image
        }
    }
}

interface CargoInformation {
    generic: Record<Material, OneImageInformation>
    nationSpecific: Record<Nation, Record<Material, OneImageInformation>>
}

class CargoImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: CargoInformation
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-cargos.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-cargos.png")

        console.log({ img: this.image, info: this.imageAtlasInfo })
    }

    getDrawingInformation(nation: Nation, material: Material): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const genericInfo = this.imageAtlasInfo.generic[material]

        if (genericInfo !== undefined) {
            return {
                sourceX: genericInfo.x,
                sourceY: genericInfo.y,
                width: genericInfo.width,
                height: genericInfo.height,
                offsetX: genericInfo.offsetX,
                offsetY: genericInfo.offsetY,
                image: this.image
            }
        }

        const nationSpecificInfo = this.imageAtlasInfo.nationSpecific[nation]

        if (nationSpecificInfo !== undefined && nationSpecificInfo[material] !== undefined) {

            const drawInfo = nationSpecificInfo[material]

            return {
                sourceX: drawInfo.x,
                sourceY: drawInfo.y,
                width: drawInfo.width,
                height: drawInfo.height,
                offsetX: drawInfo.offsetX,
                offsetY: drawInfo.offsetY,
                image: this.image
            }
        }

        return undefined
    }
}

interface RoadBuildingInfo {
    startPoint: OneImageInformation
    sameLevelConnection: OneImageInformation
    upwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImageInformation>
    downwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImageInformation>
}

class RoadBuildingImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: RoadBuildingInfo
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-road-building.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-road-building.png")

        console.log({ img: this.image, info: this.imageAtlasInfo })
    }

    getDrawingInformationForStartPoint(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const startPointInfo = this.imageAtlasInfo.startPoint

        return {
            sourceX: startPointInfo.x,
            sourceY: startPointInfo.y,
            width: startPointInfo.width,
            height: startPointInfo.height,
            offsetX: startPointInfo.offsetX,
            offsetY: startPointInfo.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForSameLevelConnection(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const sameLevelConnectionInfo = this.imageAtlasInfo.sameLevelConnection

        return {
            sourceX: sameLevelConnectionInfo.x,
            sourceY: sameLevelConnectionInfo.y,
            width: sameLevelConnectionInfo.width,
            height: sameLevelConnectionInfo.height,
            offsetX: sameLevelConnectionInfo.offsetX,
            offsetY: sameLevelConnectionInfo.offsetY,
            image: this.image
        }
    }
}

class TreeImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<TreeType, OneDirectionImageAtlasAnimationInfo>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-trees.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-trees.png")
    }

    getDrawingInformationFor(treeType: TreeType, animationCounter: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerTreeType = this.imageAtlasInfo[treeType]

        const frameIndex = (animationCounter) % infoPerTreeType.nrImages

        let offsetX = 0
        let offsetY = 0

        if (infoPerTreeType?.offsetX !== undefined) {
            offsetX = infoPerTreeType.offsetX
        }

        if (infoPerTreeType?.offsetY !== undefined) {
            offsetY = infoPerTreeType.offsetY
        }

        return {
            sourceX: infoPerTreeType.startX + frameIndex * infoPerTreeType.width,
            sourceY: infoPerTreeType.startY,
            width: infoPerTreeType.width,
            height: infoPerTreeType.height, // Verify that this goes in the right direction
            offsetX: offsetX,
            offsetY: offsetY,
            image: this.image
        }
    }
}

interface UiElementsImageAtlasInfo {
    selectedPoint: OneImageInformation
    hoverPoint: OneImageInformation
    hoverAvailableFlag: OneImageInformation
    hoverAvailableMine: OneImageInformation
    hoverAvailableHarbor: OneImageInformation
    hoverAvailableBuildingLarge: OneImageInformation
    hoverAvailableBuildingMedium: OneImageInformation
    hoverAvailableBuildingSmall: OneImageInformation
    availableFlag: OneImageInformation
    availableMine: OneImageInformation
    availableBuildingHarbor: OneImageInformation
    availableBuildingLarge: OneImageInformation
    availableBuildingMedium: OneImageInformation
    availableBuildingSmall: OneImageInformation
}

class UielementsImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: UiElementsImageAtlasInfo
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-ui-elements.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-ui-elements.png")
    }

    getDrawingInformationForSelectedPoint(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.selectedPoint.x,
            sourceY: this.imageAtlasInfo.selectedPoint.y,
            width: this.imageAtlasInfo.selectedPoint.width,
            height: this.imageAtlasInfo.selectedPoint.height,
            offsetX: this.imageAtlasInfo.selectedPoint.offsetX,
            offsetY: this.imageAtlasInfo.selectedPoint.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverPoint(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverPoint.x,
            sourceY: this.imageAtlasInfo.hoverPoint.y,
            width: this.imageAtlasInfo.hoverPoint.width,
            height: this.imageAtlasInfo.hoverPoint.height,
            offsetX: this.imageAtlasInfo.hoverPoint.offsetX,
            offsetY: this.imageAtlasInfo.hoverPoint.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForLargeHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.availableBuildingLarge.x,
            sourceY: this.imageAtlasInfo.availableBuildingLarge.y,
            width: this.imageAtlasInfo.availableBuildingLarge.width,
            height: this.imageAtlasInfo.availableBuildingLarge.height,
            offsetX: this.imageAtlasInfo.availableBuildingLarge.offsetX,
            offsetY: this.imageAtlasInfo.availableBuildingLarge.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForMediumHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.availableBuildingMedium.x,
            sourceY: this.imageAtlasInfo.availableBuildingMedium.y,
            width: this.imageAtlasInfo.availableBuildingMedium.width,
            height: this.imageAtlasInfo.availableBuildingMedium.height,
            offsetX: this.imageAtlasInfo.availableBuildingMedium.offsetX,
            offsetY: this.imageAtlasInfo.availableBuildingMedium.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForSmallHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.availableBuildingSmall.x,
            sourceY: this.imageAtlasInfo.availableBuildingSmall.y,
            width: this.imageAtlasInfo.availableBuildingSmall.width,
            height: this.imageAtlasInfo.availableBuildingSmall.height,
            offsetX: this.imageAtlasInfo.availableBuildingSmall.offsetX,
            offsetY: this.imageAtlasInfo.availableBuildingSmall.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForMineAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.availableMine.x,
            sourceY: this.imageAtlasInfo.availableMine.y,
            width: this.imageAtlasInfo.availableMine.width,
            height: this.imageAtlasInfo.availableMine.height,
            offsetX: this.imageAtlasInfo.availableMine.offsetX,
            offsetY: this.imageAtlasInfo.availableMine.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForFlagAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.availableFlag.x,
            sourceY: this.imageAtlasInfo.availableFlag.y,
            width: this.imageAtlasInfo.availableFlag.width,
            height: this.imageAtlasInfo.availableFlag.height,
            offsetX: this.imageAtlasInfo.availableFlag.offsetX,
            offsetY: this.imageAtlasInfo.availableFlag.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverLargeHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverAvailableBuildingLarge.x,
            sourceY: this.imageAtlasInfo.hoverAvailableBuildingLarge.y,
            width: this.imageAtlasInfo.hoverAvailableBuildingLarge.width,
            height: this.imageAtlasInfo.hoverAvailableBuildingLarge.height,
            offsetX: this.imageAtlasInfo.hoverAvailableBuildingLarge.offsetX,
            offsetY: this.imageAtlasInfo.hoverAvailableBuildingLarge.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverMediumHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverAvailableBuildingMedium.x,
            sourceY: this.imageAtlasInfo.hoverAvailableBuildingMedium.y,
            width: this.imageAtlasInfo.hoverAvailableBuildingMedium.width,
            height: this.imageAtlasInfo.hoverAvailableBuildingMedium.height,
            offsetX: this.imageAtlasInfo.hoverAvailableBuildingMedium.offsetX,
            offsetY: this.imageAtlasInfo.hoverAvailableBuildingMedium.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverSmallHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverAvailableBuildingSmall.x,
            sourceY: this.imageAtlasInfo.hoverAvailableBuildingSmall.y,
            width: this.imageAtlasInfo.hoverAvailableBuildingSmall.width,
            height: this.imageAtlasInfo.hoverAvailableBuildingSmall.height,
            offsetX: this.imageAtlasInfo.hoverAvailableBuildingSmall.offsetX,
            offsetY: this.imageAtlasInfo.hoverAvailableBuildingSmall.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverMineAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverAvailableMine.x,
            sourceY: this.imageAtlasInfo.hoverAvailableMine.y,
            width: this.imageAtlasInfo.hoverAvailableMine.width,
            height: this.imageAtlasInfo.hoverAvailableMine.height,
            offsetX: this.imageAtlasInfo.hoverAvailableMine.offsetX,
            offsetY: this.imageAtlasInfo.hoverAvailableMine.offsetY,
            image: this.image
        }
    }

    getDrawingInformationForHoverFlagAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            sourceX: this.imageAtlasInfo.hoverAvailableFlag.x,
            sourceY: this.imageAtlasInfo.hoverAvailableFlag.y,
            width: this.imageAtlasInfo.hoverAvailableFlag.width,
            height: this.imageAtlasInfo.hoverAvailableFlag.height,
            offsetX: this.imageAtlasInfo.hoverAvailableFlag.offsetX,
            offsetY: this.imageAtlasInfo.hoverAvailableFlag.offsetY,
            image: this.image
        }
    }
}

class StoneImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<StoneType, Record<StoneAmount, OneImageInformation>>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-stones.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-stones.png")
    }

    getDrawingInformationFor(stoneType: StoneType, amount: StoneAmount): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerStoneType = this.imageAtlasInfo[stoneType]
        const imageInfo = infoPerStoneType[amount]

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image
        }
    }
}

class DecorationsImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<DecorationType, OneImageInformation>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-decorations.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-decorations.png")
    }

    getDrawingInformationFor(decorationType: DecorationType): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo[decorationType]

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image
        }
    }
}

class CropImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<CropType, Record<CropGrowth, OneImageInformation>>
    private image?: HTMLImageElement

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-crops.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-crops.png")
    }

    getDrawingInformationFor(cropType: CropType, growth: CropGrowth): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerCropType = this.imageAtlasInfo[cropType]
        const imageInfo = infoPerCropType[growth]

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image
        }
    }
}

class AnimalImageAtlasHandler {
    private pathPrefix: string
    private name: string
    private imageAtlasInfo?: Record<Direction, OneDirectionImageAtlasAnimationInfo>
    private image?: HTMLImageElement

    constructor(prefix: string, name: string) {

        this.pathPrefix = prefix
        this.name = name
    }

    async load() {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-" + this.name + ".json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-" + this.name + ".png")
    }

    getDrawingInformationFor(direction: Direction, animationCounter: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const infoPerDirection = this.imageAtlasInfo[direction]

        const frameIndex = (animationCounter) % infoPerDirection.nrImages

        let offsetX = 0
        let offsetY = 0

        if (infoPerDirection?.offsetX !== undefined) {
            offsetX = infoPerDirection.offsetX
        }

        if (infoPerDirection?.offsetY !== undefined) {
            offsetY = infoPerDirection.offsetY
        }

        return {
            sourceX: infoPerDirection.startX + frameIndex * infoPerDirection.width,
            sourceY: infoPerDirection.startY,
            width: infoPerDirection.width,
            height: infoPerDirection.height, // Verify that this goes in the right direction
            offsetX: offsetX,
            offsetY: offsetY,
            image: this.image
        }
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

function getHouseSize(house: HouseInformation): Size {
    if (SMALL_HOUSES.find(houseType => houseType === house.type)) {
        return 'SMALL'
    } else if (MEDIUM_HOUSES.find(houseType => houseType === house.type)) {
        return 'MEDIUM'
    }

    return 'LARGE'
}

function nationLowerCaseToAllCaps(nationSmall: NationSmallCaps): Nation {
    if (nationSmall === 'romans') {
        return 'ROMANS'
    } else if (nationSmall === 'africans') {
        return 'AFRICANS'
    } else if (nationSmall === 'japanese') {
        return 'JAPANESE'
    } else {
        return 'VIKINGS'
    }
}

export {
    getHouseSize,
    getDirectionForWalkingWorker,
    loadImage,
    loadImages,
    getTimestamp,
    normalize,
    same,
    removeHouseOrFlagOrRoadAtPoint,
    isRoadAtPoint,
    almostEquals,
    removeHouseAtPoint,
    isContext2D,
    terrainInformationToTerrainAtPointList,
    arrayToRgbStyle,
    getPointLeft,
    getPointRight,
    getPointDownLeft,
    getPointDownRight,
    getPointUpLeft,
    getPointUpRight,
    getLineBetweenPoints,
    getDotProduct,
    getNormalForTriangle,
    camelCaseToWords,
    vegetationToInt,
    intToVegetationColor,
    sumVectors,
    loadImageNg,
    ImageAtlasHandler as WorkerAnimationBasedOnImageAtlas,
    WorkerAnimationNew,
    AnimalAnimation,
    TreeAnimation,
    FlagAnimation,
    FireAnimation,
    HouseImageAtlasHandler,
    SignImageAtlasHandler,
    UielementsImageAtlasHandler,
    CropImageAtlasHandler,
    StoneImageAtlasHandler,
    DecorationsImageAtlasHandler,
    BorderImageAtlasHandler,
    RoadBuildingImageAtlasHandler,
    CargoImageAtlasHandler
}
