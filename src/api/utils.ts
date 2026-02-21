import { Direction, GameInformation, HouseInformation, PLAYER_COLORS, PlayerColor, PlayerId, PlayerInformation, Point, SimpleDirection } from './types'
import { api } from './ws-api'

function simpleDirectionToCompassDirection(simpleDirection: SimpleDirection): Direction {
    let compassDirection: Direction = 'NORTH_WEST'

    if (simpleDirection === 'UP_RIGHT') {
        compassDirection = 'NORTH_EAST'
    } else if (simpleDirection === 'RIGHT') {
        compassDirection = 'EAST'
    } else if (simpleDirection === 'DOWN_RIGHT') {
        compassDirection = 'SOUTH_EAST'
    } else if (simpleDirection === 'DOWN_LEFT') {
        compassDirection = 'SOUTH_WEST'
    } else if (simpleDirection === 'LEFT') {
        compassDirection = 'WEST'
    }

    return compassDirection
}

function isMilitaryBuilding(house: HouseInformation): boolean {
    return house.type === 'Headquarter' || house.type === 'Fortress' || house.type === 'WatchTower' || house.type === 'GuardHouse' || house.type === 'Barracks'
}

function canBeEvacuated(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && houseIsReady(house)
}

function canBeUpgraded(house: HouseInformation): boolean {
    return isMilitaryBuilding(house) && house.type !== 'Fortress' && house.type !== 'Headquarter'
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
        .find(house => house.type === 'Headquarter' && house.playerId === playerId)
}

async function removeHouseOrFlagOrRoadAtPoint(point: Point): Promise<void> {
    const pointInformation = api.getInformationOnPointLocal(point)

    console.log({ title: 'Remove house/flag/road via websocket', localPointInformation: pointInformation })

    if (pointInformation.is === 'BUILDING') {
        api.removeBuilding(pointInformation.buildingId)
    }

    if (pointInformation.is === 'FLAG') {
        api.removeFlag(pointInformation.flagId)
    }

    if (pointInformation.is === 'ROAD') {
        api.removeRoad(pointInformation.roadId)
    }
}

function createGameInformationFromApi(): GameInformation | undefined {
    if (
        !api.gameId ||
        !api.map ||
        api.othersCanJoin === undefined ||
        !api.initialResources
    ) {
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
    let nextPlayer = undefined

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

    const nextColor = colorsRemaining.values().next().value

    if (nextColor) {
        const newPlayer = await api.createPlayer(
            `Computer Player ${nextPlayer}`,
            nextColor,
            'ROMANS',
            'COMPUTER'
        )

        await api.addPlayerToGame(api.gameId ?? '', newPlayer.id)
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