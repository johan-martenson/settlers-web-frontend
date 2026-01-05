import { loadImageNg } from '../utils/utils'
import { AnyBuilding, CropGrowth, CropType, DecorationType, Direction, FireSize, FlagType, Material, Nation, PlayerColor, ShipConstructionProgress, SignTypes, Size, StoneAmount, StoneType, TreeSize, TreeType, WildAnimalType, WorkerAction, WorkerType } from '../api/types'
import { UiIconType } from '../icons/icon'

// Types
export type Dimension = {
    width: number
    height: number
}

export type ImageSeriesInformation = {
    height: number
    width: number
    nrImages: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
}

export type DrawingInformation = {
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

export type OneImageInformation = {
    x: number
    y: number
    width: number
    height: number
    offsetX: number
    offsetY: number
}

type UiElementsImageAtlasInfo = {
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

type ShipImageAtlasFormat = {
    ready: Record<Direction, Record<'image' | 'shadowImage', OneImageInformation>>
    underConstruction: Record<ShipConstructionProgress, Record<'image' | 'shadowImage', OneImageInformation>>
}

type WorkerCommonFormat = {
    shadowImages: Record<Direction, ImageSeriesInformation>
    fullImages: Record<Direction, ImageSeriesInformation>
    bodyImages: Record<Direction, ImageSeriesInformation>
    bodyImagesByPlayer: Record<Direction, Record<PlayerColor, ImageSeriesInformation>>
    fullImagesByPlayer: Record<Direction, Record<PlayerColor, ImageSeriesInformation>>
    cargoImages?: Record<Material, Record<Direction, ImageSeriesInformation>>
    actions?: Record<WorkerAction, Record<Direction | 'any', ImageSeriesInformation>>
    actionsByPlayer?: Record<WorkerAction, Record<Direction | 'any', Record<PlayerColor, ImageSeriesInformation>>>
}

type WorkerNationSpecificFormat = {
    fullImages: Record<Nation, Record<Direction, ImageSeriesInformation>>
    fullImagesByPlayer: Record<Nation, Record<Direction, Record<PlayerColor, ImageSeriesInformation>>>
    cargoImages?: Record<Nation, Record<Material, Record<Direction, ImageSeriesInformation>>>
    actions?: Record<Nation, Record<WorkerAction, Record<Direction | 'any', ImageSeriesInformation>>>
    actionsByPlayer?: Record<Nation, Record<WorkerAction, Record<Direction | 'any', Record<PlayerColor, ImageSeriesInformation>>>>
}

type WorkerImageAtlasFormat = {
    common: WorkerCommonFormat
    nationSpecific: WorkerNationSpecificFormat
}

type HouseImages = {
    ready: OneImageInformation
    underConstruction: OneImageInformation
    underConstructionShadow: OneImageInformation
    readyShadow: OneImageInformation
    openDoor: OneImageInformation
    workingAnimation?: ImageSeriesInformation
    workingAnimationShadow?: ImageSeriesInformation
}

type HouseImageAtlasInformation = {
    buildings: Record<Nation, Record<AnyBuilding, HouseImages>>
    constructionPlanned: Record<Nation, Record<'image' | 'shadowImage', OneImageInformation>>
    constructionJustStarted: Record<Nation, Record<'image' | 'shadowImage', OneImageInformation>>
}

type SignImageAtlasFormat = {
    images: Record<SignTypes, Record<Size, OneImageInformation>>
    shadowImage: OneImageInformation
}

type FireImageAtlasFormat = {
    fires: Record<FireSize, Record<'image' | 'shadowImage', ImageSeriesInformation>>
    burntDown: Record<Size, OneImageInformation>
}

type CargoInformation = {
    generic: Record<Material, OneImageInformation>
    nationSpecific: Record<Nation, Record<Material, OneImageInformation>>
}

type RoadBuildingInfo = {
    startPoint: OneImageInformation
    sameLevelConnection: OneImageInformation
    upwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImageInformation>
    downwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImageInformation>
}

type TreeImageAtlasFormat = {
    grownTrees: Record<TreeType, ImageSeriesInformation>
    grownTreeShadows: Record<TreeType, ImageSeriesInformation>
    growingTrees: Record<TreeType, Record<TreeSize, OneImageInformation>>
    growingTreeShadows: Record<TreeType, Record<TreeSize, OneImageInformation>>
    fallingTrees: Record<TreeType, ImageSeriesInformation>
    fallingTreeShadows: Record<TreeType, ImageSeriesInformation>
}

type AnimalImageAtlasFormat = {
    images: Record<Direction, ImageSeriesInformation>
    shadowImages?: Record<Direction, OneImageInformation>
    cargos?: Record<Material, OneImageInformation>
    nationSpecific?: Record<Nation, Record<Material, OneImageInformation>>
}

export type AnimationType = 'SINGLE_THEN_FREEZE' | 'REPEAT' | 'SINGLE_THEN_STOP'


// State
const reported = new Set()


// Classes
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
            const response = await fetch(this.pathPrefix + 'image-atlas-ui-elements.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-ui-elements.png')
        }
    }

    getUiElement(type: UiIconType): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo.icons[type]

        return {
            ...imageInfoFromSingleImage(imageInfo),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.selectedPoint),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverPoint),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingLarge),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingMedium),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingSmall),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableMine),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableFlag),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingLarge),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingMedium),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingSmall),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableMine),
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
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableFlag),
            image: this.image,
            textureIndex: this.textureIndex,
            texture: this.texture

        }
    }
}

