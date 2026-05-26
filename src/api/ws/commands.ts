import { PointMap } from '../../utils/util_types_ng'
import { Player, PlayerType, PlayerInformation, PlayerId, PlayerColor, Nation, PointInformation, MapId, GameInformation, ResourceLevel, GameSpeed, GameId, RoomId, ChatMessage, MapInformation, HouseId, FlagId, FlagDebugInfo, Point, SoldierType, GameMessageId, GameMessage, AnyBuilding, RoadId, AvailableConstruction, BorderInformation, CropInformation, Decoration, FlagInformation, GameState, HouseInformation, RoadInformation, ServerWorkerInformation, ShipInformation, SignInformation, StoneInformation, TreeInformation, WildAnimalInformation, AttackType, TransportCategory, TerrainInformation, VegetationAsInt, StatisticsPerPlayer, MerchandiseStatistics, Tool, CheatCode, Material, MapWithTerrain } from '../types'
import { send, sendWithOptions, sendRequestAndWaitForReply, sendRequestAndWaitForReplyWithOptions } from './core'


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

type ExistingPlayerById = {
    id: PlayerId
}

type NewPlayerToCreate = {
    name: string
    color: PlayerColor
    nation: Nation
}

type CreateNewGameOptions = {
    name: string
    players: (ExistingPlayerById | NewPlayerToCreate)[]
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
    tilesBelow: VegetationAsInt[]
    tilesDownRight: VegetationAsInt[]
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
    StopListeningToGameList = 'STOP_LISTENING_TO_GAME_LIST',

    // Maps
    GetMap = 'GET_MAP',
    GetMaps = 'GET_MAPS',
    GetMapsWithTerrain = 'GET_MAPS_WITH_TERRAIN',
    GetMapWithTerrain = 'GET_MAP_WITH_TERRAIN',

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
    SetCheatingOnOff = 'SET_CHEATING_ON_OFF',
    SetGameSpeed = 'SET_GAME_SPEED',
    AddPlayerToGame = 'ADD_PLAYER_TO_GAME',
    GetGameInformation = 'GET_GAME_INFORMATION',
    StartMonitoringGame = 'START_MONITORING_GAME',
    ListenToGameInfo = 'LISTEN_TO_GAME_INFO',
    StartDetailedMonitoring = 'START_DETAILED_MONITORING',
    StopDetailedMonitoring = 'STOP_DETAILED_MONITORING',
    GetStatistics = 'GET_STATISTICS',
    ListenToStatistics = 'LISTEN_TO_STATISTICS',
    StopListeningToStatistics = 'STOP_LISTENING_TO_STATISTICS',
    StopListeningToGameInfo = 'STOP_LISTENING_TO_GAME_INFO',

    // Player
    CreatePlayer = 'CREATE_PLAYER',
    UpdatePlayer = 'UPDATE_PLAYER',
    RemovePlayer = 'REMOVE_PLAYER',
    StartMonitoringTransportPriority = 'START_MONITORING_TRANSPORT_PRIORITY',
    StopMonitoringTransportPriority = 'STOP_MONITORING_TRANSPORT_PRIORITY',
    GetTransportPriority = 'GET_TRANSPORT_PRIORITY',
    SetTransportPriority = 'SET_TRANSPORT_PRIORITY',
    GetToolPriorities = 'GET_TOOL_PRODUCTION_PRIORITIES',
    SetToolPriority = 'SET_TOOL_PRODUCTION_PRIORITY',
    Cheat = 'CHEAT',
    ListenToPlayer = 'LISTEN_TO_PLAYER',
    StopListeningToPlayer = 'STOP_LISTENING_TO_PLAYER',

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
    SetMilitaryFarFromFromBorder = 'SET_MILITARY_POPULATION_FAR_FROM_BORDER',
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
    PauseProduction = 'PAUSE_PRODUCTION',
    ResumeProduction = 'RESUME_PRODUCTION',
    DisablePromotions = 'DISABLE_PROMOTIONS',
    EnablePromotions = 'ENABLE_PROMOTIONS',
    CancelEvacuation = 'CANCEL_EVACUATION',

    // House - headquarters
    BlockMaterial = 'BLOCK_MATERIAL',
    AllowMaterial = 'ALLOW_MATERIAL',
    SendOut = 'SEND_OUT_MATERIAL',
    StopSendingOut = 'STOP_SENDING_OUT_MATERIAL',


    // Flag
    PlaceFlag = 'PLACE_FLAG',
    RemoveFlag = 'REMOVE_FLAG',
    GetFlagDebugInformation = 'FLAG_DEBUG_INFORMATION',
    CallScout = 'CALL_SCOUT',
    CallGeologist = 'CALL_GEOLOGIST',

    // Road
    PlaceRoad = 'PLACE_ROAD',
    RemoveRoad = 'REMOVE_ROAD',
    FindPossibleNewRoad = 'FIND_NEW_ROAD',
    PlaceFlagAndRoad = 'PLACE_FLAG_AND_ROAD',

    // Point
    GetInformationOnPoint = 'INFORMATION_ON_POINTS',

    // Chat messages
    GetChatHistory = 'GET_CHAT_HISTORY_FOR_ROOM',
    SendChatMessageToRoom = 'SEND_CHAT_MESSAGE_TO_ROOM',
    RemoveMessage = 'REMOVE_MESSAGE',
    RemoveMessages = 'REMOVE_MESSAGES',
    ListenToChatMessages = 'LISTEN_TO_CHAT_MESSAGES',

    // Workers

    // Misc
    FullSync = 'FULL_SYNC',
}

