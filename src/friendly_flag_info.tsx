import React, { Component } from 'react'
import { callGeologist, FlagInformation, GameId, PlayerId, sendScout } from './api'
import Button from './button'
import { Dialog, DialogSection } from './dialog'
import './friendly_flag_info.css'
import { monitor } from './monitor'

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

                    <div className="FlagInformation">

                        <div className="ButtonRow">

                            <Button className="ConstructionItem"
                                label="Remove"
                                image="flag.png"
                                imageLabel="Flag"
                                onButtonClicked={
                                    async () => {
                                        console.log("Removing flag")

                                        await monitor.removeFlagSnappy(this.props.flag.id, this.props.gameId, this.props.playerId)

                                        this.props.closeDialog()
                                    }
                                }
                            />

                            <Button className="ConstructionItem"
                                label="Build road"
                                image="road-1.png"
                                imageLabel="Road"
                                onButtonClicked={
                                    () => {
                                        console.info("Starting to build road")

                                        this.props.startNewRoad(this.props.flag)

                                        this.props.closeDialog()
                                    }
                                }
                            />

                            <Button className="ConstructionItem"
                                label="Call geologist"
                                image="pickaxe2.png"
                                imageLabel="Geologist"
                                onButtonClicked={
                                    async () => {
                                        console.info("Calling for geologist")

                                        await callGeologist(this.props.flag, this.props.gameId, this.props.playerId)

                                        this.props.closeDialog()
                                    }
                                }
                            />

                            <Button className="ConstructionItem"
                                label="Send scout"
                                image="magnifier2.png"
                                imageLabel="Scout"
                                onButtonClicked={
                                    async () => {
                                        console.info("Sending scout")

                                        await sendScout(this.props.flag, this.props.gameId, this.props.playerId)

                                        this.props.closeDialog()
                                    }
                                }
                            />
                        </div>

                        {this.props.flag.stackedCargo && this.props.flag.stackedCargo.map(
                            (material, index) => {
                                return <div key={index}>{material}</div>
                            }
                        )}
                    </div>
                </DialogSection>

            </Dialog>
        )
    }
}

export default FriendlyFlagInfo
