import React, { Component } from 'react'
import './card.css'

interface CardProps {
    className?: string
    children?: React.ReactNode
}

interface CardState { }

class Card extends Component<CardProps, CardState> {

    render(): JSX.Element {

        let className = "Card"

        if (this.props.className) {
            className = className + " " + this.props.className
        }

        return (
            <div className={className}>
                {this.props.children}
            </div>
        )
    }
}

export default Card