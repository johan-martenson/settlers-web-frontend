import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api/ws-api'
import { PlayerId, RoomId } from '../../api/types'
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

// React components
function ChatBox({ playerId, roomId }: ChatBoxProps) {

    // References
    const inputRef = useRef<HTMLInputElement>(null)
    const messagesRef = useRef<HTMLDivElement>(null)

    // State
    const [messageText, setMessageText] = useState<string>('')

    // Listening hooks
    const chatLog = useChatMessages(playerId, [roomId])
    const { inputValue, keyTyped } = useTypingInput({ preventTypingInInputFields: false })

    // Functions
    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim()

        if (trimmed.length > 0) {
            api.sendChatMessageToRoom(trimmed, roomId, playerId)
        }
    }, [roomId, playerId])

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

    // Render
    return (
        <div className='chat-box'>
            <ItemContainer
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    maxHeight: '25em',
                    overflowY: 'scroll',
                    overflowX: 'hidden'
                }}
            >
                {chatLog
                    .map(chatMessage => (
                        <div key={chatMessage.id} className='chat-entry'>
                            [{chatMessage.time.hours.toString().padStart(2, '0')}:
                            {chatMessage.time.minutes.toString().padStart(2, '0')}] {' '}
                            {chatMessage.fromName}: {chatMessage.text}
                        </div>))}
            </ItemContainer>

            <div className='chat-type-and-send'>
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
                        setMessageText(data.value)
                    }}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (!event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
                            if (event.key === 'Enter') {
                                sendMessage(inputValue)
                            }

                            keyTyped(event)

                            event.preventDefault()
                            event.stopPropagation()
                        }
                    }} />
                <Button
                    disabled={inputValue === undefined || !inputValue.trim()}
                    onClick={() => {
                        sendMessage(inputValue)
                        inputRef.current?.focus()
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