import { getDirectionForWalkingWorker, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, pointStringToPoint, terrainInformationToTerrainAtPointList } from '../utils'
import { PointMapFast, PointSetFast } from '../util_types'
import { WorkerType, GameMessage, HouseId, HouseInformation, PointInformation, Point, VegetationIntegers, GameId, PlayerId, WorkerId, WorkerInformation, ShipId, ShipInformation, FlagId, FlagInformation, RoadId, RoadInformation, TreeId, TreeInformationLocal, CropId, CropInformationLocal, SignId, SignInformation, PlayerInformation, AvailableConstruction, TerrainAtPoint, WildAnimalId, WildAnimalInformation, Decoration, AnyBuilding, SimpleDirection, Material, BodyType, WorkerAction, DecorationType, TreeInformation, CropInformation, ServerWorkerInformation, BorderInformation, StoneInformation, Direction, SoldierType, GameMessageId, StoneId, GameState, GameSpeed, FallingTreeInformation, Action, PlayerColor, Nation, FlagDebugInfo, GameInformation, MapInformation, Player, MapId, ResourceLevel, PlayerType, Vegetation, RoomId, ChatMessage } from './types'

export const wsApiDebug = {
    receive: false,
    send: false
}

let gameTickLength = 200;

const MAX_WAIT_FOR_REPLY = 1000; // milliseconds
const MAX_WAIT_FOR_CONNECTION = 10_000; // milliseconds

type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'NOT_CONNECTED'
type WalkingTimerState = 'RUNNING' | 'NOT_RUNNING'
type GamesListeningState = 'NOT_LISTENING' | 'LISTENING'

let gamesListeningStatus: GamesListeningState = 'NOT_LISTENING'
let connectionStatus: ConnectionStatus = 'NOT_CONNECTED'
let walkingTimerState: WalkingTimerState = 'NOT_RUNNING'

interface MonitoredBorderForPlayer {
    color: PlayerColor
    nation: Nation
    points: PointSetFast
}

interface WalkerTargetChange {
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

interface BorderChange {
    playerId: PlayerId
    newBorder: Point[]
    removedBorder: Point[]
}

type ChangedAvailableConstruction = Point & { available: AvailableConstruction[] }

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
}

interface PlayerViewInformation {
    workers: ServerWorkerInformation[]
    ships: ShipInformation[]
    houses: HouseInformation[]
    flags: FlagInformation[]
    roads: RoadInformation[]
    borders: BorderInformation[]
    trees: TreeInformation[]
    stones: StoneInformation[]
    crops: CropInformation[]
    discoveredPoints: Point[]
    signs: SignInformation[]
    players: PlayerInformation[]
    availableConstruction: { [key in `${number},${number}`]: AvailableConstruction[] }
    messages: GameMessage[]
    deadTrees: Point[]
    wildAnimals: WildAnimalInformation[]
    decorations: Decoration[]
    gameState: GameState
    width: number
    height: number
    straightBelow: Vegetation[]
    belowToTheRight: Vegetation[]
    heights: number[]
    map: MapInformation
    othersCanJoin: boolean
    initialResources: ResourceLevel
}

interface GameInformationChangedMessage {
    gameInformation: GameInformation
}

type NewChatMessage = {
    chatMessage: ChatMessage
}

type GameListChangedMessage = {
    games: GameInformation[]
}

interface GameChangedMessage {
    gameState?: GameState
    othersCanJoin?: 'TRUE' | 'FALSE'
    map?: MapInformation
    initialResources?: ResourceLevel
    gameName?: string
    players?: PlayerInformation[]
}

type MilitarySettings = {
    defenseStrength: number
    defenseFromSurroundingBuildings: number
    soldierAmountWhenPopulatingCloseToBorder: number
    soldierAmountWhenPopulatingAwayFromBorder: number
    soldierAmountWhenPopulatingFarFromBorder: number
    soldierStrengthWhenPopulatingBuildings: number
    soldierAmountsAvailableForAttack: number
}

type GameListListener = (gameInformations: GameInformation[]) => void

interface ActionListener {
    actionStarted: (id: string, point: Point, action: Action) => void
    actionEnded: (id: string, point: Point, action: Action) => void
}

interface HouseBurningListener {
    houseStartedToBurn: (id: string, point: Point) => void
    houseStoppedBurning: (id: string, point: Point) => void
}

interface FlagListener {
    onUpdate: (flag: FlagInformation) => void
    onRemove: () => void
}

export interface GameListener {
    onMonitoringStarted?: () => void
    onGameStateChanged?: (gameState: GameState) => void
    onGameSpeedChanged?: (gameSpeed: GameSpeed) => void
    onMapChanged?: (map: MapInformation) => void
    onTitleChanged?: (title: string) => void
    onInitialResourcesChanged?: (resources: ResourceLevel) => void
    onAllowOthersJoinChanged?: (othersCanJoin: boolean) => void
    onPlayersChanged?: (players: PlayerInformation[]) => void
}

interface AvailableConstructionListener {
    onAvailableConstructionChanged: (availableConstruction: AvailableConstruction[]) => void
}

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

type ChatListener = () => void

interface WorkerMoveListener {
    id: WorkerId

    onWorkerMoved: (move: MoveUpdate) => void
}

interface ReplyMessage {
    requestId: RequestId
}

interface NumberReplyMessage extends ReplyMessage {
    amount: number
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

export interface WsApi {
    gameId?: GameId
    playerId?: PlayerId
    workers: Map<WorkerId, WorkerInformation>
    ships: Map<ShipId, ShipInformation>
    houses: Map<HouseId, HouseInformation>
    flags: Map<FlagId, FlagInformation>
    roads: Map<RoadId, RoadInformation>
    border: Map<PlayerId, MonitoredBorderForPlayer>
    trees: Map<TreeId, TreeInformationLocal>
    fallingTrees: Map<TreeId, FallingTreeInformation>
    stones: Map<StoneId, StoneInformation>
    crops: Map<CropId, CropInformationLocal>
    discoveredPoints: PointSetFast
    signs: Map<SignId, SignInformation>
    players: Map<PlayerId, PlayerInformation>
    availableConstruction: PointMapFast<AvailableConstruction[]>
    messages: Map<GameMessageId, GameMessage>
    allTiles: PointMapFast<TerrainAtPoint>
    discoveredBelowTiles: Set<TileBelow>
    discoveredDownRightTiles: Set<TileDownRight>
    pointsWithBelowTileDiscovered: PointSetFast
    pointsWithDownRightTileDiscovered: PointSetFast
    deadTrees: PointSetFast
    wildAnimals: Map<WildAnimalId, WildAnimalInformation>
    decorations: PointMapFast<Decoration>
    localRemovedFlags: Map<FlagId, FlagInformation>
    localRemovedRoads: Map<RoadId, RoadInformation>
    gameState: GameState
    housesAt: PointMapFast<HouseInformation>
    gameSpeed: GameSpeed
    gameName?: string
    map?: MapInformation,
    othersCanJoin?: boolean,
    initialResources?: ResourceLevel,
    chatMessages: ChatMessage[]

    placeHouse: (houseType: AnyBuilding, point: Point) => void
    placeRoad: (points: Point[]) => void
    placeFlag: (point: Point) => void
    placeRoadWithFlag: (point: Point, points: Point[]) => void
    placeLocalRoad: (points: Point[]) => void

    removeFlag: (flagId: FlagId) => void
    removeRoad: (roadId: FlagId) => void
    removeBuilding: (houseId: HouseId) => void
    removeLocalRoad: (roadId: RoadId) => void
    removeDetailedMonitoring: (houseId: HouseId) => void
    removeMessage: (messageId: GameMessageId) => void
    removeMessages: (messages: GameMessage[]) => void

    isAvailable: (point: Point, whatToBuild: 'FLAG') => boolean
    isGameDataAvailable: () => boolean

    getInformationOnPointLocal: (point: Point) => PointInformationLocal
    getHouseAtPointLocal: (point: Point) => HouseInformation | undefined
    getFlagAtPointLocal: (point: Point) => FlagInformation | undefined
    getInformationOnPoint: (point: Point) => Promise<PointInformation>
    getInformationOnPoints: (points: Point[]) => Promise<PointMapFast<PointInformation>>
    getHeight: (point: Point) => number
    getFlagDebugInfo: (flagId: FlagId) => Promise<FlagDebugInfo>

