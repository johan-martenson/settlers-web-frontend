import { PointMapFast } from "../../util_types"
import { Player, PlayerType, PlayerInformation, PlayerId, PlayerColor, Nation, PointInformation, MapId, GameInformation, ResourceLevel, GameSpeed, GameId, RoomId, ChatMessage, MapInformation, HouseId, FlagId, FlagDebugInfo, Point, SoldierType, GameMessageId, GameMessage, AnyBuilding, RoadId, AvailableConstruction, BorderInformation, CropInformation, Decoration, FlagInformation, GameState, HouseInformation, RoadInformation, ServerWorkerInformation, ShipInformation, SignInformation, StoneInformation, TreeInformation, Vegetation, WildAnimalInformation } from "../types"
import { send, sendRequestAndWaitForReply, sendRequestAndWaitForReplyWithOptions, sendWithOptions } from "../ws-api"


// RPC Commands

// Constants

// Types
type AddPlayerOptions = Player & { type: PlayerType }
type AddPlayerReply = { playerInformation: PlayerInformation }
type UpdatePlayerOptions = { playerId: PlayerId, name: string, color: PlayerColor, nation: Nation }

export interface CoalQuotas {
    mint: number
    armory: number
    ironSmelter: number
}

export interface FoodQuotas {
    ironMine: number
    coalMine: number
    goldMine: number
    graniteMine: number
}

export interface WheatQuotas {
    donkeyFarm: number
    pigFarm: number
    mill: number
    brewery: number
}

export interface WaterQuotas {
    bakery: number
    donkeyFarm: number
    pigFarm: number
    brewery: number
}

export interface IronBarQuotas {
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

export interface PlayerViewInformation {
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

// Type functions

// Configuration

// State

// Functions exposed as part of WS API
function setStrengthWhenPopulatingMilitaryBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING', { strength })
}

async function getStrengthWhenPopulatingMilitaryBuildings(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING')).amount
}

function setDefenseStrength(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_DEFENSE_STRENGTH', { strength })
}

async function getDefenseStrength(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_DEFENSE_STRENGTH')).amount
}

function setDefenseFromSurroundingBuildings(strength: number): void {
    sendWithOptions<{ strength: number }>('SET_DEFENSE_FROM_SURROUNDING_BUILDINGS', { strength })
}

async function getDefenseFromSurroundingBuildings(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_DEFENSE_FROM_SURROUNDING_BUILDINGS')).amount
}

async function getPopulateMilitaryFarFromBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_POPULATE_MILITARY_FAR_FROM_BORDER')).amount
}

async function getPopulateMilitaryCloserToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_POPULATE_MILITARY_CLOSER_TO_BORDER')).amount
}

async function getPopulateMilitaryCloseToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_POPULATE_MILITARY_CLOSE_TO_BORDER')).amount
}

async function getMilitarySettings(): Promise<MilitarySettings> {
    return await sendRequestAndWaitForReply<MilitarySettings>('GET_MILITARY_SETTINGS')
}

async function getSoldiersAvailableForAttack(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>('GET_SOLDIERS_AVAILABLE_FOR_ATTACK')).amount
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

async function createPlayer(name: string, color: PlayerColor, nation: Nation, type: PlayerType): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<AddPlayerReply, AddPlayerOptions>('CREATE_PLAYER', { name, color, nation, type })
    ).playerInformation
}

async function addPlayerToGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { gameId: GameId, playerId: PlayerId }>(
        'ADD_PLAYER_TO_GAME',
        { gameId, playerId }
    )).gameInformation
}

async function updatePlayer(playerId: PlayerId, name: string, color: PlayerColor, nation: Nation): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, UpdatePlayerOptions>('UPDATE_PLAYER', { playerId, name, color, nation })
    ).playerInformation
}

function removePlayer(playerId: PlayerId): void {
    sendWithOptions<{ playerId: PlayerId }>('REMOVE_PLAYER', { playerId })
}

/**
 * Gets the chat history for a chat room
 * @param {RoomId} roomId - The id of the chat room
 * @returns {Promise<ChatMessage[]>} The chat history as a list of chat messages
 */
async function getChatRoomHistory(roomId: RoomId): Promise<ChatMessage[]> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ chatHistory: ChatMessage[] }, { roomId: RoomId }>('GET_CHAT_HISTORY_FOR_ROOM', { roomId })
    ).chatHistory
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

function upgrade(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>('UPGRADE', { houseId })
}

async function getFlagDebugInfo(flagId: FlagId): Promise<FlagDebugInfo> {
    return (await sendRequestAndWaitForReplyWithOptions<{ flag: FlagDebugInfo }, { flagId: FlagId }>('FLAG_DEBUG_INFORMATION', { flagId })).flag
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
    sendWithOptions<{ text: string, roomId: RoomId, from: PlayerId }>('SEND_CHAT_MESSAGE_TO_ROOM', { text, roomId, from })
}

/**
 * Instructs the backend to start sending updates on any changes to the game visible to the player set through followGame. Internal function that is not exposed outside of the module.
 * @returns {Promise<PlayerViewInformation>} The current view of the game visible to the player.
 */
async function listenToGameViewForPlayer(): Promise<PlayerViewInformation | undefined> {
    return (await sendRequestAndWaitForReply<{ playerView?: PlayerViewInformation }>('START_MONITORING_GAME'))?.playerView
}

async function getInformationOnPoint(point: Point): Promise<PointInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>("INFORMATION_ON_POINTS", { points: [point] })
    ).pointsWithInformation[0]
}

async function getInformationOnPoints(points: Point[]): Promise<PointMapFast<PointInformation>> {
    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>("INFORMATION_ON_POINTS", { points })

    const map = new PointMapFast<PointInformation>()

    reply.pointsWithInformation.forEach(pointInformation => map.set({ x: pointInformation.x, y: pointInformation.y }, pointInformation))

    return map
}

function setReservedSoldiers(rank: SoldierType, amount: number): void {
    sendWithOptions<Partial<Record<SoldierType, number>>>('SET_RESERVED_IN_HEADQUARTERS', { [rank]: amount })
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

function setCoalQuotas(mint: number, armory: number, ironSmelter: number): void {
    sendWithOptions<{ mint: number, armory: number, ironSmelter: number }>(
        'SET_COAL_QUOTAS',
        { mint, armory, ironSmelter }
    )
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

/**
 * Creates a new game with the given name and players.
 * @param {string} name - The name of the game
 * @param {PlayerInformation[]} players - The players in the game
 * @returns {GameInformation} Metadata about the game
 */
async function createGame(name: string, players: PlayerInformation[]): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, CreateNewGameOptions>('CREATE_GAME', {
        name,
        players
    })).gameInformation
}

function pauseGame() {
    send('PAUSE_GAME')
}

function resumeGame(): void {
    send('RESUME_GAME')
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

// eslint-disable-next-line
async function getViewForPlayer(): Promise<PlayerViewInformation> {
    return (await sendRequestAndWaitForReply<{ playerView: PlayerViewInformation }>('FULL_SYNC')).playerView
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
}