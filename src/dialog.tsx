import React, { Component } from 'react';
import Button from './button';
import MenuSectionLabel from './menu_section_label';

import './dialog.css'

interface DialogProps {
    closeLabel?: string
    heading?: string
    noCloseButton?: boolean
    onCloseDialog?: (() => void)
    className?: string
    id?: string
}

interface DialogState { }

class Dialog extends Component<DialogProps, DialogState> {

    render() {

        let closeLabel = "Close";

        if (this.props.closeLabel) {
            closeLabel = this.props.closeLabel;
        }

        return (
            <div className="Dialog" id={this.props.id}>

                {this.props.heading &&
                    <h1>{this.props.heading}</h1>
                }

                {this.props.children}

                {!this.props.noCloseButton &&
                    <Button label={closeLabel} onButtonClicked={
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

interface DialogSectionState {

}

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

export {
    Dialog, DialogSection
};
