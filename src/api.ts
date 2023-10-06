import { PointMapFast } from './util_types'

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

export type ShipConstructionProgress = 'JUST_STARTED' | 'HALF_WAY' | 'ALMOST_DONE' | 'READY'

export type AvailableConstruction = "flag" | "small" | "medium" | "large" | "mine"
export type ResourceLevel = "LOW" | "MEDIUM" | "HIGH"

export type TransportCategories = 'food' | 'weapons' | 'tools' | 'iron' | 'iron_bar' | 'coal' | 'gold' | 'plank' | 'wood' | 'stone' | 'coin' | 'wheat' | 'water' | 'pig' | 'flour'

export type MaterialAllUpperCase = "GOLD" | "IRON" | "COAL" | "STONE" | "WATER" | "WOOD" | "PLANK" | "BREAD" | "FISH" | "MEAT" | "SHIELD" | "SWORD" | "BEER" | "COIN" | "METALWORKER" | "WHEAT" | "SHIPWRIGHT" | ToolAllUpperCase

export const MATERIALS_UPPER_CASE = new Set<MaterialAllUpperCase>(["GOLD", "IRON", "COAL", "STONE", "WATER", "WOOD", "PLANK", "BREAD", "FISH", "MEAT", "SHIELD", "SWORD", "BEER", "COIN", "METALWORKER", "WHEAT", "SHIPWRIGHT", 'AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'])
export const MATERIALS_UPPER_CASE_AS_STRING = new Set<string>(["GOLD", "IRON", "COAL", "STONE", "WATER", "WOOD", "PLANK", "BREAD", "FISH", "MEAT", "SHIELD", "SWORD", "BEER", "COIN", "METALWORKER", "WHEAT", "SHIPWRIGHT", 'AXE', 'SHOVEL', 'PICK_AXE', 'FISHING_ROD', 'BOW', 'SAW', 'CLEAVER', 'ROLLING_PIN', 'CRUCIBLE', 'TONGS', 'SCYTHE'])

export type Material = "gold" | "iron" | "coal" | "stone" | "water" | "wood" | "plank" | "bread" | "fish" | "meat" | "shield" | "sword" | "beer" | "coin" | "metalworker" | "wheat" | "shipwright" | Tool

export type ToolAllUpperCase = 'AXE' | 'SHOVEL' | 'PICK_AXE' | 'FISHING_ROD' | 'BOW' | 'SAW' | 'CLEAVER' | 'ROLLING_PIN' | 'CRUCIBLE' | 'TONGS' | 'SCYTHE'
export type Tool = 'axe' | 'shovel' | 'pick_axe' | 'fishing_rod' | 'bow' | 'saw' | 'cleaver' | 'rolling_pin' | 'crucible' | 'tongs' | 'scythe'
export const TOOLS: Set<Tool> = new Set(['axe', 'shovel', 'pick_axe', 'fishing_rod', 'bow', 'saw', 'cleaver', 'rolling_pin', 'crucible', 'tongs', 'scythe'])

export type NationSmallCaps = 'romans' | 'africans' | 'japanese' | 'vikings'
export type Nation = 'ROMANS' | 'AFRICANS' | 'JAPANESE' | 'VIKINGS'

export type Direction = "EAST" | "SOUTH_EAST" | "SOUTH_WEST" | "WEST" | "NORTH_WEST" | "NORTH_EAST"

export type StoneType = 'TYPE_1' | 'TYPE_2'

export type CropType = 'TYPE_1' | 'TYPE_2'

export type CropGrowth = 'JUST_PLANTED' | 'SMALL' | 'ALMOST_GROWN' | 'FULL_GROWN' | 'HARVESTED'

export type StoneAmount = 'MINI' | 'LITTLE' | 'LITTLE_MORE' | 'MIDDLE' | 'ALMOST_FULL' | 'FULL'

function isTool(material: Material): material is Tool {
    return material === 'axe' ||
        material === 'shovel' ||
        material === 'pick_axe' ||
        material === 'fishing_rod' ||
        material === 'bow' ||
        material === 'saw' ||
        material === 'cleaver' ||
        material === 'rolling_pin' ||
        material === 'crucible' ||
        material === 'tongs' ||
        material === 'scythe'
}

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

