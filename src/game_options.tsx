import React, { Component } from 'react';
import Checkbox from './checkbox';
import Row from './row'
import Button from './button'
import SelectableButtonRow from './selectable_button_row'

import './game_options.css';

interface GameOptionsProps {}
interface GameOptionsState {}

const OPTIONS = new Map();

OPTIONS.set("LOW", "Sparse");
OPTIONS.set("MEDIUM", "Medium");
OPTIONS.set("HIGH", "Plenty");


class GameOptions extends Component<GameOptionsProps, GameOptionsState> {

    allowOthersToJoin(allow: boolean) {

        if (allow) {
            console.log("Ok, others can join");
        } else {
            console.log("Others cannot join");
        }
    }

    setAvailableResources(level: "LOW" | "MEDIUM" | "HIGH"): void {
        console.log("Play with resources set to " + level);
    }
    
    render() {

       
        return (
            <div className="GameOptionsContainer">
                <div>Allow others to join?<Checkbox onCheckboxChange={this.allowOthersToJoin}/></div>
                <div>

                    <div className="ResourceLable">Amount of initial resources</div>
                    <SelectableButtonRow
                        values={OPTIONS} initialValue="MEDIUM"
                        onSelected={
                            (value: string) => {
                                if (value === "Sparse") {
                                    this.setAvailableResources("LOW");
                                } else if (value === "Medium") {
                                    this.setAvailableResources("MEDIUM");
                                } else {
                                    this.setAvailableResources("HIGH");
                                }
                            }
                        }
                    />
                </div>
            </div>
        );
    }
}

export default GameOptions;
