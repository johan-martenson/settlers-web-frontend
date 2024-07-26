import { delay, getDirectionForWalkingWorker, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, pointStringToPoint, terrainInformationToTerrainAtPointList } from '../utils'
import { PointMapFast, PointSetFast } from '../util_types'
import { WorkerType, GameMessage, HouseId, HouseInformation, Point, VegetationIntegers, GameId, PlayerId, WorkerId, WorkerInformation, ShipId, ShipInformation, FlagId, FlagInformation, RoadId, RoadInformation, TreeId, TreeInformationLocal, CropId, CropInformationLocal, SignId, SignInformation, PlayerInformation, AvailableConstruction, TerrainAtPoint, WildAnimalId, WildAnimalInformation, Decoration, SimpleDirection, Material, BodyType, WorkerAction, DecorationType, TreeInformation, CropInformation, ServerWorkerInformation, StoneInformation, GameMessageId, StoneId, GameState, GameSpeed, FallingTreeInformation, Action, PlayerColor, Nation, GameInformation, MapInformation, ResourceLevel, RoomId, ChatMessage, TransportCategory } from './types'
import { getInformationOnPoint, updatePlayer, getMaps, startGame, getGameInformation, createGame, getGames, removeMessage, removeMessages, getInformationOnPoints, getFlagDebugInfo, setReservedSoldiers, setStrengthWhenPopulatingMilitaryBuildings, setDefenseStrength, setDefenseFromSurroundingBuildings, setMilitaryPopulationFarFromBorder, setMilitaryPopulationCloserToBorder, setMilitaryPopulationCloseToBorder, setSoldiersAvailableForAttack, createPlayer, addPlayerToGame, removePlayer, upgrade, setGameSpeed, setTitle, setOthersCanJoin, setMap, getStrengthWhenPopulatingMilitaryBuildings, getDefenseStrength, getDefenseFromSurroundingBuildings, getPopulateMilitaryFarFromBorder, getPopulateMilitaryCloserToBorder, getPopulateMilitaryCloseToBorder, getSoldiersAvailableForAttack, getMilitarySettings, addDetailedMonitoring, removeDetailedMonitoring, setCoalQuotas, setFoodQuotas, setWheatQuotas, setWaterQuotas, setIronBarQuotas, getFoodQuotas, getWheatQuotas, getWaterQuotas, getIronBarQuotas, getCoalQuotas, pauseGame, resumeGame, sendChatMessageToRoom, listenToGameViewForPlayer, setGame, setPlayerId, getChatRoomHistory, PlayerViewInformation, getViewForPlayer, listenToGameMetadata, listenToGamesList, listenToChatMessages, attackHouse, evacuateHouse, upgradeHouse, findPossibleNewRoad, deleteGame, disablePromotionsForHouse, resumeProductionForHouse, pauseProductionForHouse, enablePromotionsForHouse, cancelEvacuationForHouse, setTransportPriorityForMaterial, getTerrainForMap, getProductionStatistics, getLandStatistics, placeRoad, placeFlag, placeRoadWithFlag, removeBuilding, removeFlag, removeRoad, callScout, callGeologist, placeHouse, setInitialResources, getTransportPriority } from './ws/commands'
import { simpleDirectionToCompassDirection } from './utils'
import { addConnectionStatusListener, ConnectionStatus, MAX_WAIT_FOR_CONNECTION, connectAndWaitForConnection, killWebsocket, waitForConnection, addMessageListener } from './ws/core'

// Using the monitor

// Types

// Type functions

// Constants

// Configuration

// State

// Functions exposed as part of WS API
function isAvailable(point: Point, whatToBuild: 'FLAG'): boolean {
    return whatToBuild === 'FLAG' && api.availableConstruction.get(point)?.indexOf('flag') !== -1
}

function getHeight(point: Point): number {
    return api.allTiles.get(point)?.height ?? 0
}

function houseAt(point: Point): HouseInformation | undefined {
    return api.housesAt.get(point)
}

function getInformationOnPointLocal(point: Point): PointInformationLocal {
    const canBuild = api.availableConstruction.get(point)

    const house = Array.from(api.houses.values())
        .find(house => house.x === point.x && house.y === point.y)

    if (house) {
        return {
            ...point,
            canBuild: canBuild ?? [],
            buildingId: house.id,
            is: 'building'
        }
    }

    const flag = Array.from(api.flags.values())
        .find(flag => flag.x === point.x && flag.y === point.y)

    if (flag) {
        return {
            x: point.x,
            y: point.y,
            canBuild: canBuild ?? [],
            flagId: flag.id,
            is: 'flag'
        }
    }

    const road = Array.from(api.roads.values())
        .find(road => road.points
            .find(roadPoint => roadPoint.x === point.x && roadPoint.y === point.y))

    if (road) {
        return {
            x: point.x,
            y: point.y,
            canBuild: canBuild ?? [],
            roadId: road.id,
            is: 'road'
        }
    }

    return {
        x: point.x,
        y: point.y,
        canBuild: canBuild ?? [],
        is: undefined
    }
}

function getFlagAtPointLocal(point: Point): FlagInformation | undefined {
    return Array.from(api.flags.values()).find(flag => flag.x === point.x && flag.y === point.y)
}

function getHouseAtPointLocal(point: Point): HouseInformation | undefined {
    return Array.from(api.houses.values()).find(house => house.x === point.x && house.y === point.y)
}

// Functions used within WS



// Monitoring

// Constants

// Types
type WalkingTimerState = 'RUNNING' | 'NOT_RUNNING'
type GamesListeningState = 'NOT_LISTENING' | 'LISTENING'
type RequestedFollowingState = 'NO_FOLLLOW' | 'FOLLOW'
type FollowingState = 'NOT_FOLLOWING' | 'STARTING_TO_FOLLOW' | 'FOLLOWING'

type MonitoredBorderForPlayer = {
    color: PlayerColor
    nation: Nation
    points: PointSetFast
}

type WalkerTargetChange = {
    id: string
    x: number
    y: number
    path: Point[]
    direction: SimpleDirection
    cargo?: Material
    type: WorkerType
    bodyType?: BodyType
    color: PlayerColor
    nation: Nation
}

type BorderChange = {
    playerId: PlayerId
    newBorder: Point[]
    removedBorder: Point[]
}

type ChangedAvailableConstruction = Point & { available: AvailableConstruction[] }

type WorkerNewAction = {
    id: WorkerId
    x: number
    y: number
    startedAction: WorkerAction
}

