import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/ws-api'
import { ChatMessage, PlayerId, RoomId } from '../api/types'
import './chat.css'
import ExpandCollapseToggle from '../expand_collapse_toggle'

// Types
type ChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
}

type ExpandChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
}

// React components
function ChatBox({ playerId, roomId }: ChatBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [chatLog, setChatLog] = useState<ChatMessage[]>(api.chatRoomMessages)
    const [messageText, setMessageText] = useState<string>('')

    useEffect(
        () => {
            function changedChatLog(): void {
                setChatLog([...api.chatRoomMessages])
            }

            setChatLog(api.chatRoomMessages)
            api.addChatMessagesListener(changedChatLog, playerId, [roomId])

            return () => api.removeChatMessagesListener(changedChatLog)
        }, [roomId, playerId]
    )

    const sendMessage = useCallback(() => {
        const message = inputRef.current?.value
        setMessageText('')

        if (message) {
            api.sendChatMessageToRoom(message, roomId, playerId)
        }
    }, [setMessageText, inputRef])

    return (
        <div className='chat-box'>
            <div className='chat-log'>
                {chatLog
                    .filter(chatMessage =>
                        chatMessage?.toRoomId === roomId ||
                        chatMessage?.toPlayers?.some(p => p === playerId))
                    .map(chatMessage => (
                        <div key={chatMessage.id} className='chat-entry'>
                            [{chatMessage.time.hours.toString().padStart(2, '0')}:{chatMessage.time.minutes.toString().padStart(2, '0')}] {chatMessage.fromName}: {chatMessage.text}
                        </div>))}
            </div>
            <div className='chat-type-and-send'>
                <Input
                    value={messageText}
                    ref={inputRef}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setMessageText(data.value)}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (!event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey) {
                            if (event.key === 'Enter') {
                                sendMessage()
                            }
                        }
                    }} />
                <Button
                    onClick={sendMessage}
                >
                    Send
                </Button>
            </div>
        </div>
    )
}

function ExpandChatBox({ playerId, roomId }: ExpandChatBoxProps) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    return (
        <div className='expand-chat-box'>
            <ExpandCollapseToggle onExpand={() => setIsExpanded(true)} onCollapse={() => setIsExpanded(false)} />

            {isExpanded && <ChatBox playerId={playerId} roomId={roomId} />}

            <div><b>Chat</b></div>
        </div>
    )
}

export { ChatBox, ExpandChatBox }