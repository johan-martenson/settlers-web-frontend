import React, { useEffect, useReducer, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from './expand_collapse_toggle'
import { getInformationOnPoint } from './api/rest-api'
import { PointInformation, Point, GameId, PlayerId } from './api/types'

export interface Command {
    action: (() => void)
    filter?: ((selectedPointInformation: PointInformation) => boolean) | undefined
    icon?: React.ReactNode
}

interface TypeControlProps {
    commands: Map<string, Command>
    selectedPoint: Point
    gameId: GameId
    playerId: PlayerId
}

interface TypeControlKey {
    key: string
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
const TypeControl = ({ commands, selectedPoint, gameId, playerId }: TypeControlProps) => {
    const [expanded, setExpanded] = useState<boolean>()
    const [selectedPointInformation, setSelectedPointInformation] = useState<PointInformation>()
    const [inputState, dispatchInput] = useReducer(reducer, { input: "" })

    useEffect(
        () => {
            (async () => {
                const updatedPointInformation = await getInformationOnPoint(selectedPoint, gameId, playerId)

                setSelectedPointInformation(updatedPointInformation)
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

    function reducer(state: InputState, action: InputAction): InputState {
        switch (action.type) {
            case "set":
                return { input: action.payload }
            case "add":
                return { input: state.input + action.payload }
            case "run": {
                let commandHit = undefined

                for (const command of Array.from(commands.keys())) {
                    if (command.toLowerCase().startsWith(state.input.toLowerCase())) {
                        commandHit = command

                        break
                    }
                }

                /* Run the command */
                if (commandHit) {
                    commandChosen(commandHit)
                } else {
                    console.log("Can't find command matching: " + state.input)
                }

                return { input: '' }
            }
            case "remove_last":
                return { input: state.input.substring(0, state.input.length - 1) }
        }
    }

    function listener(event: any) {
        if (isTypingControlKeyEvent(event)) {
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

    function commandChosen(commandName: string): void {

        /* Run the command */
        console.log("Command: " + commandName)

        const command = commands.get(commandName)

        if (command) {
            command.action()
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

    return (
        <div className="type-control">

            <ExpandCollapseToggle onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} />
            <div className={className}>{input}</div>

            <div className="container-alternatives">

                {Array.from(commands.entries()).map(
                    ([commandName, command], index) => {
                        let show = true

                        if (command.filter && selectedPointInformation) {
                            try {
                                show = command.filter(selectedPointInformation)
                            } catch (error) {
                                show = false
                            }
                        }

                        if (show && inputToMatch.length > 0 && commandName.toLowerCase().startsWith(inputToMatch)) {

                            return (
                                <div key={index} className="alternative" onClick={() => {
                                    commandChosen(commandName)
                                    setInput("")
                                }} >
                                    <span>
                                        <span className="MatchingPart">{commandName.substring(0, input.length)}</span>
                                        <span className="RemainingPart">{commandName.substring(input.length, commandName.length)}</span>
                                    </span>
                                    {command.icon}
                                </div>
                            )
                        } else if (show) {

                            if (expanded) {
                                return (
                                    <div key={index} className="alternative" onClick={() => {
                                        commandChosen(commandName)
                                        setInput("")
                                    }} >
                                        {commandName} {command.icon}
                                    </div>
                                )
                            }
                        }

                        return null
                    }
                )}
            </div>
        </div>
    )
}

export { TypeControl }