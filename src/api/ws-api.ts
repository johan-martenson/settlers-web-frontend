import { delay, getDirectionForWalkingWorker, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, pointStringToPoint, terrainInformationToTerrainAtPointList } from '../utils/utils'
import { PointMap, PointSet } from '../utils/util_types'
import { WorkerType, GameMessage, HouseId, HouseInformation, Point, VegetationIntegers, GameId, PlayerId, WorkerId, WorkerInformation, ShipId, ShipInformation, FlagId, FlagInformation, RoadId, RoadInformation, TreeId, TreeInformationLocal, CropId, CropInformationLocal, SignId, SignInformation, PlayerInformation, AvailableConstruction, TerrainAtPoint, WildAnimalId, WildAnimalInformation, Decoration, SimpleDirection, Material, BodyType, WorkerAction, DecorationType, TreeInformation, CropInformation, ServerWorkerInformation, StoneInformation, GameMessageId, StoneId, GameState, GameSpeed, FallingTreeInformation, Action, PlayerColor, Nation, GameInformation, MapInformation, ResourceLevel, RoomId, ChatMessage, TransportCategory, Tool, AttackType, SoldierType, PointInformation, AnyBuilding, CheatCode, MapId, MapWithTerrain, PointInformationWithoutPossibleRoadConnections, ToolPriorities, TerrainInformation } from './types'
import { getInformationOnPoint, updatePlayer, getMaps, startGame, getGameInformation, createGame, getGames, removeMessage, removeMessages, getInformationOnPoints, getFlagDebugInfo, setReservedSoldiers, setStrengthWhenPopulatingMilitaryBuildings, setDefenseStrength, setDefenseFromSurroundingBuildings, setMilitaryPopulationFarFromBorder, setMilitaryPopulationCloserToBorder, setMilitaryPopulationCloseToBorder, setSoldiersAvailableForAttack, createPlayer, addPlayerToGame, removePlayer, upgrade, setGameSpeed, setCheating, setTitle, setOthersCanJoin, setMap, getStrengthWhenPopulatingMilitaryBuildings, getDefenseStrength, getDefenseFromSurroundingBuildings, getPopulateMilitaryFarFromBorder, getPopulateMilitaryCloserToBorder, getPopulateMilitaryCloseToBorder, getSoldiersAvailableForAttack, getMilitarySettings, addDetailedMonitoring, removeDetailedMonitoring, setCoalQuotas, setFoodQuotas, setWheatQuotas, setWaterQuotas, setIronBarQuotas, getFoodQuotas, getWheatQuotas, getWaterQuotas, getIronBarQuotas, getCoalQuotas, pauseGame, resumeGame, sendChatMessageToRoom, listenToGameViewForPlayer, getChatRoomHistory, PlayerViewInformation, getViewForPlayer, listenToGameMetadata, listenToGamesList, listenToChatMessages, attackHouse, evacuateHouse, findPossibleNewRoad, deleteGame, disablePromotionsForHouse, resumeProductionForHouse, pauseProductionForHouse, enablePromotionsForHouse, cancelEvacuationForHouse, setTransportPriorityForMaterial, getTerrainForMap, placeRoad, placeFlag, placeRoadWithFlag, removeBuilding, removeFlag, removeRoad, callScout, callGeologist, placeHouse, setInitialResources, getTransportPriority, getStatistics, listenToStatistics, stopListeningToStatistics, markGameMessagesRead, getToolPriorities, setToolPriority, getMap, cheat, listenToPlayer, stopListeningToPlayer, stopSendingOutMaterial, sendOutMaterial, allowDelivery, blockDelivery, getMapsWithTerrain, getMapWithTerrain, stopListeningToGamesList } from './ws/commands'
import { simpleDirectionToCompassDirection } from './utils'
import { addConnectionStatusListener, ConnectionStatus, MAX_WAIT_FOR_CONNECTION, connectAndWaitForConnection, waitForConnection, addMessageListener } from './ws/core'

// Types
type WalkingTimerState = 'RUNNING' | 'NOT_RUNNING'
type GamesListeningState = 'NOT_LISTENING' | 'LISTENING'
type RequestedFollowingState = 'NO_FOLLOW' | 'FOLLOW'
type FollowingState = 'NOT_FOLLOWING' | 'STARTING_TO_FOLLOW' | 'FOLLOWING'

type MonitoredBorderForPlayer = {
    color: PlayerColor
    nation: Nation
    points: PointSet
}

type WalkerTargetChange = {
    id: WorkerId
    x: number
    y: number
    path: Point[]
    percentageTraveled: number
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
    newOwnedLand: Point[]
    removedOwnedLand: Point[]
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

type PlayerChangedMessage = {
    type: 'PLAYER_CHANGED'
    player: PlayerInformation
}

type PlayerViewChanges = {
    time: number
    gameSpeed?: GameSpeed
    newWorkersOutside?: ServerWorkerInformation[]
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
    readMessages?: GameMessage[]
    discoveredDeadTrees?: Point[]
    removedDeadTrees?: Point[]
    removedWildAnimals?: WildAnimalId[]
    removedDecorations?: Point[]
    newDecorations?: PointAndDecoration[]
    removedMessages?: GameMessageId[]
    transportPriority?: TransportCategory[]
    changedToolQuotas?: { [key in Tool]: number }
}

type GameInformationChangedMessage = {
    type: 'GAME_INFO_CHANGED'
    gameInformation: GameInformation
}

type NewChatMessage = {
    type: 'NEW_CHAT_MESSAGES'
    chatMessage: ChatMessage
}

type GameListChangedMessage = {
    type: 'GAME_LIST_CHANGED'
    games: GameInformation[]
}

type StatisticsChangedMessage = {
    type: 'STATISTICS_CHANGED'
    change: ('BUILDINGS' | 'LAND' | 'PRODUCTION')[]
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
let gameTimer: undefined | NodeJS.Timeout

// Listener types
export type GameListListener = (gameInformations: GameInformation[]) => void
export type MessagesListener = (messagesReceived: GameMessage[], messagesRead: GameMessage[], messagesRemoved: GameMessageId[]) => void
export type HouseListener = ((house: HouseInformation) => void)
export type DiscoveredPointListener = (discoveredPoints: PointSet) => void
export type RoadListener = (roadId: RoadId, roadInformation?: RoadInformation) => void
export type RoadsListener = () => void
export type ChatListener = () => void
export type StatisticsListener = () => void
export type TimeListener = (time: number) => void
export type HousesAddedOrRemovedListener = () => void
export type OwnedLandListener = () => void
export type PointInformationListener = (pointInformation: PointInformationWithoutPossibleRoadConnections) => void

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
export type PlayerInformationListener = (playerInformation: PlayerInformation) => void
export type PlayersListener = (players: PlayerInformation[]) => void
export type ToolPrioListener = (quotas: ToolPriorities) => void

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


// Type functions
/**
 * Determines if a message is of type `GameInformationChangedMessage`.
 *
 * @param {unknown} message - The message to check.
 * @returns {message is GameInformationChangedMessage} - Returns `true` if the message is of type `GameInformationChangedMessage`.
 */
function isGameInformationChangedMessage(message: unknown): message is GameInformationChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_INFO_CHANGED'
}

/**
 * Determines if a message is of type `PlayerChangedMessage`.
 *
 * @param {unknown} message - The message to check.
 * @returns {message is PlayerChangedMessage} - Returns `true` if the message is of type `PlayerChangedMessage`.
 */
function isPlayerChangedMessage(message: unknown): message is PlayerChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'PLAYER_CHANGED'
}

/**
 * Determines if a message is of type `GameListChangedMessage`.
 *
 * @param {unknown} message - The message to check.
 * @returns {message is GameListChangedMessage} - Returns `true` if the message is of type `GameListChangedMessage`.
 */
function isGameListChangedMessage(message: unknown): message is GameListChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'GAME_LIST_CHANGED'
}

/**
 * Determines if a message is of type `StatisticsChangedMessage`.
 * @param {unknown} message - The message to check.
 * @returns {message is StatisticsChangedMessage} - Returns `true` if the mesage is of type `StatisticsChangedMessage`
 */
function isStatisticsChangedMessage(message: unknown): message is StatisticsChangedMessage {
    return message != null && typeof message === 'object' && 'type' in message && message.type === 'STATISTICS_CHANGED'
}

/**
 * Determines if a message is of type `NewChatMessage`.
 *
 * @param {unknown} message - The message to check.
 * @returns {message is NewChatMessage} - Returns `true` if the message is of type `NewChatMessage`.
 */
function isChatMessage(message: unknown): message is NewChatMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'NEW_CHAT_MESSAGES'
}

/**
 * Determines if a message is of type `PlayerViewChangedMessage`.
 *
 * @param {unknown} message - The message to check.
 * @returns {message is PlayerViewChangedMessage} - Returns `true` if the message is of type `PlayerViewChangedMessage`.
 */
function isGameChangesMessage(message: unknown): message is PlayerViewChangedMessage {
    return message !== null && typeof message === 'object' && 'type' in message && message.type === 'PLAYER_VIEW_CHANGED'
}

// Constants

// Configuration

// State
let followingSessionId = 0

// Functions
/**
 * Handles changes in the connection status. If the connection is established and the game is being followed,
 * it attempts to sync the local state with the game information and player view from the backend.
 * 
 * @param {ConnectionStatus} connectionStatus - The current status of the connection.
 * @returns {void}
 */
