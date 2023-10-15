import React, { Component } from 'react'

interface CheckboxProps {
    onCheckboxChange: ((isChecked: boolean) => void)
}
interface CheckboxState { }

class Checkbox extends Component<CheckboxProps, CheckboxState> {

    private checkboxRef = React.createRef<HTMLInputElement>()

    onChange(): void {
        if (this.checkboxRef.current) {

            this.props.onCheckboxChange(this.checkboxRef.current.checked)
        }
    }

    render(): JSX.Element {
        return (
            <input type="checkbox" onChange={this.onChange.bind(this)} ref={this.checkboxRef} />
        )
    }
}

export default Checkbox
