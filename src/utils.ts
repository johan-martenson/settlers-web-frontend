import { getInformationOnPoint, getTerrainForMap, removeHouse } from './api/rest-api'
import { Vegetation, TerrainInformation, TerrainAtPoint, Point, RoadId, RoadInformation, GameId, PlayerId, NationSmallCaps, TreeType, FireSize, Direction, WorkerAction, MaterialAllUpperCase, Nation, ShipConstructionProgress, AnyBuilding, SignTypes, Size, TreeSize, StoneType, StoneAmount, DecorationType, CropType, CropGrowth, HouseInformation, SMALL_HOUSES, MEDIUM_HOUSES, MapInformation, PointInformation } from './api/types'
import { Monitor, monitor } from './api/ws-api'
import { ScreenPoint } from './game_render'

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

let reported = new Set()

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

function isRoadAtPoint(point: Point, roads: Map<RoadId, RoadInformation>): boolean {

    let found = false

    for (const road of roads.values()) {

        if (road.id === 'LOCAL') {
            continue
        }

        road.points.forEach(
            roadPoint => {

                if (point.x === roadPoint.x && point.y === roadPoint.y) {
                    found = true
                }
            }
        )
    }

    return found
}

async function removeHouseOrFlagOrRoadAtPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {

    const pointInformation = await getInformationOnPoint(point, gameId, playerId)

    if (pointInformation.is === "building" && pointInformation.buildingId) {
        await removeHouse(pointInformation.buildingId, playerId, gameId)
    } else if (pointInformation.is === "flag" && pointInformation.flagId) {
        monitor.removeFlag(pointInformation.flagId)
    } else if (pointInformation.is === "road" && pointInformation.roadId) {
        monitor.removeRoad(pointInformation.roadId)
    }
}

async function removeHouseOrFlagOrRoadAtPointWebsocket(point: Point, monitor: Monitor): Promise<void> {

    const pointInformation = monitor.getInformationOnPointLocal(point)

    console.log({ title: "Remove house/flag/road via websocket", localPointInformation: pointInformation })

    if (pointInformation.is === "building" && pointInformation.buildingId) {
        monitor.removeBuilding(pointInformation.buildingId)
    }

    if (pointInformation.flagId !== undefined) {
        monitor.removeFlag(pointInformation.flagId)
    }

    if (pointInformation.roadId !== undefined) {
        monitor.removeRoad(pointInformation.roadId)
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
        const image = new Image()

        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
    })
}

class TreeAnimation {
    private imageAtlasHandler: TreeImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new TreeImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    getImageAtlasHandler(): TreeImageAtlasHandler {
        return this.imageAtlasHandler
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    makeTexture(gl: WebGL2RenderingContext): void {
        this.imageAtlasHandler.makeTexture(gl)
    }

    getAnimationFrame(treeType: TreeType, animationIndex: number, offset: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationForGrownTree(treeType, Math.floor((animationIndex + offset) / this.speedAdjust))
    }

    getFallingTree(treeType: TreeType, step: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationForFallingTree(treeType, step)
    }
}

class FireAnimation {
    private imageAtlasHandler: FireImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new FireImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    makeTexture(gl: WebGL2RenderingContext): void {
        this.imageAtlasHandler.makeTexture(gl)
    }

    getAnimationFrame(size: FireSize, animationIndex: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getFireDrawingInformation(size, Math.floor(animationIndex / this.speedAdjust))
    }

    getImageAtlasHandler(): FireImageAtlasHandler {
        return this.imageAtlasHandler
    }
}

class AnimalAnimation {
    private imageAtlasHandler: AnimalImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, name: string, speedAdjust: number) {
        this.imageAtlasHandler = new AnimalImageAtlasHandler(prefix, name)
        this.speedAdjust = speedAdjust
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    makeTexture(gl: WebGL2RenderingContext): void {
        this.imageAtlasHandler.makeTexture(gl)
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(direction, Math.floor((animationIndex + percentageTraveled) / this.speedAdjust))
    }

    getImageAtlasHandler(): AnimalImageAtlasHandler {
        return this.imageAtlasHandler
    }
}

export interface Dimension {
    width: number
    height: number
}

class WorkerAnimation {
    private imageAtlasHandler: WorkerImageAtlasHandler

    private speedAdjust: number

