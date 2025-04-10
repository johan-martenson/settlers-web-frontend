// Types

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
export type StoneId = string
export type RoomId = string
export type ChatMessageId = `chat-message-${string}`

type Time = {
    hours: number
    minutes: number
    seconds: number
}

export type VegetationAsInt = number

export type ChatMessage = {
    id: ChatMessageId
    fromPlayerId: PlayerId
    fromName: string
    toPlayers: PlayerId[]
    toRoomId: RoomId
    text: string
    time: Time
}

export type GameSpeed = 'FAST' | 'NORMAL' | 'SLOW'

export type AttackType = 'WEAK' | 'STRONG'

export type ShipConstructionProgress = 'JUST_STARTED' | 'HALF_WAY' | 'ALMOST_DONE' | 'READY'

export type AvailableConstruction = Size | 'FLAG' | 'MINE'

export type ResourceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type TransportCategory = 'FOOD' | 'WEAPONS' | 'TOOLS' | 'IRON' | 'IRON_BAR' | 'COAL' | 'GOLD' | 'PLANK' | 'WOOD' | 'STONE' | 'COIN' | 'WHEAT' | 'WATER' | 'PIG' | 'FLOUR' | 'BOAT'
export const TRANSPORT_CATEGORIES = new Set<TransportCategory>(['FOOD', 'WEAPONS', 'TOOLS', 'IRON', 'IRON_BAR', 'COAL', 'GOLD', 'PLANK', 'WOOD', 'STONE', 'COIN', 'WHEAT', 'WATER', 'PIG', 'FLOUR'])

export type Soldier = 'PRIVATE' | 'PRIVATE_FIRST_CLASS' | 'SERGEANT' | 'OFFICER' | 'GENERAL'
export type Worker = 'ARMORER' | 'BAKER' | 'BREWER' | 'BUTCHER' | 'COURIER' | 'DONKEY_BREEDER' | 'DONKEY' | 'FARMER' | 'FISHERMAN' | 'FORESTER' | 'GEOLOGIST' | 'HUNTER' | 'IRON_FOUNDER' | 'METALWORKER' | 'MILLER' | 'MINER' | 'MINTER' | 'PIG_BREEDER' | 'CARPENTER' | 'SCOUT' | 'STONEMASON' | 'STOREHOUSE_WORKER' | 'WELL_WORKER' | 'WOODCUTTER_WORKER' | 'BUILDER' | 'PLANER' | 'SHIPWRIGHT' | Soldier
export type Tool = 'AXE' | 'HAMMER' | 'SHOVEL' | 'PICK_AXE' | 'FISHING_ROD' | 'BOW' | 'SAW' | 'CLEAVER' | 'ROLLING_PIN' | 'CRUCIBLE' | 'TONGS' | 'SCYTHE'
export type Goods = 'FLOUR' | 'PIG' | 'GOLD' | 'IRON' | 'COAL' | 'STONE' | 'WATER' | 'WOOD' | 'PLANK' | 'BREAD' | 'FISH' | 'MEAT' | 'SHIELD' | 'SWORD' | 'BEER' | 'COIN' | 'WHEAT' | 'IRON_BAR' | 'BOAT' | Tool | Worker
export type Material = Soldier | Tool | Goods | Worker