    callScout: (point: Point) => void
    callGeologist: (point: Point) => void

    setReservedSoldiers: (rank: SoldierType, amount: number) => void
    setStrengthWhenPopulatingMilitaryBuildings: (strength: number) => void
    setDefenseStrength: (strength: number) => void
    setDefenseFromSurroundingBuildings: (strength: number) => void
    setMilitaryPopulationFarFromBorder: (amount: number) => void
    setMilitaryPopulationCloserToBorder: (amount: number) => void
    setMilitaryPopulationCloseToBorder: (amount: number) => void
    setSoldiersAvailableForAttack: (amount: number) => void

    createPlayer: (name: string, color: PlayerColor, nation: Nation, type: PlayerType) => Promise<PlayerInformation>
    addPlayerToGame: (playerId: PlayerId) => Promise<GameInformation>
    updatePlayer: (playerId: PlayerId, name: string, color: PlayerColor, nation: Nation) => Promise<PlayerInformation>
    removePlayer: (id: PlayerId) => void
    upgrade: (houseId: HouseId) => void
    setGameSpeed: (a: GameSpeed) => void
    setTitle: (title: string) => void
    setInitialResources: (resources: ResourceLevel) => void
    setOthersCanJoin: (othersCanJoin: boolean) => Promise<GameInformation>
    setMap: (map: MapId) => void
    getMaps: () => Promise<MapInformation[]>

    startGame: () => void

    getStrengthWhenPopulatingMilitaryBuildings: () => Promise<number>
    getDefenseStrength: () => Promise<number>
    getDefenseFromSurroundingBuildings: () => Promise<number>
    getPopulateMilitaryFarFromBorder: () => Promise<number>
    getPopulateMilitaryCloserToBorder: () => Promise<number>
    getPopulateMilitaryCloseToBorder: () => Promise<number>
    getSoldiersAvailableForAttack: () => Promise<number>
    getMilitarySettings: () => Promise<MilitarySettings>

    getGameInformation: () => Promise<GameInformation>

    addDetailedMonitoring: (id: HouseId | FlagId) => void

    listenToGames: (gamesListener: GameListListener) => void
    listenToFlag: (flagId: FlagId, listener: FlagListener) => void
    listenToGameState: (listener: GameListener) => void
    listenToAvailableConstruction: (point: Point, listener: AvailableConstructionListener) => void
    listenToActions: (listener: ActionListener) => void
    listenToBurningHouses: (listener: HouseBurningListener) => void
    listenToMessages: (listener: (messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void) => void
    listenToDiscoveredPoints: (listener: (points: PointSetFast) => void) => void
    listenToRoads: (listener: () => void) => void
    listenToHouse: (houseId: HouseId, houseListenerFn: (house: HouseInformation) => void) => void
    listenToMovementForWorker: (listener: WorkerMoveListener) => void
    listenToChatMessages: (listener: ChatListener, playerId: PlayerId, roomIds: RoomId[]) => void

    stopListeningToGames: (gamesListener: GameListListener) => void
    stopListeningToMessages: (listener: (messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void) => void
    stopListeningToFlag: (flagId: FlagId, listener: FlagListener) => void
    stopListeningToAvailableConstruction: (point: Point, listener: AvailableConstructionListener) => void
    stopListeningToGameState: (listener: GameListener) => void
    stopListeningToMovementForWorker: (listener: WorkerMoveListener) => void
    stopListeningToChatMessages: (listener: ChatListener) => void

    setCoalQuotas: (mintAmount: number, armoryAmount: number, ironSmelterAmount: number) => void
    setFoodQuotas: (ironMine: number, coalMine: number, goldMine: number, graniteMine: number) => void
    setWheatQuotas: (donkeyFarm: number, pigFarm: number, mill: number, brewery: number) => void
    setWaterQuotas: (bakery: number, donkeyFarm: number, pigFarm: number, brewery: number) => void
    setIronBarQuotas: (armory: number, metalworks: number) => void

    getCoalQuotas: () => Promise<CoalQuotas>
    getFoodQuotas: () => Promise<FoodQuotas>
    getWheatQuotas: () => Promise<WheatQuotas>
    getWaterQuotas: () => Promise<WaterQuotas>
    getIronBarQuotas: () => Promise<IronBarQuotas>

    pauseGame: () => void
    resumeGame: () => void

    houseAt: (point: Point) => HouseInformation | undefined

    killWebsocket: () => void
    waitForConnection: () => Promise<void>
    waitForGameDataAvailable: () => Promise<void>
    connectAndWaitForConnection: () => Promise<void>
    createGame: (name: string, players: PlayerInformation[]) => Promise<GameInformation>
    getGames: () => Promise<GameInformation[]>
    followGame: (gameId: GameId, playerId: PlayerId) => Promise<GameInformation>
    sendChatMessageToRoom: (text: string, room: RoomId, from: PlayerId) => void
}

const messageListeners: ((messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void)[] = []
const houseListeners: Map<HouseId, ((house: HouseInformation) => void)[]> = new Map<HouseId, ((house: HouseInformation) => void)[]>()
const discoveredPointListeners: ((discoveredPoints: PointSetFast) => void)[] = []
const roadListeners: (() => void)[] = []
const availableConstructionListeners = new PointMapFast<AvailableConstructionListener[]>()
const actionListeners: ActionListener[] = []
const houseBurningListeners: HouseBurningListener[] = []
const gameListeners: GameListener[] = []
const gamesListeners: GameListListener[] = []
const workerMovedListeners: WorkerMoveListener[] = []
const chatListeners: ChatListener[] = []
const flagListeners: Map<FlagId, FlagListener[]> = new Map<FlagId, FlagListener[]>()

let websocket: WebSocket | undefined = undefined

let workerWalkingTimer: undefined | NodeJS.Timeout
let workerAnimationsTimer: undefined | NodeJS.Timeout
let cropGrowerTimer: undefined | NodeJS.Timeout
let treeGrowerTimer: undefined | NodeJS.Timeout

type RequestId = number

function isReplyMessage(message: unknown): message is ReplyMessage {
    return message !== undefined &&
        message !== null &&
        typeof message === 'object' &&
        'requestId' in message
}

function isNumberReplyMessage(message: ReplyMessage): message is NumberReplyMessage {
    return 'amount' in message
}

const replies: Map<RequestId, ReplyMessage> = new Map()
let nextRequestId = 0

const monitor: WsApi = {
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
    gameState: 'NOT_STARTED',
    gameSpeed: 'NORMAL',
    gameName: '',
    chatMessages: [],

    housesAt: new PointMapFast<HouseInformation>(),

    localRemovedFlags: new Map<FlagId, FlagInformation>(),
    localRemovedRoads: new Map<RoadId, RoadInformation>(),

    placeHouse: placeBuildingWebsocket,
    placeRoad: placeRoadWebsocket,
    placeFlag: placeFlagWebsocket,
    placeRoadWithFlag: placeRoadWithFlagWebsocket,
    placeLocalRoad,

    removeFlag: removeFlagWebsocket,
    removeRoad: removeRoadWebsocket,
    removeBuilding: removeBuildingWebsocket,
    removeLocalRoad,
    removeMessage,
    removeMessages,

    isAvailable,
    isGameDataAvailable,

    getInformationOnPointLocal,
    getHouseAtPointLocal,
    getFlagAtPointLocal,
    getInformationOnPoint,
    getInformationOnPoints,
    getHeight,
    getFlagDebugInfo,

    callScout: callScoutWebsocket,
    callGeologist: callGeologistWebsocket,

    setReservedSoldiers,
    setStrengthWhenPopulatingMilitaryBuildings,
    setDefenseStrength,
    setDefenseFromSurroundingBuildings,
    setMilitaryPopulationFarFromBorder,
    setMilitaryPopulationCloserToBorder,
    setMilitaryPopulationCloseToBorder,
    setSoldiersAvailableForAttack,

    createPlayer,
    addPlayerToGame,
    updatePlayer,
    removePlayer,
    upgrade,
    setGameSpeed,
    setTitle,
    setInitialResources: setAvailableResources,
    setOthersCanJoin,
    setMap,
    getMaps,

    startGame,

    getStrengthWhenPopulatingMilitaryBuildings,
    getDefenseStrength,
    getDefenseFromSurroundingBuildings,
    getPopulateMilitaryFarFromBorder,
    getPopulateMilitaryCloserToBorder,
    getPopulateMilitaryCloseToBorder,
    getSoldiersAvailableForAttack,
    getMilitarySettings,

    getGameInformation,

    addDetailedMonitoring,

    removeDetailedMonitoring,

    listenToGames,
    listenToGameState,
    listenToFlag,
    listenToAvailableConstruction,
    listenToActions,
    listenToBurningHouses,
    listenToMessages,
    listenToDiscoveredPoints,
    listenToRoads,
    listenToHouse,
    listenToMovementForWorker,
    listenToChatMessages,

    stopListeningToGames,
    stopListeningToFlag,
    stopListeningToAvailableConstruction,
    stopListeningToMessages,
    stopListeningToGameState,
    stopListeningToMovementForWorker,
    stopListeningToChatMessages,

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

    pauseGame,
    resumeGame,

    houseAt,

    killWebsocket,
    waitForConnection,
    waitForGameDataAvailable,
    connectAndWaitForConnection,
    createGame,
    getGames,
    followGame,
    sendChatMessageToRoom
}

function isFullSyncMessage(message: unknown): message is PlayerViewInformation {
    return message !== null &&
        message !== undefined &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'FULL_SYNC'
}

function isGameInformationChangedMessage(message: unknown): message is GameInformationChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_INFO_CHANGED'
}

function isGameListChangedMessage(message: unknown): message is GameListChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_LIST_CHANGED'
}

function isChatMessage(message: unknown): message is NewChatMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'NEW_CHAT_MESSAGES'
}

function isGameChangeMessage(message: unknown): message is GameChangedMessage {
    return message !== null &&
        message !== null &&
        typeof message === 'object' &&
        ('gameState' in message ||
            'othersCanJoin' in message ||
            'map' in message ||
            'initialResources' in message ||
            'gameName' in message ||
            'players' in message)
}

function isGameChangesMessage(message: unknown): message is PlayerViewChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'PLAYER_VIEW_CHANGED'
}

