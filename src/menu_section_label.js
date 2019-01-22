import React, { Component } from 'react';

class MenuSectionLabel extends Component {
    render() {
        return(
                <div className="MenuSectionLabel">{this.props.label}</div>
        );
    }
}

export default MenuSectionLabel;
