import React, { Component } from 'react';
import MenuSectionLabel from './menu_section_label.js';

class Menu extends Component {

    render() {
        return (
                <div className="Menu">
                {this.props.children}
                </div>
        );
    }
}

class MenuSection extends Component {

    render() {
        let className = "MenuSectionContent";

        if (this.props.selected && (this.props.selected === true)) {
            className = className + " Selected";
        }

        if (this.props.className) {
            className = className + " " + this.props.className;
        }
        return (
                <div className={className}>
                {typeof(this.props.label) !== "undefined" && <MenuSectionLabel label={this.props.label}/>}
                {this.props.children}
            </div>
        );
    }
}

export {
    Menu,
    MenuSection
};