function onConnectionStatusChanged(connectionStatus: ConnectionStatus): void {
    if (connectionStatus === 'CONNECTED' && followingState === 'FOLLOWING') {
        const sessionId = followingSessionId

            ; (async () => {
                try {
                    if (api.gameId === undefined) {
                        throw new Error('Game id is undefined. Cannot sync game information.')
                    }

                    const gameInformation = await getGameInformation(api.gameId)

                    if (
                        sessionId !== followingSessionId ||
                        followingState !== 'FOLLOWING'
                    ) {
                        return
                    }

                    clearAndLoadGameInformationAndCallListeners(gameInformation)

                    if (gameInformation.status !== 'NOT_STARTED') {
                        if (api.playerId === undefined) {
                            throw new Error('Player id is undefined. Cannot sync player view.')
                        }

                        const playerView = await getViewForPlayer(api.playerId, api.gameId)

                        if (
                            sessionId !== followingSessionId ||
                            followingState !== 'FOLLOWING'
                        ) {
                            return
                        }

                        clearAndLoadPlayerViewAndCallListeners(playerView)
                    }
                } catch (error) {
                    if (sessionId !== followingSessionId) {
                        return
                    }

                    console.error(`Failed to sync the game with the backend: ${error}`)

                    api.gameState = 'EXPIRED'

                    gameListeners.forEach(listener => {
                        try {
                            listener.onGameStateChanged && listener.onGameStateChanged('EXPIRED')
                        } catch (e) {
                            console.error(e)
                        }
                    })
                }
            })()
    }
}

/**
 * Handles incoming messages from the WebSocket. Depending on the type of message, it processes game changes, 
 * game information updates, game list updates, or chat messages.
 * 
 * @param {any} message - The received WebSocket message. The type is `any` because the exact structure is validated within the function.
 * @returns {void}
 */
function onMessageReceived(message: unknown): void {
    if (WsApiLogConfig.receive) {
        console.log(`WS API: WS API: Got message: ${JSON.stringify(message)}`)
    }

    if (message === undefined) {
        console.error(`Got an undefined message: ${message}`)
    }

    try {
        if (isPlayerChangedMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling player changed message')
            }

            handlePlayerChangedMessage(message.player)
        } else if (isGameChangesMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling player view changed message')
            }

            loadPlayerViewChangesAndCallListeners(message.playerViewChanges)
        } else if (isGameInformationChangedMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling game information changed message')
            }

            handleGameInformationChangedMessage(message.gameInformation)
        } else if (isGameListChangedMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling game list changed messgae')
            }

            receivedGameListChangedMessage(message)
        } else if (isChatMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling chat message')
            }

            loadChatMessage(message.chatMessage)
        } else if (isStatisticsChangedMessage(message)) {
            if (WsApiLogConfig.receive) {
                console.log('WS API: Handling statistics changed message')
            }

            handleUpdatedStatistics(message)
        } else {
            console.error(`Do not know how to handle this: ${JSON.stringify(message)}`)
        }
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e))
        console.info(message)
    }
}

/**
 * Checks if a specific construction is available at a given point.
 * 
 * @param {Point} point - The point to check for construction availability.
 * @param {'FLAG'} whatToBuild - The type of construction to check availability for (e.g., 'FLAG').
 * @returns {boolean} - Returns `true` if the construction is available at the point, otherwise `false`.
 */
function isAvailable(point: Point, whatToBuild: 'FLAG'): boolean {
    return whatToBuild === 'FLAG' && (api.availableConstruction.get(point)?.includes('FLAG') ?? false)
}

/**
 * Gets the height of the terrain at a specific point.
 * 
 * @param {Point} point - The point to retrieve the height from.
 * @returns {number} - The height of the terrain at the given point. Returns `0` if the point is not found.
 */
function getHeight(point: Point): number {
    return api.allTiles.get(point)?.height ?? 0
}

/**
 * Retrieves information about a house located at a specific point, if any.
 * 
 * @param {Point} point - The point to check for a house.
 * @returns {HouseInformation | undefined} - The house information at the given point, or `undefined` if no house is present.
 */
function houseAt(point: Point): HouseInformation | undefined {
    return api.housesAt.get(point)
}

/**
 * Retrieves local information on a specific point, including what can be built and what is present.
 * 
 * @param {Point} point - The point to retrieve information about.
 * @returns {PointInformationWithoutPossibleRoadConnections} - Returns an object containing details about what can be built and what is currently present at the point.
 */
function getInformationOnPointLocal(point: Point): PointInformationWithoutPossibleRoadConnections {
    const canBuild = api.availableConstruction.get(point)

    const house = Array.from(api.houses.values())
        .find(house => house.x === point.x && house.y === point.y)

    if (house) {
        return {
            ...point,
            canBuild: canBuild ?? [],
            buildingId: house.id,
            is: 'BUILDING'
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
            is: 'FLAG'
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
            is: 'ROAD'
        }
    }

    return {
        x: point.x,
        y: point.y,
        canBuild: canBuild ?? [],
        is: undefined
    }
}


// Functions

/**
 * Retrieves flag information located at a specific point, if any.
 * 
 * @param {Point} point - The point to check for a flag.
 * @returns {FlagInformation | undefined} - The flag information at the given point, or `undefined` if no flag is present.
 */
function getFlagAtPointLocal(point: Point): FlagInformation | undefined {
    return Array.from(api.flags.values()).find(flag => flag.x === point.x && flag.y === point.y)
}

/**
 * Retrieves house information located at a specific point, if any.
 * 
 * @param {Point} point - The point to check for a house.
 * @returns {HouseInformation | undefined} - The house information at the given point, or `undefined` if no house is present.
 */
function getHouseAtPointLocal(point: Point): HouseInformation | undefined {
    return Array.from(api.houses.values()).find(house => house.x === point.x && house.y === point.y)
}


// Monitoring


// Constants


// Configuration
export const WsApiLogConfig = {
    receive: false,
    following: false,
    timers: false
}


// State
let gameTickLength = 200;

let gamesListeningStatus: GamesListeningState = 'NOT_LISTENING'
let walkingTimerState: WalkingTimerState = 'NOT_RUNNING'
let requestedFollowingState: RequestedFollowingState = 'NO_FOLLOW'
let followingState: FollowingState = 'NOT_FOLLOWING'

