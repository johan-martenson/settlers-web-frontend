import React, { Component } from 'react'
import { FlagInformation, GameId, PlayerId } from './api/types'
import { Dialog, DialogSection } from './dialog'
import './friendly_flag_info.css'
import { monitor } from './api/ws-api'
import { Button } from '@fluentui/react-components'

interface FriendlyFlagInfoProps {
    closeDialog: (() => void)
    flag: FlagInformation
    gameId: GameId
    playerId: PlayerId
    startNewRoad: ((flag: FlagInformation) => void)
}
interface FriendlyFlagInfoState { }

class FriendlyFlagInfo extends Component<FriendlyFlagInfoProps, FriendlyFlagInfoState> {

    render(): JSX.Element {
        return (
            <Dialog heading="Flag" onCloseDialog={this.props.closeDialog} floating>

                <DialogSection>

                    <div className="FlagInformation">

                        <div className="ButtonRow">

                            <Button
                                icon="flag.png"
                                onClick={
                                    async () => {
                                        console.log("Removing flag")

                                        monitor.removeFlag(this.props.flag.id)

                                        this.props.closeDialog()
                                    }
                                }
                            >Remove</Button>

                            <Button
                                icon="road-1.png"
                                onClick={
                                    () => {
                                        console.info("Starting to build road")

                                        this.props.startNewRoad(this.props.flag)

                                        this.props.closeDialog()
                                    }
                                }
                            >Build road</Button>

                            <Button
                                icon="pickaxe2.png"
                                onClick={
                                    async () => {
                                        console.info("Calling for geologist")

                                        monitor.callGeologist(this.props.flag)

                                        this.props.closeDialog()
                                    }
                                }
                            >Call geologist</Button>

                            <Button
                                icon="magnifier2.png"
                                onClick={
                                    async () => {
                                        console.info("Sending scout")

                                        monitor.callScout(this.props.flag)

                                        this.props.closeDialog()
                                    }
                                }
                            >Send scout</Button>
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
