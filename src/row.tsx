import React, { Component } from 'react'

interface RowProps {
    children: (string | JSX.Element)[]
}
interface RowState {}

class Row extends Component<RowProps, RowState> {

    isChildrenArray(children: string | JSX.Element[]): children is JSX.Element[] {
        return typeof(children) !== "string";
    }
   
    render() {

        console.log(this.props.children);

        const children = React.Children.map(this.props.children,
                                            child => {
                                                return (
                                                        <div className="RowItem">{child}</div>
                                                );
                                            }
                                           );
                           
        return(
            <div className="Row">

                {children}
            </div>
        );
    }
}

export default Row;
