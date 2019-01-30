import React, { Component } from 'react';

interface ButtonProps {
    selected?: boolean
    className?: string
    label?: string
    id?: string
    image?: string
    imageLabel?: string
    disabled?: boolean
    onButtonClicked: (() => void)
}

interface ButtonState {
}

class Button extends Component<ButtonProps, ButtonState> {

    onClicked() {

        if (!this.props.disabled) {
            this.props.onButtonClicked();
        }
    }
    
    render() {
        let className = "Button";

        if (this.props.selected && (this.props.selected === true)) {
            className = className + " Selected";
        }

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        if (this.props.disabled) {
            className = className + " Disabled"
        }
        
        return (
                <div className={className}
                    id={this.props.id ? this.props.id : ""}
                    onClick={
                        (event: React.SyntheticEvent) => {
                            this.onClicked();
                            event.stopPropagation();
                        }
                    }
                    onTouchStart={
                        (event: React.SyntheticEvent) => {
                            this.onClicked();
                            event.stopPropagation();
                        }
                    }
                >

                {this.props.image &&
                    <img src={this.props.image} className="SmallIcon" alt={this.props.imageLabel}/>
                }

                <div>{this.props.label}</div>
            </div>
        );
    }
}

export default Button;
