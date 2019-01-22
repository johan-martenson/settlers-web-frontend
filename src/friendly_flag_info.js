import React, { Component } from 'react';
import { Dialog, DialogSection } from './dialog.js';
import Button from './button.js';
import { removeFlag, callGeologist, sendScout } from './api.js';

class FriendlyFlagInfo extends Component {

    render() {
        return (
                <Dialog heading="Flag" onCloseDialog={this.props.closeDialog}>

                    <DialogSection>

                        <Button className="ConstructionItem"
                            label="Remove"
                            image="flag.png"
                            imageLabel="Flag"
                            onButtonClicked={
                                () => {
                                    console.log("Removing flag");
                                    removeFlag(this.props.flag.flagId,
                                               this.props.url).then(
                                                   () => this.props.onCanReachServer).catch(
                                                       () => this.props.onCannotReachServer);

                                    this.props.closeDialog();
                                }
                            }
                        />

                        <Button className="ConstructionItem"
                            label="Build road"
                            image="road-1.png"
                            imageLabel="Road"
                            onButtonClicked={
                                () => {
                                    console.info("Starting to build road");

                                    this.props.startNewRoad(this.props.flag);

                                    this.props.closeDialog();
                                }
                            }
                        />

                        <Button className="ConstructionItem"
                            label="Call geologist"
                            image="pickaxe2.png"
                            imageLabel="Geologist"
                            onButtonClicked={
                                () => {
                                    console.info("Calling for geologist");

                                    callGeologist(this.props.flag, this.props.player, this.props.url);

                                    this.props.closeDialog();
                                }
                            }
                        />

                        <Button className="ConstructionItem"
                            label="Send scout"
                            image="magnifier2.png"
                            imageLabel="Scout"
                            onButtonClicked={
                                () => {
                                    console.info("Sending scout");

                                    sendScout(this.props.flag, this.props.player, this.props.url);

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