type CancelEvacuationForHouse = { houseId: HouseId }
type DisablePromotionsForHouse = { houseId: HouseId }
type EnablePromotionsForHouse = { houseId: HouseId }
type FindPossibleNewRoad = { from: Point, to: Point, avoid: Point[] | undefined, playerId: PlayerId }
type PauseProductionForHouse = { houseId: HouseId }
type ResumeProductionForHouse = { houseId: HouseId }
type EvacuateHouse = { houseId: HouseId }
type SetToolPriority = { playerId: PlayerId, tool: Tool, priority: number }
type GetToolPriorities = { playerId: PlayerId }
type GetStatistics = {gameId: GameId, playerId: PlayerId}
type GetTransportPriority = {playerId: PlayerId}
type SetTransportPriority = { playerId: PlayerId, category: TransportCategory, priority: number }
type AttackHouse = { houseId: HouseId, attackers: number, attackType: AttackType, playerId: PlayerId }
type SetStrengthWhenPopulatingMilitaryBuildings = { strength: number, playerId: PlayerId }
type SetDefenseStrength = { strength: number, playerId: PlayerId }
type SetDefenseFromSurroundingBuildings = { strength: number, playerId: PlayerId }
type StartGame = { gameId: GameId }
type SetMap = { mapId: MapId, gameId: GameId }
type SetOthersCanJoin = { othersCanJoin: boolean, gameId: GameId }
type SetInitialResources = { resources: ResourceLevel, gameId: GameId }
type SetGameName = { name: string, gameId: GameId }
type SetCheatingOnOff = { cheatingEnabled: boolean, gameId: GameId }
type SetGameSpeed = { speed: GameSpeed, gameId: GameId }
type SetMilitaryPopulationFarFromBorder = { population: number, playerId: PlayerId }
type SetMilitaryPopulationCloserToBorder = { population: number, playerId: PlayerId }
type SetMilitaryPopulationCloseToBorder = { population: number, playerId: PlayerId }
type SetSoldiersAvailableForAttack = { amount: number, playerId: PlayerId }
type AddPlayerToGame = { gameId: GameId, playerId: PlayerId }
type RemovePlayer = { playerId: PlayerId, gameId: GameId }
type ListenToPlayer = { playerId: PlayerId }
type StopListeningToPlayer = { playerId: PlayerId }
type GetChatRoomHistory = { roomId: RoomId }
type GetTerrainForMap = { mapId: MapId }
type GetMap = { mapId: MapId }
type Upgrade = { houseId: HouseId }
type GetFlagDebugInfo = { flagId: FlagId, gameId: GameId }
type SetReservedSoldiers = Partial<Record<SoldierType, number>> & { playerId: PlayerId }
type AddDetailedMonitoring = { id: HouseId | FlagId, playerId: PlayerId }
type RemoveDetailedMonitoring = { id: HouseId | FlagId, playerId: PlayerId }
type RemoveMessage = { messageId: GameMessageId, playerId: PlayerId }
type RemoveMessages = { messageIds: GameMessageId[], playerId: PlayerId }
type SetCoalQuotas = { mint: number, armory: number, ironSmelter: number, playerId: PlayerId}
type SetWheatQuotas = { donkeyFarm: number, pigFarm: number, mill: number, brewery: number, playerId: PlayerId }
type SetFoodQuotas = { ironMine: number, coalMine: number, goldMine: number, graniteMine: number, playerId: PlayerId }
type SetWaterQuotas = { bakery: number, donkeyFarm: number, pigFarm: number, brewery: number, playerId: PlayerId }
type SetIronBarQuotas = { armory: number, metalworks: number, playerId: PlayerId }
type DeleteGame = { gameId: GameId }
type PauseGame = { gameId: GameId }
type ResumeGame = { gameId: GameId }
type PlaceHouse = { x: number, y: number, type: AnyBuilding, playerId: PlayerId }
type BlockDelivery = {houseId: HouseId, material: Material}
type AllowDelivery = {houseId: HouseId, material: Material}
type SendOut = {houseId: HouseId, material: Material}
type StopSendingOut = {houseId: HouseId, material: Material}
type PlaceRoad = { road: Point[], playerId: PlayerId }
type PlaceFlag = { flag: Point, playerId: PlayerId }
type PlaceRoadWithFlag = { flag: Point, road: Point[], playerId: PlayerId }
type RemoveFlag = { id: FlagId }
type RemoveRoad = { id: RoadId }
type RemoveBuilding = { id: HouseId }
type CallScout = { point: Point, playerId: PlayerId }
type CallGeologist = { point: Point, playerId: PlayerId }
type MarkGameMessagesRead = { messageIds: GameMessageId[], playerId: PlayerId }
type ListenToChatMessages = { playerId: PlayerId, roomIds: RoomId[] }
type ListenToGameMetadata = { gameId: GameId }
type ListenToStatistics = { playerId: PlayerId }
type StopListeningToStatistics = { playerId: PlayerId }
type StartMonitoringGame = { playerId: PlayerId, gameId: GameId }
type GetGameInformation = { gameId: GameId }
type GetSoldiersAvailableForAttack = { playerId: PlayerId }
type GetPopulateMilitaryFarFromBorder = { playerId: PlayerId }
type GetMilitaryAwayFromBorder = { playerId: PlayerId }
type GetMilitaryCloseToBorder = { playerId: PlayerId }
type GetMilitarySettings = {playerId: PlayerId}
type GetDefenseFromSurrounding = {playerId: PlayerId}
type GetDefenseStrength = {playerId: PlayerId}
type GetStrengthWhenPopulatingMilitaryBuildings = {playerId: PlayerId}
type GetIronBarQuotas = { playerId: PlayerId }
type GetWaterQuotas = { playerId: PlayerId }
type GetWheatQuotas = { playerId: PlayerId }
type GetFoodQuotas = { playerId: PlayerId }
type GetCoalQuotas = { playerId: PlayerId }
type GetViewForPlayer = { playerId: PlayerId, gameId: GameId }


// Type functions

// Configuration

// State

