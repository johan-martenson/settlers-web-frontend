import React, { Component } from 'react'

import './on_off_slider.css';

interface OnOffSliderProps {
    initialValue: boolean
    onValueChange: ((value: boolean) => void)
}

interface OnOffSliderState {
    value: boolean
}

class OnOffSlider extends Component<OnOffSliderProps, OnOffSliderState> {

    constructor(props: OnOffSliderProps) {
        super(props);

        this.state = {value: props.initialValue}
    }
    
    render() {
        let className = "OnOffMarker";

        if (this.state.value) {
            className = className + " On";
        } else {
            className = className + " Off";
        }
        
        return (
            <div className="OnOffContainer Row">
                <div className={className}
                    onClick={
                        () => {
                            this.props.onValueChange(!this.state.value);

                            this.setState({value: !this.state.value});
                        }
                    }
                />
            </div>
        );
    }
}

export default OnOffSlider;
