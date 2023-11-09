import { GameMessage, HouseId, Point, GameId, LandStatistics, ProductionStatistics, GameInformation, Nation, PlayerInformation, PlayerId, MapInformation, MapId, ResourceLevel, HouseInformation, FlagId, RoadId, AnyBuilding, RoadInformation, FlagInformation, TransportPriorityInformation, PlayerViewInformation, PointInformation, TerrainInformation, PossibleNewRoadInformation, SignTypes, Player, TransportCategoriesUpperCase } from './types'
import { PointMapFast } from '../util_types'

function printTimestamp(message: string): void {
    const date = new Date()
    const timestamp = date.getTime()

    console.log(message + ": " + timestamp)
}

async function getLandStatistics(gameId: GameId): Promise<LandStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/land", { method: 'get' })

    return await response.json()
}

async function getGameStatistics(gameId: GameId): Promise<ProductionStatistics> {
    const response = await fetch("/settlers/api/games/" + gameId + "/statistics/production", { method: 'get' })

    const data = await response.json()

    return data
}

async function getGames(): Promise<GameInformation[]> {
    const response = await fetch("/settlers/api/games", { method: 'get' })

    return await response.json()
}

async function addHumanPlayerToGame(gameId: GameId, name: string, color: string, nation: Nation): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name,
                    color,
                    nation
                }
            )
        }
    )

    return await response.json()
}

async function addComputerPlayerToGame(gameId: GameId, name: string, color: string, nation: Nation): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name,
                    color,
                    type: 'COMPUTER',
                    nation
                }
            )
        }
    )

    return await response.json()
}

async function updatePlayer(gameId: GameId, playerId: PlayerId, name: string, nation: Nation, color: string): Promise<PlayerInformation> {
    const response = await fetch("/settlers/api/games/" + gameId + "/players/" + playerId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    name,
                    nation,
                    color
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

interface GameToCreate {
    name?: string
    mapId?: MapId
    players?: Player[]
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

async function setOthersCanJoinGame(gameId: GameId, canJoin: "CAN_JOIN" | "CANNOT_JOIN"): Promise<GameInformation> {
    const response = await fetch("/settlers/api/games/" + gameId,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ othersCanJoin: canJoin === "CAN_JOIN" })
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

interface FlagAndRoadInformation extends RoadInformation {
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

async function setTransportPriorityForMaterial(gameId: GameId, playerId: PlayerId, category: TransportCategoriesUpperCase, priority: number): Promise<void> {
    console.log("Setting new priority for: " + category + " to " + priority)

    await fetch("/settlers/api/games/" + gameId + "/players/" + playerId + "/transportPriority",
        {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    material: category,
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

const signToColor = new Map<SignTypes, string>()

signToColor.set("iron", "red")
signToColor.set("coal", "black")
signToColor.set("gold", "yellow")
signToColor.set("stone", "white")
signToColor.set("water", "blue")

export {
    signToColor,
    pauseProductionForHouse,
    resumeProductionForHouse,
    printTimestamp,
    setTransportPriorityForMaterial,
    getTransportPriorityForPlayer,
    canBeUpgraded,
    upgradeMilitaryBuilding,
    getHouseInformationWithAttackPossibility,
    houseIsOccupied,
    addHumanPlayerToGame,
    getMessagesForPlayer,
    enablePromotionsForHouse,
    disablePromotionsForHouse,
    evacuateHouseOnPoint,
    removeRoad,
    houseIsReady,
    isMilitaryBuilding,
    cancelEvacuationForHouse,
    isEvacuated,
    evacuateHouse,
    canBeEvacuated,
    getLandStatistics,
    getGameStatistics,
    removePlayerFromGame,
    updatePlayer,
    findPossibleNewRoad,
    getHousesForPlayer,
    setResourceLevelForGame,
    getGameInformation,
    removeHouse,
    setSpeed,
    sendScout,
    callGeologist,
    getTerrain,
    getTerrainForMap,
    getHouseInformation,
    getPlayers,
    getInformationOnPoint,
    getViewForPlayer,
    createBuilding,
    createFlag,
    createRoad,
    removeFlag,
    attackBuilding,
    getGames,
    getMaps,
    createGame,
    deleteGame,
    startGame,
    setMapForGame,
    addComputerPlayerToGame,
    createRoadWithFlag,
    setOthersCanJoinGame
}