// Functions exposed as part of WS API
/**
 * Cancels the evacuation for a specific house.
 * @param {HouseId} houseId - The identifier of the house to cancel evacuation.
 */
function cancelEvacuationForHouse(houseId: HouseId): void {
    sendWithOptions<CancelEvacuationForHouse>(Command.CancelEvacuation, { houseId })
}

/**
 * Disables promotions for a specific house.
 * @param {HouseId} houseId - The identifier of the house to disable promotions.
 */
function disablePromotionsForHouse(houseId: HouseId): void {
    sendWithOptions<DisablePromotionsForHouse>(Command.DisablePromotions, { houseId })
}

/**
 * Enables promotions for a specific house.
 * @param {HouseId} houseId - The identifier of the house to enable promotions.
 */
function enablePromotionsForHouse(houseId: HouseId): void {
    sendWithOptions<EnablePromotionsForHouse>(Command.EnablePromotions, { houseId })
}

/**
 * Finds a possible new road between two points, optionally avoiding certain points.
 * @param {Point} from - The starting point.
 * @param {Point} to - The ending point.
 * @param {Point[] | undefined} avoid - Points to avoid during the search (optional).
 * @returns {Promise<PossibleNewRoad>} The possible new road.
 */
async function findPossibleNewRoad(from: Point, to: Point, avoid: Point[] | undefined, playerId: PlayerId): Promise<PossibleNewRoad> {
    return (await sendRequestAndWaitForReplyWithOptions<PossibleNewRoad, FindPossibleNewRoad>(
        Command.FindPossibleNewRoad,
        { from, to, avoid, playerId }
    ))
}

/**
 * Pauses production in a specific house.
 * @param {HouseId} houseId - The identifier of the house to pause production.
 */
function pauseProductionForHouse(houseId: HouseId): void {
    sendWithOptions<PauseProductionForHouse>(Command.PauseProduction, { houseId })
}

/**
 * Resumes production in a specific house.
 * @param {HouseId} houseId - The identifier of the house to resume production.
 */
function resumeProductionForHouse(houseId: HouseId): void {
    sendWithOptions<ResumeProductionForHouse>(Command.ResumeProduction, { houseId })
}

/**
 * Evacuates a specific military house.
 * @param {HouseId} houseId - The identifier of the house to evacuate.
 */
function evacuateHouse(houseId: HouseId): void {
    sendWithOptions<EvacuateHouse>(Command.EvacuateHouse, { houseId })
}

/**
 * Retrieves statistics about the ongoing game for each player. Includes production, land owned, and inventory.
 * @param {GameId} gameId - The identifier of the game for which to retrieve statistics.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the statistics.
 * @returns {Promise<StatisticsReply>} Statistics about production, inventory (TBD), and land owned for each player
 */
async function getStatistics(gameId: GameId, playerId: PlayerId): Promise<StatisticsReply> {
    return (await sendRequestAndWaitForReplyWithOptions<{ statistics: StatisticsReply }, GetStatistics>(Command.GetStatistics, { gameId, playerId })).statistics
}

/**
 * Retrieves the current transport priority settings.
 * @returns {Promise<TransportCategory[]>} The transport priority categories.
 */
async function getTransportPriority(playerId: PlayerId): Promise<TransportCategory[]> {
    return (await sendRequestAndWaitForReplyWithOptions<{ priority: TransportCategory[] }, GetTransportPriority>(Command.GetTransportPriority, { playerId })).priority
}

/**
 * Retrieves the current tool production priorities for the player.
 * @param {PlayerId} playerId - The identifier of the player.
 * @returns {Promise<{ [key in Tool]: number }>} The tool production priorities.
 */
async function getToolPriorities(playerId: PlayerId): Promise<{ [key in Tool]: number }> {
    return (await sendRequestAndWaitForReplyWithOptions<{ toolPriorities: { [key in Tool]: number } }, GetToolPriorities>(Command.GetToolPriorities, { playerId })).toolPriorities
}

function setToolPriority(playerId: PlayerId, tool: Tool, priority: number): void {
    sendWithOptions<SetToolPriority>(Command.SetToolPriority, { playerId, tool, priority })
}

/**
 * Sets the transport priority for a specific material category.
 * @param {PlayerId} playerId - The id of the player.
 * @param {TransportCategory} category - The material category.
 * @param {number} priority - The priority level to set.
 */
function setTransportPriorityForMaterial(playerId: PlayerId, category: TransportCategory, priority: number): void {
    sendWithOptions<SetTransportPriority>(Command.SetTransportPriority, { playerId, category, priority })
}

/**
 * Orders an attack on a specified house.
 * @param {HouseId} houseId - The identifier of the house to attack.
 * @param {number} attackers - The number of attackers to deploy.
 * @param {AttackType} attackType - The type of attack (e.g., strong or weak).
 */
function attackHouse(houseId: HouseId, attackers: number, attackType: AttackType, playerId: PlayerId): void {
    sendWithOptions<AttackHouse>(Command.Attack, { houseId, attackers, attackType, playerId })
}

/**
 * Sets the strength for populating military buildings.
 * 
 * @param {number} strength - The strength value to be set.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the strength.
 */
function setStrengthWhenPopulatingMilitaryBuildings(strength: number, playerId: PlayerId): void {
    sendWithOptions<SetStrengthWhenPopulatingMilitaryBuildings>(Command.SetStrength, { strength, playerId })
}

/**
 * Retrieves the current strength used when populating military buildings.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the strength setting.
 * @returns {Promise<number>} The current strength setting.
 */
async function getStrengthWhenPopulatingMilitaryBuildings(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetStrengthWhenPopulatingMilitaryBuildings>(Command.GetStrength, { playerId })).amount
}

/**
 * Sets the overall defense strength.
 * 
 * @param {number} strength - The defense strength to set.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the defense strength.
 */
