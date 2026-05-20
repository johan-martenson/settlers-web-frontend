import React, { useEffect, useMemo, useRef, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import { Point, PointInformationWithoutPossibleRoadConnections } from '../../api/types'

import {
    CommandMatch,
    DialogTyping,
    executeCommand,
    findMatchingCommands,
    GenericCommand
} from '../../utils/typing_command_utils'
import { usePointInformation } from '../../utils/hooks/hooks'

// Types
type TypeControlProps = {
    commands: Map<string, GenericCommand<PointInformationWithoutPossibleRoadConnections>>
    selectedPoint: Point
}

// Log configuration
export const TypeControlLogConfig = {
    lifecycle: false,
    input: false,
    commands: false,
    selection: false,
}

// React components
const TypeControl = ({ commands, selectedPoint }: TypeControlProps) => {

    // State
    const [input, setInput] = useState<string>('')
    const [expanded, setExpanded] = useState<boolean>(false)

    // Monitoring hooks
    const selectedPointInformation = usePointInformation(selectedPoint)

    // References
    const commandsRef = useRef(commands)
    const inputRef = useRef(input)
    const selectedPointInformationRef = useRef(selectedPointInformation)


    // Effects
    // Effect: keep the input reference in sync
    useEffect(() => {
        inputRef.current = input
    }, [input])

    // Effect: keep the selected point information ref in sync
    useEffect(() => {
        selectedPointInformationRef.current = selectedPointInformation
    }, [selectedPointInformation])

    // Effect: keep the commands ref in sync
    useEffect(() => {
        commandsRef.current = commands
    }, [commands])

    // Effect: listen to keyboard input
    useEffect(() => {
        if (TypeControlLogConfig.lifecycle) {
            console.log('Type control (lifecycle): mounting')
        }

        const listener = (event: KeyboardEvent) => {
            if (event.ctrlKey ||
                event.metaKey ||
                event.altKey) {
                return
            }

            if (TypeControlLogConfig.input) {
                console.log(`Type control (input): key '${event.key}' pressed, current input '${inputRef.current}'`)
            }

            if (event.key === 'Escape') {
                if (TypeControlLogConfig.input) {
                    console.log('Type control (input): clearing input via Escape')
                }

                setInput('')
            } else if (event.key === 'Enter') {
                const matches = findMatchingCommands(
                    commandsRef.current,
                    inputRef.current,
                    selectedPointInformationRef.current
                )

                if (matches.length > 0) {
                    if (TypeControlLogConfig.commands) {
                        console.log(`Type control (commands): matched '${matches[0].commandName}'`)
                    }

                    executeCommand(matches[0], selectedPointInformationRef.current)
                } else {
                    if (TypeControlLogConfig.commands) {
                        console.log(`Type control (commands): no match for '${input}'`)
                    }
                }

                setInput('')
            } else if (event.key === 'Backspace') {
                if (TypeControlLogConfig.input) {
                    console.log('Type control (input): backspace')
                }

                setInput(prevInput => prevInput.slice(0, -1))
            } else if (event.key.length === 1) {
                setInput(prevInput => prevInput + event.key)
            }
        }

        window.addEventListener('keydown', listener)

        return () => {
            if (TypeControlLogConfig.lifecycle) {
                console.log('Type control (lifecycle): unmounting')
            }

            window.removeEventListener('keydown', listener)
        }
    }, [])

    // Memos
    const { available, matches, visibleMatches } = useMemo(() => {
        const available = new Map<string, GenericCommand<PointInformationWithoutPossibleRoadConnections>>()

        for (const [name, command] of commands) {
            if (command.filter === undefined || command.filter(selectedPointInformation)) {
                available.set(name, command)
            }
        }

        const matches = findMatchingCommands(
            available,
            input,
            selectedPointInformation
        )

        return {
            available,
            matches,
            visibleMatches: matches.filter((commandMatch: CommandMatch<PointInformationWithoutPossibleRoadConnections>) => !commandMatch.command.hidden)
        }
    }, [commands, selectedPointInformation, input])

    // Rendering
    let className = 'no-input'

    if (input.length > 0) {
        className = matches.length > 0
            ? 'input-with-matches'
            : 'input-with-no-matches'
    }

    className += expanded
        ? ' typing-expanded'
        : ' typing-closed'

    return (
        <div
            className='type-control'
            onWheel={event => event.stopPropagation()}
        >

            <ExpandCollapseToggle
                onExpand={() => {
                    if (TypeControlLogConfig.lifecycle) {
                        console.log('Type control (lifecycle): expanded')
                    }

                    setExpanded(true)
                }}

                onCollapse={() => {
                    if (TypeControlLogConfig.lifecycle) {
                        console.log('Type control (lifecycle): collapsed')
                    }

                    setExpanded(false)
                }}
            />

            <div className={className}>
                {input}
            </div>

            {(expanded || input.length > 0) &&
                <DialogTyping available={available} inputValue={input} matches={visibleMatches} />
            }

        </div>
    )
}

export {
    TypeControl
}
