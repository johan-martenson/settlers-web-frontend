import { PointMap } from "../../utils/util_types"
import { Player, PlayerType, PlayerInformation, PlayerId, PlayerColor, Nation, PointInformation, MapId, GameInformation, ResourceLevel, GameSpeed, GameId, RoomId, ChatMessage, MapInformation, HouseId, FlagId, FlagDebugInfo, Point, SoldierType, GameMessageId, GameMessage, AnyBuilding, RoadId, AvailableConstruction, BorderInformation, CropInformation, Decoration, FlagInformation, GameState, HouseInformation, RoadInformation, ServerWorkerInformation, ShipInformation, SignInformation, StoneInformation, TreeInformation, WildAnimalInformation, AttackType, TransportCategory, TerrainInformation, ProductionStatistics, LandStatistics, VegetationAsInt, StatisticsPerPlayer, MerchandiseStatistics } from "../types"
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

export type StatisticsReply = {
    currentTime: number
    players: StatisticsPerPlayer[]
    merchandise: MerchandiseStatistics
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
    straightBelow: VegetationAsInt[]
    belowToTheRight: VegetationAsInt[]
    heights: number[]
    map: MapInformation
    othersCanJoin: boolean
    initialResources: ResourceLevel
    transportPriority: TransportCategory[]
}

type PossibleNewRoad = {
    possibleRoad: Point[]
    closesRoad: boolean
}

enum Command {

    // Connection

    // Games
    GetGames = 'GET_GAMES',
    ListenToGameList = 'LISTEN_TO_GAME_LIST',

    // Maps
    GetMaps = 'GET_MAPS',

    // Map
    GetTerrain = 'GET_TERRAIN',

    // Game
    CreateGame = 'CREATE_GAME',
    StartGame = 'START_GAME',
    PauseGame = 'PAUSE_GAME',
    ResumeGame = 'RESUME_GAME',
    DeleteGame = 'DELETE_GAME',
    SetMap = 'SET_MAP',
    SetOthersCanJoin = 'SET_OTHERS_CAN_JOIN',
    SetInitialResources = 'SET_INITIAL_RESOURCES',
    SetGameName = 'SET_GAME_NAME',
    SetGameSpeed = 'SET_GAME_SPEED',
    AddPlayerToGame = 'ADD_PLAYER_TO_GAME',
    GetGameInformation = 'GET_GAME_INFORMATION',
    StartMonitoringGame = 'START_MONITORING_GAME',
    ListenToGameInfo = 'LISTEN_TO_GAME_INFO',
    StartDetailedMonitoring = 'START_DETAILED_MONITORING',
    StopDetailedMonitoring = 'STOP_DETAILED_MONITORING',
    GetGameStatistics = 'GET_PRODUCTION_STATISTICS',
    GetLandStatistics = 'GET_LAND_STATISTICS',
    GetStatistics = 'GET_STATISTICS',
    ListenToStatistics = 'LISTEN_TO_STATISTICS',
    StopListeningToStatistics = 'STOP_LISTENING_TO_STATISTICS',

    // Player
    CreatePlayer = 'CREATE_PLAYER',
    UpdatePlayer = 'UPDATE_PLAYER',
    RemovePlayer = 'REMOVE_PLAYER',
    StartMonitoringTransportPriority = 'START_MONITORING_TRANSPORT_PRIORITY',
    StopMonitoringTransportPriority = 'STOP_MONITORING_TRANSPORT_PRIORITY',
    GetTransportPriority = 'GET_TRANSPORT_PRIORITY',
    SetTransportPriority = 'SET_TRANSPORT_PRIORITY',