export const SOLDIERS: Soldier[] = ['PRIVATE', 'PRIVATE_FIRST_CLASS', 'SERGEANT', 'OFFICER', 'GENERAL']
export const TOOLS: Set<Tool> = new Set(['AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'])
export const GOODS = new Set<Goods>(['FLOUR', 'PIG', 'GOLD', 'IRON', 'COAL', 'STONE', 'WATER', 'WOOD', 'PLANK', 'BREAD', 'FISH', 'MEAT', 'SHIELD', 'SWORD', 'BEER', 'COIN', 'WHEAT', 'IRON_BAR', 'BOAT'])
export const WORKERS = new Set<Worker>(['ARMORER', 'BAKER', 'BREWER', 'BUTCHER', 'COURIER', 'DONKEY_BREEDER', 'DONKEY', 'FARMER', 'FISHERMAN', 'FORESTER', 'GEOLOGIST', 'HUNTER', 'IRON_FOUNDER', 'METALWORKER', 'MILLER', 'MINER', 'MINTER', 'PIG_BREEDER', 'CARPENTER', 'SCOUT', 'STONEMASON', 'STOREHOUSE_WORKER', 'WELL_WORKER', 'WOODCUTTER_WORKER', 'PRIVATE', 'PRIVATE_FIRST_CLASS', 'SERGEANT', 'OFFICER', 'GENERAL', 'BUILDER', 'PLANER', 'SHIPWRIGHT'])
export const MATERIALS = new Set<Material>()
WORKERS.forEach(workerMaterial => MATERIALS.add(workerMaterial))
TOOLS.forEach(tool => MATERIALS.add(tool))
GOODS.forEach(good => MATERIALS.add(good))

//export type Material = 'FLOUR' | 'PIG' | 'GOLD' | 'IRON' | 'COAL' | 'STONE' | 'WATER' | 'WOOD' | 'PLANK' | 'BREAD' | 'FISH' | 'MEAT' | 'SHIELD' | 'SWORD' | 'BEER' | 'COIN' | 'METALWORKER' | 'WHEAT' | 'SHIPWRIGHT' | 'IRON_BAR' | 'BOAT' | Tool | MaterialWorker

//export const MATERIALS = new Set<Material>(['PIG', 'FLOUR', 'GOLD', 'IRON', 'COAL', 'STONE', 'WATER', 'WOOD', 'PLANK', 'BREAD', 'FISH', 'MEAT', 'SHIELD', 'SWORD', 'BEER', 'COIN', 'METALWORKER', 'WHEAT', 'SHIPWRIGHT', 'AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'HAMMER', 'SCYTHE', 'IRON_BAR'])

export const MATERIALS_AS_STRING = new Set<string>(MATERIALS.values())
export const TOOLS_STRING: Set<string> = new Set(TOOLS.values())

export type Nation = 'ROMANS' | 'AFRICANS' | 'JAPANESE' | 'VIKINGS'

export const NATIONS: Set<Nation> = new Set(['ROMANS', 'AFRICANS', 'JAPANESE', 'VIKINGS'])

export type Direction = 'EAST' | 'SOUTH_EAST' | 'SOUTH_WEST' | 'WEST' | 'NORTH_WEST' | 'NORTH_EAST'

export type StoneType = 'STONE_1' | 'STONE_2'

export type CropType = 'TYPE_1' | 'TYPE_2'

export type CropGrowth = 'JUST_PLANTED' | 'SMALL' | 'ALMOST_GROWN' | 'FULL_GROWN' | 'HARVESTED'

export type StoneAmount = 'MINI' | 'LITTLE' | 'LITTLE_MORE' | 'MIDDLE' | 'ALMOST_FULL' | 'FULL'

export type HouseResources = { [key in Material]?: HouseResourceItem }

export type AnyBuilding = SmallBuilding | MediumBuilding | LargeBuilding

export type SmallBuilding =
    | 'ForesterHut'
    | 'Woodcutter'
    | 'Well'
    | 'Quarry'
    | 'Barracks'
    | 'GuardHouse'
    | 'HunterHut'
    | 'Fishery'
    | 'GoldMine'
    | 'IronMine'
    | 'CoalMine'
    | 'GraniteMine'
    | 'LookoutTower'

const SMALL_HOUSES: SmallBuilding[] = [
    'ForesterHut',
    'Woodcutter',
    'Well',
    'Quarry',
    'Barracks',
    'GuardHouse',
    'HunterHut',
    'Fishery',
    'GoldMine',
    'IronMine',
    'CoalMine',
    'GraniteMine',
    'LookoutTower'
]

const SMALL_HOUSES_AS_STRINGS: string[] = [
    'ForesterHut',
    'Woodcutter',
    'Well',
    'Quarry',
    'Barracks',
    'GuardHouse',
    'HunterHut',
    'Fishery',
    'GoldMine',
    'IronMine',
    'CoalMine',
    'GraniteMine',
    'LookoutTower'
]

