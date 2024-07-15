import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { monitor } from '../api/ws-api'
import { ChatMessage, PlayerId, RoomId } from '../api/types'
import './chat.css'
import ExpandCollapseToggle from '../expand_collapse_toggle'

type ChatBoxProps = {
    playerId: PlayerId
    roomId: RoomId
}

function ChatBox({ playerId, roomId }: ChatBoxProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [chatLog, setChatLog] = useState<ChatMessage[]>(monitor.chatRoomMessages)
    const [text, setText] = useState<string>('')

    useEffect(
        () => {
            function changedChatLog() {
                setChatLog([...monitor.chatRoomMessages])
            }

            setChatLog(monitor.chatRoomMessages)

            monitor.addChatMessagesListener(changedChatLog, playerId, [roomId])

            return () => monitor.removeChatMessagesListener(changedChatLog)
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
                    .map((chatMessage, index) => (
                        <div key={index} className='chat-entry'>
                            [{chatMessage.time.hours.toString().padStart(2, '0')}:{chatMessage.time.minutes.toString().padStart(2, '0')}] {chatMessage.fromName}: {chatMessage.text}
                        </div>))}
            </div>
            <div className='chat-type-and-send'>
                <Input
                    value={text}
                    ref={inputRef}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setText(data.value)}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
                            return
                        }

                        if (event.key === 'Enter' && inputRef.current?.value) {
                            const message = inputRef.current.value

                            console.log(message)
                            setText('')

                            monitor.sendChatMessageToRoom(message, roomId, playerId)
                        }
                    }} />
                <Button
                    onClick={() => {
                        const message = inputRef.current?.value

                        console.log(message)
                        console.log(`Send to: ${roomId}`)

                        setText('')

                        if (message) {
                            console.log('sending')
                            monitor.sendChatMessageToRoom(message, roomId, playerId)
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