import React, { Component } from 'react'
import './progress_bar.css'

interface ProgressBarProps {
    progress: number
}
interface ProgressBarState { }

class ProgressBar extends Component<ProgressBarProps, ProgressBarState>{

    render(): JSX.Element {

        return (
            <>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={
                        {
                            width: "" + this.props.progress + "%",
                        }
                    }></div>
                </div>
            </>
        )
    }
}

export default ProgressBar