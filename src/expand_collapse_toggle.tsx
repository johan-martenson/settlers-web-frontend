import React, { Component } from 'react';
import './expand_collapse_toggle.css';

interface ExpandCollapseToggleProps {
    expanded?: boolean
    onExpand: (() => void)
    onCollapse: (() => void)
}
interface ExpandCollapseToggleState {
    expanded: boolean;
}

class ExpandCollapseToggle extends Component<ExpandCollapseToggleProps, ExpandCollapseToggleState> {

    private selfRef = React.createRef<HTMLCanvasElement>();

    constructor(props: ExpandCollapseToggleProps) {
        super(props);

        this.state = {
            expanded: this.props.expanded ? true : false
        }
    }

    onClick() {
        if (this.state.expanded) {
            this.props.onCollapse();
        } else {
            this.props.onExpand();
        }

        this.setState({ expanded: !this.state.expanded });
    }

    isContext2D(context: RenderingContext): context is CanvasRenderingContext2D {
        return true;
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {

        if (!this.selfRef.current) {
            console.log("ERROR: no self ref");
            return;
        }

        const width = this.selfRef.current.width;
        const height = this.selfRef.current.height;

        const ctx = this.selfRef.current.getContext("2d");

        if (!ctx || !this.isContext2D(ctx)) {
            console.log("ERROR: No or invalid context");
            console.log(ctx);
            return;
        }

        /* Clear the screen */
        ctx.clearRect(0, 0, 20, 20);

        if (this.state.expanded) {

            ctx.save();

            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black'
            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.lineTo(10, 0);
            ctx.lineTo(20, 10);
            ctx.stroke();

            ctx.restore();

        } else {

            ctx.save();

            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black'
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 10);
            ctx.lineTo(20, 0);
            ctx.stroke();

            ctx.restore();
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
        );
    }
}

export default ExpandCollapseToggle;