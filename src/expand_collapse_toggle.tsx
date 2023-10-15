import React, { Component } from 'react'
import './expand_collapse_toggle.css'
import { Button } from '@fluentui/react-components'
import { ChevronUp24Filled, ChevronDown24Filled } from '@fluentui/react-icons'

interface ExpandCollapseToggleProps {
    expanded?: boolean
    inverted?: boolean
    onExpand: (() => void)
    onCollapse: (() => void)
}
interface ExpandCollapseToggleState {
    expanded: boolean
}

class ExpandCollapseToggle extends Component<ExpandCollapseToggleProps, ExpandCollapseToggleState> {

    constructor(props: ExpandCollapseToggleProps) {
        super(props)

        this.state = {
            expanded: this.props.expanded ? true : false
        }
    }

    onClick(): void {
        if (this.state.expanded) {
            this.props.onCollapse()
        } else {
            this.props.onExpand()
        }

        this.setState({ expanded: !this.state.expanded })
    }

    render(): JSX.Element {

        if (this.props.inverted) {
            if (this.state.expanded) {
                return (<Button icon={<ChevronUp24Filled onClick={this.onClick.bind(this)} /> } appearance='transparent' />)
            } else {
                return (<Button icon={<ChevronDown24Filled onClick={this.onClick.bind(this)} /> } appearance='transparent' />)
            }
        }

        if (this.state.expanded) {
            return (<Button icon={<ChevronDown24Filled onClick={this.onClick.bind(this)} /> } appearance='transparent' />)
        } else {
            return (<Button icon={<ChevronUp24Filled onClick={this.onClick.bind(this)} /> } appearance='transparent' />)
        }
    }
}

export default ExpandCollapseToggle