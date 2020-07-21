import React, { Component } from 'react';
import { MenuSection } from './menu';

let immediateState = {
    dragging: false,
    clickOffset: 0
};

interface SliderProps {
    max: number
    min: number
    initialValue: number
    less: string
    more: string
    onValue: ((value: number) => void)
    step: number
}

interface SliderState {
    value: number
    step: number
    scaleLength: number
}

class Slider extends Component<SliderProps, SliderState> {

    private scaleRef = React.createRef<HTMLDivElement>();
    private indicatorRef = React.createRef<HTMLDivElement>();

    constructor(props: SliderProps) {
        super(props);

        this.state = ({
            step: this.props.step ? this.props.step : 1,
            value: this.props.initialValue,
            scaleLength: 0
        });
    }

    componentDidMount() {

        const scale = this.scaleRef.current;

        if (!scale) {
            console.log("ERROR: doesn't have the scale ref");

            return;
        }

        this.setState({
            scaleLength: scale.clientWidth
        });

        const indicator = this.indicatorRef.current;

        if (!indicator) {
            console.log("ERROR: doesn't have the indicator ref");

            return;
        }

        indicator.focus();
    }

    render() {
        const percentage = (this.state.value - this.props.min) / (this.props.max - this.props.min);

        return (
            <MenuSection className="Slider">
                <div className="SliderLessLabel Button"
                    onClick={
                        (event: React.MouseEvent) => {
                            console.info("Decreasing");

                            let newValue: number;

                            if (this.state.value - this.state.step < this.props.min) {
                                newValue = this.props.min;
                            } else {
                                newValue = this.state.value - this.state.step;
                            }

                            this.setState({ value: newValue });
                            this.props.onValue(newValue);

                            event.stopPropagation();
                        }
                    } >
                    {this.props.less}
                </div>
                <div className="SliderScale" ref={this.scaleRef}
                    onMouseDown={
                        (event: React.MouseEvent) => {

                            const indicator = this.indicatorRef.current;

                            if (!indicator) {
                                console.log("ERROR: doesn't have indicator ref");

                                return;
                            }

                            if (event.target === indicator) {

                                /* Convert to game coordinates */
                                const dim = event.currentTarget.getBoundingClientRect();
                                const relativeX = event.clientX - dim.left;

                                event.stopPropagation();

                                immediateState.dragging = true;
                                immediateState.clickOffset = relativeX - indicator.offsetLeft;
                            }
                        }
                    }

                    onMouseMove={
                        (event: React.MouseEvent) => {
                            if (immediateState.dragging) {

                                const scale = this.scaleRef.current;

                                if (!scale) {
                                    console.log("ERROR: doesn't have scale ref");

                                    return;
                                }

                                /* Convert to game coordinates */
                                const dim = event.currentTarget.getBoundingClientRect();
                                const relativeX = event.clientX - dim.left - immediateState.clickOffset;

                                const newPercentage = relativeX / scale.clientWidth;
                                const newValue = (this.props.max - this.props.min) * newPercentage + this.props.min;

                                if (newValue >= this.props.min && newValue <= this.props.max) {
                                    this.setState({ value: newValue });

                                    this.props.onValue(newValue);
                                }

                                event.stopPropagation();
                            }
                        }
                    }

                    onMouseUp={
                        (event: React.MouseEvent) => {

                            if (immediateState.dragging) {
                                immediateState.dragging = false;

                                event.stopPropagation();
                            }
                        }
                    }

                    onMouseOut={
                        (event: React.MouseEvent) => {
                            if (immediateState.dragging) {
                                immediateState.dragging = false;

                                event.stopPropagation();
                            }
                        }
                    }
                >
                    <div className="SliderIndicator"
                        tabIndex={0}
                        ref={this.indicatorRef}
                        style={
                            { left: "" + (percentage * 100) + "%" }
                        }
                    />
                </div>
                <div className="SliderMoreLabel Button"
                    onClick={
                        () => {
                            console.info("Decreasing");

                            let newValue: number;

                            if (this.state.value + this.state.step > this.props.max) {
                                newValue = this.props.max;
                            } else {
                                newValue = this.state.value + this.state.step;
                            }

                            this.setState({ value: newValue });
                            this.props.onValue(newValue);
                        }
                    }
                >
                    {this.props.more}
                </div>
            </MenuSection>
        );
    }
}

export default Slider;
