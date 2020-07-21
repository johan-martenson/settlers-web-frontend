import { AvailableConstruction, SignInformation, SignId, Point, GameId, PlayerId, getViewForPlayer, WorkerId, WorkerInformation, HouseId, HouseInformation, FlagId, FlagInformation, RoadId, RoadInformation, PlayerInformation, getPlayers, AnimalInformation, GameMessage, getMessagesForPlayer, getHouseInformation, printTimestamp, getTerrain } from './api'
import { PointMapFast, PointSetFast } from './util_types'
import { terrainInformationToTerrainAtPointList, getPointDownLeft, getPointDownRight, getPointRight } from './utils'

let periodicUpdates: NodeJS.Timeout | null

const messageListeners: ((messages: GameMessage[]) => void)[] = []
const houseListeners: Map<HouseId, ((house: HouseInformation) => void)[]> = new Map<HouseId, ((house: HouseInformation) => void)[]>()

type vegetationInt = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface TerrainAtPoint {
    point: Point
    straightBelow: vegetationInt
    belowToTheRight: vegetationInt
    height: number
}

interface MonitoredBorderForPlayer {
    color: string
    points: PointSetFast
}

interface TileBelow {
    pointAbove: Point
    heightDownLeft: number
    heightDownRight: number
    heightAbove: number
    vegetation: vegetationInt
}

interface TileDownRight {
    pointUpLeft: Point
    heightUpLeft: number
    heightDownRight: number
    heightRight: number
    vegetation: vegetationInt
}

interface Monitor {
    gameId?: GameId
    playerId?: PlayerId
    workers: Map<WorkerId, WorkerInformation>
    animals: AnimalInformation[]
    houses: Map<HouseId, HouseInformation>
    flags: Map<FlagId, FlagInformation>
    roads: Map<RoadId, RoadInformation>
    border: Map<PlayerId, MonitoredBorderForPlayer>
    trees: PointSetFast
    stones: PointSetFast
    crops: PointSetFast
    discoveredPoints: PointSetFast
    signs: Map<SignId, SignInformation>
    players: Map<PlayerId, PlayerInformation>
    availableConstruction: PointMapFast<AvailableConstruction[]>
    messages: GameMessage[]
    allTiles: PointMapFast<TerrainAtPoint>
    discoveredBelowTiles: Set<TileBelow>
    discoveredDownRightTiles: Set<TileDownRight>
}

const monitor: Monitor = {
    workers: new Map<WorkerId, WorkerInformation>(),
    animals: [],
    houses: new Map<HouseId, HouseInformation>(),
    flags: new Map<FlagId, FlagInformation>(),
    roads: new Map<RoadId, RoadInformation>(),
    border: new Map<PlayerId, MonitoredBorderForPlayer>(),
    trees: new PointSetFast(),
    stones: new PointSetFast(),
    crops: new PointSetFast(),
    discoveredPoints: new PointSetFast(),
    signs: new Map<SignId, SignInformation>(),
    players: new Map<PlayerId, PlayerInformation>(),
    availableConstruction: new PointMapFast<AvailableConstruction[]>(),
    messages: [],
    allTiles: new PointMapFast<TerrainAtPoint>(),
    discoveredBelowTiles: new Set<TileBelow>(),
    discoveredDownRightTiles: new Set<TileDownRight>()
}

interface WalkerTargetChange {
    id: string
    x: number
    y: number
    path: Point[]
}

interface BorderChange {
    playerId: PlayerId
    newBorder: Point[]
    removedBorder: Point[]
}

interface ChangedAvailableConstruction extends Point {
    available: AvailableConstruction[]
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
    changedBorders?: BorderChange[]
    newTrees?: Point[]
    removedTrees?: Point[]
    newStones?: Point[]
    removedStones?: Point[]
    newCrops?: Point[]
    removedCrops?: Point[]
    newDiscoveredLand?: Point[]
    newSigns?: SignInformation[]
    removedSigns?: SignId[]
    changedAvailableConstruction?: ChangedAvailableConstruction[]
    newMessages?: GameMessage[]
}