class MaterialImageAtlasHandler {
    private pathPrefix: string

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    getInventoryIconUrl(nation: Nation, material: Material): string {
        if (material === 'SHIELD') {
            return `${this.pathPrefix}/inventory-icons/${nation}/${material}.png`
        }

        return `${this.pathPrefix}/inventory-icons/${material}.png`
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
            const response = await fetch(this.pathPrefix + 'image-atlas-flags.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-flags.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationFor(nation: Nation, color: PlayerColor, flagType: FlagType, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            console.error('Image or image atlas undefined')
            console.error([this.imageAtlasInfo, this.image])

            return undefined
        }

        const images = this.imageAtlasInfo[nation][flagType][color]
        const shadowImages = this.imageAtlasInfo[nation][flagType]['shadows']

        return [
            {
                ...imageInfoFromHorizontalImageSeries(images, animationCounter),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, animationCounter),
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
            const response = await fetch(this.pathPrefix + 'image-atlas-ship.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-ship.png')
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
                ...imageInfoFromSingleImage(imageInfo),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
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
                ...imageInfoFromSingleImage(image),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
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

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
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

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
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

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(direction: Direction, animationIndex: number, percentageTraveled: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationFor(direction, Math.floor((animationIndex + percentageTraveled) / this.speedAdjust))
    }

    getImageAtlasHandler(): AnimalImageAtlasHandler {
        return this.imageAtlasHandler
    }
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

    getImage(): HTMLImageElement | undefined {
        return this.imageAtlasHandler.getSourceImage()
    }

    getAnimationFrame(nation: Nation, direction: Direction, color: PlayerColor, animationIndex: number, percentageTraveled: number): DrawingInformation[] | undefined {
        return this.imageAtlasHandler.getDrawingInformationForWorker(nation, direction, color, Math.floor(animationIndex / this.speedAdjust), percentageTraveled)
    }

    getActionAnimation(nation: Nation, direction: Direction, action: WorkerAction, color: PlayerColor, animationIndex: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationForAction(nation, direction, action, color, animationIndex)
    }

    getDrawingInformationForCargo(direction: Direction, material: Material, animationIndex: number, offset: number): DrawingInformation | undefined {
        return this.imageAtlasHandler.getDrawingInformationForCargo(direction, material, animationIndex, Math.floor(offset))
    }

    getImageAtlasHandler(): WorkerImageAtlasHandler {
        return this.imageAtlasHandler
    }

    getSize(nation: Nation, direction: Direction, color: PlayerColor): Dimension | undefined {
        return this.imageAtlasHandler.getSize(nation, direction, color)
    }
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

        // Get the image atlas information
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-' + this.name + '.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-' + this.name + '.png')
        }
    }