function setDefenseStrength(strength: number, playerId: PlayerId): void {
    sendWithOptions<SetDefenseStrength>(Command.SetDefenseStrength, { strength, playerId })
}

/**
 * Retrieves the overall defense strength.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the defense strength.
 * @returns {Promise<number>} The current defense strength.
 */
async function getDefenseStrength(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetDefenseStrength>(Command.GetDefenseStrength, { playerId })).amount
}

/**
 * Sets the defense strength derived from surrounding buildings.
 * @param {number} strength - The surrounding defense strength to set.
 */
function setDefenseFromSurroundingBuildings(strength: number, playerId: PlayerId): void {
    sendWithOptions<SetDefenseFromSurroundingBuildings>(Command.SetDefenseFromSurrounding, { strength, playerId })
}

/**
 * Retrieves the defense strength from surrounding buildings.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the defense strength.
 * @returns {Promise<number>} The current surrounding defense strength.
 */
async function getDefenseFromSurroundingBuildings(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetDefenseFromSurrounding>(Command.GetDefenseFromSurrounding, { playerId })).amount
}

/**
 * Retrieves the current setting for populating military buildings far from the border.
 * @param {PlayerId} playerId - The identifier of the player.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryFarFromBorder(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetPopulateMilitaryFarFromBorder>(Command.GetMilitaryFarFromBorder, { playerId })).amount
}

/**
 * Retrieves the current setting for populating military buildings closer to the border.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryCloserToBorder(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetMilitaryAwayFromBorder>(Command.GetMilitaryAwayFromBorder, { playerId })).amount
}

/**
 * Retrieves the current setting for populating military buildings close to the border.
 * @returns {Promise<number>} The current setting value.
 */
async function getPopulateMilitaryCloseToBorder(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetMilitaryCloseToBorder>(Command.GetMilitaryCloseToBorder, { playerId })).amount
}

/**
 * Retrieves the overall military settings of the game.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the military settings.
 * @returns {Promise<MilitarySettings>} The current military settings.
 */
async function getMilitarySettings(playerId: PlayerId): Promise<MilitarySettings> {
    return await sendRequestAndWaitForReplyWithOptions<MilitarySettings, GetMilitarySettings>(Command.GetMilitarySettings, { playerId })
}

/**
 * Retrieves the number of soldiers currently available for attack.
 * @param {PlayerId} playerId - The identifier of the player.
 * @returns {Promise<number>} The number of available soldiers.
 */
async function getSoldiersAvailableForAttack(playerId: PlayerId): Promise<number> {
    return (await sendRequestAndWaitForReplyWithOptions<{ amount: number }, GetSoldiersAvailableForAttack>(Command.GetSoldiersAvailableForAttack, { playerId })).amount
}

/**
 * Starts the game
 */
function startGame(gameId: GameId): void {
    sendWithOptions<StartGame>(Command.StartGame, { gameId })
}

/**
 * Sets the map to be used for the game by specifying a map id.
 * @param {MapId} mapId - The identifier for the map.
 * @param {GameId} gameId - The identifier of the game for which to set the map.
 */
function setMap(mapId: MapId, gameId: GameId): void {
    sendWithOptions<SetMap>(Command.SetMap, { mapId, gameId })
}

/**
 * Sets whether other players can join the game.
 * @param {boolean} othersCanJoin - Whether others can join the game.
 * @param {GameId} gameId - The identifier of the game for which to set the joinability.
 * @returns {Promise<GameInformation>} Updated game information after setting the joinability.
 */
async function setOthersCanJoin(othersCanJoin: boolean, gameId: GameId): Promise<GameInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, SetOthersCanJoin>(Command.SetOthersCanJoin, { othersCanJoin, gameId })
    ).gameInformation
}

/**
 * Sets the initial resources for the game.
 * @param {ResourceLevel} resources - The levels of initial resources to set.
 * @param {GameId} gameId - The identifier of the game for which to set the initial resources.
 * @returns {Promise<GameInformation>} Updated game information after setting the initial resources.
 */
function setInitialResources(resources: ResourceLevel, gameId: GameId): void {
    sendWithOptions<SetInitialResources>(Command.SetInitialResources, { resources, gameId })
}

/**
 * Sets the title of the game.
 * @param {string} name - The name of the game.
 * @param {GameId} gameId - The identifier of the game for which to set the title.
 */
function setTitle(name: string, gameId: GameId): void {
    sendWithOptions<SetGameName>(Command.SetGameName, { name, gameId })
}

/**
 * Turns the possibility to cheat on/off in the game.
 * @param {boolean} cheatingEnabled - Whether cheating should be enabled or not.
 * @param {GameId} gameId - The identifier of the game.
 */
function setCheating(cheatingEnabled: boolean, gameId: GameId): void {
    sendWithOptions<SetCheatingOnOff>(Command.SetCheatingOnOff, { cheatingEnabled, gameId })
}

/**
 * Sets the speed of the game.
 * @param {GameSpeed} speed - The speed setting for the game.
 * @param {GameId} gameId - The identifier of the game.
 */
function setGameSpeed(speed: GameSpeed, gameId: GameId): void {
    sendWithOptions<SetGameSpeed>(Command.SetGameSpeed, { speed, gameId })
}

/**
 * Sets the military population allocation for buildings far from the border.
 * @param {number} population - The population to assign.
 * @param {PlayerId} playerId - The identifier of the player.
 */
function setMilitaryPopulationFarFromBorder(population: number, playerId: PlayerId): void {
    sendWithOptions<SetMilitaryPopulationFarFromBorder>(Command.SetMilitaryFarFromFromBorder, { population, playerId })
}

/**
 * Sets the military population allocation for buildings closer to the border.
 * @param {number} population - The population to assign.
 * @param {PlayerId} playerId - The identifier of the player.
 */
