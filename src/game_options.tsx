import React, { ChangeEvent } from 'react'
import './game_options.css'
import { Switch, Select, SelectOnChangeData, Subtitle1, Field, SwitchOnChangeData } from "@fluentui/react-components"
import { ResourceLevel } from './api/types'

// Types
type GameOptionsProps = {
    initialResources: ResourceLevel
    othersCanJoin: boolean

    setAvailableResources: ((level: ResourceLevel) => void)
    setOthersCanJoin: ((otherCanJoin: boolean) => void)
}

// Constants
const OPTIONS = new Map<ResourceLevel, string>()

OPTIONS.set("LOW", "Sparse")
OPTIONS.set("MEDIUM", "Medium")
OPTIONS.set("HIGH", "Plenty")

// React components
const GameOptions = ({ othersCanJoin, setAvailableResources, setOthersCanJoin, ...props }: GameOptionsProps) => {
    let initialResources = 'High'

    if (props.initialResources === 'MEDIUM') {
        initialResources = 'Medium'
    } else if (props.initialResources === 'LOW') {
        initialResources = 'Low'
    }

    return (
        <div className="settings">

            <Subtitle1 as="h4" block>Settings</Subtitle1>

            <Field label="Allow others to join?">
                <Switch
                    checked={othersCanJoin}
                    onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => setOthersCanJoin(data.checked)}
                />
            </Field>

            <Field label="Initial resources">
                <Select
                    className="ResourceButtons"
                    value={initialResources}
                    onChange={
                        (_event: ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
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
