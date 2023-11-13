import React, { Component } from 'react'
import { TypeControl, Command } from './type_control'

interface TypeControlDemoProps {
    commands: Map<string, Command>
}

interface TypeControlDemoState { }

class TypeControlDemo extends Component<TypeControlDemoProps, TypeControlDemoState> {

    constructor(props: TypeControlDemoProps) {
        super(props)
    }

    onKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
        console.log("ON KEY PRESS")
        console.log(event.key)
        const keyEvent = new CustomEvent("key", {detail: {key: event.key}})

        document.dispatchEvent(keyEvent)
    }

    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        const keyEvent = new CustomEvent("key", {detail: {key: event.key}})

        document.dispatchEvent(keyEvent)
    }

    render() {
        return (
            <div onKeyPress={this.onKeyPress.bind(this)} onKeyDown={this.onKeyDown.bind(this)} tabIndex={1}>
                Some filler stuff
                <TypeControl commands={this.props.commands} selectedPoint={{x: 10, y: 12}} playerId={'2'} gameId={'3'}/>
            </div>
        )
    }
}

export default TypeControlDemo