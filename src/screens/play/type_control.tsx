import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import { PointInformation, Point } from '../../api/types'
import { api } from '../../api/ws-api'
import { ItemContainer } from '../../components/item_container'
import { useNonTriggeringState } from '../../utils/hooks/non_triggering'
import { useTrackedRef } from '../../utils/hooks/reference'
import { prettyPrintFuzzyMatch } from '../../pretty_strings'

// Types
export type Command = {
    action: (point: Point) => void
    filter?: (selectedPointInformation: PointInformation) => boolean | undefined
    hidden?: boolean
    icon?: React.ReactNode
}

type FuzzyMatchResult = {
    matched: boolean
    score: number
    matchIndexes: number[]
}

type TypeControlProps = {
    commands: Map<string, Command>
    selectedPoint: Point
    typingSource: TypingSource
}

type TypeControlKey = {
    key: string
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
}

type TypingSource = string

// Log configuration
export const TypeControlLogConfig = {
    lifecycle: false,
    input: false,
    commands: false,
    selection: false,
}

// Constants
const inputListeners: Map<TypingSource, Set<(key: TypeControlKey) => void>> = new Map()

// Functions
function addInputListener(listener: (key: TypeControlKey) => void, typingSource: TypingSource) {
    if (TypeControlLogConfig.lifecycle) {
        console.log('Type control (lifecycle): added input listener')
    }

    if (!inputListeners.has(typingSource)) {
        inputListeners.set(typingSource, new Set())
    }

    inputListeners.get(typingSource)?.add(listener)
}

function removeInputListener(listener: (key: TypeControlKey) => void, typingSource: TypingSource) {
    if (TypeControlLogConfig.lifecycle) {
        console.log('Type control (lifecycle): removed input listener')
    }

    const listeners = inputListeners.get(typingSource)

    if (!listeners) {
        return
    }

    listeners.delete(listener)

    if (listeners.size === 0) {
        inputListeners.delete(typingSource)
    }
}

function dispatchInputKey(key: TypeControlKey, typingSource: TypingSource) {
    if (TypeControlLogConfig.input) {
        console.log(`Type control (input): dispatching key '${key.key}'`)
    }

    inputListeners.get(typingSource)?.forEach(listener => listener(key))
}

function isFuzzyMatch(input: string, command: string): FuzzyMatchResult {
    const pattern = input.toLowerCase().replace(/\s+/g, '')
    const text = command

    let score = 0
    let patternIndex = 0
    let lastMatchIndex = -1

    const matchIndexes: number[] = []

    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
        const char = text[i]
        const lowerChar = char.toLowerCase()

        if (lowerChar === pattern[patternIndex]) {
            matchIndexes.push(i)

            // Base match score
            score += 10

            // Bonus: match at very start
            if (i === 0) {
                score += 20
            }

            // Bonus: word start after separator
            const prevChar = text[i - 1]
            if (i > 0 && (prevChar === " " || prevChar === "-" || prevChar === "_")) {
                score += 12
            }

            // Bonus: camelCase word start (uppercase letter)
            if (i > 0 && char >= "A" && char <= "Z") {
                score += 12
            }

            // Bonus: consecutive match
            if (lastMatchIndex === i - 1) {
                score += 15
            }

            // Penalty: gaps between matches
            if (lastMatchIndex !== -1) {
                score -= (i - lastMatchIndex - 1)
            }

            lastMatchIndex = i
            patternIndex++
        }
    }

    return {
        matched: patternIndex === pattern.length,
        score,
        matchIndexes
    }
}

function findMatchingCommands(
    commands: Map<string, Command>,
    input: string,
    selectedPointInformation?: PointInformation
): Map<string, { command: Command, fuzzyMatch: FuzzyMatchResult }> {
    const inputToMatch = input.toLowerCase()
    const invalidSelectedPointInformation = selectedPointInformation === undefined || !('canBuild' in selectedPointInformation)

    return new Map(Array.from(commands.entries()
        .filter(
            ([, command]) =>
                !command.filter ||
                invalidSelectedPointInformation ||
                command.filter(selectedPointInformation)
        )
        .map(([name, command]) => {
            const result = isFuzzyMatch(inputToMatch, name)

            return {
                name,
                command,
                fuzzyMatch: result
            }
        })
        .filter(result => result.fuzzyMatch.matched))
        .sort((a, b) => b.fuzzyMatch.score - a.fuzzyMatch.score)
        .map(result => [result.name, { command: result.command, fuzzyMatch: result.fuzzyMatch }] as const))
}

