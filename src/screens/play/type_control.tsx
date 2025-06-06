import React, { useCallback, useEffect, useReducer, useState } from 'react'
import './type_control.css'
import ExpandCollapseToggle from '../../components/expand_collapse_toggle/expand_collapse_toggle'
import { PointInformation, Point } from '../../api/types'
import { api } from '../../api/ws-api'
import { ItemContainer } from '../../components/item_container'

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

type InputAction = {
    type: 'set' | 'add' | 'run' | 'remove_last'
    payload: string
}

type InputState = {
    input: string
}

// Functions
function isTypingControlKeyEvent(event: unknown): event is CustomEvent<TypeControlKey> {
    return event !== null &&
        event !== undefined &&
        typeof event == 'object' &&
        'detail' in event &&
        typeof event.detail === 'object' &&
        event.detail !== null &&
        'key' in event.detail
}

// React components

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
    const [expanded, setExpanded] = useState<boolean>(false)
    const [selectedPointInformation, setSelectedPointInformation] = useState<PointInformation>()

    const commandChosen = useCallback((commandName: string) => {
        console.log(`Command: ${commandName} at point ${selectedPoint.x},${selectedPoint.y}`)

        commands.get(commandName)?.action(selectedPoint)
    }, [commands, selectedPoint])

    const reducer = useCallback((state: InputState, action: InputAction) => {
        switch (action.type) {
            case 'set':
                return { input: action.payload }
            case 'add':
                return { input: state.input + action.payload }
            case 'run': {
                const commandHit = Array.from(commands.keys())
                    .find(command => command.toLowerCase().startsWith(state.input.toLowerCase()))

                if (commandHit) {
                    commandChosen(commandHit)
                } else {
                    console.log(`Can't find command matching: ${state.input}`)
                }

                return { input: '' }
            }
            case 'remove_last':
                return { input: state.input.slice(0, -1) }
            default:
                return state
        }
    }, [commands, commandChosen])

    const [inputState, dispatchInput] = useReducer(reducer, { input: '' })

    useEffect(() => {
        (async () => {

            // Use try-catch because this can be called before the websocket is setup and will then fail
            try {
                const updatedPointInformation = await api.getInformationOnPoint(selectedPoint)

                setSelectedPointInformation(updatedPointInformation)
            } catch (error) {
                console.error(`Error while getting info on selectiong point: ${selectedPoint}, ${error}`)
            }
        })()
    }, [selectedPoint])

    const setInput = useCallback((input: string) => {
        dispatchInput({ type: 'set', payload: input })
    }, [])

    const addToInput = useCallback((toAdd: string) => {
        dispatchInput({ type: 'add', payload: toAdd })
    }, [])

    useEffect(() => {

        // eslint-disable-next-line
        document.addEventListener('key', listener)

        return () => document.removeEventListener('key', listener)
    }, [])

    const listener = useCallback((event: Event) => {
        if (isTypingControlKeyEvent(event)) {
            if (event.detail.metaKey || event.detail.altKey || event.detail.ctrlKey) {
                return
            }

            const key = event.detail.key

            if (key === 'Escape') {
                setInput('')
            } else if (key === 'Enter') {
                dispatchInput({ type: 'run', payload: 'none' })
            } else if (key === 'Backspace') {
                console.log('Is backspace')

                dispatchInput({ type: 'remove_last', payload: 'none' })
            } else if (key.length === 1 && key !== ' ') {
                addToInput(key)
            }
        }
    }, [])

    const input = inputState.input
    const inputToMatch = input.toLowerCase()
    const hasMatch = Array.from(commands.keys())
        .some(command => command.toLowerCase().startsWith(inputToMatch))

    let className = 'no-input'
    if (input.length > 0) {
        className = hasMatch ? 'input-with-matches' : 'input-with-no-matches'
    }

    className += expanded ? ' expanded' : ' closed'

    const invalidSelectedPointInformation = selectedPointInformation === undefined || !('canBuild' in selectedPointInformation)

    const matches = Array.from(commands.entries())

        // eslint-disable-next-line
        .filter(
            ([, command]) =>
                !command.filter ||
                invalidSelectedPointInformation ||
                command.filter(selectedPointInformation)
        )
        .filter(
            ([commandName]) =>
                expanded ||
                (inputToMatch.length > 0 &&
                    commandName.toLowerCase().startsWith(inputToMatch))
        )

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
                                    commandChosen(commandName)
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

export { TypeControl }