type PointAndDecoration = {
    x: number
    y: number
    decoration: DecorationType
}

type PlayerViewChangedMessage = {
    type: 'PLAYER_VIEW_CHANGED'
    playerViewChanges: PlayerViewChanges
}

type PlayerViewChanges = {
    tick: number
    gameSpeed?: GameSpeed
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
    changedRoads?: RoadInformation[]
    removedRoads?: RoadId[]
    changedBorders?: BorderChange[]
    newTrees?: TreeInformation[]
    removedTrees?: TreeId[]
    newStones?: StoneInformation[]
    changedStones?: StoneInformation[]
    removedStones?: StoneId[]
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
    removedMessages?: GameMessageId[]
    transportPriority?: TransportCategory[]
}

type GameInformationChangedMessage = { gameInformation: GameInformation }

type NewChatMessage = { chatMessage: ChatMessage }

type GameListChangedMessage = { games: GameInformation[] }

export type MoveUpdate = {
    id: WorkerId
} & (
        {
            state: 'ON_POINT'
            point: Point
        } |
        {
            state: 'BETWEEN_POINTS'
            previous: Point
            next: Point
            progress: number
        }
    )


export type TileBelow = {
    pointAbove: Point
    heightDownLeft: number
    heightDownRight: number
    heightAbove: number
    vegetation: VegetationIntegers
}

export type TileDownRight = {
    pointLeft: Point
    heightLeft: number
    heightDown: number
    heightRight: number
    vegetation: VegetationIntegers
}

let workerWalkingTimer: undefined | NodeJS.Timeout
let workerAnimationsTimer: undefined | NodeJS.Timeout
let cropGrowerTimer: undefined | NodeJS.Timeout
let treeGrowerTimer: undefined | NodeJS.Timeout

// Listener types
export type GameListListener = (gameInformations: GameInformation[]) => void
export type MessagesListener = (messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void
export type HouseListener = ((house: HouseInformation) => void)
export type DiscoveredPointListener = (discoveredPoints: PointSetFast) => void
export type RoadListener = () => void
export type ChatListener = () => void

export type ActionListener = {
    actionStarted: (id: string, point: Point, action: Action) => void
    actionEnded: (id: string, point: Point, action: Action) => void
}

export type HouseBurningListener = {
    houseStartedToBurn: (id: string, point: Point) => void
    houseStoppedBurning: (id: string, point: Point) => void
}

export type FlagListener = {
    onUpdate: (flag: FlagInformation) => void
    onRemove: () => void
}

export type TransportPriorityListener = (priority: TransportCategory[]) => void

export type GameListener = {
    onMonitoringStarted?: () => void
    onGameStateChanged?: (gameState: GameState) => void
    onGameSpeedChanged?: (gameSpeed: GameSpeed) => void
    onGameInformationChanged?: (gameInformation: GameInformation) => void
}

export type AvailableConstructionListener = {
    onAvailableConstructionChanged: (availableConstruction: AvailableConstruction[]) => void
}

export type WorkerMoveListener = {
    id: WorkerId

    onWorkerMoved: (move: MoveUpdate) => void
}

export type PointInformationLocal = {
    x: number
    y: number
    canBuild: AvailableConstruction[]
} & ({
    is?: undefined
} | {
    is: 'building'
    buildingId: HouseId
} | {
    is: 'flag'
    flagId: FlagId
} | {
    is: 'road'
    roadId: RoadId
})


// Type functions
function isGameInformationChangedMessage(message: unknown): message is GameInformationChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_INFO_CHANGED'
}

function isGameListChangedMessage(message: unknown): message is GameListChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_LIST_CHANGED'
}

function isChatMessage(message: unknown): message is NewChatMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'NEW_CHAT_MESSAGES'
}

function isGameChangesMessage(message: unknown): message is PlayerViewChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'PLAYER_VIEW_CHANGED'
}

// Configuration

// State
let gameTickLength = 200;

let gamesListeningStatus: GamesListeningState = 'NOT_LISTENING'
let walkingTimerState: WalkingTimerState = 'NOT_RUNNING'
let requestedFollowingState: RequestedFollowingState = 'NO_FOLLLOW'
let followingState: FollowingState = 'NOT_FOLLOWING'

