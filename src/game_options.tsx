import React, { Component } from 'react';
import './game_options.css';
import OnOffSlider from './on_off_slider';
import RawRow from './raw_row';
import SelectableButtonRow from './selectable_button_row';
import { ResourceLevel } from './api';

interface GameOptionsProps {
    setAvailableResources: ((level: ResourceLevel) => void)
    setOthersCanJoin: ((otherCanJoin: boolean) => void)
}
interface GameOptionsState { }

const OPTIONS = new Map<ResourceLevel, string>();

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

        this.props.setOthersCanJoin(allow);
    }

    setAvailableResources(level: "LOW" | "MEDIUM" | "HIGH"): void {
        console.log("Play with resources set to " + level);

        this.props.setAvailableResources(level);
    }

    render(): JSX.Element {

        return (
            <div className="GameOptionsContainer">
                Set game options
                <RawRow>
                    <div className="Label">Allow others to join?</div>
                    <OnOffSlider className="OthersCanJoinSlider" initialValue={true} onValueChange={(value) => console.log(value)} />
                </RawRow>

                <RawRow>
                    <div className="ResourceLabel">Amount of initial resources</div>
                    <SelectableButtonRow
                        className="ResourceButtons"
                        values={OPTIONS} initialValue="MEDIUM"
                        onSelected={
                            (value: string) => {

                                // FIXME: change SelectableButtonRow to be parameterized so the callback can be more specific in types
                                if (value === "LOW") {
                                    this.setAvailableResources("LOW");
                                } else if (value === "MEDIUM") {
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
