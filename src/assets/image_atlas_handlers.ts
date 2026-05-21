import { AnyBuilding, CropGrowth, CropType, DecorationType, Direction, FireSize, FlagType, Material, Nation, PlayerColor, ShipConstructionProgress, SignType, Size, SmokeType, StoneAmount, StoneType, TreeSize, TreeType, WorkerAction } from '../api/types'
import { AnimalImageAtlas, AnimationType, CargoImageAtlas, Dimension, DrawingInformation, FireImageAtlas, HouseImageAtlas, ImageSeries, OneImage, RoadBuildingImageAtlas, ShipImageAtlas, SignImageAtlas, TreeImageAtlas, UiElementsImageAtlas, WorkerImageAtlas } from './types'
import { AssetsLogConfig } from './config'
import { UiIconType } from '../components/icons/icon'

// Types
type SmokeTable = Record<
    Nation,
    Partial<
        Record<
            AnyBuilding,
            {
                smokeType: SmokeType
                offset: [number, number]
            }
        >
    >
>

type LoadingState =
    | 'NOT_LOADED'
    | 'LOADING'
    | 'LOADED'
    | 'FAILED'

// State
const reported = new Set()

// Constants
export const BUILDING_SMOKE: SmokeTable = {
    AFRICANS: {
        Quarry: { smokeType: 'SMOKE_TYPE_1', offset: [3, -32] },
        Armory: { smokeType: 'SMOKE_TYPE_1', offset: [-32, -23] },
        Metalworks: { smokeType: 'SMOKE_TYPE_4', offset: [-26, -47] },
        IronSmelter: { smokeType: 'SMOKE_TYPE_2', offset: [-20, -37] },
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
        IronSmelter: { smokeType: 'SMOKE_TYPE_1', offset: [-16, -34] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [-15, -26] },
        Mint: { smokeType: 'SMOKE_TYPE_4', offset: [20, -50] }
    },

    VIKINGS: {
        Woodcutter: { smokeType: 'SMOKE_TYPE_1', offset: [2, -36] },
        Fishery: { smokeType: 'SMOKE_TYPE_1', offset: [4, -36] },
        Quarry: { smokeType: 'SMOKE_TYPE_1', offset: [0, -34] },
        ForesterHut: { smokeType: 'SMOKE_TYPE_1', offset: [-5, -29] },
        SlaughterHouse: { smokeType: 'SMOKE_TYPE_1', offset: [7, -41] },
        HunterHut: { smokeType: 'SMOKE_TYPE_1', offset: [-6, -38] },
        Brewery: { smokeType: 'SMOKE_TYPE_3', offset: [5, -39] },
        Armory: { smokeType: 'SMOKE_TYPE_3', offset: [-23, -36] },
        Metalworks: { smokeType: 'SMOKE_TYPE_1', offset: [-9, -35] },
        IronSmelter: { smokeType: 'SMOKE_TYPE_2', offset: [-2, -38] },
        PigFarm: { smokeType: 'SMOKE_TYPE_2', offset: [-30, -37] },
        Bakery: { smokeType: 'SMOKE_TYPE_4', offset: [-21, -26] },
        Sawmill: { smokeType: 'SMOKE_TYPE_1', offset: [-11, -45] },
        Mint: { smokeType: 'SMOKE_TYPE_1', offset: [16, -38] },
        Farm: { smokeType: 'SMOKE_TYPE_1', offset: [-17, -48] },
        DonkeyFarm: { smokeType: 'SMOKE_TYPE_4', offset: [-27, -40] },
    },
}

const OFFSET_ADJUSTMENTS_FOR_ACTIONS: Partial<Record<WorkerAction, { x: number, y: number }>> = {
    'DRAW_WATER_1': { x: 20, y: -13 },
    'OPEN_OVEN': { x: 5, y: -10 },
}


// Classes
abstract class BaseImageAtlasHandler<ImageAtlas extends object> {
    private imageAtlasInfo?: Readonly<ImageAtlas>
    private image?: HTMLImageElement

    private loadingPromise?: Promise<void>

    private loadingState: LoadingState = 'NOT_LOADED'

    protected requireLoaded(): void {
        if (this.loadingState !== 'LOADED' || !this.imageAtlasInfo || !this.image) {
            throw new Error(`${this.constructor.name} is not loaded`)
        }
    }

    protected get atlas(): Readonly<ImageAtlas> {
        this.requireLoaded()

        return this.imageAtlasInfo!
    }

    protected get sourceImage(): HTMLImageElement {
        this.requireLoaded()

        return this.image!
    }

