import { SignInformation, SignId, Point, GameId, PlayerId, getViewForPlayer, WorkerId, WorkerInformation, HouseId, HouseInformation, FlagId, FlagInformation, RoadId, RoadInformation } from './api'
import { PointSet } from './util_types'

let periodicUpdates: NodeJS.Timeout | null = null

interface Monitor {
    workers: Map<WorkerId, WorkerInformation>
    houses: Map<HouseId, HouseInformation>
    flags: Map<FlagId, FlagInformation>
    roads: Map<RoadId, RoadInformation>
    border: Set<Point>
    trees: PointSet
    stones: PointSet
    crops: PointSet
    discoveredPoints: PointSet
    signs: Map<SignId, SignInformation>

}

const monitor: Monitor = {
    workers: new Map<WorkerId, WorkerInformation>(),
    houses: new Map<HouseId, HouseInformation>(),
    flags: new Map<FlagId, FlagInformation>(),
    roads: new Map<RoadId, RoadInformation>(),
    border: new Set<Point>(),
    trees: new PointSet(),
    stones: new PointSet(),
    crops: new PointSet(),
    discoveredPoints: new PointSet(),
    signs: new Map<SignId, SignInformation>()
}

interface WalkerTargetChange {
    id: string
    x: number
    y: number
    path: Point[]
}

interface ChangesMessage {
    workersWithNewTargets?: WalkerTargetChange[]
    removedWorkers?: WorkerId[]
    newBuildings?: HouseInformation[]
    changedBuildings?: HouseInformation[]
    removedBuildings?: HouseId[]
    newFlags?: FlagInformation[]
    removedFlags?: FlagId[]
    newRoads?: RoadInformation[]
    removedRoads?: RoadId[]
    newBorder?: Point[]
    removedBorder?: Point[]
    newTrees?: Point[]
    removedTrees?: Point[]
    newStones?: Point[]
    removedStones?: Point[]
    newCrops?: Point[]
    removedCrops?: Point[]
    newDiscoveredLand?: Point[]
    newSigns?: SignInformation[]
    removedSigns?: SignId[]
}

function isGameChangesMessage(message: any): message is ChangesMessage {
    if (message.time &&
        (message.workersWithNewTargets || message.removedWorkers ||
            message.newFlags || message.removedFlags ||
            message.newBuildings || message.changedBuildings || message.removedBuildings ||
            message.newRoads || message.removedRoads ||
            message.newBorder || message.removedBorder ||
            message.newTrees || message.removedTrees ||
            message.newCrops || message.removedCrops ||
            message.newStones || message.removedStones ||
            message.newSigns || message.removedSigns ||
            message.newDiscoveredLand)) {
        console.info("Is game change event")
        return true
    }

    console.info("Is not game change event")

    return false
}