const api = {
    time: 0,
    gameId: undefined as GameId | undefined,
    playerId: undefined as PlayerId | undefined,
    othersCanJoin: undefined as boolean | undefined,
    initialResources: undefined as ResourceLevel | undefined,
    cheatingEnabled: undefined as boolean | undefined,
    maps: new Map<MapId, MapWithTerrain>(),
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
    discoveredPoints: new PointSet(),
    signs: new Map<SignId, SignInformation>(),
    players: new Map<PlayerId, PlayerInformation>(),
    availableConstruction: new PointMap<AvailableConstruction[]>(),
    messages: new Map<GameMessageId, GameMessage>(),
    allTiles: new PointMap<TerrainAtPoint>(),
    discoveredBelowTiles: new Set<TileBelow>(),
    discoveredDownRightTiles: new Set<TileDownRight>(),
    pointsWithBelowTileDiscovered: new PointSet(),
    pointsWithDownRightTileDiscovered: new PointSet(),
    deadTrees: new PointSet(),
    wildAnimals: new Map<WildAnimalId, WildAnimalInformation>(),
    decorations: new PointMap<Decoration>(),
    gameState: 'NOT_STARTED' as GameState,
    gameSpeed: 'NORMAL' as GameSpeed,
    gameName: '',
    chatRoomMessages: [] as ChatMessage[],
    transportPriority: undefined as TransportCategory[] | undefined,

    housesAt: new PointMap<HouseInformation>(),

    localRemovedFlags: new Map<FlagId, FlagInformation>(),
    localRemovedRoads: new Map<RoadId, RoadInformation>(),

    // Connection
    connectAndWaitForConnection,
    waitForConnection,

    // Games
    getGames,
    addGamesListener,
    removeGamesListener,
    removeGameStateListener,

    // Maps
    getMap,
    getMaps,
    getMapsWithTerrain: async () => {
        const maps = await getMapsWithTerrain()

        if (maps !== undefined) {
            maps.forEach(map => {
                api.maps.set(map.id, map)
            })
        }

        return maps
    },

    // Map
    getTerrainForMap,
    getMapWithTerrain: async (mapId: MapId) => {
        const localMap = api.maps.get(mapId)

        if (localMap !== undefined) {
            return localMap
        }

        const remoteMap = await getMapWithTerrain(mapId)
        if (remoteMap !== undefined) {
            api.maps.set(mapId, remoteMap)
        }

        return remoteMap
    },

    // Game
    createGame,
    startGame,
    pauseGame,
    resumeGame,
    deleteGame,
    waitForGameDataAvailable,
    getGameInformation: () => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot get game information.')
        }

        return getGameInformation(api.gameId)
    },
    addGameStateListener,
    isGameDataAvailable,
    addPlayerToGame,
    setGameSpeed: (speed: GameSpeed) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set game speed.')
        }

        setGameSpeed(speed, api.gameId)
    },
    setTitle: (title: string) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set title.')
        }

        setTitle(title, api.gameId)
    },
    setInitialResources: (resources: ResourceLevel) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set initial resources.')
        }

        setInitialResources(resources, api.gameId)
    },
    setOthersCanJoin: (canJoin: boolean) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set others can join.')
        }

        setOthersCanJoin(canJoin, api.gameId)
    },
    setMap: (mapId: string) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set map.')
        }

        setMap(mapId, api.gameId)
    },
    getStatistics: () => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot get statistics.')
        }

        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get statistics.')
        }

        return getStatistics(api.gameId, api.playerId)
    },
    addStatisticsListener,
    removeStatisticsListener,
    addTimeListener,
    removeTimeListener,
    followGame,
    stopFollowingGame,
    setCheating: (enabled: boolean) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot set cheating.')
        }

        setCheating(enabled, api.gameId)
    },

    // Player
    createPlayer,
    updatePlayer,
    removePlayer: (playerId: PlayerId) => {
        if (api.gameId === undefined) {
            throw new Error('Game id is undefined. Cannot remove player.')
        }

        removePlayer(playerId, api.gameId)
    },
    addActionsListener,
    removeActionsListener,
    addDiscoveredPointsListener,
    removeDiscoveredPointsListener,
    addOwnedLandListener,
    removeOwnedLandListener,
    addMessagesListener,
    removeMessagesListener,
    removeMessage: (messageId: GameMessageId) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot remove message.')
        }

        removeMessage(messageId, api.playerId)
    },
    removeMessages: (messageIds: GameMessageId[]) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot remove messages.')
        }

        removeMessages(messageIds, api.playerId)
    },
    markGameMessagesRead: (messageIds: GameMessageId[]) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot mark messages read.')
        }

        markGameMessagesRead(messageIds, api.playerId)
    },
    getTransportPriority: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get transport priority.')
        }

        return getTransportPriority(api.playerId)
    },
    setTransportPriorityForMaterial: (category: TransportCategory, priority: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set transport priority.')
        }

        setTransportPriorityForMaterial(api.playerId, category, priority)
    },
    addTransportPriorityListener,
    removeTransportPriorityListener,
    addPlayerInformationListener,
    removePlayerInformationListener,
    addPlayersListener,
    removePlayersListener,
    addToolPrioListener,
    removeToolPrioListener,
    getToolPriorities: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get tool priorities.')
        }

        return getToolPriorities(api.playerId)
    },
    setToolPriority: (tool: Tool, priority: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set tool priority.')
        }

        setToolPriority(api.playerId, tool, priority)
    },
    cheat: (cheatCode: CheatCode) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set cheat.')
        }

        cheat(cheatCode, api.playerId)
    },

    // Player - military
    setReservedSoldiers: (rank: SoldierType, amount: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set reserved soldiers.')
        }

        setReservedSoldiers(rank, amount, api.playerId)
    },
    setStrengthWhenPopulatingMilitaryBuildings: (strength: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set strength when populating military buildings.')
        }

        setStrengthWhenPopulatingMilitaryBuildings(strength, api.playerId)
    },
    setDefenseStrength: (defense: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set defense strength.')
        }

        setDefenseStrength(defense, api.playerId)
    },
    setDefenseFromSurroundingBuildings: (defense: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set defense from surrounding buildings.')
        }

        setDefenseFromSurroundingBuildings(defense, api.playerId)
    },
    setMilitaryPopulationFarFromBorder: (population: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set military population far from border.')
        }

        setMilitaryPopulationFarFromBorder(population, api.playerId)
    },
    setMilitaryPopulationCloserToBorder: (population: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set military population closer to border.')
        }

        setMilitaryPopulationCloserToBorder(population, api.playerId)
    },
    setMilitaryPopulationCloseToBorder: (population: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set military population close to border.')
        }

        setMilitaryPopulationCloseToBorder(population, api.playerId)
    },
    setSoldiersAvailableForAttack: (soldiers: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set soldiers available for attack.')
        }

        setSoldiersAvailableForAttack(soldiers, api.playerId)
    },

    getStrengthWhenPopulatingMilitaryBuildings,
    getDefenseStrength: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get defense strength.')
        }

        return getDefenseStrength(api.playerId)
    },
    getDefenseFromSurroundingBuildings: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get defense from surrounding buildings.')
        }

        return getDefenseFromSurroundingBuildings(api.playerId)
    },
    getPopulateMilitaryFarFromBorder: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get military population far from border.')
        }

        return getPopulateMilitaryFarFromBorder(api.playerId)
    },
    getPopulateMilitaryCloserToBorder: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get military population closer to border.')
        }

        return getPopulateMilitaryCloserToBorder(api.playerId)
    },
    getPopulateMilitaryCloseToBorder: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get military population close to border.')
        }

        return getPopulateMilitaryCloseToBorder(api.playerId)
    },
    getSoldiersAvailableForAttack: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get soldiers available for attack.')
        }

        return getSoldiersAvailableForAttack(api.playerId)
    },
    getMilitarySettings: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get military settings.')
        }

        return getMilitarySettings(api.playerId)
    },

    // Player - quotas
    setCoalQuotas: (mint: number, armory: number, ironSmelter: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set coal quotas.')
        }

        setCoalQuotas(mint, armory, ironSmelter, api.playerId)
    },
    setFoodQuotas: (ironMine: number, coalMine: number, goldMine: number, graniteMine: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set food quotas.')
        }

        setFoodQuotas(ironMine, coalMine, goldMine, graniteMine, api.playerId)
    },
    setWheatQuotas: (donkeyFarm: number, pigFarm: number, mill: number, brewery: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set wheat quotas.')
        }

        setWheatQuotas(donkeyFarm, pigFarm, mill, brewery, api.playerId)
    },
    setWaterQuotas: (bakery: number, donkeyFarm: number, pigFarm: number, brewery: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set water quotas.')
        }

        setWaterQuotas(bakery, donkeyFarm, pigFarm, brewery, api.playerId)
    },
    setIronBarQuotas: (armory: number, metalworks: number) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot set iron bar quotas.')
        }

        setIronBarQuotas(armory, metalworks, api.playerId)
    },
    getFoodQuotas: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get food quotas.')
        }

        return getFoodQuotas(api.playerId)
    },
    getWheatQuotas: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get wheat quotas.')
        }

        return getWheatQuotas(api.playerId)
    },
    getWaterQuotas: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get water quotas.')
        }

        return getWaterQuotas(api.playerId)
    },
    getIronBarQuotas: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get iron bar quotas.')
        }

        return getIronBarQuotas(api.playerId)
    },
    getCoalQuotas: () => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get coal quotas.')
        }

        return getCoalQuotas(api.playerId)
    },

    // Houses
    addBurningHousesListener,
    removeBurningHousesListener,

    // House
    placeHouse: (type: AnyBuilding, point: Point) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot place house.')
        }

        return placeHouse(type, point, api.playerId)
    },
    removeBuilding,
    getHouseAtPointLocal,
    upgrade,
    houseAt,
    attackHouse: (houseId: HouseId, attackers: number, attackType: AttackType) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot attack house.')
        }

        return attackHouse(houseId, attackers, attackType, api.playerId)
    },
    evacuateHouse,
    pauseProductionForHouse,
    resumeProductionForHouse,
    disablePromotionsForHouse,
    enablePromotionsForHouse,
    cancelEvacuationForHouse,
    addHouseListener,
    removeHouseListener,
    addHousesAddedOrRemovedListener,
    removeHousesAddedOrRemovedListener,

    // House - headquarters
    blockDelivery,
    allowDelivery,
    sendOutMaterial,
    stopSendingOutMaterial,

    // Flags

    // Flag
    placeFlag: (flag: Point) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot place flag.')
        }

        return placeFlag(flag, api.playerId)
    },
    removeFlag,
    getFlagAtPointLocal,
    getFlagDebugInfo: (flagId: FlagId) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get flag debug info.')
        }

        return getFlagDebugInfo(flagId, api.playerId)
    },
    callScout: (point: Point) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot call scout.')
        }

        return callScout(point, api.playerId)
    },
    callGeologist: (point: Point) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot call geologist.')
        }

        return callGeologist(point, api.playerId)
    },
    addFlagListener,
    removeFlagListener,

    // Road
    placeRoad: (points: Point[]) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot place road.')
        }

        return placeRoad(points, api.playerId)
    },
    placeRoadWithFlag: (flag: Point, points: Point[]) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot place road with flag.')
        }

        return placeRoadWithFlag(flag, points, api.playerId)
    },
    placeLocalRoad,
    removeRoad,
    removeLocalRoad,
    addRoadListener,
    removeRoadListener,
    addRoadsListener,
    removeRoadsListener,

    // Point
    getInformationOnPointLocal,
    getInformationOnPoint: (point: Point): Promise<PointInformation> => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get information on point.')
        }

        return getInformationOnPoint(point, api.playerId)
    },
    getInformationOnPoints: (points: Point[]): Promise<PointMap<PointInformation>> => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot get information on points.')
        }

        return getInformationOnPoints(points, api.playerId)
    },
    getHeight,
    addPointInformationListener,
    removePointInformationListener,

    // Chat messages
    sendChatMessageToRoom,
    addChatMessagesListener,
    removeChatMessagesListener,

    // Construction
    findPossibleNewRoad: (from: Point, to: Point, avoid: Point[] | undefined) => {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot find possible new road.')
        }

        return findPossibleNewRoad(from, to, avoid, api.playerId)
    },
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
const roadListeners = new Map<RoadId, Set<RoadListener>>()
const roadsListeners: Set<RoadsListener> = new Set<RoadsListener>()
const availableConstructionListeners = new PointMap<Set<AvailableConstructionListener>>()
const actionListeners: Set<ActionListener> = new Set<ActionListener>()
const houseBurningListeners: Set<HouseBurningListener> = new Set<HouseBurningListener>()
const gameListeners: Set<GameListener> = new Set<GameListener>()
const gamesListeners: Set<GameListListener> = new Set<GameListListener>()
const workerMovedListeners: Set<WorkerMoveListener> = new Set<WorkerMoveListener>()
const chatListeners: Set<ChatListener> = new Set<ChatListener>()
const statisticsListeners: Map<StatisticsListener, PlayerId> = new Map()
const flagListeners: Map<FlagId, Set<FlagListener>> = new Map<FlagId, Set<FlagListener>>()
const transportPriorityListeners: Set<TransportPriorityListener> = new Set()
const timeListeners: Set<TimeListener> = new Set()
const playerInformationListeners: Map<PlayerId, Set<PlayerInformationListener>> = new Map()
const playersListeners: Map<GameId, Set<PlayersListener>> = new Map<GameId, Set<PlayersListener>>()
const toolPrioListeners: Set<ToolPrioListener> = new Set()
const housesAddedOrRemovedListeners: Set<HousesAddedOrRemovedListener> = new Set()
const ownedLandListeners: Set<OwnedLandListener> = new Set()
const pointInformationListeners = new PointMap<Set<PointInformationListener>>()


