import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import './game_messages_viewer.css'
import { api } from '../../api/ws-api'
import { ArrowStepInRight24Regular, Delete24Filled } from '@fluentui/react-icons'
import { HouseId, Point, GameMessage, Nation, GameMessageId } from '../../api/types'
import { HouseIcon, WorkerIcon } from '../../icons/icon'
import { ShipIcon } from '../../icons/ship'

// Types
type GameMessagesViewerProps = {
    nation: Nation

    onGoToHouse: (houseId: HouseId) => void
    onGoToPoint: (point: Point) => void
}

// Functions
function removeMessage(message: GameMessage): void {
    api.removeMessage(message.id)
}

// React components
const GameMessagesViewer = ({ nation, onGoToHouse, onGoToPoint }: GameMessagesViewerProps) => {
    const [expanded, setExpanded] = useState<boolean>(false)
    const [messages, setMessages] = useState<GameMessage[]>(Array.from(api.messages.values()))

    useEffect(() => {

        // eslint-disable-next-line
        const messageReceiver = (_receivedMessages: GameMessage[], _readMessages: GameMessage[], _removedMessages: GameMessageId[]) => {
            if (expanded) {
                const unreadMessages = Array.from(api.messages.values()).filter(message => !message.isRead)

                if (unreadMessages.length > 0) {
                    api.markGameMessagesRead(unreadMessages.map(message => message.id))
                }    
            }

            setMessages(Array.from(api.messages.values()))
        }

        // Subscribe to received messages
        api.addMessagesListener(messageReceiver)

        return () => api.removeMessagesListener(messageReceiver)
    }, [expanded])

    const unreadMessages = messages.filter(message => !message.isRead)

    return (
        <div className='game-messages' onWheel={event => event.stopPropagation()}>

            <ExpandCollapseToggle
                onExpand={() => {
                    console.log('xpanded')

                    api.markGameMessagesRead(messages.map(message => message.id))

                    setExpanded(true)
                }
                }
                onCollapse={() => setExpanded(false)}
            />

            <div className='game-messages-header'>
                <b>Messages</b>
                {unreadMessages.length > 0 ? <div className='info-overlay'>{unreadMessages.length}</div> : <div></div>}
            </div>

            {expanded &&
                <div className='game-message-list'>
                    {messages.map((message, index) =>
                        <div className='game-message' key={index}>
                            {message.type === 'MILITARY_BUILDING_OCCUPIED' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    Military building occupied
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        icon={<ArrowStepInRight24Regular />}
                                        appearance='transparent'
                                    />
                                </>
                            }

                            {message.type === 'NO_MORE_RESOURCES' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    No more resources
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'MILITARY_BUILDING_READY' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    Military building is ready
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'UNDER_ATTACK' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    We&apos;re under attack!
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }
                            {message.type === 'GEOLOGIST_FIND' &&
                                <>
                                    <WorkerIcon worker='Geologist' nation={nation} scale={0.5} />
                                    Geologist has found {message.material.toLowerCase()}!
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'BUILDING_LOST' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    Building lost to enemy
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'BUILDING_CAPTURED' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    Building captured
                                    <Button onClick={() => { onGoToPoint(message.point) }}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'STORE_HOUSE_IS_READY' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    A store house is ready
                                    <Button onClick={() => onGoToHouse(message.houseId)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'MILITARY_BUILDING_CAUSED_LOST_LAND' &&
                                <>
                                    <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                    This building has caused you to lose land
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'TREE_CONSERVATION_PROGRAM_ACTIVATED' &&
                                <>
                                    The tree conservation program has been activated. Only Woodcutters, Sawmills, and Forester huts will get planks.
                                </>
                            }

                            {message.type === 'TREE_CONSERVATION_PROGRAM_DEACTIVATED' &&
                                <>
                                    The tree conservation program has been deactivated.
                                </>
                            }

                            {message.type === 'BOMBARDED_BY_CATAPULT' &&
                                <>
                                    <HouseIcon houseType={'Catapult'} nation={nation} scale={0.5} />
                                    {"We're being bombarded by a catapult"}
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'HARBOR_IS_FINISHED' &&
                                <>
                                    <HouseIcon houseType={'Harbor'} nation={nation} scale={0.5} />
                                    A harbor is finished
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'SHIP_READY_FOR_EXPEDITION' &&
                                <>
                                    <ShipIcon scale={0.5} />
                                    A ship is ready to start an expedition
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'SHIP_HAS_REACHED_DESTINATION' &&
                                <>
                                    <ShipIcon scale={0.5} />
                                    A ship has reached its destination
                                    <Button onClick={() => onGoToPoint(message.point)}
                                        appearance='transparent'
                                        icon={<ArrowStepInRight24Regular />} />
                                </>
                            }

                            {message.type === 'GAME_ENDED' &&
                                <>
                                    Player {message.winnerPlayerId} is the winner!
                                </>
                            }

                            <Button icon={<Delete24Filled />}
                                onClick={() => removeMessage(message)}
                                appearance='transparent' />
                        </div>
                    )}
                    <Button onClick={() => api.removeMessages(messages)} >Clear all</Button>

                </div>
            }
        </div>
    )
}

export default GameMessagesViewer