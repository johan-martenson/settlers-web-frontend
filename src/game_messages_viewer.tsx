import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from './expand_collapse_toggle'
import './game_messages_viewer.css'
import { monitor } from './api/ws-api'
import { ArrowStepInRight24Regular, Delete24Filled } from '@fluentui/react-icons'
import { PlayerId, HouseId, Point, GameMessage, Nation, isMilitaryBuildingOccupiedMessage, isNoMoreResourcesMessage, isMilitaryBuildingReadyMessage, isUnderAttackMessage, isGeologistFindMessage, isBuildingLostMessage, isBuildingCapturedMessage, isStoreHouseIsReadyMessage, isMilitaryBuildingCausedLostLandMessage, isTreeConservationProgramActivatedMessage, isTreeConservationProgramDeactivatedMessage, GameMessageId } from './api/types'
import { HouseIcon, WorkerIcon } from './icon'

interface GameMessagesViewerProps {
    playerId: PlayerId
    nation: Nation

    onGoToHouse: ((houseId: HouseId) => void)
    onGoToPoint: ((point: Point) => void)
}

const GameMessagesViewer = ({ playerId, nation, onGoToHouse, onGoToPoint }: GameMessagesViewerProps) => {
    const [expanded, setExpanded] = useState<boolean>(false)
    const [messages, setMessages] = useState<GameMessage[]>(Array.from(monitor.messages.values()))

    function removeMessage(message: GameMessage) {
        monitor.removeMessage(message.id)
    }

    useEffect(() => {

        // eslint-disable-next-line
        const messageReceiver = (_receivedMessages: GameMessage[], _removedMessages: GameMessageId[]) => {
            setMessages(Array.from(monitor.messages.values()))
        }

        // Subscribe to received messages
        monitor.listenToMessages(messageReceiver)

        return () => monitor.stopListeningToMessages(messageReceiver)
    }, [playerId])

    return (
        <div className="game-messages">

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} />
            <div> <b>Messages</b></div>

            {expanded &&
                <div className="game-message-list">

                    {messages.map(
                        (message, index) => {

                            return (
                                <div className="game-message" key={index}>
                                    {isMilitaryBuildingOccupiedMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Military building occupied
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                icon={<ArrowStepInRight24Regular />}
                                                appearance='transparent'
                                            />
                                        </>
                                    }

                                    {isNoMoreResourcesMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            No more resources
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isMilitaryBuildingReadyMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Military building is ready
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isUnderAttackMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            We&apos;re under attack!
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }
                                    {isGeologistFindMessage(message) &&
                                        <>
                                            <WorkerIcon worker='Geologist' nation={nation} scale={0.5} />
                                            Geologist has found {message.material.toLowerCase()}!
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isBuildingLostMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Building lost to enemy
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isBuildingCapturedMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            Building captured
                                            <Button onClick={() => { onGoToPoint(message.point) }}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isStoreHouseIsReadyMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            A store house is ready
                                            <Button onClick={() => onGoToHouse(message.houseId)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isMilitaryBuildingCausedLostLandMessage(message) &&
                                        <>
                                            <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            This building has caused you to lose land
                                            <Button onClick={() => onGoToPoint(message.point)}
                                                appearance='transparent'
                                                icon={<ArrowStepInRight24Regular />} />
                                        </>
                                    }

                                    {isTreeConservationProgramActivatedMessage(message) &&
                                        <>
                                            The tree conservation program has been activated. Only Woodcutters, Sawmills, and Forester huts will get planks.
                                        </>
                                    }

                                    {isTreeConservationProgramDeactivatedMessage(message) &&
                                        <>
                                            The tree conservation program has been deactivated.
                                        </>
                                    }
                                    <Button icon={<Delete24Filled />}
                                        onClick={() => {
                                            removeMessage(message)
                                        }}
                                        appearance='transparent' />
                                </div>
                            )
                        }
                    )
                    }
                    <Button onClick={() => monitor.removeMessages(messages)} >Clear all</Button>

                </div>
            }
        </div>
    )
}

export default GameMessagesViewer