function findMatchingCommandsGeneric<T>(
    commands: Map<string, GenericCommand<T>>,
    input: string,
    param: T | undefined
): Map<string, { command: GenericCommand<T>, fuzzyMatch: FuzzyMatchResult }> {
    const inputToMatch = input.toLowerCase()

    if (TypeControlLogConfig.commands) {
        console.log(`Type control (find matching commands): finding matching commands for input "${input}" and param`, param)
    }

    const matches = [...commands]
        .filter(([, command]) => !command.filter || (param !== undefined && command.filter(param)))
        .map(([name, command]) => {
            const fuzzyMatch = isFuzzyMatch(inputToMatch, name)
            return { name, command, fuzzyMatch }
        })
        .filter(({ fuzzyMatch }) => fuzzyMatch.matched)
        .sort((a, b) => b.fuzzyMatch.score - a.fuzzyMatch.score)

    if (TypeControlLogConfig.commands) {
        console.log(`Type control (find matching commands): matches after filtering and sorting:`, matches)
    }

    return new Map(
        matches.map(({ name, command, fuzzyMatch }) => [
            name, { command, fuzzyMatch }
        ])
    )
}

// React components
const TypeControl = ({ commands, selectedPoint, typingSource }: TypeControlProps) => {

    // References
    const commandsRef = useTrackedRef(commands)
    const selectedPointRef = useRef(selectedPoint)

    // State
    const [input, setInput] = useState<string>('')
    const [expanded, setExpanded] = useState<boolean>(false)
    const [selectedPointInformation, setSelectedPointInformation] = useState<PointInformation>()

    // State that doesn't trigger re-renders
    const nonTriggeringInput = useNonTriggeringState<{ input: string }>({ input: '' })

    // Monitoring
    //const selectedPointInformation = usePointInformation(selectedPoint)

    // Functions
    function runCommand(commandName: string) {
        if (TypeControlLogConfig.commands) {
            console.log(`Type control (commands): running '${commandName}' at ${selectedPointRef.current.x},${selectedPointRef.current.y}`)
        }

        try {
            commandsRef.current.get(commandName)?.action(selectedPointRef.current)
        } catch (error) {
            console.error('Type control (errors): error occurred while running command', error)
        }
    }

    async function updateSelectedPointInformation(point: Point) {
        if (TypeControlLogConfig.selection) {
            console.log(`Type control (selection): updating info for point ${point.x},${point.y}`)
        }

        try {
            const updatedPointInformation = await api.getInformationOnPoint(point)

            setSelectedPointInformation(updatedPointInformation)
        } catch (error) {
            console.error('Type control (errors): error while getting selected point information', error)
        }
    }

    // Listeners
    const inputListener = useCallback((key: TypeControlKey) => {
        if (TypeControlLogConfig.input) {
            console.log(`Type control (input): key '${key.key}' pressed, current input '${input}'`)
        }

        if (key.key === 'Escape') {
            if (TypeControlLogConfig.input) {
                console.log('Type control (input): clearing input via Escape')
            }

            setInput('')
        } else if (key.key === 'Enter') {
            const matches = findMatchingCommands(commandsRef.current, nonTriggeringInput.input, selectedPointInformation)

            if (matches.size > 0) {
                if (TypeControlLogConfig.commands) {
                    console.log(`Type control (commands): matched '${Array.from(matches.keys())}'`)
                }

                runCommand(Array.from(matches.keys())[0])
            } else {
                if (TypeControlLogConfig.commands) {
                    console.log(`Type control (commands): no match for '${nonTriggeringInput.input}'`)
                }
            }

            setInput('')
        } else if (key.key === 'Backspace') {
            if (TypeControlLogConfig.input) {
                console.log('Type control (input): backspace')
            }

            setInput(prevInput => prevInput.slice(0, -1))
        } else if (key.key.length === 1 && key.key !== ' ') {
            setInput(prevInput => prevInput + key.key)
        }
    }, [input, selectedPointInformation])

    // Effects

    // Effect: keep selected point ref in sync
    useEffect(() => {
        if (TypeControlLogConfig.selection) {
            console.log(
                `Type control (selection): selected point changed to ${selectedPoint.x},${selectedPoint.y}`
            )
        }

        selectedPointRef.current = selectedPoint
        updateSelectedPointInformation(selectedPoint)
    }, [selectedPoint])

    // Effect: keep non-triggering input state in sync
    useEffect(() => {
        nonTriggeringInput.input = input

        if (TypeControlLogConfig.input) {
            console.log(`Type control (input): input updated to '${input}'`)
        }
    }, [input])

    // Effect: listen to input keys
    useEffect(() => {
        if (TypeControlLogConfig.lifecycle) {
            console.log('Type control (lifecycle): mounting')
        }

        addInputListener(inputListener, typingSource)

        return () => {
            if (TypeControlLogConfig.lifecycle) {
                console.log('Type control (lifecycle): unmounting')
            }

            removeInputListener(inputListener, typingSource)
        }
    }, [inputListener, typingSource])

    // Rendering
    const inputToMatch = input.toLowerCase()
    const matches = new Map<string, { command: Command, fuzzyMatch: FuzzyMatchResult }>()
    findMatchingCommands(commandsRef.current, input, selectedPointInformation).forEach((match, name) => matches.set(name.toLowerCase(), match))

    let className = 'no-input'
    if (input.length > 0) {
        className = matches.size > 0 ? 'input-with-matches' : 'input-with-no-matches'
    }

    className += expanded ? ' expanded' : ' closed'

    return (
        <div className='type-control' onWheel={(event) => event.stopPropagation()}>

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

            <div className={className}>{input}</div>

            {(expanded || (inputToMatch.length > 0 && matches.size > 0)) &&
                <div className='container-alternatives'>
                    <ItemContainer style={{ alignItems: 'stretch' }}>
                        {commandsRef.current && Array.from(commandsRef.current.entries())

                            // eslint-disable-next-line
                            .filter(([commandName, command]) => !command.hidden &&
                                (expanded || (inputToMatch.length > 0 && matches.has(commandName.toLowerCase()))))
                            .map(([commandName, command]) => (
                                <div
                                    key={commandName}
                                    className='alternative'
                                    onClick={() => {
                                        if (TypeControlLogConfig.commands) {
                                            console.log(
                                                `Type control (commands): clicked '${commandName}'`
                                            )
                                        }

                                        runCommand(commandName)
                                        setInput('')
                                    }}
                                >
                                    {inputToMatch.length > 0 && matches.has(commandName.toLowerCase())
                                        ? <>
                                            {prettyPrintFuzzyMatch(commandName, matches.get(commandName.toLowerCase())!.fuzzyMatch.matchIndexes)}
                                            {command.icon}
                                        </>
                                        : <> {commandName} {command.icon}</>
                                    }
                                </div>
                            ))}
                    </ItemContainer>
                </div>}

        </div>
    )
}

