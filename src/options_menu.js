import React, { Component } from 'react';
import { Dialog, DialogSection } from './dialog.js';
import Slider from './slider.js';

class OptionMenu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentSpeed: 4
        };
    }

    onClose() {
        this.props.onClose();
    }

    adjustSpeed(speed) {
        
    }
    
    render() {
        return (
            <Dialog heading="Options" onCloseDialog={this.onClose.bind(this)}>
                <DialogSection heading="Zoom level">
                    <Slider max={this.props.maxZoom}
                        min={this.props.minZoom}
                        initialValue={this.props.currentZoom}
                        less="-"
                        more="+"
                        onValue={this.props.zoom}
                    />
                </DialogSection>
            
                <DialogSection heading="Game speed">

                    <Slider max={10}
                        min={1}
                        initialValue={this.state.currentSpeed}
                        less="slower"
                        more="faster"
                        onValue={this.adjustSpeed}
                    />
            </DialogSection>
        </Dialog>
        );
    }
}

export default OptionMenu;
