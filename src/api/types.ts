import { PointMapFast } from "../util_types"

// Identities
export type GameId = string
export type PlayerId = string
export type MapId = string
export type HouseId = string
export type FlagId = string
export type RoadId = string
export type WorkerId = string
export type SignId = string
export type TreeId = string
export type WildAnimalId = string
export type CropId = string
export type ShipId = string
export type GameMessageId = string

export type ShipConstructionProgress = 'JUST_STARTED' | 'HALF_WAY' | 'ALMOST_DONE' | 'READY'

export type AvailableConstruction = "flag" | "small" | "medium" | "large" | "mine"

export type ResourceLevel = "LOW" | "MEDIUM" | "HIGH"

export type TransportCategories = 'food' | 'weapons' | 'tools' | 'iron' | 'iron_bar' | 'coal' | 'gold' | 'plank' | 'wood' | 'stone' | 'coin' | 'wheat' | 'water' | 'pig' | 'flour'
export type TransportCategoriesUpperCase = 'FOOD' | 'WEAPONS' | 'TOOLS' | 'IRON' | 'IRON_BAR' | 'COAL' | 'GOLD' | 'PLANK' | 'WOOD' | 'STONE' | 'COIN' | 'WHEAT' | 'WATER' | 'PIG' | 'FLOUR'
export const TRANSPORT_CATEGORIES = new Set<TransportCategories>(['food', 'weapons', 'tools', 'iron', 'iron_bar', 'coal', 'gold', 'plank', 'wood', 'stone', 'coin', 'wheat', 'water', 'pig', 'flour'])
export const TRANSPORT_CATEGORIES_UPPER_CASE = new Set<TransportCategoriesUpperCase>(['FOOD', 'WEAPONS', 'TOOLS', 'IRON', 'IRON_BAR', 'COAL', 'GOLD', 'PLANK', 'WOOD', 'STONE', 'COIN', 'WHEAT', 'WATER', 'PIG', 'FLOUR'])

export type MaterialAllUpperCase = "FLOUR" | "PIG" | "GOLD" | "IRON" | "COAL" | "STONE" | "WATER" | "WOOD" | "PLANK" | "BREAD" | "FISH" | "MEAT" | "SHIELD" | "SWORD" | "BEER" | "COIN" | "METALWORKER" | "WHEAT" | "SHIPWRIGHT" | "IRON_BAR" | ToolAllUpperCase | MaterialWorkerUpperCase
export const WORKER_MATERIALS_UPPER_CASE = new Set<MaterialWorkerUpperCase>(['ARMORER', 'BAKER', 'BREWER', 'BUTCHER', 'COURIER', 'DONKEY_BREEDER', 'DONKEY', 'FARMER', 'FISHERMAN', 'FORESTER', 'GEOLOGIST', 'HUNTER', 'IRON_FOUNDER', 'METALWORKER', 'MILLER', 'MINER', 'MINTER', 'PIG_BREEDER', 'SAWMILL_WORKER', 'SCOUT', 'STONEMASON', 'STORAGE_WORKER', 'WELL_WORKER', 'WOODCUTTER_WORKER', 'PRIVATE', 'PRIVATE_FIRST_CLASS', 'SERGEANT', 'OFFICER', 'GENERAL', 'BUILDER', 'PLANER', 'SHIPWRIGHT'])

export const MATERIALS_UPPER_CASE = new Set<MaterialAllUpperCase>(["PIG", "FLOUR", "GOLD", "IRON", "COAL", "STONE", "WATER", "WOOD", "PLANK", "BREAD", "FISH", "MEAT", "SHIELD", "SWORD", "BEER", "COIN", "METALWORKER", "WHEAT", "SHIPWRIGHT", 'AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE', 'IRON_BAR'])
WORKER_MATERIALS_UPPER_CASE.forEach(workerMaterial => MATERIALS_UPPER_CASE.add(workerMaterial))

export const MATERIALS_UPPER_CASE_AS_STRING = new Set<string>(["PIG", "FLOUR", "GOLD", "IRON", "COAL", "STONE", "WATER", "WOOD", "PLANK", "BREAD", "FISH", "MEAT", "SHIELD", "SWORD", "BEER", "COIN", "METALWORKER", "WHEAT", "SHIPWRIGHT", 'AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE', 'IRON_BAR'])
WORKER_MATERIALS_UPPER_CASE.forEach(workerMaterial => MATERIALS_UPPER_CASE_AS_STRING.add(workerMaterial))