// State - misc
const objectsWithDetailedMonitoring = new Set<HouseId | FlagId>()


// Initialization
addConnectionStatusListener(onConnectionStatusChanged)
addMessageListener(onMessageReceived)


// Functions exposed as part of WS API
// Functions to add/remove listeners
/**
 * Adds a listener for changes to a point.
 * @param {PointInformationListener} listener - The listener to add
 */
function addPointInformationListener(point: Point, listener: PointInformationListener): void {
    if (!pointInformationListeners.has(point)) {
        pointInformationListeners.set(point, new Set())
    }

    pointInformationListeners.get(point)?.add(listener)
}

/** Removes a listener for changes to a point.
 * @param {PointInformationListener} listener - The listener to remove
 */
function removePointInformationListener(point: Point, listener: PointInformationListener): void {
    pointInformationListeners.get(point)?.delete(listener)
}

/**
 * Adds a listener for messages.
 * 
 * @param {MessagesListener} listener - The listener to add.
 * @returns {void}
 */
function addMessagesListener(listener: MessagesListener): void {
    messageListeners.add(listener)
}

/**
 * Removes a listener for messages.
 * 
 * @param {MessagesListener} listener - The listener to remove.
 * @returns {void}
 */
function removeMessagesListener(listener: MessagesListener): void {
    messageListeners.delete(listener)
}

/**
 * Removes a listener for roads.
 * 
 * @param {RoadsListener} listener - The listener to remove.
 * @returns {void}
 */
function removeRoadsListener(listener: RoadsListener): void {
    roadsListeners.delete(listener)
}

/**
 * Removes a listener for game state changes.
 * 
 * @param {GameListener} listener - The listener to remove.
 * @returns {void}
 */
function removeGameStateListener(listener: GameListener): void {
    gameListeners.delete(listener)
}

/**
 * Removes a listener for worker movement.
 * 
 * @param {WorkerMoveListener} listener - The listener to remove.
 * @returns {void}
 */
function removeMovementForWorkerListener(listener: WorkerMoveListener): void {
    workerMovedListeners.delete(listener)
}

/**
 * Adds a listener for chat messages in specific rooms for a player.
 * 
 * @param {ChatListener} listener - The listener to add.
 * @param {PlayerId} playerId - The ID of the player.
 * @param {RoomId[]} roomIds - The IDs of the rooms to listen to.
 * @returns {void}
 */
function addChatMessagesListener(listener: ChatListener, playerId: PlayerId, roomIds: RoomId[]): void {
    listenToChatMessages(playerId, roomIds)

    chatListeners.add(listener)
}

/**
 * Adds a listener for changes in game stats.
 *
 * @param {StatisticsListener} listener - The listener to add
 * @param {PlayerId} playerId - The id of the player
 */
function addStatisticsListener(listener: StatisticsListener, playerId: PlayerId): void {
    if (statisticsListeners.values().find(id => id === playerId) === undefined) {
        listenToStatistics(playerId)
    }

    statisticsListeners.set(listener, playerId)
}

/**
 * Adds a listener for changes in game time.
 *
 * @param {TimeListener} listener - The listener to add
 */
function addTimeListener(listener: TimeListener): void {
    timeListeners.add(listener)
}

/**
 * Removes the given time listener.
 * @param {TimeListener} listener - The listener to remove
 */
function removeTimeListener(listener: TimeListener): void {
    timeListeners.delete(listener)
}

/**
 * Removes a listener for changes in game stats.
 *
 * @param {StatisticsListener} listener - The listener to remove
 */
function removeStatisticsListener(listener: StatisticsListener): void {
    const playerId = statisticsListeners.get(listener)

    statisticsListeners.delete(listener)

    if (playerId !== undefined && !statisticsListeners.values().find(id => id === playerId)) {
        stopListeningToStatistics(playerId)
    }
}

/**
 * Removes a listener for chat messages.
 * 
 * @param {ChatListener} listener - The listener to remove.
 * @returns {void}
 */
function removeChatMessagesListener(listener: ChatListener): void {
    chatListeners.delete(listener)
}

/**
 * Adds a listener for worker movement.
 * 
 * @param {WorkerMoveListener} listener - The listener to add.
 * @returns {void}
 */
function addMovementForWorkerListener(listener: WorkerMoveListener): void {
    workerMovedListeners.add(listener)
}

/**
 * Adds a listener for transport priority changes.
 * 
 * @param {TransportPriorityListener} listener - The listener to add.
 * @returns {void}
 */
function addTransportPriorityListener(listener: TransportPriorityListener): void {
    transportPriorityListeners.add(listener)
}

/**
 * Removes a listener for transport priority changes.
 * 
 * @param {TransportPriorityListener} listener - The listener to remove.
 * @returns {void}
 */
function removeTransportPriorityListener(listener: TransportPriorityListener): void {
    transportPriorityListeners.delete(listener)
}

/**
 * Adds a listener that receives updates when information about the given player is changed.
 *
 * @param {PlayerId} playerId - The id of the player to listen to
 * @param {PlayerInformationListener} listener - The function that will be called
 */
function addPlayerInformationListener(playerId: PlayerId, listener: PlayerInformationListener): void {
    if (!playerInformationListeners.has(playerId)) {
        playerInformationListeners.set(playerId, new Set())

        listenToPlayer(playerId)
    }

    playerInformationListeners.get(playerId)?.add(listener)
}

/**
 * Removes a listener for player information
 *
 * @param {PlayerId} playerId - The id of the player
 * @param {PlayerInformationListener} listener - The function that is called when changes are done
 */
function removePlayerInformationListener(playerId: PlayerId, listener: PlayerInformationListener): void {
    const listenersForPlayer = playerInformationListeners.get(playerId)

    if (listenersForPlayer) {
        listenersForPlayer.delete(listener)

        if (listenersForPlayer.size === 0) {
            stopListeningToPlayer(playerId)
        }
    } else {
        console.warn(`Tried to remove a player information listener for player ${playerId}, but there are no listeners for this player.`)
    }
}

function addPlayersListener(listener: PlayersListener, gameId: GameId): void {
    if (!playersListeners.has(gameId)) {
        playersListeners.set(gameId, new Set())
    }

    playersListeners.get(gameId)?.add(listener)
}

function removePlayersListener(listener: PlayersListener, gameId: GameId): void {
    playersListeners.get(gameId)?.delete(listener)
}

function addToolPrioListener(listener: ToolPrioListener): void {
    toolPrioListeners.add(listener)
}

function removeToolPrioListener(listener: ToolPrioListener): void {
    toolPrioListeners.delete(listener)
}

/**
 * Adds a listener for a specific house's changes.
 * 
 * @param {HouseId} houseId - The ID of the house.
 * @param {HouseListener} houseListener - The listener to add.
 * @returns {void}
 */
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
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot add detailed monitoring for house.')
        }

        addDetailedMonitoring(houseId, api.playerId)

        objectsWithDetailedMonitoring.add(houseId)
    }
}

/**
 * Removes a listener for a specific house's changes.
 * 
 * @param {HouseId} houseId - The ID of the house.
 * @param {HouseListener} houseListener - The listener to remove.
 * @returns {void}
 */
function removeHouseListener(houseId: HouseId, houseListener: HouseListener): void {
    const listenersForHouse = houseListeners.get(houseId)

    if (listenersForHouse) {
        houseListeners.get(houseId)?.delete(houseListener)

        if (listenersForHouse.size === 0) {
            if (api.playerId === undefined) {
                throw new Error('Player id is undefined. Cannot remove detailed monitoring for house.')
            }

            removeDetailedMonitoring(houseId, api.playerId)

            objectsWithDetailedMonitoring.delete(houseId)
        }
    }
}

