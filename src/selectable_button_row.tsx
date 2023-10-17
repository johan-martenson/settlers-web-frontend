import React, { Component } from 'react'
import { ToggleButton } from '@fluentui/react-components'
import './selectable_button_row.css'

interface SelectableButtonRowProps {
    values: Map<string, string>
    initialValue?: string
    className?: string
    onSelected: ((value: string) => void)
}

interface SelectableButtonRowState {
    selected?: string
}

class SelectableButtonRow extends Component<SelectableButtonRowProps, SelectableButtonRowState> {

    constructor(props: SelectableButtonRowProps) {
        super(props)

        if (this.props.initialValue) {
            this.state = { selected: this.props.initialValue }
        } else {
            this.state = {}
        }
    }

    render(): JSX.Element {

        let className = "SelectableButtonRowContainer"

        if (this.props.className) {
            className = " " + this.props.className
        }

        return (
            <div className={className}>
                {Array.from(this.props.values.keys()).map(
                    (key: string, index) => {
                        const value = this.props.values.get(key)

                        if (this.state.selected && key === this.state.selected) {
                            return (
                                <ToggleButton
                                    key={index}
                                    checked={true}
                                    onClick={
                                        () => {
                                            this.setState({ selected: key })
                                            this.props.onSelected(key)
                                        }
                                    }
                                >{value}</ToggleButton>
                            )
                        } else {
                            return (
                                <ToggleButton
                                    key={index}
                                    onClick={
                                        () => {
                                            this.setState({ selected: key })
                                            this.props.onSelected(key)
                                        }
                                    }
                                >{value}</ToggleButton>
                            )
                        }
                    }
                )
                }
            </div>
        )
    }
}

export default SelectableButtonRow
