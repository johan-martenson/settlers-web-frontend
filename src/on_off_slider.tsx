import React, { Component } from 'react'
import './on_off_slider.css'

interface OnOffSliderProps {
    initialValue: boolean
    className?: string
    onValueChange: ((value: boolean) => void)
}

interface OnOffSliderState {
    value: boolean
}

class OnOffSlider extends Component<OnOffSliderProps, OnOffSliderState> {

    constructor(props: OnOffSliderProps) {
        super(props)

        this.state = { value: props.initialValue }
    }

    render(): JSX.Element {
        let markerClassName = "OnOffMarker"
        let className = "OnOffContainer Row"

        if (this.state.value) {
            markerClassName = markerClassName + " On"
        } else {
            markerClassName = markerClassName + " Off"
        }

        if (this.props.className) {
            className = className + " " + this.props.className
        }

        return (
            <div className={className}>
                <div className={markerClassName}
                    onClick={
                        () => {
                            this.props.onValueChange(!this.state.value)

                            this.setState({ value: !this.state.value })
                        }
                    }
                />
            </div>
        )
    }
}

export default OnOffSlider
