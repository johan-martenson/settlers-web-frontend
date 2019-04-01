import React, { Component } from 'react';
import './App.css';
import './button.css';

interface ButtonProps {
    selected?: boolean
    className?: string
    label?: string
    id?: string
    image?: string
    imageLabel?: string
    disabled?: boolean
    autoFocus?: true
    onButtonClicked: (() => void)
}

interface ButtonState { }

class Button extends Component<ButtonProps, ButtonState> {
    private selfButtonRef = React.createRef<HTMLDivElement>();

    constructor(props: ButtonProps) {
        super(props);
    }

    componentDidMount() {

        if (this.props.autoFocus && this.selfButtonRef && this.selfButtonRef.current) {
            this.selfButtonRef.current.focus();
        }
    }

    onClicked(): void {
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

        const heading = this.props.label ? this.props.label : "";

        return (
            <div className={className}
                tabIndex={0}
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

                onKeyDown={
                    (event: React.KeyboardEvent<Element>) => {
                        if (event.keyCode === 13) {
                            this.onClicked();
                            event.stopPropagation();
                        }
                    }
                }

                ref={this.selfButtonRef}
            >

                {this.props.image &&
                    <img src={this.props.image} className="SmallIcon" alt={this.props.imageLabel} />
                }

                <div>{this.props.children ? this.props.children : heading}</div>
            </div>
        );
    }
}

export default Button;