export type LargeBuilding = "Headquarter" | "Farm" | "PigFarm" | "DonkeyFarm" | "Fortress" | "Harbor"

const LARGE_HOUSES: LargeBuilding[] = [
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

export function isWildAnimal(animal: unknown): animal is WildAnimalInformation {
    return animal !== null &&
        typeof animal === 'object' &&
        'type' in animal &&
        typeof animal.type === 'string' &&
        WILD_ANIMAL_TYPES.findIndex((type) => type === animal.type) !== -1
}

export function isMaterial(material: string): material is Material {
    return material === "gold" ||
        material === "iron" ||
        material === "coal" ||
        material === "stone" ||
        material === "water" ||
        material === "plank" ||
        material === "coin" ||
        material === "private" ||
        material === "woodcutter_worker" ||
        material === "donkey" ||
        material === "butcher" ||
        material === "miner" ||
        material === "forester" ||
        material === "armorer" ||
        material === "iron_bar" ||
        material === "geologist" ||
        material === "hunter" ||
        material === "brewer" ||
        material === "pig_breeder" ||
        material === "bread" ||
        material === "storage_worker" ||
        material === "baker" ||
        material === "stonemason" ||
        material === "sawmill_worker" ||
        material === "miller" ||
        material === "minter" ||
        material === "iron_founder" ||
        material === "fish" ||
        material === "well_worker" ||
        material === "donkey_breeder" ||
        material === "fisherman" ||
        material === "scout" ||
        material === "meat" ||
        material === "farmer" ||
        material === "courier" ||
        material === "wood" ||
        material === "metalworker" ||
        material === "wheat" ||
        material === "flour" ||
        material === "builder" ||
        material === "shipwright"
}

interface Player {
    name: string
    color: string
}

interface GameToCreate {
    name?: string
    mapId?: MapId
    players?: Player[]
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
}

export type PlayerType = "HUMAN" | "COMPUTER"

export interface PlayerInformation {
    readonly name: string
    readonly id: PlayerId
    readonly type: PlayerType
    readonly color: string
    readonly centerPoint: Point
    readonly discoveredPoints: Set<Point>
}

export interface GameInformation {
    players: PlayerInformation[]
    id: GameId
    status: "STARTED" | "NOT_STARTED"
    name: string
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

export interface HouseResources {
    wood?: HouseResourceItem
    plank?: HouseResourceItem
    stone?: HouseResourceItem
    iron?: HouseResourceItem
    gold?: HouseResourceItem
    coal?: HouseResourceItem
    coin?: HouseResourceItem
    shield?: HouseResourceItem
    sword?: HouseResourceItem
    beer?: HouseResourceItem
    water?: HouseResourceItem
    bread?: HouseResourceItem
    fish?: HouseResourceItem
    meat?: HouseResourceItem
    metalworker?: HouseResourceItem
    axe?: HouseResourceItem
    shovel?: HouseResourceItem
    pick_axe?: HouseResourceItem
    fishing_rod?: HouseResourceItem
    bow?: HouseResourceItem
    saw?: HouseResourceItem
    cleaver?: HouseResourceItem
    rolling_pin?: HouseResourceItem
    crucible?: HouseResourceItem
    tongs?: HouseResourceItem
    scythe?: HouseResourceItem
    wheat?: HouseResourceItem
    shipwright?: HouseResourceItem
}

interface HouseResourceItem {
    has: number
    totalNeeded?: number
}

type HouseState = "UNFINISHED" | "UNOCCUPIED" | "OCCUPIED" | "BURNING" | "DESTROYED" | "PLANNED"

export interface HouseInformation extends Point {
    id: HouseId
    playerId: PlayerId
    type: AnyBuilding
    inventory: Map<string, number>
    evacuated: boolean
    soldiers?: SoldierType[]
    maxSoldiers?: number
    constructionProgress?: number
    resources: HouseResources
    produces?: Material
    promotionsEnabled: boolean
    productionEnabled: boolean
    state: HouseState
    maxAttackers?: number
    productivity?: number
    upgrading?: boolean
}

export interface FlagInformation extends Point {
    id: FlagId
    playerId: PlayerId
    type: FlagType
    stackedCargo?: Material[]
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
}

export interface PossibleNewRoadInformation {
    possibleNewRoad: Point[]
    closesRoad: boolean
}

export interface Measurement {
    time: number
    values: number[]
}

export interface MaterialStatistics {
    material: Material
    materialStatistics: Measurement[]

}

export interface PlayerInformationLight {
    name: string
    color: string
}

export interface GameStatistics {
    players: PlayerInformationLight[]
    materialStatistics: MaterialStatistics[]
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

export type TransportPriorityInformation = Material[]

/*
* [
*     {'type': 'MILITARY_BUILDING_OCCUPIED',
*       'houseId': '123'
*     },
*
*     {'type': 'NO_MORE_RESOURCES',
*        'houseId': '123'
*     },
*
*     {'type': 'BORDER_EXPANDED',
*        'point': {x: 4, y: 8}
*     }
*
*     {'type': 'UNDER_ATTACK',
*        'houseId': '1234'
*     }
*
*     {'type': 'GEOLOGIST_FIND',
*        'point': {...}
*        'material': 'IRON' | 'WATER' | 'COAL' | 'STONE'
*     }
* ]
* */
export interface GameMessage {
    type: "MILITARY_BUILDING_READY" | "NO_MORE_RESOURCES" | 'MILITARY_BUILDING_OCCUPIED' | 'UNDER_ATTACK' | 'GEOLOGIST_FIND' | 'BUILDING_LOST' | 'BUILDING_CAPTURED' | 'STORE_HOUSE_IS_READY' | 'TREE_CONSERVATION_PROGRAM_ACTIVATED' | 'TREE_CONSERVATION_PROGRAM_DEACTIVATED' | 'MILITARY_BUILDING_CAUSED_LOST_LAND'
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

export interface TreeConservationProgramActivatedMessage extends GameMessage { }

export interface TreeConservationProgramDeactivatedMessage extends GameMessage { }

export interface MilitaryBuildingCausedLostLandMessage extends GameMessage {
    houseId: HouseId
}

export interface MilitaryBuildingReadyMessage extends GameMessage {
    houseId: HouseId
}

export interface NoMoreResourcesMessage extends GameMessage {
    houseId: HouseId
}

export interface MilitaryBuildingOccupiedMessage extends GameMessage {
    houseId: HouseId
}

export interface UnderAttackMessage extends GameMessage {
    houseId: HouseId
}

export interface BuildingLostMessage extends GameMessage {
    houseId: HouseId
}

export interface BuildingCapturedMessage extends GameMessage {
    houseId: HouseId
}

export interface GeologistFindMessage extends GameMessage {
    point: Point
    material: "IRON" | "WATER" | "COAL" | "STONE" | "GOLD"
}

export interface StoreHouseIsReadyMessage extends GameMessage {
    houseId: HouseId
}

function printTimestamp(message: string): void {
    const date = new Date()
    const timestamp = date.getTime()

    console.log(message + ": " + timestamp)
}

async function getLandStatistics(gameId: GameId): Promise<LandStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/land", { method: 'get' })

    return await response.json()
}

async function getGameStatistics(gameId: GameId): Promise<GameStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/production", { method: 'get' })

    const data = await response.json()

    return data
}

async function getGames(): Promise<GameInformation[]> {
    const response = await fetch("/settlers/api/games", { method: 'get' })

    return await response.json()
}

async function addHumanPlayerToGame(gameId: GameId, name: string, color: string): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name: name,
                    color: color
                }
            )
        }
    )

    return await response.json()
}

