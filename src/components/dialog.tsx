import React from 'react'
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

function Window(props: WindowProps) {
    const className = props.className !== undefined ? `window ${props.className}` : 'window'

    return (
        <div
            className={className}
            id={props.id}
            onWheel={(event) => event.stopPropagation()}
            onMouseDown={event => { if (event.button === 2) props.onClose() }}
        >
            <div className="window-content">
                {props.heading && <h1>{props.heading}</h1>}

                {props.children}
            </div>
            <div className='hover-info-label'>
                {props.hoverInfo}
            </div>
            <Button onClick={() => props.onClose()} >
                <Dismiss16Filled />
            </Button>
        </div >
    )
}

interface DialogSectionProps {
    label?: string
    children?: React.ReactNode
}

function DialogSection(props: DialogSectionProps) {
    return (
        <div className="DialogSection">
            {props.label && <div className="MenuSectionLabel" >{props.label}</div>}
            {props.children}
        </div>
    )
}

export { Window, DialogSection }

