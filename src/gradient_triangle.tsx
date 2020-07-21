import React, { Component } from 'react'
import { arrayToRgbStyle, getGradientLineForTriangle, isContext2D } from './utils'
import { Point } from './api'

const defaultPoints = [
    {
        x: 0,
        y: 0
    },
    {
        x: 50,
        y: 50,
    },
    {
        x: 100,
        y: 0,
    }
]

interface GradientTriangleProps {
    intensity1: number
    intensity2: number
    intensity3: number
    points?: Point[]
}
interface GradientTriangleState {
    points: Point[]
    ctx?: CanvasRenderingContext2D
}

class GradientTriangle extends Component<GradientTriangleProps, GradientTriangleState> {
    private selfRef = React.createRef<HTMLCanvasElement>()

    constructor(props: GradientTriangleProps) {
        super(props)
    }

    componentDidMount() {

        console.log(this.selfRef)

        if (this.selfRef && this.selfRef.current) {

            const ctx = this.selfRef.current.getContext("2d")

            if (!ctx || !isContext2D(ctx)) {
                console.log("ERROR: No or invalid context")
                console.log(ctx)
                return
            }

            this.setState({ ctx: ctx })
        }
    }

    componentDidUpdate() {

        const points = this.props.points ? this.props.points : defaultPoints

        if (!this.state.ctx) {
            return
        }

        const ctx = this.state.ctx

        /* Draw */
        if (!this.selfRef.current) {
            console.log("ERROR: no self ref")
            return
        }

        /* Draw a background rectangle */
        ctx.save()
        ctx.fillStyle = 'green'

        ctx.rect(0, 0, 100, 100)
        ctx.fill()
        ctx.restore()

        /* Draw the triangle */
        const point = points[0]
        const downLeft = points[1]
        const downRight = points[2]

        /* Get intensity for each point */
        const intensityPoint = this.props.intensity1
        const intensityPointDownLeft = this.props.intensity2
        const intensityPointDownRight = this.props.intensity3


        ctx.save()

        const minIntensity = Math.min(intensityPoint, intensityPointDownLeft, intensityPointDownRight)
        const maxIntensity = Math.max(intensityPoint, intensityPointDownLeft, intensityPointDownRight)

        let minColor
        let maxColor

        minColor = [
            256 * minIntensity,
            256 * minIntensity,
            256 * minIntensity
        ]

        maxColor = [
            256 * maxIntensity,
            256 * maxIntensity,
            256 * maxIntensity
        ]

        if (minIntensity === maxIntensity) {
            ctx.fillStyle = arrayToRgbStyle(minColor)
        } else {

            const gradientPoints = getGradientLineForTriangle(point, intensityPoint, downLeft, intensityPointDownLeft, downRight, intensityPointDownRight)
            try {
                const gradient = ctx.createLinearGradient(
                    gradientPoints[0].x, gradientPoints[0].y, gradientPoints[1].x, gradientPoints[1].y
                )

                gradient.addColorStop(0, arrayToRgbStyle(maxColor))
                gradient.addColorStop(1, arrayToRgbStyle(minColor))

                ctx.fillStyle = gradient
            } catch (e) {
                console.log("")
                console.log("FAILED TO GET GRADIENT FOR TRIANGLE")
                console.log("POINTS")
                console.log(this.props.points)
                console.log("INTENSITIES")
                console.log([intensityPoint, intensityPointDownLeft, intensityPointDownRight])
                console.log("GRADIENT POINTS")
                console.log(gradientPoints)
            }
        }

        ctx.beginPath()

        ctx.moveTo(point.x, point.y)
        ctx.lineTo(downLeft.x, downLeft.y)
        ctx.lineTo(downRight.x, downRight.y)

        ctx.closePath()

        ctx.fill()

        ctx.restore()
    }

    render() {
        return (
            <canvas
                width={200}
                height={200}
                className="GradientTriangleCanvas"
                ref={this.selfRef}
            />
        )
    }
}

export default GradientTriangle