async function addComputerPlayerToGame(gameId: GameId, name: string, color: string): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name: name,
                    color: color,
                    type: 'COMPUTER_PLAYER'
                }
            )
        }
    )

    return await response.json()
}

async function updatePlayer(gameId: GameId, playerId: PlayerId, name: string, color: string): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name: name,
                    color: color
                }
            )
        }
    )

    return await response.json()
}

async function removePlayerFromGame(gameId: GameId, playerId: PlayerId): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )

    return await response.json()
}

async function getMaps(): Promise<MapInformation[]> {
    const response = await fetch("/settlers/api/maps",
        { method: 'get' })

    return await response.json()
}

async function createGame(name: string, mapId: MapId | undefined, players: Player[]): Promise<GameInformation> {
    const gameBody: GameToCreate = {}

    if (name) {
        gameBody.name = name
    }

    if (mapId) {
        gameBody.mapId = mapId
    }

    if (players) {
        gameBody.players = players
    }

    console.log("Creating game: " + JSON.stringify(gameBody))

    const response = await fetch("/settlers/api/games",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameBody)
        })

    return await response.json()
}

async function deleteGame(gameId: GameId): Promise<void> {
    console.log("Deleting game: " + gameId)

    const response = await fetch("/settlers/api/games/" + gameId,
        { method: 'DELETE' })

    return await response.json()
}

