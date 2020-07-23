import { AvailableConstruction, SignInformation, SignId, Point, GameId, PlayerId, getViewForPlayer, WorkerId, WorkerInformation, HouseId, HouseInformation, FlagId, FlagInformation, RoadId, RoadInformation, PlayerInformation, getPlayers, AnimalInformation, GameMessage, getMessagesForPlayer, getHouseInformation, printTimestamp, getTerrain, TerrainAtPoint } from './api'
import { PointMapFast, PointSetFast } from './util_types'
import { terrainInformationToTerrainAtPointList, getPointDownLeft, getPointDownRight, getPointRight, getPointUpRight, getPointLeft } from './utils'

const messageListeners: ((messages: GameMessage[]) => void)[] = []
const houseListeners: Map<HouseId, ((house: HouseInformation) => void)[]> = new Map<HouseId, ((house: HouseInformation) => void)[]>()

type vegetationInt = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

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
    pointLeft: Point
    heightLeft: number
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
    storeDiscoveredTiles(monitor.discoveredPoints)

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

    websocket.onmessage = (messageFromServer) => {

        let message

        try {
            message = JSON.parse(messageFromServer.data)
        } catch (e) {
            console.error(e)
            console.error(JSON.stringify(e))
            console.info(messageFromServer.data)
        }

        if (!isGameChangesMessage(message)) {
            console.error("Is not game change message!")
            console.error(JSON.stringify(message))

            return
        }

        if (message.workersWithNewTargets) {
            syncWorkersWithNewTargets(message.workersWithNewTargets)
        }

        message.removedWorkers?.forEach((id) => monitor.workers.delete(id))

        if (message.newBuildings) {
            printTimestamp("About to add new houses")
        }

        message.newBuildings?.forEach((house) => monitor.houses.set(house.id, house))

        if (message.newBuildings) {
            printTimestamp("Added new houses")
        }

        if (message.changedBuildings) {
            let houseIdsToRemove = []

            for (const house of message.changedBuildings) {
                for (const [id, oldHouse] of monitor.houses.entries()) {
                    if (house.x === oldHouse.x && house.y === oldHouse.y) {
                        houseIdsToRemove.push(oldHouse.id)
                    }
                }
            }

            houseIdsToRemove.forEach((id) => monitor.houses.delete(id))

            message.changedBuildings.forEach((house) => monitor.houses.set(house.id, house))

            notifyHouseListeners(message.changedBuildings)
        }

        message.removedBuildings?.forEach((id) => monitor.houses.delete(id))

        message.newFlags?.forEach((flag) => monitor.flags.set(flag.id, flag))
        message.removedFlags?.forEach((id) => monitor.flags.delete(id))

        message.newRoads?.forEach((road) => monitor.roads.set(road.id, road))
        message.removedRoads?.forEach((id) => monitor.roads.delete(id))

        message.newTrees?.forEach((tree) => monitor.trees.add(tree))
        message.removedTrees?.forEach((tree) => monitor.trees.delete(tree))

        message.newStones?.forEach((stone) => monitor.stones.add(stone))
        message.removedStones?.forEach((stone) => monitor.stones.delete(stone))

        if (message.changedBorders) {
            syncChangedBorders(message.changedBorders)
        }

        message.newCrops?.forEach((crop) => monitor.crops.add(crop))
        message.removedCrops?.forEach((crop) => monitor.crops.delete(crop))

        message.newSigns?.forEach((sign) => monitor.signs.set(sign.id, sign))
        message.removedSigns?.forEach((id) => monitor.signs.delete(id))

        message.newDiscoveredLand?.forEach((point) => monitor.discoveredPoints.add(point))

        if (message.newDiscoveredLand) {
            storeDiscoveredTiles(message.newDiscoveredLand)
        }

        if (message.changedAvailableConstruction) {
            for (const change of message.changedAvailableConstruction) {
                const point = { x: change.x, y: change.y }

                if (change.available.length === 0) {
                    monitor.availableConstruction.delete(point)
                } else {
                    monitor.availableConstruction.set(point, change.available)
                }
            }
        }

        if (message.newMessages) {
            monitor.messages = monitor.messages.concat(message.newMessages)

            notifyMessageListeners(message.newMessages)
        }
    }

    setInterval(async () => {

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

function storeDiscoveredTiles(newlyDiscoveredPoints: PointSetFast | Point[]) {
    for (const point of newlyDiscoveredPoints) {
        const terrainAtPoint = monitor.allTiles.get(point)

        if (!terrainAtPoint) {
            continue
        }

        const pointLeft = getPointLeft(point)
        const pointUpRight = getPointUpRight(point)
        const pointDownLeft = getPointDownLeft(point)
        const pointDownRight = getPointDownRight(point)
        const pointRight = getPointRight(point)

        const isLeftDiscovered = monitor.discoveredPoints.has(pointLeft)
        const isDownLeftDiscovered = monitor.discoveredPoints.has(pointDownLeft)
        const isDownRightDiscovered = monitor.discoveredPoints.has(pointDownRight)
        const isRightDiscovered = monitor.discoveredPoints.has(pointRight)
        const isUpRightDiscovered = monitor.discoveredPoints.has(pointUpRight)

        const terrainAtPointLeft = monitor.allTiles.get(pointLeft)
        const terrainAtPointDownLeft = monitor.allTiles.get(pointDownLeft)
        const terrainAtPointDownRight = monitor.allTiles.get(pointDownRight)
        const terrainAtPointRight = monitor.allTiles.get(pointRight)
        const terrainAtPointUpRight = monitor.allTiles.get(pointUpRight)

        if (terrainAtPointLeft && terrainAtPointDownLeft && terrainAtPointLeft.below && isLeftDiscovered && isDownLeftDiscovered) {
            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPointLeft.downRight,
                    pointLeft: pointLeft,
                    heightLeft: terrainAtPointLeft.height,
                    heightRight: terrainAtPoint.height,
                    heightDownRight: terrainAtPointDownLeft.height
                }
            )
        }

        if (terrainAtPointUpRight && terrainAtPointRight && terrainAtPointUpRight.below && isUpRightDiscovered && isRightDiscovered) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPointUpRight.below,
                    pointAbove: pointUpRight,
                    heightAbove: terrainAtPointUpRight.height,
                    heightDownLeft: terrainAtPoint.height,
                    heightDownRight: terrainAtPointRight.height
                }
            )
        }

        if (terrainAtPoint.below !== undefined && terrainAtPoint.below !== null &&
            terrainAtPointDownLeft && terrainAtPointDownRight &&
            isDownLeftDiscovered && isDownRightDiscovered) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPoint.below,
                    pointAbove: point,
                    heightAbove: terrainAtPoint.height,
                    heightDownLeft: terrainAtPointDownLeft.height,
                    heightDownRight: terrainAtPointDownRight.height
                }
            )
        }

        if (terrainAtPoint.downRight !== undefined && terrainAtPoint.downRight !== null &&
            terrainAtPointDownRight && terrainAtPointRight &&
            isDownRightDiscovered && isRightDiscovered) {
            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPoint.downRight,
                    pointLeft: point,
                    heightLeft: terrainAtPoint.height,
                    heightDownRight: terrainAtPointDownRight.height,
                    heightRight: terrainAtPointRight.height
                }
            )
        }
    }
}

function syncChangedBorders(borderChanges: BorderChange[]) {

    for (const borderChange of borderChanges) {
        const currentBorderForPlayer = monitor.border.get(borderChange.playerId)

        if (currentBorderForPlayer) {

            borderChange.newBorder.forEach((point) => currentBorderForPlayer.points.add(point))
            borderChange.removedBorder.forEach(point => currentBorderForPlayer.points.delete(point))

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
                betweenPoints: false,
                percentageTraveled: 0
            }

            monitor.workers.set(worker.id, worker)
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

        monitor.houses.set(house.id, house)

        notifyHouseListeners([house])
    }
}

export { forceUpdateOfHouse, listenToHouse, listenToMessages, startMonitoringGame, monitor }