    // Player - military
    GetStrength = 'GET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING',
    GetDefenseStrength = 'GET_DEFENSE_STRENGTH',
    GetDefenseFromSurrounding = 'GET_DEFENSE_FROM_SURROUNDING_BUILDINGS',
    GetMilitaryCloseToBorder = 'GET_POPULATE_MILITARY_CLOSE_TO_BORDER',
    GetMilitaryAwayFromBorder = 'GET_POPULATE_MILITARY_CLOSER_TO_BORDER',
    GetMilitaryFarFromBorder = 'GET_POPULATE_MILITARY_FAR_FROM_BORDER',
    GetMilitarySettings = 'GET_MILITARY_SETTINGS',
    GetSoldiersAvailableForAttack = 'GET_SOLDIERS_AVAILABLE_FOR_ATTACK',
    SetReservedInHeadquarters = 'SET_RESERVED_IN_HEADQUARTERS',
    SetStrength = 'SET_STRENGTH_WHEN_POPULATING_MILITARY_BUILDING',
    SetDefenseStrength = 'SET_DEFENSE_STRENGTH',
    SetDefenseFromSurrounding = 'SET_DEFENSE_FROM_SURROUNDING_BUILDINGS',
    SetMilitaryFromFromBorder = 'SET_MILITARY_POPULATION_FAR_FROM_BORDER',
    SetMilitaryAwayFromBorder = 'SET_MILITARY_POPULATION_CLOSER_TO_BORDER',
    SetMilitaryCloseToBorder = 'SET_MILITARY_POPULATION_CLOSE_TO_BORDER',
    SetSoldiersAvailableForAttack = 'SET_SOLDIERS_AVAILABLE_FOR_ATTACK',

    // Player - quotas
    GetFoodQuotas = 'GET_FOOD_QUOTAS',
    GetWheatQuotas = 'GET_WHEAT_QUOTAS',
    GetWaterQuotas = 'GET_WATER_QUOTAS',
    GetCoalQuotas = 'GET_COAL_QUOTAS',
    GetIronBarQuotas = 'GET_IRON_BAR_QUOTAS',
    SetCoalQuotas = 'SET_COAL_QUOTAS',
    SetWheatQuotas = 'SET_WHEAT_QUOTAS',
    SetFoodQuotas = 'SET_FOOD_QUOTAS',
    SetWaterQuotas = 'SET_WATER_QUOTAS',
    SetIronBarQuotas = 'SET_IRON_BAR_QUOTAS',
    MarkGameMessagesRead = 'MARK_GAME_MESSAGES_READ',

    // Houses

    // House
    PlaceBuilding = 'PLACE_BUILDING',
    RemoveBuilding = 'REMOVE_BUILDING',
    Upgrade = 'UPGRADE',
    Attack = 'ATTACK_HOUSE',
    EvacuateHouse = 'EVACUATE_HOUSE',
    UpgradeHouse = 'UPGRADE_HOUSE',
    PauseProduction = 'PAUSE_PRODUCTION',
    ResumeProduction = 'RESUME_PRODUCTION',
    DisablePromotions = 'DISABLE_PROMOTIONS',
    EnablePromotions = 'ENABLE_PROMOTIONS',
    CancelEvacuation = 'CANCEL_EVACUATION',

    // Flag
    PlaceFlag = 'PLACE_FLAG',
    RemoveFlag = 'REMOVE_FLAG',
    GetFlagDebugInformation = 'FLAG_DEBUG_INFORMATION',
    CallScout = 'CALL_SCOUT',
    CallGeologist = 'CALL_GEOLOGIST',

    // Road
    PlaceRoad = 'PLACE_ROAD',
    RemoveRoad = 'REMOVE_ROAD',
    PlaceFlagAndRoad = 'PLACE_FLAG_AND_ROAD',

    // Point
    GetInformationOnPoint = 'INFORMATION_ON_POINTS',

    // Chat messages
    GetChatHistory = 'GET_CHAT_HISTORY_FOR_ROOM',
    SendChatMessageToRoom = 'SEND_CHAT_MESSAGE_TO_ROOM',
    RemoveMessage = 'REMOVE_MESSAGE',
    RemoveMessages = 'REMOVE_MESSAGES',
    ListenToChatMessages = 'LISTEN_TO_CHAT_MESSAGES',

    // Construction
    FindPossibleNewRoad = 'FIND_NEW_ROAD',

    // Workers

    // Misc
    SetSelfPlayer = 'SET_SELF_PLAYER',
    SetGame = 'SET_GAME',
    FullSync = 'FULL_SYNC',
}

// Type functions

// Configuration

// State

// Functions exposed as part of WS API
/**
 * Cancels the evacuation for a specific house.
 * @param {HouseId} houseId - The identifier of the house to cancel evacuation.
 */
function cancelEvacuationForHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.CancelEvacuation, { houseId })
}

/**
 * Disables promotions for a specific house.
 * @param {HouseId} houseId - The identifier of the house to disable promotions.
 */
function disablePromotionsForHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.DisablePromotions, { houseId })
}

/**
 * Enables promotions for a specific house.
 * @param {HouseId} houseId - The identifier of the house to enable promotions.
 */
function enablePromotionsForHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.EnablePromotions, { houseId })
}

/**
 * Finds a possible new road between two points, optionally avoiding certain points.
 * @param {Point} from - The starting point.
 * @param {Point} to - The ending point.
 * @param {Point[]} avoid - Points to avoid during the search (optional).
 * @returns {Promise<PossibleNewRoad>} The possible new road.
 */
async function findPossibleNewRoad(from: Point, to: Point, avoid: Point[] | undefined): Promise<PossibleNewRoad> {
    return (await sendRequestAndWaitForReplyWithOptions<PossibleNewRoad, { from: Point, to: Point, avoid: Point[] | undefined }>(
        Command.FindPossibleNewRoad,
        { from, to, avoid }
    ))
}

/**
 * Pauses production in a specific house.
 * @param {HouseId} houseId - The identifier of the house to pause production.
 */
function pauseProductionForHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.PauseProduction, { houseId })
}

/**
 * Resumes production in a specific house.
 * @param {HouseId} houseId - The identifier of the house to resume production.
 */
function resumeProductionForHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.ResumeProduction, { houseId })
}

/**
 * Upgrades a military house to the next level. I.e. upgrade a barracks to a guard house.
 * @param {HouseId} houseId - The identifier of the house to upgrade.
 */
function upgradeHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.UpgradeHouse, { houseId })
}

/**
 * Evacuates a specific military house.
 * @param {HouseId} houseId - The identifier of the house to evacuate.
 */
function evacuateHouse(houseId: HouseId): void {
    sendWithOptions<{ houseId: HouseId }>(Command.EvacuateHouse, { houseId })
}

/**
 * Retrieves statistics about the ongoing game for each player. Includes production, land owned, and inventory (inventory TBD).
 * @returns {Promise<StatisticsReply>} Statistics about production, inventory (TBD), and land owned for each player
 */
async function getStatistics(): Promise<StatisticsReply> {
    return (await sendRequestAndWaitForReply<{statistics: StatisticsReply}>(Command.GetStatistics)).statistics
}

/**
 * Retrieves land statistics from the game.
 * @returns {Promise<LandStatistics>} The land statistics.
 */
async function getLandStatistics(): Promise<LandStatistics> {
    return (await sendRequestAndWaitForReply<{ landStatistics: LandStatistics }>(Command.GetLandStatistics)).landStatistics
}

/**
 * Retrieves production statistics from the game.
 * @returns {Promise<ProductionStatistics>} The production statistics.
 */
async function getProductionStatistics(): Promise<ProductionStatistics> {
    return (await sendRequestAndWaitForReply<{ productionStatistics: ProductionStatistics }>(Command.GetGameStatistics)).productionStatistics
}

/**
 * Retrieves the current transport priority settings.
 * @returns {Promise<TransportCategory[]>} The transport priority categories.
 */
async function getTransportPriority(): Promise<TransportCategory[]> {
    return (await sendRequestAndWaitForReply<{ priority: TransportCategory[] }>(Command.GetTransportPriority)).priority
}

/**
 * Sets the transport priority for a specific material category.
 * @param {TransportCategory} category - The material category.
 * @param {number} priority - The priority level to set.
 */
function setTransportPriorityForMaterial(category: TransportCategory, priority: number): void {
    sendWithOptions<{ category: TransportCategory, priority: number }>(Command.SetTransportPriority, { category, priority })
}

/**
 * Orders an attack on a specified house.
 * @param {HouseId} houseId - The identifier of the house to attack.
 * @param {number} attackers - The number of attackers to deploy.
 * @param {AttackType} attackType - The type of attack (e.g., strong or weak).
 */
function attackHouse(houseId: HouseId, attackers: number, attackType: AttackType): void {
    sendWithOptions<{ houseId: HouseId, attackers: number, attackType: AttackType }>(Command.Attack, { houseId, attackers, attackType })
}

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

