import { AnyBuilding, CropGrowth, CropType, DecorationType, Direction, FireSize, FlagType, Material, Nation, PlayerColor, ShipConstructionProgress, SignTypes, Size, SmokeType, StoneAmount, StoneType, TreeSize, TreeType, WorkerAction } from '../api/types'
import { UiIconType } from '../icons/icon'
import { AnimalImageAtlas, AnimationType, CargoImageAtlas, Dimension, DrawingInformation, FireImageAtlas, HouseImageAtlas, ImageSeries, OneImage, RoadBuildingImageAtlas, ShipImageAtlas, SignImageAtlas, TreeImageAtlas, UiElementsImageAtlas, WorkerImageAtlas } from './types'
import { AssetsLogConfig } from './config'

// Types
type SmokeTable = {
    [key in Nation]: {
        [key in AnyBuilding]?: {
            smokeType: SmokeType,
            offset: [number, number]
        }
    }
}

// State
const reported = new Set()

// Constants
export const BUILDING_SMOKE: SmokeTable = {
    AFRICANS: {
        Quarry: { smokeType: 'SMOKE_TYPE_1', offset: [3, -32] },
        Armory: { smokeType: 'SMOKE_TYPE_1', offset: [-32, -23] },
        Metalworks: { smokeType: 'SMOKE_TYPE_4', offset: [-26, -47] },
        Ironsmelter: { smokeType: 'SMOKE_TYPE_2', offset: [-20, -37] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [27, -39] },
        Mint: { smokeType: 'SMOKE_TYPE_1', offset: [17, -52] }
    },

    JAPANESE: {
        Armory: { smokeType: 'SMOKE_TYPE_1', offset: [-22, -43] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [-30, -39] },
        Mint: { smokeType: 'SMOKE_TYPE_3', offset: [18, -58] }
    },

    ROMANS: {
        Brewery: { smokeType: 'SMOKE_TYPE_1', offset: [-26, -45] },
        Armory: { smokeType: 'SMOKE_TYPE_2', offset: [-36, -34] },
        Ironsmelter: { smokeType: 'SMOKE_TYPE_1', offset: [-16, -34] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [-15, -26] },
        Mint: { smokeType: 'SMOKE_TYPE_4', offset: [20, -50] }
    },

    VIKINGS: {
        Woodcutter: { smokeType: 'SMOKE_TYPE_1', offset: [2, -36] },
        Fishery: { smokeType: 'SMOKE_TYPE_1', offset: [4, -36] },
        Quarry: { smokeType: 'SMOKE_TYPE_1', offset: [0, -34] },
        Forester: { smokeType: 'SMOKE_TYPE_1', offset: [-5, -29] },
        Slaughterhouse: { smokeType: 'SMOKE_TYPE_1', offset: [7, -41] },
        Hunter: { smokeType: 'SMOKE_TYPE_1', offset: [-6, -38] },
        Brewery: { smokeType: 'SMOKE_TYPE_3', offset: [5, -39] },
        Armory: { smokeType: 'SMOKE_TYPE_3', offset: [-23, -36] },
        Metalworks: { smokeType: 'SMOKE_TYPE_1', offset: [-9, -35] },
        Ironsmelter: { smokeType: 'SMOKE_TYPE_2', offset: [-2, -38] },
        PigFarm: { smokeType: 'SMOKE_TYPE_2', offset: [-30, -37] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [-21, -26] },
        Sawmill: { smokeType: 'SMOKE_TYPE_1', offset: [-11, -45] },
        Mint: { smokeType: 'SMOKE_TYPE_1', offset: [16, -38] },
        Farm: { smokeType: 'SMOKE_TYPE_1', offset: [-17, -48] },
        DonkeyBreeder: { smokeType: 'SMOKE_TYPE_4', offset: [-27, -40] },
    },
}

