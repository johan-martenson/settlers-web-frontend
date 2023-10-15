import React, { Component } from 'react'
import './dialog.css'

interface BottomButtonsProps {
    children: (JSX.Element | false | string | undefined)[]
}
interface BottomButtonsState { }

class BottomButtons extends Component<BottomButtonsProps, BottomButtonsState> {
    render(): JSX.Element {
        return (
            <div className="BottomButtons">
                {this.props.children}
            </div>
        )
    }
}

export default BottomButtons