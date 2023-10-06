import React, { Component } from 'react'
import Button from './button'
import { Dialog } from './dialog'
import { do_self_test } from './self_test'
import { WorkerIcon } from './icon'
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
        return (
            <>
                <div className="CenterOnScreen">
                    <div className="SetPlayerNameDialog">

                        <div id="NameLabel">Name</div>
                        <input type="text" placeholder="Name" ref={this.nameFieldRef}
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
                        />

                        <Button label="Go"
                            onButtonClicked={this.onPlayerInformationDone.bind(this)}
                            disabled={!this.state.userNameEntered}
                        />
                    </div>
                </div>
                <div className="WorkerAnimation">
                    <WorkerIcon worker='General' animate={true} nationality='ROMANS' direction={'WEST'} scale={3} />
                </div>
            </>
        )
    }
}

export { FillInPlayerInformation }

