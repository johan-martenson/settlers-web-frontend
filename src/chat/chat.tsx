import { Button, Input, InputOnChangeData } from '@fluentui/react-components'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { monitor } from '../api/ws-api'
import { ChatMessage, PlayerInformation } from '../api/types'
import './chat.css'

type ChatBoxProps = {
    player: PlayerInformation
}

function ChatBox({ player }: ChatBoxProps) {
    const myRef = useRef<HTMLInputElement | null>(null)

    const [chatLog, setChatLog] = useState<ChatMessage[]>([])
    const [text, setText] = useState<string>('')

    useEffect(
        () => {
            function changedChatLog() {
                setChatLog([...monitor.chatMessages])
            }

            setChatLog(monitor.chatMessages)

            monitor.listenToChatMessages(changedChatLog, player.id)

            return () => monitor.stopListeningToChatMessages(changedChatLog)
        }, []
    )

    return (
        <div className='chat-box'>
            <div className='chat-log'>
                {chatLog.filter(chatMessage => chatMessage?.toRoomId === 'lobby' || chatMessage?.toPlayers.find(p => p === player.id) !== undefined)
                    .map((chatMessage, index) => <div
                        key={index}
                        className='chat-entry'
                    >
                        {chatMessage.fromName}: {chatMessage.text}
                    </div>)}
            </div>
            <div className='chat-type-and-send'>
                <Input
                    value={text}
                    ref={myRef}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setText(data.value)}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
                            return
                        }
                        
                        if (event.key === 'Enter') {
                            const text = myRef.current?.value

                            setText('')

                            if (text) {
                                monitor.sendChatMessageToRoom(text, 'lobby', player.id)
                            }
                        }
                    }} />
                <Button
                    onClick={() => {
                        const text = myRef.current?.value

                        setText('')

                        if (text) {
                            monitor.sendChatMessageToRoom(text, 'lobby', player.id)
                        }
                    }}
                >
                    Send
                </Button>
            </div>
        </div>
    )
}

export { ChatBox }