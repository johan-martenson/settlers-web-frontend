import React, { Component } from 'react'
import { Label, Input, Button } from "@fluentui/react-components"
import { do_self_test } from './self_test'
import { HouseIcon, WorkerIcon } from './icon'
import './fill_in_player_information.css'

export interface EnteredPlayerInformation {
    name: string
}

interface FillInPlayerInformationProps {
    onPlayerInformationDone: ((playerInformation: EnteredPlayerInformation) => void)
}

interface FillInPlayerInformationState {
    userNameEntered: boolean
}

class FillInPlayerInformation extends Component<FillInPlayerInformationProps, FillInPlayerInformationState> {

    private nameFieldRef = React.createRef<HTMLInputElement>()

    constructor(props: FillInPlayerInformationProps) {
        super(props)

        this.state = { userNameEntered: false }

        console.log("Running self tests")

        do_self_test()

        console.log("After self tests")
    }

    onPlayerInformationDone(): void {

        if (this.nameFieldRef && this.nameFieldRef.current && this.nameFieldRef.current.value !== "") {

            /* Store the player name for next time */
            localStorage.setItem("mostRecentPlayer", this.nameFieldRef.current.value)

            this.props.onPlayerInformationDone(
                {
                    name: this.nameFieldRef.current.value
                }
            )
        }
    }

    componentDidMount(): void {

        /* Try to pre-populate the screen with the most recent player */
        const lastPlayerName = localStorage.getItem("mostRecentPlayer")

        if (lastPlayerName && this.nameFieldRef && this.nameFieldRef.current) {
            this.nameFieldRef.current.value = lastPlayerName

            this.setState(
                {
                    userNameEntered: true
                }
            )
        }

        /* Set focus on the name field */
        if (this.nameFieldRef && this.nameFieldRef.current) {
            this.nameFieldRef.current.focus()
        }
    }

    onInformationEntered(): void {

        if (this.nameFieldRef &&
            this.nameFieldRef.current &&
            this.nameFieldRef.current.value !== "") {

            if (!this.state.userNameEntered) {
                this.setState({ userNameEntered: true })
            }
        } else {
            if (this.state.userNameEntered) {
                this.setState({ userNameEntered: false })
            }
        }
    }

    render(): JSX.Element {
        const storedName = localStorage.getItem("mostRecentPlayer")
        const defaultName = (storedName) ? storedName : ""

        return (
            <>
                <div id="center-on-screen">
                    <div id="set-player-name-dialog">

                        <div id="label-and-input">
                            <Label>Name</Label>
                            <Input type="text" ref={this.nameFieldRef}
                                onChange={

                                    // eslint-disable-next-line
                                    (event: React.FormEvent<HTMLInputElement>) => {
                                        this.onInformationEntered()
                                    }
                                }

                                onKeyDown={
                                    (event: React.KeyboardEvent) => {
                                        if (event.code === 'Enter') {
                                            if (this.state.userNameEntered) {
                                                this.onPlayerInformationDone()
                                            }
                                        }
                                    }
                                }
                                defaultValue={defaultName}
                                autoFocus
                            />
                        </div>

                        <Button
                            onClick={this.onPlayerInformationDone.bind(this)}
                            disabled={!this.nameFieldRef.current?.value}
                            appearance='primary'
                        >Go</Button>
                    </div>
                </div>
                <div id="worker-animation">
                <WorkerIcon worker='General' animate nation='ROMANS' direction={'WEST'} scale={3} />
                </div>

                <div id="house-icon">
                    false && <HouseIcon nation="ROMANS" houseType='Fortress' scale={2}/>
                </div>
            </>
        )
    }
}

export { FillInPlayerInformation }