const api = {
    gameId: undefined as GameId | undefined,
    playerId: undefined as PlayerId | undefined,
    othersCanJoin: undefined as boolean | undefined,
    initialResources: undefined as ResourceLevel | undefined,
    map: undefined as MapInformation | undefined,
    workers: new Map<WorkerId, WorkerInformation>(),
    ships: new Map<ShipId, ShipInformation>(),
    houses: new Map<HouseId, HouseInformation>(),
    flags: new Map<FlagId, FlagInformation>(),
    roads: new Map<RoadId, RoadInformation>(),
    border: new Map<PlayerId, MonitoredBorderForPlayer>(),
    trees: new Map<TreeId, TreeInformationLocal>(),
    fallingTrees: new Map<TreeId, FallingTreeInformation>(),
    stones: new Map<StoneId, StoneInformation>(),
    crops: new Map<CropId, CropInformationLocal>(),
    discoveredPoints: new PointSetFast(),
    signs: new Map<SignId, SignInformation>(),
    players: new Map<PlayerId, PlayerInformation>(),
    availableConstruction: new PointMapFast<AvailableConstruction[]>(),
    messages: new Map<GameMessageId, GameMessage>(),
    allTiles: new PointMapFast<TerrainAtPoint>(),
    discoveredBelowTiles: new Set<TileBelow>(),
    discoveredDownRightTiles: new Set<TileDownRight>(),
    pointsWithBelowTileDiscovered: new PointSetFast(),
    pointsWithDownRightTileDiscovered: new PointSetFast(),
    deadTrees: new PointSetFast(),
    wildAnimals: new Map<WildAnimalId, WildAnimalInformation>(),
    decorations: new PointMapFast<Decoration>(),
    gameState: 'NOT_STARTED' as GameState,
    gameSpeed: 'NORMAL' as GameSpeed,
    gameName: '',
    chatRoomMessages: [] as ChatMessage[],
    transportPriority: undefined as TransportCategory[] | undefined,

    housesAt: new PointMapFast<HouseInformation>(),

    localRemovedFlags: new Map<FlagId, FlagInformation>(),
    localRemovedRoads: new Map<RoadId, RoadInformation>(),

    // Connection
    connectAndWaitForConnection,
    waitForConnection,
    killWebsocket,

    // Games
    getGames,
    addGamesListener,
    removeGamesListener,
    removeGameStateListener,

    // Maps
    getMaps,

    // Map
    getTerrainForMap,

    // Game
    createGame,
    startGame,
    pauseGame,
    resumeGame,
    deleteGame,
    waitForGameDataAvailable,
    getGameInformation,
    addGameStateListener,
    isGameDataAvailable,
    addPlayerToGame,
    setGameSpeed,
    setTitle,
    setInitialResources,
    setOthersCanJoin,
    setMap,
    getProductionStatistics,
    getLandStatistics,
    followGame,

    // Player
    createPlayer,
    updatePlayer,
    removePlayer,
    addActionsListener,
    addDiscoveredPointsListener,
    removeDiscoveredPointsListener,
    addMessagesListener,
    removeMessagesListener,
    removeMessage,
    removeMessages,
    getTransportPriority,
    setTransportPriorityForMaterial,
    addTransportPriorityListener,
    removeTransportPriorityListener,

    // Player - military
    setReservedSoldiers,
    setStrengthWhenPopulatingMilitaryBuildings,
    setDefenseStrength,
    setDefenseFromSurroundingBuildings,
    setMilitaryPopulationFarFromBorder,
    setMilitaryPopulationCloserToBorder,
    setMilitaryPopulationCloseToBorder,
    setSoldiersAvailableForAttack,

    getStrengthWhenPopulatingMilitaryBuildings,
    getDefenseStrength,
    getDefenseFromSurroundingBuildings,
    getPopulateMilitaryFarFromBorder,
    getPopulateMilitaryCloserToBorder,
    getPopulateMilitaryCloseToBorder,
    getSoldiersAvailableForAttack,
    getMilitarySettings,

    // Player - quotas
    setCoalQuotas,
    setFoodQuotas,
    setWheatQuotas,
    setWaterQuotas,
    setIronBarQuotas,

    getFoodQuotas,
    getWheatQuotas,
    getWaterQuotas,
    getIronBarQuotas,
    getCoalQuotas,

    // Houses
    addBurningHousesListener,

    // House
    placeHouse,
    removeBuilding,
    getHouseAtPointLocal,
    upgrade,
    houseAt,
    attackHouse,
    evacuateHouse,
    upgradeHouse,
    pauseProductionForHouse,
    resumeProductionForHouse,
    disablePromotionsForHouse,
    enablePromotionsForHouse,
    cancelEvacuationForHouse,
    addHouseListener,
    removeHouseListener,

    // Flag
    placeFlag,
    removeFlag,
    getFlagAtPointLocal,
    getFlagDebugInfo,
    callScout,
    callGeologist,
    addFlagListener,
    removeFlagListener,

    // Road
    placeRoad,
    placeRoadWithFlag,
    placeLocalRoad,
    removeRoad,
    removeLocalRoad,
    addRoadsListener,
    removeRoadsListener,

    // Point
    getInformationOnPointLocal,
    getInformationOnPoint,
    getInformationOnPoints,
    getHeight,

    // Chat messages
    sendChatMessageToRoom,
    addChatMessagesListener,
    removeChatMessagesListener,

    // Construction
    findPossibleNewRoad,
    isAvailable,
    addAvailableConstructionListener,
    removeAvailableConstructionListener,

    // Workers
    addMovementForWorkerListener,
    removeMovementForWorkerListener,
}

// State - listeners
const messageListeners: Set<MessagesListener> = new Set<MessagesListener>()
const houseListeners: Map<HouseId, Set<HouseListener>> = new Map<HouseId, Set<HouseListener>>()
const discoveredPointListeners: Set<DiscoveredPointListener> = new Set<DiscoveredPointListener>()
const roadListeners: Set<RoadListener> = new Set<RoadListener>()
const availableConstructionListeners = new PointMapFast<Set<AvailableConstructionListener>>()
const actionListeners: Set<ActionListener> = new Set<ActionListener>()
const houseBurningListeners: Set<HouseBurningListener> = new Set<HouseBurningListener>()
const gameListeners: Set<GameListener> = new Set<GameListener>()
const gamesListeners: Set<GameListListener> = new Set<GameListListener>()
const workerMovedListeners: Set<WorkerMoveListener> = new Set<WorkerMoveListener>()
const chatListeners: Set<ChatListener> = new Set<ChatListener>()
const flagListeners: Map<FlagId, Set<FlagListener>> = new Map<FlagId, Set<FlagListener>>()
const transportPriorityListeners: Set<TransportPriorityListener> = new Set

// State - misc
const objectsWithDetailedMonitoring = new Set<HouseId | FlagId>()

// Initialization
function onConnectionStatusChanged(connectionStatus: ConnectionStatus): void {
    if (connectionStatus === 'CONNECTED' && followingState === 'FOLLOWING') {
        (async () => {
            try {
                const gameInformation = await getGameInformation()
                clearAndLoadGameInformationAndCallListeners(gameInformation)

                if (gameInformation.status !== 'NOT_STARTED') {
                    clearAndLoadPlayerViewAndCallListeners(await getViewForPlayer())
                }
            } catch (error) {
                console.error(`Failed to sync the game with the backend: ${error}`)

                api.gameState = 'EXPIRED'

                gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged('EXPIRED'))
            }
        })().then()
    }
}

// eslint-disable-next-line
function onMessageReceived(message: any): void {
    console.log(`WS API: Got message: ${JSON.stringify(message)}`)

    try {
        if (isGameChangesMessage(message)) {
            console.log('Handling player view changed message')

            loadPlayerViewChangesAndCallListeners(message.playerViewChanges)
        } else if (isGameInformationChangedMessage(message)) {
            console.log('Handling game information changed message')

            handleGameInformationChangedMessage(message.gameInformation)
        } else if (isGameListChangedMessage(message)) {
            console.log('Handling game list changed messgae')

            receivedGameListChangedMessage(message)
        } else if (isChatMessage(message)) {
            console.log('Handling chat message')

            loadChatMessage(message.chatMessage)
        } else {
            console.error('Do not know how to handle this')
        }
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e))
        console.info(message.data)
    }
}


addConnectionStatusListener(onConnectionStatusChanged)
addMessageListener(onMessageReceived)

// Functions exposed as part of WS API
// Functions to add/remove listeners
function addMessagesListener(listener: MessagesListener): void {
    messageListeners.add(listener)
}

