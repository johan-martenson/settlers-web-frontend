import { useEffect, useMemo, useRef, useState } from 'react'
import { WindowWithTyping } from '../../components/dialog'
import { ItemContainer } from '../../components/item_container'
import { TOOLS } from '../../api/types'
import { api } from '../../api/ws-api'
import './tools.css'
import { useToolPriorities } from '../../utils/hooks/hooks'
import { clamp } from '../house/headquarter'
import { GenericCommand } from '../../utils/typing-commands'
import { UiIcon } from '../../components/icons/icon'
import { materialPretty } from '../../utils/pretty-strings'
import { Dismiss16Filled } from '@fluentui/react-icons'
import { TOOLS_UI } from './constants'
import { makeToolCommands } from './commands'

// Types
type ToolsProps = {
    onClose: () => void
    onRaise: () => void
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
        const contextFreeToolCommands = makeToolCommands()
        const cmds = new Map<string, GenericCommand<object>>(contextFreeToolCommands)

        TOOLS.forEach(tool => {
            const name = materialPretty(tool)

            cmds.set(`Less ${name}`, {
                action: () => {
                    if (toolPrioritiesRef.current !== undefined) {
                        api.setToolPriority(
                            tool,
                            clamp(toolPrioritiesRef.current[tool] - 1, 0, 10)
                        )
                    }
                }
            })

            cmds.set(`More ${name}`, {
                action: () => {
                    if (toolPrioritiesRef.current !== undefined) {
                        api.setToolPriority(
                            tool,
                            clamp(toolPrioritiesRef.current[tool] + 1, 0, 10)
                        )
                    }
                }
            })
        })

        cmds.set('Max all priorities', {
            action: () => {
                TOOLS.forEach(tool => api.setToolPriority(tool, 10))
            }
        })

        cmds.set('Clear all priorities', {
            action: () => {
                TOOLS.forEach(tool => api.setToolPriority(tool, 0))
            }
        })

        cmds.set('Close window', {
            action: onClose,
            icon: <Dismiss16Filled />
        })

        cmds.set('Debug', {
            action: () => console.log(toolPrioritiesRef.current),
            hidden: true
        })

        cmds.set('Copy priorities JSON', {
            action: async () => {
                await navigator.clipboard.writeText(
                    JSON.stringify(toolPrioritiesRef.current, null, 2)
                )
            },
            hidden: true
        })

        return cmds
    }, [onClose])

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