export type MediumBuilding =
    | 'Sawmill'
    | 'Bakery'
    | 'WatchTower'
    | 'Mill'
    | 'SlaughterHouse'
    | 'Catapult'
    | 'Mint'
    | 'Brewery'
    | 'Armory'
    | 'IronSmelter'
    | 'Metalworks'
    | 'Shipyard'
    | 'Storehouse'

const MEDIUM_HOUSES: MediumBuilding[] = [
    'Sawmill',
    'Bakery',
    'WatchTower',
    'Mill',
    'SlaughterHouse',
    'Catapult',
    'Mint',
    'Brewery',
    'Armory',
    'IronSmelter',
    'Metalworks',
    'Shipyard',
    'Storehouse'
]

const MEDIUM_HOUSES_AS_STRINGS: string[] = [
    'Sawmill',
    'Bakery',
    'WatchTower',
    'Mill',
    'SlaughterHouse',
    'Catapult',
    'Mint',
    'Brewery',
    'Armory',
    'IronSmelter',
    'Metalworks',
    'Shipyard',
    'Storehouse'
]
export type LargeBuilding = 'Headquarter' | 'Farm' | 'PigFarm' | 'DonkeyFarm' | 'Fortress' | 'Harbor'

const LARGE_HOUSES: LargeBuilding[] = [
    'Headquarter',
    'Farm',
    'PigFarm',
    'DonkeyFarm',
    'Fortress'
]

const LARGE_HOUSES_AS_STRINGS: string[] = [
    'Headquarter',
    'Farm',
    'PigFarm',
    'DonkeyFarm',
    'Fortress'
]

export type WildAnimalType = 'RABBIT' | 'FOX' | 'STAG' | 'DEER' | 'DUCK' | 'SHEEP' | 'DEER_2' | 'DUCK_2' | 'PACK_DONKEY'
const WILD_ANIMAL_TYPES = ['RABBIT', 'FOX', 'STAG', 'DEER', 'DUCK', 'SHEEP', 'DEER_2', 'DUCK_2', 'PACK_DONKEY']

export type WildAnimalInformation = Point & {
    id: WildAnimalId
    type: WildAnimalType
    betweenPoints: boolean
    previous?: Point
    next?: Point
    percentageTraveled: number
    path?: Point[]
}

export type PlayerColor = 'BLUE' | 'YELLOW' | 'RED' | 'PURPLE' | 'GRAY' | 'GREEN' | 'BROWN' | 'WHITE'
export const PLAYER_COLORS: PlayerColor[] = ['BLUE', 'YELLOW', 'RED', 'PURPLE', 'GRAY', 'GREEN', 'BROWN', 'WHITE']

export type Player = {
    name: string
    color: PlayerColor
    nation: Nation
}

export type Point = {
    x: number
    y: number
}

export type PointInformation = {
    canBuild: AvailableConstruction[]
    possibleRoadConnections: Point[]
    x: number
    y: number
} & ({
    is?: undefined
} | {
    is: 'BUILDING'
    buildingId: HouseId
} | {
    is: 'FLAG'
    flagId: FlagId
} | {
    is: 'ROAD'
    roadId: RoadId
})

export type TreeType = 'PINE' | 'BIRCH' | 'OAK' | 'PALM_1' | 'PALM_2' | 'PINE_APPLE' | 'CYPRESS' | 'CHERRY' | 'FIR'

export type TreeSize = 'NEWLY_PLANTED' | 'SMALL' | 'MEDIUM' | 'FULL_GROWN'

export type TreeInformation = Point & {
    id: TreeId
    type: TreeType
    size: TreeSize
}

export type FireSize = 'LARGE' | 'MEDIUM' | 'SMALL' | 'MINI'

export type HeightInformation = number

export type VegetationIntegers = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23

