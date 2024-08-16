import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { api } from '../api/ws-api'
import { ChatMessage, PlayerId, RoomId } from '../api/types'
import './chat.css'
import ExpandCollapseToggle from '../expand_collapse_toggle'

// Types
type ChatBoxProps = {
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

    return (
        <div className='chat-box'>
            <div className='chat-log'>
                {chatLog
                    .filter(chatMessage =>
                        chatMessage?.toRoomId === roomId ||
                        chatMessage?.toPlayers?.some(p => p === playerId)
                    )
                    .map((chatMessage) => (
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
                        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
                            return
                        }

                        if (event.key === 'Enter' && inputRef.current?.value) {
                            const message = inputRef.current.value

                            console.log(message)
                            setMessageText('')

                            api.sendChatMessageToRoom(message, roomId, playerId)
                        }
                    }} />
                <Button
                    onClick={() => {
                        const message = inputRef.current?.value

                        console.log(message)
                        console.log(`Send to: ${roomId}`)

                        setMessageText('')

                        if (message) {
                            console.log('sending')
                            api.sendChatMessageToRoom(message, roomId, playerId)
                        }
                    }}
                >
                    Send
                </Button>
            </div>
        </div>
    )
}

type ExpandChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
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