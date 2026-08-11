import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api/ws-api'
import { PlayerColor, PlayerId, RoomId } from '../../api/types'
import './chat.css'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import { ItemContainer } from '../item_container'
import { useChatMessages } from '../../utils/hooks/hooks'
import { useTypingInput } from '../../utils/hooks/input'

// Types
type ChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
}

type ExpandChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
    expanded: boolean
    onToggleExpanded: () => void
}

// Constants
const COLORS: Record<PlayerColor, string> = {
    BLUE: 'black',
    RED: 'red',
    GREEN: 'green',
    YELLOW: 'goldenrod',
    PURPLE: 'purple',
    GRAY: 'gray',
    BROWN: 'brown',
    WHITE: 'white'
}

// React components
function ChatBox({ playerId, roomId }: ChatBoxProps) {

    // References
    const inputRef = useRef<HTMLInputElement>(null)
    const messagesRef = useRef<HTMLDivElement>(null)

    // State
    const [inputValue, setInputValue] = useState('')
    const [hiddenPlayers, setHiddenPlayers] = useState<Set<PlayerId>>(new Set())

    // Listening hooks
    const chatLog = useChatMessages(playerId, [roomId])

    // Functions
    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim()

        if (trimmed.length > 0) {
            api.sendChatMessageToRoom(trimmed, roomId, playerId)
        }
    }, [roomId, playerId])

    const togglePlayer = useCallback((playerIdToToggle: PlayerId) => {
        setHiddenPlayers(previous => {
            const next = new Set(previous)

            if (next.has(playerIdToToggle)) {
                next.delete(playerIdToToggle)
            } else {
                next.add(playerIdToToggle)
            }

            return next
        })
    }, [])

    // Effects
    // Effect: Autofocus on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Effect: Scroll to latest message
    useEffect(() => {
        const element = messagesRef.current

        if (element) {
            const isNearBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight < 50

            if (isNearBottom) {
                element.scrollTop = element.scrollHeight
            }
        }
    }, [chatLog])

    console.log('ChatBox: rendering with chatLog', chatLog, 'and inputValue', inputValue)

    // Render
    return (
        <div className='chat-box'>
            <ItemContainer
                style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    maxHeight: '25em',
                    overflowY: 'scroll',
                    overflowX: 'hidden'
                }}
            >
                {chatLog
                    .filter(chatMessage => !hiddenPlayers.has(chatMessage.fromPlayerId))
                    .map(chatMessage => {
                        var color = [...api.players.values()].find(p => p.id === chatMessage.fromPlayerId)?.color.toLowerCase() ?? 'white'

                        return (
                            <div
                                key={chatMessage.id}
                                className={`chat-entry ${color}`}
                            >
                                <div className='chat-timestamp'>
                                    [{chatMessage.time.hours.toString().padStart(2, '0')}:
                                    {chatMessage.time.minutes.toString().padStart(2, '0')}] {' '}
                                </div>
                                <div className='player-name'>{chatMessage.fromName}</div><div className='chat-text'>{chatMessage.text}</div>
                            </div>)
                    })}
            </ItemContainer>

            <div className='chat-player-filters'>
                {[...api.players.values()]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(player => {
                        const hidden = hiddenPlayers.has(player.id)

                        return (
                            <Button
                                key={player.id}
                                size='small'
                                appearance='outline'
                                className={`chat-player-filter ${player.color.toLowerCase()}`}
                                aria-pressed={!hidden}
                                disabled={player.id === playerId}
                                onClick={() => togglePlayer(player.id)}
                            >
                                {player.name}
                            </Button>
                        )
                    })}
            </div>

            <div className='chat-type-and-send'>
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
                        setInputValue(data.value)
                    }}
                    onKeyDown={(event) => {
                        // Never let the game's global key handler receive keys while
                        // the chat input has focus.
                        event.stopPropagation()

                        switch (event.key) {
                            case 'Enter':
                                event.preventDefault()

                                sendMessage(inputValue)
                                setInputValue('')

                                break

                            case 'Escape':
                                event.preventDefault()

                                setInputValue('')

                                break
                        }
                    }}
                />
                <Button
                    disabled={inputValue === undefined || !inputValue.trim()}
                    onClick={() => {
                        sendMessage(inputValue)
                        inputRef.current?.focus()
                        setInputValue('')
                    }}
                >
                    Send
                </Button>
            </div>
        </div>
    )
}

function ExpandChatBox({ playerId, roomId, expanded, onToggleExpanded }: ExpandChatBoxProps) {

    // Rendering
    return (
        <div className='expand-chat-box'>
            <ExpandCollapseToggle
                onExpand={onToggleExpanded}
                onCollapse={onToggleExpanded}
            />

            {expanded && <ChatBox playerId={playerId} roomId={roomId} />}

            <div><b>Chat</b></div>
        </div>
    )
}

export { ChatBox, ExpandChatBox }