import React, { Component, createRef } from 'react';
import Button from './button';
import Card from './card';
import ExpandCollapseToggle from './expand_collapse_toggle';
import './player.css';
import { PlayerInformation } from './api';

interface PlayerState {
    type: string
    name: string
    isSelf: boolean
    expanded: boolean
    nameField: HTMLInputElement | null
}

interface PlayerProps {
    isSelf?: boolean;
    player: PlayerInformation;
    onPlayerRemoved?: (() => void)
    onNameChanged?: ((name: string) => void)
}

class Player extends Component<PlayerProps, PlayerState> {

    private nameFieldRef = createRef<HTMLInputElement>();

    constructor(props: PlayerProps) {
        super(props);

        let isSelf = false;

        if (props.isSelf) {
            isSelf = true;
        }

        this.state = {
            type: props.player.type,
            name: props.player.name,
            isSelf: isSelf,
            nameField: null,
            expanded: false
        };
    }

    changeName(): void {

        console.log("CHANGING NAME");

        if (!this.props.onNameChanged) {
            console.log("No callback setup");
            return;
        }

        const nameField = this.nameFieldRef.current;

        if (!nameField || nameField.value === "") {
            console.log("No value to read")
            return;
        }

        console.log("Calling callback")
        this.props.onNameChanged(nameField.value);
    }

    render() {

        return (
            <div>
                <Card className="Player">
                    <div className="PlayerTop">
                        <div className="PlayerNameLabel">{this.props.player.name} {this.state.type === "COMPUTER" && "(computer)"}</div>
                        <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} />
                    </div>
                    {this.state.type === "COMPUTER" && this.state.expanded &&
                        <div className="SetName">
                            <div className="SetNameLabel">Change name:</div>
                            <input type="text" className="SetNameField" placeholder="Name" ref={this.nameFieldRef} />
                            <Button label="Ok" className="SetNameButton" onButtonClicked={this.changeName.bind(this)} />
                        </div>
                    }

                    {!this.props.isSelf && this.props.onPlayerRemoved && this.state.expanded &&
                        <Button label="Remove" className="RemovePlayerButton" onButtonClicked={this.props.onPlayerRemoved} />
                    }

                </Card>
            </div>
        );
    }
}

export { Player };

