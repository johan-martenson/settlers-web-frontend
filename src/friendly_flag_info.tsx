import React, { Component } from 'react';
import { callGeologist, FlagInformation, GameId, PlayerId, removeFlag, sendScout } from './api';
import Button from './button';
import { Dialog, DialogSection } from './dialog';

interface FriendlyFlagInfoProps {
    closeDialog: (() => void)
    flag: FlagInformation
    gameId: GameId
    playerId: PlayerId
    startNewRoad: ((flag: FlagInformation) => void)
}
interface FriendlyFlagInfoState { }

class FriendlyFlagInfo extends Component<FriendlyFlagInfoProps, FriendlyFlagInfoState> {

    render() {
        return (
            <Dialog heading="Flag" onCloseDialog={this.props.closeDialog} floating>

                <DialogSection>

                    <Button className="ConstructionItem"
                        label="Remove"
                        image="flag.png"
                        imageLabel="Flag"
                        onButtonClicked={
                            async () => {
                                console.log("Removing flag");
                                await removeFlag(this.props.flag.id, this.props.gameId, this.props.playerId);

                                this.props.closeDialog();
                            }
                        }
                    />

                    <Button className="ConstructionItem"
                        label="Build road"
                        image="road-1.png"
                        imageLabel="Road"
                        onButtonClicked={
                            async () => {
                                console.info("Starting to build road");

                                await this.props.startNewRoad(this.props.flag);

                                this.props.closeDialog();
                            }
                        }
                    />

                    <Button className="ConstructionItem"
                        label="Call geologist"
                        image="pickaxe2.png"
                        imageLabel="Geologist"
                        onButtonClicked={
                            async () => {
                                console.info("Calling for geologist");

                                await callGeologist(this.props.flag, this.props.gameId, this.props.playerId);

                                this.props.closeDialog();
                            }
                        }
                    />

                    <Button className="ConstructionItem"
                        label="Send scout"
                        image="magnifier2.png"
                        imageLabel="Scout"
                        onButtonClicked={
                            async () => {
                                console.info("Sending scout");

                                await sendScout(this.props.flag, this.props.gameId, this.props.playerId);

                                this.props.closeDialog();
                            }
                        }
                    />

                </DialogSection>

            </Dialog>
        );
    }
}

export default FriendlyFlagInfo;