function isGameChangesMessage(message: any): message is ChangesMessage {
    if (message.time &&
        (message.workersWithNewTargets || message.removedWorkers ||
            message.newFlags || message.removedFlags ||
            message.newBuildings || message.changedBuildings || message.removedBuildings ||
            message.newRoads || message.removedRoads ||
            message.changedBorders ||
            message.newTrees || message.removedTrees ||
            message.newCrops || message.removedCrops ||
            message.newStones || message.removedStones ||
            message.newSigns || message.removedSigns ||
            message.newDiscoveredLand ||
            message.changedAvailableConstruction ||
            message.newMessages)) {
        return true
    }

    return false
}

async function startMonitoringGame(gameId: GameId, playerId: PlayerId) {

    /* Get the list of players */
    const players = await getPlayers(gameId)

    for (const player of players) {

        /* Get any messages for the player */
        const messages = await getMessagesForPlayer(gameId, playerId)

        /* Store the player */
        monitor.players.set(player.id, player)

        /* Store the messages */
        if (messages) {
            monitor.messages = messages
        } else {
            monitor.messages = []
        }
    }

    /* Get the messages */

    /* Get initial game data to then continuously monitor */
    const viewAtStart = await getViewForPlayer(gameId, playerId)

    for (const [point, availableAtPoint] of viewAtStart.availableConstruction) {
        monitor.availableConstruction.set(point, availableAtPoint)
    }

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

    for (const borderInformation of viewAtStart.borders) {

        const player = monitor.players.get(borderInformation.playerId)

        if (!player) {
            console.error("UNKNOWN PLAYER: " + borderInformation.playerId)

            continue
        }

        monitor.border.set(borderInformation.playerId,
            {
                color: player.color,
                points: new PointSetFast(borderInformation.points)
            }
        )
    }

    /* Store the full terrain */
    const terrain = await getTerrain(gameId)

    const terrainPointList = terrainInformationToTerrainAtPointList(terrain)

    terrainPointList.forEach(
        (terrainAtPoint) => {
            monitor.allTiles.set(terrainAtPoint.point, terrainAtPoint)
        }
    )

    /* Store the discovered tiles */
    storeDiscoveredTiles()

    /* Remember the game id and player id */
    monitor.gameId = gameId
    monitor.playerId = playerId

    /* Subscribe to changes */
    const websocketUrl = "ws://" + window.location.hostname + ":8080/ws/monitor/games/" + gameId + "/players/" + playerId

    console.info("Websocket url: " + websocketUrl)

    const websocket = new WebSocket(websocketUrl)

    websocket.onopen = () => {
        console.info("Websocket for subscription is open")

        websocket.send("Ping: FE client connected")
    }

    websocket.onclose = (e) => { console.info("Websocket closed: " + JSON.stringify(e)) }
    websocket.onerror = (e) => { console.info("Websocket error: " + JSON.stringify(e)) }

    websocket.onmessage = (message) => {

        let data

        try {
            data = JSON.parse(message.data)
        } catch (e) {
            console.error(e)
            console.error(JSON.stringify(e))
            console.info(message.data)
        }

        if (!isGameChangesMessage(data)) {
            console.error("Is not game change message!")
            console.error(JSON.stringify(data))

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
            printTimestamp("About to add new houses")
            syncNewHouses(changesMessage.newBuildings)
            printTimestamp("Added new houses")
        }

        if (changesMessage.changedBuildings) {
            syncChangedHouses(changesMessage.changedBuildings)

            notifyHouseListeners(changesMessage.changedBuildings)
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

        if (changesMessage.changedBorders) {
            syncChangedBorders(changesMessage.changedBorders)
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

        if (changesMessage.changedAvailableConstruction) {
            syncChangedAvailableConstruction(changesMessage.changedAvailableConstruction)
        }

        if (changesMessage.newMessages) {
            syncNewMessages(changesMessage.newMessages)

            notifyMessageListeners(changesMessage.newMessages)
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
        }
    }, 200)

    console.info(websocket)
}

function storeDiscoveredTiles() {
    for (const point of monitor.discoveredPoints) {
        const terrainAtPoint = monitor.allTiles.get(point)

        if (!terrainAtPoint) {
            continue
        }

        const terrainAtPointDownLeft = monitor.allTiles.get(getPointDownLeft(point))
        const terrainAtPointDownRight = monitor.allTiles.get(getPointDownRight(point))
        const terrainAtPointRight = monitor.allTiles.get(getPointRight(point))

        if (terrainAtPoint.straightBelow !== undefined && terrainAtPoint.straightBelow !== null &&
            terrainAtPointDownLeft && terrainAtPointDownRight) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPoint.straightBelow,
                    pointAbove: point,
                    heightAbove: terrainAtPoint.height,
                    heightDownLeft: terrainAtPointDownLeft.height,
                    heightDownRight: terrainAtPointDownRight.height
                }
            )
        }

        if (terrainAtPoint.belowToTheRight !== undefined && terrainAtPoint.belowToTheRight !== null &&
            terrainAtPointDownRight && terrainAtPointRight) {
            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPoint.belowToTheRight,
                    pointUpLeft: point,
                    heightUpLeft: terrainAtPoint.height,
                    heightDownRight: terrainAtPointDownRight.height,
                    heightRight: terrainAtPointRight.height
                }
            )
        }
    }
}