export type ToolAllUpperCase = 'AXE' | 'SHOVEL' | 'PICK_AXE' | 'FISHING_ROD' | 'BOW' | 'SAW' | 'CLEAVER' | 'ROLLING_PIN' | 'CRUCIBLE' | 'TONGS' | 'SCYTHE'
export type Tool = 'axe' | 'shovel' | 'pick_axe' | 'fishing_rod' | 'bow' | 'saw' | 'cleaver' | 'rolling_pin' | 'crucible' | 'tongs' | 'scythe'

export const TOOLS: Set<Tool> = new Set(['axe', 'shovel', 'pick_axe', 'fishing_rod', 'bow', 'saw', 'cleaver', 'rolling_pin', 'crucible', 'tongs', 'scythe'])
export const TOOLS_AS_STRING: Set<string> = new Set(['axe', 'shovel', 'pick_axe', 'fishing_rod', 'bow', 'saw', 'cleaver', 'rolling_pin', 'crucible', 'tongs', 'scythe'])
export const TOOLS_UPPER_CASE: Set<ToolAllUpperCase> = new Set(['AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'])
export const TOOLS_UPPER_CASE_STRING: Set<string> = new Set(['AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'])

export type MaterialWorkerUpperCase = 'ARMORER' | 'BAKER' | 'BREWER' | 'BUTCHER' | 'COURIER' | 'DONKEY_BREEDER' | 'DONKEY' | 'FARMER' | 'FISHERMAN' | 'FORESTER' | 'GEOLOGIST' | 'HUNTER' | 'IRON_FOUNDER' | 'METALWORKER' | 'MILLER' | 'MINER' | 'MINTER' | 'PIG_BREEDER' | 'SAWMILL_WORKER' | 'SCOUT' | 'STONEMASON' | 'STORAGE_WORKER' | 'WELL_WORKER' | 'WOODCUTTER_WORKER' | 'PRIVATE' | 'PRIVATE_FIRST_CLASS' | 'SERGEANT' | 'OFFICER' | 'GENERAL' | 'BUILDER' | 'PLANER' | 'SHIPWRIGHT'

export type NationSmallCaps = 'romans' | 'africans' | 'japanese' | 'vikings'
export type Nation = 'ROMANS' | 'AFRICANS' | 'JAPANESE' | 'VIKINGS'

export const NATIONS = new Set(['ROMANS', 'AFRICANS', 'JAPANESE', 'VIKINGS'])

export type Direction = "EAST" | "SOUTH_EAST" | "SOUTH_WEST" | "WEST" | "NORTH_WEST" | "NORTH_EAST"

export type StoneType = 'TYPE_1' | 'TYPE_2'

export type CropType = 'TYPE_1' | 'TYPE_2'

export type CropGrowth = 'JUST_PLANTED' | 'SMALL' | 'ALMOST_GROWN' | 'FULL_GROWN' | 'HARVESTED'

export type StoneAmount = 'MINI' | 'LITTLE' | 'LITTLE_MORE' | 'MIDDLE' | 'ALMOST_FULL' | 'FULL'

export type HouseResources = { [key in MaterialAllUpperCase]?: HouseResourceItem }


export type AnyBuilding = SmallBuilding | MediumBuilding | LargeBuilding

export type SmallBuilding = "ForesterHut" |
    "Woodcutter" |
    "Well" |
    "Quarry" |
    "Barracks" |
    "GuardHouse" |
    "HunterHut" |
    "Fishery" |
    "GoldMine" |
    "IronMine" |
    "CoalMine" |
    "GraniteMine" |
    "LookoutTower"

const SMALL_HOUSES: SmallBuilding[] = [
    "ForesterHut",
    "Woodcutter",
    "Well",
    "Quarry",
    "Barracks",
    "GuardHouse",
    "HunterHut",
    "Fishery",
    "GoldMine",
    "IronMine",
    "CoalMine",
    "GraniteMine",
    "LookoutTower"
]

const SMALL_HOUSES_AS_STRINGS: string[] = [
    "ForesterHut",
    "Woodcutter",
    "Well",
    "Quarry",
    "Barracks",
    "GuardHouse",
    "HunterHut",
    "Fishery",
    "GoldMine",
    "IronMine",
    "CoalMine",
    "GraniteMine",
    "LookoutTower"
]

export type MediumBuilding = "Sawmill" |
    "Bakery" |
    "WatchTower" |
    "Mill" |
    "SlaughterHouse" |
    "Catapult" |
    "Mint" |
    "Brewery" |
    "Armory" |
    "IronSmelter" |
    "Metalworks" |
    "Shipyard" |
    "Storehouse"

