import React, { useEffect, useState } from 'react'
import { Window } from '../../components/dialog';
import { ItemContainer } from '../../components/item_container';
import { Tool, TOOLS } from '../../api/types';
import { api } from '../../api/ws-api';
import { UiIcon, UiIconType } from '../../icons/icon';
import { materialPretty } from '../../pretty_strings';
import './tools.css'

// Types
type ToolsProps = {
    onClose: () => void
    onRaise: () => void
}

// Constants
const TOOLS_UI: { [key in Tool]?: { PLUS: UiIconType, MINUS: UiIconType } } = {
    'SAW': { 'PLUS': 'SAW_AND_PLUS', 'MINUS': 'SAW_AND_MINUS' },
    'AXE': { 'PLUS': 'AXE_AND_PLUS', 'MINUS': 'AXE_AND_MINUS' },
    'SHOVEL': { 'PLUS': 'SHOVEL_AND_PLUS', 'MINUS': 'SHOVEL_AND_MINUS' },
    'PICK_AXE': { 'PLUS': 'PICK_AXE_AND_PLUS', 'MINUS': 'PICK_AXE_AND_MINUS' },
    'BOW': { 'PLUS': 'BOW_AND_PLUS', 'MINUS': 'BOW_AND_MINUS' },
    'CLEAVER': { 'PLUS': 'CLEAVER_AND_PLUS', 'MINUS': 'CLEAVER_AND_MINUS' },
    'ROLLING_PIN': { 'PLUS': 'ROLLING_PIN_AND_PLUS', 'MINUS': 'ROLLING_PIN_AND_MINUS' },
    'CRUCIBLE': { 'PLUS': 'CRUCIBLE_AND_PLUS', 'MINUS': 'CRUCIBLE_AND_MINUS' },
    'TONGS': { 'PLUS': 'TONGS_AND_PLUS', 'MINUS': 'TONGS_AND_MINUS' },
    'SCYTHE': { 'PLUS': 'SCYTHE_AND_PLUS', 'MINUS': 'SCYTHE_AND_MINUS' },
    'FISHING_ROD': { 'PLUS': 'LINE_AND_HOOK_AND_PLUS', 'MINUS': 'LINE_AND_HOOK_AND_MINUS' }
}

// Configuration

// State

// React components
const Tools = ({ onClose, onRaise }: ToolsProps) => {
    const [toolPrio, setToolPrio] = useState<{ [key in Tool]: number }>()
    const [hover, setHover] = useState<string>()

    useEffect(() => {
        function toolPrioUpdated(toolPrios: { [key in Tool]: number }) {
            setToolPrio(toolPrios)
        }

        (async () => {
            const toolPrio = await api.getToolPriorities()
            setToolPrio(toolPrio)
            api.addToolPrioListener(toolPrioUpdated)

            return () => api.removeToolPrioListener(toolPrioUpdated)
        })()
    }, [])

    return (
        <Window onClose={onClose} onRaise={onRaise} heading='Tools' hoverInfo={hover}>
            Set priority for production of tools.

            <ItemContainer width='15em' center>
                {Array.from(TOOLS).map(tool => (
                    <div
                        key={tool}
                        className='tool-priority'
                    >
                        {TOOLS_UI[tool] !== undefined &&
                            <UiIcon
                                type={TOOLS_UI[tool]['MINUS']}
                                scale={0.5}
                                onMouseEnter={() => setHover(`Produce less ${materialPretty(tool).toLowerCase()}`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => {
                                    if (toolPrio !== undefined && toolPrio[tool] > 0) {
                                        api.setToolPriority(tool, toolPrio[tool] - 1)
                                    }
                                }}
                            />
                        }
                        <meter
                            min={0}
                            max={10}
                            value={toolPrio !== undefined ? toolPrio[tool] : 0}
                            onMouseEnter={() => setHover(`${toolPrio !== undefined ? toolPrio[tool] : 0} / 10`)}
                            onMouseLeave={() => setHover(undefined)}
                        />
                        {TOOLS_UI[tool] !== undefined &&
                            <UiIcon
                                type={TOOLS_UI[tool]['PLUS']}
                                scale={0.5}
                                onMouseEnter={() => setHover(`Produce more ${materialPretty(tool).toLowerCase()}`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => {
                                    if (toolPrio !== undefined && toolPrio[tool] < 10) {
                                        api.setToolPriority(tool, toolPrio[tool] + 1)
                                    }
                                }}
                            />
                        }
                    </div>
                ))}
            </ItemContainer>
        </Window>
    )
}

export default Tools;