function makeWsConnectUrl(): string {
    return `ws://${window.location.hostname}:8080/ws/monitor/games`
}

function loadPlayerViewAndCallListeners(message: PlayerViewInformation): void {
    const previousGameState = monitor.gameState

    message.players.forEach(player => monitor.players.set(player.id, player))

    monitor.gameState = message.gameState
    monitor.othersCanJoin = message.othersCanJoin
    monitor.initialResources = message.initialResources
    monitor.map = message.map

    if (monitor.gameState === 'NOT_STARTED') {
        return
    }

    gameStateMightHaveChanged(monitor.gameState)

    Object.entries(message.availableConstruction).forEach(
        ([pointAsString, availableConstruction]) => monitor.availableConstruction.set(pointStringToPoint(pointAsString), availableConstruction))

    message.signs.forEach(sign => monitor.signs.set(sign.id, sign))

    message.stones.forEach(stone => monitor.stones.set(stone.id, stone))

    message.discoveredPoints.forEach(point => monitor.discoveredPoints.add(point))

    message.workers.forEach(worker => monitor.workers.set(worker.id, serverWorkerToLocalWorker(worker)))

    message.wildAnimals.forEach(wildAnimal => monitor.wildAnimals.set(wildAnimal.id, wildAnimal))

    message.houses.forEach(house => {
        monitor.houses.set(house.id, house)
        monitor.housesAt.set(house, house)
    })

    message.flags.forEach(flag => monitor.flags.set(flag.id, flag))

    message.roads.forEach(road => monitor.roads.set(road.id, road))

    message.trees.forEach(tree => monitor.trees.set(tree.id, serverSentTreeToLocal(tree)))

    message.crops.forEach(crop => monitor.crops.set(crop.id, serverSentCropToLocal(crop)))

    message.deadTrees.forEach(deadTree => monitor.deadTrees.add(deadTree))

    message.decorations.forEach(decoration => monitor.decorations.set({ x: decoration.x, y: decoration.y }, decoration))

    for (const borderInformation of message.borders) {
        const player = monitor.players.get(borderInformation.playerId)

        if (!player) {
            console.error("UNKNOWN PLAYER: " + borderInformation.playerId)

            continue
        }

        monitor.border.set(borderInformation.playerId,
            {
                color: player.color,
                nation: player.nation,
                points: new PointSetFast(borderInformation.points)
            }
        )
    }

    // Convert the terrain to a point-list format and store it
    const terrainPointList = terrainInformationToTerrainAtPointList(message)

    terrainPointList.forEach(terrainAtPoint => monitor.allTiles.set(terrainAtPoint.point, terrainAtPoint))

    storeDiscoveredTiles(monitor.discoveredPoints)

    // Call the listeners after all the data has been set
    discoveredPointListeners.forEach(listener => listener(monitor.discoveredPoints))
    roadListeners.forEach(roadListener => roadListener())

    message?.messages.forEach(message => monitor.messages.set(message.id, message))

    if (message.messages) {
        messageListeners.forEach(messageListener => messageListener(message.messages, []))
    }

    if (previousGameState !== monitor.gameState) {
        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged(monitor.gameState))
    }
}