export type GenericCommand<T> = {
    action: (param: T) => void
    filter?: (param: T) => boolean | undefined
    hidden?: boolean
    icon?: React.ReactNode
}

type GenecricTypeControlProps<T> = {
    commands: Map<string, GenericCommand<T>>
    param: T
    typingSource: TypingSource
}

function GenericTypeControl<T>({ commands, param, typingSource }: GenecricTypeControlProps<T>) {

    // References
    const commandsRef = useTrackedRef(commands)
    const paramRef = useRef(param)

    // State
    const [input, setInput] = useState<string>('')
    const [expanded, setExpanded] = useState<boolean>(false)

    // State that doesn't trigger re-renders
    const nonTriggeringInput = useNonTriggeringState<{ input: string }>({ input: '' })

    // Functions
    function runCommand(commandName: string) {
        if (TypeControlLogConfig.commands) {
            console.log(`Type control (commands): running '${commandName}' at ${paramRef.current}`)
        }

        if (paramRef.current !== undefined) {
            try {
                commandsRef.current.get(commandName)?.action(paramRef.current)
            } catch (error) {
                console.error('Type control: error occurred while running command', error)
            }
        } else {
            console.error('Type control: parameter value is undefined, cannot run command')
        }
    }

    // Listeners
    const inputListener = useCallback((key: TypeControlKey) => {
        if (TypeControlLogConfig.input) {
            console.log(`Type control (input): key '${key.key}' pressed, current input '${input}'`)
        }

        if (key.key === 'Escape') {
            if (TypeControlLogConfig.input) {
                console.log('Type control (input): clearing input via Escape')
            }

            setInput('')
        } else if (key.key === 'Enter') {
            const matches = findMatchingCommandsGeneric(commandsRef.current, nonTriggeringInput.input, paramRef.current)

            if (matches.size > 0) {
                if (TypeControlLogConfig.commands) {
                    console.log(`Type control (commands): matched '${Array.from(matches.keys())[0]}'`)
                }

                runCommand(Array.from(matches.keys())[0])
            } else {
                if (TypeControlLogConfig.commands) {
                    console.log(`Type control (commands): no match for '${nonTriggeringInput.input}'`)
                }
            }

            setInput('')
        } else if (key.key === 'Backspace') {
            if (TypeControlLogConfig.input) {
                console.log('Type control (input): backspace')
            }

            setInput(prevInput => prevInput.slice(0, -1))
        } else if (key.key.length === 1 && key.key !== ' ') {
            setInput(prevInput => prevInput + key.key)
        }
    }, [input, paramRef, commandsRef])

    // Effects

    // Effect: keep selected point ref in sync
    useLayoutEffect(() => {
        if (TypeControlLogConfig.selection) {
            console.log(
                `Type control (selection): selected point changed to ${param}`
            )
        }

        paramRef.current = param
    }, [param])

    // Effect: keep non-triggering input state in sync
    useEffect(() => {
        nonTriggeringInput.input = input

        if (TypeControlLogConfig.input) {
            console.log(`Type control (input): input updated to '${input}'`)
        }
    }, [input])

    // Effect: listen to input keys
    useEffect(() => {
        if (TypeControlLogConfig.lifecycle) {
            console.log('Type control (lifecycle): mounting')
        }

        addInputListener(inputListener, typingSource)

        return () => {
            if (TypeControlLogConfig.lifecycle) {
                console.log('Type control (lifecycle): unmounting')
            }

            removeInputListener(inputListener, typingSource)
        }
    }, [inputListener, typingSource])

    // Rendering
    const inputToMatch = input.toLowerCase()
    const matches = new Map<string, { command: GenericCommand<T>, fuzzyMatch: FuzzyMatchResult }>()
    findMatchingCommandsGeneric(commandsRef.current, input, paramRef.current).forEach((match, name) => matches.set(name.toLowerCase(), match))

    let className = 'no-input'
    if (input.length > 0) {
        className = matches.size > 0 ? 'input-with-matches' : 'input-with-no-matches'
    }

    className += expanded ? ' expanded' : ' closed'

    return (
        <div className='type-control' onWheel={(event) => event.stopPropagation()}>

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

            <div className={className}>{input}</div>

            {(expanded || (inputToMatch.length > 0 && matches.size > 0)) &&
                <div className='container-alternatives'>
                    <ItemContainer style={{ alignItems: 'stretch' }}>
                        {commandsRef.current && Array.from(commandsRef.current.entries())
                            .filter(([commandName, command]) => !command.hidden &&
                                (expanded || (inputToMatch.length > 0 && matches.has(commandName.toLowerCase()))))
                            .map(([commandName, command]) => (
                                <div
                                    key={commandName}
                                    className='alternative'
                                    onClick={() => {
                                        if (TypeControlLogConfig.commands) {
                                            console.log(
                                                `Type control (commands): clicked '${commandName}'`
                                            )
                                        }

                                        runCommand(commandName)
                                        setInput('')
                                    }}
                                >
                                    {inputToMatch.length > 0 && matches.has(commandName.toLowerCase())
                                        ? <>
                                            {prettyPrintFuzzyMatch(commandName, matches.get(commandName.toLowerCase())!.fuzzyMatch.matchIndexes)}
                                            {command.icon}
                                        </>
                                        : <>{commandName} {command.icon}</>
                                    }
                                </div>
                            ))}
                    </ItemContainer>
                </div>}

        </div>
    )
}