const VEGETATION_INTEGERS: VegetationIntegers[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

export const SAVANNAH = 0
export const MOUNTAIN_1 = 1
export const SNOW = 2
export const SWAMP = 3
export const DESERT_1 = 4
export const WATER_1 = 5
export const BUILDABLE_WATER = 6
export const DESERT_2 = 7
export const MEADOW_1 = 8
export const MEADOW_2 = 9
export const MEADOW_3 = 10
export const MOUNTAIN_2 = 11
export const MOUNTAIN_3 = 12
export const MOUNTAIN_4 = 13
export const STEPPE = 14
export const FLOWER_MEADOW = 15
export const LAVA_1 = 16
export const MAGENTA = 17
export const MOUNTAIN_MEADOW = 18
export const WATER_2 = 19
export const LAVA_2 = 20
export const LAVA_3 = 21
export const LAVA_4 = 22
export const BUILDABLE_MOUNTAIN = 23


export type TerrainAtPoint = {
    point: Point
    below: VegetationIntegers
    downRight: VegetationIntegers
    height: number
}

export type TerrainInformation = {
    width: number
    height: number
    straightBelow: VegetationAsInt[]
    belowToTheRight: VegetationAsInt[]
    heights: HeightInformation[]
}

export type RoadInformation = {
    readonly id: RoadId
    readonly points: Point[]
    readonly type: 'NORMAL' | 'MAIN'
}

export type PlayerType = 'HUMAN' | 'COMPUTER'

export type PlayerInformation = {
    readonly name: string
    readonly id: PlayerId
    readonly type: PlayerType
    readonly color: PlayerColor
    readonly centerPoint: Point
    readonly discoveredPoints: Set<Point>
    readonly nation: Nation
}

export type GameInformation = {
    id: GameId
    name: string
    players: PlayerInformation[]
    status: GameState
    map: MapInformation
    othersCanJoin: boolean
    initialResources: ResourceLevel
    gameSpeed?: GameSpeed
    tick?: number // milliseconds
}

export type MapInformation = {
    id: MapId
    name: string
    maxPlayers: number
    author: string
    width: number
    height: number
    startingPoints: Point[]
}

export type CropInformation = Point & {
    id: CropId
    state: CropGrowth
    type: CropType
}

export type CropInformationLocal = CropInformation & {
    growth: number
}

export type TreeInformationLocal = TreeInformation & {
    growth: number
}

export type FallingTreeInformation = Point & {
    id: TreeId
    type: TreeType
    animation: number
}

export type SignTypes = 'IRON' | 'GOLD' | 'COAL' | 'STONE' | 'WATER' | 'NOTHING'

export type Size = 'SMALL' | 'MEDIUM' | 'LARGE'

export type FlagType = 'MAIN' | 'MARINE' | 'NORMAL'

export type SignInformation = Point & {
    id: SignId
    type?: SignTypes
    amount?: Size
}

export type StoneInformation = Point & {
    id: StoneId
    type: StoneType
    amount: StoneAmount
}

export type WorkerType =
    | 'Armorer'
    | 'Baker'
    | 'Brewer'
    | 'Butcher'
    | 'Courier'
    | 'DonkeyBreeder'
    | 'Donkey'
    | 'Farmer'
    | 'Fisherman'
    | 'Forester'
    | 'Geologist'
    | 'Hunter'
    | 'IronFounder'
    | 'IronSmelter'
    | 'Metalworker'
    | 'Miller'
    | 'Miner'
    | 'Minter'
    | 'PigBreeder'
    | 'Carpenter'
    | 'Scout'
    | 'Stonemason'
    | 'StorehouseWorker'
    | 'WellWorker'
    | 'WoodcutterWorker'
    | 'Private'
    | 'Private_first_class'
    | 'Sergeant'
    | 'Officer'
    | 'General'
    | 'Builder'
    | 'Planer'
    | 'ShipWright'

export type BodyType = 'FAT' | 'THIN'

export type WorkerAction =
    | 'PLANTING_TREE'
    | 'CUTTING'
    | 'HACKING_STONE'
    | 'FISHING'
    | 'INVESTIGATING'
    | 'PLANTING_WHEAT'
    | 'HARVESTING'
    | 'LOWER_FISHING_ROD'
    | 'PULL_UP_FISHING_ROD'
    | 'CHEW_GUM'
    | 'READ_NEWSPAPER'
    | 'TOUCH_NOSE'
    | 'JUMP_SKIP_ROPE'
    | 'HAMMERING_HOUSE_HIGH_AND_LOW'
    | 'PLANTING_TREE'
    | 'BAKING'
    | 'DIGGING_AND_STOMPING'
    | 'DRINKING_BEER'
    | 'INSPECTING_HOUSE_CONSTRUCTION'
    | 'PICKING_UP_MEAT'
    | 'SAWING'
    | 'SHOOTING'
    | 'SIT_DOWN'
    | 'HIT'
    | 'JUMP_BACK'
    | 'STAND_ASIDE'
    | 'DIE'
    | 'GET_HIT'

export type Action = 'FALLING_TREE' | 'HOUSE_BURNING' | WorkerAction

export type DecorationType =
    | 'BROWN_MUSHROOM'
    | 'MINI_BROWN_MUSHROOM'
    | 'TOADSTOOL'
    | 'MINI_STONE'
    | 'SMALL_STONE'
    | 'STONE'
    | 'DEAD_TREE_LYING_DOWN'
    | 'DEAD_TREE'
    | 'ANIMAL_SKELETON_1'
    | 'ANIMAL_SKELETON_2'
    | 'FLOWERS'
    | 'LARGE_BUSH'
    | 'PILE_OF_STONES'
    | 'CACTUS_1'
    | 'CACTUS_2'
    | 'CATTAIL'
    | 'GRASS_1'
    | 'BUSH'
    | 'SMALL_BUSH'
    | 'MINI_BUSH'
    | 'GRASS_2'
    | 'MINI_GRASS'
    | 'HUMAN_SKELETON_1'
    | 'HUMAN_SKELETON_2'
    | 'PORTAL'
    | 'SHINING_PORTAL'
    | 'MINI_STONE_WITH_GRASS'
    | 'SMALL_STONE_WITH_GRASS'
    | 'SOME_SMALL_STONES'
    | 'SOME_SMALLER_STONES'
    | 'FEW_SMALL_STONES'
    | 'SPARSE_BUSH'
    | 'SOME_WATER'
    | 'LITTLE_GRASS'
    | 'SNOWMAN'

export type SimpleDirection = 'UP_LEFT' | 'UP_RIGHT' | 'RIGHT' | 'DOWN_RIGHT' | 'DOWN_LEFT' | 'LEFT'

export type WorkerInformation = Point & {
    id: WorkerId
    type: WorkerType
    color: PlayerColor
    nation: Nation
    betweenPoints: boolean
    direction: Direction
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    cargo?: Material
    bodyType?: BodyType
    action?: WorkerAction
    actionAnimationIndex?: number
}

export type ServerWorkerInformation = Point & {
    id: WorkerId
    type: WorkerType
    color: PlayerColor
    nation: Nation
    betweenPoints: boolean
    direction: SimpleDirection
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    cargo?: Material
    bodyType?: BodyType
    action?: WorkerAction
}

export type ShipInformation = Point & {
    id: ShipId
    betweenPoints: boolean
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    constructionState: ShipConstructionProgress
}

export type SoldierType = 'PRIVATE_RANK' | 'PRIVATE_FIRST_CLASS_RANK' | 'SERGEANT_RANK' | 'OFFICER_RANK' | 'GENERAL_RANK'
const SOLDIER_TYPES: SoldierType[] = ['PRIVATE_RANK', 'PRIVATE_FIRST_CLASS_RANK', 'SERGEANT_RANK', 'OFFICER_RANK', 'GENERAL_RANK']

type HouseResourceItem = {
    has: number
    canHold?: number
}

type HouseState = 'UNFINISHED' | 'UNOCCUPIED' | 'OCCUPIED' | 'BURNING' | 'DESTROYED' | 'PLANNED'

export type HouseInformation = Point & {
    id: HouseId
    playerId: PlayerId
    type: AnyBuilding
    door: 'OPEN' | 'CLOSED'
    evacuated: boolean
    soldiers?: SoldierType[]
    maxSoldiers?: number
    constructionProgress?: number
    resources: { [key in Material]: HouseResourceItem }
    produces?: Material[]
    promotionsEnabled: boolean
    productionEnabled: boolean
    state: HouseState
    availableAttackers?: number
    productivity?: number
    upgrading?: boolean
    nation: Nation
    isWorking?: boolean
}

export type HeadquarterInformation = HouseInformation & {
    inReserve: { [key in SoldierType]: number }
    reserved: { [key in SoldierType]: number }
}

export type FlagInformation = Point & {
    id: FlagId
    playerId: PlayerId
    type: FlagType
    color: PlayerColor
    stackedCargo?: Material[]
    nation: Nation
}

export type CargoInformation = {
    material: Material
    target: Point
    targetType: AnyBuilding
}

export type FlagDebugInfo = FlagInformation & {
    cargos: CargoInformation[]
}

export type BorderInformation = {
    playerId: PlayerId
    points: Point[]
}

export type Decoration = Point & {
    decoration: DecorationType
}

export type GameState = 'NOT_STARTED' | 'STARTED' | 'PAUSED' | 'EXPIRED'

export type PossibleNewRoadInformation = {
    possibleNewRoad: Point[]
    closesRoad: boolean
}

type MeasurementTime = number
type MeasurementValue = number
export type Measurement = [MeasurementTime, MeasurementValue]

export type ProductionStatistics = {
    [key in Material]?: Measurement[]
}

export type LandStatistics = Measurement[]

export type InventoryStatistics = {
    [key in Material]?: Measurement[]
}

export type BuildingStatistics = {
    [key in AnyBuilding]?: Measurement[]
}

export type GeneralStatisticsType = 'land' | 'houses' | 'workers' | 'goods' | 'military' | 'coins' | 'production' | 'killedEnemies'

export type GeneralStatistics = {
    [key in GeneralStatisticsType]: Measurement[]
}

export type Merchandise = 'WOOD'
    | 'PLANK'
    | 'STONE'
    | 'FOOD'
    | 'WATER'
    | 'BEER'
    | 'COAL'
    | 'IRON'
    | 'GOLD'
    | 'IRON_BAR'
    | 'COIN'
    | 'TOOLS'
    | 'WEAPONS'
    | 'BOAT'

const MERCHANDISE_VALUES: Merchandise[] = ['WOOD',
    'PLANK',
    'STONE',
    'FOOD',
    'WATER',
    'BEER',
    'COAL',
    'IRON',
    'GOLD',
    'IRON_BAR',
    'COIN',
    'TOOLS',
    'WEAPONS',
    'BOAT']

export type MerchandiseStatistics = {
    [key in Merchandise]?: Measurement[]
}

export type StatisticsPerPlayer = {
    id: PlayerId
    productionStatistics: ProductionStatistics
    inventoryStatistics: InventoryStatistics
    buildingStatistics: BuildingStatistics
    general: GeneralStatistics
}

export type TransportPriorityInformation = Material[]

export type GameEndedMessage = {
    type: 'GAME_ENDED'
    winnerPlayerId: PlayerId
}

export type ShipHasReachedDestinationMessage = {
    type: 'SHIP_HAS_REACHED_DESTINATION'
    shipId: ShipId
    point: Point
}

export type ShipReadyForExpeditionMessage = {
    type: 'SHIP_READY_FOR_EXPEDITION'
    shipId: ShipId
    point: Point
}

export type HarborIsFinishedMessage = {
    type: 'HARBOR_IS_FINISHED'
    houseId: HouseId
    point: Point
}

export type BombardedByCatapultMessage = {
    type: 'BOMBARDED_BY_CATAPULT'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type TreeConservationProgramActivatedMessage = {
    type: 'TREE_CONSERVATION_PROGRAM_ACTIVATED'
}

export type TreeConservationProgramDeactivatedMessage = {
    type: 'TREE_CONSERVATION_PROGRAM_DEACTIVATED'
}

export type MilitaryBuildingCausedLostLandMessage = {
    type: 'MILITARY_BUILDING_CAUSED_LOST_LAND'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type MilitaryBuildingReadyMessage = {
    type: 'MILITARY_BUILDING_READY'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type NoMoreResourcesMessage = {
    type: 'NO_MORE_RESOURCES'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}
export type MilitaryBuildingOccupiedMessage = {
    type: 'MILITARY_BUILDING_OCCUPIED'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type UnderAttackMessage = {
    type: 'UNDER_ATTACK'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type BuildingLostMessage = {
    type: 'BUILDING_LOST'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type BuildingCapturedMessage = {
    type: 'BUILDING_CAPTURED'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type GeologistFindMessage = {
    type: 'GEOLOGIST_FIND'
    point: Point
    material: 'IRON' | 'WATER' | 'COAL' | 'STONE' | 'GOLD'
}

export type StoreHouseIsReadyMessage = {
    type: 'STORE_HOUSE_IS_READY'
    houseId: HouseId
    houseType: AnyBuilding
    point: Point
}

export type GameMessage = {
    id: GameMessageId
    isRead: boolean
} & (
        | GameEndedMessage
        | ShipHasReachedDestinationMessage
        | ShipReadyForExpeditionMessage
        | HarborIsFinishedMessage
        | BombardedByCatapultMessage
        | TreeConservationProgramActivatedMessage
        | TreeConservationProgramDeactivatedMessage
        | MilitaryBuildingCausedLostLandMessage
        | MilitaryBuildingReadyMessage
        | NoMoreResourcesMessage
        | MilitaryBuildingOccupiedMessage
        | UnderAttackMessage
        | BuildingLostMessage
        | BuildingCapturedMessage
        | GeologistFindMessage
        | StoreHouseIsReadyMessage
    )

// Functions
function isHeadquarterInformation(houseInformation: HouseInformation): houseInformation is HeadquarterInformation {
    return 'reserved' in houseInformation
}

function isNation(maybeNation: unknown): maybeNation is Nation {
    return maybeNation === 'ROMANS' || maybeNation === 'VIKINGS' || maybeNation === 'JAPANESE' || maybeNation === 'AFRICANS'
}

function rankToMaterial(rank: SoldierType): Material {
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

    console.error(`Can't translate rank to material! Rank was: ${rank}`)

    throw new Error(`Can't translate rank to material! Rank was: ${rank}`)
}

function isToolUpperCase(material: Material): material is Tool {
    return TOOLS_STRING.has(material)
}

function isWildAnimal(animal: unknown): animal is WildAnimalInformation {
    return animal !== null &&
        typeof animal === 'object' &&
        'type' in animal &&
        WILD_ANIMAL_TYPES.findIndex(type => type === animal.type) !== -1
}

function isMaterial(material: unknown): material is Material {
    return material !== null &&
        material !== undefined &&
        typeof material === 'string' &&
        MATERIALS_AS_STRING.has(material)
}

function isBuilding(aString: string): aString is AnyBuilding {
    return SMALL_HOUSES_AS_STRINGS.includes(aString) || MEDIUM_HOUSES_AS_STRINGS.includes(aString) || LARGE_HOUSES_AS_STRINGS.includes(aString)
}

function isPlayerColor(playerColor: unknown): playerColor is PlayerColor {
    return typeof (playerColor) === 'string' && PLAYER_COLORS.find(e => e === playerColor) !== undefined
}

export {
    isHeadquarterInformation,
    rankToMaterial,
    isToolUpperCase,
    isWildAnimal,
    isMaterial,
    isBuilding,
    isNation,
    isPlayerColor,
    WILD_ANIMAL_TYPES,
    SMALL_HOUSES,
    MEDIUM_HOUSES,
    LARGE_HOUSES,
    VEGETATION_INTEGERS,
    SOLDIER_TYPES,
    MERCHANDISE_VALUES
}