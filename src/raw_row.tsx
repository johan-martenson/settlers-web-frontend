import React, { Component } from 'react'

interface RawRowProps { }

interface RawRowState { }

class RawRow extends Component<RawRowProps, RawRowState> {

    render() {

        return (
            <div className="Row">
                {this.props.children}
            </div>
        );
    }
}

export default RawRow;