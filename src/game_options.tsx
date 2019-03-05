import React, { Component } from 'react';
import './game_options.css';
import OnOffSlider from './on_off_slider';
import RawRow from './raw_row';
import SelectableButtonRow from './selectable_button_row';

interface GameOptionsProps { }
interface GameOptionsState { }

const OPTIONS = new Map();

OPTIONS.set("LOW", "Sparse");
OPTIONS.set("MEDIUM", "Medium");
OPTIONS.set("HIGH", "Plenty");

class GameOptions extends Component<GameOptionsProps, GameOptionsState> {

    allowOthersToJoin(allow: boolean): void {

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
                <RawRow>
                    <div className="Label">Allow others to join?</div>
                    <OnOffSlider className="OthersCanJoinSlider" initialValue={true} onValueChange={(value) => console.log(value)} />
                </RawRow>

                <RawRow>
                    <div className="ResourceLable">Amount of initial resources</div>
                    <SelectableButtonRow
                        className="ResourceButtons"
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
                </RawRow>
            </div>
        );
    }
}

export default GameOptions;