function startTimers() {

    // Drive worker animations
    workerAnimationsTimer = setInterval(async () => {
        for (const worker of monitor.workers.values()) {
            if (worker.action && worker.actionAnimationIndex !== undefined) {
                worker.actionAnimationIndex = worker.actionAnimationIndex + 1
            }
        }

        const treesToRemove: TreeId[] = []

        monitor.fallingTrees.forEach(fallingTree => {
            fallingTree.animation += 1

            if (fallingTree.animation === 4) {
                treesToRemove.push(fallingTree.id)

                actionListeners.forEach(actionListener => actionListener.actionEnded(fallingTree.id, fallingTree, 'FALLING_TREE'))
            }

            treesToRemove.forEach(id => monitor.fallingTrees.delete(id))
        })
    }, gameTickLength)

    // Move workers locally to reduce the amount of messages from the server
    workerWalkingTimer = setInterval(async () => {
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

    }, gameTickLength / 2)

    // Grow the crops locally to avoid the need for the server to send messages when crops change growth state
    cropGrowerTimer = setInterval(() => {
        monitor.crops.forEach(crop => {
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
        monitor.trees.forEach(tree => {
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

function websocketError(error: unknown): void {
    console.error(error)
}

// TODO: review and fix the handling of when the websocket gets disconnected
function websocketDisconnected(e: CloseEvent): void {
    console.log("Disconnected from backend")

    if (monitor.gameState === 'EXPIRED') {
        return
    }

    console.info("Websocket closed: " + JSON.stringify(e))
    console.info(e)

    if (e.code === 1003) {
        console.error("The game has been removed from the backend")

        monitor.gameState = "EXPIRED"

        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged("EXPIRED"))
    } else {
        setTimeout(() => {
            if (monitor.gameId === undefined) {
                console.error('Game id is not set')

                return
            }

            if (monitor.playerId === undefined) {
                console.error('Player id is not set')

                return
            }

            const websocketUrl = makeWsConnectUrl()

            console.info("Websocket url: " + websocketUrl)

            websocket = new WebSocket(websocketUrl)

            websocket.onopen = () => {
                console.info("Websocket for subscription is open. Requesting full sync.")

                connectionStatus = 'CONNECTED'

                if (websocket) {
                    sendRequestAndWaitForReply<PlayerViewInformation>('FULL_SYNC')
                }
            }
            websocket.onclose = e => websocketDisconnected(e)
            websocket.onerror = e => websocketError(e)
            websocket.onmessage = message => websocketMessageReceived(message)
        }, 1000)
    }
}

// eslint-disable-next-line
function websocketMessageReceived(messageFromServer: MessageEvent<any>): void {
    try {
        const message = JSON.parse(messageFromServer.data)

        wsApiDebug.receive && console.log(`Received message`)
        wsApiDebug.receive && console.log(message)

        if (isGameChangesMessage(message)) {
            wsApiDebug.receive && console.log('Handling player view changed message')

            loadPlayerViewChangesAndCallListeners(message.playerViewChanges)
        } else if (isFullSyncMessage(message)) {
            wsApiDebug.receive && console.log('Handling full sync message')

            clearAndLoadPlayerView(message)
        } else if (isReplyMessage(message)) {
            wsApiDebug.receive && console.log('Handling reply message')

            replies.set(message.requestId, message)
        } else if (isGameChangeMessage(message)) {
            wsApiDebug.receive && console.log('Handling game changed message')

            receivedGameChangedMessage(message)
        } else if (isGameInformationChangedMessage(message)) {
            wsApiDebug.receive && console.log('Handling game information changed message')

            loadGameInformationAndCallListeners(message.gameInformation)
        } else if (isGameListChangedMessage(message)) {
            wsApiDebug.receive && console.log('Handling game list changed messgae')

            receivedGameListChangedMessage(message)
        } else if (isChatMessage(message)) {
            wsApiDebug.receive && console.log('Handling chat message')

            loadChatMessage(message.chatMessage)
        }
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e))
        console.info(messageFromServer.data)
    }
}

function loadChatMessage(chatMessage: ChatMessage): void {
    monitor.chatMessages.push(chatMessage)

    chatListeners.forEach(listener => listener())
}

function receivedGameListChangedMessage(message: GameListChangedMessage): void {
    gamesListeners.forEach(listener => listener(message.games))
}

function containsPlayer(players: PlayerInformation[], player: PlayerInformation): boolean {
    return players.find(p => p.id === player.id) !== undefined
}

function loadGameInformationAndCallListeners(gameInformation: GameInformation): void {

    console.log(gameInformation)

    // TODO: assign the game information before calling listeners

    // Call listeners
    if (monitor.gameName !== gameInformation.name) {
        gameListeners.forEach(listener => listener.onTitleChanged && listener.onTitleChanged(gameInformation.name))
    }

    if (monitor.othersCanJoin !== gameInformation.othersCanJoin) {
        gameListeners.forEach(listener => listener.onAllowOthersJoinChanged && listener.onAllowOthersJoinChanged(gameInformation.othersCanJoin))
    }

    if (monitor.initialResources !== gameInformation.initialResources) {
        gameListeners.forEach(listener => listener.onInitialResourcesChanged && listener.onInitialResourcesChanged(gameInformation.initialResources))
    }

    if (monitor.gameState !== gameInformation.status) {
        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged(gameInformation.status))
    }

    if (monitor.map !== gameInformation.map) {
        gameListeners.forEach(listener => listener.onMapChanged && listener.onMapChanged(gameInformation.map))
    }

    const anyPlayerRemoved = Array.from(monitor.players.values()).find(player => !containsPlayer(gameInformation.players, player)) !== undefined

    console.log(monitor.players.values())
    console.log(gameInformation.players)

    const anyPlayerAdded = gameInformation.players.find(player => !containsPlayer(Array.from(monitor.players.values()), player)) !== undefined

    if (anyPlayerAdded || anyPlayerRemoved) {
        gameListeners.forEach(listener => listener.onPlayersChanged && listener.onPlayersChanged(gameInformation.players))
    }

    // Store the updated values
    assignGameInformation(gameInformation)
}

async function listenToGameMetadata(): Promise<GameInformation> {
    return (await sendRequestAndWaitForReply<{ gameInformation: GameInformation }>('LISTEN_TO_GAME_INFO')).gameInformation
}

async function getViewForPlayer(): Promise<PlayerViewInformation> {
    return (
        await sendRequestAndWaitForReply<{ playerView: PlayerViewInformation }>('FULL_SYNC')
    ).playerView
}

// TODO: merge with loadGameInformationAndCallListeners
async function receivedGameChangedMessage(message: GameChangedMessage): Promise<void> {
    if (message?.gameState !== undefined) {
        const gameState = message.gameState

        monitor.gameState = gameState

        if (gameState === 'STARTED') {
            loadPlayerViewAndCallListeners(await getViewForPlayer())
        }

        gameStateMightHaveChanged(gameState)

        gameListeners.forEach(listener => listener.onGameStateChanged && listener.onGameStateChanged(gameState))
    }

    console.log(message?.othersCanJoin)

    if (message?.othersCanJoin !== undefined) {
        console.log('Handling others can join')

        const othersCanJoin = (message.othersCanJoin === 'TRUE')

        monitor.othersCanJoin = othersCanJoin

        console.log('Telling listeners')
        gameListeners.forEach(listener => {
            console.log('A listener')

            if (listener.onAllowOthersJoinChanged !== undefined) {
                console.log('Notifying the listener')

                listener.onAllowOthersJoinChanged(othersCanJoin)
            }
        })
    }

    if (message?.map !== undefined) {
        const map = message.map

        monitor.map = map

        gameListeners.forEach(listener => listener.onMapChanged && listener.onMapChanged(map))
    }

    if (message?.initialResources !== undefined) {
        const initialResources = message.initialResources

        monitor.initialResources = initialResources

        gameListeners.forEach(listener => listener.onInitialResourcesChanged && listener.onInitialResourcesChanged(initialResources))
    }

    if (message?.gameName !== undefined) {
        const gameName = message.gameName

        monitor.gameName = gameName

        gameListeners.forEach(listener => listener.onTitleChanged && listener.onTitleChanged(gameName))
    }

    if (message?.players !== undefined) {
        const players = message.players

        players.forEach(player => monitor.players.set(player.id, player))

        gameListeners.forEach(listener => listener.onPlayersChanged && listener.onPlayersChanged(players))
    }
}

function stopTimers() {
    const timers = [workerAnimationsTimer, workerWalkingTimer, cropGrowerTimer, treeGrowerTimer]

    timers.forEach(timer => {
        if (timer) {
            clearInterval(timer)
        }
    })
}

function clearAndLoadPlayerView(playerView: PlayerViewInformation): void {
    console.log("Handling full sync message")

    // Clear the local state
    monitor.availableConstruction.clear()
    monitor.signs.clear()
    monitor.stones.clear()
    monitor.discoveredPoints.clear()
    monitor.workers.clear()
    monitor.wildAnimals.clear()
    monitor.houses.clear()
    monitor.flags.clear()
    monitor.roads.clear()
    monitor.trees.clear()
    monitor.crops.clear()
    monitor.deadTrees.clear()
    monitor.decorations.clear()
    monitor.housesAt.clear()

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
    monitor.roads.delete('LOCAL')
    monitor.flags.delete('LOCAL')
    monitor.houses.delete('LOCAL')

    // Update game tick
    if (playerViewChanges.tick !== undefined) {
        stopTimers()

        gameTickLength = playerViewChanges.tick

        startTimers()
    }

    // Update game speed
    if (playerViewChanges.gameSpeed) {
        monitor.gameSpeed = playerViewChanges.gameSpeed

        gameListeners.forEach(listener => listener.onGameSpeedChanged && listener.onGameSpeedChanged(monitor.gameSpeed))
    }

    // Confirm local removals if they are part of the message
    playerViewChanges.removedFlags?.forEach(removedFlagId => monitor.localRemovedFlags.delete(removedFlagId))

    // Digest all changes from the message
    playerViewChanges.newDiscoveredLand?.forEach(point => monitor.discoveredPoints.add(point))

    if (playerViewChanges.newDiscoveredLand) {
        console.log("Got new discovered points")

        storeDiscoveredTiles(playerViewChanges.newDiscoveredLand)
    }

    if (playerViewChanges.workersWithNewTargets) {
        playerViewChanges.workersWithNewTargets.forEach(worker => {
            const monitoredWorker = monitor.workers.get(worker.id)

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
            const worker = monitor.workers.get(workerWithNewAction.id)

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
        const worker = monitor.workers.get(id)

        if (worker?.action) {
            actionListeners.forEach(listener => {
                if (worker.action) {
                    listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, worker.action)
                }
            })
        }

        monitor.workers.delete(id)
    })

    playerViewChanges.removedWildAnimals?.forEach(id => monitor.wildAnimals.delete(id))

    playerViewChanges.newBuildings?.forEach(house => {
        monitor.houses.set(house.id, house)
        monitor.housesAt.set(house, house)
    })

    if (playerViewChanges.changedBuildings) {
        playerViewChanges.changedBuildings.forEach(house => {
            const oldHouse = monitor.houses.get(house.id)

            if (oldHouse && oldHouse.state !== 'BURNING' && house.state === 'BURNING') {
                houseBurningListeners.forEach(listener => listener.houseStartedToBurn(house.id, house))
            } else if (oldHouse && oldHouse.state === 'BURNING' && house.state !== 'BURNING') {
                houseBurningListeners.forEach(listener => listener.houseStoppedBurning(house.id, house))
            }

            monitor.houses.set(house.id, house)

            monitor.housesAt.set(house, house)
        })
    }

    playerViewChanges.removedBuildings?.forEach(id => {
        const house = monitor.houses.get(id)
        monitor.houses.delete(id)

        if (house) {
            monitor.housesAt.delete(house)
        }
    })

    playerViewChanges.newDecorations?.forEach(pointAndDecoration => monitor.decorations.set({ x: pointAndDecoration.x, y: pointAndDecoration.y }, pointAndDecoration))
    playerViewChanges.removedDecorations?.forEach(point => monitor.decorations.delete(point))

    playerViewChanges.newFlags?.forEach(flag => {
        monitor.flags.set(flag.id, flag)
        flagListeners.get(flag.id)?.forEach(listener => listener.onUpdate(flag))
    })
    playerViewChanges.changedFlags?.forEach(flag => {
        monitor.flags.set(flag.id, flag)
        flagListeners.get(flag.id)?.forEach(listener => listener.onUpdate(flag))
    })
    playerViewChanges.removedFlags?.forEach(id => {
        monitor.flags.delete(id)
        flagListeners.get(id)?.forEach(listener => listener.onRemove())
    })

    playerViewChanges.newRoads?.forEach(road => monitor.roads.set(road.id, road))
    playerViewChanges.changedRoads?.forEach(road => monitor.roads.set(road.id, road))
    playerViewChanges.removedRoads?.forEach(id => monitor.roads.delete(id))

    playerViewChanges.newTrees?.forEach(tree => monitor.trees.set(tree.id, serverSentTreeToLocal(tree)))
    playerViewChanges.removedTrees?.forEach(treeId => {
        const treeToRemove = monitor.trees.get(treeId)

        if (treeToRemove) {
            monitor.fallingTrees.set(treeId,
                {
                    x: treeToRemove.x,
                    y: treeToRemove.y,
                    id: treeId,
                    type: treeToRemove.type,
                    animation: 0
                })

            actionListeners.forEach(actionListener => actionListener.actionStarted(treeId, treeToRemove, 'FALLING_TREE'))

            monitor.trees.delete(treeId)
        }
    })

    playerViewChanges.discoveredDeadTrees?.forEach(discoveredDeadTree => monitor.deadTrees.add(discoveredDeadTree))
    playerViewChanges.removedDeadTrees?.forEach(deadTree => monitor.deadTrees.delete(deadTree))

    playerViewChanges.newStones?.forEach(stone => monitor.stones.set(stone.id, stone))
    playerViewChanges.changedStones?.forEach(stone => monitor.stones.set(stone.id, stone))
    playerViewChanges.removedStones?.forEach(stoneId => monitor.stones.delete(stoneId))

    if (playerViewChanges.changedBorders) {
        syncChangedBorders(playerViewChanges.changedBorders)
    }

    playerViewChanges.newCrops?.forEach(crop => monitor.crops.set(crop.id, serverSentCropToLocal(crop)))

    playerViewChanges.harvestedCrops?.forEach(cropId => {
        const crop = monitor.crops.get(cropId)

        if (crop !== undefined) {
            crop.state = 'HARVESTED'
        }
    })

    playerViewChanges.removedCrops?.forEach(cropId => monitor.crops.delete(cropId))

    playerViewChanges.newSigns?.forEach(sign => monitor.signs.set(sign.id, sign))
    playerViewChanges.removedSigns?.forEach(id => monitor.signs.delete(id))

    if (playerViewChanges.changedAvailableConstruction) {
        for (const change of playerViewChanges.changedAvailableConstruction) {
            const point = { x: change.x, y: change.y }

            if (change.available.length === 0) {
                monitor.availableConstruction.delete(point)
            } else {
                monitor.availableConstruction.set(point, change.available)
            }

            availableConstructionListeners.get(point)?.forEach(listener => listener.onAvailableConstructionChanged(change.available))
        }
    }

    /* Finally, notify listeners when all data is updated */
    if (playerViewChanges.newDiscoveredLand) {
        const newDiscoveredLand = new PointSetFast(playerViewChanges.newDiscoveredLand)
        discoveredPointListeners.forEach(listener => listener(newDiscoveredLand))
    }

    let receivedMessages: GameMessage[] = []
    let removedMessages: GameMessageId[] = []

    if (playerViewChanges.newMessages) {
        playerViewChanges.newMessages.forEach(message => monitor.messages.set(message.id, message))

        receivedMessages = playerViewChanges.newMessages
    }

    if (playerViewChanges.removedMessages) {
        playerViewChanges.removedMessages.forEach(messageId => monitor.messages.delete(messageId))

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

        const isLeftDiscovered = pointLeft.x > 0 && monitor.discoveredPoints.has(pointLeft)
        const isDownLeftDiscovered = pointDownLeft.x > 0 && pointDownLeft.y > 0 && monitor.discoveredPoints.has(pointDownLeft)
        const isDownRightDiscovered = monitor.discoveredPoints.has(pointDownRight)
        const isRightDiscovered = monitor.discoveredPoints.has(pointRight)
        const isUpRightDiscovered = monitor.discoveredPoints.has(pointUpRight)
        const isUpLeftDiscovered = monitor.discoveredPoints.has(pointUpLeft)

        const terrainAtPointLeft = pointLeft.x > 0 ? monitor.allTiles.get(pointLeft) : undefined
        const terrainAtPointDownLeft = (pointDownLeft.x > 0 && pointDownLeft.y > 0) ? monitor.allTiles.get(pointDownLeft) : undefined
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
        if (isUpLeftDiscovered && isLeftDiscovered && terrainAtPointUpLeft && terrainAtPointLeft &&
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
                    nation: monitor.players.get(borderChange.playerId)?.nation ?? 'ROMANS',
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
                bodyType: walkerTargetChange.bodyType,
                color: walkerTargetChange.color,
                nation: walkerTargetChange.nation
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

function listenToMessages(messageListener: (messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void): void {
    messageListeners.push(messageListener)
}

function stopListeningToMessages(messageListenerFn: (messagesReceived: GameMessage[], messagesRemoved: GameMessageId[]) => void): void {
    const index = messageListeners.indexOf(messageListenerFn)

    delete messageListeners[index]
}

function stopListeningToGameState(listener: GameListener): void {
    const index = gameListeners.indexOf(listener)

    delete gameListeners[index]
}

function stopListeningToMovementForWorker(listener: WorkerMoveListener): void {
    const index = workerMovedListeners.indexOf(listener)

    delete workerMovedListeners[index]
}

function listenToChatMessages(listener: ChatListener, playerId: PlayerId, roomIds: RoomId[]): void {
    sendWithOptions<{ playerId: PlayerId, roomIds: RoomId[] }>('LISTEN_TO_CHAT_MESSAGES', { playerId, roomIds })

    chatListeners.push(listener)
}

function stopListeningToChatMessages(listener: ChatListener): void {
    const index = chatListeners.findIndex(listener)

    if (index > -1) {
        delete chatListeners[index]
    }
}

function listenToMovementForWorker(listener: WorkerMoveListener): void {
    workerMovedListeners.push(listener)
}

function listenToHouse(houseId: HouseId, houseListenerFn: (house: HouseInformation) => void): void {
    let listenersForHouseId = houseListeners.get(houseId)

    if (!listenersForHouseId) {
        listenersForHouseId = []

        houseListeners.set(houseId, listenersForHouseId)
    }

    listenersForHouseId.push(houseListenerFn)
}

function listenToDiscoveredPoints(listenerFn: (discoveredPoints: PointSetFast) => void): void {
    discoveredPointListeners.push(listenerFn)
}

function listenToRoads(listenerFn: () => void): void {
    roadListeners.push(listenerFn)
}

function notifyHouseListeners(houses: HouseInformation[]): void {
    houses.forEach(house => {
        houseListeners.get(house.id)?.forEach(listener => listener(house))
    })
}

function getHeadquarterForPlayer(playerId: PlayerId): HouseInformation | undefined {
    let headquarter

    for (const house of monitor.houses.values()) {
        if (house.type === 'Headquarter' && house.playerId === playerId) {
            headquarter = house
        }
    }

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
    monitor.roads.set('LOCAL', { id: 'LOCAL', points, type: 'NORMAL' })
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

function removeLocalRoad(roadId: RoadId): void {
    const road = monitor.roads.get(roadId)

    if (road !== undefined) {
        monitor.localRemovedRoads.set(roadId, road)

        monitor.roads.delete(roadId)
    }
}

function isGameDataAvailable(): boolean {
    return monitor.discoveredBelowTiles.size > 0
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
    const compassDirection = simpleDirectionToCompassDirection(serverWorker.direction)

    const worker: WorkerInformation = { ...serverWorker, direction: compassDirection }

    return worker
}

function placeBuildingWebsocket(type: AnyBuilding, point: Point): void {
    sendWithOptions<{ x: number, y: number, type: AnyBuilding }>('PLACE_BUILDING', { ...point, type })
}

function placeRoadWebsocket(points: Point[]): void {
    sendWithOptions<{ road: Point[] }>('PLACE_ROAD', { road: points })
}

function placeFlagWebsocket(flag: Point): void {
    sendWithOptions<{ flag: Point }>('PLACE_FLAG', { flag })
}


function placeRoadWithFlagWebsocket(flag: Point, points: Point[]): void {
    sendWithOptions<{ flag: Point, road: Point[] }>('PLACE_FLAG_AND_ROAD', { flag, road: points })
}

function removeFlagWebsocket(id: FlagId): void {
    sendWithOptions<{ id: FlagId }>('REMOVE_FLAG', { id })
}

function removeRoadWebsocket(id: RoadId): void {
    sendWithOptions<{ id: RoadId }>('REMOVE_ROAD', { id })
}

function removeBuildingWebsocket(id: HouseId): void {
    sendWithOptions<{ id: HouseId }>('REMOVE_BUILDING', { id })
}

function callScoutWebsocket(point: Point): void {
    sendWithOptions<{ point: Point }>('CALL_SCOUT', { point })
}

function callGeologistWebsocket(point: Point): void {
    sendWithOptions<{ point: Point }>('CALL_GEOLOGIST', { point })
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

function getInformationOnPointLocal(point: Point): PointInformationLocal {
    const canBuild = monitor.availableConstruction.get(point)

    for (const building of monitor.houses.values()) {
        if (building.x === point.x && building.y === point.y) {
            return {
                x: point.x,
                y: point.y,
                canBuild: canBuild ?? [],
                buildingId: building.id,
                is: 'building'
            }
        }
    }

    for (const flag of monitor.flags.values()) {
        if (flag.x === point.x && flag.y === point.y) {
            return {
                x: point.x,
                y: point.y,
                canBuild: canBuild ?? [],
                flagId: flag.id,
                is: 'flag'
            }
        }
    }

    for (const [candidateRoadId, road] of monitor.roads) {
        if (road.points.find(roadPoint => roadPoint.x === point.x && roadPoint.y === point.y)) {
            return {
                x: point.x,
                y: point.y,
                canBuild: canBuild ?? [],
                roadId: candidateRoadId,
                is: 'road'
            }
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
    for (const flag of monitor.flags.values()) {
        if (flag.x === point.x && flag.y === point.y) {
            return flag
        }
    }

    return undefined
}

function getHouseAtPointLocal(point: Point): HouseInformation | undefined {
    for (const house of monitor.houses.values()) {
        if (house.x === point.x && house.y === point.y) {
            return house
        }
    }

    return undefined
}

type InformationOnPointsReply = {
    pointsWithInformation: PointInformation[]
}

async function getInformationOnPoint(point: Point): Promise<PointInformation> {
    const options = { points: [point] }

    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, typeof options>("INFORMATION_ON_POINTS", options)

    return reply.pointsWithInformation[0]
}

async function getInformationOnPoints(points: Point[]): Promise<PointMapFast<PointInformation>> {
    const options = { points }

    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, typeof options>("INFORMATION_ON_POINTS", options)

    const map = new PointMapFast<PointInformation>()

    reply.pointsWithInformation.forEach(pointInformation => map.set({ x: pointInformation.x, y: pointInformation.y }, pointInformation))

    return map
}

function setReservedSoldiers(rank: SoldierType, amount: number): void {
    sendWithOptions<Partial<{ [key in SoldierType]: number }>>('SET_RESERVED_IN_HEADQUARTERS', { [rank]: amount })
}

function addDetailedMonitoring(id: HouseId | FlagId): void {
    sendWithOptions<{ id: HouseId | FlagId }>('START_DETAILED_MONITORING', { id })
}

function removeDetailedMonitoring(houseId: HouseId): void {
    sendWithOptions<{ buildingId: HouseId }>('STOP_DETAILED_MONITORING', { buildingId: houseId })
}

function removeMessage(messageId: GameMessageId): void {
    sendWithOptions<{ messageId: GameMessageId }>('REMOVE_MESSAGE', { messageId })
}

function removeMessages(messages: GameMessage[]): void {
    sendWithOptions<{ messageIds: GameMessageId[] }>('REMOVE_MESSAGES', { messageIds: messages.map(message => message.id) })
}

function getRequestId(): number {
    nextRequestId += 1

    return nextRequestId - 1
}

function listenToFlag(flagId: FlagId, listener: FlagListener): void {
    if (!flagListeners.has(flagId)) {
        flagListeners.set(flagId, [])
    }

    flagListeners.get(flagId)?.push(listener)
}

function stopListeningToGames(listener: GameListListener): void {
    const index = gamesListeners.indexOf(listener)

    if (index > -1) {
        delete gamesListeners[index]
    }
}

function stopListeningToFlag(flagId: FlagId, listener: FlagListener): void {
    const listeners = flagListeners.get(flagId)

    if (listeners) {
        const index = listeners.indexOf(listener)

        if (index > -1) {
            delete listeners[index]
        }
    }
}

function listenToAvailableConstruction(point: Point, listener: AvailableConstructionListener): void {
    if (availableConstructionListeners.has(point)) {
        availableConstructionListeners.set(point, [])
    }

    availableConstructionListeners.get(point)?.push(listener)
}

function stopListeningToAvailableConstruction(point: Point, listener: AvailableConstructionListener) {
    const listeners = availableConstructionListeners.get(point)

    if (listeners) {
        const index = listeners.indexOf(listener)

        if (index > -1) {
            delete listeners[index]
        }
    }
}

function listenToActions(listener: ActionListener) {
    actionListeners.push(listener)
}

function listenToGames(listener: GameListListener): void {
    if (gamesListeningStatus === 'NOT_LISTENING') {
        send('LISTEN_TO_GAME_LIST')

        gamesListeningStatus = 'LISTENING'
    }

    gamesListeners.push(listener)
}

function listenToGameState(listener: GameListener) {
    gameListeners.push(listener)
}

function listenToBurningHouses(listener: HouseBurningListener) {
    houseBurningListeners.push(listener)
}

function killWebsocket(): void {
    websocket?.close()
}

function setCoalQuotas(mint: number, armory: number, ironSmelter: number): void {
    sendWithOptions<{ mint: number, armory: number, ironSmelter: number }>(
        'SET_COAL_QUOTAS',
        { mint, armory, ironSmelter }
    )
}

interface CoalQuotas {
    mint: number
    armory: number
    ironSmelter: number
}

interface FoodQuotas {
    ironMine: number
    coalMine: number
    goldMine: number
    graniteMine: number
}

interface WheatQuotas {
    donkeyFarm: number
    pigFarm: number
    mill: number
    brewery: number
}

interface WaterQuotas {
    bakery: number
    donkeyFarm: number
    pigFarm: number
    brewery: number
}

interface IronBarQuotas {
    armory: number
    metalworks: number
}

function getFoodQuotas(): Promise<FoodQuotas> {
    return sendRequestAndWaitForReply<FoodQuotas>("GET_FOOD_QUOTAS")
}

function setWheatQuotas(donkeyFarm: number, pigFarm: number, mill: number, brewery: number) {
    sendWithOptions<{ donkeyFarm: number, pigFarm: number, mill: number, brewery: number }>(
        'SET_WHEAT_QUOTAS',
        { donkeyFarm, pigFarm, mill, brewery }
    )
}

function getWheatQuotas(): Promise<WheatQuotas> {
    return sendRequestAndWaitForReply<WheatQuotas>("GET_WHEAT_QUOTAS")
}

function getWaterQuotas(): Promise<WaterQuotas> {
    return sendRequestAndWaitForReply<WaterQuotas>("GET_WATER_QUOTAS")
}

function getCoalQuotas(): Promise<CoalQuotas> {
    return sendRequestAndWaitForReply<CoalQuotas>("GET_COAL_QUOTAS")
}

function getIronBarQuotas(): Promise<IronBarQuotas> {
    return sendRequestAndWaitForReply<IronBarQuotas>("GET_IRON_BAR_QUOTAS")
}

function setFoodQuotas(ironMine: number, coalMine: number, goldMine: number, graniteMine: number) {
    sendWithOptions<{ ironMine: number, coalMine: number, goldMine: number, graniteMine: number }>(
        'SET_FOOD_QUOTAS',
        { ironMine, coalMine, goldMine, graniteMine }
    )
}

function setWaterQuotas(bakery: number, donkeyFarm: number, pigFarm: number, brewery: number) {
    sendWithOptions<{ bakery: number, donkeyFarm: number, pigFarm: number, brewery: number }>(
        'SET_WATER_QUOTAS',
        { bakery, donkeyFarm, pigFarm, brewery })
}

function setIronBarQuotas(armory: number, metalworks: number) {
    sendWithOptions<{ armory: number, metalworks: number }>('SET_IRON_BAR_QUOTAS', { armory, metalworks })
}

async function connectAndWaitForConnection(): Promise<void> {
    console.log('Connect and wait until the connection is ready.')

    // Re-use the existing connection if possible
    if (connectionStatus === 'CONNECTED') {
        console.log('Already connected')

        return
    }

    const websocketUrl = makeWsConnectUrl()

    console.info("Websocket url: " + websocketUrl)

    websocket = new WebSocket(websocketUrl)

    connectionStatus = 'CONNECTING'

    websocket.onopen = () => {
        console.info("Websocket for subscription is open")

        connectionStatus = 'CONNECTED'

        gameListeners.forEach(listener => listener.onMonitoringStarted && listener.onMonitoringStarted())
    }

    websocket.onclose = event => {
        console.error('Websocket was closed')
        connectionStatus = 'NOT_CONNECTED'
        websocketDisconnected(event)
    }

    websocket.onerror = event => {
        console.error('Websocket got error')
        connectionStatus = 'NOT_CONNECTED'
        websocketError(event)
    }

    websocket.onmessage = message => websocketMessageReceived(message)

    // Wait for the connection to be established
    await waitForConnection()

    console.log(`Connected. ${connectionStatus}`)
}

type CreateNewGameOptions = {
    name: string
    players: Player[]
}

/**
 * Creates a new game with the given name and players.
 * @param {string} name - The name of the game
 * @param {PlayerInformation[]} players - The players in the game
 * @returns {GameInformation} Metadata about the game
 */
async function createGame(name: string, players: PlayerInformation[]): Promise<GameInformation> {
    const gameInformation = (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, CreateNewGameOptions>('CREATE_GAME', {
        name,
        players
    })).gameInformation

    assignGameInformation(gameInformation)

    return gameInformation
}

function assignGameInformation(gameInformation: GameInformation): void {
    monitor.gameId = gameInformation.id
    monitor.gameName = gameInformation.name
    monitor.gameState = gameInformation.status
    monitor.map = gameInformation.map
    monitor.othersCanJoin = gameInformation.othersCanJoin

    gameInformation.players.forEach(player => monitor.players.set(player.id, player))

}

function pauseGame() {
    send('PAUSE_GAME')
}

function resumeGame(): void {
    send('RESUME_GAME')
}

function getHeight(point: Point): number {
    return monitor.allTiles.get(point)?.height ?? 0
}

function setStrengthWhenPopulatingMilitaryBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING', { strength })
}

async function getStrengthWhenPopulatingMilitaryBuildings(): Promise<number> {
    return await getAmountForCommand('GET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING')
}

function setDefenseStrength(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_DEFENSE_STRENGTH', { strength })
}

async function getDefenseStrength(): Promise<number> {
    return await getAmountForCommand('GET_DEFENSE_STRENGTH')
}

function setDefenseFromSurroundingBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_DEFENSE_FROM_SURROUNDING_BUILDINGS', { strength })
}

async function getDefenseFromSurroundingBuildings(): Promise<number> {
    return await getAmountForCommand('GET_DEFENSE_FROM_SURROUNDING_BUILDINGS')
}

async function getPopulateMilitaryFarFromBorder(): Promise<number> {
    return await getAmountForCommand('GET_POPULATE_MILITARY_FAR_FROM_BORDER')
}

async function getPopulateMilitaryCloserToBorder(): Promise<number> {
    return await getAmountForCommand('GET_POPULATE_MILITARY_CLOSER_TO_BORDER')
}

async function getPopulateMilitaryCloseToBorder(): Promise<number> {
    return await getAmountForCommand('GET_POPULATE_MILITARY_CLOSE_TO_BORDER')
}

async function getAmountForCommand(command: string): Promise<number> {
    const requestId = getRequestId()

    websocket?.send(JSON.stringify(
        {
            command,
            requestId
        }
    ))

    console.log(`Send request: ${command} with id: ${requestId}`)

    return await waitForNumberReply(requestId)
}

async function getMilitarySettings(): Promise<MilitarySettings> {
    return await sendRequestAndWaitForReply<MilitarySettings>("GET_MILITARY_SETTINGS")
}

function waitForNumberReply(requestId: number): Promise<number> {

    // eslint-disable-next-line
    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const reply = replies.get(requestId)

            if (!reply) {
                return
            }

            if (isNumberReplyMessage(reply)) {
                replies.delete(requestId)

                clearInterval(timer)

                console.log(`Got number reply: ${reply.amount}`)

                result(reply.amount)
            }
        }, 10)
    })
}

function sendRequestAndWaitForReplyWithOptions<ReplyType, Options>(command: string, options: Options): Promise<ReplyType> {
    const requestId = getRequestId()

    console.log({
        command,
        requestId,
        ...options
    })

    websocket?.send(JSON.stringify(
        {
            command,
            requestId,
            ...options
        }
    ))

    wsApiDebug.send && console.log(`Send request: ${command} with id: ${requestId}`)

    const timestampSent = (new Date()).getTime()

    // eslint-disable-next-line
    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const timestampSawReply = (new Date()).getTime()

            if (timestampSawReply - timestampSent > MAX_WAIT_FOR_REPLY) {
                clearInterval(timer)
            }

            const reply = replies.get(requestId)

            if (!reply) {

                return
            }

            replies.delete(requestId)

            clearInterval(timer)

            console.log(`Got reply: ${JSON.stringify(reply)} in ${timestampSawReply - timestampSent} ms`)

            result(reply as ReplyType)
        }, 5)
    })
}

function sendRequestAndWaitForReply<ReplyType>(command: string): Promise<ReplyType> {
    const requestId = getRequestId()

    websocket?.send(JSON.stringify(
        {
            command,
            requestId
        }
    ))

    wsApiDebug.send && console.log(`Send request: ${command} with id: ${requestId}`)

    const timestampSent = (new Date()).getTime()

    // eslint-disable-next-line
    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const timestampSawReply = (new Date()).getTime()

            if (timestampSawReply - timestampSent > MAX_WAIT_FOR_REPLY) {
                clearInterval(timer)
            }

            const reply = replies.get(requestId)

            if (!reply) {

                return
            }

            replies.delete(requestId)

            clearInterval(timer)

            console.log(`Got reply: ${JSON.stringify(reply)} in ${timestampSawReply - timestampSent} ms`)

            result(reply as ReplyType)
        }, 5)
    })
}