function removeMessagesListener(listener: MessagesListener): void {
    messageListeners.delete(listener)
}

function removeRoadsListener(listener: RoadListener): void {
    roadListeners.delete(listener)
}

function removeGameStateListener(listener: GameListener): void {
    gameListeners.delete(listener)
}

function removeMovementForWorkerListener(listener: WorkerMoveListener): void {
    workerMovedListeners.delete(listener)
}

function addChatMessagesListener(listener: ChatListener, playerId: PlayerId, roomIds: RoomId[]): void {
    listenToChatMessages(playerId, roomIds)

    chatListeners.add(listener)
}

function removeChatMessagesListener(listener: ChatListener): void {
    chatListeners.delete(listener)
}

function addMovementForWorkerListener(listener: WorkerMoveListener): void {
    workerMovedListeners.add(listener)
}

function addTransportPriorityListener(listener: TransportPriorityListener): void {
    transportPriorityListeners.add(listener)
}

function removeTransportPriorityListener(listener: TransportPriorityListener): void {
    transportPriorityListeners.delete(listener)
}

function addHouseListener(houseId: HouseId, houseListener: HouseListener): void {

    // Add the listener
    let listenersForHouseId = houseListeners.get(houseId)

    if (!listenersForHouseId) {
        listenersForHouseId = new Set()

        houseListeners.set(houseId, listenersForHouseId)
    }

    listenersForHouseId.add(houseListener)

    // Add detailed monitoring for the house
    if (!objectsWithDetailedMonitoring.has(houseId)) {
        addDetailedMonitoring(houseId)

        objectsWithDetailedMonitoring.add(houseId)
    }
}

function removeHouseListener(houseId: HouseId, houseListener: HouseListener): void {
    const listenersForHouse = houseListeners.get(houseId)

    if (listenersForHouse) {
        houseListeners.get(houseId)?.delete(houseListener)

        if (listenersForHouse.size === 0) {
            removeDetailedMonitoring(houseId)

            objectsWithDetailedMonitoring.delete(houseId)
        }
    }
}

function addDiscoveredPointsListener(listener: DiscoveredPointListener): void {
    discoveredPointListeners.add(listener)
}

function removeDiscoveredPointsListener(listener: DiscoveredPointListener): void {
    discoveredPointListeners.delete(listener)
}

function addRoadsListener(listener: RoadListener): void {
    roadListeners.add(listener)
}

function addFlagListener(flagId: FlagId, listener: FlagListener): void {

    // Add the listener
    if (!flagListeners.has(flagId)) {
        flagListeners.set(flagId, new Set())
    }

    flagListeners.get(flagId)?.add(listener)

    // Add detailed monitoring
    if (!objectsWithDetailedMonitoring.has(flagId)) {
        addDetailedMonitoring(flagId)

        objectsWithDetailedMonitoring.add(flagId)
    }
}

function removeGamesListener(listener: GameListListener): void {
    gamesListeners.delete(listener)
}

function removeFlagListener(flagId: FlagId, listener: FlagListener): void {
    const listeners = flagListeners.get(flagId)

    if (listeners) {

        // Remove the listener
        flagListeners.get(flagId)?.delete(listener)

        if (listeners.size === 0) {
            removeDetailedMonitoring(flagId)

            objectsWithDetailedMonitoring.delete(flagId)
        }
    }
}

function addAvailableConstructionListener(point: Point, listener: AvailableConstructionListener): void {
    if (availableConstructionListeners.has(point)) {
        availableConstructionListeners.set(point, new Set())
    }

    availableConstructionListeners.get(point)?.add(listener)
}

function removeAvailableConstructionListener(point: Point, listener: AvailableConstructionListener) {
    availableConstructionListeners.get(point)?.delete(listener)
}

function addActionsListener(listener: ActionListener) {
    actionListeners.add(listener)
}

function addGamesListener(listener: GameListListener): void {
    if (gamesListeningStatus === 'NOT_LISTENING') {
        listenToGamesList()

        gamesListeningStatus = 'LISTENING'
    }

    gamesListeners.add(listener)
}

function addGameStateListener(listener: GameListener) {
    gameListeners.add(listener)
}

function addBurningHousesListener(listener: HouseBurningListener) {
    houseBurningListeners.add(listener)
}

// Functions used within WS API

// Functions used within monitoring
function handleGameInformationChangedMessage(gameInformation: GameInformation): void {
    if (api.gameState === 'NOT_STARTED' && gameInformation.status !== 'NOT_STARTED') {
        (async () => {
            loadPlayerViewAndCallListeners(await getViewForPlayer())

            gameListeners.forEach(listener => listener.onMonitoringStarted && listener.onMonitoringStarted())
        }
        )().then()
    }

    loadGameInformationAndCallListeners(gameInformation)
}

function loadPlayerViewAndCallListeners(message: PlayerViewInformation): void {
    const previousGameState = api.gameState

    message.players.forEach(player => api.players.set(player.id, player))

    api.gameState = message.gameState
    api.othersCanJoin = message.othersCanJoin
    api.initialResources = message.initialResources
    api.map = message.map

    if (api.gameState === 'NOT_STARTED') {
        return
    }

    gameStateMightHaveChanged(api.gameState)

    Object.entries(message.availableConstruction).forEach(
        ([pointAsString, availableConstruction]) => api.availableConstruction.set(pointStringToPoint(pointAsString), availableConstruction))

    message.signs.forEach(sign => api.signs.set(sign.id, sign))

    message.stones.forEach(stone => api.stones.set(stone.id, stone))

    message.discoveredPoints.forEach(point => api.discoveredPoints.add(point))

    message.workers.forEach(worker => api.workers.set(worker.id, serverWorkerToLocalWorker(worker)))

    message.wildAnimals.forEach(wildAnimal => api.wildAnimals.set(wildAnimal.id, wildAnimal))

    message.houses.forEach(house => {
        api.houses.set(house.id, house)
        api.housesAt.set(house, house)
    })

    message.flags.forEach(flag => api.flags.set(flag.id, flag))

    message.roads.forEach(road => api.roads.set(road.id, road))

    message.trees.forEach(tree => api.trees.set(tree.id, serverSentTreeToLocal(tree)))

    message.crops.forEach(crop => api.crops.set(crop.id, serverSentCropToLocal(crop)))

    message.deadTrees.forEach(deadTree => api.deadTrees.add(deadTree))

    message.decorations.forEach(decoration => api.decorations.set({ x: decoration.x, y: decoration.y }, decoration))

    const changedTransportPriority = ('transportPriority' in message)

    if (message.transportPriority) {
        api.transportPriority = message.transportPriority
    }

    for (const borderInformation of message.borders) {
        const player = api.players.get(borderInformation.playerId)

        if (!player) {
            console.error("UNKNOWN PLAYER: " + borderInformation.playerId)

            continue
        }

        api.border.set(borderInformation.playerId,
            {
                color: player.color,
                nation: player.nation,
                points: new PointSetFast(borderInformation.points)
            }
        )
    }

    // Convert the terrain to a point-list format and store it
    const terrainPointList = terrainInformationToTerrainAtPointList(message)

    terrainPointList.forEach(terrainAtPoint => api.allTiles.set(terrainAtPoint.point, terrainAtPoint))

    storeDiscoveredTiles(api.discoveredPoints)

    // Call the listeners after all the data has been set
    discoveredPointListeners.forEach(listener => listener(api.discoveredPoints))
    roadListeners.forEach(roadListener => roadListener())

    message?.messages.forEach(message => api.messages.set(message.id, message))

    if (message.messages) {
        messageListeners.forEach(messageListener => messageListener(message.messages, []))
    }

    if (previousGameState !== api.gameState) {
        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged(api.gameState))
    }

    if (changedTransportPriority && api.transportPriority) {
        for (const listener of transportPriorityListeners) {
            listener(api.transportPriority)
        }
    }
}