    getDrawingInformationForWorker(nation: Nation, direction: Direction, color: PlayerColor, animationCounter: number, offset: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        // Shadows are common for all nations
        const shadowImages = this.imageAtlasInfo.common.shadowImages[direction]

        let images

        if (this.imageAtlasInfo.nationSpecific &&
            this.imageAtlasInfo.nationSpecific.fullImagesByPlayer &&
            this.imageAtlasInfo.nationSpecific.fullImagesByPlayer[nation] &&
            this.imageAtlasInfo.nationSpecific.fullImagesByPlayer[nation][direction] &&
            this.imageAtlasInfo.nationSpecific.fullImagesByPlayer[nation][direction][color]
        ) {
            images = this.imageAtlasInfo.nationSpecific.fullImagesByPlayer[nation][direction][color]
        } else if (this.imageAtlasInfo.nationSpecific?.fullImages) {
            images = this.imageAtlasInfo.nationSpecific.fullImages[nation][direction]
        } else if (
            this.imageAtlasInfo.common?.fullImagesByPlayer &&
            this.imageAtlasInfo.common.fullImagesByPlayer[direction] &&
            this.imageAtlasInfo.common.fullImagesByPlayer[direction][color]
        ) {
            images = this.imageAtlasInfo.common.fullImagesByPlayer[direction][color]
        } else if (this.imageAtlasInfo.common?.fullImages) {
            images = this.imageAtlasInfo.common.fullImages[direction]
        } else if (this.imageAtlasInfo.common?.fullImagesByPlayer) {
            images = this.imageAtlasInfo.common.fullImagesByPlayer[direction][color]
        } else if (
            this.imageAtlasInfo.common?.bodyImagesByPlayer &&
            this.imageAtlasInfo.common.bodyImagesByPlayer[direction] &&
            this.imageAtlasInfo.common.bodyImagesByPlayer[direction][color]
        ) {
            images = this.imageAtlasInfo.common.bodyImagesByPlayer[direction][color]
        } else if (this.imageAtlasInfo.common?.bodyImages) {
            images = this.imageAtlasInfo.common.bodyImages[direction]
        } else {
            return undefined
        }

        const frameIndex = (animationCounter + Math.round(offset)) % images.nrImages

        return [
            {
                ...imageInfoFromHorizontalImageSeries(images, frameIndex),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, frameIndex),
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForAction(nation: Nation, direction: Direction, action: WorkerAction, color: PlayerColor, animationIndex: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            console.error('Undefined!')
            console.error([action, direction])

            return undefined
        }

        if (direction &&
            this.imageAtlasInfo.common.actionsByPlayer &&
            this.imageAtlasInfo.common.actionsByPlayer[action] &&
            this.imageAtlasInfo.common.actionsByPlayer[action][direction] &&
            this.imageAtlasInfo.common.actionsByPlayer[action][direction][color]) {
            const actionImages = this.imageAtlasInfo.common.actionsByPlayer[action][direction][color]

            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, animationIndex),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, actionImages.nrImages - 1),
                    image: this.image,
                    texture: this.texture
                }
            }
        } else if (direction &&
            this.imageAtlasInfo.common.actionsByPlayer &&
            this.imageAtlasInfo.common.actionsByPlayer[action] &&
            this.imageAtlasInfo.common.actionsByPlayer[action]['any'] &&
            this.imageAtlasInfo.common.actionsByPlayer[action]['any'][color]) {
            const actionImages = this.imageAtlasInfo.common.actionsByPlayer[action]['any'][color]

            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, animationIndex),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, actionImages.nrImages - 1),
                    image: this.image,
                    texture: this.texture
                }
            }
        } else if (this.imageAtlasInfo.nationSpecific &&
            this.imageAtlasInfo.nationSpecific?.actionsByPlayer &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action][direction] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action][direction][color]) {
            const actionImages = this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action][direction][color]
            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, animationIndex),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, actionImages.nrImages - 1),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) == 'SINGLE_THEN_STOP') {
                // SINGLE_THEN_STOP is handled in the first arm. If we get here the animation is drawn already

                return undefined
            }
        } else if (this.imageAtlasInfo.nationSpecific &&
            this.imageAtlasInfo.nationSpecific?.actionsByPlayer &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action]['any'] &&
            this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action]['any'][color]) {
            const actionImages = this.imageAtlasInfo.nationSpecific.actionsByPlayer[nation][action]['any'][color]
            if (actionAnimationType.get(action) === 'REPEAT' || animationIndex < actionImages.nrImages) {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, animationIndex),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) === 'SINGLE_THEN_FREEZE') {
                return {
                    ...imageInfoFromHorizontalImageSeries(actionImages, actionImages.nrImages - 1),
                    image: this.image,
                    texture: this.texture
                }
            } else if (actionAnimationType.get(action) == 'SINGLE_THEN_STOP') {
                // SINGLE_THEN_STOP is handled in the first arm. If we get here the animation is drawn already

                return undefined
            }
        } else {
            if (!reported.has(action)) {

                console.error(`FOUND NO ACTION: name: ${this.name}, nation: ${nation}, direction: ${direction}, action: ${action}, color: ${color}`)

                reported.add(action)
            }
        }

        return undefined
    }

    getDrawingInformationForCargo(direction: Direction, material: Material, animationIndex: number, offset: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo?.nationSpecific &&
            this.imageAtlasInfo.nationSpecific.cargoImages) {
            return undefined // TODO: fix this when there is a nation specific cargo image
        } else if (this.imageAtlasInfo.common.cargoImages) {
            const cargoImages = this.imageAtlasInfo.common.cargoImages[material][direction]

            return {
                ...imageInfoFromHorizontalImageSeries(cargoImages, (animationIndex + Math.round(offset))),
                image: this.image,
                texture: this.texture
            }
        }

        return undefined
    }

    getSize(nation: Nation, direction: Direction, color: PlayerColor): Dimension | undefined {
        const drawingInfo = this.getDrawingInformationForWorker(nation, direction, color, 0, 0)

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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-buildings.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-buildings.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationForHouseJustStarted(nation: Nation): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionJustStarted[nation].image

        return {
            ...imageInfoFromSingleImage(houseInformation),
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
            ...imageInfoFromSingleImage(houseInformation),
            image: this.image,
            texture: this.texture
        }
    }

    getPartialHouseReady(nation: Nation, houseType: AnyBuilding, percentageReady: number): DrawingInformation[] | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseImage = this.imageAtlasInfo.buildings[nation][houseType].ready
        const houseShadowImage = this.imageAtlasInfo.buildings[nation][houseType].readyShadow

        return [
            {
                sourceX: houseImage.x,
                sourceY: houseImage.y + houseImage.height * ((100 - percentageReady) / 100),
                width: houseImage.width,
                height: houseImage.height * (percentageReady / 100),
                offsetX: houseImage.offsetX,
                offsetY: houseImage.offsetY - houseImage.height * ((100 - percentageReady) / 100),
                image: this.image,
                texture: this.texture
            },
            {
                sourceX: houseShadowImage.x,
                sourceY: houseShadowImage.y + houseImage.height * ((100 - percentageReady) / 100),
                width: houseShadowImage.width,
                height: houseShadowImage.height * (percentageReady / 100),
                offsetX: houseShadowImage.offsetX,
                offsetY: houseShadowImage.offsetY - houseImage.height * ((100 - percentageReady) / 100),
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForOpenDoor(nation: Nation, houseType: AnyBuilding): DrawingInformation | undefined {

        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            console.error('Image or image atlas is undefined')
            console.error([this.image, this.imageAtlasInfo])

            return undefined
        }

        const doorImage = this.imageAtlasInfo.buildings[nation][houseType].openDoor

        if (doorImage) {
            return {
                ...imageInfoFromSingleImage(doorImage),
                image: this.image,
                texture: this.texture
            }
        }

        return undefined
    }

    getDrawingInformationForWorkingHouse(nation: Nation, houseType: AnyBuilding, animationIndex: number): DrawingInformation[] | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            console.error('Image or image atlas is undefined')
            console.error([this.image, this.imageAtlasInfo])

            return undefined
        }

        if (this.imageAtlasInfo?.buildings[nation][houseType] === undefined) {
            console.log([nation, houseType, this.imageAtlasInfo?.buildings[nation]])
        }

        if (this.imageAtlasInfo?.buildings[nation][houseType].workingAnimation === undefined || this.imageAtlasInfo?.buildings[nation][houseType].readyShadow === undefined) {
            console.error(['Missing animation for', nation, houseType])

            return undefined
        }


        const houseAnimation = this.imageAtlasInfo.buildings[nation][houseType].workingAnimation
        const houseAnimationShadow = this.imageAtlasInfo.buildings[nation][houseType].workingAnimationShadow

        if (houseAnimationShadow === undefined) {
            console.log([nation, houseType])

            return undefined
        }

        return [
            {
                ...imageInfoFromHorizontalImageSeries(houseAnimation, animationIndex),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromHorizontalImageSeries(houseAnimationShadow, animationIndex),
                image: this.image,
                texture: this.texture
            }
        ]
    }

    getDrawingInformationForHouseReady(nation: Nation, houseType: AnyBuilding): DrawingInformation[] | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            console.error('Image or image atlas is undefined')
            console.error([this.image, this.imageAtlasInfo])

            return undefined
        }

        if (this.imageAtlasInfo.buildings[nation][houseType] === undefined) {
            console.log([nation, houseType, this.imageAtlasInfo?.buildings[nation]])
        }

        const houseImage = this.imageAtlasInfo.buildings[nation][houseType].ready
        const houseShadowImage = this.imageAtlasInfo.buildings[nation][houseType].readyShadow

        if (houseShadowImage === undefined) {
            console.log([nation, houseType])
        }

        return [
            {
                ...imageInfoFromSingleImage(houseImage),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
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
                ...imageInfoFromSingleImage(houseImage),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
                image: this.image,
                texture: this.texture
            }]
    }
}