/**
 * Retrieves the current setting for populating military buildings far from the border.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryFarFromBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryFarFromBorder)).amount
}

/**
 * Retrieves the current setting for populating military buildings closer to the border.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryCloserToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryAwayFromBorder)).amount
}

/**
 * Retrieves the current setting for populating military buildings close to the border.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryCloseToBorder(): Promise<number> {
    return (await sendRequestAndWaitForReply<{ amount: number }>(Command.GetMilitaryCloseToBorder)).amount
}

/**
 * Retrieves the overall military settings of the game.
 * @returns {Promise<MilitarySettings>} The current military settings.
 */
async function getMilitarySettings(): Promise<MilitarySettings> {
    return await sendRequestAndWaitForReply<MilitarySettings>(Command.GetMilitarySettings)
}

/**
 * Retrieves the number of soldiers currently available for attack.
 * @returns {Promise<number>} The number of available soldiers.
 */
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
function setInitialResources(resources: ResourceLevel): void {
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

/**
 * Sets the military population allocation for buildings far from the border.
 * @param {number} population - The population to assign.
 */
function setMilitaryPopulationFarFromBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryFromFromBorder, { population })
}

/**
 * Sets the military population allocation for buildings closer to the border.
 * @param {number} population - The population to assign.
 */
function setMilitaryPopulationCloserToBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryAwayFromBorder, { population })
}

/**
 * Sets the military population allocation for buildings close to the border.
 * @param {number} population - The population to assign.
 */
function setMilitaryPopulationCloseToBorder(population: number): void {
    sendWithOptions<{ population: number }>(Command.SetMilitaryCloseToBorder, { population })
}

/**
 * Sets the number of soldiers available for attack.
 * @param {number} amount - The number of soldiers to set.
 */
function setSoldiersAvailableForAttack(amount: number): void {
    sendWithOptions<{ amount: number }>(Command.SetSoldiersAvailableForAttack, { amount })
}

/**
 * Creates a new player in the game.
 * @param {string} name - The name of the player.
 * @param {PlayerColor} color - The player's color.
 * @param {Nation} nation - The player's nation.
 * @param {PlayerType} type - The type of player.
 * @returns {Promise<PlayerInformation>} Information about the created player.
 */
async function createPlayer(name: string, color: PlayerColor, nation: Nation, type: PlayerType): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<AddPlayerReply, AddPlayerOptions>(Command.CreatePlayer, { name, color, nation, type })
    ).playerInformation
}

/**
 * Adds an existing player to a specified game.
 * @param {GameId} gameId - The identifier of the game.
 * @param {PlayerId} playerId - The identifier of the player.
 * @returns {Promise<GameInformation>} The updated game information.
 */
async function addPlayerToGame(gameId: GameId, playerId: PlayerId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, { gameId: GameId, playerId: PlayerId }>(
        Command.AddPlayerToGame,
        { gameId, playerId }
    )).gameInformation
}

/**
 * Updates an existing player's information.
 * @param {PlayerId} playerId - The identifier of the player to update.
 * @param {string} name - The new name of the player.
 * @param {PlayerColor} color - The new color of the player.
 * @param {Nation} nation - The new nation of the player.
 * @returns {Promise<PlayerInformation>} The updated player information.
 */
async function updatePlayer(playerId: PlayerId, name: string, color: PlayerColor, nation: Nation): Promise<PlayerInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ playerInformation: PlayerInformation }, UpdatePlayerOptions>(Command.UpdatePlayer, { playerId, name, color, nation })
    ).playerInformation
}

/**
 * Removes a player from the game.
 * @param {PlayerId} playerId - The identifier of the player to remove.
 */
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

/**
 * Retrieves the terrain information for a specified map.
 * @param {MapId} mapId - The identifier of the map.
 * @returns {Promise<TerrainInformation>} The terrain information for the map.
 */
async function getTerrainForMap(mapId: MapId): Promise<TerrainInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ terrain: TerrainInformation }, { mapId: MapId }>(Command.GetTerrain, { mapId })).terrain
}


/**
 * Retrieves a list of all maps available in the game.
 * @returns {Promise<MapInformation[]>} The list of available maps.
 */
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
    sendWithOptions<{ houseId: HouseId }>(Command.Upgrade, { houseId })
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

/**
 * Sends a chat message to a specific room from a player.
 * @param {string} text - The chat message text.
 * @param {RoomId} roomId - The identifier of the room.
 * @param {PlayerId} from - The identifier of the player sending the message.
 */
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

