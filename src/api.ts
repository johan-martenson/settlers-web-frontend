import { PointMap, PointSet } from './util_types';
import { startMonitoringGame, monitor } from './monitor';

export type GameId = string
export type PlayerId = string
export type MapId = string
export type HouseId = string
export type FlagId = string
export type RoadId = string
export type WorkerId = string
export type SignId = string

export type PointString = string;

export type AvailableConstruction = "flag" | "small" | "medium" | "large" | "mine";
export type ResourceLevel = "LOW" | "MEDIUM" | "HIGH"
export type Material = "gold" | "iron" | "coal" | "stone" | "water" | "wood" | "plank" | "bread" | "fish" | "meat" | "shield" | "sword" | "beer" | "coin"

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
];

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
];

export type LargeBuilding = "Headquarter" | "Farm" | "PigFarm" | "DonkeyFarm" | "Fortress" | "Harbor"

const LARGE_HOUSES: LargeBuilding[] = [
    "Headquarter",
    "Farm",
    "PigFarm",
    "DonkeyFarm",
    "Fortress"
];

export function isMaterial(material: string): material is Material {
    if (material === "gold" ||
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
        material === "wood") {
        return true
    }

    return false
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

export interface TreeInformation extends Point { }

export type TileInformation = "G" | "M" | "SW" | "W" | "DW" | "SN" | "L" | "MM" | "ST" | "DE" | "SA"

export type HeightInformation = number;

export interface TerrainInformation {
    width: number
    height: number
    straightBelow: TileInformation[]
    belowToTheRight: TileInformation[]
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

export interface CropInformation extends Point { }

export interface SignInformation extends Point {
    id: SignId
    type: "iron"
}

export interface StoneInformation extends Point { }

export interface WorkerInformation extends Point {
    id: WorkerId
    inside: boolean
    betweenPoints: boolean
    previous?: Point
    next?: Point
    percentageTraveled: number
    plannedPath?: Point[]
}

export interface AnimalInformation extends Point {
    betweenPoints: boolean
    previous: Point
    next: Point
    percentageTraveled: number
}

export type SoldierType = "PRIVATE_RANK"

function getSoldierDisplayName(soldierType: SoldierType): string {

    if (soldierType === "PRIVATE_RANK") {
        return "Private"
    }

    return "Unknown"
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
}

interface HouseResourceItem {
    has?: number
    needs?: number
}

type HouseState = "UNFINISHED" | "UNOCCUPIED" | "OCCUPIED" | "BURNING" | "DESTROYED"

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
    state: HouseState
}

export interface FlagInformation extends Point {
    id: FlagId
    playerId: PlayerId
}

export interface BorderInformation {
    playerId: PlayerId
    points: Point[]
}

export interface PlayerViewInformation {
    borders: BorderInformation[]
    houses: HouseInformation[]
    workers: WorkerInformation[]
    roads: RoadInformation[]
    trees: TreeInformation[]
    flags: FlagInformation[]
    stones: StoneInformation[]
    signs: SignInformation[]
    crops: CropInformation[]
    animals: AnimalInformation[]
    discoveredPoints: Point[]
    availableConstruction: PointMap<AvailableConstruction[]>
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

function isNoMoreResourcesMessage(message: GameMessage): message is NoMoureResourcesMessage {
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

export interface NoMoureResourcesMessage extends GameMessage {
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

async function getLandStatistics(gameId: GameId): Promise<LandStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/land", { method: 'get' });

    return await response.json();
}

async function getGameStatistics(gameId: GameId): Promise<GameStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/production", { method: 'get' });

    const data = await response.json();

    return data
}

async function getGames(): Promise<GameInformation[]> {
    const response = await fetch("/settlers/api/games", { method: 'get' });

    return await response.json();
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

    return await response.json();
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

    return await response.json();
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
        { method: 'get' });

    return await response.json();
}

async function createGame(name: string, mapId: MapId | undefined, players: Player[]): Promise<GameInformation> {
    let gameBody: GameToCreate = {}

    if (name) {
        gameBody.name = name;
    }

    if (mapId) {
        gameBody.mapId = mapId;
    }

    if (players) {
        gameBody.players = players;
    }

    console.log("Creating game: " + JSON.stringify(gameBody));

    const response = await fetch("/settlers/api/games",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameBody)
        });

    return await response.json();
}

async function deleteGame(gameId: GameId): Promise<void> {
    console.log("Deleting game: " + gameId);

    const response = await fetch("/settlers/api/games/" + gameId,
        { method: 'DELETE' });

    return await response.json();
}

