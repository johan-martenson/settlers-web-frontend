import { Direction, GameInformation, HouseInformation, MILITARY_BUILDINGS, PLAYER_COLORS, PlayerColor, PlayerId, PlayerInformation, Point, SimpleDirection } from './types'
import { api } from './ws-api'

function simpleDirectionToCompassDirection(simpleDirection: SimpleDirection): Direction {
    switch (simpleDirection) {
        case 'UP_LEFT': return 'NORTH_WEST'
        case 'UP_RIGHT': return 'NORTH_EAST'
        case 'RIGHT': return 'EAST'
        case 'DOWN_RIGHT': return 'SOUTH_EAST'
        case 'DOWN_LEFT': return 'SOUTH_WEST'
        case 'LEFT': return 'WEST'
        default: throw new Error(`Unknown simple direction: ${simpleDirection}`)
    }
}

function isMilitaryBuilding(house: HouseInformation): boolean {
    return MILITARY_BUILDINGS.has(house.type)
}

function canBeEvacuated(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && houseIsReady(house) && house.type !== 'Headquarter'
}

function canBeUpgraded(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && house.type !== 'Fortress' && house.type !== 'Headquarter' && (house.state === 'OCCUPIED' || house.state === 'UNOCCUPIED')
}

function houseIsReady(house: HouseInformation): boolean {
    return (house.state === 'UNOCCUPIED' || house.state === 'OCCUPIED')
}

function houseIsOccupied(house: HouseInformation): boolean {
    return house.state === 'OCCUPIED'
}

function isEvacuated(house: HouseInformation): boolean {
    return house.evacuated
}

function getHeadquarterForPlayer(playerId: PlayerId): HouseInformation | undefined {
    return Array.from(api.houses.values())
        .find(house => house.type === 'Headquarter' && house.playerId === playerId) as HouseInformation | undefined
}

async function removeHouseOrFlagOrRoadAtPoint(point: Point): Promise<void> {
    const pointInformation = api.getInformationOnPointLocal(point)

    console.log({ title: 'Remove house/flag/road via websocket', localPointInformation: pointInformation })

    if (pointInformation.is === 'BUILDING') {
        api.removeBuilding(pointInformation.buildingId)
    } else if (pointInformation.is === 'FLAG') {
        api.removeFlag(pointInformation.flagId)
    } else if (pointInformation.is === 'ROAD') {
        api.removeRoad(pointInformation.roadId)
    }
}

function createGameInformationFromApi(): GameInformation | undefined {
    if (api.gameName === undefined ||
        api.gameId === undefined ||
        api.map === undefined ||
        api.gameState === undefined ||
        api.players === undefined ||
        api.othersCanJoin === undefined ||
        !api.initialResources
    ) {
        console.error('Cannot create game information from API, missing fields', {
            gameId: api.gameId,
            map: api.map,
            othersCanJoin: api.othersCanJoin,
            initialResources: api.initialResources
        })

        return undefined
    }

    return {
        id: api.gameId,
        name: api.gameName,
        players: Array.from(api.players.values()),
        status: api.gameState,
        map: api.map,
        othersCanJoin: api.othersCanJoin,
        initialResources: api.initialResources,
        gameSpeed: api.gameSpeed,
        cheatingEnabled: api.cheatingEnabled ?? false
    }
}

async function addComputerPlayer(players: PlayerInformation[], maxPlayers: number): Promise<void> {
    if (!api.gameId) {
        throw new Error('No active game')
    }

    let nextPlayer: number | undefined = undefined

    for (let i = 0; i < maxPlayers; i++) {
        if (players.find(player => player.name === 'Computer Player ' + i) === undefined) {
            nextPlayer = i

            break
        }
    }

    if (nextPlayer === undefined) {
        return
    }

    const colorsRemaining = new Set<PlayerColor>(PLAYER_COLORS)
    players.forEach(player => colorsRemaining.delete(player.color))

    const nextColor: PlayerColor | undefined = colorsRemaining.values().next().value

    if (nextColor) {
        const newPlayer = await api.createPlayer(
            `Computer Player ${nextPlayer}`,
            nextColor,
            'ROMANS',
            'COMPUTER'
        )

        await api.addPlayerToGame(api.gameId, newPlayer.id)
    } else {
        console.error('No color available for computer player')
    }
}

export {
    simpleDirectionToCompassDirection,
    houseIsOccupied,
    houseIsReady,
    canBeEvacuated,
    canBeUpgraded,
    isMilitaryBuilding,
    isEvacuated,
    getHeadquarterForPlayer,
    removeHouseOrFlagOrRoadAtPoint,
    createGameInformationFromApi,
    addComputerPlayer
}