/**
 * Retrieves information about a specific point in the game world.
 * @param {Point} point - The point to get information on.
 * @returns {Promise<PointInformation>} Information about the specified point.
 */
async function getInformationOnPoint(point: Point): Promise<PointInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>(Command.GetInformationOnPoint, { points: [point] })
    ).pointsWithInformation[0]
}

/**
 * Retrieves information about multiple points in the game world.
 * @param {Point[]} points - The points to get information on.
 * @returns {Promise<PointMap<PointInformation>>} A map of point information.
 */
async function getInformationOnPoints(points: Point[]): Promise<PointMap<PointInformation>> {
    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[] }>(Command.GetInformationOnPoint, { points })

    const map = new PointMap<PointInformation>()

    reply.pointsWithInformation.forEach(pointInformation => map.set({ x: pointInformation.x, y: pointInformation.y }, pointInformation))

    return map
}

/**
 * Sets the number of soldiers reserved in headquarters for a specific rank.
 * @param {SoldierType} rank - The soldier rank.
 * @param {number} amount - The number of soldiers to reserve.
 */
function setReservedSoldiers(rank: SoldierType, amount: number): void {
    sendWithOptions<Partial<Record<SoldierType, number>>>(Command.SetReservedInHeadquarters, { [rank]: amount })
}

/**
 * Adds detailed monitoring for a specific house or flag.
 * @param {HouseId | FlagId} id - The identifier of the house or flag to monitor.
 */
function addDetailedMonitoring(id: HouseId | FlagId): void {
    sendWithOptions<{ id: HouseId | FlagId }>(Command.StartDetailedMonitoring, { id })
}

/**
 * Removes detailed monitoring for a specific house or flag.
 * @param {HouseId | FlagId} id - The identifier of the house or flag to stop monitoring.
 */
function removeDetailedMonitoring(id: HouseId | FlagId): void {
    sendWithOptions<{ id: HouseId | FlagId }>(Command.StopDetailedMonitoring, { id })
}

/**
 * Removes a specific message from the game.
 * @param {GameMessageId} messageId - The identifier of the message to remove.
 */
function removeMessage(messageId: GameMessageId): void {
    sendWithOptions<{ messageId: GameMessageId }>(Command.RemoveMessage, { messageId })
}

/**
 * Removes multiple messages from the game.
 * @param {GameMessage[]} messages - The list of messages to remove.
 */
function removeMessages(messages: GameMessage[]): void {
    sendWithOptions<{ messageIds: GameMessageId[] }>(Command.RemoveMessages, { messageIds: messages.map(message => message.id) })
}

/**
 * Sets the coal quotas for different production facilities.
 * @param {number} mint - The quota for the mint.
 * @param {number} armory - The quota for the armory.
 * @param {number} ironSmelter - The quota for the iron smelter.
 * @returns {void}
 */
function setCoalQuotas(mint: number, armory: number, ironSmelter: number): void {
    sendWithOptions<{ mint: number, armory: number, ironSmelter: number }>(
        Command.SetCoalQuotas,
        { mint, armory, ironSmelter }
    )
}

/**
 * Retrieves the current food quotas.
 * @returns {Promise<FoodQuotas>} The current food quotas.
 */
function getFoodQuotas(): Promise<FoodQuotas> {
    return sendRequestAndWaitForReply<FoodQuotas>(Command.GetFoodQuotas)
}

/**
 * Sets the wheat quotas for different production facilities.
 * @param {number} donkeyFarm - The quota for the donkey farm.
 * @param {number} pigFarm - The quota for the pig farm.
 * @param {number} mill - The quota for the mill.
 * @param {number} brewery - The quota for the brewery.
 * @returns {void}
 */

function setWheatQuotas(donkeyFarm: number, pigFarm: number, mill: number, brewery: number): void {
    sendWithOptions<{ donkeyFarm: number, pigFarm: number, mill: number, brewery: number }>(
        Command.SetWheatQuotas,
        { donkeyFarm, pigFarm, mill, brewery }
    )
}

/**
 * Retrieves the current wheat quotas.
 * @returns {Promise<WheatQuotas>} The current wheat quotas.
 */