class BorderImageAtlasHandler {
    private pathPrefix: string
    private imageAtlasInfo?: Record<Nation, Record<PlayerColor, Record<'summerBorder' | 'winterBorder', OneImageInformation>>>
    private image?: HTMLImageElement
    private texture?: WebGLTexture | null

    constructor(prefix: string) {
        this.pathPrefix = prefix
    }

    async load(): Promise<void> {

        // Get the image atlas information
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-border.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-border.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformation(nation: Nation, color: PlayerColor, type: 'SUMMER' | 'WINTER'): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        let imageInfo

        if (type === 'WINTER') {
            imageInfo = this.imageAtlasInfo[nation][color]['winterBorder']
        } else {
            imageInfo = this.imageAtlasInfo[nation][color]['summerBorder']
        }

        return {
            ...imageInfoFromSingleImage(imageInfo),
            image: this.image,
            texture: this.texture
        }
    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-signs.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-signs.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformation(signType: SignTypes, size: Size): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const image = this.imageAtlasInfo.images[signType][size]
        const shadowImage = this.imageAtlasInfo.shadowImage

        return [
            {
                ...imageInfoFromSingleImage(image),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.image,
                texture: this.texture
            }
        ]
    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-fire.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-fire.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getFireDrawingInformation(size: FireSize, animationIndex: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const fireImage = this.imageAtlasInfo.fires[size].image
        const fireShadowImage = this.imageAtlasInfo.fires[size].shadowImage

        if (fireShadowImage) {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(fireImage, animationIndex),
                    image: this.image,
                    texture: this.texture
                },
                {
                    ...imageInfoFromHorizontalImageSeries(fireShadowImage, animationIndex),
                    image: this.image,
                    texture: this.texture
                }
            ]
        }

