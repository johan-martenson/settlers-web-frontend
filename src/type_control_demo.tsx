import React, { Component } from 'react'
import { TypeControl, Command } from './type_control'

interface TypeControlDemoProps {
    commands: Map<string, Command>
}

interface TypeControlDemoState { }

class TypeControlDemo extends Component<TypeControlDemoProps, TypeControlDemoState> {
    typeControlRef = React.createRef<TypeControl>()

    constructor(props: TypeControlDemoProps) {
        super(props)
    }

    onKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
        console.log("ON KEY PRESS")
        console.log(event.key)

        if (this.typeControlRef && this.typeControlRef.current) {
            this.typeControlRef.current.onKeyPress(event)
        }
    }

    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (this.typeControlRef && this.typeControlRef.current) {
            this.typeControlRef.current.onKeyDown(event)
        }
    }

    render() {
        return (
            <div onKeyPress={this.onKeyPress.bind(this)} onKeyDown={this.onKeyDown.bind(this)} tabIndex={1}>
                Some filler stuff
                <TypeControl commands={this.props.commands} ref={this.typeControlRef} selectedPoint={{x: 10, y: 12}} playerId={'2'} gameId={'3'}/>
            </div>
        )
    }
}

export default TypeControlDemo