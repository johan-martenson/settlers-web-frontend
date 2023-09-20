import { AnyBuilding, AvailableConstruction, BodyType, createBuilding, createFlag, createRoad, CropId, CropInformation, CropInformationLocal, Decoration, DecorationType, Direction, FlagId, FlagInformation, GameId, GameMessage, getHouseInformation, getInformationOnPoint, getMessagesForPlayer, getPlayers, getTerrain, getViewForPlayer, HouseId, HouseInformation, MaterialAllUpperCase, PlayerId, PlayerInformation, Point, PointInformation, printTimestamp, removeFlag, removeRoad, RoadId, RoadInformation, ServerWorkerInformation, ShipId, ShipInformation, SignId, SignInformation, SimpleDirection, TerrainAtPoint, TreeId, TreeInformation, TreeInformationLocal, VegetationIntegers, WildAnimalId, WildAnimalInformation, WorkerAction, WorkerId, WorkerInformation, WorkerType } from './api'
import { getDirectionForWalkingWorker, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, terrainInformationToTerrainAtPointList } from './utils'
import { PointMapFast, PointSetFast } from './util_types'

const messageListeners: ((messages: GameMessage[]) => void)[] = []
const houseListeners: Map<HouseId, ((house: HouseInformation) => void)[]> = new Map<HouseId, ((house: HouseInformation) => void)[]>()
const discoveredPointListeners: ((discoveredPoints: PointSetFast) => void)[] = []
const roadListeners: (() => void)[] = []

let loadingPromise: Promise<void> | undefined = undefined

interface MonitoredBorderForPlayer {
    color: string
    points: PointSetFast
}

export interface TileBelow {
    pointAbove: Point
    heightDownLeft: number
    heightDownRight: number
    heightAbove: number
    vegetation: VegetationIntegers
}

export interface TileDownRight {
    pointLeft: Point
    heightLeft: number
    heightDown: number
    heightRight: number
    vegetation: VegetationIntegers
}

interface Monitor {
    gameId?: GameId
    playerId?: PlayerId
    workers: Map<WorkerId, WorkerInformation>
    ships: Map<ShipId, ShipInformation>
    houses: Map<HouseId, HouseInformation>
    flags: Map<FlagId, FlagInformation>
    roads: Map<RoadId, RoadInformation>
    border: Map<PlayerId, MonitoredBorderForPlayer>
    trees: Map<TreeId, TreeInformationLocal>
    stones: PointSetFast
    crops: Map<CropId, CropInformationLocal>
    discoveredPoints: PointSetFast
    signs: Map<SignId, SignInformation>
    players: Map<PlayerId, PlayerInformation>
    availableConstruction: PointMapFast<AvailableConstruction[]>
    messages: GameMessage[]
    allTiles: PointMapFast<TerrainAtPoint>
    discoveredBelowTiles: Set<TileBelow>
    discoveredDownRightTiles: Set<TileDownRight>
    pointsWithBelowTileDiscovered: PointSetFast
    pointsWithDownRightTileDiscovered: PointSetFast
    deadTrees: PointSetFast
    visibleTrees: Map<TreeId, TreeInformationLocal>
    wildAnimals: Map<WildAnimalId, WildAnimalInformation>
    decorations: PointMapFast<Decoration>

    localRemovedFlags: Map<FlagId, FlagInformation>
    localRemovedRoads: Map<RoadId, RoadInformation>

    placeHouse: ((houseType: AnyBuilding, point: Point) => void)
    placeRoad: ((points: Point[]) => void)
    placeFlag: ((point: Point) => void)
    placeRoadAndFlag: ((point: Point, points: Point[]) => void)
    removeFlag: ((flagId: FlagId) => void)
    removeRoad: ((roadId: FlagId) => void)
    removeBuilding: ((houseId: HouseId) => void)
    isAvailable: ((point: Point, whatToBuild: 'FLAG') => boolean)
    removeLocalFlag: ((flagId: FlagId) => void)
    undoRemoveLocalFlag: ((flagId: FlagId) => void)
    removeLocalRoad: ((roadId: RoadId) => void)
    undoRemoveLocalRoad: ((roadId: RoadId) => void)
    getLoadingPromise(): Promise<void> | undefined
    isGameDataAvailable(): boolean
}

