import { Dimension, DrawingInformation, HouseImageAtlasHandler, ImageSeriesInformation, WorkerAnimation, loadImageNg, makeTextureFromImage } from "./utils"
import { FlagType, MaterialAllUpperCase, Nation, WorkerType } from "./api/types"

const workers = new Map<WorkerType, WorkerAnimation>()

workers.set("Farmer", new WorkerAnimation("assets/", "farmer", 10))
workers.set("Fisherman", new WorkerAnimation("assets/", "fisher", 10))
workers.set("Courier", new WorkerAnimation("assets/", "helper", 10))
workers.set("StorageWorker", new WorkerAnimation("assets/", "helper", 10))
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


class MaterialImageAtlasHandler {
    private pathPrefix: string

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    getInventoryIconUrl(nation: Nation, material: MaterialAllUpperCase): string {

        if (material === "SHIELD") {
            return this.pathPrefix + "/inventory-icons/" + nation + "/" + material + ".png"
        }

        return this.pathPrefix + "/inventory-icons/" + material + ".png"
    }
}

class FlagImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<Nation, Record<FlagType, Record<'images' | 'shadows', ImageSeriesInformation>>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        if (this.image && this.imageAtlasInfo) {
            return
        }

        // Get the image atlas information
        const response = await fetch(this.pathPrefix + "image-atlas-flags.json")
        const imageAtlasInfo = await response.json()

        this.imageAtlasInfo = imageAtlasInfo

        // Download the actual image atlas
        this.image = await loadImageNg(this.pathPrefix + "image-atlas-flags.png")
    }

    makeTexture(gl: WebGL2RenderingContext): void {

        if (this.image && !this.texture) {
            this.texture = makeTextureFromImage(gl, this.image)
        } else {
            console.error("Failed to make the texture because image is null | undefined")
        }
    }

    getDrawingInformationFor(nation: Nation, flagType: FlagType, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const images = this.imageAtlasInfo[nation][flagType].images
        const shadowImages = this.imageAtlasInfo[nation][flagType].shadows

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

        const drawingInfo = this.getDrawingInformationFor(nation, flagType, 0)

        if (drawingInfo) {

            return {
                width: drawingInfo[0].width,
                height: drawingInfo[0].height
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

    makeTexture(gl: WebGL2RenderingContext): void {
        this.imageAtlasHandler.makeTexture(gl)
    }

    getAnimationFrame(nation: Nation, flagType: FlagType, animationIndex: number, offset: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(nation, flagType, Math.floor((animationIndex + offset) / this.speedAdjust))
    }

    getSize(nation: Nation, flagType: FlagType): Dimension | undefined {
        return this.imageAtlasHandler.getSize(nation, flagType)
    }

    getImageAtlasHandler(): FlagImageAtlasHandler {
        return this.imageAtlasHandler
    }
}


const houses = new HouseImageAtlasHandler("assets/")
const materialImageAtlasHandler = new MaterialImageAtlasHandler("assets/")
const flagAnimations = new FlagAnimation("assets/", 2)


export {
    workers,
    houses,
    materialImageAtlasHandler,
    FlagImageAtlasHandler,
    FlagAnimation,
    flagAnimations
}