const MEDIUM_HOUSES: MediumBuilding[] = [
    "Sawmill",
    "Bakery",
    "WatchTower",
    "Mill",
    "SlaughterHouse",
    "Catapult",
    "Mint",
    "Brewery",
    "Armory",
    "IronSmelter",
    "Metalworks",
    "Shipyard",
    "Storehouse"
]

const MEDIUM_HOUSES_AS_STRINGS: string[] = [
    "Sawmill",
    "Bakery",
    "WatchTower",
    "Mill",
    "SlaughterHouse",
    "Catapult",
    "Mint",
    "Brewery",
    "Armory",
    "IronSmelter",
    "Metalworks",
    "Shipyard",
    "Storehouse"
]
export type LargeBuilding = "Headquarter" | "Farm" | "PigFarm" | "DonkeyFarm" | "Fortress" | "Harbor"

const LARGE_HOUSES: LargeBuilding[] = [
    "Headquarter",
    "Farm",
    "PigFarm",
    "DonkeyFarm",
    "Fortress"
]

const LARGE_HOUSES_AS_STRINGS: string[] = [
    "Headquarter",
    "Farm",
    "PigFarm",
    "DonkeyFarm",
    "Fortress"
]

export type WildAnimalType = "RABBIT" | "FOX" | "STAG" | "DEER" | "DUCK" | "SHEEP" | "DEER_2" | "DUCK_2" | "PACK_DONKEY"
const WILD_ANIMAL_TYPES = ["RABBIT", "FOX", "STAG", "DEER", "DUCK", "SHEEP", "DEER_2", "DUCK_2", "PACK_DONKEY"]


export interface WildAnimalInformation extends Point {
    id: WildAnimalId
    type: WildAnimalType
    betweenPoints: boolean
    previous?: Point
    next?: Point
    percentageTraveled: number
    path?: Point[]
}

export interface Player {
    name: string
    color: string
    nation: Nation
}

export interface Point {
    x: number
    y: number
}

export interface PointInformation {
    readonly canBuild: AvailableConstruction[]
    readonly is?: "building" | "flag" | "road"
    readonly x: number
    readonly y: number
    readonly possibleRoadConnections: Point[]
    readonly buildingId?: HouseId
    readonly flagId?: FlagId
    readonly roadId?: RoadId
}

export type TreeType = "PINE" | "BIRCH" | "OAK" | "PALM_1" | "PALM_2" | "PINE_APPLE" | "CYPRESS" | "CHERRY" | "FIR"

export type TreeSize = 'NEWLY_PLANTED' | 'SMALL' | 'MEDIUM' | 'FULL_GROWN'

export interface TreeInformation extends Point {
    id: TreeId
    type: TreeType
    size: TreeSize
}

export type FireSize = "LARGE" | "MEDIUM" | "SMALL" | "MINI"

export type Vegetation = "SA" | "MO1" | "SN" | "SW" | "D1" | "W1" | "B" | "D2" | "ME1" | "ME2" | "ME3" | "MO2" | "MO3" | "MO4" | "ST" | "FM" | "L1" | "MA" | "MM" | "W2" | "L2" | "L3" | "L4" | "BM"

export type HeightInformation = number

export type VegetationIntegers = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23

