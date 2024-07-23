import { PointMapFast } from "../../util_types"
import { Player, PlayerType, PlayerInformation, PlayerId, PlayerColor, Nation, PointInformation, MapId, GameInformation, ResourceLevel, GameSpeed, GameId, RoomId, ChatMessage, MapInformation, HouseId, FlagId, FlagDebugInfo, Point, SoldierType, GameMessageId, GameMessage, AnyBuilding, RoadId, AvailableConstruction, BorderInformation, CropInformation, Decoration, FlagInformation, GameState, HouseInformation, RoadInformation, ServerWorkerInformation, ShipInformation, SignInformation, StoneInformation, TreeInformation, Vegetation, WildAnimalInformation } from "../types"
import { send, sendWithOptions, sendRequestAndWaitForReply, sendRequestAndWaitForReplyWithOptions } from "./core"


// RPC Commands

// Constants

// Types
type AddPlayerOptions = Player & { type: PlayerType }
type AddPlayerReply = { playerInformation: PlayerInformation }
type UpdatePlayerOptions = { playerId: PlayerId, name: string, color: PlayerColor, nation: Nation }

export type CoalQuotas = {
    mint: number
    armory: number
    ironSmelter: number
}

export type FoodQuotas = {
    ironMine: number
    coalMine: number
    goldMine: number
    graniteMine: number
}

export type WheatQuotas = {
    donkeyFarm: number
    pigFarm: number
    mill: number
    brewery: number
}

export type WaterQuotas = {
    bakery: number
    donkeyFarm: number
    pigFarm: number
    brewery: number
}

export type IronBarQuotas = {
    armory: number
    metalworks: number
}

type CreateNewGameOptions = {
    name: string
    players: Player[]
}

type InformationOnPointsReply = { pointsWithInformation: PointInformation[] }

export type MilitarySettings = {
    defenseStrength: number
    defenseFromSurroundingBuildings: number
    soldierAmountWhenPopulatingCloseToBorder: number
    soldierAmountWhenPopulatingAwayFromBorder: number
    soldierAmountWhenPopulatingFarFromBorder: number
    soldierStrengthWhenPopulatingBuildings: number
    soldierAmountsAvailableForAttack: number
}

