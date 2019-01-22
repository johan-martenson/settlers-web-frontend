import React, { Component } from 'react';

class MenuButton extends Component {
    render() {
        return (
            <div className="MenuButton"
                onClick={
                    (event) => {
                        this.props.onMenuButtonClicked();
                        event.stopPropagation();
                    }
                }
                onTouchStart={
                    (event) => {
                        this.props.onMenuButtonClicked();
                        event.stopPropagation();
                    }
                }
              >
              <div className="MenuButtonBar"/>
              <div className="MenuButtonBar"/>
              <div className="MenuButtonBar"/>
            </div>
        );
    }
}

export default MenuButton;
