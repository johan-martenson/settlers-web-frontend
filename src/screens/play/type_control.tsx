import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import { PointInformation, Point } from '../../api/types'
import { api } from '../../api/ws-api'
import { ItemContainer } from '../../components/item_container'
import { useNonTriggeringState } from '../../utils/hooks/non_triggering'
import { useTrackedRef } from '../../utils/hooks/reference'

// Types
export type Command = {
    action: (point: Point) => void
    filter?: (selectedPointInformation: PointInformation) => boolean | undefined
    icon?: React.ReactNode
}

type TypeControlProps = {
    commands: Map<string, Command>
    selectedPoint: Point
}

type TypeControlKey = {
    key: string
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
}

// Constants
const inputListeners: Set<(key: TypeControlKey) => void> = new Set()

// Functions
function addInputListener(listener: (key: TypeControlKey) => void) {
    inputListeners.add(listener)
}

function removeInputListener(listener: (key: TypeControlKey) => void) {
    inputListeners.delete(listener)
}

function dispatchInputKey(key: TypeControlKey) {
    console.log(`Dispatching input key: ${key.key}`)

    inputListeners.forEach(listener => listener(key))
}

function findMatchingCommands(commands: Map<string, Command>, input: string, selectedPointInformation?: PointInformation) {
    const inputToMatch = input.toLowerCase()
    const invalidSelectedPointInformation = selectedPointInformation === undefined || !('canBuild' in selectedPointInformation)

    return Array.from(commands.entries())
        .filter(
            ([, command]) =>
                !command.filter ||
                invalidSelectedPointInformation ||
                command.filter(selectedPointInformation)
        )
        .filter(
            ([commandName]) =>
                commandName.toLowerCase().startsWith(inputToMatch)
        )
}

// React components
const TypeControl = ({ commands, selectedPoint }: TypeControlProps) => {

    // References
    const commandsRef = useTrackedRef(commands)
    const selectedPointRef = useRef(selectedPoint)

    // State
    const [input, setInput] = useState<string>('')
    const [expanded, setExpanded] = useState<boolean>(true)
    const [selectedPointInformation, setSelectedPointInformation] = useState<PointInformation>()

    // State that doesn't trigger re-renders
    const nonTriggeringInput = useNonTriggeringState<{ input: string }>({ input: '' })

    // Functions
    function runCommand(commandName: string) {
        console.log(`Running command: ${commandName} at point ${selectedPointRef.current.x},${selectedPointRef.current.y}`)

        commandsRef.current.get(commandName)?.action(selectedPointRef.current)
    }

    async function updateSelectedPointInformation() {
        try {
            const updatedPointInformation = await api.getInformationOnPoint(selectedPointRef.current)

            setSelectedPointInformation(updatedPointInformation)
        } catch (error) {
            console.error(`Error while getting info on selectiong point: ${selectedPointRef.current}, ${error}`)
        }
    }

    // Listeners
    const inputListener = useCallback((key: TypeControlKey) => {
        console.log(`Key pressed: ${key.key}. Current input: ${input}`)

        if (key.key === 'Escape') {
            setInput('')
        } else if (key.key === 'Enter') {
            const matchingCommands = findMatchingCommands(commandsRef.current, nonTriggeringInput.input, selectedPointInformation)

            if (matchingCommands.length > 0) {
                runCommand(matchingCommands[0][0])
            } else {
                console.log(`Can't find command matching: ${nonTriggeringInput.input}`)
            }

            setInput('')
        } else if (key.key === 'Backspace') {
            console.log('Is backspace')

            setInput(prevInput => prevInput.slice(0, -1))
        } else if (key.key.length === 1 && key.key !== ' ') {
            setInput(prevInput => prevInput + key.key)
        }
    }, [selectedPoint, input, runCommand])

    // Effects
    // Effect: keep selected point ref in sync
    useEffect(() => {
        selectedPointRef.current = selectedPoint;

        updateSelectedPointInformation()
    }, [selectedPoint])

    // Effect: keep non-triggering input state in sync
    useEffect(() => {
        nonTriggeringInput.input = input
    }, [input])

    // Effect: listen to input keys
    useEffect(() => {
        addInputListener(inputListener)

        return () => removeInputListener(inputListener)
    }, [])

    // Rendering
    const inputToMatch = input.toLowerCase()
    const matches = findMatchingCommands(commands, input, selectedPointInformation)

    let className = 'no-input'
    if (input.length > 0) {
        className = matches.length > 0 ? 'input-with-matches' : 'input-with-no-matches'
    }

    className += expanded ? ' expanded' : ' closed'

    return (
        <div className='type-control' onWheel={(event) => event.stopPropagation()}>

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} />
            <div className={className}>{input}</div>

            {(expanded || matches.length > 0) &&
                <div className='container-alternatives'>
                    <ItemContainer style={{ alignItems: 'stretch' }}>
                        {matches.map(([commandName, command], index) => (
                            <div
                                key={index}
                                className='alternative'
                                onClick={() => {
                                    runCommand(commandName)
                                    setInput('')
                                }}
                            >

                                {inputToMatch.length > 0 && commandName.toLowerCase().startsWith(inputToMatch) ?
                                    <>
                                        <span>
                                            <span className='MatchingPart'>{commandName.substring(0, input.length)}</span>
                                            <span className='RemainingPart'>{commandName.substring(input.length, commandName.length)}</span>
                                        </span>
                                        {command.icon}
                                    </>
                                    :
                                    <>{commandName} {command.icon}</>
                                }
                            </div>
                        ))}
                    </ItemContainer>
                </div>}

        </div>
    )
}

export {
    TypeControl,
    dispatchInputKey
}