        return [
            {
                ...imageInfoFromHorizontalImageSeries(fireImage, animationIndex),
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
            ...imageInfoFromSingleImage(drawingInfo),
            image: this.image,
            texture: this.texture
        }
    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-cargos.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-cargos.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformation(nation: Nation, material: Material): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const genericInfo = this.imageAtlasInfo.generic[material]

        if (genericInfo !== undefined) {
            return {
                ...imageInfoFromSingleImage(genericInfo),
                image: this.image,
                texture: this.texture
            }
        }

        const nationSpecificInfo = this.imageAtlasInfo.nationSpecific[nation]

        if (nationSpecificInfo !== undefined && nationSpecificInfo[material] !== undefined) {
            const drawInfo = nationSpecificInfo[material]

            return {
                ...imageInfoFromSingleImage(drawInfo),
                image: this.image,
                texture: this.texture
            }
        }

        return undefined
    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-road-building.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-road-building.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationForStartPoint(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const startPointInfo = this.imageAtlasInfo.startPoint

        return {
            ...imageInfoFromSingleImage(startPointInfo),
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
            ...imageInfoFromSingleImage(sameLevelConnectionInfo),
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
            ...imageInfoFromSingleImage(connectionInfo),
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
            ...imageInfoFromSingleImage(connectionInfo),
            image: this.image,
            texture: this.texture
        }

    }
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-trees.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-trees.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationForGrownTree(treeType: TreeType, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imagesForTreeType = this.imageAtlasInfo.grownTrees[treeType]
        const shadowImagesForTreeType = this.imageAtlasInfo.grownTreeShadows[treeType]

        return [
            {
                ...imageInfoFromHorizontalImageSeries(imagesForTreeType, animationCounter),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagesForTreeType, animationCounter),
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
                ...imageInfoFromHorizontalImageSeries(imagePerTreeType, step),
                /*sourceX: imagePerTreeType.startX + imagePerTreeType.width * step,
                sourceY: imagePerTreeType.startY,
                width: imagePerTreeType.width,
                height: imagePerTreeType.height,
                offsetX: imagePerTreeType.offsetX,
                offsetY: imagePerTreeType.offsetY,*/
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagePerTreeType, step),
                /*sourceX: shadowImagePerTreeType.startX + shadowImagePerTreeType.width * step,
                sourceY: shadowImagePerTreeType.startY,
                width: shadowImagePerTreeType.width,
                height: shadowImagePerTreeType.height,
                offsetX: shadowImagePerTreeType.offsetX,
                offsetY: shadowImagePerTreeType.offsetY,*/
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
                ...imageInfoFromSingleImage(imageInfo),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.image,
                texture: this.texture
            }
        ]
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-stones.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-stones.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
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
                ...imageInfoFromSingleImage(image),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-decorations.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-decorations.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
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
                    ...imageInfoFromSingleImage(imageInfo),
                    image: this.image,
                    texture: this.texture

                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.image,
                    texture: this.texture

                }
            ]
        }

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-crops.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-crops.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationFor(cropType: CropType, growth: CropGrowth): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo[cropType][growth].image
        const shadowImageInfo = this.imageAtlasInfo[cropType][growth].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.image,
                texture: this.texture
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.image,
                texture: this.texture
            }
        ]
    }
}

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
        if (this.imageAtlasInfo === undefined) {
            const response = await fetch(this.pathPrefix + 'image-atlas-' + this.name + '.json')
            this.imageAtlasInfo = await response.json()
        }

        // Download the actual image atlas
        if (this.image === undefined) {
            this.image = await loadImageNg(this.pathPrefix + 'image-atlas-' + this.name + '.png')
        }
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationForCargo(material: Material, nation: Nation): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo.cargos) {
            const cargoImage = this.imageAtlasInfo.cargos[material]

            if (cargoImage) {
                return {
                    ...imageInfoFromSingleImage(cargoImage),
                    image: this.image,
                    texture: this.texture
                }
            }
        }

        if (this.imageAtlasInfo.nationSpecific) {
            const cargoImage = this.imageAtlasInfo.nationSpecific[nation][material]

            if (cargoImage) {
                return {
                    ...imageInfoFromSingleImage(cargoImage),
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
                    ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                    image: this.image,
                    texture: this.texture
                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.image,
                    texture: this.texture
                }
            ]
        }

        return [
            {
                ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                image: this.image,
                texture: this.texture
            }
        ]

    }
}