async function getSoldiersAvailableForAttack(): Promise<number> {
    return await getAmountForCommand('GET_SOLDIERS_AVAILABLE_FOR_ATTACK')
}

function startGame(): void {
    send('START_GAME')
}

function setMap(mapId: MapId): void {
    sendWithOptions<{ mapId: MapId }>('SET_MAP', { mapId })
}

async function setOthersCanJoin(othersCanJoin: boolean): Promise<GameInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { othersCanJoin: boolean }>('SET_OTHERS_CAN_JOIN', { othersCanJoin })
    ).gameInformation
}

function setAvailableResources(resources: ResourceLevel): void {
    sendWithOptions<{ resources: ResourceLevel }>('SET_INITIAL_RESOURCES', { resources })
}

function setTitle(name: string): void {
    sendWithOptions<{ name: string }>('SET_GAME_NAME', { name })
}

function setGameSpeed(speed: GameSpeed): void {
    sendWithOptions<{ speed: GameSpeed }>('SET_GAME_SPEED', { speed })
}

function setMilitaryPopulationFarFromBorder(population: number): void {
    sendWithOptions<{ population: number }>('SET_MILITARY_POPULATION_FAR_FROM_BORDER', { population })
}

function setMilitaryPopulationCloserToBorder(population: number): void {
    sendWithOptions<{ population: number }>('SET_MILITARY_POPULATION_CLOSER_TO_BORDER', { population })
}

