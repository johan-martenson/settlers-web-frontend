import React, { ChangeEvent, Component } from 'react';
import './game_options.css';
import { Switch, Select, SelectOnChangeData, Subtitle1, Field, SwitchOnChangeData } from "@fluentui/react-components";

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
            <div className="settings">
                <Subtitle1 as="h4" block>Settings</Subtitle1>
                <Field label="Allow others to join?">
                    <Switch
                        defaultChecked={true}
                        onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.setOthersCanJoin(data.checked)}
                    />
                </Field>

                <Field label="Initial resources">
                    <Select
                        className="ResourceButtons"
                        onChange={
                            (ev: ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
                                const value = data.value

                                console.log(data)

                                // FIXME: change SelectableButtonRow to be parameterized so the callback can be more specific in types
                                if (value === "Low") {
                                    this.setAvailableResources("LOW");
                                } else if (value === "Medium") {
                                    this.setAvailableResources("MEDIUM");
                                } else {
                                    this.setAvailableResources("HIGH");
                                }
                            }
                        }
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </Select>

                </Field>
            </div>
        );
    }
}

export default GameOptions;
