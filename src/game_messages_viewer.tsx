import { Component } from 'react'
import { GameId, GameMessage, getMessagesForPlayer, HouseId, isBuildingCapturedMessage, isBuildingLostMessage, isGeologistFindMessage, isMilitaryBuildingCausedLostLandMessage, isMilitaryBuildingOccupiedMessage, isMilitaryBuildingReadyMessage, isNoMoreResourcesMessage, isStoreHouseIsReadyMessage, isTreeConservationProgramActivatedMessage, isTreeConservationProgramDeactivatedMessage, isUnderAttackMessage, PlayerId, Point } from './api'
import Button from './button'
import ExpandCollapseToggle from './expand_collapse_toggle'
import './game_messages_viewer.css'
import { listenToMessages } from './monitor'
import { play } from './sound_effects'

interface GameMessagesViewerProps {
    gameId: GameId
    playerId: PlayerId

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
        super(props);

        this.state = {
            expanded: false,
            messages: []
        }
    }

    newMessages(messages: GameMessage[]): void {
        this.setState({ messages: this.state.messages.concat(messages) })

        play('NEW-MESSAGE')
    }

    async componentDidMount() {
        const messages = await getMessagesForPlayer(this.props.gameId, this.props.playerId)

        this.setState({ messages: messages })

        listenToMessages(this.newMessages.bind(this))
    }

    componentWillUnmount() {
        if (this.periodicUpdates) {
            clearInterval(this.periodicUpdates)
        }
    }

    shouldComponentUpdate(nextProps: GameMessagesViewerProps, nextState: GameMessagesViewerState) {
        return nextState.messages.length !== this.state.messages.length ||
            nextState.expanded !== this.state.expanded ||
            nextProps.gameId !== this.props.gameId ||
            nextProps.playerId !== this.props.playerId
    }

    onClearAll(): void {
        this.setState({ messages: [] })
    }

    render() {

        return (
            <div className="GameMessages">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} inverted />
                <div> <b>Messages</b></div>

                <Button onButtonClicked={this.onClearAll.bind(this)} label="Clear all" />

                {this.state.expanded &&
                    <div className="GameMessageList">

                        {this.state.messages.map(
                            (message, index) => {

                                return (
                                    <div className="GameMessage" key={index}>
                                        {isMilitaryBuildingOccupiedMessage(message) &&
                                            <>
                                                Military building occupied
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isNoMoreResourcesMessage(message) &&
                                            <>
                                                No more resources
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isMilitaryBuildingReadyMessage(message) &&
                                            <>
                                                Military building is ready
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isUnderAttackMessage(message) &&
                                            <>
                                                We&apos;re under attack!
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }
                                        {
                                            isGeologistFindMessage(message) &&
                                            <>
                                                Geologist has found {message.material.toLowerCase()}!
                                                <Button label="Go to point" onButtonClicked={() => { this.props.onGoToPoint(message.point) }} />
                                            </>
                                        }

                                        {
                                            isBuildingLostMessage(message) &&
                                            <>
                                                Building lost to enemy
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isBuildingCapturedMessage(message) &&
                                            <>
                                                Building captured
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isStoreHouseIsReadyMessage(message) &&
                                            <>
                                                A store house is ready
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isMilitaryBuildingCausedLostLandMessage(message) &&
                                            <>
                                                This building has caused you to lose land
                                                <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                            </>
                                        }

                                        {
                                            isTreeConservationProgramActivatedMessage(message) &&
                                            <>
                                                The tree conservation program has been activated. Only Woodcutters, Sawmills, and Forester huts will get planks.
                                            </>
                                        }

                                        {
                                            isTreeConservationProgramDeactivatedMessage(message) &&
                                            <>
                                                The tree conservation program has been deactivated.
                                            </>
                                        }
                                    </div>
                                );
                            }
                        )
                        }
                    </div>
                }
            </div>
        );
    }
}

export default GameMessagesViewer;