function setMilitaryPopulationCloseToBorder(population: number): void {
    sendWithOptions<{ population: number }>('SET_MILITARY_POPULATION_CLOSE_TO_BORDER', { population })
}

function setSoldiersAvailableForAttack(amount: number): void {
    sendWithOptions<{ amount: number }>('SET_SOLDIERS_AVAILABLE_FOR_ATTACK', { amount })
}

function houseAt(point: Point): HouseInformation | undefined {
    return monitor.housesAt.get(point)
}

function upgrade(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>('UPGRADE', { houseId })
}

async function getFlagDebugInfo(flagId: FlagId): Promise<FlagDebugInfo> {
    const options = { flagId }

    return (await sendRequestAndWaitForReplyWithOptions<{ flag: FlagDebugInfo }, typeof options>('FLAG_DEBUG_INFORMATION', options)).flag
}

/**
 * Tells the backend which player the monitor should be connected to. All instructions that don't take a player as an explicit parameter
 * operate on the set player. Internal function that is not exposed outside of the module.
 * @param {PlayerId} playerId - The id of the player.
 * @returns {Promise<PlayerInformation>} Information about the player
 */
async function setPlayerId(playerId: PlayerId): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, { playerId: PlayerId }>('SET_SELF_PLAYER', { playerId })
    ).playerInformation
}

