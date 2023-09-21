import React, { Component } from 'react'
import MenuSectionLabel from './menu_section_label'

interface MenuProps {
    children?: React.ReactNode
}

interface MenuState { }

class Menu extends Component<MenuProps, MenuState> {

    render() {
        return (
            <div className="Menu">
                {this.props.children}
            </div>
        )
    }
}

interface MenuSectionProps {
    selected?: boolean
    className?: string
    label?: string
    children?: React.ReactNode
}

interface MenuSectionState { }

class MenuSection extends Component<MenuSectionProps, MenuSectionState> {

    render() {
        let className = "MenuSectionContent"

        if (this.props.selected && this.props.selected) {
            className = className + " Selected"
        }

        if (this.props.className) {
            className = className + " " + this.props.className
        }
        return (
            <div className={className}>
                {this.props.label && <MenuSectionLabel label={this.props.label} />}
                {this.props.children}
            </div>
        )
    }
}

export { Menu, MenuSection }