async function startMonitoringGame(gameId: GameId, playerId: PlayerId) {

    /* Get initial game data to then continuously monitor */
    const viewAtStart = await getViewForPlayer(gameId, playerId)

    for (const sign of viewAtStart.signs) {
        monitor.signs.set(sign.id, sign)
    }

    for (const stone of viewAtStart.stones) {
        monitor.stones.add(stone)
    }

    for (const point of viewAtStart.discoveredPoints) {
        monitor.discoveredPoints.add(point)
    }

    for (const worker of viewAtStart.workers) {
        monitor.workers.set(worker.id, worker)
    }

    for (const house of viewAtStart.houses) {
        monitor.houses.set(house.id, house)
    }

    for (const flag of viewAtStart.flags) {
        monitor.flags.set(flag.id, flag)
    }

    for (const road of viewAtStart.roads) {
        monitor.roads.set(road.id, road)
    }

    for (const tree of viewAtStart.trees) {
        monitor.trees.add(tree)
    }

    for (const crop of viewAtStart.crops) {
        monitor.crops.add(crop)
    }

    const websocketUrl = "ws://localhost:8080/ws/monitor/games/" + gameId + "/players/" + playerId

    console.info("Websocket url: " + websocketUrl)

    /* Subscribe to changes */
    const websocket = new WebSocket(websocketUrl)

    websocket.onopen = () => {
        console.info("Websocket for subscription is open")

        websocket.send("Ping: FE client connected")
    }

    websocket.onclose = (e) => { console.info("Websocket closed: " + JSON.stringify(e)) }
    websocket.onerror = (e) => { console.info("Websocket error: " + JSON.stringify(e)) }

    websocket.onmessage = (message) => {

        const data = JSON.parse(message.data)

        console.info("Message received: " + JSON.stringify(data))

        if (!isGameChangesMessage(data)) {
            console.error("Is not game change message!")

            return
        }

        const changesMessage: ChangesMessage = data

        if (changesMessage.workersWithNewTargets) {
            syncWorkersWithNewTargets(changesMessage.workersWithNewTargets)
        }

        if (changesMessage.removedWorkers) {
            syncRemovedWorkers(changesMessage.removedWorkers)
        }

        if (changesMessage.newBuildings) {
            syncNewHouses(changesMessage.newBuildings)
        }

        if (changesMessage.changedBuildings) {
            syncChangedHouses(changesMessage.changedBuildings)
        }

        if (changesMessage.removedBuildings) {
            syncRemovedHouses(changesMessage.removedBuildings)
        }

        if (changesMessage.newFlags) {
            syncNewFlags(changesMessage.newFlags)
        }

        if (changesMessage.removedFlags) {
            syncRemovedFlags(changesMessage.removedFlags)
        }

        if (changesMessage.newRoads) {
            syncNewRoads(changesMessage.newRoads)
        }

        if (changesMessage.removedRoads) {
            syncRemovedRoads(changesMessage.removedRoads)
        }

        if (changesMessage.newBorder) {
            syncNewBorder(changesMessage.newBorder)
        }

        if (changesMessage.removedBorder) {
            syncRemovedBorder(changesMessage.removedBorder)
        }

        if (changesMessage.newTrees) {
            syncNewTrees(changesMessage.newTrees)
        }

        if (changesMessage.removedTrees) {
            syncRemovedTrees(changesMessage.removedTrees)
        }

        if (changesMessage.newStones) {
            syncNewStones(changesMessage.newStones)
        }

        if (changesMessage.removedStones) {
            syncRemovedStones(changesMessage.removedStones)
        }

        if (changesMessage.newCrops) {
            syncNewCrops(changesMessage.newCrops)
        }

        if (changesMessage.removedCrops) {
            syncRemovedCrops(changesMessage.removedCrops)
        }

        if (changesMessage.newDiscoveredLand) {
            syncNewDiscoveredLand(changesMessage.newDiscoveredLand)
        }

        if (changesMessage.newSigns) {
            syncNewSigns(changesMessage.newSigns)
        }

        if (changesMessage.removedSigns) {
            syncRemovedSigns(changesMessage.removedSigns)
        }
    }

    periodicUpdates = setInterval(async () => {

        for (const [id, worker] of monitor.workers) {

            /* Filter workers without any planned path */
            if (!worker.plannedPath || worker.plannedPath.length === 0) {
                continue
            }

            worker.percentageTraveled = worker.percentageTraveled + 10

            /* Get the next point and the target point */
            const target = worker.plannedPath[worker.plannedPath.length - 1]
            const next = worker.plannedPath[0]

            /* Clear the planned path for workers that have reached the target */
            if (worker.percentageTraveled === 100) {

                if (worker.next) {
                    worker.previous = { x: worker.next.x, y: worker.next.y }
                }

                worker.x = next.x
                worker.y = next.y

                worker.percentageTraveled = 0

                worker.plannedPath.shift()

                if (worker.plannedPath.length > 0) {
                    worker.next = { x: worker.plannedPath[0].x, y: worker.plannedPath[0].y }
                } else {
                    worker.plannedPath = undefined
                }

                worker.betweenPoints = false

            /* Show that the worker is walking between two points */
            } else {
                worker.betweenPoints = true
            }

            //console.info("  - Moved: worker " + worker.id + " at " + " " + worker.x + ", " + worker.y + " progress " + worker.percentageTraveled)
        }
    }, 200)

    console.info(websocket)
}

function syncNewSigns(newSigns: SignInformation[]) {
    for (const newSign of newSigns) {
        monitor.signs.set(newSign.id, newSign)
    }
}