const OFFSET_ADJUSTMENTS_FOR_ACTIONS: Partial<Record<WorkerAction, { x: number, y: number }>> = {
    'DRAW_WATER_1': { x: 20, y: -13 },
    'OPEN_OVEN': { x: 5, y: -10 },
}

// Classes
abstract class BaseImageAtlasHandler<ImageAtlas> {
    protected imageAtlasInfo?: ImageAtlas
    protected image?: HTMLImageElement

    private loadingPromise?: Promise<void>

    async load(jsonPath: string, imagePath: string) {
        if (!this.loadingPromise) {
            this.loadingPromise = (async () => {
                try {
                    const response = await fetch(jsonPath)

                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${jsonPath}: ${response.status}`)
                    }

                    this.imageAtlasInfo = await response.json()
                    this.image = await loadImageAsync(imagePath)
                } catch (err) {
                    // Allow retry on next call
                    this.loadingPromise = undefined
                    throw err
                }
            })()
        }

        return this.loadingPromise
    }
}


class UiElementsImageAtlasHandler extends BaseImageAtlasHandler<UiElementsImageAtlas> {
    private pathPrefix: string
    private textureIndex: number

    constructor(prefix: string, textureIndex: number) {
        super()

        this.pathPrefix = prefix
        this.textureIndex = textureIndex
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-ui-elements.json', this.pathPrefix + 'image-atlas-ui-elements.png')
    }

    getUiElement(type: UiIconType): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const imageInfo = this.imageAtlasInfo.icons[type]

        return {
            ...imageInfoFromSingleImage(imageInfo),
            image: this.image,
            textureIndex: this.textureIndex
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
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForHoverPoint(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverPoint),
            image: this.image,
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForLargeHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingLarge),
            image: this.image,
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForMediumHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingMedium),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForSmallHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableBuildingSmall),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForMineAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableMine),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForFlagAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.availableFlag),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverLargeHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingLarge),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverMediumHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingMedium),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverSmallHouseAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableBuildingSmall),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverMineAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableMine),
            image: this.image,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverFlagAvailable(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        return {
            ...imageInfoFromSingleImage(this.imageAtlasInfo.hoverAvailableFlag),
            image: this.image,
            textureIndex: this.textureIndex

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

class FlagImageAtlasHandler extends BaseImageAtlasHandler<Record<Nation, Record<FlagType, Record<PlayerColor | 'shadows', ImageSeries>>>> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-flags.json', this.pathPrefix + 'image-atlas-flags.png')
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
                image: this.image
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, animationCounter),
                image: this.image
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

class ShipImageAtlasHandler extends BaseImageAtlasHandler<ShipImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-ship.json', this.pathPrefix + 'image-atlas-ship.png')
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.image
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.image
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

class WorkerImageAtlasHandler extends BaseImageAtlasHandler<WorkerImageAtlas> {
    private pathPrefix: string
    private name: string

    constructor(prefix: string, name: string) {
        super()

        this.pathPrefix = prefix
        this.name = name
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-' + this.name + '.json', this.pathPrefix + 'image-atlas-' + this.name + '.png')
    }

    getDrawingInformationForWorker(nation: Nation, direction: Direction, color: PlayerColor, animationCounter: number, offset: number): DrawingInformation[] | undefined {
        const atlas = this.imageAtlasInfo
        const image = this.image

        if (!atlas || !image) {
            return undefined
        }

        const { common, nationSpecific } = atlas

        // Shadows are common for all nations
        const shadowImages = common.shadowImages[direction]

        const images = nationSpecific?.fullImagesByPlayer?.[nation]?.[direction]?.[color]
                    ?? nationSpecific?.fullImages?.[nation]?.[direction]
                    ?? common?.fullImagesByPlayer?.[direction]?.[color]
                    ?? common?.fullImages?.[direction]
                    ?? common?.bodyImagesByPlayer?.[direction]?.[color]
                    ?? common?.bodyImages?.[direction]

        if (!images) {
            return undefined
        }

        const frameIndex = animationCounter + Math.round(offset)

        return [
            {
                ...imageInfoFromHorizontalImageSeries(images, frameIndex),
                image
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, frameIndex),
                image
            }
        ]
    }

    getDrawingInformationForAction(
        nation: Nation,
        direction: Direction,
        action: WorkerAction,
        color: PlayerColor,
        animationIndex: number
    ): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            console.error('Undefined!')
            console.error([action, direction])

            return undefined
        }

        const common = this.imageAtlasInfo.common.actionsByPlayer
        const nationSpecific = this.imageAtlasInfo.nationSpecific?.actionsByPlayer

        const animationType = actionAnimationType.get(action)

        // Try to find action images common across nations
        const actionImages = common?.[action]?.[direction]?.[color]
                          ?? common?.[action]?.['any']?.[color]
                          ?? nationSpecific?.[nation]?.[action]?.[direction]?.[color]
                          ?? nationSpecific?.[nation]?.[action]?.['any']?.[color]

        // Report if there still is no action image found
        if (!actionImages) {
            if (!reported.has(action)) {
                console.error(`FOUND NO ACTION: name: ${this.name}, nation: ${nation}, direction: ${direction}, action: ${action}, color: ${color}`)
                reported.add(action)
            }

            return undefined
        }

        // Find the next frame to draw based on the animation type. Let 'REPEAT' be the default
        let image: PartialDrawingInformation | undefined = undefined

        switch (animationType) {
            case 'SINGLE_THEN_STOP':
                if (animationIndex < actionImages.nrImages) {
                    image = imageInfoFromHorizontalImageSeries(actionImages, animationIndex)
                }
                break
            case 'SINGLE_THEN_FREEZE':
                image = imageInfoFromHorizontalImageSeries(actionImages, Math.min(animationIndex, actionImages.nrImages - 1))
                break
            case 'REPEAT':
                image = imageInfoFromHorizontalImageSeries(actionImages, animationIndex)
                break
            default:
                image = imageInfoFromHorizontalImageSeries(actionImages, animationIndex)
                break
        }

        if (!image) {
            return undefined
        }

        const { x, y } = OFFSET_ADJUSTMENTS_FOR_ACTIONS[action] ?? { x: 0, y: 0 }

        return {
            ...image,
            offsetX: image.offsetX + x,
            offsetY: image.offsetY + y,
            image: this.image
        }
    }

    getDrawingInformationForCargo(nation: Nation, direction: Direction, material: Material, animationIndex: number, offset: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const cargoImages = this.imageAtlasInfo?.nationSpecific?.cargoImages?.[nation]?.[material]?.[direction]

            ?? this.imageAtlasInfo?.common?.cargoImages?.[material]?.[direction]

        if (!cargoImages) {
            console.log(`No cargo images for material ${material}`)
            console.log(this.imageAtlasInfo.common.cargoImages)
            console.error(this.name, material, direction)

            return undefined
        }

        return {
            ...imageInfoFromHorizontalImageSeries(cargoImages, (animationIndex + Math.round(offset))),
            image: this.image
        }
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

class HouseImageAtlasHandler extends BaseImageAtlasHandler<HouseImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-buildings.json', this.pathPrefix + 'image-atlas-buildings.png')
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
            image: this.image
        }
    }

    getDrawingInformationForHousePlanned(nation: Nation): DrawingInformation | undefined {
        if (this.image === undefined || this.imageAtlasInfo === undefined) {
            return undefined
        }

        const houseInformation = this.imageAtlasInfo.constructionPlanned[nation].image

        return {
            ...imageInfoFromSingleImage(houseInformation),
            image: this.image
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
                image: this.image
            },
            {
                sourceX: houseShadowImage.x,
                sourceY: houseShadowImage.y + houseImage.height * ((100 - percentageReady) / 100),
                width: houseShadowImage.width,
                height: houseShadowImage.height * (percentageReady / 100),
                offsetX: houseShadowImage.offsetX,
                offsetY: houseShadowImage.offsetY - houseImage.height * ((100 - percentageReady) / 100),
                image: this.image
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
                image: this.image
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

        return [
            {
                ...imageInfoFromHorizontalImageSeries(houseAnimation, animationIndex),
                image: this.image
            },
            {
                ...(houseAnimationShadow
                    ? imageInfoFromHorizontalImageSeries(houseAnimationShadow, animationIndex)
                    : imageInfoFromSingleImage(this.imageAtlasInfo.buildings[nation][houseType].readyShadow))
                ,
                image: this.image
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
                image: this.image
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
                image: this.image
            }]
    }
}

class BorderImageAtlasHandler extends BaseImageAtlasHandler<Record<Nation, Record<PlayerColor, Record<'summerBorder' | 'winterBorder', OneImage>>>> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-border.json', this.pathPrefix + 'image-atlas-border.png')
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
            image: this.image
        }
    }
}

class SignImageAtlasHandler extends BaseImageAtlasHandler<SignImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-signs.json', this.pathPrefix + 'image-atlas-signs.png')
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.image
            }
        ]
    }
}

class FireImageAtlasHandler extends BaseImageAtlasHandler<FireImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-fire.json', this.pathPrefix + 'image-atlas-fire.png')
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
                    image: this.image
                },
                {
                    ...imageInfoFromHorizontalImageSeries(fireShadowImage, animationIndex),
                    image: this.image
                }
            ]
        }

        return [
            {
                ...imageInfoFromHorizontalImageSeries(fireImage, animationIndex),
                image: this.image
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
            image: this.image
        }
    }

    getSmokeDrawingInformation(nation: Nation, houseType: AnyBuilding, animationIndex: number): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const smokeType = BUILDING_SMOKE[nation]?.[houseType]

        if (smokeType === undefined) {
            return undefined
        }

        const imageSeriesInfo = this.imageAtlasInfo.smoke[smokeType.smokeType]

        if (imageSeriesInfo) {
            const imageInfo = imageInfoFromHorizontalImageSeries(imageSeriesInfo, animationIndex)
            return {
                ...imageInfo,
                offsetX: -smokeType.offset[0] + imageInfo.offsetX,
                offsetY: -smokeType.offset[1] + imageInfo.offsetY,
                image: this.image
            }
        }

        return undefined
    }
}

class CargoImageAtlasHandler extends BaseImageAtlasHandler<CargoImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-cargos.json', this.pathPrefix + 'image-atlas-cargos.png')
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
                image: this.image
            }
        }

        const nationSpecificInfo = this.imageAtlasInfo.nationSpecific[nation]

        if (nationSpecificInfo !== undefined && nationSpecificInfo[material] !== undefined) {
            const drawInfo = nationSpecificInfo[material]

            return {
                ...imageInfoFromSingleImage(drawInfo),
                image: this.image
            }
        }

        return undefined
    }
}

class RoadBuildingImageAtlasHandler extends BaseImageAtlasHandler<RoadBuildingImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-road-building.json', this.pathPrefix + 'image-atlas-road-building.png')
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
            image: this.image
        }
    }

    getDrawingInformationForSameLevelConnection(): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const sameLevelConnectionInfo = this.imageAtlasInfo.sameLevelConnection

        return {
            ...imageInfoFromSingleImage(sameLevelConnectionInfo),
            image: this.image
        }
    }

    getDrawingInformationForConnectionAbove(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const connectionInfo = this.imageAtlasInfo.upwardsConnections[difference]

        return {
            ...imageInfoFromSingleImage(connectionInfo),
            image: this.image
        }

    }

    getDrawingInformationForConnectionBelow(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const connectionInfo = this.imageAtlasInfo.downwardsConnections[difference]

        return {
            ...imageInfoFromSingleImage(connectionInfo),
            image: this.image
        }

    }
}

class TreeImageAtlasHandler extends BaseImageAtlasHandler<TreeImageAtlas> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-trees.json', this.pathPrefix + 'image-atlas-trees.png')
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
                image: this.image
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagesForTreeType, animationCounter),
                image: this.image
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
                image: this.image
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagePerTreeType, step),
                image: this.image
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.image
            }
        ]
    }
}

type StoneImageAtlasInfo = Record<StoneType, Record<StoneAmount, Record<'image' | 'shadowImage', OneImage>>>
class StoneImageAtlasHandler extends BaseImageAtlasHandler<StoneImageAtlasInfo> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-stones.json', this.pathPrefix + 'image-atlas-stones.png')
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationFor(stoneType: StoneType, amount: StoneAmount): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        if (this.imageAtlasInfo[stoneType] === undefined || this.imageAtlasInfo[stoneType][amount] === undefined || this.imageAtlasInfo[stoneType][amount].image === undefined) {
            console.log([this.imageAtlasInfo, stoneType, amount])
        }

        const image = this.imageAtlasInfo[stoneType][amount].image
        const shadowImage = this.imageAtlasInfo[stoneType][amount].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(image),
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.image
            }
        ]
    }
}

type DecorationImageAtlasInfo = Record<DecorationType, Record<'image' | 'shadowImage', OneImage>>
class DecorationsImageAtlasHandler extends BaseImageAtlasHandler<DecorationImageAtlasInfo> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-decorations.json', this.pathPrefix + 'image-atlas-decorations.png')
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
                    image: this.image

                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.image

                }
            ]
        }

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.image
            }
        ]
    }
}

type CropImageAtlasInfo = Record<CropType, Record<CropGrowth, Record<'image' | 'shadowImage', OneImage>>>
class CropImageAtlasHandler extends BaseImageAtlasHandler<CropImageAtlasInfo> {
    private pathPrefix: string

    constructor(prefix: string) {
        super()

        this.pathPrefix = prefix
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-crops.json', this.pathPrefix + 'image-atlas-crops.png')
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
                image: this.image
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.image
            }
        ]
    }
}

class AnimalImageAtlasHandler extends BaseImageAtlasHandler<AnimalImageAtlas> {
    private pathPrefix: string
    private name: string

    constructor(prefix: string, name: string) {
        super()

        this.pathPrefix = prefix
        this.name = name
    }

    async load(): Promise<void> {
        await super.load(this.pathPrefix + 'image-atlas-' + this.name + '.json', this.pathPrefix + 'image-atlas-' + this.name + '.png')
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.image
    }

    getDrawingInformationForCargo(material: Material, nation: Nation): DrawingInformation | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const cargoImage = this.imageAtlasInfo?.nationSpecific?.[nation]?.[material]
            ?? this.imageAtlasInfo?.cargos?.[material]

        if (!cargoImage) {
            console.error(`Didn't find cargo image`, material, nation)

            return undefined
        }

        return {
            ...imageInfoFromSingleImage(cargoImage),
            image: this.image
        }
    }

    getDrawingInformationFor(direction: Direction, animationCounter: number): DrawingInformation[] | undefined {
        if (this.imageAtlasInfo === undefined || this.image === undefined) {
            return undefined
        }

        const image = this.imageAtlasInfo.images[direction]
        const shadowImage = this.imageAtlasInfo.shadowImages?.[direction]
            ?? this.imageAtlasInfo.shadowImages?.['EAST']

        if (shadowImage) {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                    image: this.image
                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.image
                }
            ]
        } else {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                    image: this.image
                }
            ]
        }
    }
}

