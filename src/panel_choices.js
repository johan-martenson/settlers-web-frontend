import React, { Component } from 'react';

class PanelChoices extends Component {

    render() {
        return(
                <div>{this.props.children}</div>
        );
    }
}

export default PanelChoices;