function syncRemovedSigns(removedSignIds: SignId[]) {
    for (const removedSignId of removedSignIds) {
        monitor.signs.delete(removedSignId)
    }
}

function syncNewDiscoveredLand(newDiscoveredLand: Point[]) {
    for (const point of newDiscoveredLand) {
        monitor.discoveredPoints.add(point)
    }
}

function syncNewCrops(newCrops: Point[]) {
    for (const newCrop of newCrops) {
        monitor.crops.add(newCrop)
    }
}

function syncRemovedCrops(removedCrops: Point[]) {
    for (const removedCrop of removedCrops) {
        monitor.crops.delete(removedCrop)
    }
}

function syncNewTrees(newTrees: Point[]) {
    for (const tree of newTrees) {
        monitor.trees.add(tree)
    }
}

function syncRemovedTrees(removedTrees: Point[]) {
    for (const tree of removedTrees) {
        monitor.trees.delete(tree)
    }
}

function syncNewStones(newStones: Point[]) {
    for (const newStone of newStones) {
        monitor.stones.add(newStone)
    }
}

function syncRemovedStones(removedStones: Point[]) {
    for (const removedStone of removedStones) {
        monitor.stones.delete(removedStone)
    }
}

function syncNewBorder(newBorder: Point[]) {
    for (const point of newBorder) {
        monitor.border.add(point)
    }
}

function syncRemovedBorder(removedBorder: Point[]) {
    for (const point of removedBorder) {
        monitor.border.delete(point)
    }
}

function syncNewRoads(newRoads: RoadInformation[]) {
    for (const newRoad of newRoads) {
        monitor.roads.set(newRoad.id, newRoad)
    }
}

function syncRemovedRoads(removedRoads: RoadId[]) {
    for (const removedRoadId of removedRoads) {
        monitor.roads.delete(removedRoadId)
    }
}

function syncNewFlags(newFlags: FlagInformation[]) {
    for (const newFlag of newFlags) {
        monitor.flags.set(newFlag.id, newFlag)
    }
}

function syncRemovedFlags(removedFlagIds: FlagId[]) {
    for (const removedFlagId of removedFlagIds) {
        monitor.flags.delete(removedFlagId)
    }
}

function syncNewHouses(newHouses: HouseInformation[]) {
    for (const newHouse of newHouses) {
        monitor.houses.set(newHouse.id, newHouse)
    }
}

function syncChangedHouses(changedHouses: HouseInformation[]) {
    for (const changedHouse of changedHouses) {
        monitor.houses.set(changedHouse.id, changedHouse)
    }
}

function syncRemovedHouses(removedHouses: HouseId[]) {
    for (const removedHouseId of removedHouses) {
        monitor.houses.delete(removedHouseId)
    }
}

function syncRemovedWorkers(removedWorkerIds: WorkerId[]) {
    for (const removedWorkerId of removedWorkerIds) {
        monitor.workers.delete(removedWorkerId)
    }
}

function syncWorkersWithNewTargets(targetChanges: WalkerTargetChange[]) {

    for (const walkerTargetChange of targetChanges) {

        if (!walkerTargetChange.path || walkerTargetChange.path.length === 0) {
            console.error("Walker without path! " + JSON.stringify(walkerTargetChange))

            continue
        }

        let worker = monitor.workers.get(walkerTargetChange.id)

        if (!worker) {
            worker = {
                id: walkerTargetChange.id,
                x: walkerTargetChange.x,
                y: walkerTargetChange.y,
                plannedPath: walkerTargetChange.path,
                inside: false,
                betweenPoints: false,
                percentageTraveled: 0
            }

            monitor.workers.set(walkerTargetChange.id, worker)
        }

        worker.plannedPath = walkerTargetChange.path

        worker.previous = { x: walkerTargetChange.x, y: walkerTargetChange.y }

        worker.next = { x: walkerTargetChange.path[0].x, y: walkerTargetChange.path[0].y }
        worker.percentageTraveled = 0
        worker.betweenPoints = false

        worker.x = walkerTargetChange.x
        worker.y = walkerTargetChange.y

        //console.info("  - Event: worker " + worker.id + " at " + " " + worker.x + ", " + worker.y + " progress " + 0)
    }
}

export { startMonitoringGame, monitor }