import React, { Component } from 'react';
import Button from './button.js';
import { Dialog } from './dialog.js';

class FillInPlayerInformation extends Component {

    onPlayerInformationDone() {
        let name = this.nameField.value;

        this.props.onPlayerInformationDone(
            {
                name: name
            }
        );
    }
    
    render() {
        return(
                <Dialog heading="Enter player information" noCloseButton={true}>
                    <div>Name:
                        <input type="text" placeholder="Name" ref={(selfName) => {this.nameField = selfName;}} />
                    </div>

                    <Button label="Enter lobby" onButtonClicked={this.onPlayerInformationDone.bind(this)} />
                </Dialog>
        );
    }
}

export {
    FillInPlayerInformation
};
