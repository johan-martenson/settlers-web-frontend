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
export type ChatMessageId = string

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

const MILITARY_BUILDING_VALUES = ['Barracks', 'GuardHouse', 'WatchTower', 'Fortress', 'Headquarter'] as const
export const MILITARY_BUILDINGS = new Set<AnyBuilding>(MILITARY_BUILDING_VALUES)

const SPEED_VALUES = ['VERY_FAST', 'FAST', 'NORMAL', 'SLOW'] as const
export type GameSpeed = typeof SPEED_VALUES[number]
export const GAME_SPEEDS = [...SPEED_VALUES] as const

export type AttackType = 'WEAK' | 'STRONG'

export type ShipConstructionProgress = 'JUST_STARTED' | 'HALF_WAY' | 'ALMOST_DONE' | 'READY'

export type AvailableConstruction = Size | 'FLAG' | 'MINE'

export type ResourceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

const TRANSPORT_CATEGORY_VALUES = ['FOOD', 'WEAPONS', 'TOOLS', 'IRON', 'IRON_BAR', 'COAL', 'GOLD', 'PLANK', 'WOOD', 'STONE', 'COIN', 'WHEAT', 'WATER', 'PIG', 'FLOUR', 'BOAT'] as const

export type TransportCategory = typeof TRANSPORT_CATEGORY_VALUES[number]
export const TRANSPORT_CATEGORIES = new Set<TransportCategory>(TRANSPORT_CATEGORY_VALUES)

const SOLDIER_VALUES = ['PRIVATE', 'PRIVATE_FIRST_CLASS', 'SERGEANT', 'OFFICER', 'GENERAL'] as const

export type Soldier = typeof SOLDIER_VALUES[number]
export const SOLDIERS = [...SOLDIER_VALUES] as const

