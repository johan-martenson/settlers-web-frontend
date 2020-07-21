import React, { Component } from 'react'
import GradientTriangle from './gradient_triangle'

interface GradientTriangleDemoProps { }
interface GradientTriangleDemoState { }

class GradientTriangleDemo extends Component<GradientTriangleDemoProps, GradientTriangleDemoState> {

    render() {
        return (
            <div>
                Two black, one white
                <br />
                <GradientTriangle intensity1={0} intensity2={0} intensity3={1} />
                <GradientTriangle intensity1={0} intensity2={1} intensity3={0} />
                <GradientTriangle intensity1={1} intensity2={0} intensity3={0} />
                <br />
                One black, two whites
                <br />
                <GradientTriangle intensity1={0} intensity2={1} intensity3={1} />
                <GradientTriangle intensity1={1} intensity2={0} intensity3={1} />
                <GradientTriangle intensity1={1} intensity2={1} intensity3={0} />
                <br />
                One black, one gray, one white
                <br />
                <br />
                0, 0.5, 1
                <GradientTriangle intensity1={0} intensity2={0.5} intensity3={1} />
                <br />
                <br />
                0, 1, 0.5
                <GradientTriangle intensity1={0} intensity2={1} intensity3={0.5} />
                <br />
                <br />
                0.5, 0, 1
                <GradientTriangle intensity1={0.5} intensity2={0} intensity3={1} />
                <br />
                <br />
                1, 0, 0.5
                <GradientTriangle intensity1={1} intensity2={0} intensity3={0.5} />
                <br />
                <br />
                1, 0.5, 0
                <GradientTriangle intensity1={1} intensity2={0.5} intensity3={0} />
                <br />
                <br />
                0.5, 1, 0
                <GradientTriangle intensity1={0.5} intensity2={1} intensity3={0} />
                <br />
                <br />
                <br />
                0, 0.2, 1
                <GradientTriangle intensity1={0} intensity2={0.2} intensity3={1} />
                <br />
                <br />
                0, 1, 0.2
                <GradientTriangle intensity1={0} intensity2={1} intensity3={0.2} />
                <br />
                <br />
                0.2, 0, 1
                <GradientTriangle intensity1={0.2} intensity2={0} intensity3={1} />
                <br />
                <br />
                1, 0, 0.2
                <GradientTriangle intensity1={1} intensity2={0} intensity3={0.2} />
                <br />
                <br />
                1, 0.2, 0
                <GradientTriangle intensity1={1} intensity2={0.2} intensity3={0} />
                <br />
                <br />
                0.2, 1, 0
                <GradientTriangle intensity1={0.2} intensity2={1} intensity3={0} />
                <br />
            </div>
        )
    }
}

export default GradientTriangleDemo