type PartialDrawingInformation = Omit<DrawingInformation, 'image' | 'texture'>

function imageInfoFromSingleImage(imageInfo: OneImage): PartialDrawingInformation {
    return {
        sourceX: imageInfo.x,
        sourceY: imageInfo.y,
        width: imageInfo.width,
        height: imageInfo.height,
        offsetX: imageInfo.offsetX,
        offsetY: imageInfo.offsetY
    }
}

function imageInfoFromHorizontalImageSeries(image: ImageSeries, animationIndex: number): PartialDrawingInformation {
    const index = ((animationIndex % image.nrImages) + image.nrImages) % image.nrImages

    return {
        sourceX: image.startX + index * image.width,
        sourceY: image.startY,
        width: image.width,
        height: image.height,
        offsetX: image.offsetX,
        offsetY: image.offsetY,
    }
}

function loadImageAsync(src: string): Promise<HTMLImageElement> {
    if (AssetsLogConfig.loadImage) {
        console.log(`Loading ${src}`)
    }

    return new Promise((resolve, reject) => {
        const image = new Image()

        image.onload = () => {
            if (AssetsLogConfig.loadImage) {
                console.log(`Loaded ${src}`)
            }

            resolve(image)
        }

        image.onerror = () => {
            console.error(`Failed to load ${src}`)

            reject(new Error(`Failed to load ${src}`))
        }

        image.src = src
    })
}

