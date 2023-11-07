import React, { ChangeEvent } from 'react'
import './game_options.css'
import { Switch, Select, SelectOnChangeData, Subtitle1, Field, SwitchOnChangeData } from "@fluentui/react-components"
import { ResourceLevel } from './api/types'

interface GameOptionsProps {
    setAvailableResources: ((level: ResourceLevel) => void)
    setOthersCanJoin: ((otherCanJoin: boolean) => void)
}

const OPTIONS = new Map<ResourceLevel, string>()

OPTIONS.set("LOW", "Sparse")
OPTIONS.set("MEDIUM", "Medium")
OPTIONS.set("HIGH", "Plenty")

const GameOptions = ({ setAvailableResources, setOthersCanJoin }: GameOptionsProps) => {

    return (
        <div className="settings">

            <Subtitle1 as="h4" block>Settings</Subtitle1>

            <Field label="Allow others to join?">
                <Switch
                    defaultChecked={true}
                    onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => setOthersCanJoin(data.checked)}
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
                                setAvailableResources("LOW")
                            } else if (value === "Medium") {
                                setAvailableResources("MEDIUM")
                            } else {
                                setAvailableResources("HIGH")
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
    )
}

export default GameOptions
