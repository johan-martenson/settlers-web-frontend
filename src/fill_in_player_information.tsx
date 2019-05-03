import React, { Component } from 'react';
import Button from './button';
import { Dialog } from './dialog';
import { do_self_test } from './self_test';

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

    private nameFieldRef = React.createRef<HTMLInputElement>();

    constructor(props: FillInPlayerInformationProps) {
        super(props);

        this.state = { userNameEntered: false };

        console.log("Running self test")

        do_self_test()
    }

    onPlayerInformationDone(): void {

        if (this.nameFieldRef && this.nameFieldRef.current && this.nameFieldRef.current.value !== "") {

            this.props.onPlayerInformationDone(
                {
                    name: this.nameFieldRef.current.value
                }
            );
        }
    }

    componentDidMount() {

        if (this.nameFieldRef && this.nameFieldRef.current) {
            this.nameFieldRef.current.focus();
        }
    }

    onInformationEntered(): void {

        if (this.nameFieldRef &&
            this.nameFieldRef.current &&
            this.nameFieldRef.current.value !== "") {

            if (!this.state.userNameEntered) {
                this.setState({ userNameEntered: true });
            }
        } else {
            if (this.state.userNameEntered) {
                this.setState({ userNameEntered: false });
            }
        }
    }

    render() {
        return (
            <Dialog heading="Enter player information" noCloseButton={true}>
                <div>Name:
                    <input type="text" placeholder="Name" ref={this.nameFieldRef}
                        onChange={
                            (e: React.FormEvent<HTMLInputElement>) => {
                                this.onInformationEntered();
                            }
                        }

                        onKeyDown={
                            (e: React.KeyboardEvent<Element>) => {
                                if (e.keyCode === 13) {

                                    if (this.state.userNameEntered) {
                                        this.onPlayerInformationDone();
                                    }
                                }
                            }
                        }
                    />
                </div>

                <Button label="Enter lobby"
                    onButtonClicked={this.onPlayerInformationDone.bind(this)}
                    disabled={!this.state.userNameEntered}
                />
            </Dialog>
        );
    }
}

export { FillInPlayerInformation };