const monitor: Monitor = {
    workers: new Map<WorkerId, WorkerInformation>(),
    ships: new Map<ShipId, ShipInformation>(),
    houses: new Map<HouseId, HouseInformation>(),
    flags: new Map<FlagId, FlagInformation>(),
    roads: new Map<RoadId, RoadInformation>(),
    border: new Map<PlayerId, MonitoredBorderForPlayer>(),
    trees: new Map<TreeId, TreeInformationLocal>(),
    stones: new PointSetFast(),
    crops: new Map<CropId, CropInformationLocal>(),
    discoveredPoints: new PointSetFast(),
    signs: new Map<SignId, SignInformation>(),
    players: new Map<PlayerId, PlayerInformation>(),
    availableConstruction: new PointMapFast<AvailableConstruction[]>(),
    messages: [],
    allTiles: new PointMapFast<TerrainAtPoint>(),
    discoveredBelowTiles: new Set<TileBelow>(),
    discoveredDownRightTiles: new Set<TileDownRight>(),
    pointsWithBelowTileDiscovered: new PointSetFast(),
    pointsWithDownRightTileDiscovered: new PointSetFast(),
    deadTrees: new PointSetFast(),
    visibleTrees: new Map<TreeId, TreeInformationLocal>(),
    wildAnimals: new Map<WildAnimalId, WildAnimalInformation>(),
    decorations: new PointMapFast<Decoration>(),

    localRemovedFlags: new Map<FlagId, FlagInformation>(),
    localRemovedRoads: new Map<RoadId, RoadInformation>(),

    placeHouse: placeBuildingWebsocket,
    placeRoad: placeRoadWebsocket,
    placeFlag: placeFlagWebsocket,
    placeRoadAndFlag: placeRoadWithFlagWebsocket,
    removeFlag: removeFlagWebsocket,
    removeRoad: removeRoadWebsocket,
    removeBuilding: removeBuildingWebsocket,
    isAvailable: isAvailable,
    removeLocalFlag: removeLocalFlag,
    undoRemoveLocalFlag: undoRemoveLocalFlag,
    removeLocalRoad: removeLocalRoad,
    undoRemoveLocalRoad: undoRemoveLocalRoad,
    isGameDataAvailable: isGameDataAvailable,
    getLoadingPromise: getLoadingPromise,
}

let websocket: WebSocket

interface WalkerTargetChange {
    id: string
    x: number
    y: number
    path: Point[]
    direction: SimpleDirection
    cargo?: MaterialAllUpperCase
    type: WorkerType
    bodyType?: BodyType
}

interface BorderChange {
    playerId: PlayerId
    newBorder: Point[]
    removedBorder: Point[]
}

interface ChangedAvailableConstruction extends Point {
    available: AvailableConstruction[]
}

interface WorkerNewAction {
    id: WorkerId
    x: number
    y: number
    startedAction: WorkerAction
}

interface PointAndDecoration {
    x: number
    y: number
    decoration: DecorationType
}

interface ChangesMessage {
    workersWithNewTargets?: WalkerTargetChange[]
    workersWithStartedActions?: WorkerNewAction[]
    wildAnimalsWithNewTargets?: WildAnimalInformation[]
    removedWorkers?: WorkerId[]
    newBuildings?: HouseInformation[]
    changedBuildings?: HouseInformation[]
    removedBuildings?: HouseId[]
    newFlags?: FlagInformation[]
    changedFlags?: FlagInformation[]
    removedFlags?: FlagId[]
    newRoads?: RoadInformation[]
    removedRoads?: RoadId[]
    changedBorders?: BorderChange[]
    newTrees?: TreeInformation[]
    removedTrees?: TreeId[]
    newStones?: Point[]
    removedStones?: Point[]
    newCrops?: CropInformation[]
    harvestedCrops?: CropId[]
    removedCrops?: CropId[]
    newDiscoveredLand?: Point[]
    newSigns?: SignInformation[]
    removedSigns?: SignId[]
    changedAvailableConstruction?: ChangedAvailableConstruction[]
    newMessages?: GameMessage[]
    discoveredDeadTrees?: Point[]
    removedDeadTrees?: Point[]
    removedWildAnimals?: WildAnimalId[]
    removedDecorations?: Point[]
    newDecorations?: PointAndDecoration[]
}

function isGameChangesMessage(message: any): message is ChangesMessage {
    if (message.time &&
        (message.workersWithNewTargets || message.removedWorkers ||
            message.newFlags || message.changedFlags || message.removedFlags ||
            message.newBuildings || message.changedBuildings || message.removedBuildings ||
            message.newRoads || message.removedRoads ||
            message.changedBorders ||
            message.newTrees || message.removedTrees ||
            message.newCrops || message.harvestedCrops || message.removedCrops ||
            message.newStones || message.removedStones ||
            message.newSigns || message.removedSigns ||
            message.newDiscoveredLand ||
            message.changedAvailableConstruction ||
            message.newMessages ||
            message.discoveredDeadTrees ||
            message.removedDeadTrees ||
            message.wildAnimalsWithNewTargets || message.removedWildAnimals ||
            message.workersWithStartedActions ||
            message.removedDecorations || message.newDecorations)) {
        return true
    }

    return false
}

async function startMonitoringGame(gameId: GameId, playerId: PlayerId): Promise<void> {
    loadingPromise = startMonitoringGame_internal(gameId, playerId)

    return loadingPromise
}