/**
 * Tells the backend what game the monitor should be connected to. All instructions that don't take a game as an explicit parameter
 * operate on the set game. Internal function that is not exposed outside of the module.
 * @param {GameId} gameId - The id of the game
 * @returns {Promise<GameInformation>} Metadata about the game
 */
async function setGame(gameId: GameId): Promise<GameInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { gameId: GameId }>('SET_GAME', { gameId })
    ).gameInformation
}

function sendChatMessageToRoom(text: string, roomId: RoomId, from: PlayerId): void {
    wsApiDebug.send && sendWithOptions<{ text: string, roomId: RoomId, from: PlayerId }>(
        'SEND_CHAT_MESSAGE_TO_ROOM',
        { text, roomId, from }
    )
}

function send(command: string): void {
    wsApiDebug.send && console.log(`SEND: ${command}`)

    websocket?.send(JSON.stringify({ command }))
}

function sendWithOptions<Options>(command: string, options: Options): void {
    wsApiDebug.send && console.log('SEND: ' + JSON.stringify({ command, ...options }))

    websocket?.send(JSON.stringify({ command, ...options }))
}

/**
 * Instructs the backend to start sending updates on any changes to the game visible to the player set through followGame. Internal function that is not exposed outside of the module.
 * @returns {Promise<PlayerViewInformation>} The current view of the game visible to the player.
 */
