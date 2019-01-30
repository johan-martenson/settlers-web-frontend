import React, { Component } from 'react';
import { Dialog, DialogSection } from './dialog';
import Slider from './slider';

interface OptionMenuProps {
    onClose: (() => void)
    onChangedZoom: ((scale: number) => void)
    maxZoom: number
    minZoom: number
    currentZoom: number
}
interface OptionMenuState {
    currentSpeed?: number
}

class OptionMenu extends Component<OptionMenuProps, OptionMenuState> {

    constructor(props: OptionMenuProps) {
        super(props);

        this.state = {
            currentSpeed: 4
        };
    }

    onClose() {
        this.props.onClose();
    }

    adjustSpeed(speed: number) {
        //FIXME: actually adjust the speed
    }
    
    render() {
        return (
            <Dialog heading="Options" onCloseDialog={this.onClose.bind(this)}>
                <DialogSection label="Zoom level">
                    <Slider max={this.props.maxZoom}
                        min={this.props.minZoom}
                        initialValue={this.props.currentZoom}
                        step={1}
                        less="-"
                        more="+"
                        onValue={this.props.onChangedZoom}
                    />
                </DialogSection>
            
                <DialogSection label="Game speed">

                    <Slider max={10}
                        min={1}
                        initialValue={this.state.currentSpeed || 5}
                        less="slower"
                        more="faster"
                        step={1}
                        onValue={this.adjustSpeed}
                    />
            </DialogSection>
        </Dialog>
        );
    }
}

export default OptionMenu;