const TOOLS_VALUES = ['AXE', 'HAMMER', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'] as const

export type Tool = typeof TOOLS_VALUES[number]
export const TOOLS: Set<Tool> = new Set(TOOLS_VALUES)

const GOODS_VALUES = ['FLOUR', 'PIG', 'GOLD', 'IRON', 'COAL', 'STONE', 'WATER', 'WOOD', 'PLANK', 'BREAD', 'FISH', 'MEAT', 'SHIELD', 'SWORD', 'BEER', 'COIN', 'WHEAT', 'IRON_BAR', 'BOAT'] as const

export type Goods = typeof GOODS_VALUES[number]
export const GOODS = new Set<Goods>(GOODS_VALUES)

const WORKER_VALUES = ['ARMORER', 'BAKER', 'BREWER', 'BUTCHER', 'COURIER', 'DONKEY_BREEDER', 'DONKEY', 'FARMER', 'FISHERMAN', 'FORESTER', 'GEOLOGIST', 'HUNTER', 'IRON_FOUNDER', 'METALWORKER', 'MILLER', 'MINER', 'MINTER', 'PIG_BREEDER', 'CARPENTER', 'SCOUT', 'STONEMASON', 'STOREHOUSE_WORKER', 'WELL_WORKER', 'WOODCUTTER_WORKER', 'BUILDER', 'PLANER', 'SHIPWRIGHT', ...SOLDIER_VALUES] as const

export type Worker = typeof WORKER_VALUES[number]
export const WORKERS = new Set<Worker>(WORKER_VALUES)

const MATERIAL_VALUES = [...TOOLS_VALUES, ...GOODS_VALUES, ...WORKER_VALUES] as const

export type Material = typeof MATERIAL_VALUES[number]
export const MATERIALS = new Set<Material>(MATERIAL_VALUES)

const NATION_VALUES = ['ROMANS', 'AFRICANS', 'JAPANESE', 'VIKINGS'] as const

export type Nation = typeof NATION_VALUES[number]
export const NATIONS = new Set<Nation>(NATION_VALUES)

export type Direction = 'EAST' | 'SOUTH_EAST' | 'SOUTH_WEST' | 'WEST' | 'NORTH_WEST' | 'NORTH_EAST'

export type StoneType = 'STONE_1' | 'STONE_2'

export type CropType = 'TYPE_1' | 'TYPE_2'

export type CropGrowth = 'JUST_PLANTED' | 'SMALL' | 'ALMOST_GROWN' | 'FULL_GROWN' | 'HARVESTED'

export type StoneAmount = 'MINI' | 'LITTLE' | 'LITTLE_MORE' | 'MIDDLE' | 'ALMOST_FULL' | 'FULL'

export type SmokeType = 'SMOKE_TYPE_1' | 'SMOKE_TYPE_2' | 'SMOKE_TYPE_3' | 'SMOKE_TYPE_4'

export type HouseResources = Partial<Record<Material, HouseResourceItem>>

export type BuildingType = 'SMALL' | 'MEDIUM' | 'LARGE'

export type AnyBuilding = SmallBuilding | MediumBuilding | LargeBuilding

const SMALL_HOUSE_VALUES = [
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
] as const

export type SmallBuilding = typeof SMALL_HOUSE_VALUES[number]
const SMALL_HOUSES_SET = new Set<SmallBuilding>(SMALL_HOUSE_VALUES)

const MEDIUM_HOUSE_VALUES = [
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
] as const

export type MediumBuilding = typeof MEDIUM_HOUSE_VALUES[number]
const MEDIUM_HOUSES_SET = new Set<MediumBuilding>(MEDIUM_HOUSE_VALUES)

const LARGE_HOUSE_VALUES = [
    'Headquarter',
    'Farm',
    'PigFarm',
    'DonkeyFarm',
    'Fortress',
    'Harbor'
] as const

export type LargeBuilding = typeof LARGE_HOUSE_VALUES[number]
const LARGE_HOUSES_SET = new Set<LargeBuilding>(LARGE_HOUSE_VALUES)

export const HOUSES = new Set<AnyBuilding>([
    ...SMALL_HOUSE_VALUES,
    ...MEDIUM_HOUSE_VALUES,
    ...LARGE_HOUSE_VALUES
])

const WILD_ANIMAL_TYPE_VALUES = ['RABBIT', 'FOX', 'STAG', 'DEER', 'DUCK', 'SHEEP', 'DEER_2', 'DUCK_2', 'PACK_DONKEY'] as const

export type WildAnimalType = typeof WILD_ANIMAL_TYPE_VALUES[number]
const WILD_ANIMAL_TYPES = [...WILD_ANIMAL_TYPE_VALUES] as const
const WILD_ANIMAL_TYPES_SET = new Set<WildAnimalType>(WILD_ANIMAL_TYPES)

export type WildAnimalInformation = Point & {
    id: WildAnimalId
    type: WildAnimalType
    betweenPoints: boolean
    direction: Direction
    previous?: Point
    next?: Point
    percentageTraveled: number
    path?: Point[]
}

const PLAYER_COLOR_VALUES = ['BLUE', 'YELLOW', 'RED', 'PURPLE', 'GRAY', 'GREEN', 'BROWN', 'WHITE'] as const

export type PlayerColor = typeof PLAYER_COLOR_VALUES[number]
export const PLAYER_COLORS = [...PLAYER_COLOR_VALUES] as const
const PLAYER_COLORS_SET = new Set<PlayerColor>(PLAYER_COLORS)

export type Player = {
    name: string
    color: PlayerColor
    nation: Nation
}

export type Point = {
    x: number
    y: number
}

export type PointInformationWithoutPossibleRoadConnections = {
    x: number
    y: number
    canBuild: AvailableConstruction[]
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

export type PointInformation = PointInformationWithoutPossibleRoadConnections & {
    possibleRoadConnections: Point[]
}

const TREE_TYPE_VALUES = ['PINE', 'BIRCH', 'OAK', 'PALM_1', 'PALM_2', 'PINE_APPLE', 'CYPRESS', 'CHERRY', 'FIR'] as const

export type TreeType = typeof TREE_TYPE_VALUES[number]
const TREE_TYPES = [...TREE_TYPE_VALUES] as const

export type TreeSize = 'NEWLY_PLANTED' | 'SMALL' | 'MEDIUM' | 'FULL_GROWN'

export type TreeInformation = Point & {
    id: TreeId
    type: TreeType
    size: TreeSize
}

export type FireSize = 'LARGE' | 'MEDIUM' | 'SMALL' | 'MINI'

export type HeightInformation = number

const VEGETATION_INTEGERS_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] as const

export type VegetationIntegers = typeof VEGETATION_INTEGERS_VALUES[number]
const VEGETATION_INTEGERS = [...VEGETATION_INTEGERS_VALUES] as const

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
    tilesBelow: VegetationIntegers[]
    tilesDownRight: VegetationIntegers[]
    heights: HeightInformation[]
}