async function setMapForGame(mapId: MapId, gameId: GameId): Promise<void> {
    console.log("Setting map to " + mapId + " for game " + gameId)

    await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mapId: mapId
            })
        })

    return
}

async function setResourceLevelForGame(level: ResourceLevel, gameId: GameId): Promise<GameInformation> {
    console.log("Setting resource level for game")

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    resources: level
                }
            )
        }
    )

    return await response.json()
}

async function startGame(gameId: GameId): Promise<GameInformation> {
    console.log("Starting game: " + gameId)

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'STARTED'
            })
        })

    return await response.json()
}

async function attackBuilding(houseInformation: HouseInformation, numberOfAttackers: number, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {
    console.log("Attacking")

    console.log("Request: /settlers/api/games/" + gameId + "/players/" + houseInformation.playerId + "/houses/" + houseInformation.id)
    console.log("Options: " + JSON.stringify({
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            attacked:
            {
                attackingPlayerId: playerId,
                attackers: numberOfAttackers
            }
        }
        )
    }))

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + houseInformation.playerId + "/houses/" + houseInformation.id,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attacked:
                {
                    attackingPlayerId: playerId,
                    attackers: numberOfAttackers
                }
            }
            )
        })

    return await response.json()
}

async function getGameInformation(gameId: GameId): Promise<GameInformation> {
    const response = await fetch("/settlers/api/games/" + gameId)

    return await response.json()
}

async function setSpeed(tickLength: number, gameId: GameId): Promise<void> {

    console.info("Updating speed " + tickLength)

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'put',
            body: JSON.stringify({
                tickLength: tickLength
            })
        })

    return await response.json()
}

async function removeHouse(houseId: HouseId, playerId: PlayerId, gameId: GameId): Promise<void> {

    console.info("Removing house " + houseId)

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses/" + houseId, { method: 'delete' })

    return await response.json()
}

async function removeFlag(flagId: FlagId, gameId: GameId, playerId: PlayerId): Promise<void> {

    console.info("Removing flag " + flagId)

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/flags/" + flagId,
        {
            method: 'delete'
        }
    )

    return await response.json()
}

async function removeRoad(roadId: RoadId, gameId: GameId, playerId: PlayerId): Promise<void> {
    await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/roads/" + roadId,
        {
            method: 'delete'
        }
    )
}

async function createBuilding(houseType: AnyBuilding, point: Point, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {

    console.info("Creating house " + JSON.stringify(houseType) + " at " + JSON.stringify(point))
    printTimestamp("About to send create house call to server")

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: houseType, x: point.x, y: point.y, playerId: playerId })
        })

    const houseInformation = await response.json()

    printTimestamp("Call sent to server")

    return houseInformation
}

async function createRoad(points: Point[], gameId: GameId, playerId: PlayerId): Promise<RoadInformation> {

    console.info("Creating road " + JSON.stringify(points))

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/roads",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points: points, playerId: playerId })
        })

    return await response.json()
}

interface FlagAndRoadInformation extends RoadInformation{
    flag: FlagInformation
}

async function createRoadWithFlag(roadPoints: Point[], point: Point, gameId: GameId, playerId: PlayerId): Promise<FlagAndRoadInformation> {
    console.info({ title: "Creating flag and road", point, roadPoints })

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/roads",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flag: {
                    x: point.x,
                    y: point.y
                },
                points: roadPoints
            })
        })

    const json = await response.json()

    console.log(json)

    return json
}

async function createFlag(point: Point, gameId: GameId, playerId: PlayerId): Promise<FlagInformation> {

    // TODO: make sure this function throws an error if the call to create the flag failed!

    console.info("Creating flag at " + JSON.stringify({ x: point.x, y: point.y }))

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/flags",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ x: point.x, y: point.y })
        })
    return await response.json()
}

async function getTransportPriorityForPlayer(gameId: GameId, playerId: PlayerId): Promise<TransportPriorityInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/transportPriority")

    return await response.json()
}