function TypeMatch<T>({ commandName, fuzzyMatch, command, highlightOnHover = false, onClick }: TypeMatchProps<T>) {
    return (
        <div
            className={`type-match ${highlightOnHover ? 'highlight-on-hover' : ''}`}
            onClick={() => onClick && onClick(command)}
        >
            {prettyPrintFuzzyMatch(commandName, fuzzyMatch.matchIndexes)}
            {command?.icon}
        </div>
    )
}

function TypeMatchList<T>({ matches, highlightOnHover = false, onClick }: TypeMatchListProps<T>) {
    return (
        <div className='type-match-list'>
            {matches.map(({ commandName, fuzzyMatch, command }) => (
                <TypeMatch
                    key={commandName}
                    commandName={commandName}
                    fuzzyMatch={fuzzyMatch}
                    command={command}
                    highlightOnHover={highlightOnHover}
                    onClick={onClick}
                />
            ))}
        </div>
    )
}

type TypeMatchListProps<T> = {
    matches: { commandName: string, fuzzyMatch: FuzzyMatchResult, command: GenericCommand<T> }[]
    highlightOnHover?: boolean
    onClick?: (command: GenericCommand<T>) => void
}

type TypeMatchProps<T> = {
    commandName: string
    command: GenericCommand<T>
    fuzzyMatch: FuzzyMatchResult
    highlightOnHover?: boolean
    onClick?: (command: GenericCommand<T>) => void
}

// Exports
export {
    TypeControl,
    GenericTypeControl,
    dispatchInputKey,
    findMatchingCommandsGeneric,
    TypeMatch,
    TypeMatchList
}