export type RoadInformation = {
    readonly id: RoadId
    readonly playerId: PlayerId
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
    readonly discoveredPoints: Set<Point> // NOTE: uses Set which will not check equality based on values!
    readonly nation: Nation
    ownedLand: Point[]
    readonly strengthWhenPopulatingBuildings: number
    readonly defenseStrength: number
    readonly defenseFromSurroundingBuildings: number
    readonly militaryPopulationFarFromBorder: number
    readonly militaryPopulationAwayFromBorder: number
    readonly militaryPopulationCloseToBorder: number
    readonly soldiersAvailableForAttack: number
    coalQuota: {
        mint: number
        armory: number
        ironSmelter: number
    }
    wheatQuota: {
        mill: number
        donkeyFarm: number
        pigFarm: number
        brewery: number
    }
    waterQuota: {
        bakery: number
        donkeyFarm: number
        pigFarm: number
        brewery: number
    }
    ironQuota: {
        armory: number
        metalworks: number
    }
    foodQuota: {
        ironMine: number
        coalMine: number
        goldMine: number
        graniteMine: number
    }
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
    cheatingEnabled: boolean
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

export type MapWithTerrain = MapInformation & {
    terrain: TerrainInformation
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

export type SignType = 'IRON' | 'GOLD' | 'COAL' | 'STONE' | 'WATER' | 'NOTHING'

export type Size = 'SMALL' | 'MEDIUM' | 'LARGE'

export type FlagType = 'MAIN' | 'MARINE' | 'NORMAL'

export type SignInformation = Point & {
    id: SignId
    type?: SignType
    amount?: Size
}

export type StoneInformation = Point & {
    id: StoneId
    type: StoneType
    amount: StoneAmount
}

const WORKER_TYPE_VALUES = ['Armorer'
    , 'Baker'
    , 'Brewer'
    , 'Butcher'
    , 'Courier'
    , 'DonkeyBreeder'
    , 'Donkey'
    , 'Farmer'
    , 'Fisherman'
    , 'Forester'
    , 'Geologist'
    , 'Hunter'
    , 'IronFounder'
    , 'IronSmelter'
    , 'Metalworker'
    , 'Miller'
    , 'Miner'
    , 'Minter'
    , 'PigBreeder'
    , 'Carpenter'
    , 'Scout'
    , 'Stonemason'
    , 'StorehouseWorker'
    , 'WellWorker'
    , 'WoodcutterWorker'
    , 'Private'
    , 'PrivateFirstClass'
    , 'Sergeant'
    , 'Officer'
    , 'General'
    , 'Builder'
    , 'Planer'
    , 'Shipwright'] as const
export type WorkerType = typeof WORKER_TYPE_VALUES[number]
const WORKER_TYPES = [...WORKER_TYPE_VALUES] as const

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
    | 'OPEN_OVEN'
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
    | 'HAMMER_TO_MAKE_TOOL'
    | 'SAWING_TO_MAKE_TOOL'
    | 'WIPE_OFF_SWEAT_TO_MAKE_TOOL'
    | 'SLAUGHTERING'
    | 'DRAW_WATER_1'
    | 'FEED_THE_PIGS'

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
    direction: Direction
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
    direction?: Direction
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
    constructionState: ShipConstructionProgress
}

const SOLDIER_TYPE_VALUES = ['PRIVATE_RANK', 'PRIVATE_FIRST_CLASS_RANK', 'SERGEANT_RANK', 'OFFICER_RANK', 'GENERAL_RANK'] as const
export type SoldierType = typeof SOLDIER_TYPE_VALUES[number]
const SOLDIER_TYPES = [...SOLDIER_TYPE_VALUES] as const

export type CheatCode = 'GIVE_ME_SOME_MORE' | 'SHOW_ME_THE_WORLD' | 'TOO_FAST'

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
    resources: Partial<Record<Material, HouseResourceItem>>
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
    inReserve: Record<SoldierType, number>
    reserved: Record<SoldierType, number>
}

