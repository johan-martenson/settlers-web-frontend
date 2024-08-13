import { Direction, HouseInformation, PlayerId, Point, SimpleDirection } from "./types"
import { api } from "./ws-api"

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

function isEvacuated(house: HouseInformation): boolean {
    return house.evacuated
}

function getHeadquarterForPlayer(playerId: PlayerId): HouseInformation | undefined {
    return Array.from(api.houses.values())
        .find(house => house.type === 'Headquarter' && house.playerId === playerId)
}

async function removeHouseOrFlagOrRoadAtPoint(point: Point): Promise<void> {
    const pointInformation = api.getInformationOnPointLocal(point)

    console.log({ title: "Remove house/flag/road via websocket", localPointInformation: pointInformation })

    if (pointInformation.is === "building") {
        api.removeBuilding(pointInformation.buildingId)
    }

    if (pointInformation.is === 'flag') {
        api.removeFlag(pointInformation.flagId)
    }

    if (pointInformation.is === 'road') {
        api.removeRoad(pointInformation.roadId)
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
    removeHouseOrFlagOrRoadAtPoint
}