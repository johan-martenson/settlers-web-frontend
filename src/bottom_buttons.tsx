import React, { Component } from 'react';
import './dialog.css';

interface BottomButtonsProps {
    children: (string | JSX.Element | false | string | undefined)[]
}
interface BottomButtonsState { }

class BottomButtons extends Component<BottomButtonsProps, BottomButtonsState> {
    render() {
        return (
            <div className="BottomButtons">
                {this.props.children}
            </div>
        );
    }
}

export default BottomButtons;