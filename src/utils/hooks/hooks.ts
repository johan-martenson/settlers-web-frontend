import { useEffect, useRef, useState } from 'react'
import {
    AvailableConstruction,
    ChatMessage,
    FlagId,
    FlagInformation,
    GameId,
    GameInformation,
    GameMessage,
    GameMessageId,
    HouseId,
    HouseInformation,
    MapId,
    MapInformation,
    MapWithTerrain,
    PlayerId,
    PlayerInformation,
    Point,
    PointInformationWithoutPossibleRoadConnections,
    RoadId,
    RoadInformation,
    RoomId,
    ToolPriorities,
    TRANSPORT_CATEGORIES,
    TransportCategory
} from '../../api/types'
import { api, GameListener } from '../../api/ws-api'
import { StatisticsReply } from '../../api/ws/commands'
import { HooksConfig } from './config'
import { createGameInformationFromApi } from '../../api/utils'

// Constants
const EMPTY_STATISTICS: StatisticsReply = {
    currentTime: 1,
    merchandise: {
        WOOD: [],
        PLANK: [],
        STONE: [],
        FOOD: [],
        WATER: [],
        BEER: [],
        COAL: [],
        IRON: [],
        GOLD: [],
        IRON_BAR: [],
        COIN: [],
        TOOLS: [],
        WEAPONS: [],
        BOAT: [],
    },
    players: []
}

// Hooks
function useTime(delta: number): number {
    const [time, setTime] = useState<number>(() => {
        const value = api.time

        if (HooksConfig.useTime) {
            console.log('Hooks (useTime): Initial state', value)
        }

        return value
    })

    const lastEmittedRef = useRef<number>(api.time)

    useEffect(() => {
        lastEmittedRef.current = api.time
        setTime(api.time)
    }, [delta])

    useEffect(() => {
        const listener = (updatedTime: number) => {
            if (HooksConfig.useTime) {
                console.log('Hooks (useTime): Update received', updatedTime)
            }

            if (updatedTime - lastEmittedRef.current >= delta) {
                lastEmittedRef.current = updatedTime
                setTime(updatedTime)
            }
        }

        api.addTimeListener(listener)

        if (HooksConfig.useTime) {
            console.log('Hooks (useTime): Listener registered')
        }

        return () => {
            api.removeTimeListener(listener)

            if (HooksConfig.useTime) {
                console.log('Hooks (useTime): Listener removed')
            }
        }
    }, [delta])

    return time
}

function useStatistics(playerId: PlayerId): StatisticsReply {
    const [statistics, setStatistics] = useState<StatisticsReply>(() => {
        if (HooksConfig.useStatistics) {
            console.log('Hooks (useStatistics): Initial state')
        }

        return EMPTY_STATISTICS
    })

    useEffect(() => {
        let cancelled = false

        const listener = async () => {
            const statistics = await api.getStatistics()

            if (!cancelled) {
                if (HooksConfig.useStatistics) {
                    console.log('Hooks (useStatistics): Update received')
                }

                setStatistics(statistics)
            }
        }

        api.addStatisticsListener(listener, playerId)

        if (HooksConfig.useStatistics) {
            console.log('Hooks (useStatistics): Listener registered', playerId)
        }

        listener()

        return () => {
            cancelled = true
            api.removeStatisticsListener(listener)

            if (HooksConfig.useStatistics) {
                console.log('Hooks (useStatistics): Listener removed', playerId)
            }
        }
    }, [playerId])

    return statistics
}

function useTransportPriority(): TransportCategory[] {
    const [priority, setPriority] = useState<TransportCategory[]>(() => {
        const value = api.transportPriority ?? Array.from(TRANSPORT_CATEGORIES)

        if (HooksConfig.useTransportPriority) {
            console.log('Hooks (useTransportPriority): Initial state', value)
        }

        return value
    })

    useEffect(() => {
        const listener = (priority: TransportCategory[]) => {
            if (HooksConfig.useTransportPriority) {
                console.log('Hooks (useTransportPriority): Update received', priority)
            }

            setPriority(priority)
        }

        api.addTransportPriorityListener(listener)

        if (HooksConfig.useTransportPriority) {
            console.log('Hooks (useTransportPriority): Listener registered')
        }

        return () => {
            api.removeTransportPriorityListener(listener)

            if (HooksConfig.useTransportPriority) {
                console.log('Hooks (useTransportPriority): Listener removed')
            }
        }
    }, [])

    return priority
}

