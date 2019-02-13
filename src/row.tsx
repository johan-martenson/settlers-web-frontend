import React, { Component } from 'react'

interface RowProps {
    children: (string | JSX.Element | false | string | undefined)[]
    align?: "left" | "right"
    className?: string
}
interface RowState { }

class Row extends Component<RowProps, RowState> {

    render() {

        let childClassName = "RowItemLeft";
        let className = "Row";

        if (this.props.className) {
            className = className + " " + this.props.className;
        }

        console.log(className);

        if (this.props.align && this.props.align === "right") {
            childClassName = "RowItemRight";
        }

        const children = React.Children.map(this.props.children,
            child => {
                return (
                    <div className={childClassName}>{child}</div>
                );
            }
        );

        return (
            <div className={className}>
                {children}
            </div>
        );
    }
}

export default Row;