export type PlayerViewInformation = {
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

enum Command {
    SetStrength = 'SET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING',
    GetStrength = 'GET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING',
    SetDefenseStrength = 'SET_DEFENSE_STRENGTH',
    GetDefenseStrength = 'GET_DEFENSE_STRENGTH',
    SetDefenseFromSurrounding = 'SET_DEFENSE_FROM_SURROUNDING_BUILDINGS',
    GetDefenseFromSurrounding = 'GET_DEFENSE_FROM_SURROUNDING_BUILDINGS',
    StartGame = 'START_GAME',
    SetMap = 'SET_MAP',
    SetOthersCanJoin = 'SET_OTHERS_CAN_JOIN',
    SetInitialResources = 'SET_INITIAL_RESOURCES',
    SetGameName = 'SET_GAME_NAME',
    SetGameSpeed = 'SET_GAME_SPEED',
    CreatePlayer = 'CREATE_PLAYER',
    AddPlayerToGame = 'ADD_PLAYER_TO_GAME',
    UpdatePlayer = 'UPDATE_PLAYER',
    RemovePlayer = 'REMOVE_PLAYER',
    GetChatHistory = 'GET_CHAT_HISTORY_FOR_ROOM',
    GetGames = 'GET_GAMES',
    GetMaps = 'GET_MAPS',
    GetGameInformation = 'GET_GAME_INFORMATION',
    Upgrade = 'UPGRADE',
    GetFlagDebugInformation = 'FLAG_DEBUG_INFORMATION',
    SetSelfPlayer = 'SET_SELF_PLAYER',
    SetGame = 'SET_GAME',
    SendChatMessageToRoom = 'SEND_CHAT_MESSAGE_TO_ROOM',
    StartMonitoringGame = 'START_MONITORING_GAME',
    SetReservedInHeadquarters = 'SET_RESERVED_IN_HEADQUARTERS',
    StartDetailedMonitoring = 'START_DETAILED_MONITORING',
    StopDetailedMonitoring = 'STOP_DETAILED_MONITORING',
    RemoveMessage = 'REMOVE_MESSAGE',
    RemoveMessages = 'REMOVE_MESSAGES',
    SetCoalQuotas = 'SET_COAL_QUOTAS',
    GetFoodQuotas = 'GET_FOOD_QUOTAS',
    SetWheatQuotas = 'SET_WHEAT_QUOTAS',
    GetWheatQuotas = 'GET_WHEAT_QUOTAS',
    GetWaterQuotas = 'GET_WATER_QUOTAS',
    GetCoalQuotas = 'GET_COAL_QUOTAS',
    GetIronBarQuotas = 'GET_IRON_BAR_QUOTAS',
    SetFoodQuotas = 'SET_FOOD_QUOTAS',
    SetWaterQuotas = 'SET_WATER_QUOTAS',
    SetIronBarQuotas = 'SET_IRON_BAR_QUOTAS',
    CreateGame = 'CREATE_GAME',
    PauseGame = 'PAUSE_GAME',
    ResumeGame = 'RESUME_GAME',
    PlaceBuilding = 'PLACE_BUILDING',
    PlaceRoad = 'PLACE_ROAD',
    PlaceFlag = 'PLACE_FLAG',
    PlaceFlagAndRoad = 'PLACE_FLAG_AND_ROAD',
    RemoveFlag = 'REMOVE_FLAG',
    RemoveRoad = 'REMOVE_ROAD',
    RemoveBuilding = 'REMOVE_BUILDING',
    CallScout = 'CALL_SCOUT',
    CallGeologist = 'CALL_GEOLOGIST',
    FullSync = 'FULL_SYNC',
    ListenToGameInfo = 'LISTEN_TO_GAME_INFO',
    ListenToGameList = 'LISTEN_TO_GAME_LIST',
    ListenToChatMessages = 'LISTEN_TO_CHAT_MESSAGES',
    GetMilitaryCloseToBorder = 'GET_POPULATE_MILITARY_CLOSE_TO_BORDER',
    GetMilitaryAwayFromBorder = 'GET_POPULATE_MILITARY_CLOSER_TO_BORDER',
    GetMilitaryFarFromBorder = 'GET_POPULATE_MILITARY_FAR_FROM_BORDER',
    GetMilitarySettings = 'GET_MILITARY_SETTINGS',
    GetSoldiersAvailableForAttack = 'GET_SOLDIERS_AVAILABLE_FOR_ATTACK',
    SetMilitaryFromFromBorder = 'SET_MILITARY_POPULATION_FAR_FROM_BORDER',
    SetMilitaryAwayFromBorder = 'SET_MILITARY_POPULATION_CLOSER_TO_BORDER',
    SetMilitaryCloseToBorder = 'SET_MILITARY_POPULATION_CLOSE_TO_BORDER',
    SetSoldiersAvailableForAttack = 'SET_SOLDIERS_AVAILABLE_FOR_ATTACK',
    GetInformationOnPoint = 'INFORMATION_ON_POINTS'
}
// Type functions

// Configuration

// State

// Functions exposed as part of WS API
/**
 * Sets the strength for populating military buildings.
 * @param {number} strength - The strength value to be set.
 */
function setStrengthWhenPopulatingMilitaryBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>(Command.SetStrength, { strength })
}

/**
 * Retrieves the current strength used when populating military buildings.
 * @returns {Promise<number>} The current strength setting.
 */
async function getStrengthWhenPopulatingMilitaryBuildings(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetStrength)).amount
}

/**
 * Sets the overall defense strength.
 * @param {number} strength - The defense strength to set.
 */