async function listenToGameViewForPlayer(): Promise<PlayerViewInformation | undefined> {
    return (await sendRequestAndWaitForReply<{ playerView?: PlayerViewInformation }>('START_MONITORING_GAME'))?.playerView
}

/**
 * Starts following a game with the given gameId and from the perspective of the given playerId. All members of the monitor will be kept in sync with the backend.
 *
 * @param {GameId} gameId - The id of the game to follow.
 * @param {PlayerId} playerId - The id of the player.
 * @returns {Promise<GameInformation>} Metadata about the game.
 */
async function followGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation> {
    monitor.gameId = gameId
    monitor.playerId = playerId

    // Register the gameId and playerId with the backend
    await setGame(gameId)
    await setPlayerId(playerId)

    // Start listening to the game's metadata
    const gameInformation = await listenToGameMetadata()

    // Sync the received metadata
    loadGameInformationAndCallListeners(gameInformation)

    // Start listening to the actual game state from the player's point of view
    const playerView = await listenToGameViewForPlayer()

    // Sync the received view
    if (playerView !== undefined) {
        loadPlayerViewAndCallListeners(playerView)
    }

    return gameInformation
}

/**
 * Returns a list of the games available in the backend.
 * @returns {Promise<GameInformation[]} List of all games, regardless of status
 */
async function getGames(): Promise<GameInformation[]> {
    return (await sendRequestAndWaitForReply<{ games: GameInformation[] }>('GET_GAMES')).games
}

async function getMaps(): Promise<MapInformation[]> {
    return (await sendRequestAndWaitForReply<{ maps: MapInformation[] }>('GET_MAPS')).maps
}

async function getGameInformation(): Promise<GameInformation> {
    return (await sendRequestAndWaitForReply<{ gameInformation: GameInformation }>('GET_GAME_INFORMATION')).gameInformation
}

type AddPlayerOptions = Player & { type: PlayerType }
type AddPlayerReply = {
    playerInformation: PlayerInformation
}

async function createPlayer(name: string, color: PlayerColor, nation: Nation, type: PlayerType): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<AddPlayerReply, AddPlayerOptions>('CREATE_PLAYER', { name, color, nation, type })
    ).playerInformation
}

async function addPlayerToGame(playerId: PlayerId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { playerId: PlayerId }>(
        'ADD_PLAYER_TO_GAME',
        { playerId }
    )).gameInformation
}

type UpdatePlayerOptions = { playerId: PlayerId, name: string, color: PlayerColor, nation: Nation }

async function updatePlayer(playerId: PlayerId, name: string, color: PlayerColor, nation: Nation): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, UpdatePlayerOptions>('UPDATE_PLAYER', { playerId, name, color, nation })
    ).playerInformation
}

function removePlayer(playerId: PlayerId): void {
    sendWithOptions<{ playerId: PlayerId }>('REMOVE_PLAYER', { playerId })
}

function waitForGameDataAvailable(): Promise<void> {
    const timestampWaitStarted = (new Date()).getTime()

    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const timestampNow = (new Date()).getTime()

            if (timestampNow - timestampWaitStarted > MAX_WAIT_FOR_CONNECTION) {
                clearInterval(timer)

                console.error('Timed out waiting for game data to be available.')

                reject('Timed out')
            }

            if (monitor.allTiles.size > 0) {
                clearInterval(timer)

                console.log('Game data is available')

                result()
            }
        }, 5)
    })
}

function waitForConnection(): Promise<void> {
    const timestampWaitStarted = (new Date()).getTime()

    return new Promise((result, reject) => {
        const timer = setInterval(() => {
            const timestampNow = (new Date()).getTime()

            if (timestampNow - timestampWaitStarted > MAX_WAIT_FOR_CONNECTION) {
                clearInterval(timer)

                console.error('Failed to connect to websocket backend')

                reject('Timed out')
            }

            if (connectionStatus === 'CONNECTED') {
                clearInterval(timer)

                console.log('Connection is established')

                result()
            }
        }, 5)
    })
}

export {
    getHeadquarterForPlayer,
    monitor
}
