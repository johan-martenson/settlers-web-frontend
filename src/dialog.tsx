import React, { Component } from 'react'
import { Button } from '@fluentui/react-components'
import './dialog.css'
import MenuSectionLabel from './menu_section_label'

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

interface DialogState { }

class Dialog extends Component<DialogProps, DialogState> {

    render(): JSX.Element {

        const className = (this.props.floating) ? "Dialog FloatingWindow" : "Dialog NonfloatingWindow" + ((this.props.className) ? this.props.className : "")
        const closeLabel = this.props.closeLabel ? this.props.closeLabel : "Close"

        return (
            <div className={className} id={this.props.id}>

                <div>
                    {this.props.heading &&
                        <h1>{this.props.heading}</h1>
                    }

                    {this.props.children}
                </div>

                {!this.props.noCloseButton &&
                    <Button onClick={
                        () => {
                            if (this.props.onCloseDialog) {
                                this.props.onCloseDialog()
                            }
                        }
                    }
                    >{closeLabel}</Button>
                }
            </div>
        )
    }
}

interface DialogSectionProps {
    label?: string
    children?: React.ReactNode
}

interface DialogSectionState { }

class DialogSection extends Component<DialogSectionProps, DialogSectionState> {
    render(): JSX.Element {
        return (
            <div className="DialogSection">
                {this.props.label && <MenuSectionLabel label={this.props.label} />}
                {this.props.children}
            </div>
        )
    }
}

export { Dialog, DialogSection }