function setDefenseStrength(strength: number): void {
    sendWithOptions<{ strength: number }>(Command.SetDefenseStrength, { strength })
}

/**
 * Retrieves the overall defense strength.
 * @returns {Promise<number>} The current defense strength.
 */
async function getDefenseStrength(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetDefenseStrength)).amount
}

/**
 * Sets the defense strength derived from surrounding buildings.
 * @param {number} strength - The surrounding defense strength to set.
 */
function setDefenseFromSurroundingBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>(Command.SetDefenseFromSurrounding, { strength })
}

/**
 * Retrieves the defense strength from surrounding buildings.
 * @returns {Promise<number>} The current surrounding defense strength.
 */
async function getDefenseFromSurroundingBuildings(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetDefenseFromSurrounding)).amount
}

async function getPopulateMilitaryFarFromBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryFarFromBorder)).amount
}

async function getPopulateMilitaryCloserToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryAwayFromBorder)).amount
}

async function getPopulateMilitaryCloseToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryCloseToBorder)).amount
}

async function getMilitarySettings(): Promise<MilitarySettings> {
    return await sendRequestAndWaitForReply<MilitarySettings>(Command.GetMilitarySettings)
}

async function getSoldiersAvailableForAttack(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetSoldiersAvailableForAttack)).amount
}

/**
 * Starts the game
 */
function startGame(): void {
    send(Command.StartGame)
}

/**
 * Sets the map to be used for the game by specifying a map id.
 * @param {MapId} mapId - The identifier for the map.
 */
function setMap(mapId: MapId): void {
    sendWithOptions<{ mapId: MapId }>(Command.SetMap, { mapId })
}

/**
 * Sets whether other players can join the game.
 * @param {boolean} othersCanJoin - Whether others can join the game.
 * @returns {Promise<GameInformation>} Updated game information after setting the joinability.
 */
async function setOthersCanJoin(othersCanJoin: boolean): Promise<GameInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { othersCanJoin: boolean }>(Command.SetOthersCanJoin, { othersCanJoin })
    ).gameInformation
}

/**
 * Sets the initial resources for the game.
 * @param {ResourceLevel} resources - The levels of initial resources to set.
 */
function setAvailableResources(resources: ResourceLevel): void {
    sendWithOptions<{ resources: ResourceLevel }>(Command.SetInitialResources, { resources })
}

/**
 * Sets the title of the game.
 * @param {string} name - The name of the game.
 */
function setTitle(name: string): void {
    sendWithOptions<{ name: string }>(Command.SetGameName, { name })
}

/**
 * Sets the speed of the game.
 * @param {GameSpeed} speed - The speed setting for the game.
 */
function setGameSpeed(speed: GameSpeed): void {
    sendWithOptions<{ speed: GameSpeed }>(Command.SetGameSpeed, { speed })
}

function setMilitaryPopulationFarFromBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryFromFromBorder, { population })
}

function setMilitaryPopulationCloserToBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryAwayFromBorder, { population })
}

function setMilitaryPopulationCloseToBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryCloseToBorder, { population })
}

function setSoldiersAvailableForAttack(amount: number): void {
    sendWithOptions<{ amount: number }>(Command.SetSoldiersAvailableForAttack, { amount })
}

async function createPlayer(name: string, color: PlayerColor, nation: Nation, type: PlayerType): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<AddPlayerReply, AddPlayerOptions>(Command.CreatePlayer, { name, color, nation, type })
    ).playerInformation
}

async function addPlayerToGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { gameId: GameId, playerId: PlayerId }>(
        Command.AddPlayerToGame,
        { gameId, playerId }
    )).gameInformation
}

async function updatePlayer(playerId: PlayerId, name: string, color: PlayerColor, nation: Nation): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, UpdatePlayerOptions>(Command.UpdatePlayer, { playerId, name, color, nation })
    ).playerInformation
}

function removePlayer(playerId: PlayerId): void {
    sendWithOptions<{ playerId: PlayerId }>(Command.RemovePlayer, { playerId })
}