type PartialDrawingInformation = Omit<DrawingInformation, 'image' | 'texture'>

function imageInfoFromSingleImage(imageInfo: OneImageInformation): PartialDrawingInformation {
    return {
        sourceX: imageInfo.x,
        sourceY: imageInfo.y,
        width: imageInfo.width,
        height: imageInfo.height,
        offsetX: imageInfo.offsetX,
        offsetY: imageInfo.offsetY
    }
}

function imageInfoFromHorizontalImageSeries(image: ImageSeriesInformation, animationIndex: number): PartialDrawingInformation {
    return {
        sourceX: image.startX + (animationIndex % image.nrImages) * image.width,
        sourceY: image.startY,
        width: image.width,
        height: image.height,
        offsetX: image.offsetX,
        offsetY: image.offsetY,
    }
}

// Constants
const workers = new Map<WorkerType, WorkerAnimation>()

workers.set('Farmer', new WorkerAnimation('assets/', 'farmer', 10))
workers.set('Fisherman', new WorkerAnimation('assets/', 'fisher', 10))
workers.set('Courier', new WorkerAnimation('assets/', 'helper', 10))
workers.set('StorehouseWorker', new WorkerAnimation('assets/', 'helper', 10))
workers.set('Hunter', new WorkerAnimation('assets/', 'hunter', 10))
workers.set('IronFounder', new WorkerAnimation('assets/', 'iron_founder', 10))
workers.set('Metalworker', new WorkerAnimation('assets/', 'metalworker', 10))
workers.set('Miller', new WorkerAnimation('assets/', 'miller', 10))
workers.set('Miner', new WorkerAnimation('assets/', 'miner', 10))
workers.set('Minter', new WorkerAnimation('assets/', 'minter', 10))
workers.set('PigBreeder', new WorkerAnimation('assets/', 'pig_breeder', 10))
workers.set('Planer', new WorkerAnimation('assets/', 'planer', 10))
workers.set('Scout', new WorkerAnimation('assets/', 'scout', 10))
workers.set('ShipWright', new WorkerAnimation('assets/', 'ship_wright', 10))
workers.set('DonkeyBreeder', new WorkerAnimation('assets/', 'donkey_breeder', 10))
workers.set('Butcher', new WorkerAnimation('assets/', 'butcher', 10))
workers.set('Builder', new WorkerAnimation('assets/', 'builder', 10))
workers.set('Brewer', new WorkerAnimation('assets/', 'brewer', 10))
workers.set('Baker', new WorkerAnimation('assets/', 'baker', 10))
workers.set('Armorer', new WorkerAnimation('assets/', 'armorer', 10))
workers.set('WoodcutterWorker', new WorkerAnimation('assets/', 'woodcutter', 10))
workers.set('Forester', new WorkerAnimation('assets/', 'forester', 10))
workers.set('Carpenter', new WorkerAnimation('assets/', 'carpenter', 10))
workers.set('Stonemason', new WorkerAnimation('assets/', 'stonemason', 10))
workers.set('Scout', new WorkerAnimation('assets/', 'scout', 10))
workers.set('Private', new WorkerAnimation('assets/', 'private', 10))
workers.set('Private_first_class', new WorkerAnimation('assets/', 'private_first_class', 10))
workers.set('Sergeant', new WorkerAnimation('assets/', 'sergeant', 10))
workers.set('Officer', new WorkerAnimation('assets/', 'officer', 10))
workers.set('General', new WorkerAnimation('assets/', 'general', 10))
workers.set('Geologist', new WorkerAnimation('assets/', 'geologist', 10))

