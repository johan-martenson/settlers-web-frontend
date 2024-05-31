import React, { useState } from 'react'
import { Button } from '@fluentui/react-components'
import { Dismiss16Filled } from '@fluentui/react-icons'
import './dialog.css'

interface WindowProps {
    hoverInfo?: string
    heading?: string
    className?: string
    id?: string
    children?: React.ReactNode

    onClose: (() => void)
}

function Window({ onClose, ...props }: WindowProps) {
    const className = props.className !== undefined ? `window ${props.className}` : 'window'

    const [windowHoverInfo, setWindowHoverInfo] = useState<string>()

    return (
        <div
            className={className}
            id={props.id}
            onWheel={(event) => event.stopPropagation()}
            onMouseDown={event => { if (event.button === 2) onClose() }}
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

export { Window }