function usePlayers(gameId: GameId): PlayerInformation[] {
    const [players, setPlayers] = useState<PlayerInformation[]>(() => {
        const value = Array.from(api.players.values())

        if (HooksConfig.usePlayers) {
            console.log('Hooks (usePlayers): Initial state', value)
        }

        return value
    })

    useEffect(() => {
        const listener = () => {
            const updatedPlayers = Array.from(api.players.values())

            if (HooksConfig.usePlayers) {
                console.log('Hooks (usePlayers): Update received', updatedPlayers)
            }

            setPlayers(updatedPlayers)
        }

        api.addPlayersListener(listener, gameId)

        if (HooksConfig.usePlayers) {
            console.log('Hooks (usePlayers): Listener registered')
        }

        return () => {
            api.removePlayersListener(listener, gameId)

            if (HooksConfig.usePlayers) {
                console.log('Hooks (usePlayers): Listener removed')
            }
        }
    }, [gameId])

    return players
}

function usePlayer(playerId: PlayerId): PlayerInformation | undefined {
    const [player, setPlayer] = useState<PlayerInformation | undefined>(() => {
        const value = api.players.get(playerId)

        if (HooksConfig.usePlayer) {
            console.log('Hooks (usePlayer): Initial state', playerId, value)
        }

        return value
    })

    useEffect(() => {
        const listener = (player: PlayerInformation) => {
            if (HooksConfig.usePlayer) {
                console.log('Hooks (usePlayer): Update received', playerId)
            }

            setPlayer(player)
        }

        api.addPlayerInformationListener(playerId, listener)

        if (HooksConfig.usePlayer) {
            console.log('Hooks (usePlayer): Listener registered', playerId)
        }

        return () => {
            api.removePlayerInformationListener(playerId, listener)

            if (HooksConfig.usePlayer) {
                console.log('Hooks (usePlayer): Listener removed', playerId)
            }
        }
    }, [playerId])

    if (!player) {
        console.error(`Hooks: player with id ${playerId} not found`)
    }

    return player
}

function useHouse(houseId: HouseId): HouseInformation | undefined {
    const [house, setHouse] = useState<HouseInformation | undefined>(() => {
        const value = api.houses.get(houseId)

        if (HooksConfig.useHouse) {
            console.log('Hooks (useHouse): Initial state', houseId, value)
        }

        return value
    })

    useEffect(() => {
        const listener = (house: HouseInformation) => {
            if (HooksConfig.useHouse) {
                console.log('Hooks (useHouse): Update received', houseId, house)
            }

            setHouse(house)
        }

        api.addHouseListener(houseId, listener)

        if (HooksConfig.useHouse) {
            console.log('Hooks (useHouse): Listener registered', houseId)
        }

        return () => {
            api.removeHouseListener(houseId, listener)

            if (HooksConfig.useHouse) {
                console.log('Hooks (useHouse): Listener removed', houseId)
            }
        }
    }, [houseId])

    if (!house) {
        console.error(`Hooks: house with id ${houseId} not found`)
    }

    return house
}

function useChatMessages(playerId: PlayerId, roomIds: RoomId[]): ChatMessage[] {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const value = api.chatRoomMessages

        if (HooksConfig.useChatMessages) {
            console.log('Hooks (useChatMessages): Initial state', value)
        }

        return value
    })

    useEffect(() => {
        const listener = () => {
            if (HooksConfig.useChatMessages) {
                console.log('Hooks (useChatMessages): Update received')
            }

            setMessages(Array.from(api.chatRoomMessages))
        }

        api.addChatMessagesListener(listener, playerId, roomIds)

        if (HooksConfig.useChatMessages) {
            console.log('Hooks (useChatMessages): Listener registered', playerId, roomIds)
        }

        return () => {
            api.removeChatMessagesListener(listener)

            if (HooksConfig.useChatMessages) {
                console.log('Hooks (useChatMessages): Listener removed', playerId, roomIds)
            }
        }
    }, [playerId, roomIds.join('|')])

    return messages
}

function useGameMessages(): GameMessage[] {
    const [messages, setMessages] = useState<GameMessage[]>(() => {
        const value = Array.from(api.messages.values())

        if (HooksConfig.useGameMessages) {
            console.log('Hooks (useGameMessages): Initial state', value)
        }

        return value
    })

    useEffect(() => {

        // eslint-disable-next-line --- IGNORE ---
        const listener = (_received: GameMessage[], _read: GameMessage[], _removed: GameMessageId[]) => {
            if (HooksConfig.useGameMessages) {
                console.log('Hooks (useGameMessages): Update received')
            }

            setMessages(Array.from(api.messages.values()))
        }

        api.addMessagesListener(listener)

        if (HooksConfig.useGameMessages) {
            console.log('Hooks (useGameMessages): Listener registered')
        }

        return () => {
            api.removeMessagesListener(listener)

            if (HooksConfig.useGameMessages) {
                console.log('Hooks (useGameMessages): Listener removed')
            }
        }
    }, [])

    return messages
}