async function setMapForGame(mapId: MapId, gameId: GameId): Promise<void> {
    console.log("Setting map to " + mapId + " for game " + gameId);

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mapId: mapId
            })
        });

    return;
}

async function setResourceLevelForGame(level: ResourceLevel, gameId: GameId): Promise<GameInformation> {
    console.log("Setting resource level for game");

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

    return await response.json();
}

async function startGame(gameId: GameId): Promise<GameInformation> {
    console.log("Starting game: " + gameId);

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'STARTED'
            })
        });

    return await response.json();
}

async function attackBuilding(houseId: HouseId, numberOfAttackers: number, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/houses/" + houseId,
        {
            method: 'put',
            body: JSON.stringify({
                attacked:
                {
                    by: playerId,
                    attackers: numberOfAttackers
                }
            }
            )
        });
    return await response.json();
}

async function getGameInformation(gameId: GameId): Promise<GameInformation> {
    const response = await fetch("/settlers/api/games/" + gameId);

    return await response.json();
}

async function setSpeed(tickLength: number, gameId: GameId): Promise<void> {

    console.info("Updating speed " + tickLength);

    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'put',
            body: JSON.stringify({
                tickLength: tickLength
            })
        });

    return await response.json();
}

async function removeHouse(houseId: HouseId, playerId: PlayerId, gameId: GameId): Promise<void> {

    console.info("Removing house " + houseId);

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses/" + houseId, { method: 'delete' });

    return await response.json();
}

async function removeFlag(flagId: FlagId, gameId: GameId, playerId: PlayerId): Promise<void> {

    console.info("Removing flag " + flagId);

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/flags/" + flagId,
        {
            method: 'delete'
        }
    );

    return await response.json();
}

async function removeRoad(roadId: RoadId, gameId: GameId, playerId: PlayerId): Promise<void> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/roads/" + roadId,
        {
            method: 'delete'
        }
    )
}

async function createBuilding(houseType: AnyBuilding, point: Point, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {

    console.info("Creating house " + JSON.stringify(houseType) + " at " + JSON.stringify(point));

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: houseType, x: point.x, y: point.y, playerId: playerId })
        });
    return await response.json();
}

async function createRoad(points: Point[], gameId: GameId, playerId: PlayerId): Promise<RoadInformation> {

    console.info("Creating road " + JSON.stringify(points));

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/roads",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points: points, playerId: playerId })
        });
    return await response.json();
}

async function createFlag(point: Point, gameId: GameId, playerId: PlayerId): Promise<FlagInformation> {

    console.info("Creating flag at " + JSON.stringify(point));

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/flags",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ x: point.x, y: point.y })
        });
    return await response.json();
}

async function getViewForPlayer(gameId: GameId, playerId: PlayerId): Promise<PlayerViewInformation> {

    /*
      border: [{ color: '#333333', playerId: 2, points: [x: 2, y: 3, ...]}, ...]
      signs: [{type: 'gold', x: 3, y: 5, amount: 'small'}]
      animals: [{x: 4, y: 6}, ...]
      houses: [{x: 5, y: 3, type: foresterhut, playerId: 3, houseId: 19, state: "unfinished"}]
      availableConstruction: {"3,5": ["flag", "small"], "7, 9": ["flag", "mine"]}
     */

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/view");

    if (response.ok) {
        const view = await response.json();

        view.availableConstruction = new PointMap(view.availableConstruction)

        return view
    }

    throw new Error("Invalid request");
}

async function getPlayers(gameId: GameId): Promise<PlayerInformation[]> {

    console.info("Get players");

    const response = await fetch("/settlers/api/games/" + gameId + "/players");

    const result = await response.json();

    return result;
}

async function getHousesForPlayer(playerId: PlayerId, gameId: GameId): Promise<HouseInformation[]> {
    const response = await fetch('/settlers/api/games/' + gameId + '/players/' + playerId + '/houses');

    return await response.json();
}

