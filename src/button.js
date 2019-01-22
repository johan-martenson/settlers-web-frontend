import React, { Component } from 'react';

class Button extends Component {

    render() {
        let className = "Button";

        if (this.props.selected && (this.props.selected === true)) {
            className = className + " Selected";
        }

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        return (
                <div className={className}
                    id={this.props.id !== "undefined" ? this.props.id : ""}
                    onClick={
                        (event) => {
                            this.props.onButtonClicked(event);
                            event.stopPropagation();
                        }
                    }
                    onTouchStart={
                        (event) => {
                            this.props.onButtonClicked(event);
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