    constructor(prefix: string, postfix: string, speedAdjust: number) {

        this.imageAtlasHandler = new WorkerImageAtlasHandler(prefix, postfix)

        this.speedAdjust = speedAdjust
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    makeTexture(gl: WebGL2RenderingContext): void {
        this.imageAtlasHandler.makeTexture(gl)
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationForWorker("ROMANS", direction, Math.floor(animationIndex / this.speedAdjust), percentageTraveled)
    }

    getActionAnimation(direction: Direction, action: WorkerAction, animationIndex: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationForAction(direction, action, animationIndex)
    }

    getDrawingInformationForCargo(direction: Direction, material: MaterialAllUpperCase, animationIndex: number, offset: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationForCargo(direction, material, animationIndex, Math.floor(offset))
    }

    getImageAtlasHandler(): WorkerImageAtlasHandler {
        return this.imageAtlasHandler
    }

    getSize(nation: Nation, direction: Direction): Dimension | undefined {
        return this.imageAtlasHandler.getSize(nation, direction)
    }
}

export interface ImageSeriesInformation {
    height: number
    width: number
    nrImages: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
}

export interface DrawingInformation {
    sourceX: number
    sourceY: number
    width: number
    height: number
    offsetX: number
    offsetY: number
    image: HTMLImageElement
    textureIndex?: number
    texture?: WebGLTexture | null
}

interface ShipImageAtlasFormat {
    ready: Record<Direction, Record<'image' | 'shadowImage', OneImageInformation>>
    underConstruction: Record<ShipConstructionProgress, Record<'image' | 'shadowImage', OneImageInformation>>
}

class ShipImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: ShipImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-ship.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-ship.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationForShip(direction: Direction): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo.ready[direction].image
        const shadowImageInfo = this.imageAtlasInfo.ready[direction].shadowImage

