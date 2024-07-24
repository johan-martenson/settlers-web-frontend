import { Direction, HouseInformation, SimpleDirection } from "./types"

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

export {
    simpleDirectionToCompassDirection,
    houseIsOccupied,
    houseIsReady,
    canBeEvacuated,
    canBeUpgraded,
    isMilitaryBuilding,
    isEvacuated
}