async function setTransportPriorityForMaterial(gameId: GameId, playerId: PlayerId, material: Material, priority: number): Promise<void> {
    console.log("Setting new priority for: " + material + " to " + priority)

    await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/transportPriority",
        {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    material: material,
                    priority: priority
                }
            )
        }
    )
}

async function getViewForPlayer(gameId: GameId, playerId: PlayerId): Promise<PlayerViewInformation> {

    /*
      border: [{ color: '#333333', playerId: 2, points: [x: 2, y: 3, ...]}, ...]
      signs: [{type: 'gold', x: 3, y: 5, amount: 'small'}]
      animals: [{x: 4, y: 6}, ...]
      houses: [{x: 5, y: 3, type: foresterHut, playerId: 3, houseId: 19, state: "unfinished"}]
      availableConstruction: {"3,5": ["flag", "small"], "7, 9": ["flag", "mine"]}
     */

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/view")

    if (response.ok) {
        const view = await response.json()

        view.availableConstruction = new PointMapFast(view.availableConstruction)

        return view
    }

    throw new Error("Invalid request")
}

async function getPlayers(gameId: GameId): Promise<PlayerInformation[]> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players")

    const result = await response.json()

    return result
}

async function getHousesForPlayer(playerId: PlayerId, gameId: GameId): Promise<HouseInformation[]> {
    const response = await fetch('/settlers/api/games/' + gameId + '/players/' + playerId + '/houses')

    return await response.json()
}

async function getHouseInformation(houseId: HouseId, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {
    // x:
    // y:
    // inventory: {'gold': 3}
    // type: 'headquarter'
    // maxAttackers: 23

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses/" + houseId)
    const receivedHouse = await response.json()

    return receivedHouse
}

async function getHouseInformationWithAttackPossibility(houseId: HouseId, gameId: GameId, playerIdForOwner: PlayerId, playerIdForAsker: PlayerId): Promise<HouseInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerIdForOwner + "/houses/" + houseId + "?askingPlayerId=" + playerIdForAsker)

    const receivedHouse = await response.json()

    return receivedHouse
}

async function getInformationOnPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<PointInformation> {
    // x, y
    // canBuild: ['small', 'medium', 'large', 'flag', 'mine', 'harbor']
    // isType: ('flag' | 'building' | 'stone' | 'tree')
    // (building: {type: ..., } |
    // possibleRoadConnections: [{x: 2, y:4}, ...]
    // buildingId?
    // flagId?

    console.info("Get information on point")

    const response = await fetch("/settlers/api/games/" + gameId + "/map/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId)
    return await response.json()
}

async function callGeologist(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {

    const response = await fetch("/settlers/api/games/" + gameId + "/map/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId,
        {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                { geologistNeeded: true }
            )
        }
    )

    await response.json()

    return
}

async function getTerrainForMap(mapId: MapId): Promise<TerrainInformation> {
    const response = await fetch('/settlers/api/maps/' + mapId + "/terrain")
    return await response.json()
}

async function getTerrain(gameId: GameId): Promise<TerrainInformation> {
    const response = await fetch('/settlers/api/games/' + gameId + '/map/terrain')
    return await response.json()
}

async function sendScout(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {
    const response = await fetch("/settlers/api/games/" + gameId + "/map/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId,
        {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                { scoutNeeded: true }
            )
        })

    await response.json()

    return
}

async function findPossibleNewRoad(from: Point, to: Point, avoid: Point[], gameId: GameId, playerId: PlayerId): Promise<PossibleNewRoadInformation | undefined> {
    const response = await fetch('/settlers/api/rpc/games/' + gameId + '/players/' + playerId + '/find-new-road',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    from: from,
                    to: to,
                    avoid: avoid
                }
            )
        }
    )

    const body = await response.json()

    if (body.roadIsPossible) {
        const possibleNewRoad: PossibleNewRoadInformation = {
            possibleNewRoad: body.possibleRoad,
            closesRoad: body.closesRoad
        }

        return possibleNewRoad
    } else {
        return undefined
    }

}

function isEvacuated(house: HouseInformation): boolean {
    return house.evacuated
}

async function cancelEvacuationForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    await fetch('/settlers/api/games/' + gameId + '/players/' + playerId + '/houses/' + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    evacuate: false
                }
            )
        }
    )
}