function getWheatQuotas(): Promise<WheatQuotas> {
    return sendRequestAndWaitForReply<WheatQuotas>(Command.GetWheatQuotas)
}

/**
 * Retrieves the current water quotas.
 * @returns {Promise<WaterQuotas>} The current water quotas.
 */
function getWaterQuotas(): Promise<WaterQuotas> {
    return sendRequestAndWaitForReply<WaterQuotas>(Command.GetWaterQuotas)
}

/**
 * Retrieves the current coal quotas.
 * @returns {Promise<CoalQuotas>} The current coal quotas.
 */
function getCoalQuotas(): Promise<CoalQuotas> {
    return sendRequestAndWaitForReply<CoalQuotas>(Command.GetCoalQuotas)
}

/**
 * Retrieves the current iron bar quotas.
 * @returns {Promise<IronBarQuotas>} The current iron bar quotas.
 */
function getIronBarQuotas(): Promise<IronBarQuotas> {
    return sendRequestAndWaitForReply<IronBarQuotas>(Command.GetIronBarQuotas)
}

/**
 * Sets the food quotas for different mines.
 * @param {number} ironMine - The quota for the iron mine.
 * @param {number} coalMine - The quota for the coal mine.
 * @param {number} goldMine - The quota for the gold mine.
 * @param {number} graniteMine - The quota for the granite mine.
 * @returns {void}
 */
function setFoodQuotas(ironMine: number, coalMine: number, goldMine: number, graniteMine: number): void {
    sendWithOptions<{ ironMine: number, coalMine: number, goldMine: number, graniteMine: number }>(
        Command.SetFoodQuotas,
        { ironMine, coalMine, goldMine, graniteMine }
    )
}

/**
 * Sets the water quotas for different production facilities.
 * @param {number} bakery - The quota for the bakery.
 * @param {number} donkeyFarm - The quota for the donkey farm.
 * @param {number} pigFarm - The quota for the pig farm.
 * @param {number} brewery - The quota for the brewery.
 * @returns {void}
 */
function setWaterQuotas(bakery: number, donkeyFarm: number, pigFarm: number, brewery: number): void {
    sendWithOptions<{ bakery: number, donkeyFarm: number, pigFarm: number, brewery: number }>(
        Command.SetWaterQuotas,
        { bakery, donkeyFarm, pigFarm, brewery })
}

/**
 * Sets the iron bar quotas for different production facilities.
 * @param {number} armory - The quota for the armory.
 * @param {number} metalworks - The quota for the metalworks.
 * @returns {void}
 */