    protected drawSingle(imageInfo: OneImage): DrawingInformation {
        return {
            ...imageInfoFromSingleImage(imageInfo),
            image: this.sourceImage
        }
    }

    protected drawSeries(imageSeries: ImageSeries, animationIndex: number): DrawingInformation {
        return {
            ...imageInfoFromHorizontalImageSeries(imageSeries, animationIndex),
            image: this.sourceImage
        }
    }

    isLoaded(): boolean {
        return this.loadingState === 'LOADED'
    }

    isLoading(): boolean {
        return this.loadingState === 'LOADING'
    }

    hasFailed(): boolean {
        return this.loadingState === 'FAILED'
    }

    getLoadingState(): LoadingState {
        return this.loadingState
    }

    async load(jsonPath: string, imagePath: string): Promise<void> {
        switch (this.loadingState) {
            case 'LOADED':
                return

            case 'LOADING':
                return this.loadingPromise

            case 'FAILED':
            case 'NOT_LOADED':
                break
        }

        this.loadingState = 'LOADING'

        this.loadingPromise = (async () => {
            try {
                const [response, image] = await Promise.all([
                    fetch(jsonPath),
                    loadImageAsync(imagePath)
                ])

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${jsonPath}: ${response.status}`)
                }

                const imageAtlasInfo = await response.json() as ImageAtlas

                this.imageAtlasInfo = imageAtlasInfo
                this.image = image

                this.loadingState = 'LOADED'
            } catch (err) {
                // Allow retry on next call
                this.loadingPromise = undefined

                this.imageAtlasInfo = undefined
                this.image = undefined

                this.loadingState = 'FAILED'

                throw err
            }
        })()

        return this.loadingPromise
    }

    getSourceImage(): HTMLImageElement | undefined {
        return this.sourceImage
    }
}


class UiElementsImageAtlasHandler extends BaseImageAtlasHandler<UiElementsImageAtlas> {
    private readonly pathPrefix: string
    private readonly textureIndex: number

    constructor(prefix: string, textureIndex: number) {
        super()

        this.pathPrefix = prefix
        this.textureIndex = textureIndex
    }

    async load(): Promise<void> {
        await super.load(
            `${this.pathPrefix}image-atlas-ui-elements.json`,
            `${this.pathPrefix}image-atlas-ui-elements.png`
        )
    }

    getUiElement(type: UiIconType): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.icons[type]),
            image: this.sourceImage,
            textureIndex: this.textureIndex
        }
    }

    getImage(): HTMLImageElement | undefined {
        return this.sourceImage
    }

    getDrawingInformationForSelectedPoint(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.selectedPoint),
            image: this.sourceImage,
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForHoverPoint(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverPoint),
            image: this.sourceImage,
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForLargeHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.availableBuildingLarge),
            image: this.sourceImage,
            textureIndex: this.textureIndex
        }
    }

    getDrawingInformationForMediumHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.availableBuildingMedium),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForSmallHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.availableBuildingSmall),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForMineAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.availableMine),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForFlagAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.availableFlag),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverLargeHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverAvailableBuildingLarge),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverMediumHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverAvailableBuildingMedium),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverSmallHouseAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverAvailableBuildingSmall),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverMineAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverAvailableMine),
            image: this.sourceImage,
            textureIndex: this.textureIndex

        }
    }

    getDrawingInformationForHoverFlagAvailable(): DrawingInformation | undefined {
        return {
            ...imageInfoFromSingleImage(this.atlas.hoverAvailableFlag),
            image: this.sourceImage,
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

    getDrawingInformationFor(nation: Nation, color: PlayerColor, flagType: FlagType, animationCounter: number): DrawingInformation[] | undefined {
        const images = this.atlas[nation][flagType][color]
        const shadowImages = this.atlas[nation][flagType]['shadows']

        return [
            {
                ...imageInfoFromHorizontalImageSeries(images, animationCounter),
                image: this.sourceImage
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, animationCounter),
                image: this.sourceImage
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

    getDrawingInformationForShip(direction: Direction): DrawingInformation[] | undefined {
        const imageInfo = this.atlas.ready[direction].image
        const shadowImageInfo = this.atlas.ready[direction].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.sourceImage
            }
        ]
    }

    getDrawingInformationForShipUnderConstruction(constructionProgress: ShipConstructionProgress): DrawingInformation[] | undefined {
        const image = this.atlas.underConstruction[constructionProgress].image
        const shadowImage = this.atlas.underConstruction[constructionProgress].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(image),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.sourceImage
            }
        ]
    }

    getSize(direction: Direction): Dimension {
        return {
            width: this.atlas.ready[direction].image.width ?? 0,
            height: this.atlas.ready[direction].image.height ?? 0
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
        const { common, nationSpecific } = this.atlas

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
                image: this.sourceImage
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImages, frameIndex),
                image: this.sourceImage
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
        const common = this.atlas.common.actionsByPlayer
        const nationSpecific = this.atlas.nationSpecific?.actionsByPlayer

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
            image: this.sourceImage
        }
    }

    getDrawingInformationForCargo(nation: Nation, direction: Direction, material: Material, animationIndex: number, offset: number): DrawingInformation | undefined {
        const cargoImages = this.atlas.nationSpecific?.cargoImages?.[nation]?.[material]?.[direction]

            ?? this.atlas.common?.cargoImages?.[material]?.[direction]

        if (!cargoImages) {
            console.log(`No cargo images for material ${material}`)
            console.log(this.atlas.common.cargoImages)
            console.error(this.name, material, direction)

            return undefined
        }

        return {
            ...imageInfoFromHorizontalImageSeries(cargoImages, (animationIndex + Math.round(offset))),
            image: this.sourceImage
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

    getDrawingInformationForHouseJustStarted(nation: Nation): DrawingInformation | undefined {
        const houseInformation = this.atlas.constructionJustStarted[nation].image

        return {
            ...imageInfoFromSingleImage(houseInformation),
            image: this.sourceImage
        }
    }

    getDrawingInformationForHousePlanned(nation: Nation): DrawingInformation | undefined {
        const houseInformation = this.atlas.constructionPlanned[nation].image

        return {
            ...imageInfoFromSingleImage(houseInformation),
            image: this.sourceImage
        }
    }

    getPartialHouseReady(nation: Nation, houseType: AnyBuilding, percentageReady: number): DrawingInformation[] | undefined {
        const houseImage = this.atlas.buildings[nation][houseType].ready
        const houseShadowImage = this.atlas.buildings[nation][houseType].readyShadow

        return [
            {
                sourceX: houseImage.x,
                sourceY: houseImage.y + houseImage.height * ((100 - percentageReady) / 100),
                width: houseImage.width,
                height: houseImage.height * (percentageReady / 100),
                offsetX: houseImage.offsetX,
                offsetY: houseImage.offsetY - houseImage.height * ((100 - percentageReady) / 100),
                image: this.sourceImage
            },
            {
                sourceX: houseShadowImage.x,
                sourceY: houseShadowImage.y + houseImage.height * ((100 - percentageReady) / 100),
                width: houseShadowImage.width,
                height: houseShadowImage.height * (percentageReady / 100),
                offsetX: houseShadowImage.offsetX,
                offsetY: houseShadowImage.offsetY - houseImage.height * ((100 - percentageReady) / 100),
                image: this.sourceImage
            }
        ]
    }

    getDrawingInformationForOpenDoor(nation: Nation, houseType: AnyBuilding): DrawingInformation | undefined {
        const doorImage = this.atlas.buildings[nation][houseType].openDoor

        if (doorImage) {
            return {
                ...imageInfoFromSingleImage(doorImage),
                image: this.sourceImage
            }
        }

        return undefined
    }

    getDrawingInformationForWorkingHouse(nation: Nation, houseType: AnyBuilding, animationIndex: number): DrawingInformation[] | undefined {
        if (this.atlas.buildings[nation][houseType] === undefined) {
            console.log([nation, houseType, this.atlas.buildings[nation]])
        }

        if (this.atlas.buildings[nation][houseType].workingAnimation === undefined || this.atlas.buildings[nation][houseType].readyShadow === undefined) {
            console.error(['Missing animation for', nation, houseType])

            return undefined
        }


        const houseAnimation = this.atlas.buildings[nation][houseType].workingAnimation
        const houseAnimationShadow = this.atlas.buildings[nation][houseType].workingAnimationShadow

        return [
            {
                ...imageInfoFromHorizontalImageSeries(houseAnimation, animationIndex),
                image: this.sourceImage
            },
            {
                ...(houseAnimationShadow
                    ? imageInfoFromHorizontalImageSeries(houseAnimationShadow, animationIndex)
                    : imageInfoFromSingleImage(this.atlas.buildings[nation][houseType].readyShadow))
                ,
                image: this.sourceImage
            }
        ]
    }

    getDrawingInformationForHouseReady(nation: Nation, houseType: AnyBuilding): DrawingInformation[] | undefined {
        if (this.atlas.buildings[nation][houseType] === undefined) {
            console.log([nation, houseType, this.atlas.buildings[nation]])
        }

        const houseImage = this.atlas.buildings[nation][houseType].ready
        const houseShadowImage = this.atlas.buildings[nation][houseType].readyShadow

        if (houseShadowImage === undefined) {
            console.log([nation, houseType])
        }

        return [
            {
                ...imageInfoFromSingleImage(houseImage),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
                image: this.sourceImage
            }
        ]
    }

    getDrawingInformationForHouseUnderConstruction(nation: Nation, houseType: AnyBuilding): DrawingInformation[] | undefined {
        const houseImage = this.atlas.buildings[nation][houseType].underConstruction
        const houseShadowImage = this.atlas.buildings[nation][houseType].underConstructionShadow

        return [
            {
                ...imageInfoFromSingleImage(houseImage),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(houseShadowImage),
                image: this.sourceImage
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

    getDrawingInformation(nation: Nation, color: PlayerColor, type: 'SUMMER' | 'WINTER'): DrawingInformation | undefined {
        let imageInfo

        if (type === 'WINTER') {
            imageInfo = this.atlas[nation][color]['winterBorder']
        } else {
            imageInfo = this.atlas[nation][color]['summerBorder']
        }

        return {
            ...imageInfoFromSingleImage(imageInfo),
            image: this.sourceImage
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

    getDrawingInformation(signType: SignType, size: Size): DrawingInformation[] | undefined {
        const image = this.atlas.images[signType][size]
        const shadowImage = this.atlas.shadowImage

        return [
            {
                ...imageInfoFromSingleImage(image),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.sourceImage
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

    getFireDrawingInformation(size: FireSize, animationIndex: number): DrawingInformation[] | undefined {
        const fireImage = this.atlas.fires[size].image
        const fireShadowImage = this.atlas.fires[size].shadowImage

        if (fireShadowImage) {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(fireImage, animationIndex),
                    image: this.sourceImage
                },
                {
                    ...imageInfoFromHorizontalImageSeries(fireShadowImage, animationIndex),
                    image: this.sourceImage
                }
            ]
        }

        return [
            {
                ...imageInfoFromHorizontalImageSeries(fireImage, animationIndex),
                image: this.sourceImage
            }
        ]
    }

    getBurntDownDrawingInformation(size: Size): DrawingInformation | undefined {
        const drawingInfo = this.atlas.burntDown[size]

        return {
            ...imageInfoFromSingleImage(drawingInfo),
            image: this.sourceImage
        }
    }

    getSmokeDrawingInformation(nation: Nation, houseType: AnyBuilding, animationIndex: number): DrawingInformation | undefined {
        const smokeType = BUILDING_SMOKE[nation]?.[houseType]

        if (smokeType === undefined) {
            return undefined
        }

        const imageSeriesInfo = this.atlas.smoke[smokeType.smokeType]

        if (imageSeriesInfo) {
            const imageInfo = imageInfoFromHorizontalImageSeries(imageSeriesInfo, animationIndex)
            return {
                ...imageInfo,
                offsetX: -smokeType.offset[0] + imageInfo.offsetX,
                offsetY: -smokeType.offset[1] + imageInfo.offsetY,
                image: this.sourceImage
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

    getDrawingInformation(nation: Nation, material: Material): DrawingInformation | undefined {
        const genericInfo = this.atlas.generic[material]

        if (genericInfo !== undefined) {
            return {
                ...imageInfoFromSingleImage(genericInfo),
                image: this.sourceImage
            }
        }

        const nationSpecificInfo = this.atlas.nationSpecific[nation]

        if (nationSpecificInfo !== undefined && nationSpecificInfo[material] !== undefined) {
            const drawInfo = nationSpecificInfo[material]

            return {
                ...imageInfoFromSingleImage(drawInfo),
                image: this.sourceImage
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

    getDrawingInformationForStartPoint(): DrawingInformation | undefined {
        const startPointInfo = this.atlas.startPoint

        return {
            ...imageInfoFromSingleImage(startPointInfo),
            image: this.sourceImage
        }
    }

    getDrawingInformationForSameLevelConnection(): DrawingInformation | undefined {
        const sameLevelConnectionInfo = this.atlas.sameLevelConnection

        return {
            ...imageInfoFromSingleImage(sameLevelConnectionInfo),
            image: this.sourceImage
        }
    }

    getDrawingInformationForConnectionAbove(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        const connectionInfo = this.atlas.upwardsConnections[difference]

        return {
            ...imageInfoFromSingleImage(connectionInfo),
            image: this.sourceImage
        }

    }

    getDrawingInformationForConnectionBelow(difference: 'LITTLE' | 'MEDIUM' | 'HIGH'): DrawingInformation | undefined {
        const connectionInfo = this.atlas.downwardsConnections[difference]

        return {
            ...imageInfoFromSingleImage(connectionInfo),
            image: this.sourceImage
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

    getDrawingInformationForGrownTree(treeType: TreeType, animationCounter: number): DrawingInformation[] | undefined {
        const imagesForTreeType = this.atlas.grownTrees[treeType]
        const shadowImagesForTreeType = this.atlas.grownTreeShadows[treeType]

        return [
            {
                ...imageInfoFromHorizontalImageSeries(imagesForTreeType, animationCounter),
                image: this.sourceImage
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagesForTreeType, animationCounter),
                image: this.sourceImage
            },
        ]
    }

    getDrawingInformationForFallingTree(treeType: TreeType, step: number): DrawingInformation[] | undefined {
        const imagePerTreeType = this.atlas.fallingTrees[treeType]
        const shadowImagePerTreeType = this.atlas.fallingTreeShadows[treeType]

        return [
            {
                ...imageInfoFromHorizontalImageSeries(imagePerTreeType, step),
                image: this.sourceImage
            },
            {
                ...imageInfoFromHorizontalImageSeries(shadowImagePerTreeType, step),
                image: this.sourceImage
            }
        ]
    }

    getImageForGrowingTree(treeType: TreeType, treeSize: TreeSize): DrawingInformation[] | undefined {
        const imagePerTreeType = this.atlas.growingTrees[treeType]
        const shadowImagePerTreeType = this.atlas.growingTreeShadows[treeType]

        const imageInfo = imagePerTreeType[treeSize]
        const shadowImageInfo = shadowImagePerTreeType[treeSize]

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.sourceImage
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

    getDrawingInformationFor(stoneType: StoneType, amount: StoneAmount): DrawingInformation[] | undefined {
        if (this.atlas[stoneType] === undefined || this.atlas[stoneType][amount] === undefined || this.atlas[stoneType][amount].image === undefined) {
            console.log([this.atlas, stoneType, amount])
        }

        const image = this.atlas[stoneType][amount].image
        const shadowImage = this.atlas[stoneType][amount].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(image),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImage),
                image: this.sourceImage
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

    getDrawingInformationFor(decorationType: DecorationType): DrawingInformation[] | undefined {
        if (this.atlas === undefined || this.atlas[decorationType] === undefined) {
            console.log([this.atlas, decorationType])
        }

        const imageInfo = this.atlas[decorationType].image
        const shadowImage = this.atlas[decorationType].shadowImage

        if (shadowImage) {
            return [
                {
                    ...imageInfoFromSingleImage(imageInfo),
                    image: this.sourceImage

                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.sourceImage

                }
            ]
        }

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.sourceImage
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

    getDrawingInformationFor(cropType: CropType, growth: CropGrowth): DrawingInformation[] | undefined {
        const imageInfo = this.atlas[cropType][growth].image
        const shadowImageInfo = this.atlas[cropType][growth].shadowImage

        return [
            {
                ...imageInfoFromSingleImage(imageInfo),
                image: this.sourceImage
            },
            {
                ...imageInfoFromSingleImage(shadowImageInfo),
                image: this.sourceImage
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

    getDrawingInformationForCargo(material: Material, nation: Nation): DrawingInformation | undefined {
        const cargoImage = this.atlas.nationSpecific?.[nation]?.[material]
            ?? this.atlas.cargos?.[material]

        if (!cargoImage) {
            console.error(`Didn't find cargo image`, material, nation)

            return undefined
        }

        return {
            ...imageInfoFromSingleImage(cargoImage),
            image: this.sourceImage
        }
    }

    getDrawingInformationFor(direction: Direction, animationCounter: number): DrawingInformation[] | undefined {
        const image = this.atlas.images[direction]
        const shadowImage = this.atlas.shadowImages?.[direction]
            ?? this.atlas.shadowImages?.['EAST']

        if (shadowImage) {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                    image: this.sourceImage
                },
                {
                    ...imageInfoFromSingleImage(shadowImage),
                    image: this.sourceImage
                }
            ]
        } else {
            return [
                {
                    ...imageInfoFromHorizontalImageSeries(image, animationCounter),
                    image: this.sourceImage
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