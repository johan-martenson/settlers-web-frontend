import React, { Component } from 'react';
import Button from './button.js';
import MenuSectionLabel from './menu_section_label.js';

class Dialog extends Component {

    render() {

        let closeLabel = "Close";

        if (typeof(this.props.closeLabel) !== "undefined") {
            closeLabel = this.props.closeLabel;
        }

        return (
                <div className="Dialog">

                    {typeof(this.props.heading) !== "undefined" &&
                        <h1>{this.props.heading}</h1>
                    }
            
                    {this.props.children}

                    {!this.props.noCloseButton &&
                        <Button label={closeLabel} onButtonClicked={this.props.onCloseDialog} />
                    }
                </div>
        );
    }
}

class DialogSection extends Component {
    render() {
        return (
                <div className="DialogSection">
                {typeof(this.props.label) !== "undefined" && <MenuSectionLabel label={this.props.label}/>}
                {this.props.children}
                </div>
        );
    }
}

export {
    Dialog, DialogSection
};
