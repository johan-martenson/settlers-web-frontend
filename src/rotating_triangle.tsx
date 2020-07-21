import React, { Component } from 'react'
import GradientTriangle from './gradient_triangle'

interface RotatingTriangleProps { 
    intensities: number[]
}

interface RotatingTriangleState {
    angle: number
}

class RotatingTriangle extends Component<RotatingTriangleProps, RotatingTriangleState> {

    constructor(props: RotatingTriangleProps) {
        super(props)

        this.state = {
            angle: 0
        }

        this.rotate = this.rotate.bind(this)
    }

    rotate() {
        this.setState({ angle: this.state.angle + (Math.PI / 200) })

        setTimeout(this.rotate, 10)
    }

    componentDidMount() {
        setTimeout(this.rotate, 10)
    }

    render() {

        const radius = 50
        const center = { x: 50, y: 50 }

        const angles = [
            this.state.angle,
            this.state.angle + (2 * Math.PI / 3),
            this.state.angle + (2 * 2 * Math.PI / 3)
        ]

        const points = [
            {
                x: center.x + radius * Math.cos(angles[0]),
                y: center.y + radius * Math.sin(angles[0])
            },
            {
                x: center.x + radius * Math.cos(angles[1]),
                y: center.y + radius * Math.sin(angles[1])
            },
            {
                x: center.x + radius * Math.cos(angles[2]),
                y: center.y + radius * Math.sin(angles[2])
            }
        ]

        return (
            <GradientTriangle points={points} intensity1={this.props.intensities[0]} intensity2={this.props.intensities[1]} intensity3={this.props.intensities[2]} />
        )
    }
}

export default RotatingTriangle