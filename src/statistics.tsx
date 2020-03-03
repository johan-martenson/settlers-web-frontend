import * as d3 from 'd3';
import React, { Component } from 'react';
import { GameId, GameStatistics, Measurement, getGameStatistics, MaterialStatistics } from './api';
import { Dialog } from './dialog';
import "./statistics.css"
import Button from "./button"

interface StatisticsProps {
    onClose: (() => void)
    gameId: GameId
}
interface StatisticsState {
    statistics?: GameStatistics
    materialToShow: number
    drawnStatistics: boolean
}

function maxTime(data: Measurement[]): number {
    let maxNumber = 0

    for (const measurement of data) {
        if (measurement.time > maxNumber) {
            maxNumber = measurement.time
        }
    }

    return maxNumber
}

function maxValue(data: Measurement[]) {
    let maxValue = 0

    for (const measurement of data) {

        for (let value of measurement.values) {
            if (value > maxValue) {
                maxValue = value
            }
        }
    }

    return maxValue
}

class Statistics extends Component<StatisticsProps, StatisticsState> {

    private statisticsContainerRef = React.createRef<SVGSVGElement>();

    constructor(props: StatisticsProps) {
        super(props)

        this.state = {
            drawnStatistics: false,
            materialToShow: 0
        }
    }

    shouldComponentUpdate() {
        return !this.state.drawnStatistics
    }

    async componentDidUpdate(): Promise<void> {
        if (!this.state.drawnStatistics && this.statisticsContainerRef && this.statisticsContainerRef.current && this.state.statistics) {
            this.drawStatistics(this.statisticsContainerRef.current, this.state.statistics)

            this.setState({ drawnStatistics: true })
        }
    }

    async componentDidMount(): Promise<void> {

        let drawn = false
        let gameStatistics

        if (!this.state.statistics) {
            gameStatistics = await getGameStatistics(this.props.gameId)

        } else {
            gameStatistics = this.state.statistics
        }

        if (this.statisticsContainerRef && this.statisticsContainerRef.current) {

            this.drawStatistics(this.statisticsContainerRef.current, gameStatistics)
            drawn = true
        }

        this.setState({ statistics: gameStatistics, drawnStatistics: drawn })
    }

    render() {
        let titleLabel = "Statistics"

        return (
            <Dialog heading={titleLabel} onCloseDialog={this.onClose.bind(this)} floating >
                <div>
                    <svg className="StatisticsContainer"
                        ref={this.statisticsContainerRef} />
                </div>

                <div className="MaterialSelectButtons">
                    {this.state.statistics && this.state.statistics.materialStatistics.map(
                        (materialStatistics, index) => {

                            return (
                                <Button key={index}
                                    onButtonClicked={
                                        () => {
                                            this.setState(
                                                {
                                                    materialToShow: index,
                                                    drawnStatistics: false
                                                }
                                            )
                                        }
                                    }
                                >
                                    {materialStatistics.material}
                                </Button>
                            );
                        }
                    )

                    }
                </div>
            </Dialog>
        )
    }

    onClose() {
        this.props.onClose()
    }

    drawStatistics(statisticsSvgElement: SVGSVGElement, gameStatistics: GameStatistics): void {

        /* Get the right material statistics to graph */
        const resourceStatistics = gameStatistics.materialStatistics[this.state.materialToShow].materialStatistics

        /* Define the full dimensions of the graph window */
        const fullHeight = 600
        const fullWidth = 600

        /* Set the margins */
        const margin = { top: 20, right: 20, bottom: 20, left: 20 }

        /* Calculate the inner dimensions */
        const height = fullHeight - margin.right - margin.left
        const width = fullWidth - margin.top - margin.bottom

        /* Calculate the max range of the axis */
        const maxTimeCalculated = maxTime(resourceStatistics)
        const maxValueCalculated = maxValue(resourceStatistics)

        /* Create each axis */
        const xScale = d3.scaleLinear()
            .domain([0, maxTimeCalculated]).nice()
            .range([margin.left, width - margin.right])

        const yScale = d3.scaleLinear()
            .domain([0, maxValueCalculated]).nice()
            .range([height - margin.bottom, margin.top])

        const xAxis = d3.axisBottom(xScale)

        const yAxis = d3.axisLeft(yScale)

        /* Create the lines */
        let lines: any = []

        for (let i in gameStatistics.players) {

            lines.push(
                d3.line<Measurement>()
                    .x(
                        (d, i, arr) => {
                            return xScale(d.time);
                        }
                    )
                    .y(
                        (d) => {
                            return yScale(d.values[i]);
                        }
                    )
            )
        }

        /* Get the svg to draw on */
        const statisticsSvg = d3.select(statisticsSvgElement)

        /* Clear the svg to remove previous elements */
        d3.selectAll("svg > *").remove()

        /* Set the dimensions */
        statisticsSvg
            .attr("width", fullWidth)
            .attr("height", fullHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        /* Add the x axis */
        statisticsSvg.append("g")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis)

        /* Add the y axis */
        statisticsSvg.append("g")
            .call(yAxis)

        /* Instantiate the lines */
        for (let i in gameStatistics.players) {
            lines[i](resourceStatistics)
        }

        /* FIXME: for now use a fixed set of colors instead of the right colors for each player */
        const colors = ["red", "blue"]

        /* Add the lines */
        for (let i in gameStatistics.players) {
            statisticsSvg.append("path")
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .datum(resourceStatistics) // 10. Binds data to the line 
                .attr("class", "line") // Assign a class for styling 
                .attr("d", lines[i]) // 11. Calls the line generator 
                .on("mouseover",
                    () => {
                        d3.select(d3.event.target)
                            .attr("stroke-width", 4)
                            .attr("stroke", "orange")
                    }
                )
                .on("mouseout",
                    () => {
                        d3.select(d3.event.target)
                            .attr("stroke-width", 2)
                            .attr("stroke", colors[i])
                    }
                )

            statisticsSvg.selectAll(".dot" + i)
                .data(resourceStatistics)
                .enter().append("circle") // Uses the enter().append() method
                .attr("fill", colors[i])
                .attr("class", "dot") // Assign a class for styling
                .attr("cx", function (data, index) { return xScale(data.time) })
                .attr("cy", function (data) {
                    return yScale(data.values[i])
                })
                .attr("r", 5)
                .on("mouseover",
                    (d, measurementIndex) => {

                        const dotElement = d3.select(d3.event.target)

                        dotElement
                            .attr("fill", "orange")
                            .attr("r", 10)

                        statisticsSvg
                            .append("text")
                            .attr("id", "textlabel" + i + "-" + measurementIndex)
                            .attr("x", xScale(d.time) + 20)
                            .attr("y", yScale(d.values[i]) + 20)
                            .text(d.values[i])
                    })
                .on("mouseout",
                    (d, measurementIndex) => {
                        d3.select(d3.event.target)
                            .attr("fill", colors[i])
                            .attr("r", 5)

                        d3.select("#textlabel" + i + "-" + measurementIndex)
                            .remove()
                    })
        }
    }
}

export default Statistics;