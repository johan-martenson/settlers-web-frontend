import React, { Component } from 'react'
import './row.css'

interface RowProps {
    children: (JSX.Element | false | undefined)[]
    align?: "left" | "right"
    className?: string
}
interface RowState { }

class Row extends Component<RowProps, RowState> {

    render() {

        let childClassName = "RowItemLeft"
        let className = "Row"

        if (this.props.className) {
            className = className + " " + this.props.className
        }

        if (this.props.align && this.props.align === "right") {
            childClassName = "RowItemRight"
        }

        const children = React.Children.map(this.props.children,
            child => {
                return (
                    <div className={childClassName}>{child}</div>
                )
            }
        )

        return (
            <div className={className}>
                {children}
            </div>
        )
    }
}

export default Row
