import React, { Component } from 'react';

interface PanelChoicesProps {}
interface PanelChoicesState {}

class PanelChoices extends Component {

    render() {
        return(
            <div>{this.props.children}</div>
        );
    }
}

export default PanelChoices;