function startTimers() {

    // Drive worker animations
    workerAnimationsTimer = setInterval(async () => {
        for (const worker of api.workers.values()) {
            if (worker.action && worker.actionAnimationIndex !== undefined) {
                worker.actionAnimationIndex = worker.actionAnimationIndex + 1
            }
        }

        const treesToRemove: TreeId[] = []

        api.fallingTrees.forEach(fallingTree => {
            fallingTree.animation += 1

            if (fallingTree.animation === 4) {
                treesToRemove.push(fallingTree.id)

                actionListeners.forEach(actionListener => actionListener.actionEnded(fallingTree.id, fallingTree, 'FALLING_TREE'))
            }

            treesToRemove.forEach(id => api.fallingTrees.delete(id))
        })
    }, gameTickLength)

    // Move workers locally to reduce the amount of messages from the server
    workerWalkingTimer = setInterval(async () => {
        for (const worker of api.workers.values()) {

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

            workerMovedListeners.forEach(listener => {
                if (worker.id === listener.id) {
                    let move: MoveUpdate

                    if (worker.betweenPoints && worker.previous && worker.next) {
                        move = {
                            id: worker.id,
                            state: 'BETWEEN_POINTS',
                            previous: worker.previous,
                            next: worker.next,
                            progress: worker.percentageTraveled
                        }
                    } else {
                        move = {
                            id: worker.id,
                            state: 'ON_POINT',
                            point: { x: worker.x, y: worker.y }
                        }
                    }

                    listener.onWorkerMoved(move)
                }
            })
        }

        for (const wildAnimal of api.wildAnimals.values()) {

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

    }, gameTickLength / 2)

    // Grow the crops locally to avoid the need for the server to send messages when crops change growth state
    cropGrowerTimer = setInterval(() => {
        api.crops.forEach(crop => {
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
    }, gameTickLength * 10)

    // Grow the trees locally to minimize the need for messages from the backend
    treeGrowerTimer = setInterval(() => {
        api.trees.forEach(tree => {
            if (tree.size !== 'FULL_GROWN') {
                tree.growth = tree.growth + 1

                if (tree.growth >= 10 && tree.growth < 20) {
                    tree.size = 'SMALL'
                } else if (tree.growth >= 20 && tree.growth < 30) {
                    tree.size = 'MEDIUM'
                } else if (tree.growth >= 30) {
                    tree.size = 'FULL_GROWN'
                }
            }
        })
    }, gameTickLength * 10)
}

function loadChatMessage(chatMessage: ChatMessage): void {
    api.chatRoomMessages.push(chatMessage)

    chatListeners.forEach(listener => listener())
}

function receivedGameListChangedMessage(message: GameListChangedMessage): void {
    gamesListeners.forEach(listener => listener(message.games))
}

function clearAndLoadGameInformationAndCallListeners(gameInformation: GameInformation): void {

    // Clear
    api.gameId = undefined
    api.othersCanJoin = undefined
    api.initialResources = undefined
    api.map = undefined

    // Load and call listeners
    loadGameInformationAndCallListeners(gameInformation)
}

async function loadGameInformationAndCallListeners(gameInformation: GameInformation): Promise<void> {
    const prevState = api.gameState

    // Store the updated values
    assignGameInformation(gameInformation)

    // Call game state change listener
    if (prevState !== gameInformation.status) {
        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged(gameInformation.status))
    }

    // Call other listeners
    gameListeners.forEach(listener => listener.onGameInformationChanged && listener.onGameInformationChanged(gameInformation))
}

function stopTimers() {
    const timers = [workerAnimationsTimer, workerWalkingTimer, cropGrowerTimer, treeGrowerTimer]

    timers.forEach(timer => {
        if (timer) {
            clearInterval(timer)
        }
    })
}

function clearAndLoadPlayerViewAndCallListeners(playerView: PlayerViewInformation): void {
    console.log("Handling full sync message")

    // Clear the local state
    api.availableConstruction.clear()
    api.signs.clear()
    api.stones.clear()
    api.discoveredPoints.clear()
    api.workers.clear()
    api.wildAnimals.clear()
    api.houses.clear()
    api.flags.clear()
    api.roads.clear()
    api.trees.clear()
    api.crops.clear()
    api.deadTrees.clear()
    api.decorations.clear()
    api.housesAt.clear()

    // Read the full state from the backend
    loadPlayerViewAndCallListeners(playerView)
}

function gameStateMightHaveChanged(gameState: GameState): void {
    if (gameState === 'STARTED' && walkingTimerState !== 'RUNNING') {
        startTimers()

        walkingTimerState = 'RUNNING'
    } else if (gameState === 'PAUSED' && walkingTimerState === 'RUNNING') {
        stopTimers()

        walkingTimerState = 'NOT_RUNNING'
    }
}

function loadPlayerViewChangesAndCallListeners(playerViewChanges: PlayerViewChanges): void {
    // Start by handling locally cached changes

    // Clear local additions
    api.roads.delete('LOCAL')
    api.flags.delete('LOCAL')
    api.houses.delete('LOCAL')

    // Update game tick
    if (playerViewChanges.tick !== undefined) {
        stopTimers()

        gameTickLength = playerViewChanges.tick

        startTimers()
    }

    // Update game speed
    if (playerViewChanges.gameSpeed) {
        api.gameSpeed = playerViewChanges.gameSpeed

        gameListeners.forEach(listener => listener.onGameSpeedChanged && listener.onGameSpeedChanged(api.gameSpeed))
    }

    // Confirm local removals if they are part of the message
    playerViewChanges.removedFlags?.forEach(removedFlagId => api.localRemovedFlags.delete(removedFlagId))

    // Digest all changes from the message
    playerViewChanges.newDiscoveredLand?.forEach(point => api.discoveredPoints.add(point))

    if (playerViewChanges.newDiscoveredLand) {
        console.log("Got new discovered points")

        storeDiscoveredTiles(playerViewChanges.newDiscoveredLand)
    }

    if (playerViewChanges.workersWithNewTargets) {
        playerViewChanges.workersWithNewTargets.forEach(worker => {
            const monitoredWorker = api.workers.get(worker.id)

            if (monitoredWorker && monitoredWorker.action) {
                actionListeners.forEach(listener => {
                    if (monitoredWorker.action) {
                        monitoredWorker.action && listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, monitoredWorker.action)
                    }
                })
            }
        })

        syncWorkersWithNewTargets(playerViewChanges.workersWithNewTargets)
    }

    if (playerViewChanges.workersWithStartedActions) {
        if (playerViewChanges.workersWithStartedActions.find(w => w.startedAction === 'HIT' || w.startedAction === 'GET_HIT' || w.startedAction === 'STAND_ASIDE' || w.startedAction === 'JUMP_BACK' || w.startedAction === 'DIE')) {
            console.log(playerViewChanges.workersWithStartedActions)
        }

        playerViewChanges.workersWithStartedActions.forEach(workerWithNewAction => {
            const worker = api.workers.get(workerWithNewAction.id)

            if (worker) {
                actionListeners.forEach(listener => {
                    if (worker.action) {
                        listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, worker.action)
                    }
                })

                worker.x = workerWithNewAction.x
                worker.y = workerWithNewAction.y
                worker.plannedPath = undefined
                worker.next = undefined
                worker.action = workerWithNewAction.startedAction
                worker.actionAnimationIndex = 0
            }

            playerViewChanges.workersWithStartedActions?.forEach(worker => {
                actionListeners.forEach(listener => listener.actionStarted(worker.id, { x: worker.x, y: worker.y }, worker.startedAction ?? ""))
            })
        })
    }

    if (playerViewChanges.wildAnimalsWithNewTargets) {
        syncNewOrUpdatedWildAnimals(playerViewChanges.wildAnimalsWithNewTargets)
    }

    playerViewChanges.removedWorkers?.forEach(id => {
        const worker = api.workers.get(id)

        if (worker?.action) {
            actionListeners.forEach(listener => {
                if (worker.action) {
                    listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, worker.action)
                }
            })
        }

        api.workers.delete(id)
    })

    playerViewChanges.removedWildAnimals?.forEach(id => api.wildAnimals.delete(id))

    playerViewChanges.newBuildings?.forEach(house => {
        api.houses.set(house.id, house)
        api.housesAt.set(house, house)
    })

    if (playerViewChanges.changedBuildings) {
        playerViewChanges.changedBuildings.forEach(house => {
            const oldHouse = api.houses.get(house.id)

            if (oldHouse && oldHouse.state !== 'BURNING' && house.state === 'BURNING') {
                houseBurningListeners.forEach(listener => listener.houseStartedToBurn(house.id, house))
            } else if (oldHouse && oldHouse.state === 'BURNING' && house.state !== 'BURNING') {
                houseBurningListeners.forEach(listener => listener.houseStoppedBurning(house.id, house))
            }

            api.houses.set(house.id, house)

            api.housesAt.set(house, house)
        })
    }

    playerViewChanges.removedBuildings?.forEach(id => {
        const house = api.houses.get(id)
        api.houses.delete(id)

        if (house) {
            api.housesAt.delete(house)
        }
    })

    playerViewChanges.newDecorations?.forEach(pointAndDecoration => api.decorations.set({ x: pointAndDecoration.x, y: pointAndDecoration.y }, pointAndDecoration))
    playerViewChanges.removedDecorations?.forEach(point => api.decorations.delete(point))

    playerViewChanges.newFlags?.forEach(flag => {
        api.flags.set(flag.id, flag)
        flagListeners.get(flag.id)?.forEach(listener => listener.onUpdate(flag))
    })
    playerViewChanges.changedFlags?.forEach(flag => {
        api.flags.set(flag.id, flag)
        flagListeners.get(flag.id)?.forEach(listener => listener.onUpdate(flag))
    })
    playerViewChanges.removedFlags?.forEach(id => {
        api.flags.delete(id)
        flagListeners.get(id)?.forEach(listener => listener.onRemove())
    })

    playerViewChanges.newRoads?.forEach(road => api.roads.set(road.id, road))
    playerViewChanges.changedRoads?.forEach(road => api.roads.set(road.id, road))
    playerViewChanges.removedRoads?.forEach(id => api.roads.delete(id))

    playerViewChanges.newTrees?.forEach(tree => api.trees.set(tree.id, serverSentTreeToLocal(tree)))
    playerViewChanges.removedTrees?.forEach(treeId => {
        const treeToRemove = api.trees.get(treeId)

        if (treeToRemove) {
            api.fallingTrees.set(treeId,
                {
                    x: treeToRemove.x,
                    y: treeToRemove.y,
                    id: treeId,
                    type: treeToRemove.type,
                    animation: 0
                })

            actionListeners.forEach(actionListener => actionListener.actionStarted(treeId, treeToRemove, 'FALLING_TREE'))

            api.trees.delete(treeId)
        }
    })

    playerViewChanges.discoveredDeadTrees?.forEach(discoveredDeadTree => api.deadTrees.add(discoveredDeadTree))
    playerViewChanges.removedDeadTrees?.forEach(deadTree => api.deadTrees.delete(deadTree))

    playerViewChanges.newStones?.forEach(stone => api.stones.set(stone.id, stone))
    playerViewChanges.changedStones?.forEach(stone => api.stones.set(stone.id, stone))
    playerViewChanges.removedStones?.forEach(stoneId => api.stones.delete(stoneId))

    if (playerViewChanges.changedBorders) {
        syncChangedBorders(playerViewChanges.changedBorders)
    }

    playerViewChanges.newCrops?.forEach(crop => api.crops.set(crop.id, serverSentCropToLocal(crop)))

    playerViewChanges.harvestedCrops?.forEach(cropId => {
        const crop = api.crops.get(cropId)

        if (crop !== undefined) {
            crop.state = 'HARVESTED'
        }
    })

    playerViewChanges.removedCrops?.forEach(cropId => api.crops.delete(cropId))

    playerViewChanges.newSigns?.forEach(sign => api.signs.set(sign.id, sign))
    playerViewChanges.removedSigns?.forEach(id => api.signs.delete(id))

    if (playerViewChanges.changedAvailableConstruction) {
        for (const change of playerViewChanges.changedAvailableConstruction) {
            const point = { x: change.x, y: change.y }

            if (change.available.length === 0) {
                api.availableConstruction.delete(point)
            } else {
                api.availableConstruction.set(point, change.available)
            }

            availableConstructionListeners.get(point)?.forEach(listener => listener.onAvailableConstructionChanged(change.available))
        }
    }

    const transportPriorityChanged = ('transportPriority' in playerViewChanges)
    if (playerViewChanges.transportPriority) {
        api.transportPriority = playerViewChanges.transportPriority
    }

    /* Finally, notify listeners when all data is updated */
    if (playerViewChanges.newDiscoveredLand) {
        const newDiscoveredLand = new PointSetFast(playerViewChanges.newDiscoveredLand)
        discoveredPointListeners.forEach(listener => listener(newDiscoveredLand))
    }

    let receivedMessages: GameMessage[] = []
    let removedMessages: GameMessageId[] = []

    if (playerViewChanges.newMessages) {
        playerViewChanges.newMessages.forEach(message => api.messages.set(message.id, message))

        receivedMessages = playerViewChanges.newMessages
    }

    if (playerViewChanges.removedMessages) {
        playerViewChanges.removedMessages.forEach(messageId => api.messages.delete(messageId))

        removedMessages = playerViewChanges.removedMessages
    }

    if (receivedMessages.length !== 0 || removedMessages.length !== 0) {
        messageListeners.forEach(listener => listener(receivedMessages, removedMessages))
    }

    if (playerViewChanges.newRoads !== undefined || playerViewChanges.removedRoads !== undefined) {
        roadListeners.forEach(roadListener => roadListener())
    }

    if (playerViewChanges.changedBuildings) {
        notifyHouseListeners(playerViewChanges.changedBuildings)
    }

    if (transportPriorityChanged && api.transportPriority) {
        for (const listener of transportPriorityListeners) {
            listener(api.transportPriority)
        }
    }
}

