import React, { Component } from 'react';
import Button from './button';
import './dialog.css';
import MenuSectionLabel from './menu_section_label';

interface DialogProps {
    closeLabel?: string
    heading?: string
    noCloseButton?: boolean
    onCloseDialog?: (() => void)
    className?: string
    id?: string
    floating?: boolean
}

interface DialogState { }

class Dialog extends Component<DialogProps, DialogState> {

    render() {

        let className = "Dialog"

        if (this.props.floating) {
            className = className + " FloatingWindow";
        } else {
            className = className + " NonfloatingWindow";
        }

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        const closeLabel = this.props.closeLabel ? this.props.closeLabel : "Close";

        return (
            <div className={className} id={this.props.id}>

                {this.props.heading &&
                    <h1>{this.props.heading}</h1>
                }

                {this.props.children}

                {!this.props.noCloseButton &&
                    <Button className="DialogCloseButton" label={closeLabel} onButtonClicked={
                        () => {
                            if (this.props.onCloseDialog) {
                                this.props.onCloseDialog()
                            }
                        }
                    }
                    />
                }
            </div>
        );
    }
}

interface DialogSectionProps {
    label?: string
}

interface DialogSectionState { }

class DialogSection extends Component<DialogSectionProps, DialogSectionState> {
    render() {
        return (
            <div className="DialogSection">
                {this.props.label && <MenuSectionLabel label={this.props.label} />}
                {this.props.children}
            </div>
        );
    }
}

export { Dialog, DialogSection };

