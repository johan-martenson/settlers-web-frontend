import React, { Component } from 'react';
import { isMilitaryBuildingReadyMessage, isStoreHouseIsReadyMessage, isBuildingCapturedMessage, isBuildingLostMessage, GameId, GameMessage, getMessagesForPlayer, HouseId, isGeologistFindMessage, isMilitaryBuildingOccupiedMessage, isNoMoreResourcesMessage, isUnderAttackMessage, PlayerId, Point } from './api';
import Button from './button';
import ExpandCollapseToggle from './expand_collapse_toggle';
import './game_messages_viewer.css';

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

    async componentDidMount() {
        const messages = await getMessagesForPlayer(this.props.gameId, this.props.playerId)

        this.setState({ messages: messages })

        this.periodicUpdates = setInterval(
            async () => {
                const messages = await getMessagesForPlayer(this.props.gameId, this.props.playerId)
                this.setState({ messages: messages })

            },
            1000
        )
    }

    componentWillUnmount() {
        if (this.periodicUpdates) {
            clearInterval(this.periodicUpdates)
        }
    }

    render() {

        return (
            <div className="GameMessages">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} inverted />
                <div> <b>Messages</b></div>

                {this.state.messages.map(
                    (message, index) => {

                        if (this.state.expanded) {
                            return (
                                <div key={index} className="GameMessageList">
                                    {isMilitaryBuildingOccupiedMessage(message) &&
                                        <div className="GameMessage">
                                            Military building occupied
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }

                                    {isNoMoreResourcesMessage(message) &&
                                        <div className="GameMessage">
                                            No more resources
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }

                                    {isMilitaryBuildingReadyMessage(message) &&
                                        <div className="GameMessage">
                                            Military building is ready
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }

                                    {isUnderAttackMessage(message) &&
                                        <div className="GameMessage">
                                            We're under attack!
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }
                                    {isGeologistFindMessage(message) &&
                                        <div className="GameMessage">
                                            Geologist has found {message.material.toLowerCase()}!
                                            <Button label="Go to point" onButtonClicked={() => { this.props.onGoToPoint(message.point) }} />
                                        </div>
                                    }

                                    {isBuildingLostMessage(message) &&
                                        <div>
                                            Building lost to enemy
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }

                                    {isBuildingCapturedMessage(message) &&
                                        <div>
                                            Building captured
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }

                                    {isStoreHouseIsReadyMessage(message) &&
                                        <div>
                                            A store house is ready
                                            <Button label="Go to house" onButtonClicked={() => { this.props.onGoToHouse(message.houseId) }} />
                                        </div>
                                    }
                                </div>
                            );
                        } else {
                            return null;
                        }
                    }
                )
                }

            </div>
        );
    }
}

export default GameMessagesViewer;