import React, { Component } from 'react';
import './type_control.css';
import ExpandCollapseToggle from './expand_collapse_toggle';

interface TypeControlProps {
    commands: Map<string, (() => void)>
}

interface TypeControlState {
    input: string
    expanded: boolean
}

class TypeControl extends Component<TypeControlProps, TypeControlState> {

    constructor(props: TypeControlProps) {
        super(props);

        this.state = {
            input: "",
            expanded: false
        }
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

            console.log("Running command based on current input: " + this.state.input);

            /* Find the matching command */
            let commandHit;

            for (const command of Array.from(this.props.commands.keys())) {
                if (command.toLowerCase().startsWith(this.state.input.toLowerCase())) {
                    commandHit = command;

                    break;
                }
            }

            console.log("Command hit: " + commandHit);

            /* Run the command */
            if (commandHit) {

                const fn = this.props.commands.get(commandHit);

                if (fn) {
                    fn();
                }

                /* Clear the input */
                this.setState(
                    {
                        input: ""
                    }
                )
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
        console.log("Key pressed: " + event.key + ", input was: " + this.state.input);

        /* Filter enter presses (they are handled by onKeyDown) */
        if (event.key === "Enter") {
            return;
        }

        /* Filter initial space */
        if (this.state.input === "" && event.key === " ") {
            return;
        }

        this.setState(
            {
                input: this.state.input + event.key
            }
        )
    }

    render() {

        let hasMatch = false;
        const inputToMatch = this.state.input.toLowerCase();

        if (this.state.input.length > 0) {
            this.props.commands.forEach((fn, command) => {

                if (command.toLowerCase().startsWith(inputToMatch)) {
                    hasMatch = true;
                }
            });
        }

        let className = "Input"

        if (this.state.input.length > 0 && !hasMatch) {
            className = "InputWithNoMatches"
        }

        return (
            <div className="TypeControl">

                <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} inverted />
                <div className={className}>{this.state.input}</div>

                {Array.from(this.props.commands.keys()).map(
                    (option, index) => {

                        if (inputToMatch.length > 0 && option.toLowerCase().startsWith(inputToMatch)) {

                            return (
                                <div key={index} className="Alternative">
                                    <span className="MatchingPart">{option.substring(0, this.state.input.length)}</span>
                                    <span className="RemainingPart">{option.substring(this.state.input.length, option.length)}</span>
                                </div>
                            );
                        } else {

                            if (this.state.expanded) {
                                return (
                                    <div key={index} className="Alternative">{option}</div>
                                );
                            } else {
                                return null;
                            }
                        }
                    }
                )
                }

            </div>
        );
    }
}

export default TypeControl;