function setMilitaryPopulationCloserToBorder(population: number, playerId: PlayerId): void {
    sendWithOptions<SetMilitaryPopulationCloserToBorder>(Command.SetMilitaryAwayFromBorder, { population, playerId })
}

/**
 * Sets the military population allocation for buildings close to the border.
 * @param {number} population - The population to assign.
 * @param {PlayerId} playerId - The identifier of the player.
 */
function setMilitaryPopulationCloseToBorder(population: number, playerId: PlayerId): void {
    sendWithOptions<SetMilitaryPopulationCloseToBorder>(Command.SetMilitaryCloseToBorder, { population, playerId })
}

/**
 * Sets the number of soldiers available for attack.
 * @param {number} amount - The number of soldiers to set.
 * @param {PlayerId} playerId - The identifier of the player.
 */
function setSoldiersAvailableForAttack(amount: number, playerId: PlayerId): void {
    sendWithOptions<SetSoldiersAvailableForAttack>(Command.SetSoldiersAvailableForAttack, { amount, playerId })
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
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, AddPlayerToGame>(
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
 * @param {GameId} gameId - The identifier of the game from which to remove the player.
 */
function removePlayer(playerId: PlayerId, gameId: GameId): void {
    sendWithOptions<RemovePlayer>(Command.RemovePlayer, { playerId, gameId })
}

/**
 * Listen to changes to the given player.
 * @param {PlayerId} playerId - The identifier of the player to listen to.
 */
function listenToPlayer(playerId: PlayerId): void {
    sendWithOptions<ListenToPlayer>(Command.ListenToPlayer, { playerId })
}

/**
 * Stop listening to changes to the given player.
 * @param {PlayerId} playerId - The identifier of the player to stop listening to.
 */
function stopListeningToPlayer(playerId: PlayerId): void {
    sendWithOptions<StopListeningToPlayer>(Command.StopListeningToPlayer, { playerId })
}

/**
 * Gets the chat history for a chat room
 * @param {RoomId} roomId - The id of the chat room
 * @returns {Promise<ChatMessage[]>} The chat history as a list of chat messages
 */
async function getChatRoomHistory(roomId: RoomId): Promise<ChatMessage[]> {
    return (
        await sendRequestAndWaitForReplyWithOptions<{ chatHistory: ChatMessage[] }, GetChatRoomHistory>(Command.GetChatHistory, { roomId })
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
    return (await sendRequestAndWaitForReplyWithOptions<{ terrain: TerrainInformation }, GetTerrainForMap>(Command.GetTerrain, { mapId })).terrain
}

/**
 * Retrieves a list of all maps available in the game.
 * @returns {Promise<MapInformation[]>} The list of available maps.
 */
async function getMaps(): Promise<MapInformation[]> {
    return (await sendRequestAndWaitForReply<{ maps: MapInformation[] }>(Command.GetMaps)).maps
}

/**
 * Retrieves a list of all maps available in the game including their terrain.
 * @returns {Promise<MapWithTerrain[]>} The list of available maps with terrain.
 */
async function getMapsWithTerrain(): Promise<MapWithTerrain[]> {
    return (await sendRequestAndWaitForReply<{ maps: MapWithTerrain[] }>(Command.GetMapsWithTerrain)).maps
}

/**
 * Retrieves metadata and terrain information about the map with the given id.
 * @param {MapId} mapId - The id of the map.
 * @returns {Promise<MapWithTerrain>} The metadata and terrain for the map.
 */
async function getMapWithTerrain(mapId: MapId): Promise<MapWithTerrain> {
    return (await sendRequestAndWaitForReplyWithOptions<{ map: MapWithTerrain }, GetMap>(Command.GetMapWithTerrain, { mapId })).map
}

/**
 * Retrieves a map
 * @returns {Promise<MapInformation>} The requested map.
 */
async function getMap(mapId: MapId): Promise<MapInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ map: MapInformation }, GetMap>(Command.GetMap, { mapId })).map
}

/**
 * Retrieves game information by querying the game state.
 * @param {GameId} gameId - The identifier of the game for which to retrieve information.
 * @returns {Promise<GameInformation>} Current game information.
 */
async function getGameInformation(gameId: GameId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, GetGameInformation>(Command.GetGameInformation, { gameId })).gameInformation
}

/**
 * Upgrades a specific house using its ID.
 * @param {HouseId} houseId - The identifier of the house to upgrade.
 */
function upgrade(houseId: HouseId): void {
    sendWithOptions<Upgrade>(Command.Upgrade, { houseId })
}

/**
 * Retrieves debug information for a specific flag by its ID.
 * @param {FlagId} flagId - The identifier of the flag.
 * @param {GameId} gameId - The identifier of the game.
 * @returns {Promise<FlagDebugInfo>} Debugging information for the flag.
 */
async function getFlagDebugInfo(flagId: FlagId, gameId: GameId): Promise<FlagDebugInfo> {
    return (await sendRequestAndWaitForReplyWithOptions<{ flag: FlagDebugInfo }, GetFlagDebugInfo>(Command.GetFlagDebugInformation, { flagId, gameId })).flag
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
async function listenToGameViewForPlayer(playerId: PlayerId, gameId: GameId): Promise<PlayerViewInformation | undefined> {
    return (await sendRequestAndWaitForReplyWithOptions<{ playerView?: PlayerViewInformation }, StartMonitoringGame>(Command.StartMonitoringGame, { playerId, gameId }))?.playerView
}

/**
 * Retrieves information about a specific point in the game world.
 * @param {Point} point - The point to get information on.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the point information.
 * @returns {Promise<PointInformation>} Information about the specified point.
 */
async function getInformationOnPoint(point: Point, playerId: PlayerId): Promise<PointInformation> {
    return (
        await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[], playerId: PlayerId }>(Command.GetInformationOnPoint, { points: [point], playerId })
    ).pointsWithInformation[0]
}