function syncNewMessages(newMessages: GameMessage[]) {
    monitor.messages = monitor.messages.concat(newMessages)
}

function syncChangedAvailableConstruction(changedAvailableConstruction: ChangedAvailableConstruction[]) {
    for (const change of changedAvailableConstruction) {
        const point = { x: change.x, y: change.y }

        if (change.available.length === 0) {
            monitor.availableConstruction.delete(point)
        } else {
            monitor.availableConstruction.set(point, change.available)
        }
    }
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

function syncChangedBorders(borderChanges: BorderChange[]) {

    for (const borderChange of borderChanges) {
        const currentBorderForPlayer = monitor.border.get(borderChange.playerId)

        if (currentBorderForPlayer) {

            for (const point of borderChange.newBorder) {
                currentBorderForPlayer.points.add(point)
            }

            for (const point of borderChange.removedBorder) {
                currentBorderForPlayer.points.delete(point)
            }
        } else {

            const player = monitor.players.get(borderChange.playerId)

            if (!player) {
                console.error("UNKNOWN PLAYER: " + JSON.stringify(borderChange))

                continue
            }

            monitor.border.set(borderChange.playerId,
                {
                    color: player.color,
                    points: new PointSetFast(borderChange.newBorder)
                }
            )
        }
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
    }
}

function listenToMessages(messageListenerFn: (messages: GameMessage[]) => void) {
    messageListeners.push(messageListenerFn)
}

function listenToHouse(houseId: HouseId, houseListenerFn: (house: HouseInformation) => void) {
    let listenersForHouseId = houseListeners.get(houseId)

    if (!listenersForHouseId) {
        listenersForHouseId = []

        houseListeners.set(houseId, listenersForHouseId)
    }

    listenersForHouseId.push(houseListenerFn)
}

function notifyMessageListeners(messages: GameMessage[]): void {
    for (const listener of messageListeners) {
        try {
            listener(messages)
        } catch (exception) {
            console.info("Failed to notify listener about messages")
            console.error(exception)
        }
    }
}

function notifyHouseListeners(houses: HouseInformation[]): void {
    for (const house of houses) {
        const listeners = houseListeners.get(house.id)

        if (!listeners) {
            return
        }

        for (const listener of listeners) {
            listener(house)
        }
    }
}

async function forceUpdateOfHouse(houseId: HouseId): Promise<void> {
    if (monitor.gameId && monitor.playerId) {
        const house = await getHouseInformation(houseId, monitor.gameId, monitor.playerId)

        syncChangedHouses([house])

        notifyHouseListeners([house])
    }
}

export { forceUpdateOfHouse, listenToHouse, listenToMessages, startMonitoringGame, monitor }