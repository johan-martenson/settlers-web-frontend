import React, { Component, createRef } from 'react';
import { Text, CardHeader, Caption1, Card, Button } from "@fluentui/react-components";
import './player.css';
import { PlayerInformation } from './api';
import { MoreHorizontal20Regular } from "@fluentui/react-icons";


interface PlayerState {
    name: string
    isSelf: boolean
    expanded: boolean
    nameField: HTMLInputElement | null
}

interface PlayerProps {
    isSelf?: boolean
    player: PlayerInformation
    onPlayerRemoved?: (() => void)
    onNameChanged?: ((name: string) => void)
}

class Player extends Component<PlayerProps, PlayerState> {

    private nameFieldRef = createRef<HTMLInputElement>()

    constructor(props: PlayerProps) {
        super(props)

        let isSelf = false

        if (props.isSelf) {
            isSelf = true
        }

        this.state = {
            name: props.player.name,
            isSelf: isSelf,
            nameField: null,
            expanded: false
        }
    }

    changeName(): void {

        console.log("CHANGING NAME")

        if (!this.props.onNameChanged) {
            console.log("No callback setup")
            return
        }

        const nameField = this.nameFieldRef.current

        if (!nameField || nameField.value === "") {
            console.log("No value to read")
            return
        }

        console.log("Calling callback")
        this.props.onNameChanged(nameField.value)
    }

    render(): JSX.Element {

        console.log(this.props.player.type)

        return (
                <Card>
                    <CardHeader
                    header={<Text weight="semibold">{this.props.player.name} {this.props.player.type === "COMPUTER" && "(computer)"}</Text>}
                    description={
                        <Caption1>{this.props.player.nation}, {this.props.player.type === "COMPUTER" && "(computer)"}</Caption1>
                    }
                    action={
                        <Button
                            appearance="transparent"
                            icon={<MoreHorizontal20Regular />}
                            aria-label="More options"
                        />}
                />
                <p>
                    {this.props.player.type === "COMPUTER" && this.state.expanded &&
                        <div className="SetName">
                            <div className="SetNameLabel">Change name:</div>
                            <input type="text" className="SetNameField" placeholder="Name" ref={this.nameFieldRef} />
                            <Button onClick={this.changeName.bind(this)} >Ok</Button>
                        </div>
                    }

                    {!this.props.isSelf && this.props.onPlayerRemoved && this.state.expanded &&
                        <Button onClick={this.props.onPlayerRemoved} >Remove</Button>
                    }
</p>
                </Card>
        )
    }
}

export { Player }