export type FlagInformation = Point & {
    id: FlagId
    playerId: PlayerId
    type: FlagType
    color: PlayerColor
    stackedCargo?: Material[]
    nation: Nation
}

export type ToolPriorities = Record<Tool, number>

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

export type ProductionStatistics = Partial<Record<Material, Measurement[]>>

export type LandStatistics = Measurement[]

export type InventoryStatistics = Partial<Record<Material, Measurement[]>>

export type BuildingStatistics = Partial<Record<AnyBuilding, Measurement[]>>

export const GENERAL_STATISTICS_TYPES = ['land', 'houses', 'workers', 'goods', 'military', 'coins', 'production', 'killedEnemies']
export type GeneralStatisticsType = typeof GENERAL_STATISTICS_TYPES[number]

export type GeneralStatistics = Record<GeneralStatisticsType, Measurement[]>

export const STATISTICS_VIEWS = ['GENERAL', 'MERCHANDISE', 'INVENTORY', 'BUILDINGS'] as const
export type StatisticsView = typeof STATISTICS_VIEWS[number]

const MERCHANDISE_VALUES = ['WOOD',
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
    'BOAT'] as const

export type Merchandise = typeof MERCHANDISE_VALUES[number]

export type MerchandiseStatistics = Partial<Record<Merchandise, Measurement[]>>

export type StatisticsPerPlayer = {
    id: PlayerId
    buildingStatistics: BuildingStatistics
    general: GeneralStatistics
}

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
function isSpeed(speed: unknown): speed is GameSpeed {
    return SPEED_VALUES.includes(speed as GameSpeed)
}


function isHeadquarterInformation(houseInformation: HouseInformation): houseInformation is HeadquarterInformation {
    return houseInformation.type === 'Headquarter'
}

function isNation(maybeNation: unknown): maybeNation is Nation {
    return NATIONS.has(maybeNation as Nation)
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

function isTool(material: Material): material is Tool {
    return TOOLS.has(material as Tool)
}

function isWildAnimal(animal: unknown): animal is WildAnimalInformation {
    return animal !== null &&
        typeof animal === 'object' &&
        'type' in animal &&
        WILD_ANIMAL_TYPES_SET.has(animal.type as WildAnimalType)
}

function isMaterial(material: unknown): material is Material {
    return MATERIALS.has(material as Material)
}

function isBuilding(aString: string): aString is AnyBuilding {
    return SMALL_HOUSES_SET.has(aString as SmallBuilding) || MEDIUM_HOUSES_SET.has(aString as MediumBuilding) || LARGE_HOUSES_SET.has(aString as LargeBuilding)
}

function isPlayerColor(playerColor: unknown): playerColor is PlayerColor {
    return PLAYER_COLORS_SET.has(playerColor as PlayerColor)
}

function isWorker(worker: unknown): worker is Worker {
    return worker !== null &&
        typeof worker === 'string' &&
        WORKERS.has(worker.toUpperCase() as Worker)
}

export {
    isHeadquarterInformation,
    rankToMaterial,
    isTool,
    isWildAnimal,
    isMaterial,
    isBuilding,
    isNation,
    isPlayerColor,
    isSpeed,
    isWorker,
    WILD_ANIMAL_TYPES,
    SMALL_HOUSE_VALUES,
    MEDIUM_HOUSE_VALUES,
    LARGE_HOUSE_VALUES,
    VEGETATION_INTEGERS,
    SOLDIER_TYPES,
    MERCHANDISE_VALUES,
    TREE_TYPES,
    WORKER_TYPES
}