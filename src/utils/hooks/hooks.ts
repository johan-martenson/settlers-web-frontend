import { useEffect, useState } from "react"
import { ChatMessage, GameInformation, GameMessage, GameMessageId, HouseId, HouseInformation, PlayerId, RoomId } from "../../api/types"
import { api } from "../../api/ws-api"

// Configuration
export const HooksConfig = {
    log: true
}

// Custom hooks
function useHouse(houseId: HouseId): HouseInformation {
    const [house, setHouse] = useState<HouseInformation | undefined>(api.houses.get(houseId))

    useEffect(() => {
        const houseListener = (house: HouseInformation) => {
            if (HooksConfig.log) {
                console.log('Hooks: house changed', house)
            }

            setHouse(house)
        }

        api.addHouseListener(houseId, houseListener)

        if (HooksConfig.log) {
            console.log(`Hooks: started listening to changes for house with id ${houseId}`)
        }

        return () => {
            api.removeHouseListener(houseId, houseListener)

            if (HooksConfig.log) {
                console.log(`Hooks: stopped listening to changes for house with id ${houseId}`)
            }
        }
    }, [houseId])

    if (!house) {
        throw new Error(`Hooks: house with id ${houseId} not found`)
    }

    return house
}

function useChatMessages(playerId: PlayerId, roomIds: RoomId[]): ChatMessage[] {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(api.chatRoomMessages)

    useEffect(() => {
        const chatMessagesListener = () => {
            if (HooksConfig.log) {
                console.log('Hooks: chat messages changed')
            }

            setChatMessages(api.chatRoomMessages)
        }

        api.addChatMessagesListener(chatMessagesListener, playerId, roomIds)

        if (HooksConfig.log) {
            console.log('Hooks: started listening to chat messages')
        }

        return () => {
            api.removeChatMessagesListener(chatMessagesListener)

            if (HooksConfig.log) {
                console.log('Hooks: stopped listening to chat messages')
            }
        }
    }, [playerId, roomIds.join('|')])

    return chatMessages
}

function useGameMessages(): GameMessage[] {
    const [messages, setMessages] = useState<GameMessage[]>(Array.from(api.messages.values()))

    useEffect(() => {

        // eslint-disable-next-line
        const messageReceiver = (_receivedMessages: GameMessage[], _readMessages: GameMessage[], _removedMessages: GameMessageId[]) => {
            if (HooksConfig.log) {
                console.log('Hooks: game messages changed')
            }

            const unreadMessages = Array.from(api.messages.values()).filter(message => !message.isRead)

            if (unreadMessages.length > 0) {
                api.markGameMessagesRead(unreadMessages.map(message => message.id))
            }

            setMessages(Array.from(api.messages.values()))
        }

        setMessages(Array.from(api.messages.values()))

        // Subscribe to received messages
        api.addMessagesListener(messageReceiver)

        if (HooksConfig.log) {
            console.log('Hooks: started listening to game messages')
        }

        return () => {
            api.removeMessagesListener(messageReceiver)

            if (HooksConfig.log) {
                console.log('Hooks: stopped listening to game messages')
            }
        }
    }, [])

    return messages
}

function useGames(): GameInformation[] {
    const [games, setGames] = useState<GameInformation[] | undefined>()

    useEffect(() => {
        function gameListChanged(gameInformations: GameInformation[]): void {
            if (HooksConfig.log) {
                console.log('Hooks: game list changed')
            }

            setGames(gameInformations)
        }

        async function getGamesAndAddListener(): Promise<void> {
            api.addGamesListener(gameListChanged)

            if (HooksConfig.log) {
                console.log('Hooks: started listening for game list')
            }

            const games = await api.getGames()

            if (HooksConfig.log) {
                console.log('Hooks: returning game list')
                console.log(games)
            }

            setGames(games)
        }

        getGamesAndAddListener()

        return () => {
            api.removeGamesListener(gameListChanged)

            if (HooksConfig.log) {
                console.log('Hooks: stopped listening for game list')
            }
        }
    }, [])

    return games ?? []
}


export {
    useHouse,
    useChatMessages,
    useGameMessages,
    useGames
}