import React from 'react'
import { Button } from '@fluentui/react-components'
import './dialog.css'

interface DialogProps {
    closeLabel?: string
    heading?: string
    noCloseButton?: boolean
    onCloseDialog?: (() => void)
    className?: string
    id?: string
    floating?: boolean
    children?: React.ReactNode
}

function Dialog(props: DialogProps) {
    const className = (props.floating) ? "Dialog FloatingWindow" : "Dialog NonfloatingWindow" + ((props.className) ? props.className : "")
    const closeLabel = props.closeLabel ? props.closeLabel : "Close"

    return (
        <div className={className} id={props.id}>

            <div>
                {props.heading && <h1>{props.heading}</h1>}

                {props.children}
            </div>

            {!props.noCloseButton &&
                <Button onClick={
                    () => {
                        if (props.onCloseDialog) {
                            props.onCloseDialog()
                        }
                    }
                }
                >{closeLabel}</Button>
            }
        </div>
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

export { Dialog, DialogSection }