/**
 * Adds a listener for discovered points.
 * 
 * @param {DiscoveredPointListener} listener - The listener to add.
 * @returns {void}
 */
function addDiscoveredPointsListener(listener: DiscoveredPointListener): void {
    discoveredPointListeners.add(listener)
}

/**
 * Removes a listener for discovered points.
 * 
 * @param {DiscoveredPointListener} listener - The listener to remove.
 * @returns {void}
 */
function removeDiscoveredPointsListener(listener: DiscoveredPointListener): void {
    discoveredPointListeners.delete(listener)
}

/**
 * Add a listener for owned land.
 * 
 * @param {OwnedLandListener} listener - The listener to add.
 * @returns {void}
 */
function addOwnedLandListener(listener: OwnedLandListener): void {
    ownedLandListeners.add(listener)
}

/**
 * Removes a listener for onwed land.
 * 
 * @param {OwnedLandListener} listener - The listener to remove.
 * @returns {void}
 */
function removeOwnedLandListener(listener: OwnedLandListener): void {
    ownedLandListeners.delete(listener)
}

/**
 * Adds a listener for updates for the given road.
 * @param {RoadId} roadId - The id of the road.
 * @param {RoadListener} roadListener - The listening callback.
 * @return {void}
 */
function addRoadListener(roadId: RoadId, listener: RoadListener): void {
    let listenersForRoad = roadListeners.get(roadId)

    if (!listenersForRoad) {
        listenersForRoad = new Set()

        roadListeners.set(roadId, listenersForRoad)
    }

    listenersForRoad.add(listener)
}

/**
 * Removes a listener for updates for the given road.
 * @param {RoadId} roadId - The id of the road.
 * @param {RoadListener} listener - The listener to remove.
 */
function removeRoadListener(roadId: RoadId, listener: RoadListener): void {
    roadListeners.get(roadId)?.delete(listener)
}

/**
 * Adds a listener for road updates.
 * 
 * @param {RoadsListener} listener - The listener to add.
 * @returns {void}
 */
function addRoadsListener(listener: RoadsListener): void {
    roadsListeners.add(listener)
}

/**
 * Adds a listener for adding or removing houses
 * @param {HousesAddedOrRemovedListener} listener - The listener to add.
 * @returns {void}
 */
function addHousesAddedOrRemovedListener(listener: HousesAddedOrRemovedListener): void {
    housesAddedOrRemovedListeners.add(listener)
}

/**
 * Removes a listener for adding or removing houses
 * 
 * @param {HousesAddedOrRemovedListener} - The listener to remove.
 * @returns {void}
 */
function removeHousesAddedOrRemovedListener(listener: HousesAddedOrRemovedListener): void {
    housesAddedOrRemovedListeners.delete(listener)
}


/**
 * Adds a listener for a specific flag's changes.
 * 
 * @param {FlagId} flagId - The ID of the flag.
 * @param {FlagListener} listener - The listener to add.
 * @returns {void}
 */
function addFlagListener(flagId: FlagId, listener: FlagListener): void {

    // Add the listener
    if (!flagListeners.has(flagId)) {
        flagListeners.set(flagId, new Set())
    }

    flagListeners.get(flagId)?.add(listener)

    // Add detailed monitoring
    if (!objectsWithDetailedMonitoring.has(flagId)) {
        if (api.playerId === undefined) {
            throw new Error('Player id is undefined. Cannot add detailed monitoring for flag.')
        }

        addDetailedMonitoring(flagId, api.playerId)

        objectsWithDetailedMonitoring.add(flagId)
    }
}

/**
 * Removes a listener for game list updates.
 * 
 * @param {GameListListener} listener - The listener to remove.
 * @returns {void}
 */
function removeGamesListener(listener: GameListListener): void {
    gamesListeners.delete(listener)

    if (gamesListeners.size === 0 && gamesListeningStatus === 'LISTENING') {
        stopListeningToGamesList()

        gamesListeningStatus = 'NOT_LISTENING'
    }
}

/**
 * Removes a listener for a specific flag's changes.
 * 
 * @param {FlagId} flagId - The ID of the flag.
 * @param {FlagListener} listener - The listener to remove.
 * @returns {void}
 */
function removeFlagListener(flagId: FlagId, listener: FlagListener): void {
    const listeners = flagListeners.get(flagId)

    if (listeners) {
        flagListeners.get(flagId)?.delete(listener)

        if (listeners.size === 0) {
            if (api.playerId === undefined) {
                throw new Error('Player id is undefined. Cannot remove detailed monitoring for flag.')
            }

            removeDetailedMonitoring(flagId, api.playerId)

            objectsWithDetailedMonitoring.delete(flagId)
        }
    }
}

/**
 * Adds a listener for available construction changes at a specific point.
 * 
 * @param {Point} point - The point to monitor.
 * @param {AvailableConstructionListener} listener - The listener to add.
 * @returns {void}
 */
function addAvailableConstructionListener(point: Point, listener: AvailableConstructionListener): void {
    if (!availableConstructionListeners.has(point)) {
        availableConstructionListeners.set(point, new Set())
    }

    availableConstructionListeners.get(point)?.add(listener)
}

/**
 * Removes a listener for available construction changes at a specific point.
 * 
 * @param {Point} point - The point to stop monitoring.
 * @param {AvailableConstructionListener} listener - The listener to remove.
 * @returns {void}
 */
function removeAvailableConstructionListener(point: Point, listener: AvailableConstructionListener): void {
    availableConstructionListeners.get(point)?.delete(listener)
}

/**
 * Adds a listener for player actions.
 * 
 * @param {ActionListener} listener - The listener to add.
 * @returns {void}
 */
function addActionsListener(listener: ActionListener): void {
    actionListeners.add(listener)
}

/**
 * Removes a listener for player actions.
 * 
 * @param {ActionListener} listener - The listener to remove.
 * @returns {void}
 */
function removeActionsListener(listener: ActionListener): void {
    actionListeners.delete(listener)
}

/**
 * Adds a listener for game list updates. If not currently listening, it will start listening.
 * 
 * @param {GameListListener} listener - The listener to add.
 * @returns {void}
 */
function addGamesListener(listener: GameListListener): void {
    if (gamesListeningStatus === 'NOT_LISTENING') {
        listenToGamesList()

        gamesListeningStatus = 'LISTENING'
    }

    gamesListeners.add(listener)
}

/**
 * Adds a listener for game state changes.
 * 
 * @param {GameListener} listener - The listener to add.
 * @returns {void}
 */
function addGameStateListener(listener: GameListener): void {
    gameListeners.add(listener)
}

/**
 * Adds a listener for houses that start or stop burning.
 * 
 * @param {HouseBurningListener} listener - The listener to add.
 * @returns {void}
 */
function addBurningHousesListener(listener: HouseBurningListener): void {
    houseBurningListeners.add(listener)
}

/**
 * Removes a listener for houses that start or stop burning.
 * 
 * @param {HouseBurningListener} listener - The listener to remove.
 * @returns {void}
 */
function removeBurningHousesListener(listener: HouseBurningListener): void {
    houseBurningListeners.delete(listener)
}

// Functions used within WS API

// Functions used within monitoring
/**
 * Handles the game information changed message.
 * 
 * @param {GameInformation} gameInformation - The updated game information.
 */
function handleGameInformationChangedMessage(gameInformation: GameInformation): void {
    // FIXME: it looks like this function can end up calling listeners three times. That's crazy...

    if (api.gameState === 'NOT_STARTED' && gameInformation.status !== 'NOT_STARTED') {
        (async () => {
            if (api.playerId === undefined || api.gameId === undefined) {
                throw new Error(`Player id (${api.playerId}) or game id (${api.gameId}) is undefined. Cannot load player view.`)
            }

            loadPlayerViewAndCallListeners(await getViewForPlayer(api.playerId, api.gameId))

            gameListeners.forEach(listener => {
                try {
                    listener.onMonitoringStarted && listener.onMonitoringStarted()
                } catch (e) {
                    console.error(e)
                }
            })
        }
        )()
    }

    loadGameInformationAndCallListeners(gameInformation)
}

/**
 * Loads the player view information and notifies all relevant listeners.
 * 
 * @param {PlayerViewInformation} message - The player view information to load.
 */
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
            console.error('UNKNOWN PLAYER: ' + borderInformation.playerId)

            continue
        }

        api.border.set(borderInformation.playerId,
            {
                color: player.color,
                nation: player.nation,
                points: new PointSet(borderInformation.points)
            }
        )
    }

    // Convert the terrain to a point-list format and store it
    const terrainPointList = terrainInformationToTerrainAtPointList(message as TerrainInformation)

    terrainPointList.forEach(terrainAtPoint => api.allTiles.set(terrainAtPoint.point, terrainAtPoint))

    storeDiscoveredTiles(api.discoveredPoints)

    // Call the listeners after all the data has been set
    discoveredPointListeners.forEach(listener => {
        try {
            listener(api.discoveredPoints)
        } catch (e) {
            console.error(e)
        }
    })
    roadsListeners.forEach(roadListener => {
        try {
            roadListener()
        } catch (e) {
            console.error(e)
        }
    })

    message?.messages.forEach(message => api.messages.set(message.id, message))

    if (message.messages) {
        messageListeners.forEach(messageListener => {
            try {
                messageListener(message.messages, [], [])
            } catch (e) {
                console.error(e)
            }
        })
    }

    if (previousGameState !== api.gameState) {
        gameListeners.forEach(listener => {
            if (listener.onGameStateChanged) {
                try {
                    listener.onGameStateChanged(api.gameState)
                } catch (e) {
                    console.error(e)
                }
            }
        })
    }

    if (changedTransportPriority && api.transportPriority) {
        transportPriorityListeners?.forEach(listener => {
            try {
                listener(api.transportPriority!)
            } catch (e) {
                console.error(e)
            }
        })
    }
}