/**
 * Retrieves information about multiple points in the game world.
 * @param {Point[]} points - The points to get information on.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the point information.
 * @returns {Promise<PointMap<PointInformation>>} A map of point information.
 */
async function getInformationOnPoints(points: Point[], playerId: PlayerId): Promise<PointMap<PointInformation>> {
    const reply = await sendRequestAndWaitForReplyWithOptions<InformationOnPointsReply, { points: Point[], playerId: PlayerId }>(Command.GetInformationOnPoint, { points, playerId })

    const map = new PointMap<PointInformation>()

    reply.pointsWithInformation.forEach(pointInformation => map.set({ x: pointInformation.x, y: pointInformation.y }, pointInformation))

    return map
}

/**
 * Turns on a cheat for the given player.
 * @param cheatCode The cheat code to activate.
 * @param playerId The identifier of the player for whom to activate the cheat.
 * @returns void
 */
function cheat(cheatCode: CheatCode, playerId: PlayerId): void {
    sendWithOptions<{ cheatCode: CheatCode, playerId: PlayerId}>(Command.Cheat, { cheatCode, playerId })
}

/**
 * Sets the number of soldiers reserved in headquarters for a specific rank.
 * @param {SoldierType} rank - The soldier rank.
 * @param {number} amount - The number of soldiers to reserve.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the reserved soldiers.
 */
function setReservedSoldiers(rank: SoldierType, amount: number, playerId: PlayerId): void {
    const options = { [rank]: amount, playerId } as SetReservedSoldiers

    sendWithOptions<SetReservedSoldiers>(Command.SetReservedInHeadquarters, options)
}

/**
 * Adds detailed monitoring for a specific house or flag.
 * @param {HouseId | FlagId} id - The identifier of the house or flag to monitor.
 * @param {PlayerId} playerId - The identifier of the player for whom to add detailed monitoring.
 */
function addDetailedMonitoring(id: HouseId | FlagId, playerId: PlayerId): void {
    sendWithOptions<AddDetailedMonitoring>(Command.StartDetailedMonitoring, { id, playerId })
}

/**
 * Removes detailed monitoring for a specific house or flag.
 * @param {HouseId | FlagId} id - The identifier of the house or flag to stop monitoring.
 * @param {PlayerId} playerId - The identifier of the player for whom to remove detailed monitoring.
 */
function removeDetailedMonitoring(id: HouseId | FlagId, playerId: PlayerId): void {
    sendWithOptions<RemoveDetailedMonitoring>(Command.StopDetailedMonitoring, { id, playerId })
}

/**
 * Removes a specific message from the game.
 * @param {GameMessageId} messageId - The identifier of the message to remove.
 * @param {PlayerId} playerId - The identifier of the player for whom to remove the message.
 */
function removeMessage(messageId: GameMessageId, playerId: PlayerId): void {
    sendWithOptions<RemoveMessage>(Command.RemoveMessage, { messageId, playerId })
}

/**
 * Removes multiple messages from the game.
 * @param {GameMessageId[]} messageIds - The list of message IDs to remove.
 * @param {PlayerId} playerId - The identifier of the player for whom to remove the messages.
 */
function removeMessages(messageIds: GameMessageId[], playerId: PlayerId): void {
    sendWithOptions<RemoveMessages>(Command.RemoveMessages, { messageIds: messageIds, playerId })
}

/**
 * Sets the coal quotas for different production facilities.
 * @param {number} mint - The quota for the mint.
 * @param {number} armory - The quota for the armory.
 * @param {number} ironSmelter - The quota for the iron smelter.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the quotas.
 * @returns {void}
 */
function setCoalQuotas(mint: number, armory: number, ironSmelter: number, playerId: PlayerId): void {
    sendWithOptions<SetCoalQuotas>(Command.SetCoalQuotas, { mint, armory, ironSmelter, playerId })
}

/**
 * Retrieves the current food quotas.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the food quotas.
 * @returns {Promise<FoodQuotas>} The current food quotas.
 */
function getFoodQuotas(playerId: PlayerId): Promise<FoodQuotas> {
    return sendRequestAndWaitForReplyWithOptions<FoodQuotas, GetFoodQuotas>(Command.GetFoodQuotas, { playerId })
}

/**
 * Sets the wheat quotas for different production facilities.
 * @param {number} donkeyFarm - The quota for the donkey farm.
 * @param {number} pigFarm - The quota for the pig farm.
 * @param {number} mill - The quota for the mill.
 * @param {number} brewery - The quota for the brewery.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the quotas.
 * @returns {void}
 */
function setWheatQuotas(donkeyFarm: number, pigFarm: number, mill: number, brewery: number, playerId: PlayerId): void {
    sendWithOptions<SetWheatQuotas>(Command.SetWheatQuotas, { donkeyFarm, pigFarm, mill, brewery, playerId })
}

/**
 * Retrieves the current wheat quotas.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the wheat quotas.
 * @returns {Promise<WheatQuotas>} The current wheat quotas.
 */

function getWheatQuotas(playerId: PlayerId): Promise<WheatQuotas> {
    return sendRequestAndWaitForReplyWithOptions<WheatQuotas, GetWheatQuotas>(Command.GetWheatQuotas, { playerId })
}

/**
 * Retrieves the current water quotas.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the water quotas.
 * @returns {Promise<WaterQuotas>} The current water quotas.
 */
function getWaterQuotas(playerId: PlayerId): Promise<WaterQuotas> {
    return sendRequestAndWaitForReplyWithOptions<WaterQuotas, GetWaterQuotas>(Command.GetWaterQuotas, { playerId })
}

/**
 * Retrieves the current coal quotas.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the coal quotas.
 * @returns {Promise<CoalQuotas>} The current coal quotas.
 */