async function startMonitoringGame_internal(gameId: GameId, playerId: PlayerId): Promise<void> {

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
    const view = await getViewForPlayer(gameId, playerId)

    view.availableConstruction.forEach((availableAtPoint, point) => monitor.availableConstruction.set(point, availableAtPoint))

    view.signs.forEach(sign => monitor.signs.set(sign.id, sign))

    view.stones.forEach(stone => monitor.stones.add(stone))

    view.discoveredPoints.forEach(point => monitor.discoveredPoints.add(point))

    view.workers.forEach(worker => monitor.workers.set(worker.id, serverWorkerToLocalWorker(worker)))

    view.wildAnimals.forEach(wildAnimal => monitor.wildAnimals.set(wildAnimal.id, wildAnimal))

    view.houses.forEach(house => monitor.houses.set(house.id, house))

    view.flags.forEach(flag => monitor.flags.set(flag.id, flag))

    view.roads.forEach(road => monitor.roads.set(road.id, road))

    view.trees.forEach(tree => monitor.trees.set(tree.id, serverSentTreeToLocal(tree)))

    view.crops.forEach(crop => monitor.crops.set(crop.id, serverSentCropToLocal(crop)))

    view.deadTrees.forEach(deadTree => monitor.deadTrees.add(deadTree))

    view.decorations.forEach(decoration => monitor.decorations.set({ x: decoration.x, y: decoration.y }, decoration))

    for (const borderInformation of view.borders) {

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

    /* Populate visible trees */
    populateVisibleTrees()

    /* Store the full terrain */
    const terrain = await getTerrain(gameId)

    const terrainPointList = terrainInformationToTerrainAtPointList(terrain)

    terrainPointList.forEach(terrainAtPoint => { monitor.allTiles.set(terrainAtPoint.point, terrainAtPoint) })

    /* Store the discovered tiles */
    storeDiscoveredTiles(monitor.discoveredPoints)

    /* Remember the game id and player id */
    monitor.gameId = gameId
    monitor.playerId = playerId

    /* Finally notify the listeners, after all data has been stored */
    discoveredPointListeners.forEach(listener => listener(monitor.discoveredPoints))
    roadListeners.forEach(roadListener => roadListener())

    /* Subscribe to changes */
    const websocketUrl = "ws://" + window.location.hostname + ":8080/ws/monitor/games/" + gameId + "/players/" + playerId

    console.info("Websocket url: " + websocketUrl)

    websocket = new WebSocket(websocketUrl)

    websocket.onopen = () => { console.info("Websocket for subscription is open") }
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

        // Start by handling locally cached changes

        // Clear local additions
        monitor.roads.delete('LOCAL')
        monitor.flags.delete('LOCAL')
        monitor.houses.delete('LOCAL')

        // Confirm local removals if they are part of the message
        message?.removedFlags?.forEach(removedFlagId => monitor.localRemovedFlags.delete(removedFlagId))

        // Debug message to troubleshoot roads that disappear for no reason
        if (message.newRoads || message.removedRoads) {
            console.log("Message with roads")
            console.log(message)
        }

        // Digest all changes from the message
        message.newDiscoveredLand?.forEach(point => monitor.discoveredPoints.add(point))

        if (message.newDiscoveredLand) {
            populateVisibleTrees()

            storeDiscoveredTiles(message.newDiscoveredLand)
        }

        if (message.workersWithNewTargets) {
            syncWorkersWithNewTargets(message.workersWithNewTargets)
        }

        if (message.workersWithStartedActions) {

            message.workersWithStartedActions.forEach(workerWithNewAction => {
                const worker = monitor.workers.get(workerWithNewAction.id)

                if (worker) {
                    worker.x = workerWithNewAction.x
                    worker.y = workerWithNewAction.y
                    worker.plannedPath = undefined
                    worker.next = undefined
                    worker.action = workerWithNewAction.startedAction
                    worker.actionAnimationIndex = 0
                }
            })
        }

        if (message.wildAnimalsWithNewTargets) {
            syncNewOrUpdatedWildAnimals(message.wildAnimalsWithNewTargets)
        }

        message.removedWorkers?.forEach(id => monitor.workers.delete(id))

        message.removedWildAnimals?.forEach(id => monitor.wildAnimals.delete(id))

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
                for (const oldHouse of monitor.houses.values()) {
                    if (house.x === oldHouse.x && house.y === oldHouse.y) {
                        houseIdsToRemove.push(oldHouse.id)
                    }
                }
            }

            houseIdsToRemove.forEach(id => monitor.houses.delete(id))

            message.changedBuildings.forEach(house => monitor.houses.set(house.id, house))
        }

        message.removedBuildings?.forEach(id => monitor.houses.delete(id))

        message.newDecorations?.forEach(pointAndDecoration => monitor.decorations.set({ x: pointAndDecoration.x, y: pointAndDecoration.y }, pointAndDecoration))
        message.removedDecorations?.forEach(point => monitor.decorations.delete(point))

        message.newFlags?.forEach(flag => monitor.flags.set(flag.id, flag))
        message.changedFlags?.forEach(flag => monitor.flags.set(flag.id, flag))
        message.removedFlags?.forEach(id => monitor.flags.delete(id))

        message.newRoads?.forEach(road => monitor.roads.set(road.id, road))
        message.removedRoads?.forEach(id => monitor.roads.delete(id))

        message.newTrees?.forEach(tree => {
            monitor.trees.set(tree.id, serverSentTreeToLocal(tree))

            if (monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y - 1 }) &&
                monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y + 1 }) &&
                monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y - 1 }) &&
                monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y + 1 }) &&
                monitor.discoveredPoints.has({ x: tree.x - 2, y: tree.y }) &&
                monitor.discoveredPoints.has({ x: tree.x + 2, y: tree.y })) {
                monitor.visibleTrees.set(tree.id, serverSentTreeToLocal(tree))
            }
        })
        message.removedTrees?.forEach(treeId => {
            monitor.trees.delete(treeId)
            monitor.visibleTrees.delete(treeId)
        })

        message.discoveredDeadTrees?.forEach(discoveredDeadTree => monitor.deadTrees.add(discoveredDeadTree))
        message.removedDeadTrees?.forEach(deadTree => monitor.deadTrees.delete(deadTree))

        message.newStones?.forEach(stone => monitor.stones.add(stone))
        message.removedStones?.forEach(stone => monitor.stones.delete(stone))

        if (message.changedBorders) {
            syncChangedBorders(message.changedBorders)
        }

        message.newCrops?.forEach(crop => monitor.crops.set(crop.id, serverSentCropToLocal(crop)))

        message.harvestedCrops?.forEach(cropId => {
            const crop = monitor.crops.get(cropId)

            if (crop !== undefined) {
                crop.state = 'HARVESTED'
            }
        })

        message.removedCrops?.forEach(cropId => monitor.crops.delete(cropId))

        message.newSigns?.forEach(sign => monitor.signs.set(sign.id, sign))
        message.removedSigns?.forEach(id => monitor.signs.delete(id))

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

        /* Finally, notify listeners when all data is updated */
        if (message.newDiscoveredLand) {
            const newDiscoveredLand = new PointSetFast(message.newDiscoveredLand)
            discoveredPointListeners.forEach(listener => listener(newDiscoveredLand))
        }

        if (message.newMessages) {
            monitor.messages = monitor.messages.concat(message.newMessages)

            const newMessages = message.newMessages

            messageListeners.forEach(listener => listener(newMessages))
        }

        if (message.newRoads !== undefined || message.removedRoads !== undefined) {
            console.log({ title: "Before notifying road listeners", roads: monitor.roads.values(), listeners: roadListeners, numberRoads: monitor.roads.size })

            roadListeners.forEach(roadListener => roadListener())

            console.log({ title: "After calling road listeners", numberRoads: monitor.roads.size })
        }

        if (message.changedBuildings) {
            notifyHouseListeners(message.changedBuildings)
        }
    }

    // Drive worker animations
    setInterval(async () => {
        for (const worker of monitor.workers.values()) {
            if (worker.action && worker.actionAnimationIndex !== undefined) {
                worker.actionAnimationIndex = worker.actionAnimationIndex + 1
            }
        }
    }, 300)

    // Move workers locally to reduce the amount of messages from the server
    setInterval(async () => {

        for (const worker of monitor.workers.values()) {

            /* Filter workers without any planned path */
            if (!worker.plannedPath || worker.plannedPath.length === 0) {
                continue
            }

            /* Take a step forward */
            worker.percentageTraveled = worker.percentageTraveled + 5

            /* Worker is at an exact point */
            if (worker.percentageTraveled === 100) {

                // The point that the worker was going towards is now the current position
                if (worker.next) {

                    // Update current position
                    worker.x = worker.next.x
                    worker.y = worker.next.y

                    // Set previous to the current position - which means that it's invalid 
                    // when the worker is at a fixed point, but it will always be correct otherwise
                    worker.previous = { x: worker.x, y: worker.y }
                }

                // Set up to walk towards the next point if there is any remaining points to walk
                if (worker.plannedPath.length > 1) {
                    worker.percentageTraveled = 0

                    worker.plannedPath.shift()

                    worker.next = { x: worker.plannedPath[0].x, y: worker.plannedPath[0].y }

                    worker.direction = getDirectionForWalkingWorker(worker, worker.next)
                } else {
                    worker.plannedPath = undefined

                    worker.next = undefined
                }

                worker.betweenPoints = false

                /* Show that the worker is walking between two points */
            } else {
                worker.betweenPoints = true
            }
        }

        for (const wildAnimal of monitor.wildAnimals.values()) {

            /* Filter workers without any planned path */
            if (!wildAnimal.path || wildAnimal.path.length === 0) {
                continue
            }

            wildAnimal.percentageTraveled = wildAnimal.percentageTraveled + 5

            /* Get the next point */
            const next = wildAnimal.path[0]

            /* Clear the planned path for workers that have reached the target */
            if (wildAnimal.percentageTraveled === 100) {

                if (wildAnimal.next) {
                    wildAnimal.previous = { x: wildAnimal.next.x, y: wildAnimal.next.y }
                }

                wildAnimal.x = next.x
                wildAnimal.y = next.y

                wildAnimal.percentageTraveled = 0

                wildAnimal.path.shift()

                if (wildAnimal.path.length > 0) {
                    wildAnimal.next = { x: wildAnimal.path[0].x, y: wildAnimal.path[0].y }
                } else {
                    wildAnimal.path = undefined
                }

                wildAnimal.betweenPoints = false

                /* Show that the worker is walking between two points */
            } else {
                wildAnimal.betweenPoints = true
            }
        }
    }, 72)

    // Similarly, grow the crops locally to avoid the need for the server to send messages when crops change growth state
    setInterval(async () => {
        monitor.crops.forEach((crop, cropId) => {
            if (crop.state !== 'FULL_GROWN' && crop.state !== 'HARVESTED') {
                crop.growth = crop.growth + 1

                if (crop.growth >= 10 && crop.growth < 20) {
                    crop.state = 'SMALL'
                } else if (crop.growth >= 20 && crop.growth < 30) {
                    crop.state = 'ALMOST_GROWN'
                } else {
                    crop.state = 'FULL_GROWN'
                }
            }
        })

        // In-game steps are 200 which requires 100ms sleep. Reduce to 10 steps which requires 2000ms sleep
    }, 2000)

    // Also grow the trees locally to minimize the need for messages from the backend
    setInterval(async () => {
        monitor.trees.forEach((tree, treeId) => {
            const visibleTree = monitor.visibleTrees.get(treeId)

            if (tree.size !== 'FULL_GROWN') {
                tree.growth = tree.growth + 1

                if (tree.growth >= 10 && tree.growth < 20) {
                    tree.size = 'SMALL'

                    if (visibleTree) {
                        visibleTree.size = 'SMALL'
                    }
                } else if (tree.growth >= 20 && tree.growth < 30) {
                    tree.size = 'MEDIUM'

                    if (visibleTree) {
                        visibleTree.size = 'MEDIUM'
                    }
                } else if (tree.growth >= 30) {
                    tree.size = 'FULL_GROWN'

                    if (visibleTree) {
                        visibleTree.size = 'FULL_GROWN'
                    }
                }
            }
        })

        // In-game steps are 200 which requires 100ms sleep. Reduce to 10 steps which requires 2000ms sleep
    }, 2000)

    console.info(websocket)
}