/**
 * Starts timers for various animations and actors walking to their targets
 * @return {void}
 */
function startTimers(): void {
    if (WsApiLogConfig.timers) {
        console.log(`WS API (timers): Starting timers with tick length: ${gameTickLength}`)
    }

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
        })

        treesToRemove.forEach(id => api.fallingTrees.delete(id))
    }, gameTickLength)

    // Move workers locally to reduce the amount of messages from the server
    workerWalkingTimer = setInterval(async () => {
        for (const worker of api.workers.values()) {

            // Filter workers without any planned path
            if (!worker.plannedPath || worker.plannedPath.length === 0) {
                continue
            }

            // Take a step forward
            worker.percentageTraveled = worker.percentageTraveled + 5

            // Worker is at an exact point
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

                // Show that the worker is walking between two points
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

                    try {
                        listener.onWorkerMoved(move)
                    } catch (e) {
                        console.error(e)
                    }
                }
            })
        }

        for (const wildAnimal of api.wildAnimals.values()) {

            // Filter workers without any planned path
            if (!wildAnimal.path || wildAnimal.path.length === 0) {
                continue
            }

            wildAnimal.percentageTraveled = wildAnimal.percentageTraveled + 5

            // Get the next point
            const next = wildAnimal.path[0]

            // Clear the planned path for workers that have reached the target
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

                // Show that the worker is walking between two points
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

    // Track game time
    gameTimer = setInterval(() => {
        api.time++
        timeListeners.forEach(listener => {
            try {
                listener(api.time)
            } catch (e) {
                console.error(e)
            }
        })
    }, gameTickLength)

    walkingTimerState = 'RUNNING'
}

/**
 * Loads a chat message and notifies all chat listeners.
 * 
 * @param {ChatMessage} chatMessage - The chat message to load.
 */
