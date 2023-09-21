import React, { Component } from 'react'

interface MenuSectionLabelProps {
    label: string
}

interface MenuSectionLabelState { }

class MenuSectionLabel extends Component<MenuSectionLabelProps, MenuSectionLabelState> {
    render(): JSX.Element {
        return (
            <div className="MenuSectionLabel">{this.props.label}</div>
        )
    }
}

export default MenuSectionLabel