// Constants
const uiElementsImageAtlasHandler = new UiElementsImageAtlasHandler('assets/', 0)

const ANIMAL_FALLBACK_DIRECTION = new Map<Direction, Direction>()

ANIMAL_FALLBACK_DIRECTION.set('SOUTH_EAST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('SOUTH_WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('WEST', 'EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_WEST', 'SOUTH_EAST')
ANIMAL_FALLBACK_DIRECTION.set('NORTH_EAST', 'SOUTH_WEST')

const houses = new HouseImageAtlasHandler('assets/')
const materialImageAtlasHandler = new MaterialImageAtlasHandler('assets/')
const shipImageAtlas = new ShipImageAtlasHandler('assets/')
const cargoImageAtlasHandler = new CargoImageAtlasHandler('assets/')
const roadBuildingImageAtlasHandler = new RoadBuildingImageAtlasHandler('assets/')
const signImageAtlasHandler = new SignImageAtlasHandler('assets/')
const cropsImageAtlasHandler = new CropImageAtlasHandler('assets/')
const decorationsImageAtlasHandler = new DecorationsImageAtlasHandler('assets/')
const borderImageAtlasHandler = new BorderImageAtlasHandler('assets/')
const fireImageAtlasHandler = new FireImageAtlasHandler('assets/')
const stoneImageAtlasHandler = new StoneImageAtlasHandler('assets/')
const treeImageAtlasHandler = new TreeImageAtlasHandler('assets/nature/')
const flagImageAtlasHandler = new FlagImageAtlasHandler('assets/')

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
actionAnimationType.set('HAMMER_TO_MAKE_TOOL', 'REPEAT')
actionAnimationType.set('SAWING_TO_MAKE_TOOL', 'REPEAT')
actionAnimationType.set('WIPE_OFF_SWEAT_TO_MAKE_TOOL', 'SINGLE_THEN_FREEZE')
actionAnimationType.set('SLAUGHTERING', 'REPEAT')
actionAnimationType.set('OPEN_OVEN', 'SINGLE_THEN_STOP')
actionAnimationType.set('DRAW_WATER_1', 'REPEAT')
actionAnimationType.set('FEED_THE_PIGS', 'SINGLE_THEN_STOP')

export {
    houses,
    materialImageAtlasHandler,
    WorkerImageAtlasHandler,
    AnimalImageAtlasHandler,
    uiElementsImageAtlasHandler,
    shipImageAtlas,
    cargoImageAtlasHandler,
    roadBuildingImageAtlasHandler,
    signImageAtlasHandler,
    cropsImageAtlasHandler,
    decorationsImageAtlasHandler,
    borderImageAtlasHandler,
    treeImageAtlasHandler,
    fireImageAtlasHandler,
    stoneImageAtlasHandler,
    flagImageAtlasHandler,
    loadImageAsync
}