import React, { Component } from 'react'
import { getMessagesForPlayer, isBuildingCapturedMessage, isBuildingLostMessage, isGeologistFindMessage, isMilitaryBuildingCausedLostLandMessage, isMilitaryBuildingOccupiedMessage, isMilitaryBuildingReadyMessage, isNoMoreResourcesMessage, isStoreHouseIsReadyMessage, isTreeConservationProgramActivatedMessage, isTreeConservationProgramDeactivatedMessage, isUnderAttackMessage } from './api/rest-api'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from './expand_collapse_toggle'
import './game_messages_viewer.css'
import { listenToMessages } from './api/ws-api'
import { play } from './sound_effects'
import { ArrowStepInRight24Regular, Delete24Filled } from '@fluentui/react-icons'
import { GameId, PlayerId, HouseId, Point, GameMessage, Nation } from './api/types'
import { HouseIcon, WorkerIcon } from './icon'

interface GameMessagesViewerProps {
    gameId: GameId
    playerId: PlayerId
    nation: Nation

    onGoToHouse: ((houseId: HouseId) => void)
    onGoToPoint: ((point: Point) => void)
}

interface GameMessagesViewerState {
    expanded: boolean
    messages: GameMessage[]
}

class GameMessagesViewer extends Component<GameMessagesViewerProps, GameMessagesViewerState> {

    private periodicUpdates: NodeJS.Timeout | undefined

    constructor(props: GameMessagesViewerProps) {
        super(props)

        this.state = {
            expanded: false,
            messages: []
        }
    }

    newMessages(messages: GameMessage[]): void {
        this.setState({ messages: this.state.messages.concat(messages) })

        play('NEW-MESSAGE')
    }

    async componentDidMount(): Promise<void> {
        const messages = await getMessagesForPlayer(this.props.gameId, this.props.playerId)

        this.setState({ messages: messages })

        listenToMessages(this.newMessages.bind(this))
    }

    componentWillUnmount(): void {
        if (this.periodicUpdates) {
            clearInterval(this.periodicUpdates)
        }
    }

    shouldComponentUpdate(nextProps: GameMessagesViewerProps, nextState: GameMessagesViewerState): boolean {
        return nextState.messages.length !== this.state.messages.length ||
            nextState.expanded !== this.state.expanded ||
            nextProps.gameId !== this.props.gameId ||
            nextProps.playerId !== this.props.playerId
    }

    onClearAll(): void {
        this.setState({ messages: [] })
    }

    render(): JSX.Element {

        return (
            <div className="game-messages">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} />
                <div> <b>Messages</b></div>

                {this.state.expanded &&
                    <div className="game-message-list">

                        {this.state.messages.map(
                            (message, index) => {

                                return (
                                    <div className="game-message" key={index}>
                                        {isMilitaryBuildingOccupiedMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                Military building occupied
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    icon={<ArrowStepInRight24Regular />}
                                                    appearance='transparent'
                                                />
                                            </>
                                        }

                                        {isNoMoreResourcesMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                No more resources
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isMilitaryBuildingReadyMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                Military building is ready
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isUnderAttackMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                We&apos;re under attack!
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }
                                        {isGeologistFindMessage(message) &&
                                            <>
                                                <WorkerIcon worker='Geologist' nation={this.props.nation} scale={0.5} />
                                                Geologist has found {message.material.toLowerCase()}!
                                                <Button onClick={() => { this.props.onGoToPoint(message.point) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isBuildingLostMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                Building lost to enemy
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isBuildingCapturedMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                Building captured
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isStoreHouseIsReadyMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                A store house is ready
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
                                                    appearance='transparent'
                                                    icon={<ArrowStepInRight24Regular />} />
                                            </>
                                        }

                                        {isMilitaryBuildingCausedLostLandMessage(message) &&
                                            <>
                                                <HouseIcon houseType={message.houseType} nation={this.props.nation} scale={0.5} />
                                                This building has caused you to lose land
                                                <Button onClick={() => { this.props.onGoToHouse(message.houseId) }}
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
                                            onClick={() => this.setState({ messages: this.state.messages.filter(m => m !== message) })}
                                            appearance='transparent' />
                                    </div>
                                )
                            }
                        )
                        }
                        <Button onClick={this.onClearAll.bind(this)} >Clear all</Button>

                    </div>
                }
            </div>
        )
    }
}

export default GameMessagesViewer