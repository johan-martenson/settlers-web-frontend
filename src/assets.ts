import { Dimension, DrawingInformation, HouseImageAtlasHandler, ImageSeriesInformation, OneImageInformation, WorkerAnimation, loadImageNg } from "./utils"
import { Direction, FlagType, Material, Nation, PlayerColor, ShipConstructionProgress, WorkerType } from "./api/types"
import { UiIconType } from "./icons/icon"

const workers = new Map<WorkerType, WorkerAnimation>()

workers.set("Farmer", new WorkerAnimation("assets/", "farmer", 10))
workers.set("Fisherman", new WorkerAnimation("assets/", "fisher", 10))
workers.set("Courier", new WorkerAnimation("assets/", "helper", 10))
workers.set("StorehouseWorker", new WorkerAnimation("assets/", "helper", 10))
workers.set("Hunter", new WorkerAnimation("assets/", "hunter", 10))
workers.set("IronFounder", new WorkerAnimation("assets/", "iron_founder", 10))
workers.set("Metalworker", new WorkerAnimation("assets/", "metalworker", 10))
workers.set("Miller", new WorkerAnimation("assets/", "miller", 10))
workers.set("Miner", new WorkerAnimation("assets/", "miner", 10))
workers.set("Minter", new WorkerAnimation("assets/", "minter", 10))
workers.set("PigBreeder", new WorkerAnimation("assets/", "pig_breeder", 10))
workers.set("Planer", new WorkerAnimation("assets/", "planer", 10))
workers.set("Scout", new WorkerAnimation("assets/", "scout", 10))
workers.set("ShipWright", new WorkerAnimation("assets/", "ship_wright", 10))
workers.set("DonkeyBreeder", new WorkerAnimation("assets/", "donkey_breeder", 10))
workers.set("Butcher", new WorkerAnimation("assets/", "butcher", 10))
workers.set("Builder", new WorkerAnimation("assets/", "builder", 10))
workers.set("Brewer", new WorkerAnimation("assets/", "brewer", 10))
workers.set("Baker", new WorkerAnimation("assets/", "baker", 10))
workers.set("Armorer", new WorkerAnimation("assets/", "armorer", 10))
workers.set("WoodcutterWorker", new WorkerAnimation("assets/", "woodcutter", 10))
workers.set("Forester", new WorkerAnimation("assets/", "forester", 10))
workers.set("SawmillWorker", new WorkerAnimation("assets/", "carpenter", 10))
workers.set("Stonemason", new WorkerAnimation("assets/", "stonemason", 10))
workers.set("Scout", new WorkerAnimation("assets/", "scout", 10))
workers.set("Private", new WorkerAnimation("assets/", "private", 10))
workers.set("Private_first_class", new WorkerAnimation("assets/", "private_first_class", 10))
workers.set("Sergeant", new WorkerAnimation("assets/", "sergeant", 10))
workers.set("Officer", new WorkerAnimation("assets/", "officer", 10))
workers.set("General", new WorkerAnimation("assets/", "general", 10))
workers.set("Geologist", new WorkerAnimation("assets/", "geologist", 10))


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

    icons: Record<UiIconType, OneImageInformation>
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + "image-atlas-ui-elements.json")
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + "image-atlas-ui-elements.png")
        }
    }

    getUiElement(type: UiIconType): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo.icons[type]

        return {
            sourceX: imageInfo.x,
            sourceY: imageInfo.y,
            width: imageInfo.width,
            height: imageInfo.height,
            offsetX: imageInfo.offsetX,
            offsetY: imageInfo.offsetY,
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture
        }
    }

    getImage(): HTMLImageElement | undefined {
        return this.image
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

const uiElementsImageAtlasHandler = new UiElementsImageAtlasHandler("assets/", 0)

class MaterialImageAtlasHandler {
    private pathPrefix: string

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    getInventoryIconUrl(nation: Nation, material: Material): string {

        if (material === "SHIELD") {
            return this.pathPrefix + "/inventory-icons/" + nation + "/" + material + ".png"
        }

        return this.pathPrefix + "/inventory-icons/" + material + ".png"
    }
}

class FlagImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<Nation, Record<FlagType, Record<PlayerColor | 'shadows', ImageSeriesInformation>>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + "image-atlas-flags.json")
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + "image-atlas-flags.png")
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationFor(nation: Nation, color: PlayerColor, flagType: FlagType, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            console.error("Image or image atlas undefined")
            console.error([this.imageAtlasInfo, this.image])

            return undefined
        }

        const images = this.imageAtlasInfo[nation][flagType][color]
        const shadowImages = this.imageAtlasInfo[nation][flagType]['shadows']

        const frameIndex = animationCounter % images.nrImages

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

    getSize(nation: Nation, flagType: FlagType): Dimension | undefined {
        const drawingInfo = this.getDrawingInformationFor(nation, 'BLUE', flagType, 0)

        if (drawingInfo) {
            return {
                width: drawingInfo[0].width,
                height: drawingInfo[0].height
            }

        }

        return undefined
    }

    getSizeWithShadow(nation: Nation, flagType: FlagType): Dimension | undefined {
        const draw = this.getDrawingInformationFor(nation, 'BLUE', flagType, 0)

        if (draw) {
            return {
                width: Math.max(draw[0].offsetX, draw[1].offsetX) + Math.max(draw[0].width - draw[0].offsetX, draw[1].width - draw[1].offsetX),
                height: Math.max(draw[0].offsetY, draw[1].offsetY) + Math.max(draw[0].height - draw[0].offsetY, draw[1].height - draw[1].offsetY),
            }
        }

        return undefined

    }

    getImage(): HTMLImageElement | undefined {
        return this.image
    }
}


class FlagAnimation {
    private imageAtlasHandler: FlagImageAtlasHandler
    private speedAdjust: number

    constructor(prefix: string, speedAdjust: number) {
        this.imageAtlasHandler = new FlagImageAtlasHandler(prefix)
        this.speedAdjust = speedAdjust
    }

    async load(): Promise<void> {
        await this.imageAtlasHandler.load()
    }

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(nation: Nation, color: PlayerColor, flagType: FlagType, animationIndex: number, offset: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(nation, color, flagType, Math.floor((animationIndex + offset) / this.speedAdjust))
    }

    getSizeWithShadow(nation: Nation, flagType: FlagType): Dimension | undefined {
        return this.imageAtlasHandler.getSizeWithShadow(nation, flagType)
    }

    getSize(nation: Nation, flagType: FlagType): Dimension | undefined {
        return this.imageAtlasHandler.getSize(nation, flagType)
    }

    getImageAtlasHandler(): FlagImageAtlasHandler {
        return this.imageAtlasHandler
    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + "image-atlas-ship.json")
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + "image-atlas-ship.png")
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
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

    getSize(direction: Direction): Dimension {
        return {
            width: this.imageAtlasInfo?.ready[direction].image.width ?? 0,
            height: this.imageAtlasInfo?.ready[direction].image.height ?? 0
        }
    }
}


const houses = new HouseImageAtlasHandler("assets/")
const materialImageAtlasHandler = new MaterialImageAtlasHandler("assets/")
const flagAnimations = new FlagAnimation("assets/", 2)
const shipImageAtlas = new ShipImageAtlasHandler("assets/")

export {
    workers,
    houses,
    materialImageAtlasHandler,
    FlagImageAtlasHandler,
    FlagAnimation,
    flagAnimations,
    uiElementsImageAtlasHandler,
    shipImageAtlas
}