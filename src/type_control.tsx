import React, { useEffect, useReducer, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from './expand_collapse_toggle'
import { PointInformation, Point } from './api/types'
import { monitor } from './api/ws-api'

export interface Command {
    action: ((point: Point) => void)
    filter?: ((selectedPointInformation: PointInformation) => boolean) | undefined
    icon?: React.ReactNode
}

interface TypeControlProps {
    commands: Map<string, Command>
    selectedPoint: Point
}

interface TypeControlKey {
    key: string
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
}

function isTypingControlKeyEvent(event: unknown): event is CustomEvent<TypeControlKey> {
    return event !== null &&
        event !== undefined &&
        typeof event == 'object' &&
        'detail' in event &&
        typeof event.detail === 'object' &&
        event.detail !== null &&
        'key' in event.detail
}

interface InputAction {
    type: 'set' | 'add' | 'run' | 'remove_last'
    payload: string
}

interface InputState {
    input: string
}

/**
 * Note: the TypeControl component is written as a functional component and uses a complex way to
 *       handle the input string state. The component needs to get new keys from a listener and
 *       append them to the input state. The listener is set up using useEffect and the callback
 *       is passed in. When this is done, the state of input is frozen in the closure and it never
 *       changes. If input is instead put as an explicit dependency, the right value will be used
 *       but instead the subscription will be unsubscribed and re-registered each time a key is typed.
 * 
 *       To work around this, useReducer is used. It lets the closure which doesn't see the current
 *       input value send a request to update the value to a reducer which can see and change the
 *       current value.
 *
 */
const TypeControl = ({ commands, selectedPoint }: TypeControlProps) => {
    const [expanded, setExpanded] = useState<boolean>()
    const [selectedPointInformation, setSelectedPointInformation] = useState<PointInformation>()
    const [inputState, dispatchInput] = useReducer(reducer, { input: "" })

    useEffect(
        () => {
            (async () => {

                // Use try-catch because this can be called before the websocket is setup and will then fail
                try {
                    const updatedPointInformation = await monitor.getInformationOnPoint(selectedPoint)

                    setSelectedPointInformation(updatedPointInformation)
                } catch (error) {
                    console.error(`Error while getting info on selectiong point: ${selectedPoint}, ${error}`)
                }
            })().then()

            return () => { }
        }, [selectedPoint])

    function setInput(input: string) {
        dispatchInput({ type: 'set', payload: input })
    }

    function addToInput(toAdd: string) {
        dispatchInput({ type: 'add', payload: toAdd })
    }

    useEffect(
        () => {

            // eslint-disable-next-line
            document.addEventListener("key", listener)

            return () => document.removeEventListener("key", listener)
        }, [])


    function commandChosen(commandName: string): void {
        console.log(`Command: ${commandName}`)

        commands.get(commandName)?.action(selectedPoint)
    }

    function reducer(state: InputState, action: InputAction): InputState {
        switch (action.type) {
            case "set":
                return { input: action.payload }
            case "add":
                return { input: state.input + action.payload }
            case "run": {
                const commandHit = Array.from(commands.keys())
                    .find(command => command.toLowerCase().startsWith(state.input.toLowerCase()))

                if (commandHit) {
                    commandChosen(commandHit)
                } else {
                    console.log("Can't find command matching: " + state.input)
                }

                return { input: '' }
            }
            case "remove_last":
                return { input: state.input.slice(0, -1) }
            default:
                return state
        }
    }

    function listener(event: Event) {
        if (isTypingControlKeyEvent(event)) {
            if (event.detail.metaKey || event.detail.altKey || event.detail.ctrlKey) {
                return
            }

            const key = event.detail.key

            if (key === "Escape") {
                setInput("")
            } else if (key === "Enter") {
                dispatchInput({ type: 'run', payload: "none" })
            } else if (key === "Backspace") {
                console.log("Is backspace")

                dispatchInput({ type: 'remove_last', payload: 'none' })
            } else if (key.length === 1) {
                if (key !== " ") {
                    addToInput(key)
                }
            }
        }
    }

    const input = inputState.input

    let hasMatch = false
    const inputToMatch = input.toLowerCase()

    if (input.length > 0) {
        commands.forEach((fn, command) => {
            if (command.toLowerCase().startsWith(inputToMatch)) {
                hasMatch = true
            }
        })
    }

    let className = "no-input"

    if (input.length > 0) {
        if (hasMatch) {
            className = "input-with-matches"
        } else {
            className = "input-with-no-matches"
        }
    }

    if (expanded) {
        className += " expanded"
    } else {
        className += " closed"
    }

    const invalidSelectedPointInformation = selectedPointInformation === undefined || !('canBuild' in selectedPointInformation)

    return (
        <div className="type-control" onWheel={(event) => event.stopPropagation()}>

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} />
            <div className={className}>{input}</div>

            <div className="container-alternatives">

                {
                    Array.from(commands.entries())

                        // eslint-disable-next-line
                        .filter(([_commandName, command]) => !command.filter || invalidSelectedPointInformation || command.filter(selectedPointInformation))

                        // eslint-disable-next-line
                        .filter(([commandName, _command]) => expanded || (inputToMatch.length > 0 && commandName.toLowerCase().startsWith(inputToMatch)))
                        .map(
                            ([commandName, command], index) => {
                                return (
                                    <div
                                        key={index}
                                        className="alternative"
                                        onClick={() => {
                                            commandChosen(commandName)
                                            setInput("")
                                        }} >

                                        {(
                                            () => {
                                                if (inputToMatch.length > 0 && commandName.toLowerCase().startsWith(inputToMatch)) {
                                                    return (
                                                        <>
                                                            <span>
                                                                <span className="MatchingPart">{commandName.substring(0, input.length)}</span>
                                                                <span className="RemainingPart">{commandName.substring(input.length, commandName.length)}</span>
                                                            </span>
                                                            {command.icon}
                                                        </>
                                                    )
                                                } else {
                                                    return (<>{commandName} {command.icon}</>)
                                                }
                                            })()}
                                    </div>
                                )
                            }
                        )
                }
            </div>
        </div>
    )
}

export { TypeControl }