const uiElementsImageAtlasHandler = new UiElementsImageAtlasHandler('assets/', 0)

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
actionAnimationType.set('CHEW_GUM', 'SINGLE_THEN_STOP')
actionAnimationType.set('HIT', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('JUMP_BACK', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('STAND_ASIDE', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('DIE', 'SINGLE_THEN_STOP')

const ANIMAL_FALLBACK_DIRECTION = new Map<Direction, Direction>()

ANIMAL_FALLBACK_DIRECTION.set('SOUTH_EAST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('SOUTH_WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_WEST', 'SOUTH_EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_EAST', 'SOUTH_WEST')

const houses = new HouseImageAtlasHandler('assets/')
const materialImageAtlasHandler = new MaterialImageAtlasHandler('assets/')
const flagAnimations = new FlagAnimation('assets/', 2)
const shipImageAtlas = new ShipImageAtlasHandler('assets/')

const cargoImageAtlasHandler = new CargoImageAtlasHandler('assets/')

const roadBuildingImageAtlasHandler = new RoadBuildingImageAtlasHandler('assets/')

const signImageAtlasHandler = new SignImageAtlasHandler('assets/')

const cropsImageAtlasHandler = new CropImageAtlasHandler('assets/')

const decorationsImageAtlasHandler = new DecorationsImageAtlasHandler('assets/')

const borderImageAtlasHandler = new BorderImageAtlasHandler('assets/')

const treeAnimations = new TreeAnimation('assets/nature/', 2)
const treeImageAtlasHandler = treeAnimations.getImageAtlasHandler()

const fireAnimations = new FireAnimation('assets/', 2)
const fireImageAtlas = fireAnimations.getImageAtlasHandler()

const stoneImageAtlasHandler = new StoneImageAtlasHandler('assets/')

const animals = new Map<WildAnimalType, AnimalAnimation>()

animals.set('DEER', new AnimalAnimation('assets/nature/animals/', 'deer', 10))
animals.set('DEER_2', new AnimalAnimation('assets/nature/animals/', 'deer2', 10))
animals.set('DUCK', new AnimalAnimation('assets/nature/animals/', 'duck', 10))
animals.set('DUCK_2', new AnimalAnimation('assets/nature/animals/', 'duck', 10))
animals.set('FOX', new AnimalAnimation('assets/nature/animals/', 'fox', 10))
animals.set('RABBIT', new AnimalAnimation('assets/nature/animals/', 'rabbit', 10))
animals.set('SHEEP', new AnimalAnimation('assets/nature/animals/', 'sheep', 10))
animals.set('STAG', new AnimalAnimation('assets/nature/animals/', 'stag', 10))

const donkeyAnimation = new AnimalAnimation('assets/nature/animals/', 'donkey', 10)
const thinCarrierWithCargo = new WorkerAnimation('assets/', 'thin-carrier-with-cargo', 10)
const fatCarrierWithCargo = new WorkerAnimation('assets/', 'fat-carrier-with-cargo', 10)
const thinCarrierNoCargo = new WorkerAnimation('assets/', 'thin-carrier-no-cargo', 10)
const fatCarrierNoCargo = new WorkerAnimation('assets/', 'fat-carrier-no-cargo', 10)

export {
    WorkerAnimation,
    workers,
    houses,
    materialImageAtlasHandler,
    FlagImageAtlasHandler,
    FlagAnimation,
    flagAnimations,
    uiElementsImageAtlasHandler,
    shipImageAtlas,
    cargoImageAtlasHandler,
    roadBuildingImageAtlasHandler,
    signImageAtlasHandler,
    cropsImageAtlasHandler,
    decorationsImageAtlasHandler,
    borderImageAtlasHandler,
    treeAnimations,
    treeImageAtlasHandler,
    fireAnimations,
    fireImageAtlas,
    stoneImageAtlasHandler,
    animals,
    donkeyAnimation,
    thinCarrierWithCargo,
    fatCarrierWithCargo,
    thinCarrierNoCargo,
    fatCarrierNoCargo
}