import { ShipConstructionProgress, PlayerColor, Material, WorkerAction, Nation, AnyBuilding, SignTypes, Size, FireSize, TreeType, TreeSize, Direction } from "../api/types"
import { UiIconType } from "../icons/icon"

export type Dimension = {
    width: number
    height: number
}

export type ImageSeries = {
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

export type OneImage = {
    x: number
    y: number
    width: number
    height: number
    offsetX: number
    offsetY: number
}

export type UiElementsImageAtlas = {
    selectedPoint: OneImage
    hoverPoint: OneImage
    hoverAvailableFlag: OneImage
    hoverAvailableMine: OneImage
    hoverAvailableHarbor: OneImage
    hoverAvailableBuildingLarge: OneImage
    hoverAvailableBuildingMedium: OneImage
    hoverAvailableBuildingSmall: OneImage
    availableFlag: OneImage
    availableMine: OneImage
    availableBuildingHarbor: OneImage
    availableBuildingLarge: OneImage
    availableBuildingMedium: OneImage
    availableBuildingSmall: OneImage

    icons: Record<UiIconType, OneImage>
}

export type ShipImageAtlas = {
    ready: Record<Direction, Record<'image' | 'shadowImage', OneImage>>
    underConstruction: Record<ShipConstructionProgress, Record<'image' | 'shadowImage', OneImage>>
}

type WorkerCommonFormat = {
    shadowImages: Record<Direction, ImageSeries>
    fullImages: Record<Direction, ImageSeries>
    bodyImages: Record<Direction, ImageSeries>
    bodyImagesByPlayer: Record<Direction, Record<PlayerColor, ImageSeries>>
    fullImagesByPlayer: Record<Direction, Record<PlayerColor, ImageSeries>>
    cargoImages?: Record<Material, Record<Direction, ImageSeries>>
    actions?: Record<WorkerAction, Record<Direction | 'any', ImageSeries>>
    actionsByPlayer?: Record<WorkerAction, Record<Direction | 'any', Record<PlayerColor, ImageSeries>>>
}

type WorkerNationSpecificFormat = {
    fullImages: Record<Nation, Record<Direction, ImageSeries>>
    fullImagesByPlayer: Record<Nation, Record<Direction, Record<PlayerColor, ImageSeries>>>
    cargoImages?: Record<Nation, Record<Material, Record<Direction, ImageSeries>>>
    actions?: Record<Nation, Record<WorkerAction, Record<Direction | 'any', ImageSeries>>>
    actionsByPlayer?: Record<Nation, Record<WorkerAction, Record<Direction | 'any', Record<PlayerColor, ImageSeries>>>>
}

export type WorkerImageAtlas = {
    common: WorkerCommonFormat
    nationSpecific: WorkerNationSpecificFormat
}

type HouseImages = {
    ready: OneImage
    underConstruction: OneImage
    underConstructionShadow: OneImage
    readyShadow: OneImage
    openDoor: OneImage
    workingAnimation?: ImageSeries
    workingAnimationShadow?: ImageSeries
}

export type HouseImageAtlas = {
    buildings: Record<Nation, Record<AnyBuilding, HouseImages>>
    constructionPlanned: Record<Nation, Record<'image' | 'shadowImage', OneImage>>
    constructionJustStarted: Record<Nation, Record<'image' | 'shadowImage', OneImage>>
}

export type SignImageAtlas = {
    images: Record<SignTypes, Record<Size, OneImage>>
    shadowImage: OneImage
}

export type FireImageAtlas = {
    fires: Record<FireSize, Record<'image' | 'shadowImage', ImageSeries>>
    burntDown: Record<Size, OneImage>
}

export type CargoImageAtlas = {
    generic: Record<Material, OneImage>
    nationSpecific: Record<Nation, Record<Material, OneImage>>
}

export type RoadBuildingImageAtlas = {
    startPoint: OneImage
    sameLevelConnection: OneImage
    upwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImage>
    downwardsConnections: Record<'HIGH' | 'MEDIUM' | 'LITTLE', OneImage>
}

export type TreeImageAtlas = {
    grownTrees: Record<TreeType, ImageSeries>
    grownTreeShadows: Record<TreeType, ImageSeries>
    growingTrees: Record<TreeType, Record<TreeSize, OneImage>>
    growingTreeShadows: Record<TreeType, Record<TreeSize, OneImage>>
    fallingTrees: Record<TreeType, ImageSeries>
    fallingTreeShadows: Record<TreeType, ImageSeries>
}

export type AnimalImageAtlas = {
    images: Record<Direction, ImageSeries>
    shadowImages?: Record<Direction, OneImage>
    cargos?: Record<Material, OneImage>
    nationSpecific?: Record<Nation, Record<Material, OneImage>>
}

export type AnimationType = 'SINGLE_THEN_FREEZE' | 'REPEAT' | 'SINGLE_THEN_STOP'