function storeDiscoveredTiles(newlyDiscoveredPoints: PointSetFast | Point[]): void {
    for (const point of newlyDiscoveredPoints) {
        const terrainAtPoint = api.allTiles.get(point)

        if (terrainAtPoint === undefined) {
            continue
        }

        const pointLeft = getPointLeft(point)
        const pointUpRight = getPointUpRight(point)
        const pointDownLeft = getPointDownLeft(point)
        const pointDownRight = getPointDownRight(point)
        const pointRight = getPointRight(point)
        const pointUpLeft = getPointUpLeft(point)

        const isLeftDiscovered = pointLeft.x > 0 && api.discoveredPoints.has(pointLeft)
        const isDownLeftDiscovered = pointDownLeft.x > 0 && pointDownLeft.y > 0 && api.discoveredPoints.has(pointDownLeft)
        const isDownRightDiscovered = api.discoveredPoints.has(pointDownRight)
        const isRightDiscovered = api.discoveredPoints.has(pointRight)
        const isUpRightDiscovered = api.discoveredPoints.has(pointUpRight)
        const isUpLeftDiscovered = api.discoveredPoints.has(pointUpLeft)

        const terrainAtPointLeft = pointLeft.x > 0 ? api.allTiles.get(pointLeft) : undefined
        const terrainAtPointDownLeft = (pointDownLeft.x > 0 && pointDownLeft.y > 0) ? api.allTiles.get(pointDownLeft) : undefined
        const terrainAtPointDownRight = api.allTiles.get(pointDownRight)
        const terrainAtPointRight = api.allTiles.get(pointRight)
        const terrainAtPointUpRight = api.allTiles.get(pointUpRight)
        const terrainAtPointUpLeft = api.allTiles.get(pointUpLeft)

        /* Tile down left */
        if (terrainAtPointLeft && terrainAtPointDownLeft && isLeftDiscovered && isDownLeftDiscovered &&
            !api.pointsWithDownRightTileDiscovered.has(pointLeft)) {
            api.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPointLeft.downRight,
                    pointLeft: pointLeft,
                    heightLeft: terrainAtPointLeft.height,
                    heightRight: terrainAtPoint.height,
                    heightDown: terrainAtPointDownLeft.height
                }
            )

            api.pointsWithDownRightTileDiscovered.add(pointLeft)
        }

        /* Tile up right */
        if (terrainAtPointUpRight && terrainAtPointRight && isUpRightDiscovered && isRightDiscovered &&
            !api.pointsWithBelowTileDiscovered.has(pointUpRight)) {
            api.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPointUpRight.below,
                    pointAbove: pointUpRight,
                    heightAbove: terrainAtPointUpRight.height,
                    heightDownLeft: terrainAtPoint.height,
                    heightDownRight: terrainAtPointRight.height
                }
            )

            api.pointsWithBelowTileDiscovered.add(pointUpRight)
        }

        /* Tile below */
        if (terrainAtPointDownLeft && terrainAtPointDownRight && isDownLeftDiscovered && isDownRightDiscovered &&
            !api.pointsWithBelowTileDiscovered.has(point)) {
            api.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPoint.below,
                    pointAbove: point,
                    heightAbove: terrainAtPoint.height,
                    heightDownLeft: terrainAtPointDownLeft.height,
                    heightDownRight: terrainAtPointDownRight.height
                }
            )

            api.pointsWithBelowTileDiscovered.add(point)
        }

        /* Tile down right */
        if (terrainAtPointDownRight && terrainAtPointRight && isDownRightDiscovered && isRightDiscovered &&
            !api.pointsWithDownRightTileDiscovered.has(point)) {

            api.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPoint.downRight,
                    pointLeft: point,
                    heightLeft: terrainAtPoint.height,
                    heightDown: terrainAtPointDownRight.height,
                    heightRight: terrainAtPointRight.height
                }
            )

            api.pointsWithDownRightTileDiscovered.add(point)
        }

        /* Tile up left */
        if (isUpLeftDiscovered && isLeftDiscovered && terrainAtPointUpLeft && terrainAtPointLeft &&
            !api.pointsWithBelowTileDiscovered.has(pointUpLeft)) {
            api.discoveredBelowTiles.add(
                {
                    vegetation: terrainAtPointUpLeft.below,
                    pointAbove: pointUpLeft,
                    heightAbove: terrainAtPointUpLeft.height,
                    heightDownLeft: terrainAtPointLeft.height,
                    heightDownRight: terrainAtPoint.height
                }
            )

            api.pointsWithBelowTileDiscovered.add(pointUpLeft)
        }

        /* Tile above */
        if (isUpLeftDiscovered && isUpRightDiscovered && terrainAtPointUpLeft && terrainAtPointUpRight &&
            !api.pointsWithDownRightTileDiscovered.has(pointUpLeft)) {
            api.discoveredDownRightTiles.add(
                {
                    vegetation: terrainAtPointUpLeft.downRight,
                    pointLeft: pointUpLeft,
                    heightLeft: terrainAtPointUpLeft.height,
                    heightRight: terrainAtPointUpRight.height,
                    heightDown: terrainAtPoint.height
                }
            )

            api.pointsWithDownRightTileDiscovered.add(pointUpLeft)
        }
    }
}