function getCoalQuotas(playerId: PlayerId): Promise<CoalQuotas> {
    return sendRequestAndWaitForReplyWithOptions<CoalQuotas, GetCoalQuotas>(Command.GetCoalQuotas, { playerId })
}

/**
 * Retrieves the current iron bar quotas.
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the iron bar quotas.
 * @returns {Promise<IronBarQuotas>} The current iron bar quotas.
 */
function getIronBarQuotas(playerId: PlayerId): Promise<IronBarQuotas> {
    return sendRequestAndWaitForReplyWithOptions<IronBarQuotas, GetIronBarQuotas>(Command.GetIronBarQuotas, { playerId })
}

/**
 * Sets the food quotas for different mines.
 * @param {number} ironMine - The quota for the iron mine.
 * @param {number} coalMine - The quota for the coal mine.
 * @param {number} goldMine - The quota for the gold mine.
 * @param {number} graniteMine - The quota for the granite mine.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the quotas.
 * @returns {void}
 */
function setFoodQuotas(ironMine: number, coalMine: number, goldMine: number, graniteMine: number, playerId: PlayerId): void {
    sendWithOptions<SetFoodQuotas>(
        Command.SetFoodQuotas,
        { ironMine, coalMine, goldMine, graniteMine, playerId }
    )
}

/**
 * Sets the water quotas for different production facilities.
 * @param {number} bakery - The quota for the bakery.
 * @param {number} donkeyFarm - The quota for the donkey farm.
 * @param {number} pigFarm - The quota for the pig farm.
 * @param {number} brewery - The quota for the brewery.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the quotas.
 * @returns {void}
 */
function setWaterQuotas(bakery: number, donkeyFarm: number, pigFarm: number, brewery: number, playerId: PlayerId): void {
    sendWithOptions<SetWaterQuotas>(Command.SetWaterQuotas, { bakery, donkeyFarm, pigFarm, brewery, playerId })
}

/**
 * Sets the iron bar quotas for different production facilities.
 * @param {number} armory - The quota for the armory.
 * @param {number} metalworks - The quota for the metalworks.
 * @param {PlayerId} playerId - The identifier of the player for whom to set the quotas.
 * @returns {void}
 */
function setIronBarQuotas(armory: number, metalworks: number, playerId: PlayerId): void {
    sendWithOptions<SetIronBarQuotas>(Command.SetIronBarQuotas, { armory, metalworks, playerId })
}

/**
 * Creates a new game with the given name and players.
 * @param {string} name - The name of the game
 * @param {(ExistingPlayerById | NewPlayerToCreate)[]} players - The players in the game
 * @returns {Promise<GameInformation>} Metadata about the game
 */
async function createGame(name: string, players: (ExistingPlayerById | NewPlayerToCreate)[]): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, CreateNewGameOptions>(Command.CreateGame, {
        name,
        players
    })).gameInformation
}

/**
 * Deletes the given game.
 * @param {GameId} gameId - The id of the game to delete.
 */
function deleteGame(gameId: GameId): void {
    sendWithOptions<DeleteGame>(Command.DeleteGame, { gameId })
}

/**
 * Pauses the current game.
 * @param {GameId} gameId - The id of the game.
 * @returns {void}
*/
function pauseGame(gameId: GameId): void {
    sendWithOptions<PauseGame>(Command.PauseGame, { gameId })
}

/**
 * Resumes the current game after a pause.
 * @param {GameId} gameId - The id of the game.
 * @returns {void}
*/
function resumeGame(gameId: GameId): void {
    sendWithOptions<ResumeGame>(Command.ResumeGame, { gameId })
}

/**
 * Places a house at a specific point on the map.
 * @param {AnyBuilding} type - The type of house to place.
 * @param {Point} point - The location to place the house.
 * @param {PlayerId} playerId - The identifier of the player placing the house.
 * @returns {void}
*/
function placeHouse(type: AnyBuilding, point: Point, playerId: PlayerId): void {
    sendWithOptions<PlaceHouse>(Command.PlaceBuilding, { ...point, type, playerId })
}

/**
 * Blocks delivery of the given material to the given storehouse.
 * @param {HouseId} houseId - The id of the storehouse to block delivery to
 * @param {Material} material - The material to block delivery of
 */
function blockDelivery(houseId: HouseId, material: Material): void {
    sendWithOptions<BlockDelivery>(Command.BlockMaterial, { houseId, material })
}
 
/**
 * Allow delivery of the given material to the given storehouse.
 * @param {HouseId} houseId - The id of the storehouse to allow delivery to
 * @param {Material} material - The material to allow delivery of
 */
function allowDelivery(houseId: HouseId, material: Material): void {
    sendWithOptions<AllowDelivery>(Command.AllowMaterial, { houseId, material })
}

/**
 * Sends out all available material from a storehouse to the surrounding area.
 * @param {HouseId} houseId - The id of the storehouse to send out material from
 * @param {Material} material - The material to send out
 */
function sendOutMaterial(houseId: HouseId, material: Material): void {
    sendWithOptions<SendOut>(Command.SendOut, { houseId, material })
}

/**
 * Stops sending out material from a storehouse to the surrounding area.
 * @param {HouseId} houseId - The id of the storehouse to stop sending out material from
 * @param {Material} material - The material to stop sending out
 */
function stopSendingOutMaterial(houseId: HouseId, material: Material): void {
    sendWithOptions<StopSendingOut>(Command.StopSendingOut, { houseId, material })
}

/**
 * Places a road along specified points on the map.
 * @param {Point[]} points - The points that define the road path.
 * @param {PlayerId} playerId - The identifier of the player placing the road.
 * @returns {void}
 */
function placeRoad(points: Point[], playerId: PlayerId): void {
    sendWithOptions<PlaceRoad>(Command.PlaceRoad, { road: points, playerId })
}

