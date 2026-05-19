import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@fluentui/react-components'
import { Dismiss16Filled } from '@fluentui/react-icons'
import './dialog.css'
import { Point } from '../api/types'
import { useTypingInput } from '../utils/hooks/input'
import { findMatchingCommandsGeneric, GenericCommand, TypeMatch } from '../screens/play/type_control'
import { UiIcon } from '../icons/icon'

// Types
type WindowProps = {
    hoverInfo?: string
    heading?: string
    className?: string
    id?: string
    children: React.ReactNode
    width?: string

    onClose: () => void
    onRaise: () => void
}

type WindowWithTypingProps<T extends object | string> = WindowProps & {
    commands: Map<string, GenericCommand<T>>
    param?: T
}

type Drag = {
    mouseDragStart: Point
    windowDragStart: Point
}

type ButtonRowProps = {
    children: React.ReactNode
}

// React components
function Window({
    hoverInfo = undefined,
    heading = undefined,
    className = undefined,
    id = undefined,
    width = undefined,
    children,
    onClose, onRaise,
}: WindowProps) {

    // Memos
    const emptyCommands = useMemo(() => new Map<string, GenericCommand<object | string>>(), [])

    // Rendering
    return (
        <WindowWithTyping<object | string>
            commands={emptyCommands}
            hoverInfo={hoverInfo}
            heading={heading}
            className={className}
            id={id}
            width={width}
            onClose={onClose}
            onRaise={onRaise}
        >
            {children}
        </WindowWithTyping>
    )
}

function WindowWithTyping<T extends object | string>({
    commands,
    children,
    hoverInfo = undefined,
    heading = undefined,
    className = undefined,
    id = undefined,
    width = undefined,
    param = undefined,
    onClose, onRaise,
}: WindowWithTypingProps<T>) {

    // State
    const [windowHoverInfo, setWindowHoverInfo] = useState<string>()
    const [windowPosition, setWindowPosition] = useState<Point>({
        x: window.innerWidth * 0.2,
        y: window.innerHeight * 0.1
    })
    const [showAlternativeMatches, setShowAlternativeMatches] = useState(false)

    // References
    const draggingRef = useRef<Drag>()
    const windowRef = useRef<HTMLDivElement>(null)

    // Hooks
    const { inputValue, keyTyped } = useTypingInput()

    // Functions
    const toggleShowAlternativeMatches = useCallback(() => {
        setShowAlternativeMatches(prev => !prev)
    }, [])

    const runCommand = useCallback((command: GenericCommand<T>) => {

        if (param) {
            try {
                command.action(param)
            } catch (error) {
                console.error('Error occurred while running command', error)
            }
        } else {
            console.error('Parameter value is undefined, cannot run command')
        }
    }, [param])

    // Effects
    // Effect: listen to mouse movements and handle window dragging
    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            const dragging = draggingRef.current

            if (!dragging) {
                return
            }

            setWindowPosition({
                x: event.clientX - (dragging.mouseDragStart.x - dragging.windowDragStart.x),
                y: event.clientY - (dragging.mouseDragStart.y - dragging.windowDragStart.y)
            })
        }

        const onMouseUp = () => {
            draggingRef.current = undefined
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [])

    // Effect: give the window focus on initial load to make typing navigation work
    useEffect(() => {
        windowRef.current?.focus()
    }, [])

    // Rendering
    const matches = findMatchingCommandsGeneric(commands, inputValue, param)
    const topMatchName = matches.keys().next().value
    const topMatch = topMatchName ? matches.get(topMatchName) : undefined

    return (
        <div
            role='dialog'
            aria-modal='true'
            tabIndex={-1}
            ref={windowRef}
            className={className !== undefined ? `window ${className}` : 'window'}
            id={id}
            style={{ width: width, left: windowPosition?.x ?? undefined, top: windowPosition?.y ?? undefined }}
            onWheel={(event) => event.stopPropagation()}
            onMouseDown={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if (event.button === 2) {
                    onClose()

                    event.preventDefault()
                    event.stopPropagation()
                } else if (event.button === 0) {
                    draggingRef.current = {
                        mouseDragStart: { x: event.clientX, y: event.clientY },
                        windowDragStart: { x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop }
                    }

                    onRaise()
                    event.stopPropagation()
                }
            }}

            onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === 'Escape') {
                    if (inputValue.length === 0) {
                        onClose()
                    }
                } else if (event.key === 'Enter') {
                    console.log('Enter key pressed, attempting to run command')
                    const bestMatchName = matches.keys().next().value

                    console.log('Best match for command:', bestMatchName)

                    if (bestMatchName && param) {
                        console.log('Running command')
                        const bestMatch = matches.get(bestMatchName)

                        try {
                            bestMatch?.command.action(param)
                        } catch (error) {
                            console.error('Error occurred while running command', error)
                        }
                    } else {
                        console.error('No matching command found or parameter is undefined, cannot run command')
                    }
                }

                keyTyped(event)

                event.stopPropagation()
            }}
        >
            <div className='window-content'>
                {heading && <h1>{heading}</h1>}
                {children}
            </div>
            <div className='hover-info-label'>
                {windowHoverInfo ?? hoverInfo}
            </div>
            {inputValue && topMatchName && topMatch &&
                <div className='type-match-and-list-toggle'>
                    <Button appearance='subtle' size='small' onClick={toggleShowAlternativeMatches}>
                        {showAlternativeMatches && <UiIcon type='DOWN_ARROW' />}
                        {!showAlternativeMatches && <UiIcon type='RIGHT_ARROW' />}
                    </Button>
                    <TypeMatch commandName={topMatchName} fuzzyMatch={topMatch.fuzzyMatch} command={topMatch.command} />
                </div>
            }
            {inputValue && !topMatch &&
                <div className='type-match no-match'>No match for &quot;{inputValue}&quot;</div>
            }
            {inputValue && matches.size > 1 && showAlternativeMatches &&
                <div className='alternative-matches'>
                    {Array.from(matches.entries()).map(([commandName, { fuzzyMatch, command }]) => (
                        <TypeMatch
                            key={commandName}
                            commandName={commandName}
                            fuzzyMatch={fuzzyMatch}
                            command={command}
                            highlightOnHover
                            onClick={runCommand}
                        />
                    ))}
                </div>
            }
            <Button
                onClick={onClose}
                onMouseEnter={() => setWindowHoverInfo('Close window')}
                onMouseLeave={() => setWindowHoverInfo(undefined)}
            >
                <Dismiss16Filled />
            </Button>
        </div >
    )
}

function ButtonRow({ children }: ButtonRowProps) {
    return (
        <div className='button-row'>{children}</div>
    )
}

export {
    ButtonRow,
    Window,
    WindowWithTyping
}

