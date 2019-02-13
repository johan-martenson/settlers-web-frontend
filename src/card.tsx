import React, { Component } from 'react'
import './card.css'

interface CardProps {
    className?: string
}

interface CardState { }

class Card extends Component<CardProps, CardState> {

    render() {

        let className = "Card";

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        return (
            <div className={className}>
                {this.props.children}
            </div>
        );
    }
}

export default Card;