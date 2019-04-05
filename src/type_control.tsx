import React, { Component } from 'react';
import './type_control.css';

interface TypeControlProps {
    commands: Map<string, (() => void)>
}

interface TypeControlState {
    input: string
}

class TypeControl extends Component<TypeControlProps, TypeControlState> {

    constructor(props: TypeControlProps) {
        super(props);

        this.state = {
            input: ""
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
                    console.log("Running the action");

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

        this.setState(
            {
                input: this.state.input + event.key
            }
        )
    }

    render() {

        const hits = new Array<string>();

        if (this.state.input.length > 0) {
            this.props.commands.forEach((fn, command) => {

                if (command.toLowerCase().startsWith(this.state.input.toLowerCase())) {
                    hits.push(command);
                }
            });
        }

        let className = "Input"

        if (this.state.input.length > 0 && hits.length === 0) {
            className = "InputWithNoMatches"
        }

        return (
            <div className="TypeControl">

                <div className={className}>{this.state.input}</div>

                {hits.map(
                    (hit, index) => {
                        return <div key={index} className="Alternative">
                            <span className="MatchingPart">{hit.substring(0, this.state.input.length)}</span>
                            <span className="RemainingPart">{hit.substring(this.state.input.length, hit.length)}</span>
                        </div>;
                    }
                )
                }

            </div>
        );
    }
}

export default TypeControl;