function populateVisibleTrees(): void {
    for (const [id, tree] of monitor.trees) {

        if (
            !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y - 1 }) ||
            !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y + 1 }) ||
            !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y - 1 }) ||
            !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y + 1 }) ||
            !monitor.discoveredPoints.has({ x: tree.x - 2, y: tree.y }) ||
            !monitor.discoveredPoints.has({ x: tree.x + 2, y: tree.y })
        ) {
            continue
        }

        monitor.visibleTrees.set(id, tree)
    }
}

function storeDiscoveredTiles(newlyDiscoveredPoints: PointSetFast | Point[]): void {
    for (const point of newlyDiscoveredPoints) {
        const terrainAtPoint = monitor.allTiles.get(point)

        if (terrainAtPoint === undefined) {
            continue
        }

        const pointLeft = getPointLeft(point)
        const pointUpRight = getPointUpRight(point)
        const pointDownLeft = getPointDownLeft(point)
        const pointDownRight = getPointDownRight(point)
        const pointRight = getPointRight(point)
        const pointUpLeft = getPointUpLeft(point)

        const isLeftDiscovered = monitor.discoveredPoints.has(pointLeft)
        const isDownLeftDiscovered = monitor.discoveredPoints.has(pointDownLeft)
        const isDownRightDiscovered = monitor.discoveredPoints.has(pointDownRight)
        const isRightDiscovered = monitor.discoveredPoints.has(pointRight)
        const isUpRightDiscovered = monitor.discoveredPoints.has(pointUpRight)
        const isUpLeftDiscovered = monitor.discoveredPoints.has(pointUpLeft)
        const isPointLeftDiscovered = monitor.discoveredPoints.has(pointLeft)

        const terrainAtPointLeft = monitor.allTiles.get(pointLeft)
        const terrainAtPointDownLeft = monitor.allTiles.get(pointDownLeft)
        const terrainAtPointDownRight = monitor.allTiles.get(pointDownRight)
        const terrainAtPointRight = monitor.allTiles.get(pointRight)
        const terrainAtPointUpRight = monitor.allTiles.get(pointUpRight)
        const terrainAtPointUpLeft = monitor.allTiles.get(pointUpLeft)

        /* Tile down left */
        if (terrainAtPointLeft && terrainAtPointDownLeft && isLeftDiscovered && isDownLeftDiscovered &&
            !monitor.pointsWithDownRightTileDiscovered.has(pointLeft)) {
            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPointLeft.downRight,
                    pointLeft: pointLeft,
                    heightLeft: terrainAtPointLeft.height,
                    heightRight: terrainAtPoint.height,
                    heightDown: terrainAtPointDownLeft.height
                }
            )

            monitor.pointsWithDownRightTileDiscovered.add(pointLeft)
        }

        /* Tile up right */
        if (terrainAtPointUpRight && terrainAtPointRight && isUpRightDiscovered && isRightDiscovered &&
            !monitor.pointsWithBelowTileDiscovered.has(pointUpRight)) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPointUpRight.below,
                    pointAbove: pointUpRight,
                    heightAbove: terrainAtPointUpRight.height,
                    heightDownLeft: terrainAtPoint.height,
                    heightDownRight: terrainAtPointRight.height
                }
            )

            monitor.pointsWithBelowTileDiscovered.add(pointUpRight)
        }

        /* Tile below */
        if (terrainAtPointDownLeft && terrainAtPointDownRight && isDownLeftDiscovered && isDownRightDiscovered &&
            !monitor.pointsWithBelowTileDiscovered.has(point)) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPoint.below,
                    pointAbove: point,
                    heightAbove: terrainAtPoint.height,
                    heightDownLeft: terrainAtPointDownLeft.height,
                    heightDownRight: terrainAtPointDownRight.height
                }
            )

            monitor.pointsWithBelowTileDiscovered.add(point)
        }

        /* Tile down right */
        if (terrainAtPointDownRight && terrainAtPointRight && isDownRightDiscovered && isRightDiscovered &&
            !monitor.pointsWithDownRightTileDiscovered.has(point)) {

            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPoint.downRight,
                    pointLeft: point,
                    heightLeft: terrainAtPoint.height,
                    heightDown: terrainAtPointDownRight.height,
                    heightRight: terrainAtPointRight.height
                }
            )

            monitor.pointsWithDownRightTileDiscovered.add(point)
        }

        /* Tile up left */
        if (isUpLeftDiscovered && isPointLeftDiscovered && terrainAtPointUpLeft && terrainAtPointLeft &&
            !monitor.pointsWithBelowTileDiscovered.has(pointUpLeft)) {
            monitor.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPointUpLeft.below,
                    pointAbove: pointUpLeft,
                    heightAbove: terrainAtPointUpLeft.height,
                    heightDownLeft: terrainAtPointLeft.height,
                    heightDownRight: terrainAtPoint.height
                }
            )

            monitor.pointsWithBelowTileDiscovered.add(pointUpLeft)
        }

        /* Tile above */
        if (isUpLeftDiscovered && isUpRightDiscovered && terrainAtPointUpLeft && terrainAtPointUpRight &&
            !monitor.pointsWithDownRightTileDiscovered.has(pointUpLeft)) {
            monitor.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPointUpLeft.downRight,
                    pointLeft: pointUpLeft,
                    heightLeft: terrainAtPointUpLeft.height,
                    heightRight: terrainAtPointUpRight.height,
                    heightDown: terrainAtPoint.height
                }
            )

            monitor.pointsWithDownRightTileDiscovered.add(pointUpLeft)
        }
    }
}