const VEGETATION_INTEGERS: VegetationIntegers[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

export interface TerrainAtPoint {
    point: Point
    below: VegetationIntegers
    downRight: VegetationIntegers
    height: number
}

export interface TerrainInformation {
    width: number
    height: number
    straightBelow: Vegetation[]
    belowToTheRight: Vegetation[]
    heights: HeightInformation[]
}

export interface RoadInformation {
    readonly id: RoadId
    readonly points: Point[]
    readonly type: 'NORMAL' | 'MAIN'
}

export type PlayerType = "HUMAN" | "COMPUTER"

export interface PlayerInformation {
    readonly name: string
    readonly id: PlayerId
    readonly type: PlayerType
    readonly color: string
    readonly centerPoint: Point
    readonly discoveredPoints: Set<Point>
    readonly nation: Nation
}

export interface GameInformation {
    players: PlayerInformation[]
    id: GameId
    status: "STARTED" | "NOT_STARTED"
    name: string
    map: MapInformation
    othersCanJoin: boolean
}

export interface MapInformation {
    title: string
    id: MapId
    maxPlayers: number
    author: string
    width: number
    height: number
    startingPoints: Point[]
}

export interface CropInformation extends Point {
    id: CropId
    state: CropGrowth
}

export interface CropInformationLocal extends CropInformation {
    growth: number
}

export interface TreeInformationLocal extends TreeInformation {
    growth: number
}

export type SignTypes = 'iron' | 'gold' | 'coal' | 'stone' | 'water' | 'nothing'

export type Size = 'SMALL' | 'MEDIUM' | 'LARGE'

export type FlagType = 'MAIN' | 'MARINE' | 'NORMAL'

export interface SignInformation extends Point {
    id: SignId
    type?: SignTypes
    amount?: Size
}

export interface StoneInformation extends Point { }

export type WorkerType = "Armorer" |
    "Baker" | "Brewer" |
    "Butcher" |
    "Courier" |
    "DonkeyBreeder" |
    "Donkey" |
    "Farmer" |
    "Fisherman" |
    "Forester" |
    "Geologist" |
    "Hunter" |
    "IronFounder" |
    "IronSmelter" |
    "Metalworker" |
    "Miller" |
    "Miner" |
    "Minter" |
    "PigBreeder" |
    "SawmillWorker" |
    "Scout" |
    "Stonemason" |
    "StorageWorker" |
    "WellWorker" |
    "WoodcutterWorker" |
    "Private" |
    'Private_first_class' |
    'Sergeant' |
    'Officer' |
    'General' |
    'Builder' |
    'Planer' |
    'ShipWright'

export type BodyType = 'FAT' | 'THIN'

export type WorkerAction = 'PLANTING_TREE' |
    'CUTTING' |
    'HACKING_STONE' |
    'FISHING' |
    'INVESTIGATING' |
    'PLANTING_WHEAT' |
    'HARVESTING' |
    'LOWERING_FISHING_ROD' |
    'PULL_UP_FISHING_ROD' |
    'CHEW_GUM' |
    'READ_NEWSPAPER' |
    'TOUCH_NOSE' |
    'JUMP_SKIP_ROPE'

export type DecorationType = 'BROWN_MUSHROOM' |
    'MINI_BROWN_MUSHROOM' |
    'TOADSTOOL' |
    'MINI_STONE' |
    'SMALL_STONE' |
    'STONE' |
    'DEAD_TREE_LYING_DOWN' |
    'DEAD_TREE' |
    'SMALL_SKELETON' |
    'FLOWERS' |
    'LARGE_BUSH' |
    'PILE_OF_STONES' |
    'CACTUS_1' |
    'CACTUS_2' |
    'CATTAIL' |
    'GRASS_1' |
    'BUSH' |
    'SMALL_BUSH' |
    'MINI_BUSH' |
    'GRASS_2' |
    'MINI_GRASS' |
    'PORTAL' |
    'SHINING_PORTAL' |
    'MINI_STONE_WITH_GRASS' |
    'SMALL_STONE_WITH_GRASS' |
    'SOME_SMALL_STONES' |
    'SOME_SMALLER_STONES' |
    'FEW_SMALL_STONES' |
    'SPARSE_BUSH' |
    'SOME_WATER' |
    'LITTLE_GRASS' |
    'SNOWMAN'

export type SimpleDirection = 'UP_LEFT' | 'UP_RIGHT' | 'RIGHT' | 'DOWN_RIGHT' | 'DOWN_LEFT' | 'LEFT'

export interface WorkerInformation extends Point {
    id: WorkerId
    type: WorkerType
    betweenPoints: boolean
    direction: Direction
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    cargo?: MaterialAllUpperCase
    bodyType?: BodyType
    action?: WorkerAction
    actionAnimationIndex?: number
}

export interface ServerWorkerInformation extends Point {
    id: WorkerId
    type: WorkerType
    betweenPoints: boolean
    direction: SimpleDirection
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    cargo?: MaterialAllUpperCase
    bodyType?: BodyType
    action?: WorkerAction
    actionAnimationIndex?: number
}

export interface ShipInformation extends Point {
    id: ShipId
    betweenPoints: boolean
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    constructionState: ShipConstructionProgress
}

export type SoldierType = "PRIVATE_RANK" | "PRIVATE_FIRST_CLASS_RANK" | "SERGEANT_RANK" | "OFFICER_RANK" | "GENERAL_RANK"
const SOLDIER_TYPES: SoldierType[] = ["PRIVATE_RANK", "PRIVATE_FIRST_CLASS_RANK", "SERGEANT_RANK", "OFFICER_RANK", "GENERAL_RANK"]

interface HouseResourceItem {
    has: number
    canHold?: number
}

type HouseState = "UNFINISHED" | "UNOCCUPIED" | "OCCUPIED" | "BURNING" | "DESTROYED" | "PLANNED"

export interface HouseInformation extends Point {
    id: HouseId
    playerId: PlayerId
    type: AnyBuilding
    evacuated: boolean
    soldiers?: SoldierType[]
    maxSoldiers?: number
    constructionProgress?: number
    resources: { [key in MaterialAllUpperCase]: HouseResourceItem }
    produces?: MaterialAllUpperCase
    promotionsEnabled: boolean
    productionEnabled: boolean
    state: HouseState
    availableAttackers?: number
    productivity?: number
    upgrading?: boolean
}

export interface HeadquarterInformation extends HouseInformation {
    reserved: { [key in SoldierType]: number }
}

export interface FlagInformation extends Point {
    id: FlagId
    playerId: PlayerId
    type: FlagType
    stackedCargo?: MaterialAllUpperCase[]
}

export interface BorderInformation {
    playerId: PlayerId
    points: Point[]
}

export interface Decoration {
    x: number
    y: number
    decoration: DecorationType
}

export interface PlayerViewInformation {
    borders: BorderInformation[]
    houses: HouseInformation[]
    workers: ServerWorkerInformation[]
    roads: RoadInformation[]
    trees: TreeInformation[]
    flags: FlagInformation[]
    stones: StoneInformation[]
    signs: SignInformation[]
    crops: CropInformation[]
    wildAnimals: WildAnimalInformation[]
    discoveredPoints: Point[]
    availableConstruction: PointMapFast<AvailableConstruction[]>
    deadTrees: Point[]
    decorations: Decoration[]
    messages: GameMessage[]
}

export interface PossibleNewRoadInformation {
    possibleNewRoad: Point[]
    closesRoad: boolean
}

export interface Measurement {
    time: number
    values: number[]
}

export interface PlayerInformationLight {
    name: string
    color: string
}

export interface ProductionStatistics {
    players: PlayerInformationLight[]
    materialStatistics: { [key in MaterialAllUpperCase]: Measurement[] }
}

export interface LandDataPoint {
    time: number
    values: number[]
}

export interface LandStatistics {
    players: PlayerInformationLight[]
    currentTime: number
    landStatistics: LandDataPoint[]
}

export type TransportPriorityInformation = MaterialAllUpperCase[]


type GameMessageType = "MILITARY_BUILDING_READY" | "NO_MORE_RESOURCES" | 'MILITARY_BUILDING_OCCUPIED' | 'UNDER_ATTACK' | 'GEOLOGIST_FIND' | 'BUILDING_LOST' | 'BUILDING_CAPTURED' | 'STORE_HOUSE_IS_READY' | 'TREE_CONSERVATION_PROGRAM_ACTIVATED' | 'TREE_CONSERVATION_PROGRAM_DEACTIVATED' | 'MILITARY_BUILDING_CAUSED_LOST_LAND'

export interface GameMessage {
    type: GameMessageType
    id: GameMessageId
}

export interface TreeConservationProgramActivatedMessage extends GameMessage { }

export interface TreeConservationProgramDeactivatedMessage extends GameMessage { }

export interface MilitaryBuildingCausedLostLandMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface MilitaryBuildingReadyMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface NoMoreResourcesMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface MilitaryBuildingOccupiedMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface UnderAttackMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface BuildingLostMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface BuildingCapturedMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

export interface GeologistFindMessage extends GameMessage {
    point: Point
    material: "IRON" | "WATER" | "COAL" | "STONE" | "GOLD"
}

export interface StoreHouseIsReadyMessage extends GameMessage {
    houseId: HouseId
    houseType: AnyBuilding
}

function isHeadquarterInformation(houseInformation: HouseInformation): houseInformation is HeadquarterInformation {
    return 'reserved' in houseInformation
}

function rankToMaterial(rank: SoldierType): MaterialAllUpperCase {
    if (rank === 'PRIVATE_RANK') {
        return 'PRIVATE'
    } else if (rank === 'PRIVATE_FIRST_CLASS_RANK') {
        return 'PRIVATE_FIRST_CLASS'
    } else if (rank === 'SERGEANT_RANK') {
        return 'SERGEANT'
    } else if (rank === 'OFFICER_RANK') {
        return 'OFFICER'
    } else if (rank === 'GENERAL_RANK') {
        return 'GENERAL'
    }

    console.error("Can't translate rank to material! Rank was: " + rank)

    return 'STONE'
}

function isToolUpperCase(material: MaterialAllUpperCase): material is ToolAllUpperCase {
    return TOOLS_UPPER_CASE_STRING.has(material)
}


function isWildAnimal(animal: unknown): animal is WildAnimalInformation {
    return animal !== null &&
        typeof animal === 'object' &&
        'type' in animal &&
        typeof animal.type === 'string' &&
        WILD_ANIMAL_TYPES.findIndex(type => type === animal.type) !== -1
}

function isMaterialUpperCase(material: unknown): material is MaterialAllUpperCase {
    return material !== null &&
        material !== undefined &&
        typeof material === 'string' &&
        MATERIALS_UPPER_CASE_AS_STRING.has(material)
}

function getSoldierDisplayName(soldierType: SoldierType): string {

    if (soldierType === "PRIVATE_RANK") {
        return "Private"
    } else if (soldierType === "PRIVATE_FIRST_CLASS_RANK") {
        return "Private first class"
    } else if (soldierType === "SERGEANT_RANK") {
        return "Sergeant"
    } else if (soldierType === "OFFICER_RANK") {
        return "Officer"
    } else {
        return "General"
    }
}

function isMilitaryBuildingCausedLostLandMessage(message: GameMessage): message is MilitaryBuildingCausedLostLandMessage {
    return message.type === 'MILITARY_BUILDING_CAUSED_LOST_LAND'
}

function isTreeConservationProgramActivatedMessage(message: GameMessage): message is TreeConservationProgramActivatedMessage {
    return message.type === 'TREE_CONSERVATION_PROGRAM_ACTIVATED'
}

function isTreeConservationProgramDeactivatedMessage(message: GameMessage): message is TreeConservationProgramDeactivatedMessage {
    return message.type === 'TREE_CONSERVATION_PROGRAM_DEACTIVATED'
}

function isMilitaryBuildingReadyMessage(message: GameMessage): message is MilitaryBuildingReadyMessage {
    return message.type === "MILITARY_BUILDING_READY"
}

function isNoMoreResourcesMessage(message: GameMessage): message is NoMoreResourcesMessage {
    return message.type === "NO_MORE_RESOURCES"
}

function isMilitaryBuildingOccupiedMessage(message: GameMessage): message is MilitaryBuildingOccupiedMessage {
    return message.type === "MILITARY_BUILDING_OCCUPIED"
}

function isUnderAttackMessage(message: GameMessage): message is UnderAttackMessage {
    return message.type === "UNDER_ATTACK"
}

function isGeologistFindMessage(message: GameMessage): message is GeologistFindMessage {
    return message.type === "GEOLOGIST_FIND"
}

function isBuildingLostMessage(message: GameMessage): message is BuildingLostMessage {
    return message.type === "BUILDING_LOST"
}

function isBuildingCapturedMessage(message: GameMessage): message is BuildingCapturedMessage {
    return message.type === "BUILDING_CAPTURED"
}

function isStoreHouseIsReadyMessage(message: GameMessage): message is StoreHouseIsReadyMessage {
    return message.type === 'STORE_HOUSE_IS_READY'
}

function isBuilding(aString: string): aString is AnyBuilding {
    return SMALL_HOUSES_AS_STRINGS.includes(aString) || MEDIUM_HOUSES_AS_STRINGS.includes(aString) || LARGE_HOUSES_AS_STRINGS.includes(aString)
}

export {
    isHeadquarterInformation,
    rankToMaterial,
    isToolUpperCase,
    isWildAnimal,
    isMilitaryBuildingCausedLostLandMessage,
    isTreeConservationProgramActivatedMessage,
    isTreeConservationProgramDeactivatedMessage,
    isMilitaryBuildingReadyMessage,
    isNoMoreResourcesMessage,
    isMilitaryBuildingOccupiedMessage,
    isUnderAttackMessage,
    isGeologistFindMessage,
    isMaterialUpperCase,
    isBuildingLostMessage,
    isBuildingCapturedMessage,
    isStoreHouseIsReadyMessage,
    getSoldierDisplayName,
    isBuilding,
    WILD_ANIMAL_TYPES,
    SMALL_HOUSES,
    MEDIUM_HOUSES,
    LARGE_HOUSES,
    VEGETATION_INTEGERS,
    SOLDIER_TYPES
}