/**
 * Gets the chat history for a chat room
 * @param {RoomId} roomId - The id of the chat room
 * @returns {Promise<ChatMessage[]>} The chat history as a list of chat messages
 */
async function getChatRoomHistory(roomId: RoomId): Promise<ChatMessage[]> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ chatHistory: ChatMessage[] }, { roomId: RoomId }>(Command.GetChatHistory, { roomId })
    ).chatHistory
}

/**
 * Returns a list of the games available in the backend.
 * @returns {Promise<GameInformation[]} List of all games, regardless of status
 */
async function getGames(): Promise<GameInformation[]> {
    return (await sendRequestAndWaitForReply<{ games: GameInformation[] }>(Command.GetGames)).games
}

async function getMaps(): Promise<MapInformation[]> {
    return (await sendRequestAndWaitForReply<{ maps: MapInformation[] }>(Command.GetMaps)).maps
}

/**
 * Retrieves game information by querying the game state.
 * @returns {Promise<GameInformation>} Current game information.
 */
async function getGameInformation(): Promise<GameInformation> {
    return (await sendRequestAndWaitForReply<{ gameInformation: GameInformation }>(Command.GetGameInformation)).gameInformation
}

/**
 * Upgrades a specific house using its ID.
 * @param {HouseId} houseId - The identifier of the house to upgrade.
 */
function upgrade(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>('UPGRADE', { houseId })
}

/**
 * Retrieves debug information for a specific flag by its ID.
 * @param {FlagId} flagId - The identifier of the flag.
 * @returns {Promise<FlagDebugInfo>} Debugging information for the flag.
 */
async function getFlagDebugInfo(flagId: FlagId): Promise<FlagDebugInfo> {
    return (await sendRequestAndWaitForReplyWithOptions<{ flag: FlagDebugInfo }, { flagId: FlagId }>(Command.GetFlagDebugInformation, { flagId })).flag
}

/**
 * Tells the backend which player the monitor should be connected to. All instructions that don't take a player as an explicit parameter
 * operate on the set player. Internal function that is not exposed outside of the module.
 * @param {PlayerId} playerId - The id of the player.
 * @returns {Promise<PlayerInformation>} Information about the player
 */
async function setPlayerId(playerId: PlayerId): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, { playerId: PlayerId }>(Command.SetSelfPlayer, { playerId })
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
        await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { gameId: GameId }>(Command.SetGame, { gameId })
    ).gameInformation
}

function sendChatMessageToRoom(text: string, roomId: RoomId, from: PlayerId): void {
    sendWithOptions<{ text: string, roomId: RoomId, from: PlayerId }>(Command.SendChatMessageToRoom, { text, roomId, from })
}

/**
 * Instructs the backend to start sending updates on any changes to the game visible to the player set through followGame. Internal function that is not exposed outside of the module.
 * @returns {Promise<PlayerViewInformation>} The current view of the game visible to the player.
 */
async function listenToGameViewForPlayer(): Promise<PlayerViewInformation | undefined> {
    return (await sendRequestAndWaitForReply<{ playerView?: PlayerViewInformation }>(Command.StartMonitoringGame))?.playerView
}

async function getInformationOnPoint(point: Point): Promise<PointInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>(Command.GetInformationOnPoint, { points: [point] })
    ).pointsWithInformation[0]
}

async function getInformationOnPoints(points: Point[]): Promise<PointMapFast<PointInformation>> {
    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>(Command.GetInformationOnPoint, { points })

    const map = new PointMapFast<PointInformation>()

    reply.pointsWithInformation.forEach(pointInformation => map.set({ x: pointInformation.x, y: pointInformation.y }, pointInformation))

    return map
}

function setReservedSoldiers(rank: SoldierType, amount: number): void {
    sendWithOptions<Partial<Record<SoldierType, number>>>(Command.SetReservedInHeadquarters, { [rank]: amount })
}

