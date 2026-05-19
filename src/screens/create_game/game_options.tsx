import React from 'react'
import {
    Switch,
    Select,
    Field,
    SwitchOnChangeData,
    SelectOnChangeData
} from '@fluentui/react-components'

import './game_options.css'
import { ResourceLevel } from '../../api/types'

// Types
type GameOptionsProps = {
    initialResources: ResourceLevel
    othersCanJoin: boolean
    cheatingEnabled: boolean

    onResourcesChange: (level: ResourceLevel) => void
    onOthersCanJoinChange: (allowed: boolean) => void
    onCheatingEnabledChange: (enabled: boolean) => void
}

// Constants
const RESOURCE_LABELS: Record<ResourceLevel, string> = {
    LOW: 'Sparse',
    MEDIUM: 'Medium',
    HIGH: 'Plenty'
}

// React component
function GameOptions({
    initialResources,
    othersCanJoin,
    cheatingEnabled,
    onResourcesChange,
    onOthersCanJoinChange,
    onCheatingEnabledChange
}: GameOptionsProps) {
    return (
        <div className='settings'>
            <Field label='Allow others to join'>
                <Switch
                    checked={othersCanJoin}
                    onChange={(_, data: SwitchOnChangeData) => {
                        onOthersCanJoinChange(data.checked)
                    }}
                />
            </Field>

            <Field label='Initial resources'>
                <Select
                    className='resource-buttons'
                    value={initialResources}
                    onChange={(_, data: SelectOnChangeData) => {
                        onResourcesChange(data.value as ResourceLevel)
                    }}
                >
                    <option value='LOW'>
                        {RESOURCE_LABELS.LOW}
                    </option>
                    <option value='MEDIUM'>
                        {RESOURCE_LABELS.MEDIUM}
                    </option>
                    <option value='HIGH'>
                        {RESOURCE_LABELS.HIGH}
                    </option>
                </Select>
            </Field>

            <Field label='Enable cheating'>
                <Switch
                    checked={cheatingEnabled}
                    onChange={(_, data: SwitchOnChangeData) => {
                        onCheatingEnabledChange(data.checked)
                    }}
                />
            </Field>
        </div>
    )
}

export default GameOptions