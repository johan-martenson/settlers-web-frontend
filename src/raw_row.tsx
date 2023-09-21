import React, { Component } from 'react'
import './row.css'

interface RawRowProps {
    className?: string
    children?: React.ReactNode
}

interface RawRowState { }

class RawRow extends Component<RawRowProps, RawRowState> {

    render() {

        let className = "Row"

        if (this.props.className) {
            className = `${className} ${this.props.className}`
        }

        return (
            <div className={className}>
                {this.props.children}
            </div>
        )
    }
}

export default RawRow