async function getHouseInformation(houseId: HouseId, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {
    // x:
    // y:
    // inventory: {'gold': 3}
    // type: 'headquarter'
    // maxAttackers: 23

    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/houses/" + houseId);
    const receivedHouse = await response.json();

    let house = receivedHouse

    return house

}

async function getInformationOnPoint(point: Point, gameId: GameId, playerId: PlayerId): Promise<PointInformation> {
    // x, y
    // canBuild: ['small', 'medium', 'large', 'flag', 'mine', 'harbor']
    // isType: ('flag' | 'building' | 'stone' | 'tree')
    // (building: {type: ..., } |
    // possibleRoadConnections: [{x: 2, y:4}, ...]
    // buildingId?
    // flagId?

    console.info("Get information on point");

    const response = await fetch("/settlers/api/games/" + gameId + "/map/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId);
    return await response.json();
}

async function callGeologist(point: Point, gameId: GameId, playerId: PlayerId) {

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
    );

    return await response.json();
}

async function getTerrainForMap(mapId: MapId): Promise<TerrainInformation> {
    const response = await fetch('/settlers/api/maps/' + mapId + "/terrain")
    return await response.json();
}

async function getTerrain(gameId: GameId): Promise<TerrainInformation> {
    const response = await fetch('/settlers/api/games/' + gameId + '/map/terrain');
    return await response.json();
}

async function sendScout(point: Point, gameId: GameId, playerId: PlayerId) {
    const response = await fetch("/settlers/api/games/" + gameId + "/map/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId,
        {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                { scoutNeeded: true }
            )
        });

    return await response.json();
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
    );

    const body = await response.json();

    if (body.roadIsPossible) {
        const possibleNewRoad: PossibleNewRoadInformation = {
            possibleNewRoad: body.possibleRoad,
            closesRoad: body.closesRoad
        };

        return possibleNewRoad;
    } else {
        return undefined;
    }

}

function isEvacuated(house: HouseInformation): boolean {
    return house.evacuated
}

async function cancelEvacuationForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<void> {
    const response = await fetch('/settlers/api/games/' + gameId + '/players/' + playerId + '/houses/' + houseId,
        {
            method: 'PUT',
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
    const response = await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PUT',
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

async function enablePromotionsForHouse(gameId: GameId, playerId: PlayerId, houseId: HouseId): Promise<HouseInformation> {
    const response = await fetch('/settlers/api/games/' + gameId + "/players/" + playerId + "/houses/" + houseId,
        {
            method: 'PUT',
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
            method: 'PUT',
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

function houseIsReady(house: HouseInformation): boolean {
    return (house.state === "UNOCCUPIED" || house.state === "OCCUPIED")
}



const materialToColor = new Map<Material, string>();

materialToColor.set("gold", "yellow");
materialToColor.set("iron", "red");
materialToColor.set("coal", "black");
materialToColor.set("stone", "gray");
materialToColor.set("water", "blue");

function getRoads() {
    return monitor.roads
}

function getHouses() {
    return monitor.houses
}

function getFlags() {
    return monitor.flags
}

function getWorkers() {
    return monitor.workers
}

function getTrees() {
    return monitor.trees
}

function getCrops() {
    return monitor.crops
}

function getSigns() {
    return monitor.signs
}

function getStones() {
    return monitor.stones
}

function getFlagAtPoint(point: Point) {
    for (const [id, flag] of monitor.flags) {
        if (flag.x === point.x && flag.y === point.y) {
            return flag
        }
    }

    return undefined
}

function getHouseAtPoint(point: Point) {
    for (const [id, house] of monitor.houses) {
        if (house.x === point.x && house.y === point.y) {
            return house
        }
    }

    return undefined
}

export { isTreeConservationProgramActivatedMessage, isTreeConservationProgramDeactivatedMessage, isMilitaryBuildingCausedLostLandMessage, getHouseAtPoint, getFlagAtPoint, getRoads, getHouses, getFlags, getWorkers, getTrees, getCrops, getSigns, getStones, addHumanPlayerToGame, isStoreHouseIsReadyMessage, isBuildingCapturedMessage, isBuildingLostMessage, isMilitaryBuildingOccupiedMessage, isNoMoreResourcesMessage, isMilitaryBuildingReadyMessage, isUnderAttackMessage, isGeologistFindMessage, getMessagesForPlayer, enablePromotionsForHouse, disablePromotionsForHouse, evacuateHouseOnPoint, removeRoad, getSoldierDisplayName, houseIsReady, isMilitaryBuilding, cancelEvacuationForHouse, isEvacuated, evacuateHouse, canBeEvacuated, getLandStatistics, getGameStatistics, removePlayerFromGame, updatePlayer, findPossibleNewRoad, getHousesForPlayer, setResourceLevelForGame, getGameInformation, removeHouse, setSpeed, sendScout, callGeologist, getTerrain, getTerrainForMap, getHouseInformation, getPlayers, getInformationOnPoint, getViewForPlayer, createBuilding, createFlag, createRoad, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, removeFlag, materialToColor, attackBuilding, getGames, getMaps, createGame, deleteGame, startGame, setMapForGame, addComputerPlayerToGame };