        return [
            {
                sourceX: imageInfo.x,
                sourceY: imageInfo.y,
                width: imageInfo.width,
                height: imageInfo.height,
                offsetX: imageInfo.offsetX,
                offsetY: imageInfo.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImageInfo.x,
                sourceY: shadowImageInfo.y,
                width: shadowImageInfo.width,
                height: shadowImageInfo.height,
                offsetX: shadowImageInfo.offsetX,
                offsetY: shadowImageInfo.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForShipUnderConstruction(constructionProgress: ShipConstructionProgress): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const image = this.imageAtlasInfo.underConstruction[constructionProgress].image
        const shadowImage = this.imageAtlasInfo.underConstruction[constructionProgress].shadowImage


        return [
            {
                sourceX: image.x,
                sourceY: image.y,
                width: image.width,
                height: image.height,
                offsetX: image.offsetX,
                offsetY: image.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImage.x,
                sourceY: shadowImage.y,
                width: shadowImage.width,
                height: shadowImage.height,
                offsetX: shadowImage.offsetX,
                offsetY: shadowImage.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

export type AnimationType = 'SINGLE_THEN_FREEZE' | 'REPEAT' | 'SINGLE_THEN_STOP'

const actionAnimationType = new Map<WorkerAction, AnimationType>()

actionAnimationType.set('PLANTING_TREE', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('PLANTING_WHEAT', 'REPEAT')
actionAnimationType.set('HARVESTING', 'REPEAT')
actionAnimationType.set('INVESTIGATING', 'REPEAT')
actionAnimationType.set('CUTTING', 'REPEAT')
actionAnimationType.set('HACKING_STONE', 'REPEAT')
actionAnimationType.set('LOWER_FISHING_ROD', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('FISHING', 'REPEAT')
actionAnimationType.set('PULL_UP_FISHING_ROD', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('CHEW_GUM', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('HIT', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('JUMP_BACK', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('STAND_ASIDE', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('DIE', 'SINGLE_THEN_STOP')

interface WorkerCommonFormat {
    shadowImages: Record<Direction, ImageSeriesInformation>
    fullImages: Record<Direction, ImageSeriesInformation>
    bodyImages: Record<Direction, ImageSeriesInformation>
    cargoImages?: Record<MaterialAllUpperCase, Record<Direction, ImageSeriesInformation>>
    actions?: Record<WorkerAction, Record<Direction | 'any', ImageSeriesInformation>>
}

interface WorkerNationSpecificFormat {
    fullImages: Record<Nation, Record<Direction, ImageSeriesInformation>>
    cargoImages?: Record<Nation, Record<MaterialAllUpperCase, Record<Direction, ImageSeriesInformation>>>
    actions?: Record<Nation, Record<WorkerAction, Record<Direction | 'any', ImageSeriesInformation>>>
}

interface WorkerImageAtlasFormat {
    common: WorkerCommonFormat
    nationSpecific: WorkerNationSpecificFormat
}

class WorkerImageAtlasHandler {
    private pathPrefix: string
    private name: string
    private imageAtlasInfo?: WorkerImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string, name: string) {

        this.pathPrefix = prefix
        this.name = name
    }

    async load(): Promise<void> {

        if (this.image) {
            return
        }

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-" + this.name + ".json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-" + this.name + ".png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationForWorker(nation: Nation, direction: Direction, animationCounter: number, offset: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        // Shadows are common for all nations
        const shadowImages = this.imageAtlasInfo.common.shadowImages[direction]

        let images

        if (this.imageAtlasInfo.nationSpecific?.fullImages) {
            images = this.imageAtlasInfo.nationSpecific.fullImages[nation][direction]
        } else if (this.imageAtlasInfo.common?.fullImages) {
            images = this.imageAtlasInfo.common.fullImages[direction]
        } else if (this.imageAtlasInfo.common?.bodyImages) {
            images = this.imageAtlasInfo.common.bodyImages[direction]
        } else {
            return undefined
        }

        const frameIndex = (animationCounter + Math.round(offset)) % images.nrImages

        return [
            {
                sourceX: images.startX + frameIndex * images.width,
                sourceY: images.startY,
                width: images.width,
                height: images.height,
                offsetX: images.offsetX,
                offsetY: images.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImages.startX + frameIndex * shadowImages.width,
                sourceY: shadowImages.startY,
                width: shadowImages.width,
                height: shadowImages.height,
                offsetX: shadowImages.offsetX,
                offsetY: shadowImages.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForAction(direction: Direction, action: WorkerAction, animationIndex: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            console.error("Undefined!")
            console.error([action, direction])

            return undefined
        }

        if (direction &&
            this.imageAtlasInfo.common?.actions &&
            this.imageAtlasInfo.common?.actions[action] &&
            this.imageAtlasInfo.common.actions[action][direction]) {
            const actionImages = this.imageAtlasInfo.common.actions[action][direction]

            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    sourceX: actionImages.startX + ((animationIndex) % actionImages.nrImages) * actionImages.width,
                    sourceY: actionImages.startY,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    sourceX: actionImages.startX + (actionImages.nrImages - 1) * actionImages.width,
                    sourceY: actionImages.startY,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            }
        } else if (this.imageAtlasInfo.common?.actions && this.imageAtlasInfo.common.actions[action] && this.imageAtlasInfo.common.actions[action].any) {
            const actionImages = this.imageAtlasInfo.common.actions[action].any

            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    sourceX: actionImages.startX,
                    sourceY: actionImages.startY + ((animationIndex) % actionImages.nrImages) * actionImages.height,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    sourceX: actionImages.startX,
                    sourceY: actionImages.startY + (actionImages.nrImages - 1) * actionImages.height,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            }
        } else if (this.imageAtlasInfo.nationSpecific &&
            this.imageAtlasInfo.nationSpecific?.actions &&
            this.imageAtlasInfo.nationSpecific.actions["ROMANS"] &&
            this.imageAtlasInfo.nationSpecific.actions["ROMANS"][action] &&
            this.imageAtlasInfo.nationSpecific.actions["ROMANS"][action][direction]) {
            const actionImages = this.imageAtlasInfo.nationSpecific.actions["ROMANS"][action][direction]

            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    sourceX: actionImages.startX + ((animationIndex) % actionImages.nrImages) * actionImages.width,
                    sourceY: actionImages.startY,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    sourceX: actionImages.startX + (actionImages.nrImages - 1) * actionImages.width,
                    sourceY: actionImages.startY,
                    width: actionImages.width,
                    height: actionImages.height,
                    offsetX: actionImages.offsetX,
                    offsetY: actionImages.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) == 'SINGLE_THEN_STOP') {
                // SINGLE_THEN_STOP is handled in the first arm. If we get here the animation is drawn already

                return undefined
            }
        } else {
            if (!reported.has(action)) {

                console.error("FOUND NO ACTION: ")
                console.error([this.name, action, direction])

                reported.add(action)
            }
        }

        return undefined
    }

    getDrawingInformationForCargo(direction: Direction, material: MaterialAllUpperCase, animationIndex: number, offset: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo.nationSpecific.cargoImages) {
            return undefined // TODO: fix this when there is a nation specific cargo image
        } else if (this.imageAtlasInfo.common.cargoImages) {
            const cargoImages = this.imageAtlasInfo.common.cargoImages[material][direction]

            return {
                sourceX: cargoImages.startX + ((animationIndex + Math.round(offset)) % cargoImages.nrImages) * cargoImages.width,
                sourceY: cargoImages.startY,
                width: cargoImages.width,
                height: cargoImages.height,
                offsetX: cargoImages.offsetX,
                offsetY: cargoImages.offsetY,
                image: this.image,
                texture: this.texture
            }
        }

        return undefined
    }

    getSize(nation: Nation, direction: Direction): Dimension | undefined {
        const drawingInfo = this.getDrawingInformationForWorker(nation, direction, 0, 0)

        if (drawingInfo) {

            return {
                width: drawingInfo[0].width,
                height: drawingInfo[0].height
            }

        }

        return undefined
    }

    getSourceImage() {
        return this.image
    }
}

interface HouseImageAtlasInformation {
    buildings: Record<Nation, Record<AnyBuilding, Record<'ready' | 'underConstruction' | 'underConstructionShadow' | 'readyShadow', OneImageInformation>>>
    constructionPlanned: Record<Nation, Record<'image' | 'shadowImage', OneImageInformation>>
    constructionJustStarted: Record<Nation, Record<'image' | 'shadowImage', OneImageInformation>>
}

class HouseImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: HouseImageAtlasInformation
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-buildings.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-buildings.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationForHouseJustStarted(nation: Nation): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionJustStarted[nation].image

        return {
            sourceX: houseInformation.x,
            sourceY: houseInformation.y,
            width: houseInformation.width,
            height: houseInformation.height,
            offsetX: houseInformation.offsetX,
            offsetY: houseInformation.offsetY,
            image: this.image,
            texture: this.texture
        }
    }

    getDrawingInformationForHousePlanned(nation: Nation): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionPlanned[nation].image

        return {
            sourceX: houseInformation.x,
            sourceY: houseInformation.y,
            width: houseInformation.width,
            height: houseInformation.height,
            offsetX: houseInformation.offsetX,
            offsetY: houseInformation.offsetY,
            image: this.image,
            texture: this.texture
        }
    }

    getDrawingInformationForHouseReady(nation: Nation, houseType: AnyBuilding): DrawingInformation[] | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseImage = this.imageAtlasInfo.buildings[nation][houseType].ready
        const houseShadowImage = this.imageAtlasInfo.buildings[nation][houseType].readyShadow

        return [
            {
                sourceX: houseImage.x,
                sourceY: houseImage.y,
                width: houseImage.width,
                height: houseImage.height,
                offsetX: houseImage.offsetX,
                offsetY: houseImage.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: houseShadowImage.x,
                sourceY: houseShadowImage.y,
                width: houseShadowImage.width,
                height: houseShadowImage.height,
                offsetX: houseShadowImage.offsetX,
                offsetY: houseShadowImage.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForHouseUnderConstruction(nation: Nation, houseType: AnyBuilding): DrawingInformation[] | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseImage = this.imageAtlasInfo.buildings[nation][houseType].underConstruction
        const houseShadowImage = this.imageAtlasInfo.buildings[nation][houseType].underConstructionShadow

        return [
            {
                sourceX: houseImage.x,
                sourceY: houseImage.y,
                width: houseImage.width,
                height: houseImage.height,
                offsetX: houseImage.offsetX,
                offsetY: houseImage.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: houseShadowImage.x,
                sourceY: houseShadowImage.y,
                width: houseShadowImage.width,
                height: houseShadowImage.height,
                offsetX: houseShadowImage.offsetX,
                offsetY: houseShadowImage.offsetY,
                image: this.image,
                texture: this.texture
            }]
    }

    getUrlForIndividualBuilding(nation: Nation, houseType: AnyBuilding): string {
        return "assets/" + nation + "/" + houseType + ".png"
    }
}

export interface OneImageInformation {
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
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-border.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-border.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
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
            image: this.image,
            texture: this.texture
        }
    }
}

interface SignImageAtlasFormat {
    images: Record<SignTypes | 'shadowImage', Record<Size, OneImageInformation>>
    shadowImage: OneImageInformation
}

class SignImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: SignImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-signs.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-signs.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformation(signType: SignTypes, size: Size): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const image = this.imageAtlasInfo.images[signType][size]
        const shadowImage = this.imageAtlasInfo.shadowImage

        return [
            {
                sourceX: image.x,
                sourceY: image.y,
                width: image.width,
                height: image.height,
                offsetX: image.offsetX,
                offsetY: image.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImage.x,
                sourceY: shadowImage.y,
                width: shadowImage.width,
                height: shadowImage.height,
                offsetX: shadowImage.offsetX,
                offsetY: shadowImage.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

interface FireImageAtlasFormat {
    fires: Record<FireSize, Record<'image' | 'shadowImage', ImageSeriesInformation>>
    burntDown: Record<Size, OneImageInformation>
}

class FireImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: FireImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-fire.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-fire.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getFireDrawingInformation(size: FireSize, animationIndex: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const fireImage = this.imageAtlasInfo.fires[size].image
        const fireShadowImage = this.imageAtlasInfo.fires[size].shadowImage

        const frameIndex = animationIndex % fireImage.nrImages

        if (fireShadowImage) {
            return [
                {
                    sourceX: fireImage.startX + frameIndex * fireImage.width,
                    sourceY: fireImage.startY,
                    width: fireImage.width,
                    height: fireImage.height,
                    offsetX: fireImage.offsetX,
                    offsetY: fireImage.offsetY,
                    image: this.image,
                    texture: this.texture
                },
                {
                    sourceX: fireShadowImage.startX + frameIndex * fireShadowImage.width,
                    sourceY: fireShadowImage.startY,
                    width: fireShadowImage.width,
                    height: fireShadowImage.height,
                    offsetX: fireShadowImage.offsetX,
                    offsetY: fireShadowImage.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            ]
        }

        return [
            {
                sourceX: fireImage.startX + frameIndex * fireImage.width,
                sourceY: fireImage.startY,
                width: fireImage.width,
                height: fireImage.height,
                offsetX: fireImage.offsetX,
                offsetY: fireImage.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getBurntDownDrawingInformation(size: Size): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const drawingInfo = this.imageAtlasInfo.burntDown[size]

        return {
            sourceX: drawingInfo.x,
            sourceY: drawingInfo.y,
            width: drawingInfo.width,
            height: drawingInfo.height,
            offsetX: drawingInfo.offsetX,
            offsetY: drawingInfo.offsetY,
            image: this.image,
            texture: this.texture
        }
    }
}

interface CargoInformation {
    generic: Record<MaterialAllUpperCase, OneImageInformation>
    nationSpecific: Record<Nation, Record<MaterialAllUpperCase, OneImageInformation>>
}

class CargoImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: CargoInformation
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-cargos.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-cargos.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformation(nation: Nation, material: MaterialAllUpperCase): DrawingInformation | undefined {
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
                image: this.image,
                texture: this.texture
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
                image: this.image,
                texture: this.texture
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
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-road-building.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-road-building.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
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
            image: this.image,
            texture: this.texture
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
            image: this.image,
            texture: this.texture
        }
    }

    getDrawingInformationForConnectionAbove(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const connectionInfo = this.imageAtlasInfo.upwardsConnections[difference]

        return {
            sourceX: connectionInfo.x,
            sourceY: connectionInfo.y,
            width: connectionInfo.width,
            height: connectionInfo.height,
            offsetX: connectionInfo.offsetX,
            offsetY: connectionInfo.offsetY,
            image: this.image,
            texture: this.texture
        }

    }

    getDrawingInformationForConnectionBelow(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const connectionInfo = this.imageAtlasInfo.downwardsConnections[difference]

        return {
            sourceX: connectionInfo.x,
            sourceY: connectionInfo.y,
            width: connectionInfo.width,
            height: connectionInfo.height,
            offsetX: connectionInfo.offsetX,
            offsetY: connectionInfo.offsetY,
            image: this.image,
            texture: this.texture
        }

    }
}

interface TreeImageAtlasFormat {
    grownTrees: Record<TreeType, ImageSeriesInformation>
    grownTreeShadows: Record<TreeType, ImageSeriesInformation>
    growingTrees: Record<TreeType, Record<TreeSize, OneImageInformation>>
    growingTreeShadows: Record<TreeType, Record<TreeSize, OneImageInformation>>
    fallingTrees: Record<TreeType, ImageSeriesInformation>
    fallingTreeShadows: Record<TreeType, ImageSeriesInformation>
}

class TreeImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: TreeImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-trees.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-trees.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationForGrownTree(treeType: TreeType, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imagesForTreeType = this.imageAtlasInfo.grownTrees[treeType]
        const shadowImagesForTreeType = this.imageAtlasInfo.grownTreeShadows[treeType]

        const frameIndex = animationCounter % imagesForTreeType.nrImages

        return [
            {
                sourceX: imagesForTreeType.startX + frameIndex * imagesForTreeType.width,
                sourceY: imagesForTreeType.startY,
                width: imagesForTreeType.width,
                height: imagesForTreeType.height,
                offsetX: imagesForTreeType.offsetX,
                offsetY: imagesForTreeType.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImagesForTreeType.startX + frameIndex * shadowImagesForTreeType.width,
                sourceY: shadowImagesForTreeType.startY,
                width: shadowImagesForTreeType.width,
                height: shadowImagesForTreeType.height,
                offsetX: shadowImagesForTreeType.offsetX,
                offsetY: shadowImagesForTreeType.offsetY,
                image: this.image,
                texture: this.texture
            },
        ]
    }

    getDrawingInformationForFallingTree(treeType: TreeType, step: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imagePerTreeType = this.imageAtlasInfo.fallingTrees[treeType]
        const shadowImagePerTreeType = this.imageAtlasInfo.fallingTreeShadows[treeType]

        return [
            {
                sourceX: imagePerTreeType.startX + imagePerTreeType.width * step,
                sourceY: imagePerTreeType.startY,
                width: imagePerTreeType.width,
                height: imagePerTreeType.height,
                offsetX: imagePerTreeType.offsetX,
                offsetY: imagePerTreeType.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImagePerTreeType.startX + shadowImagePerTreeType.width * step,
                sourceY: shadowImagePerTreeType.startY,
                width: shadowImagePerTreeType.width,
                height: shadowImagePerTreeType.height,
                offsetX: shadowImagePerTreeType.offsetX,
                offsetY: shadowImagePerTreeType.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getImageForGrowingTree(treeType: TreeType, treeSize: TreeSize): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imagePerTreeType = this.imageAtlasInfo.growingTrees[treeType]
        const shadowImagePerTreeType = this.imageAtlasInfo.growingTreeShadows[treeType]

        const imageInfo = imagePerTreeType[treeSize]
        const shadowImageInfo = shadowImagePerTreeType[treeSize]

        return [
            {
                sourceX: imageInfo.x,
                sourceY: imageInfo.y,
                width: imageInfo.width,
                height: imageInfo.height,
                offsetX: imageInfo.offsetX,
                offsetY: imageInfo.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImageInfo.x,
                sourceY: shadowImageInfo.y,
                width: shadowImageInfo.width,
                height: shadowImageInfo.height,
                offsetX: shadowImageInfo.offsetX,
                offsetY: shadowImageInfo.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
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

class UiElementsImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: UiElementsImageAtlasInfo
    private image?: HTMLImageElement
    private textureIndex: number
    private texture?: WebGLTexture | null

    constructor(prefix: string, textureIndex: number) {
        this.pathPrefix = prefix
        this.textureIndex = textureIndex
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-ui-elements.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-ui-elements.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture
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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture
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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture
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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

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
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

        }
    }
}

class StoneImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<StoneType, Record<StoneAmount, Record<'image' | 'shadowImage', OneImageInformation>>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-stones.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-stones.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationFor(stoneType: StoneType, amount: StoneAmount): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo === undefined || this.imageAtlasInfo[stoneType] === undefined || this.imageAtlasInfo[stoneType][amount] === undefined || this.imageAtlasInfo[stoneType][amount].image === undefined) {
            console.log([this.imageAtlasInfo, stoneType, amount])
        }

        const image = this.imageAtlasInfo[stoneType][amount].image
        const shadowImage = this.imageAtlasInfo[stoneType][amount].shadowImage

        return [
            {
                sourceX: image.x,
                sourceY: image.y,
                width: image.width,
                height: image.height,
                offsetX: image.offsetX,
                offsetY: image.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImage.x,
                sourceY: shadowImage.y,
                width: shadowImage.width,
                height: shadowImage.height,
                offsetX: shadowImage.offsetX,
                offsetY: shadowImage.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

class DecorationsImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<DecorationType, Record<'image' | 'shadowImage', OneImageInformation>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-decorations.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-decorations.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {
        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationFor(decorationType: DecorationType): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo === undefined || this.imageAtlasInfo[decorationType] === undefined) {
            console.log([this.imageAtlasInfo, decorationType])
        }

        const imageInfo = this.imageAtlasInfo[decorationType].image
        const shadowImage = this.imageAtlasInfo[decorationType].shadowImage

        if (shadowImage) {
            return [
                {
                    sourceX: imageInfo.x,
                    sourceY: imageInfo.y,
                    width: imageInfo.width,
                    height: imageInfo.height,
                    offsetX: imageInfo.offsetX,
                    offsetY: imageInfo.offsetY,
                    image: this.image,
                    texture: this.texture

                },
                {
                    sourceX: shadowImage.x,
                    sourceY: shadowImage.y,
                    width: shadowImage.width,
                    height: shadowImage.height,
                    offsetX: shadowImage.offsetX,
                    offsetY: shadowImage.offsetY,
                    image: this.image,
                    texture: this.texture

                }
            ]
        }

        return [
            {
                sourceX: imageInfo.x,
                sourceY: imageInfo.y,
                width: imageInfo.width,
                height: imageInfo.height,
                offsetX: imageInfo.offsetX,
                offsetY: imageInfo.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

class CropImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<CropType, Record<CropGrowth, Record<'image' | 'shadowImage', OneImageInformation>>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-crops.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-crops.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationFor(cropType: CropType, growth: CropGrowth): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo[cropType][growth].image
        const shadowImageInfo = this.imageAtlasInfo[cropType][growth].shadowImage

        return [
            {
                sourceX: imageInfo.x,
                sourceY: imageInfo.y,
                width: imageInfo.width,
                height: imageInfo.height,
                offsetX: imageInfo.offsetX,
                offsetY: imageInfo.offsetY,
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: shadowImageInfo.x,
                sourceY: shadowImageInfo.y,
                width: shadowImageInfo.width,
                height: shadowImageInfo.height,
                offsetX: shadowImageInfo.offsetX,
                offsetY: shadowImageInfo.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

interface AnimalImageAtlasFormat {
    images: Record<Direction, ImageSeriesInformation>
    shadowImages?: Record<Direction, OneImageInformation>
    cargos?: Record<MaterialAllUpperCase, OneImageInformation>
    nationSpecific?: Record<Nation, Record<MaterialAllUpperCase, OneImageInformation>>
}

const ANIMAL_FALLBACK_DIRECTION = new Map<Direction, Direction>()

ANIMAL_FALLBACK_DIRECTION.set('SOUTH_EAST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('SOUTH_WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_WEST', 'SOUTH_EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_EAST', 'SOUTH_WEST')

class AnimalImageAtlasHandler {
    private pathPrefix: string
    private name: string
    private imageAtlasInfo?: AnimalImageAtlasFormat
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string, name: string) {

        this.pathPrefix = prefix
        this.name = name
    }

    async load(): Promise<void> {

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-" + this.name + ".json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-" + this.name + ".png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null|undefined")
        }
    }

    getDrawingInformationForCargo(material: MaterialAllUpperCase, nation: Nation): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo.cargos) {
            const cargoImage = this.imageAtlasInfo.cargos[material]

            if (cargoImage) {
                return {
                    sourceX: cargoImage.x,
                    sourceY: cargoImage.y,
                    width: cargoImage.width,
                    height: cargoImage.height,
                    offsetX: cargoImage.offsetX,
                    offsetY: cargoImage.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            }
        }

        if (this.imageAtlasInfo.nationSpecific) {
            const cargoImage = this.imageAtlasInfo.nationSpecific[nation][material]

            if (cargoImage) {
                return {
                    sourceX: cargoImage.x,
                    sourceY: cargoImage.y,
                    width: cargoImage.width,
                    height: cargoImage.height,
                    offsetX: cargoImage.offsetX,
                    offsetY: cargoImage.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            }
        }

        return undefined
    }

    getDrawingInformationFor(direction: Direction, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const image = this.imageAtlasInfo.images[direction]

        const frameIndex = (animationCounter) % image.nrImages

        if (this.imageAtlasInfo.shadowImages) {
            let shadowImage = this.imageAtlasInfo.shadowImages[direction]

            if (shadowImage === undefined) {
                const fallbackDirection = ANIMAL_FALLBACK_DIRECTION.get(direction)

                if (fallbackDirection !== undefined) {
                    shadowImage = this.imageAtlasInfo.shadowImages[fallbackDirection]
                }
            }

            if (shadowImage === undefined) {
                shadowImage = this.imageAtlasInfo.shadowImages['EAST']
            }

            return [
                {
                    sourceX: image.startX + frameIndex * image.width,
                    sourceY: image.startY,
                    width: image.width,
                    height: image.height,
                    offsetX: image.offsetX,
                    offsetY: image.offsetY,
                    image: this.image,
                    texture: this.texture
                },
                {
                    sourceX: shadowImage.x,
                    sourceY: shadowImage.y,
                    width: shadowImage.width,
                    height: shadowImage.height,
                    offsetX: shadowImage.offsetX,
                    offsetY: shadowImage.offsetY,
                    image: this.image,
                    texture: this.texture
                }
            ]
        }

        return [
            {
                sourceX: image.startX + frameIndex * image.width,
                sourceY: image.startY,
                width: image.width,
                height: image.height,
                offsetX: image.offsetX,
                offsetY: image.offsetY,
                image: this.image,
                texture: this.texture
            }
        ]

    }
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
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

    console.log(x)
    console.log(y)

    return { x: parseInt(x), y: parseInt(y) }
}

async function makeImageFromMap(map: MapInformation, scaleDown: number, blockSize: number): Promise<HTMLImageElement | undefined> {

    const terrainInformation = await getTerrainForMap(map.id)

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
    }
    )

    /* Draw the starting points */
    ctx.fillStyle = 'yellow'
    map.startingPoints.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x * blockSize / scaleDown, (map.height - point.y) * blockSize / scaleDown, 3, 0, 2 * Math.PI)
        ctx.fill()
    }
    )

    //return ctx.getImageData(0, 0, map.width * 2, map.height)
    //return offscreenCanvas
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


function screenPointToGamePoint(screenPoint: ScreenPoint, translateX: number, translateY: number, scale: number, screenHeight: number): Point {

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

function gamePointToScreenPoint(gamePoint: Point, height: number, translateX: number, translateY: number, scale: number, screenHeight: number, heightAdjust: number, standardHeight: number): ScreenPoint {
    const adjustedPoint = {
        x: gamePoint.x + ((height - standardHeight) / heightAdjust),
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

export {
    getHouseSize,
    getDirectionForWalkingWorker,
    getTimestamp,
    normalize,
    same,
    removeHouseOrFlagOrRoadAtPoint,
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
    getLineBetweenPoints,
    getDotProduct,
    getNormalForTriangle,
    camelCaseToWords,
    vegetationToInt,
    intToVegetationColor,
    sumVectors,
    loadImageNg,
    WorkerImageAtlasHandler,
    WorkerAnimation,
    AnimalAnimation,
    TreeAnimation,
    FireAnimation,
    HouseImageAtlasHandler,
    SignImageAtlasHandler,
    UiElementsImageAtlasHandler,
    CropImageAtlasHandler,
    StoneImageAtlasHandler,
    DecorationsImageAtlasHandler,
    BorderImageAtlasHandler,
    RoadBuildingImageAtlasHandler,
    CargoImageAtlasHandler,
    makeShader,
    makeTextureFromImage,
    resizeCanvasToDisplaySize,
    ShipImageAtlasHandler,
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
    screenPointToGamePoint,
    gamePointToScreenPoint,
    surroundingPoints
}