function loadChatMessage(chatMessage: ChatMessage): void {
    api.chatRoomMessages.push(chatMessage)

    chatListeners.forEach(listener => {
        try {
            listener()
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Notifies listeners about the updated statistics.
 *
 * @param statisticsChangedMessage - An object describing the change
 */
// eslint-disable-next-line
function handleUpdatedStatistics(_statisticsChangedMessage: StatisticsChangedMessage): void {
    statisticsListeners.keys().forEach(listener => {
        try {
            listener()
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Receives the game list changed message and notifies all relevant listeners.
 * 
 * @param {GameListChangedMessage} message - The message containing the updated game list.
 */
function receivedGameListChangedMessage(message: GameListChangedMessage): void {
    gamesListeners.forEach(listener => {
        try {
            listener(message.games)
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Clears the existing game information and loads the updated information, then calls the appropriate listeners.
 * 
 * @param {GameInformation} gameInformation - The updated game information.
 */
function clearAndLoadGameInformationAndCallListeners(gameInformation: GameInformation): void {

    // Clear
    api.gameId = undefined
    api.othersCanJoin = undefined
    api.initialResources = undefined
    api.map = undefined

    // Load and call listeners
    loadGameInformationAndCallListeners(gameInformation)
}

/**
 * Loads the game information and calls all relevant listeners.
 * 
 * @param {GameInformation} gameInformation - The game information to load.
 * @returns {Promise<void>} - A promise that resolves when the game information is fully loaded.
 */
async function loadGameInformationAndCallListeners(gameInformation: GameInformation): Promise<void> {
    const prevState = api.gameState
    const prevSpeed = api.gameSpeed

    // Store the updated values
    assignGameInformation(gameInformation)

    // Did the tick length change? Then change the dead-reckoning timers
    if (gameInformation?.tick) {
        stopTimers()

        if (WsApiLogConfig.timers) {
            console.log(`WS API: Setting game tick length to: ${gameInformation.tick}`)
        }

        gameTickLength = gameInformation.tick

        startTimers()
    }

    // Call game state change listener
    if (prevState !== gameInformation.status) {
        gameListeners.forEach(listener => {
            if (listener.onGameStateChanged) {
                try {
                    listener.onGameStateChanged(gameInformation.status)
                } catch (e) {
                    console.error(e)
                }
            }

        })
    }

    // Call game speed change listener
    if (prevSpeed !== gameInformation.gameSpeed && gameInformation.gameSpeed) {
        for (const listener of gameListeners) {
            if (listener.onGameSpeedChanged) {
                try {
                    listener.onGameSpeedChanged(gameInformation.gameSpeed)
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    // Call other listeners
    gameListeners.forEach(listener => {
        if (listener.onGameInformationChanged) {
            try {
                listener.onGameInformationChanged(gameInformation)
            } catch (e) {
                console.error(e)
            }
        }
    })

    // Call player information listeners
    gameInformation.players.forEach(player =>
        playerInformationListeners.get(player.id)?.forEach(listener => {
            try {
                listener(player)
            } catch (e) {
                console.error(e)
            }
        }))

    playersListeners.get(gameInformation.id)?.forEach(listener => {
        try {
            listener(Array.from(api.players.values()))
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Stops all timers for animation and actors walking to their targets
 * @param {void}
 */
function stopTimers(): void {

    if (WsApiLogConfig.timers) {
        console.log('WS API: Stopping walking timers')
    }

    const timers = [workerAnimationsTimer, workerWalkingTimer, cropGrowerTimer, treeGrowerTimer, gameTimer]

    timers.forEach(timer => {
        if (timer) {
            clearInterval(timer)
        }
    })

    walkingTimerState = 'NOT_RUNNING'
}

/**
 * Clears the API state
 */
function clearApiState(): void {
    if (WsApiLogConfig.receive) {
        console.log('Clearing API state')
    }

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
    api.border.clear()
    api.players.clear()
    api.transportPriority = undefined
    api.chatRoomMessages = []
    api.messages.clear()
    api.fallingTrees.clear()
    api.allTiles.clear()
    api.pointsWithBelowTileDiscovered.clear()
    api.pointsWithDownRightTileDiscovered.clear()
}

/**
 * Clears the player view and reloads it, then notifies all relevant listeners.
 * 
 * @param {PlayerViewInformation} playerView - The player view information to load.
 */
function clearAndLoadPlayerViewAndCallListeners(playerView: PlayerViewInformation): void {

    if (WsApiLogConfig.receive) {
        console.log('Handling full sync message')
    }

    clearApiState()

    // Read the full state from the backend
    loadPlayerViewAndCallListeners(playerView)
}

/**
 * Handles potential game state changes and adjusts timers accordingly.
 * 
 * @param {GameState} gameState - The current game state.
 */
function gameStateMightHaveChanged(gameState: GameState): void {

    if (WsApiLogConfig.timers) {
        console.log(`WS API: Game state might have changed. Game state: ${gameState}, walking timer state: ${walkingTimerState}`)
    }

    if (gameState === 'STARTED' && walkingTimerState !== 'RUNNING') {
        startTimers()
    } else if (gameState === 'PAUSED' && walkingTimerState === 'RUNNING') {
        stopTimers()
    }
}

/**
 * Handles a message indicating that a player's information has changed. It updates the player's information in the API state and notifies all relevant listeners.
 * 
 * @param {PlayerChangedMessage} message - The message containing the updated player information.
 */
function handlePlayerChangedMessage(updatedPlayer: PlayerInformation): void {
    const player = api.players.get(updatedPlayer.id)

    if (player) {
        Object.assign(player, updatedPlayer)

        playerInformationListeners.get(player.id)?.forEach(listener => {
            try {
                listener(player)
            } catch (e) {
                console.error(e)
            }
        })
    } else {
        console.error(`Received a player changed message for player ${updatedPlayer.id}, but this player is not known in the API state.`, updatedPlayer)
    }
}

/**
 * Loads changes in the player's view and notifies all relevant listeners.
 * 
 * @param {PlayerViewChanges} playerViewChanges - The changes in the player's view.
 */
function loadPlayerViewChangesAndCallListeners(playerViewChanges: PlayerViewChanges): void {
    // Start by handling locally cached changes

    // Clear local additions
    api.roads.delete('LOCAL')


    /// Collect changes to report on, before API changes are made, so that the listeners get the correct information
    // Identify points where information has changed based, before updating API state
    const changedPoints = new PointSet()

    playerViewChanges.newDiscoveredLand?.forEach(point => changedPoints.add(point))
    playerViewChanges.newBuildings?.forEach(house => changedPoints.add({ x: house.x, y: house.y }))
    playerViewChanges.removedBuildings?.forEach(id => {
        const house = api.houses.get(id)

        if (house) {
            changedPoints.add({ x: house.x, y: house.y })
        }
    })
    playerViewChanges.newFlags?.forEach(flag => changedPoints.add({ x: flag.x, y: flag.y }))
    playerViewChanges.removedFlags?.forEach(id => {
        const flag = api.flags.get(id)

        if (flag) {
            changedPoints.add({ x: flag.x, y: flag.y })
        }
    })
    playerViewChanges.newRoads?.forEach(road => road.points.forEach(point => changedPoints.add(point)))
    playerViewChanges.removedRoads?.forEach(id => {
        const road = api.roads.get(id)

        if (road) {
            road.points.forEach(point => changedPoints.add(point))
        }
    })


    /// Apply changes

    // Update game speed
    if (playerViewChanges?.gameSpeed) {
        api.gameSpeed = playerViewChanges.gameSpeed

        gameListeners.forEach(listener => {
            if (listener.onGameSpeedChanged) {
                try {
                    listener.onGameSpeedChanged(api.gameSpeed)
                } catch (e) {
                    console.error(e)
                }
            }
        })
    }

    api.time = playerViewChanges.time

    // Confirm local removals if they are part of the message
    playerViewChanges.removedFlags?.forEach(removedFlagId => api.localRemovedFlags.delete(removedFlagId))

    // Digest all changes from the message
    playerViewChanges.newDiscoveredLand?.forEach(point => api.discoveredPoints.add(point))

    if (playerViewChanges.newDiscoveredLand) {

        if (WsApiLogConfig.receive) {
            console.log('Got new discovered points')
        }

        storeDiscoveredTiles(playerViewChanges.newDiscoveredLand)
    }

    if (playerViewChanges.newWorkersOutside) {
        playerViewChanges.newWorkersOutside.forEach(worker => api.workers.set(worker.id, serverWorkerToLocalWorker(worker)))
    }

    if (playerViewChanges.workersWithNewTargets) {
        playerViewChanges.workersWithNewTargets.forEach(worker => {
            const monitoredWorker = api.workers.get(worker.id)

            if (monitoredWorker && monitoredWorker.action) {
                actionListeners.forEach(listener => {
                    if (monitoredWorker.action) {
                        try {
                            listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, monitoredWorker.action)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                })
            }
        })

        syncWorkersWithNewTargets(playerViewChanges.workersWithNewTargets)
    }

    if (playerViewChanges.workersWithStartedActions) {
        playerViewChanges.workersWithStartedActions.forEach(workerWithNewAction => {
            const worker = api.workers.get(workerWithNewAction.id)

            if (worker) {
                actionListeners.forEach(listener => {
                    if (worker.action) {
                        try {
                            listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, worker.action)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                })

                worker.x = workerWithNewAction.x
                worker.y = workerWithNewAction.y
                worker.plannedPath = undefined
                worker.next = undefined
                worker.action = workerWithNewAction.startedAction
                worker.actionAnimationIndex = 0
            }

            actionListeners.forEach(listener => {
                try {
                    listener.actionStarted(
                        workerWithNewAction.id,
                        {
                            x: workerWithNewAction.x,
                            y: workerWithNewAction.y
                        },
                        workerWithNewAction.startedAction ?? '')
                } catch (e) {
                    console.error(e)
                }
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
                    try {
                        listener.actionEnded(worker.id, { x: worker.x, y: worker.y }, worker.action)
                    } catch (e) {
                        console.error(e)
                    }
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
                houseBurningListeners.forEach(listener => {
                    try {
                        listener.houseStartedToBurn(house.id, house)
                    } catch (e) {
                        console.error(e)
                    }
                })
            } else if (oldHouse && oldHouse.state === 'BURNING' && house.state !== 'BURNING') {
                houseBurningListeners.forEach(listener => {
                    try {
                        listener.houseStoppedBurning(house.id, house)
                    } catch (e) {
                        console.error(e)
                    }
                })
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
        flagListeners.get(flag.id)?.forEach(listener => {
            try {
                listener.onUpdate(flag)
            } catch (e) {
                console.error(e)
            }
        })
    })
    playerViewChanges.changedFlags?.forEach(flag => {
        api.flags.set(flag.id, flag)
        flagListeners.get(flag.id)?.forEach(listener => {
            try {
                listener.onUpdate(flag)
            } catch (e) {
                console.error(e)
            }
        })
    })
    playerViewChanges.removedFlags?.forEach(id => {
        api.flags.delete(id)
        flagListeners.get(id)?.forEach(listener => {
            try {
                listener.onRemove()
            } catch (e) {
                console.error(e)
            }
        })
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

            actionListeners.forEach(actionListener => {
                try {
                    actionListener.actionStarted(treeId, treeToRemove, 'FALLING_TREE')
                } catch (e) {
                    console.error(e)
                }

            })

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

        playerViewChanges.changedBorders.forEach(changedBorder => {
            const player = api.players.get(changedBorder.playerId)

            if (player) {
                player.ownedLand = ([...player.ownedLand, ...changedBorder.newOwnedLand]).filter(point => !changedBorder.removedOwnedLand.find(p => p.x === point.x && p.y === point.y))
            }
        })
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

            availableConstructionListeners.get(point)?.forEach(listener => {
                try {
                    listener.onAvailableConstructionChanged(change.available)
                } catch (e) {
                    console.error(e)
                }
            })
        }
    }

    if (playerViewChanges.transportPriority) {
        api.transportPriority = playerViewChanges.transportPriority
    }

    playerViewChanges.newMessages?.forEach(message => api.messages.set(message.id, message))
    playerViewChanges.readMessages?.forEach(message => api.messages.set(message.id, message))
    playerViewChanges.removedMessages?.forEach(messageId => api.messages.delete(messageId))



    /// Notify listeners when all data is updated
    if (playerViewChanges.newDiscoveredLand) {
        const newDiscoveredLand = new PointSet(playerViewChanges.newDiscoveredLand)
        discoveredPointListeners.forEach(listener => {
            try {
                listener(newDiscoveredLand)
            } catch (e) {
                console.error(e)
            }
        })
    }

    if (playerViewChanges.newMessages !== undefined || playerViewChanges.readMessages !== undefined || playerViewChanges.removedMessages !== undefined) {
        messageListeners.forEach(listener => {
            try {
                listener(
                    playerViewChanges.newMessages ?? [],
                    playerViewChanges.readMessages ?? [],
                    playerViewChanges.removedMessages ?? []
                )
            } catch (e) {
                console.error(e)
            }
        })
    }

    if (playerViewChanges.changedToolQuotas !== undefined) {
        for (const listener of toolPrioListeners) {
            try {
                listener(playerViewChanges.changedToolQuotas)
            } catch (e) {
                console.error(e)
            }
        }
    }

    if (playerViewChanges.newRoads !== undefined || playerViewChanges.removedRoads !== undefined || playerViewChanges.changedRoads !== undefined) {
        roadsListeners.forEach(roadsListener => {
            try {
                roadsListener()
            } catch (e) {
                console.error(e)
            }
        })
    }

    playerViewChanges.changedRoads?.forEach(road => roadListeners.get(road.id)?.forEach(listener => {
        try {
            listener(road.id, road)
        } catch (e) {
            console.error(e)
        }
    }))

    playerViewChanges.removedRoads?.forEach(roadId => roadListeners.get(roadId)?.forEach(listener => {
        try {
            listener(roadId)
        } catch (e) {
            console.error(e)
        }
    }))

    if (playerViewChanges.newBuildings !== undefined || playerViewChanges.removedBuildings !== undefined) {
        housesAddedOrRemovedListeners.forEach(listener => {
            try {
                listener()
            } catch (e) {
                console.error(e)
            }
        })
    }

    if (playerViewChanges.changedBuildings) {
        notifyHouseListeners(playerViewChanges.changedBuildings)
    }

    if (playerViewChanges.transportPriority !== undefined && api.transportPriority) {
        transportPriorityListeners.forEach(listener => {
            try {
                listener(api.transportPriority!)
            } catch (e) {
                console.error(e)
            }
        })
    }

    if (playerViewChanges?.changedBorders !== undefined) {
        ownedLandListeners.forEach(listener => {
            try {
                listener()
            } catch (e) {
                console.error(e)
            }
        })
    }

    changedPoints.forEach(point => {
        const pointInformation = getInformationOnPointLocal(point)

        if (pointInformation) {
            pointInformationListeners.get(point)?.forEach(listener => {
                try {
                    listener(pointInformation)
                } catch (e) {
                    console.error(e)
                }
            })
        }
    })

    timeListeners.forEach(listener => {
        try {
            listener(api.time)
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Stores the discovered tiles based on newly discovered points.
 * 
 * @param {PointSet | Point[]} newlyDiscoveredPoints - The newly discovered points.
 */
function storeDiscoveredTiles(newlyDiscoveredPoints: PointSet | Point[]): void {
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

        const isLeftDiscovered = api.discoveredPoints.has(pointLeft)
        const isDownLeftDiscovered = api.discoveredPoints.has(pointDownLeft)
        const isDownRightDiscovered = api.discoveredPoints.has(pointDownRight)
        const isRightDiscovered = api.discoveredPoints.has(pointRight)
        const isUpRightDiscovered = api.discoveredPoints.has(pointUpRight)
        const isUpLeftDiscovered = api.discoveredPoints.has(pointUpLeft)

        const terrainAtPointLeft = api.allTiles.get(pointLeft)
        const terrainAtPointDownLeft = api.allTiles.get(pointDownLeft)
        const terrainAtPointDownRight = api.allTiles.get(pointDownRight)
        const terrainAtPointRight = api.allTiles.get(pointRight)
        const terrainAtPointUpRight = api.allTiles.get(pointUpRight)
        const terrainAtPointUpLeft = api.allTiles.get(pointUpLeft)

        // Tile down left
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

        // Tile up right
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

        // Tile below
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

        // Tile down right
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

        // Tile up left
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

        // Tile above
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

/**
 * Synchronizes changes to player borders.
 * 
 * @param {BorderChange[]} borderChanges - The list of border changes to synchronize.
 */
function syncChangedBorders(borderChanges: BorderChange[]): void {
    for (const borderChange of borderChanges) {
        const currentBorderForPlayer = api.border.get(borderChange.playerId)

        if (currentBorderForPlayer) {
            borderChange.newBorder.forEach(point => currentBorderForPlayer.points.add(point))
            borderChange.removedBorder.forEach(point => currentBorderForPlayer.points.delete(point))
        } else {
            const player = api.players.get(borderChange.playerId)

            if (!player) {
                console.error(`WS API (receive): UNKNOWN PLAYER: ${JSON.stringify(borderChange)}`)

                continue
            }

            api.border.set(borderChange.playerId,
                {
                    color: player.color,
                    nation: api.players.get(borderChange.playerId)?.nation ?? 'ROMANS',
                    points: new PointSet(borderChange.newBorder)
                }
            )
        }
    }
}

/**
 * Synchronizes new or updated wild animals with the local state.
 * 
 * @param {WildAnimalInformation[]} wildAnimals - The list of wild animals to synchronize.
 */
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
    targetChanges.forEach(walkerTargetChange => {
        const direction = simpleDirectionToCompassDirection(walkerTargetChange.direction)

        let worker = api.workers.get(walkerTargetChange.id) ?? {
            id: walkerTargetChange.id,
            type: walkerTargetChange.type,
            color: walkerTargetChange.color,
            nation: walkerTargetChange.nation,
        }

        worker = {
            ...worker,
            x: walkerTargetChange.x,
            y: walkerTargetChange.y,
            direction,
            plannedPath: walkerTargetChange.path?.length ? walkerTargetChange.path : undefined,
            previous: { x: walkerTargetChange.x, y: walkerTargetChange.y },
            next: walkerTargetChange.path?.[0],
            betweenPoints: walkerTargetChange.percentageTraveled === undefined || walkerTargetChange.percentageTraveled === 0 || walkerTargetChange.percentageTraveled >= 100,
            percentageTraveled: walkerTargetChange.percentageTraveled !== undefined ? walkerTargetChange.percentageTraveled : 0,
            action: undefined,
            cargo: walkerTargetChange.cargo,
            bodyType: walkerTargetChange?.bodyType
        }

        api.workers.set(worker.id, worker);
    })
}

/**
 * Notifies listeners for house changes.
 * 
 * @param {HouseInformation[]} houses - The list of houses with updated information.
 */
function notifyHouseListeners(houses: HouseInformation[]): void {
    houses.forEach(house => {
        houseListeners.get(house.id)?.forEach(listener => {
            try {
                listener(house)
            } catch (e) {
                console.error(e)
            }
        })
    })
}

/**
 * Converts server-sent crop information to a local format.
 * 
 * @param {CropInformation} serverCrop - The crop information from the server.
 * @returns {CropInformationLocal} - The local crop information.
 */
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

/**
 * Converts server-sent tree information to a local format.
 * 
 * @param {TreeInformation} serverTree - The tree information from the server.
 * @returns {TreeInformationLocal} - The local tree information.
 */
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

/**
 * Places a local road on the map.
 * 
 * @param {Point[]} points - The points that make up the road.
 */
function placeLocalRoad(points: Point[]): void {
    api.roads.set('LOCAL', { id: 'LOCAL', points, type: 'NORMAL', playerId: api.playerId ?? 'LOCAL_PLAYER' })
}

/**
 * Removes a locally placed road from the map.
 * 
 * @param {RoadId} roadId - The ID of the road to remove.
 */
function removeLocalRoad(roadId: RoadId): void {
    const road = api.roads.get(roadId)

    if (road !== undefined) {
        api.localRemovedRoads.set(roadId, road)

        api.roads.delete(roadId)
    }
}

/**
 * Checks if game data is available in the local state.
 * 
 * @returns {boolean} - Returns `true` if game data is available, otherwise `false`.
 */
function isGameDataAvailable(): boolean {
    return api.discoveredBelowTiles.size > 0
}

/**
 * Converts server-sent worker information to a local format.
 * 
 * @param {ServerWorkerInformation} serverWorker - The worker information from the server.
 * @returns {WorkerInformation} - The local worker information.
 */
function serverWorkerToLocalWorker(serverWorker: ServerWorkerInformation): WorkerInformation {
    return {
        ...serverWorker,
        direction: simpleDirectionToCompassDirection(serverWorker.direction)
    }
}

/**
 * Assigns game information to the local state.
 * 
 * @param {GameInformation} gameInformation - The game information to assign.
 */
function assignGameInformation(gameInformation: GameInformation): void {
    api.gameId = gameInformation.id
    api.gameName = gameInformation.name
    api.gameState = gameInformation.status
    api.map = gameInformation.map
    api.othersCanJoin = gameInformation.othersCanJoin
    api.cheatingEnabled = gameInformation.cheatingEnabled
    api.initialResources = gameInformation.initialResources


    if (gameInformation?.gameSpeed) {
        api.gameSpeed = gameInformation.gameSpeed
    }

    gameInformation.players.forEach(player => api.players.set(player.id, player))
}

/**
 * Starts following a game with the given gameId and from the perspective of the given playerId. All members of the monitor will be kept in sync with the backend.
 *
 * @param {GameId} gameId - The id of the game to follow.
 * @param {PlayerId} playerId - The id of the player.
 * @returns {Promise<GameInformation>} - Metadata about the game.
 */
async function followGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation | undefined> {
    if (followingState === 'NOT_FOLLOWING') {
        requestedFollowingState = 'FOLLOW'
        followingState = 'STARTING_TO_FOLLOW'

        const sessionId = ++followingSessionId

        api.gameId = gameId
        api.playerId = playerId

        try {

            // Start listening to the game's metadata
            const gameInformation = await listenToGameMetadata(gameId)

            if (sessionId !== followingSessionId) {
                console.error(`WS API (follow): new session started during async call.`, sessionId, followingSessionId)

                return
            }

            // Sync the received metadata
            await loadGameInformationAndCallListeners(gameInformation)

            // Get the chat history for the game's chat room
            const chatRoomHistory = await getChatRoomHistory(`game-${gameId}`)

            if (sessionId !== followingSessionId) {
                console.error(`WS API (follow): new session started during async call`, sessionId, followingSessionId)

                return
            }

            loadChatRoomHistoryAndCallListeners(chatRoomHistory)

            // Start listening to the actual game state from the player's point of view
            const playerView = await listenToGameViewForPlayer(playerId, gameId)

            if (sessionId !== followingSessionId) {
                console.error(`WS API (follow): new session started during async call.`, sessionId, followingSessionId)

                return
            }

            // Sync the received view
            if (playerView !== undefined) {
                if (WsApiLogConfig.receive) {
                    console.log('WS API (receive): Loading player view')
                }

                loadPlayerViewAndCallListeners(playerView)
            } else {
                console.error('WS API (receive): Not loading player view')
            }

            followingState = 'FOLLOWING'

            return gameInformation
        } catch (e) {
            console.error(`WS API (follow): Failed starting to follow.`, e)

            if (sessionId === followingSessionId) {
                console.info('Clearing API state')

                followingState = 'NOT_FOLLOWING'
                requestedFollowingState = 'NO_FOLLOW'

                clearApiState()
            }

            throw e
        }
    } else if (WsApiLogConfig.following) {
        console.log(`WS API (following): Can't start to follow when following state is: ${followingState}. Previously requested state is: ${requestedFollowingState}`)
    }
}

/**
 * Stops following the current game and clears all game data from the local state.
 */
function stopFollowingGame(): void {
    if (WsApiLogConfig.following) {
        console.log('WS API (following): Stopping following game')
    }

    followingSessionId++

    // Clear game data
    api.gameId = undefined
    api.playerId = undefined
    api.players.clear()

    // TODO: stop following game

    requestedFollowingState = 'NO_FOLLOW'

    stopTimers()
    clearApiState()

    followingState = 'NOT_FOLLOWING'
}

/**
 * Loads chat room history and notifies all relevant listeners.
 * 
 * @param {ChatMessage[]} chatRoomHistory - The chat room history messages to load.
 */
function loadChatRoomHistoryAndCallListeners(chatRoomHistory: ChatMessage[]): void {
    chatRoomHistory.forEach(chatMessage => api.chatRoomMessages.push(chatMessage))

    chatListeners.forEach(listener => {
        try {
            listener()
        } catch (e) {
            console.error(e)
        }
    })
}

/**
 * Waits for game data to be available, up to a maximum wait time.
 * 
 * @returns {Promise<void>} - A promise that resolves when game data is available.
 * @throws {Error} - Throws an error if the wait time exceeds the maximum allowed time.
 */
async function waitForGameDataAvailable(): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_WAIT_FOR_CONNECTION) {
        if (api.allTiles.size > 0) {
            if (WsApiLogConfig.following) {
                console.log('WS API (following): Game data is available')
            }

            return
        }

        await delay(5)
    }

    console.error('WS API (following): Timed out waiting for game data to be available.')

    throw new Error('Timed out')
}

export {
    api
}
