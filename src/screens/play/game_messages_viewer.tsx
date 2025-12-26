import React, { useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import './game_messages_viewer.css'
import { api } from '../../api/ws-api'
import { Point, GameMessage, Nation } from '../../api/types'
import { HouseIcon, UiIcon, WorkerIcon } from '../../icons/icon'
import { ShipIcon } from '../../icons/ship'
import { ItemContainer } from '../../components/item_container'
import { useGameMessages } from '../../utils/hooks/hooks'

// Types
type GameMessagesViewerProps = {
    nation: Nation

    onGoToPoint: (point: Point) => void
}

// Functions
function removeMessage(message: GameMessage): void {
    api.removeMessage(message.id)
}

// React components
// eslint-disable-next-line
const GameMessagesViewer = ({ nation, onGoToPoint }: GameMessagesViewerProps) => {

    // State
    const [expanded, setExpanded] = useState<boolean>(false)

    // Monitoring hooks
    const messages = useGameMessages()

    // Rendering
    const unreadMessages = messages.filter(message => !message.isRead)

    return (
        <div className='game-messages' onWheel={event => event.stopPropagation()}>

            <ExpandCollapseToggle
                onExpand={() => {
                    console.log('xpanded')

                    api.markGameMessagesRead(messages.map(message => message.id))

                    setExpanded(true)
                }}
                onCollapse={() => setExpanded(false)}
            />

            <div className='game-messages-header'>
                <b>Messages</b>
                {unreadMessages.length > 0 ? <div className='info-overlay'>{unreadMessages.length}</div> : <div></div>}
            </div>

            {expanded &&
                <div className='game-message-list'>
                    {messages.length > 0 &&
                        <ItemContainer>
                            {messages.map((message, index) =>
                                <div className='game-message' key={index}>
                                    {message.type === 'MILITARY_BUILDING_OCCUPIED' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Military building occupied
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'NO_MORE_RESOURCES' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            No more resources
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'MILITARY_BUILDING_READY' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Military building is ready
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'UNDER_ATTACK' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            We&apos;re under attack!
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }
                                    {message.type === 'GEOLOGIST_FIND' &&
                                        <>
                                            <WorkerIcon worker='Geologist' nation={nation} scale={0.5} />
                                            Geologist has found {message.material.toLowerCase()}!
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'BUILDING_LOST' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Building lost to enemy
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'BUILDING_CAPTURED' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Building captured
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'STORE_HOUSE_IS_READY' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            A store house is ready
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'MILITARY_BUILDING_CAUSED_LOST_LAND' &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            This building has caused you to lose land
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'TREE_CONSERVATION_PROGRAM_ACTIVATED' &&
                                        <>
                                            The tree conservation program has been activated.<br />Only Woodcutters, Sawmills, and Forester huts will get planks.
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
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'HARBOR_IS_FINISHED' &&
                                        <>
                                            <HouseIcon houseType={'Harbor'} nation={nation} scale={0.5} />
                                            A harbor is finished
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'SHIP_READY_FOR_EXPEDITION' &&
                                        <>
                                            <ShipIcon scale={0.5} />
                                            A ship is ready to start an expedition
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'SHIP_HAS_REACHED_DESTINATION' &&
                                        <>
                                            <ShipIcon scale={0.5} />
                                            A ship has reached its destination
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                        </>
                                    }

                                    {message.type === 'GAME_ENDED' &&
                                        <>
                                            Player {message.winnerPlayerId} is the winner!
                                        </>
                                    }

                                    <UiIcon type='TRASHCAN' scale={0.5} onClick={() => removeMessage(message)} />
                                </div>
                            )}
                        </ItemContainer>
                    }
                    <Button onClick={() => api.removeMessages(messages)} >Clear all</Button>

                </div>
            }
        </div>
    )
}

export default GameMessagesViewer