/**
 * Places a flag at a specific point on the map.
 * @param {Point} flag - The location to place the flag.
 * @param {PlayerId} playerId - The identifier of the player placing the flag.
 */
function placeFlag(flag: Point, playerId: PlayerId): void {
    sendWithOptions<PlaceFlag>(Command.PlaceFlag, { flag, playerId })
}

/**
 * Places a flag and a road at specified points on the map.
 * @param {Point} flag - The location to place the flag.
 * @param {Point[]} points - The points that define the road path.
 * @param {PlayerId} playerId - The identifier of the player placing the flag and road.
 */
function placeRoadWithFlag(flag: Point, points: Point[], playerId: PlayerId): void {
    sendWithOptions<PlaceRoadWithFlag>(Command.PlaceFlagAndRoad, { flag, road: points, playerId })
}

/**
 * Removes a flag from the map using its ID.
 * @param {FlagId} id - The identifier of the flag to remove.
 */
function removeFlag(id: FlagId): void {
    sendWithOptions<RemoveFlag>(Command.RemoveFlag, { id })
}

/**
 * Removes a road from the map using its ID.
 * @param {RoadId} id - The identifier of the road to remove.
 */
function removeRoad(id: RoadId): void {
    sendWithOptions<RemoveRoad>(Command.RemoveRoad, { id })
}

/**
 * Removes a building from the map using its ID.
 * @param {HouseId} id - The identifier of the building to remove.
 */
function removeBuilding(id: HouseId): void {
    sendWithOptions<RemoveBuilding>(Command.RemoveBuilding, { id })
}

/**
 * Calls a scout to explore a specific point on the map.
 * 
 * @param {Point} point - The location to send the scout.
 * @param {PlayerId} playerId - The identifier of the player calling the scout.
 */
function callScout(point: Point, playerId: PlayerId): void {
    sendWithOptions<CallScout>(Command.CallScout, { point, playerId })
}

/**
 * Calls a geologist to survey a specific point on the map.
 * @param {Point} point - The location to send the geologist.
 * @param {PlayerId} playerId - The identifier of the player calling the geologist.
 */
function callGeologist(point: Point, playerId: PlayerId): void {
    sendWithOptions<CallGeologist>(Command.CallGeologist, { point, playerId })
}

/**
 * Marks a set of messages as read.
 * @param {GameMessageId[]} messageIds - A list of ids of the messages to mark as read
 * @param {PlayerId} playerId - The identifier of the player marking messages as read
 */
function markGameMessagesRead(messageIds: GameMessageId[], playerId: PlayerId): void {
    sendWithOptions<MarkGameMessagesRead>(Command.MarkGameMessagesRead, { messageIds, playerId })
}

/**
 * Retrieves the player's current view of the game. Internal function not exposed outside the module.
 * 
 * @param {PlayerId} playerId - The identifier of the player for whom to retrieve the game view.
 * @param {GameId} gameId - The identifier of the game for which to retrieve the view.
 * @returns {Promise<PlayerViewInformation>} The current view of the game.
 */
async function getViewForPlayer(playerId: PlayerId, gameId: GameId): Promise<PlayerViewInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ playerView: PlayerViewInformation }, GetViewForPlayer>(Command.FullSync, { playerId, gameId })).playerView
}

// Functions internal to WS API
/**
 * Listens for updates on game metadata. Also returns the current game metadata.
 * @param {GameId} - The id of the game.
 * @returns {Promise<GameInformation>} The latest game metadata.
 */
async function listenToGameMetadata(gameId: GameId): Promise<GameInformation> {
    return (await sendRequestAndWaitForReplyWithOptions<{ gameInformation: GameInformation }, ListenToGameMetadata>(Command.ListenToGameInfo, { gameId })).gameInformation
}

/**
 * Instructs the backend to send messages when there are changes to the games list. This includes both
 * adding/removing games, and changes to the metadata of existing games.
 */
function listenToGamesList(): void {
    send(Command.ListenToGameList)
}

/**
 * Stop listening to changes to the list of games.
 */
function stopListeningToGamesList(): void {
    send(Command.StopListeningToGameList)
}

/**
 * Instructs the backend to send chat messages sent to the player and/or rooms to the API.
 * @param playerId (optional) The id of the player to listen for chat messages to
 * @param roomIds (optional) The id(s) of the room(s) to listen for chat messages to
 */
function listenToChatMessages(playerId: PlayerId, roomIds: RoomId[]): void {
    sendWithOptions<ListenToChatMessages>(Command.ListenToChatMessages, { playerId, roomIds })
}

/**
 * Instructs the backend to send messages when statistics data has changed.
 * @param {PlayerId} playerId - The id of the player
 */
function listenToStatistics(playerId: PlayerId): void {
    sendWithOptions<ListenToStatistics>(Command.ListenToStatistics, { playerId })
}

function stopListeningToStatistics(playerId: PlayerId): void {
    sendWithOptions<StopListeningToStatistics>(Command.StopListeningToStatistics, { playerId })
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
    findPossibleNewRoad,
    deleteGame,
    disablePromotionsForHouse,
    enablePromotionsForHouse,
    pauseProductionForHouse,
    resumeProductionForHouse,
    cancelEvacuationForHouse,
    setTransportPriorityForMaterial,
    getTerrainForMap,
    getStatistics,
    getTransportPriority,
    listenToStatistics,
    stopListeningToStatistics,
    markGameMessagesRead,
    getToolPriorities,
    setToolPriority,
    getMap,
    cheat,
    setCheating,
    listenToPlayer,
    stopListeningToPlayer,
    blockDelivery,
    allowDelivery,
    sendOutMaterial,
    stopSendingOutMaterial,
    getMapsWithTerrain,
    getMapWithTerrain,
    stopListeningToGamesList
}