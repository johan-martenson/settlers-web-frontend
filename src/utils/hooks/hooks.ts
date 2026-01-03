import { useEffect, useState } from 'react'
import {
    ChatMessage,
    GameInformation,
    GameMessage,
    GameMessageId,
    HouseId,
    HouseInformation,
    MapInformation,
    PlayerId,
    PlayerInformation,
    RoomId,
    TRANSPORT_CATEGORIES,
    TransportCategory
} from '../../api/types'
import { api } from '../../api/ws-api'
import { StatisticsReply } from '../../api/ws/commands'
import { HooksConfig } from './config'

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

    useEffect(() => {
        const listener = (updatedTime: number) => {
            if (HooksConfig.useTime) {
                console.log('Hooks (useTime): Update received', updatedTime)
            }

            setTime(prev =>
                updatedTime > prev + delta
                    ? updatedTime
                    : prev
            )
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
        const listener = async () => {
            const statistics = await api.getStatistics()

            if (HooksConfig.useStatistics) {
                console.log('Hooks (useStatistics): Update received')
            }

            setStatistics(statistics)
        }

        api.addStatisticsListener(listener, playerId)

        if (HooksConfig.useStatistics) {
            console.log('Hooks (useStatistics): Listener registered', playerId)
        }

        listener()

        return () => {
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

function usePlayer(playerId: PlayerId): PlayerInformation {
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
        throw new Error(`Hooks: player with id ${playerId} not found`)
    }

    return player
}

function useMaps(): MapInformation[] {
    const [maps, setMaps] = useState<MapInformation[]>(() => {
        if (HooksConfig.useMaps) {
            console.log('Hooks (useMaps): Initial state')
        }

        return []
    })

    useEffect(() => {
        api.getMaps().then(maps => {
            if (HooksConfig.useMaps) {
                console.log('Hooks (useMaps): Update received', maps)
            }

            setMaps(maps)
        })
    }, [])

    return maps
}

function useHouse(houseId: HouseId): HouseInformation {
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
        throw new Error(`Hooks: house with id ${houseId} not found`)
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

            setMessages(api.chatRoomMessages)
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

            const unread = Array.from(api.messages.values()).filter(m => !m.isRead)

            if (unread.length > 0) {
                api.markGameMessagesRead(unread.map(m => m.id))
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

function useGames(): GameInformation[] {
    const [games, setGames] = useState<GameInformation[]>(() => {
        if (HooksConfig.useGames) {
            console.log('Hooks (useGames): Initial state')
        }

        return []
    })

    useEffect(() => {
        const listener = (games: GameInformation[]) => {
            if (HooksConfig.useGames) {
                console.log('Hooks (useGames): Update received', games)
            }

            setGames(games)
        }

        api.addGamesListener(listener)

        if (HooksConfig.useGames) {
            console.log('Hooks (useGames): Listener registered')
        }

        api.getGames().then(setGames)

        return () => {
            api.removeGamesListener(listener)

            if (HooksConfig.useGames) {
                console.log('Hooks (useGames): Listener removed')
            }
        }
    }, [])

    return games
}

export {
    useHouse,
    useChatMessages,
    useGameMessages,
    useGames,
    useMaps,
    usePlayer,
    useTransportPriority,
    useStatistics,
    useTime
}