function usePointInformation(point: Point): PointInformationWithoutPossibleRoadConnections {
    const [pointInformation, setPointInformation] = useState<PointInformationWithoutPossibleRoadConnections>(() => {
        const value = api.getInformationOnPointLocal(point)

        if (HooksConfig.usePointInformation) {
            console.log('Hooks (usePointInformation): Initial state', point, value)
        }

        return value
    })

    useEffect(() => {
        const pointInformationListener = (pointInformation: PointInformationWithoutPossibleRoadConnections) => {
            if (HooksConfig.usePointInformation) {
                console.log('Hooks (usePointInformation): Update received', point, pointInformation)
            }

            setPointInformation(pointInformation)
        }

        const availableConstructionListener = {
            onAvailableConstructionChanged: (availableConstruction: AvailableConstruction[]) => {
                const updatedPoint: PointInformationWithoutPossibleRoadConnections = {
                    ...point,
                    canBuild: availableConstruction,
                }

                setPointInformation(updatedPoint)
            }
        }

        api.addPointInformationListener(point, pointInformationListener)
        api.addAvailableConstructionListener(point, availableConstructionListener)

        if (HooksConfig.usePointInformation) {
            console.log('Hooks (usePointInformation): Listener registered', point)
        }

        return () => {
            api.removePointInformationListener(point, pointInformationListener)
            api.removeAvailableConstructionListener(point, availableConstructionListener)

            if (HooksConfig.usePointInformation) {
                console.log('Hooks (usePointInformation): Listener removed', point)
            }
        }
    }, [point.x, point.y])

    return pointInformation
}

function useGame(): GameInformation | undefined {
    const [game, setGame] = useState<GameInformation | undefined>(() => {
        try {
            const gameInformation = createGameInformationFromApi()

            if (HooksConfig.useGameInformation) {
                console.log('Hooks (useGame): Initial state', gameInformation)
            }

            return gameInformation
        } catch (error) {
            console.error('Hooks (useGame): Failed to create game information', error)
            return undefined
        }
    })

    useEffect(() => {
        let mounted = true

        const listener: GameListener = {
            onGameInformationChanged: (updatedGameInformation: GameInformation) => {
                if (HooksConfig.useGameInformation) {
                    console.log('Hooks (useGame): Update received', updatedGameInformation)
                }

                setGame(updatedGameInformation)
            }
        }

        api.addGameStateListener(listener)

        if (HooksConfig.useGameInformation) {
            console.log('Hooks (useGame): Listener registered')
        }

        // Fetch if nothing was available initially
        if (!game) {
            api.getGameInformation()
                .then((data: GameInformation) => {
                    if (!mounted) return

                    if (HooksConfig.useGameInformation) {
                        console.log('Hooks (useGame): Loaded from API', data)
                    }

                    setGame(data)
                })
                .catch(err => {
                    console.error('Hooks (useGame): Failed to load game info', err)
                })
        }

        return () => {
            mounted = false
            api.removeGameStateListener(listener)

            if (HooksConfig.useGameInformation) {
                console.log('Hooks (useGame): Listener removed')
            }
        }
    }, []) // intentional: run once on mount

    return game
}
function useGames(): GameInformation[] {
    const [games, setGames] = useState<GameInformation[]>(() => {
        if (HooksConfig.useGames) {
            console.log('Hooks (useGames): Initial state')
        }

        return []
    })

    useEffect(() => {
        let cancelled = false

        const listener = (games: GameInformation[]) => {
            if (!cancelled) {
                if (HooksConfig.useGames) {
                    console.log('Hooks (useGames): Update received', games)
                }

                setGames(games)
            }
        }

        api.addGamesListener(listener)

        if (HooksConfig.useGames) {
            console.log('Hooks (useGames): Listener registered')
        }

        api.getGames().then(games => {
            if (!cancelled) {
                setGames(games)
            }
        })

        return () => {
            cancelled = true
            api.removeGamesListener(listener)

            if (HooksConfig.useGames) {
                console.log('Hooks (useGames): Listener removed')
            }
        }
    }, [])

    return games
}

/**
 * This hook provides the list of maps available in the game.
 * 
 * Maps are not added dynamically, so no listener is registered for updates.
 * However, the hook is still useful for logging the initial fetch of maps and providing a consistent API for accessing maps.
 * @returns {MapInformation[]} The list of maps available in the game. 
 */
function useMaps(): MapInformation[] {
    const [maps, setMaps] = useState<MapInformation[]>(() => {
        if (HooksConfig.useMaps) {
            console.log('Hooks (useMaps): Initial state')
        }

        return []
    })

    useEffect(() => {
        let cancelled = false

        async function fetchMaps() {
            const maps = await api.getMaps()

            if (!cancelled) {
                if (HooksConfig.useMaps) {
                    console.log('Hooks (useMaps): Maps fetched', maps)
                }

                setMaps(maps)
            }
        }

        fetchMaps()

        return () => {
            cancelled = true
        }
    }, [])

    return maps
}

