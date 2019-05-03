import { AnyBuilding, LargeBuilding, MediumBuilding, SmallBuilding } from './buildings';
import { PointMap } from './utils';

export type GameId = string
export type PlayerId = string
export type MapId = string
export type HouseId = string
export type FlagId = string

export type PointString = string;

export type AvailableConstruction = "flag" | "small" | "medium" | "large" | "mine";
export type ResourceLevel = "LOW" | "MEDIUM" | "HIGH"

interface Player {
    name: string
    color: string
}

interface GameToCreate {
    name?: string
    map?: MapId
    players?: Player[]
}

export interface Point {
    x: number
    y: number
}

export interface PointInformation {
    readonly canBuild: AvailableConstruction[]
    readonly is: "building" | "flag"
    readonly x: number
    readonly y: number
    readonly possibleRoadConnections: Point[]
    readonly buildingId?: HouseId
    readonly flagId?: FlagId
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
    readonly points: Point[]
}

export interface PlayerInformation {
    readonly name: string
    readonly id: PlayerId
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
    type: "iron"
}

export interface StoneInformation extends Point { }

export interface WorkerInformation extends Point {
    inside: boolean
    betweenPoints: boolean
    previous: Point
    next: Point
    percentageTraveled: number
}

export interface AnimalInformation extends Point {
    betweenPoints: boolean
    previous: Point
    next: Point
    percentageTraveled: number
}

export interface HouseInformation extends Point {
    id: HouseId
    playerId: PlayerId
    type: AnyBuilding
    inventory: Map<string, number>
    state: "UNFINISHED" | "UNOCCUPIED" | "OCCUPIED" | "BURNING" | "DESTROYED"
}

export interface FlagInformation extends Point {
    id: FlagId
    playerId: PlayerId
}

export interface BorderInformation {
    points: Point[]
    color: string
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
    availableConstruction: PointMap<AvailableConstruction>
}

export interface PossibleNewRoadInformation {
    possibleNewRoad: Point[]
    closesRoad: boolean
}

async function getGames(): Promise<GameInformation[]> {
    const response = await fetch("/settlers/api/games", { method: 'get' });

    return await response.json();
}

async function addPlayerToGame(gameId: GameId, name: string, color: string): Promise<PlayerInformation> {
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

async function getMaps(): Promise<MapInformation[]> {
    const response = await fetch("/settlers/api/maps",
        { method: 'get' });

    return await response.json();
}

async function createGame(game: GameToCreate): Promise<GameInformation> {
    let gameBody: GameToCreate = {}

    if (game.name) {
        gameBody.name = game.name;
    }

    if (game.map) {
        gameBody.map = game.map;
    }

    if (game.players) {
        gameBody.players = game.players;
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

    // tickLength: 273

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

async function removeHouse(houseId: HouseId, gameId: GameId): Promise<void> {

    console.info("Removing house " + houseId);

    const response = await fetch("/settlers/api/games/" + gameId + "/houses/" + houseId, { method: 'delete' });

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

async function createBuilding(houseType: AnyBuilding, point: Point, gameId: GameId, playerId: PlayerId): Promise<HouseInformation> {

    console.info("Creating house " + houseType + " at " + point);

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

    console.info("Creating flag at " + point);

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
    return await response.json();
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

    const response = await fetch("/settlers/api/games/" + gameId + "/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId,
        {
            method: 'put',
            body: JSON.stringify(
                { geologistNeeded: true }
            )
        });

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
    const response = await fetch("/settlers/api/games/" + gameId + "/points?x=" + point.x + "&y=" + point.y + "&playerId=" + playerId,
        {
            method: 'put',
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
];

const MEDIUM_HOUSES: MediumBuilding[] = [
    "Sawmill",
    "WatchTower",
    "Mill",
    "Bakery",
    "Mint",
    "SlaughterHouse",
    "Catapult",
    "Mint"
];

const LARGE_HOUSES: LargeBuilding[] = [
    "Headquarter",
    "Farm",
    "PigFarm",
    "DonkeyFarm",
    "Fortress"
];

type material = "gold" | "iron" | "coal" | "stone" | "water"
const materialToColor = new Map<material, string>();

materialToColor.set("gold", "yellow");
materialToColor.set("iron", "red");
materialToColor.set("coal", "black");
materialToColor.set("stone", "gray");
materialToColor.set("water", "blue");

export { findPossibleNewRoad, getHousesForPlayer, setResourceLevelForGame, getGameInformation, removeHouse, setSpeed, sendScout, callGeologist, getTerrain, getTerrainForMap, getHouseInformation, getPlayers, getInformationOnPoint, getViewForPlayer, createBuilding, createFlag, createRoad, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, removeFlag, materialToColor, attackBuilding, getGames, getMaps, createGame, deleteGame, startGame, setMapForGame, addPlayerToGame };