function setIronBarQuotas(armory: number, metalworks: number): void {
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

/**
 * Deletes the current game.
 */
function deleteGame(): void {
    send(Command.DeleteGame)
}

/**
 * Pauses the current game.
 * @returns {void}
*/
function pauseGame(): void {
    send(Command.PauseGame)
}

/**
 * Resumes the current game after a pause.
 * @returns {void}
*/
function resumeGame(): void {
    send(Command.ResumeGame)
}

/**
 * Places a house at a specific point on the map.
 * @param {AnyBuilding} type - The type of house to place.
 * @param {Point} point - The location to place the house.
 * @returns {void}
*/
function placeHouse(type: AnyBuilding, point: Point): void {
    sendWithOptions<{ x: number, y: number, type: AnyBuilding }>(Command.PlaceBuilding, { ...point, type })
}

/**
 * Places a road along specified points on the map.
 * @param {Point[]} points - The points that define the road path.
 */
function placeRoad(points: Point[]): void {
    sendWithOptions<{ road: Point[] }>(Command.PlaceRoad, { road: points })
}

/**
 * Places a flag at a specific point on the map.
 * @param {Point} flag - The location to place the flag.
 */
function placeFlag(flag: Point): void {
    sendWithOptions<{ flag: Point }>(Command.PlaceFlag, { flag })
}

/**
 * Places a flag and a road at specified points on the map.
 * @param {Point} flag - The location to place the flag.
 * @param {Point[]} points - The points that define the road path.
 */
function placeRoadWithFlag(flag: Point, points: Point[]): void {
    sendWithOptions<{ flag: Point, road: Point[] }>(Command.PlaceFlagAndRoad, { flag, road: points })
}

/**
 * Removes a flag from the map using its ID.
 * @param {FlagId} id - The identifier of the flag to remove.
 */
function removeFlag(id: FlagId): void {
    sendWithOptions<{ id: FlagId }>(Command.RemoveFlag, { id })
}

/**
 * Removes a road from the map using its ID.
 * @param {RoadId} id - The identifier of the road to remove.
 */
function removeRoad(id: RoadId): void {
    sendWithOptions<{ id: RoadId }>(Command.RemoveRoad, { id })
}

/**
 * Removes a building from the map using its ID.
 * @param {HouseId} id - The identifier of the building to remove.
 */
function removeBuilding(id: HouseId): void {
    sendWithOptions<{ id: HouseId }>(Command.RemoveBuilding, { id })
}

/**
 * Calls a scout to explore a specific point on the map.
 * @param {Point} point - The location to send the scout.
 */
function callScout(point: Point): void {
    sendWithOptions<{ point: Point }>(Command.CallScout, { point })
}

/**
 * Calls a geologist to survey a specific point on the map.
 * @param {Point} point - The location to send the geologist.
 */
function callGeologist(point: Point): void {
    sendWithOptions<{ point: Point }>(Command.CallGeologist, { point })
}

/**
 * Marks a set of messages as read.
 * @param {GameMessageId[]} messageIds - A list of ids of the messages to mark as read
 */
function markGameMessagesRead(messageIds: GameMessageId[]): void {
    sendWithOptions<{ messageIds: GameMessageId[] }>(Command.MarkGameMessagesRead, { messageIds })
}

/**
 * Retrieves the player's current view of the game. Internal function not exposed outside the module.
 * @returns {Promise<PlayerViewInformation>} The current view of the game.
 */
// eslint-disable-next-line
async function getViewForPlayer(): Promise<PlayerViewInformation> {
    return (await sendRequestAndWaitForReply<{ playerView: PlayerViewInformation }>(Command.FullSync)).playerView
}

// Functions internal to WS API
/**
 * Listens for updates on game metadata.
 * @returns {Promise<GameInformation>} The latest game metadata.
 */
async function listenToGameMetadata(): Promise<GameInformation> {
    return (await sendRequestAndWaitForReply<{ gameInformation: GameInformation }>(Command.ListenToGameInfo)).gameInformation
}

/**
 * Instructs the backend to send messages when there are changes to the games list. This includes both
 * adding/removing games, and changes to the metadata of existing games.
 */
function listenToGamesList(): void {
    send(Command.ListenToGameList)
}

/**
 * Instructs the backend to send chat messages sent to the player and/or rooms to the API.
 * @param playerId (optional) The id of the player to listen for chat messages to
 * @param roomIds (optional) The id(s) of the room(s) to listen for chat messages to
 */
function listenToChatMessages(playerId: PlayerId, roomIds: RoomId[]): void {
    sendWithOptions<{ playerId: PlayerId, roomIds: RoomId[] }>(Command.ListenToChatMessages, { playerId, roomIds })
}

/**
 * Instructs the backend to send messages when statistics data has changed.
 * @param {PlayerId} playerId - The id of the player
 */
function listenToStatistics(playerId: PlayerId): void {
    sendWithOptions<{ playerId: PlayerId }>(Command.ListenToStatistics, { playerId })
}

function stopListeningToStatistics(playerId: PlayerId): void {
    sendWithOptions<{ playerId: PlayerId }>(Command.StopListeningToStatistics, { playerId })
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
    setInitialResources,
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
    placeHouse,
    placeRoad,
    placeFlag,
    placeRoadWithFlag,
    removeFlag,
    removeRoad,
    removeBuilding,
    callScout,
    callGeologist,
    getViewForPlayer,
    listenToGameMetadata,
    listenToGamesList,
    listenToChatMessages,
    attackHouse,
    evacuateHouse,
    upgradeHouse,
    findPossibleNewRoad,
    deleteGame,
    disablePromotionsForHouse,
    enablePromotionsForHouse,
    pauseProductionForHouse,
    resumeProductionForHouse,
    cancelEvacuationForHouse,
    setTransportPriorityForMaterial,
    getTerrainForMap,
    getProductionStatistics,
    getLandStatistics,
    getStatistics,
    getTransportPriority,
    listenToStatistics,
    stopListeningToStatistics,
    markGameMessagesRead
}