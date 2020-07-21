import React, { Component } from 'react'

interface MenuButtonProps {
    onMenuButtonClicked: (() => void)
}

interface MenuButtonState { }

class MenuButton extends Component<MenuButtonProps, MenuButtonState> {
    render() {
        return (
            <div className="MenuButton"
                onClick={
                    (event) => {
                        this.props.onMenuButtonClicked()
                        event.stopPropagation()
                    }
                }
                onTouchStart={
                    (event) => {
                        this.props.onMenuButtonClicked()
                        event.stopPropagation()
                    }
                }
            >
                <div className="MenuButtonBar" />
                <div className="MenuButtonBar" />
                <div className="MenuButtonBar" />
            </div>
        )
    }
}

export default MenuButton
