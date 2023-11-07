import React, { Component } from 'react'
import './type_control.css'
import ExpandCollapseToggle from './expand_collapse_toggle'
import { getInformationOnPoint } from './api/rest-api'
import { PointInformation, Point, GameId, PlayerId } from './api/types'

export interface Command {
    action: (() => void)
    filter?: ((selectedPointInformation: PointInformation) => boolean) | undefined
    icon?: React.ReactNode
}

interface TypeControlProps {
    commands: Map<string, Command>
    selectedPoint: Point
    gameId: GameId
    playerId: PlayerId
}

interface TypeControlState {
    input: string
    expanded: boolean
    selectedPointInformation: PointInformation | undefined
}

class TypeControl extends Component<TypeControlProps, TypeControlState> {

    constructor(props: TypeControlProps) {
        super(props)

        this.state = {
            input: "",
            expanded: false,
            selectedPointInformation: undefined
        }
    }

    // eslint-disable-next-line
    async componentDidUpdate(prevProps: Readonly<TypeControlProps>, prevState: Readonly<TypeControlState>, snapshot?: unknown): Promise<void> {
        if (prevProps.selectedPoint !== this.props.selectedPoint) {
            const pointInformation = await getInformationOnPoint(this.props.selectedPoint, this.props.gameId, this.props.playerId)

            this.setState({selectedPointInformation: pointInformation})
        }
    }

    commandChosen(commandName: string): void {

        /* Run the command */
        console.log("Command: " + commandName + " (" + this.state.input + ")")

        const command = this.props.commands.get(commandName)

        if (command) {
            command.action()
        }

        /* Clear the input */
        this.setState(
            {
                input: ""
            }
        )
    }

    onKeyDown(event: React.KeyboardEvent): void {

        /* Clear the command if escape is pressed */
        if (event.key === "Escape") {
            this.setState(
                {
                    input: ""
                }
            )

        /* Run the command if enter is pressed */
        } else if (event.key === "Enter") {

            /* Do nothing if there is nothing typed */
            if (!this.state.input || this.state.input === "") {
                return
            }

            /* Find the matching command */
            let commandHit

            for (const command of Array.from(this.props.commands.keys())) {
                if (command.toLowerCase().startsWith(this.state.input.toLowerCase())) {
                    commandHit = command

                    break
                }
            }

            /* Run the command */
            if (commandHit) {
                this.commandChosen(commandHit)
            } else {
                console.log("Can't find command matching: " + this.state.input)
            }

            /* Remove the last entered character if backspace is pressed */
        } else if (event.key === "Backspace") {
            this.setState(
                {
                    input: this.state.input.substring(0, this.state.input.length - 1)
                }
            )
        }
    }

    onKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {

        /* Filter enter presses (they are handled by onKeyDown) */
        if (event.key === "Enter") {
            return
        }

        /* Filter initial space */
        if (this.state.input === "" && event.key === " ") {
            return
        }

        const input = this.state.input + event.key

        console.log("Input: " + input)

        this.setState(
            {
                input: input
            }
        )
    }

    render(): JSX.Element {

        let hasMatch = false
        const inputToMatch = this.state.input.toLowerCase()

        if (this.state.input.length > 0) {
            this.props.commands.forEach((fn, command) => {

                if (command.toLowerCase().startsWith(inputToMatch)) {
                    hasMatch = true
                }
            })
        }

        let className = "no-input"

        if (this.state.input.length > 0) {

            if (hasMatch) {
                className = "input-with-matches"
            } else {
                className = "input-with-no-matches"
            }
        }

        if (this.state.expanded) {
            className += " expanded"
        } else {
            className += " closed"
        }

        return (
            <div className="type-control">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} />
                <div className={className}>{this.state.input}</div>

                <div className="container-alternatives">

                {Array.from(this.props.commands.entries()).map(
                    ([commandName, command], index) => {

                        let show = true

                        if (command.filter && this.state.selectedPointInformation) {
                            show = command.filter(this.state.selectedPointInformation)
                        }

                        if (show && inputToMatch.length > 0 && commandName.toLowerCase().startsWith(inputToMatch)) {

                            return (
                                <div key={index} className="alternative" onClick={() => this.commandChosen(commandName)} >
                                    <span>
                                    <span className="MatchingPart">{commandName.substring(0, this.state.input.length)}</span>
                                    <span className="RemainingPart">{commandName.substring(this.state.input.length, commandName.length)}</span>
                                    </span>
                                    {command.icon}
                                </div>
                            )
                        } else if (show) {

                            if (this.state.expanded) {
                                return (
                                    <div key={index} className="alternative" onClick={() => this.commandChosen(commandName)} >
                                        {commandName} {command.icon}
                                    </div>
                                )
                            }
                        }

                        return null
                    }
                )
                }
                </div>

            </div>
        )
    }
}

export { TypeControl }