async function evacuateHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    evacuate: true
                }
            )
        })
}

async function pauseProductionForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    production: "PAUSED"
                }
            )
        })

}

async function resumeProductionForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    production: "ACTIVE"
                }
            )
        })

}

async function enablePromotionsForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<HouseInformation> {
    const response = await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    promotionsEnabled: true
                }
            )
        })

    return await response.json()
}

async function disablePromotionsForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<HouseInformation> {
    const response = await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    promotionsEnabled: false
                }
            )
        })

    return await response.json()
}

async function upgradeMilitaryBuilding(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                {
                    upgrade: true
                }
            )
        }
    )
}

async function getMessagesForPlayer(gameId: GameId, playerId: PlayerId): Promise<GameMessage[]> {
    const response = await fetch('/settlers/api/games/' + gameId + '/players/' + playerId + '/gameMessages/')

    return await response.json()
}

async function evacuateHouseOnPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {
    const pointInformation = await getInformationOnPoint(point, gameId, playerId)

    if (!pointInformation.buildingId) {
        return
    }

    await evacuateHouse(gameId, playerId, pointInformation.buildingId)
}

function isMilitaryBuilding(house: HouseInformation): boolean {
    return house.type === "Headquarter" || house.type === "Fortress" || house.type === "WatchTower" || house.type === "GuardHouse" || house.type === "Barracks"
}

function canBeEvacuated(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && houseIsReady(house)
}

function canBeUpgraded(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && house.type !== "Fortress" && house.type !== "Headquarter"
}

function houseIsReady(house: HouseInformation): boolean {
    return (house.state === "UNOCCUPIED" || house.state === "OCCUPIED")
}

function houseIsOccupied(house: HouseInformation): boolean {
    return house.state === "OCCUPIED"
}

const materialToColor = new Map<Material, string>()

materialToColor.set("gold", "yellow")
materialToColor.set("iron", "red")
materialToColor.set("coal", "black")
materialToColor.set("stone", "white")
materialToColor.set("water", "blue")
materialToColor.set("wood", "DarkGoldenRod")
materialToColor.set("plank", "BurlyWood")
materialToColor.set("coin", "yellow")
materialToColor.set("meat", "red")
materialToColor.set("wheat", "orange")
materialToColor.set("water", "blue")

const signToColor = new Map<SignTypes, string>()

signToColor.set("iron", "red")
signToColor.set("coal", "black")
signToColor.set("gold", "yellow")
signToColor.set("stone", "white")
signToColor.set("water", "blue")

export {
    signToColor, pauseProductionForHouse, resumeProductionForHouse, isTool, printTimestamp, setTransportPriorityForMaterial, getTransportPriorityForPlayer, canBeUpgraded, upgradeMilitaryBuilding, getHouseInformationWithAttackPossibility, houseIsOccupied, isTreeConservationProgramActivatedMessage, isTreeConservationProgramDeactivatedMessage, isMilitaryBuildingCausedLostLandMessage,
    addHumanPlayerToGame, isStoreHouseIsReadyMessage, isBuildingCapturedMessage, isBuildingLostMessage, isMilitaryBuildingOccupiedMessage, isNoMoreResourcesMessage, isMilitaryBuildingReadyMessage, isUnderAttackMessage, isGeologistFindMessage, getMessagesForPlayer, enablePromotionsForHouse, disablePromotionsForHouse, evacuateHouseOnPoint, removeRoad, getSoldierDisplayName, houseIsReady, isMilitaryBuilding, cancelEvacuationForHouse, isEvacuated, evacuateHouse, canBeEvacuated, getLandStatistics, getGameStatistics, removePlayerFromGame, updatePlayer, findPossibleNewRoad, getHousesForPlayer, setResourceLevelForGame, getGameInformation, removeHouse, setSpeed, sendScout, callGeologist, getTerrain, getTerrainForMap, getHouseInformation, getPlayers, getInformationOnPoint, getViewForPlayer, createBuilding, createFlag, createRoad, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, removeFlag, materialToColor, attackBuilding, getGames, getMaps, createGame, deleteGame, startGame, setMapForGame, addComputerPlayerToGame,
    createRoadWithFlag,
    VEGETATION_INTEGERS
}