function addDetailedMonitoring(id: HouseId | FlagId): void {
    sendWithOptions<{ id: HouseId | FlagId }>(Command.StartDetailedMonitoring, { id })
}

function removeDetailedMonitoring(houseId: HouseId): void {
    sendWithOptions<{ buildingId: HouseId }>(Command.StopDetailedMonitoring, { buildingId: houseId })
}

function removeMessage(messageId: GameMessageId): void {
    sendWithOptions<{ messageId: GameMessageId }>(Command.RemoveMessage, { messageId })
}

function removeMessages(messages: GameMessage[]): void {
    sendWithOptions<{ messageIds: GameMessageId[] }>(Command.RemoveMessages, { messageIds: messages.map(message => message.id) })
}

function setCoalQuotas(mint: number, armory: number, ironSmelter: number): void {
    sendWithOptions<{ mint: number, armory: number, ironSmelter: number }>(
        Command.SetCoalQuotas,
        { mint, armory, ironSmelter }
    )
}

function getFoodQuotas(): Promise<FoodQuotas> {
    return sendRequestAndWaitForReply<FoodQuotas>(Command.GetFoodQuotas)
}

function setWheatQuotas(donkeyFarm: number, pigFarm: number, mill: number, brewery: number) {
    sendWithOptions<{ donkeyFarm: number, pigFarm: number, mill: number, brewery: number }>(
        Command.SetWheatQuotas,
        { donkeyFarm, pigFarm, mill, brewery }
    )
}

function getWheatQuotas(): Promise<WheatQuotas> {
    return sendRequestAndWaitForReply<WheatQuotas>(Command.GetWheatQuotas)
}

function getWaterQuotas(): Promise<WaterQuotas> {
    return sendRequestAndWaitForReply<WaterQuotas>(Command.GetWaterQuotas)
}

function getCoalQuotas(): Promise<CoalQuotas> {
    return sendRequestAndWaitForReply<CoalQuotas>(Command.GetCoalQuotas)
}

function getIronBarQuotas(): Promise<IronBarQuotas> {
    return sendRequestAndWaitForReply<IronBarQuotas>(Command.GetIronBarQuotas)
}

function setFoodQuotas(ironMine: number, coalMine: number, goldMine: number, graniteMine: number) {
    sendWithOptions<{ ironMine: number, coalMine: number, goldMine: number, graniteMine: number }>(
        Command.SetFoodQuotas,
        { ironMine, coalMine, goldMine, graniteMine }
    )
}

function setWaterQuotas(bakery: number, donkeyFarm: number, pigFarm: number, brewery: number) {
    sendWithOptions<{ bakery: number, donkeyFarm: number, pigFarm: number, brewery: number }>(
        Command.SetWaterQuotas,
        { bakery, donkeyFarm, pigFarm, brewery })
}

function setIronBarQuotas(armory: number, metalworks: number) {
    sendWithOptions<{ armory: number, metalworks: number }>(Command.SetIronBarQuotas, { armory, metalworks })
}

/**
 * Creates a new game with the given name and players.
 * @param {string} name - The name of the game
 * @param {PlayerInformation[]} players - The players in the game
 * @returns {GameInformation} Metadata about the game
 */
async function createGame(name: string, players: PlayerInformation[]): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, CreateNewGameOptions>(Command.CreateGame, {
        name,
        players
    })).gameInformation
}

function pauseGame() {
    send(Command.PauseGame)
}

function resumeGame(): void {
    send(Command.ResumeGame)
}

function placeBuildingWebsocket(type: AnyBuilding, point: Point): void {
    sendWithOptions<{ x: number, y: number, type: AnyBuilding }>(Command.PlaceBuilding, { ...point, type })
}

function placeRoadWebsocket(points: Point[]): void {
    sendWithOptions<{ road: Point[] }>(Command.PlaceRoad, { road: points })
}