function syncChangedBorders(borderChanges: BorderChange[]): void {

    for (const borderChange of borderChanges) {
        const currentBorderForPlayer = monitor.border.get(borderChange.playerId)

        if (currentBorderForPlayer) {

            borderChange.newBorder.forEach(point => currentBorderForPlayer.points.add(point))
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

function syncNewOrUpdatedWildAnimals(wildAnimals: WildAnimalInformation[]): void {
    for (const wildAnimalInformation of wildAnimals) {

        let wildAnimal = monitor.wildAnimals.get(wildAnimalInformation.id)

        if (wildAnimal === undefined) {
            wildAnimal = {
                id: wildAnimalInformation.id,
                x: wildAnimalInformation.x,
                y: wildAnimalInformation.y,
                path: wildAnimalInformation.path,
                betweenPoints: false,
                percentageTraveled: 0,
                type: wildAnimalInformation.type
            }

            monitor.wildAnimals.set(wildAnimal.id, wildAnimal)
        }

        if (!wildAnimalInformation.path || wildAnimalInformation.path.length === 0) {
            wildAnimal.path = undefined
        } else {
            wildAnimal.path = wildAnimalInformation.path

            wildAnimal.previous = { x: wildAnimalInformation.x, y: wildAnimalInformation.y }

            wildAnimal.next = { x: wildAnimalInformation.path[0].x, y: wildAnimalInformation.path[0].y }
            wildAnimal.percentageTraveled = 0
            wildAnimal.betweenPoints = false
        }

        wildAnimal.x = wildAnimalInformation.x
        wildAnimal.y = wildAnimalInformation.y
    }
}

function syncWorkersWithNewTargets(targetChanges: WalkerTargetChange[]): void {

    for (const walkerTargetChange of targetChanges) {

        let worker = monitor.workers.get(walkerTargetChange.id)
        const direction = simpleDirectionToCompassDirection(walkerTargetChange.direction)

        if (worker === undefined) {
            worker = {
                id: walkerTargetChange.id,
                x: walkerTargetChange.x,
                y: walkerTargetChange.y,
                plannedPath: walkerTargetChange.path,
                betweenPoints: false,
                direction,
                percentageTraveled: 0,
                type: walkerTargetChange.type,
                bodyType: walkerTargetChange.bodyType
            }

            monitor.workers.set(worker.id, worker)
        }

        if (!walkerTargetChange.path || walkerTargetChange.path.length === 0) {
            worker.plannedPath = undefined
        } else {
            worker.plannedPath = walkerTargetChange.path

            worker.previous = { x: walkerTargetChange.x, y: walkerTargetChange.y }

            worker.next = { x: walkerTargetChange.path[0].x, y: walkerTargetChange.path[0].y }
            worker.percentageTraveled = 0
            worker.betweenPoints = false
        }

        worker.action = undefined

        worker.cargo = walkerTargetChange.cargo

        worker.x = walkerTargetChange.x
        worker.y = walkerTargetChange.y
        worker.direction = direction
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

function listenToDiscoveredPoints(listenerFn: ((discoveredPoints: PointSetFast) => void)): void {
    discoveredPointListeners.push(listenerFn)
}

function listenToRoads(listenerFn: (() => void)): void {
    roadListeners.push(listenerFn)
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

function getHeadquarterForPlayer(playerId: PlayerId): HouseInformation | undefined {
    let headquarter

    monitor.houses.forEach(
        (house, houseId) => {
            if (house.type === 'Headquarter' && house.playerId === playerId) {
                headquarter = house
            }
        }
    )

    return headquarter
}

function serverSentCropToLocal(serverCrop: CropInformation): CropInformationLocal {
    let growth = 0

    if (serverCrop.state === 'SMALL') {
        growth = 10
    } else if (serverCrop.state === 'ALMOST_GROWN') {
        growth = 20
    }

    return {
        id: serverCrop.id,
        state: serverCrop.state,
        x: serverCrop.x,
        y: serverCrop.y,
        growth
    }
}

function serverSentTreeToLocal(serverTree: TreeInformation): TreeInformationLocal {
    let growth = 0

    if (serverTree.size === 'SMALL') {
        growth = 10
    } else if (serverTree.size === 'MEDIUM') {
        growth = 20
    }

    return {
        id: serverTree.id,
        x: serverTree.x,
        y: serverTree.y,
        size: serverTree.size,
        type: serverTree.type,
        growth: growth
    }
}

function placeLocalRoad(points: Point[]): void {
    monitor.roads.set('LOCAL', { id: 'LOCAL', points })
}

function isAvailable(point: Point, whatToBuild: 'FLAG'): boolean {
    const availableAtPoint = monitor.availableConstruction.get(point)

    if (availableAtPoint === undefined) {
        return false
    }

    if (whatToBuild === 'FLAG' && availableAtPoint.indexOf('flag') !== -1) {
        return true
    }

    return false
}

function removeLocalFlag(flagId: FlagId): void {
    const flag = monitor.flags.get(flagId)

    if (flag !== undefined) {
        monitor.localRemovedFlags.set(flagId, flag)

        monitor.flags.delete(flagId)
    }
}

function undoRemoveLocalFlag(flagId: FlagId): void {
    const flagToRestore = monitor.localRemovedFlags.get(flagId)

    if (flagToRestore !== undefined) {
        monitor.flags.set(flagToRestore.id, flagToRestore)

        monitor.localRemovedFlags.delete(flagId)
    }
}

function removeLocalRoad(roadId: RoadId): void {
    const road = monitor.roads.get(roadId)

    if (road !== undefined) {
        monitor.localRemovedRoads.set(roadId, road)

        monitor.roads.delete(roadId)
    }
}

function undoRemoveLocalRoad(roadId: RoadId): void {
    const roadToRestore = monitor.localRemovedRoads.get(roadId)

    if (roadToRestore !== undefined) {
        monitor.roads.set(roadId, roadToRestore)

        monitor.localRemovedRoads.delete(roadId)
    }
}

function getLoadingPromise(): Promise<void> | undefined {
    return loadingPromise
}

function isGameDataAvailable(): boolean {
    return monitor.discoveredBelowTiles.size > 0
}

async function placeHouseSnappy(houseType: AnyBuilding, point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {
    monitor.houses.set('LOCAL',
        {
            id: 'LOCAL',
            type: houseType,
            x: point.x,
            y: point.y,
            playerId: playerId,
            inventory: new Map<string, number>(),
            evacuated: false,
            promotionsEnabled: true,
            state: 'PLANNED',
            productionEnabled: true,
            resources: {}
        }
    )

    try {
        await createBuilding(houseType, point, gameId, playerId)
    } catch (error) {
        console.error("Got error while creating building: " + error)
    }

    const pointInformation = await getInformationOnPoint(point, gameId, playerId)

    if (pointInformation.is !== 'building') {
        monitor.houses.delete('LOCAL')
    }
}

async function placeRoadSnappy(points: Point[], gameId: GameId, playerId: PlayerId): Promise<void> {
    monitor.roads.set('LOCAL', { id: 'LOCAL', points })

    try {
        await createRoad(points, gameId, playerId)
    } catch (error) {
        console.error("Got error while creating road: " + error)
    }

    const pointInformation = await getInformationOnPoint(points[1], gameId, playerId)

    if (pointInformation.is !== 'road') {
        monitor.roads.delete('LOCAL')
    }
}

async function placeFlagSnappy(point: Point, gameId: GameId, playerId: PlayerId): Promise<void> {
    monitor.flags.set('LOCAL', { id: 'LOCAL', playerId: playerId, x: point.x, y: point.y })

    try {
        await createFlag(point, gameId, playerId)
    } catch (error) {
        console.error("Got error while placing flag: " + error)
    }

    const pointInformation = await getInformationOnPoint(point, gameId, playerId)

    if (pointInformation.is !== 'flag') {
        monitor.flags.delete('LOCAL')
    }
}

async function placeRoadAndFlagSnappy(point: Point, points: Point[], gameId: GameId, playerId: PlayerId): Promise<void> {
    monitor.flags.set('LOCAL', { id: 'LOCAL', playerId: playerId, x: point.x, y: point.y })
    monitor.roads.set('LOCAL', { id: 'LOCAL', points })

    // TODO: add a function to the backend that can both place a flag and a road in one call and use it here
    try {
        await createFlag(point, gameId, playerId)
        await createRoad(points, gameId, playerId)
    } catch (error) {
        console.error("Got error while placing flag and road")
    }

    const flagPointInformation = await getInformationOnPoint(point, gameId, playerId)
    const roadPointInformation = await getInformationOnPoint(points[1], gameId, playerId)

    if (roadPointInformation.is !== 'road' && flagPointInformation.is === 'flag' && flagPointInformation.flagId !== undefined) {
        removeFlagWebsocket(flagPointInformation.flagId)
    }
}

async function removeFlagSnappy(flagId: FlagId, gameId: GameId, playerId: PlayerId): Promise<void> {
    const flag = monitor.flags.get(flagId)

    if (flag !== undefined) {
        monitor.localRemovedFlags.set(flagId, flag)

        monitor.flags.delete(flagId)

        try {
            removeFlagWebsocket(flagId)
        } catch (error) {
            console.error("Got error while removing flag: " + error)
        }

        const pointInformation = await getInformationOnPoint(flag, gameId, playerId)

        if (pointInformation.is === 'flag') {
            monitor.flags.delete('LOCAL')
        }
    }
}

async function removeRoadSnappy(roadId: RoadId, gameId: GameId, playerId: PlayerId): Promise<void> {
    const road = monitor.roads.get(roadId)

    if (road !== undefined) {
        monitor.localRemovedRoads.set(roadId, road)

        monitor.roads.delete(roadId)

        try {
            removeRoadWebsocket(roadId)
        } catch (error) {
            console.error("Got error while removing road: " + error)
        }

        const pointInformation = await getInformationOnPoint(road.points[1], gameId, playerId)

        if (pointInformation.is === 'road') {
            monitor.roads.set(roadId, road)
        }
    }
}

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

function serverWorkerToLocalWorker(serverWorker: ServerWorkerInformation): WorkerInformation {
    let compassDirection = simpleDirectionToCompassDirection(serverWorker.direction)

    const worker: WorkerInformation = { ...serverWorker, direction: compassDirection }

    return worker
}

function placeBuildingWebsocket(houseType: AnyBuilding, point: Point): void {
    websocket.send(JSON.stringify(
        {
            command: 'PLACE_BUILDING',
            x: point.x,
            y: point.y,
            type: houseType
        }
    ))
}

function placeRoadWebsocket(points: Point[]): void {
    websocket.send(JSON.stringify(
        {
            command: 'PLACE_ROAD',
            road: points
        })
    )
}

function placeFlagWebsocket(flagPoint: Point): void {
    websocket.send(JSON.stringify(
        {
            command: 'PLACE_FLAG',
            flag: {
                x: flagPoint.x,
                y: flagPoint.y
            },
        })
    )
}


function placeRoadWithFlagWebsocket(flagPoint: Point, points: Point[]): void {
    websocket.send(JSON.stringify(
        {
            command: 'PLACE_FLAG_AND_ROAD',
            flag: {
                x: flagPoint.x,
                y: flagPoint.y
            },
            road: points
        })
    )
}

function removeFlagWebsocket(flagId: FlagId): void {
    websocket.send(JSON.stringify(
        {
            command: 'REMOVE_FLAG',
            id: flagId
        })
    )
}

function removeRoadWebsocket(roadId: RoadId): void {
    websocket.send(JSON.stringify(
        {
            command: 'REMOVE_ROAD',
            id: roadId
        })
    )
}

function removeBuildingWebsocket(houseId: HouseId): void {
    websocket.send(JSON.stringify(
        {
            command: 'REMOVE_BUILDING',
            id: houseId
        })
    )
}

export {
    listenToDiscoveredPoints,
    getHeadquarterForPlayer,
    forceUpdateOfHouse,
    listenToHouse,
    listenToMessages,
    listenToRoads,
    startMonitoringGame,
    placeBuildingWebsocket,
    placeFlagWebsocket,
    monitor
}
