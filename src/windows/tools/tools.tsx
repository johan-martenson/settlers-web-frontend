import React, { useEffect, useMemo, useRef, useState } from 'react'
import { WindowWithTyping } from '../../components/dialog'
import { ItemContainer } from '../../components/item_container'
import { Tool, TOOLS } from '../../api/types'
import { api } from '../../api/ws-api'
import './tools.css'
import { useToolPriorities } from '../../utils/hooks/hooks'
import { clamp } from '../house/headquarter'
import { GenericCommand } from '../../utils/typing-commands'
import { UiIcon, UiIconType } from '../../components/icons/icon'
import { materialPretty } from '../../utils/pretty_strings'

// Types
type ToolsProps = {
    onClose: () => void
    onRaise: () => void
}

// Constants
const TOOLS_UI: Record<Tool, { PLUS: UiIconType, MINUS: UiIconType }> = {
    'SAW': { 'PLUS': 'SAW_AND_PLUS', 'MINUS': 'SAW_AND_MINUS' },
    'HAMMER': { 'PLUS': 'HAMMER_AND_PLUS', 'MINUS': 'HAMMER_AND_MINUS' },
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

    // State
    const [hover, setHover] = useState<string | undefined>()

    // Monitoring hooks
    const toolPriorities = useToolPriorities()

    // References
    const toolPrioritiesRef = useRef(toolPriorities)

    // Effects
    // Effect: keep tool priorities ref in sync with tool priorities
    useEffect(() => {
        toolPrioritiesRef.current = toolPriorities
    }, [toolPriorities])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<object>>()

        TOOLS.forEach(tool => {
            cmds.set(`Less ${materialPretty(tool)}`,
                {
                    action: () => {
                        if (toolPrioritiesRef.current !== undefined) {
                            api.setToolPriority(tool, clamp(toolPrioritiesRef.current[tool] - 1, 0, 10))
                        }
                    }
                })

            cmds.set(`More ${materialPretty(tool)}`,
                {
                    action: () => {
                        if (toolPrioritiesRef.current !== undefined) {
                            api.setToolPriority(tool, clamp(toolPrioritiesRef.current[tool] + 1, 0, 10))
                        }
                    }
                })
        })

        cmds.set('Close window',
            {
                action: onClose
            }
        )

        return cmds
    }, [onClose, toolPrioritiesRef])

    // Rendering
    return (
        <WindowWithTyping<object>
            commands={commands}
            param={{}}
            onClose={onClose}
            onRaise={onRaise}
            heading='Tools'
            hoverInfo={hover}
        >
            Set priority for production of tools.

            <ItemContainer width='15em' center>
                {[...TOOLS].map(tool => (
                    <div
                        key={tool}
                        className='tool-priority'
                    >
                        <UiIcon
                            type={TOOLS_UI[tool]['MINUS']}
                            scale={0.5}
                            onMouseEnter={() => setHover(`Produce less ${materialPretty(tool).toLowerCase()}`)}
                            onMouseLeave={() => setHover(undefined)}
                            onClick={() => {
                                if (toolPriorities !== undefined && toolPriorities[tool] > 0) {
                                    api.setToolPriority(tool, toolPriorities[tool] - 1)
                                }
                            }}
                        />

                        <meter
                            min={0}
                            max={10}
                            value={toolPriorities !== undefined ? toolPriorities[tool] : 0}
                            onMouseEnter={() => setHover(`${toolPriorities !== undefined ? toolPriorities[tool] : 0} / 10`)}
                            onMouseLeave={() => setHover(undefined)}
                        />

                        <UiIcon
                            type={TOOLS_UI[tool]['PLUS']}
                            scale={0.5}
                            onMouseEnter={() => setHover(`Produce more ${materialPretty(tool).toLowerCase()}`)}
                            onMouseLeave={() => setHover(undefined)}
                            onClick={() => {
                                if (toolPriorities !== undefined && toolPriorities[tool] < 10) {
                                    api.setToolPriority(tool, toolPriorities[tool] + 1)
                                }
                            }}
                        />
                    </div>
                ))}
            </ItemContainer>
        </WindowWithTyping>
    )
}

export default Tools