function syncChangedBorders(borderChanges: BorderChange[]): void {
    for (const borderChange of borderChanges) {
        const currentBorderForPlayer = api.border.get(borderChange.playerId)

        if (currentBorderForPlayer) {
            borderChange.newBorder.forEach(point => currentBorderForPlayer.points.add(point))
            borderChange.removedBorder.forEach(point => currentBorderForPlayer.points.delete(point))
        } else {
            const player = api.players.get(borderChange.playerId)

            if (!player) {
                console.error("UNKNOWN PLAYER: " + JSON.stringify(borderChange))

                continue
            }

            api.border.set(borderChange.playerId,
                {
                    color: player.color,
                    nation: api.players.get(borderChange.playerId)?.nation ?? 'ROMANS',
                    points: new PointSetFast(borderChange.newBorder)
                }
            )
        }
    }
}

function syncNewOrUpdatedWildAnimals(wildAnimals: WildAnimalInformation[]): void {
    for (const wildAnimalInformation of wildAnimals) {
        let wildAnimal = api.wildAnimals.get(wildAnimalInformation.id)

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

            api.wildAnimals.set(wildAnimal.id, wildAnimal)
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
        let worker = api.workers.get(walkerTargetChange.id)
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
                bodyType: walkerTargetChange.bodyType,
                color: walkerTargetChange.color,
                nation: walkerTargetChange.nation
            }

            api.workers.set(worker.id, worker)
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

function notifyHouseListeners(houses: HouseInformation[]): void {
    houses.forEach(house => {
        houseListeners.get(house.id)?.forEach(listener => listener(house))
    })
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
        type: serverCrop.type,
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
    api.roads.set('LOCAL', { id: 'LOCAL', points, type: 'NORMAL' })
}

function removeLocalRoad(roadId: RoadId): void {
    const road = api.roads.get(roadId)

    if (road !== undefined) {
        api.localRemovedRoads.set(roadId, road)

        api.roads.delete(roadId)
    }
}

function isGameDataAvailable(): boolean {
    return api.discoveredBelowTiles.size > 0
}

function serverWorkerToLocalWorker(serverWorker: ServerWorkerInformation): WorkerInformation {
    return {
        ...serverWorker,
        direction: simpleDirectionToCompassDirection(serverWorker.direction)
    }
}

function assignGameInformation(gameInformation: GameInformation): void {
    api.gameId = gameInformation.id
    api.gameName = gameInformation.name
    api.gameState = gameInformation.status
    api.map = gameInformation.map
    api.othersCanJoin = gameInformation.othersCanJoin

    gameInformation.players.forEach(player => api.players.set(player.id, player))

}

/**
 * Starts following a game with the given gameId and from the perspective of the given playerId. All members of the monitor will be kept in sync with the backend.
 *
 * @param {GameId} gameId - The id of the game to follow.
 * @param {PlayerId} playerId - The id of the player.
 * @returns {Promise<GameInformation>} Metadata about the game.
 */
async function followGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation | undefined> {
    if (followingState === 'NOT_FOLLOWING') {
        requestedFollowingState = 'FOLLOW'
        followingState = 'STARTING_TO_FOLLOW'

        api.gameId = gameId
        api.playerId = playerId

        // Register the gameId and playerId with the backend
        await setGame(gameId)
        await setPlayerId(playerId)

        // Start listening to the game's metadata
        const gameInformation = await listenToGameMetadata()

        // Sync the received metadata
        loadGameInformationAndCallListeners(gameInformation)

        // Get the chat history for the game's chat room
        const chatRoomHistory = await getChatRoomHistory(`game-${gameId}`)

        loadChatRoomHistoryAndCallListeners(chatRoomHistory)

        // Start listening to the actual game state from the player's point of view
        const playerView = await listenToGameViewForPlayer()

        // Sync the received view
        if (playerView !== undefined) {
            console.log('WS API: Loading player view')

            loadPlayerViewAndCallListeners(playerView)
        } else {
            console.log('WS API: Not loading player view')
        }

        followingState = 'FOLLOWING'

        return gameInformation
    } else {
        console.log(`Can't start to follow when following state is: ${followingState}. Previously requested state is: ${requestedFollowingState}`)
    }
}

function loadChatRoomHistoryAndCallListeners(chatRoomHistory: ChatMessage[]): void {
    chatRoomHistory.forEach(chatMessage => api.chatRoomMessages.push(chatMessage))

    console.log(api.chatRoomMessages)

    chatListeners.forEach(listener => listener())
}

async function waitForGameDataAvailable(): Promise<void> {
    const startTime = Date.now()

    while (true) {
        if (Date.now() - startTime > MAX_WAIT_FOR_CONNECTION) {
            console.error('Timed out waiting for game data to be available.')
            throw new Error('Timed out')
        }

        if (api.allTiles.size > 0) {
            console.log('Game data is available')
            return
        }

        await delay(5)
    }
}

export {
    api
}
