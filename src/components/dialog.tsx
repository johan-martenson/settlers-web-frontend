import React, { useState } from 'react'
import { Button } from '@fluentui/react-components'
import { Dismiss16Filled } from '@fluentui/react-icons'
import './dialog.css'
import { Point } from '../api/types'

interface WindowProps {
    hoverInfo?: string
    heading?: string
    className?: string
    id?: string
    children?: React.ReactNode

    onClose: (() => void)
    onRaise: (() => void)
}

type Drag = {
    mouseDragStart: Point
    windowDragStart: Point
}

function Window({ onClose, onRaise, ...props }: WindowProps) {
    const className = props.className !== undefined ? `window ${props.className}` : 'window'

    const [windowHoverInfo, setWindowHoverInfo] = useState<string>()
    const [dragging, setDragging] = useState<Drag>()
    const [windowPosition, setWindowPosition] = useState<Point>()

    let style = {}

    if (windowPosition) {
        style = { left: windowPosition.x, top: windowPosition.y }
    }

    return (
        <div
            className={className}
            id={props.id}
            style={style}
            onWheel={(event) => event.stopPropagation()}
            onMouseDown={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if (event.button === 2) {
                    onClose()
                } else {
                    setDragging({
                        mouseDragStart: { x: event.clientX, y: event.clientY },
                        windowDragStart: { x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop }
                    })

                    onRaise()
                }
            }}

            onMouseMove={(event) => {
                if (dragging) {
                    setWindowPosition({
                        x: event.clientX - (dragging.mouseDragStart.x - dragging.windowDragStart.x),
                        y: event.clientY - (dragging.mouseDragStart.y - dragging.windowDragStart.y)
                    })
                }
            }}

            onMouseUp={() => {
                if (dragging) {
                    setDragging(undefined)
                }
            }}

            onKeyDown={(event: React.KeyboardEvent) => {
                console.log(event.key)
                if (event.key === "Escape") {
                    onClose()
                }
            }}
        >
            <div className="window-content">
                {props.heading && <h1>{props.heading}</h1>}

                {props.children}
            </div>
            <div className='hover-info-label'>
                {windowHoverInfo ?? props.hoverInfo}
            </div>
            <Button
                onClick={() => onClose()}
                onMouseEnter={() => setWindowHoverInfo("Close window")}
                onMouseLeave={() => setWindowHoverInfo(undefined)}
            >
                <Dismiss16Filled />
            </Button>
        </div >
    )
}

type ButtonRowProps = {
    children?: React.ReactNode
}

function ButtonRow({ children }: ButtonRowProps) {
    return (
        <div className='button-row'>{children}</div>
    )
}

export { ButtonRow, Window }