function placeFlagWebsocket(flag: Point): void {
    sendWithOptions<{ flag: Point }>(Command.PlaceFlag, { flag })
}

function placeRoadWithFlagWebsocket(flag: Point, points: Point[]): void {
    sendWithOptions<{ flag: Point, road: Point[] }>(Command.PlaceFlagAndRoad, { flag, road: points })
}

function removeFlagWebsocket(id: FlagId): void {
    sendWithOptions<{ id: FlagId }>(Command.RemoveFlag, { id })
}

function removeRoadWebsocket(id: RoadId): void {
    sendWithOptions<{ id: RoadId }>(Command.RemoveRoad, { id })
}

function removeBuildingWebsocket(id: HouseId): void {
    sendWithOptions<{ id: HouseId }>(Command.RemoveBuilding, { id })
}

function callScoutWebsocket(point: Point): void {
    sendWithOptions<{ point: Point }>(Command.CallScout, { point })
}

function callGeologistWebsocket(point: Point): void {
    sendWithOptions<{ point: Point }>(Command.CallGeologist, { point })
}

// eslint-disable-next-line
async function getViewForPlayer(): Promise<PlayerViewInformation> {
    return (await sendRequestAndWaitForReply<{ playerView: PlayerViewInformation }>(Command.FullSync)).playerView
}

// Functions internal to WS API
async function listenToGameMetadata(): Promise<GameInformation> {
    return (await sendRequestAndWaitForReply<{ gameInformation: GameInformation }>(Command.ListenToGameInfo)).gameInformation
}

function listenToGamesList(): void {
    send(Command.ListenToGameList)
}

function listenToChatMessages(playerId: PlayerId, roomIds: RoomId[]): void {
    sendWithOptions<{ playerId: PlayerId, roomIds: RoomId[] }>(Command.ListenToChatMessages, { playerId, roomIds })
}

export {
    setStrengthWhenPopulatingMilitaryBuildings,
    getStrengthWhenPopulatingMilitaryBuildings,
    setDefenseStrength,
    getDefenseStrength,
    setDefenseFromSurroundingBuildings,
    getDefenseFromSurroundingBuildings,
    getPopulateMilitaryFarFromBorder,
    getPopulateMilitaryCloserToBorder,
    getPopulateMilitaryCloseToBorder,
    getMilitarySettings,
    getSoldiersAvailableForAttack,
    startGame,
    setMap,
    setOthersCanJoin,
    setAvailableResources,
    setTitle,
    setGameSpeed,
    setMilitaryPopulationFarFromBorder,
    setMilitaryPopulationCloserToBorder,
    setMilitaryPopulationCloseToBorder,
    setSoldiersAvailableForAttack,
    createPlayer,
    addPlayerToGame,
    updatePlayer,
    removePlayer,
    getChatRoomHistory,
    getGames,
    getMaps,
    getGameInformation,
    upgrade,
    getFlagDebugInfo,
    setPlayerId,
    setGame,
    sendChatMessageToRoom,
    listenToGameViewForPlayer,
    getInformationOnPoint,
    getInformationOnPoints,
    setReservedSoldiers,
    addDetailedMonitoring,
    removeDetailedMonitoring,
    removeMessage,
    removeMessages,
    setCoalQuotas,
    getFoodQuotas,
    setWheatQuotas,
    getWheatQuotas,
    getWaterQuotas,
    getCoalQuotas,
    getIronBarQuotas,
    setFoodQuotas,
    setWaterQuotas,
    setIronBarQuotas,
    createGame,
    pauseGame,
    resumeGame,
    placeBuildingWebsocket,
    placeRoadWebsocket,
    placeFlagWebsocket,
    placeRoadWithFlagWebsocket,
    removeFlagWebsocket,
    removeRoadWebsocket,
    removeBuildingWebsocket,
    callScoutWebsocket,
    callGeologistWebsocket,
    getViewForPlayer,
    listenToGameMetadata,
    listenToGamesList,
    listenToChatMessages
}