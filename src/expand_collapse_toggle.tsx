import React, { Component } from 'react'
import './expand_collapse_toggle.css'
import { isContext2D } from './utils'

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

    private selfRef = React.createRef<HTMLCanvasElement>()

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

    componentDidMount() {
        this.componentDidUpdate()
    }

    componentDidUpdate() {

        if (!this.selfRef.current) {
            console.log("ERROR: no self ref")
            return
        }

        const ctx = this.selfRef.current.getContext("2d")

        if (!ctx || !isContext2D(ctx)) {
            console.log("ERROR: No or invalid context")
            console.log(ctx)
            return
        }

        /* Clear the screen */
        ctx.clearRect(0, 0, 20, 20)

        if ((this.state.expanded && !this.props.inverted) || !this.state.expanded && this.props.inverted) {

            ctx.save()

            ctx.lineWidth = 3
            ctx.strokeStyle = 'black'
            ctx.beginPath()
            ctx.moveTo(0, 10)
            ctx.lineTo(10, 0)
            ctx.lineTo(20, 10)
            ctx.stroke()

            ctx.restore()

        } else {

            ctx.save()

            ctx.lineWidth = 3
            ctx.strokeStyle = 'black'
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(10, 10)
            ctx.lineTo(20, 0)
            ctx.stroke()

            ctx.restore()
        }
    }

    render() {
        return (
            <canvas
                width={20}
                height={20}
                className="ExpandCollapseToggle"
                onClick={this.onClick.bind(this)}
                ref={this.selfRef}
            />
        )
    }
}

export default ExpandCollapseToggle