function useMapWithTerrain(mapId: MapId): MapWithTerrain | undefined {

    // State
    const [map, setMap] = useState<MapWithTerrain | undefined>(() => {
        const mapFromApi = api.maps.get(mapId)

        if (HooksConfig.useMapWithTerrain) {
            console.log('Hooks (useMapWithTerrain): Initial state', mapId, mapFromApi)
        }

        return mapFromApi
    })

    // Effects
    // Effect: load the map and its terrain if it's not already loaded
    useEffect(() => {
        if (map) {
            return
        }

        api.getMapWithTerrain(mapId)
            .then((map: MapWithTerrain) => setMap(map))
            .catch((err: Error) => {
                console.error('Hooks (useMapWithTerrain): Failed to load map', err)
            })
    }, [mapId, map])

    return map
}

function useMapsWithTerrain(): MapWithTerrain[] {
    const [maps, setMaps] = useState<MapWithTerrain[]>(() => {
        if (HooksConfig.useMapsWithTerrain) {
            console.log('Hooks (useMapsWithTerrain): Initial state')
        }

        return []
    })

    useEffect(() => {
        let cancelled = false

        async function fetchMaps() {
            const maps = await api.getMapsWithTerrain()

            if (!cancelled) {
                if (HooksConfig.useMapsWithTerrain) {
                    console.log('Hooks (useMapsWithTerrain): Maps fetched', maps)
                }

                setMaps(maps)
            }

        }

        fetchMaps()

        return () => {
            cancelled = true
        }
    }, [])

    return maps
}

function useFlag(flagId: FlagId): FlagInformation | undefined {
    const [flag, setFlag] = useState<FlagInformation | undefined>(() => {
        const value = api.flags.get(flagId)

        if (HooksConfig.useFlag) {
            console.log('Hooks (useFlag): Initial state', flagId, value)
        }

        return value
    })

    useEffect(() => {
        const listener = {
            onUpdate: (flag: FlagInformation) => {
                if (HooksConfig.useFlag) {
                    console.log('Hooks (useFlag): Update received', flagId, flag)
                }

                setFlag(flag)
            },
            onRemove: () => {
                setFlag(undefined)

                if (HooksConfig.useFlag) {
                    console.log('Hooks (useFlag): Flag removed', flagId)
                }
            }
        }

        api.addFlagListener(flagId, listener)

        if (HooksConfig.useFlag) {
            console.log('Hooks (useFlag): Listener registered', flagId)
        }

        return () => {
            api.removeFlagListener(flagId, listener)
        }
    }, [flagId])

    if (!flag) {
        console.error(`Hooks: flag with id ${flagId} not found`)
    }

    return flag
}

function useRoad(roadId: RoadId): RoadInformation | undefined {

    // State
    const [road, setRoad] = useState<RoadInformation | undefined>(() => {
        const value = api.roads.get(roadId)

        if (HooksConfig.useRoad) {
            console.log('Hooks (useRoad): Initial state', roadId, value)
        }

        return value
    })

    // Effects
    // Effect: listen for changes to the road
    useEffect(() => {
        const listener = (roadId: RoadId, road?: RoadInformation) => {
            if (HooksConfig.useRoad) {
                console.log('Hooks (useRoad): Update received', roadId, road)
            }

            setRoad(api.roads.get(roadId))
        }

        api.addRoadListener(roadId, listener)

        if (HooksConfig.useRoad) {
            console.log('Hooks (useRoad): Listener registered', roadId)
        }

        return () => {
            api.removeRoadListener(roadId, listener)
        }
    }, [roadId])

    if (!road) {
        console.error(`Hooks: road with id ${roadId} not found`)
    }

    return road
}

function useToolPriorities(): ToolPriorities | undefined {
    const [toolPriorities, setToolPriorities] = useState<ToolPriorities>()

    // Effects
    useEffect(() => {
        let cancelled = false

        function toolPrioUpdated(toolPrios: ToolPriorities) {
            setToolPriorities(toolPrios)
        }

        (async () => {
            const toolPrio = await api.getToolPriorities()

            if (cancelled) {
                return
            }

            setToolPriorities(toolPrio)
        })()

        api.addToolPrioListener(toolPrioUpdated)

        return () => {
            cancelled = true
            api.removeToolPrioListener(toolPrioUpdated)
        }
    }, [])

    return toolPriorities
}



export {
    useHouse,
    useChatMessages,
    useGameMessages,
    useGames,
    useMaps,
    usePlayer,
    usePlayers,
    useTransportPriority,
    useStatistics,
    useTime,
    useGame,
    usePointInformation,
    useMapsWithTerrain,
    useMapWithTerrain,
    useFlag,
    useToolPriorities,
    useRoad
}
