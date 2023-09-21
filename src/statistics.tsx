import * as d3 from 'd3'
import React, { Component } from 'react'
import { GameId, GameStatistics, getGameStatistics, getLandStatistics, LandDataPoint, LandStatistics, Measurement } from './api'
import { Dialog } from './dialog'
import SelectableButtonRow from './selectable_button_row'
import "./statistics.css"

interface StatisticsProps {
    onClose: (() => void)
    gameId: GameId
}
interface StatisticsState {
    productionStatistics?: GameStatistics
    landStatistics?: LandStatistics
    materialToShow: number
    drawnStatistics: boolean
    state: "PRODUCTION" | "LAND"
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

function maxValue(data: Measurement[]): number {
    let maxValue = 0

    for (const measurement of data) {

        for (const value of measurement.values) {
            if (value > maxValue) {
                maxValue = value
            }
        }
    }

    return maxValue
}

class Statistics extends Component<StatisticsProps, StatisticsState> {

    private statisticsContainerRef = React.createRef<SVGSVGElement>()

    constructor(props: StatisticsProps) {
        super(props)

        this.state = {
            drawnStatistics: false,
            materialToShow: 0,
            state: "PRODUCTION"
        }
    }

    shouldComponentUpdate() {
        return !this.state.drawnStatistics
    }

    async componentDidUpdate(): Promise<void> {
        if (!this.state.drawnStatistics && this.statisticsContainerRef && this.statisticsContainerRef.current) {
            if (this.state.state === "PRODUCTION" && this.state.productionStatistics) {
                this.drawProductionStatistics(this.statisticsContainerRef.current, this.state.productionStatistics)

                this.setState({ drawnStatistics: true })
            } else if (this.state.state === "LAND" && this.state.landStatistics) {
                this.drawLandStatistics(this.statisticsContainerRef.current, this.state.landStatistics)

                this.setState({ drawnStatistics: true })
            }
        }
    }

    async componentDidMount(): Promise<void> {

        let drawn = false
        let gameStatistics

        if (!this.state.productionStatistics) {
            gameStatistics = await getGameStatistics(this.props.gameId)

        } else {
            gameStatistics = this.state.productionStatistics
        }

        if (this.statisticsContainerRef && this.statisticsContainerRef.current) {

            this.drawProductionStatistics(this.statisticsContainerRef.current, gameStatistics)
            drawn = true
        }

        this.setState({ productionStatistics: gameStatistics, drawnStatistics: drawn })

        setTimeout(
            async () => {
                await this.updateStatistics()
            },
            5000
        )
    }

    async updateStatistics(): Promise<void> {
        const gameStatistics = await getGameStatistics(this.props.gameId)

        this.setState(
            {
                productionStatistics: gameStatistics,
                drawnStatistics: false
            }
        )

        setTimeout(
            async () => {
                await this.updateStatistics()
            },
            5000
        )
    }

    async setStatisticsMode(mode: string): Promise<void> {

        if (mode === "production" && this.state.state !== "PRODUCTION") {

            const productionStatistics = await getGameStatistics(this.props.gameId)

            this.setState(
                {
                    drawnStatistics: false,
                    state: "PRODUCTION",
                    productionStatistics: productionStatistics
                }
            )
        } else if (mode === "land" && this.state.state !== "LAND") {

            const landStatistics = await getLandStatistics(this.props.gameId)

            this.setState(
                {
                    drawnStatistics: false,
                    state: "LAND",
                    landStatistics: landStatistics
                }
            )
        }
    }

    render() {
        const titleLabel = "Statistics"

        const statisticsChoices = new Map<string, string>()

        statisticsChoices.set("production", "Production Statistics")
        statisticsChoices.set("land", "Land")

        const materialChoices = new Map<string, string>()
        if (this.state.productionStatistics) {
            this.state.productionStatistics.materialStatistics.forEach(
                (materialStatistics, index) => {
                    materialChoices.set("" + index, materialStatistics.material)
                }
            )
        }

        return (
            <Dialog heading={titleLabel} onCloseDialog={this.onClose.bind(this)} floating >
                <>
                    <SelectableButtonRow values={statisticsChoices} onSelected={(value) => { this.setStatisticsMode(value) }}
                        initialValue={this.state.state.toLowerCase()}
                    />

                    <div>
                        <svg className="StatisticsContainer" ref={this.statisticsContainerRef} />
                    </div>

                    {this.state.state === "LAND" &&
                        <>

                        </>
                    }

                    {this.state.state === "PRODUCTION" &&
                        <>

                            {this.state.productionStatistics &&
                                <SelectableButtonRow values={materialChoices}
                                    initialValue={"" + this.state.materialToShow}
                                    onSelected={
                                        (value) => {

                                            this.setState(
                                                {
                                                    materialToShow: Number(value),
                                                    drawnStatistics: false
                                                }
                                            )
                                        }
                                    } />
                            }
                        </>
                    }
                </>
            </Dialog>
        )
    }

    onClose(): void {
        this.props.onClose()
    }

    drawLandStatistics(statisticsSvgElement: SVGSVGElement, landStatistics: LandStatistics): void {

        /*  Complement the reported land metrics */
        const augmentedLandStatistics: LandDataPoint[] = []

        let previousMeasurement = undefined
        for (let i = 0; i < landStatistics.landStatistics.length; i++) {
            const measurement = landStatistics.landStatistics[i]

            if (previousMeasurement) {
                augmentedLandStatistics.push(
                    {
                        time: measurement.time,
                        values: previousMeasurement.values
                    }
                )
            }

            augmentedLandStatistics.push(measurement)

            previousMeasurement = measurement
        }

        augmentedLandStatistics.push(
            {
                time: landStatistics.currentTime,
                values: landStatistics.landStatistics[landStatistics.landStatistics.length - 1].values
            }
        )

        /* Define the full dimensions of the graph window */
        const fullHeight = 600
        const fullWidth = 600

        /* Set the margins */
        const margin = { top: 20, right: 20, bottom: 20, left: 20 }

        /* Calculate the inner dimensions */
        const height = fullHeight - margin.right - margin.left
        const width = fullWidth - margin.top - margin.bottom

        /* Calculate the max range of both axis and the min time value */
        let maxTimeCalculated = 0
        let maxValueCalculated = 0
        let minTimeCalculated = landStatistics.landStatistics[0].time

        landStatistics.landStatistics.forEach(
            (measurement: LandDataPoint) => {
                maxTimeCalculated = Math.max(maxTimeCalculated, measurement.time)
                minTimeCalculated = Math.min(minTimeCalculated, measurement.time)

                const localMaxValue = Math.max(...measurement.values)

                maxValueCalculated = Math.max(maxValueCalculated, localMaxValue)
            }
        )

        /* Create each axis */
        const xScale = d3.scaleLinear()
            .domain([minTimeCalculated, maxTimeCalculated]).nice()
            .range([margin.left, width - margin.right])

        const yScale = d3.scaleLinear()
            .domain([0, maxValueCalculated]).nice()
            .range([height - margin.bottom, margin.top])

        // eslint-disable-next-line
        const xAxis = d3.axisBottom(xScale)

        const yAxis = d3.axisLeft(yScale)

        /* Create the lines */
        const lines: d3.Line<LandDataPoint>[] = []

        for (const i in landStatistics.players) {

            lines.push(
                d3.line<LandDataPoint>()
                    .x(

                        // eslint-disable-next-line
                        (d, i, arr) => {
                            const xScaled = xScale(d.time)

                            if (xScaled !== undefined) {
                                return xScaled
                            }

                            return 0
                        }
                    )
                    .y(
                        (d) => {
                            const yScaled = yScale(d.values[i])

                            if (yScaled !== undefined) {
                                return yScaled
                            }

                            return 0
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
        /*        statisticsSvg.append("g")
                    .attr("transform", "translate(0, " + height + ")")
                    .call(xAxis)*/

        /* Add the y axis */
        statisticsSvg.append("g")
            .call(yAxis)

        /* Instantiate the lines */
        for (const i in landStatistics.players) {
            lines[i](augmentedLandStatistics)
        }

        /* FIXME: for now use a fixed set of colors instead of the right colors for each player */
        const colors = ["red", "blue"]

        /* Add the lines */
        for (const i in landStatistics.players) {
            statisticsSvg.append("path")
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .datum(augmentedLandStatistics) // 10. Binds data to the line 
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
                .data(augmentedLandStatistics)
                .enter().append("circle") // Uses the enter().append() method
                .attr("fill", colors[i])
                .attr("class", "dot") // Assign a class for styling

                // eslint-disable-next-line
                .attr("cx", function (data, index) {
                    const xScaled = xScale(data.time)

                    if (xScaled !== undefined) {
                        return xScaled
                    }

                    return 0
                })
                .attr("cy", function (data) {
                    const yScaled = yScale(data.values[i])

                    if (yScaled !== undefined) {
                        return yScaled
                    }

                    return 0
                })
                .attr("r", 5)
                .on("mouseover",
                    (d, measurementIndex) => {

                        const dotElement = d3.select(d3.event.target)

                        dotElement
                            .attr("fill", "orange")
                            .attr("r", 10)

                        let xScaled = xScale(d.time)
                        let yScaled = yScale(d.values[i])

                        if (xScaled === undefined) {
                            xScaled = 0
                        }

                        if (yScaled === undefined) {
                            yScaled = 0
                        }

                        statisticsSvg
                            .append("text")
                            .attr("id", "textlabel" + i + "-" + measurementIndex)
                            .attr("x", + xScaled + 20)
                            .attr("y", + yScaled + 20)
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

    reduceDataArrayIfNeeded(dataArray: Measurement[], amount: number): Measurement[] {
        const resultArray: Measurement[] = []

        const ratio = Math.floor(dataArray.length / amount)

        for (let i = 0; i < dataArray.length; i++) {
            if (i !== 0 && i !== dataArray.length && i % ratio !== 0) {
                continue
            }

            resultArray.push(dataArray[i])
        }

        return resultArray
    }

    drawProductionStatistics(statisticsSvgElement: SVGSVGElement, gameStatistics: GameStatistics): void {

        /* Get the right material statistics to graph */
        const resourceStatisticsFull = gameStatistics.materialStatistics[this.state.materialToShow].materialStatistics

        const resourceStatistics = this.reduceDataArrayIfNeeded(resourceStatisticsFull, 30)

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

        // eslint-disable-next-line
        const xAxis = d3.axisBottom(xScale)

        const yAxis = d3.axisLeft(yScale)

        /* Create the lines */
        const lines: d3.Line<LandDataPoint>[] = []

        for (const i in gameStatistics.players) {

            lines.push(
                d3.line<Measurement>()
                    .x(

                        // eslint-disable-next-line
                        (d, i, arr) => {
                            const xScaled = xScale(d.time)

                            if (xScaled === undefined) {
                                return 0
                            }

                            return xScaled
                        }
                    )
                    .y(
                        (d) => {
                            const yScaled = yScale(d.values[i])

                            if (yScaled === undefined) {
                                return 0
                            }

                            return yScaled
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
        /*statisticsSvg.append("g")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis)*/

        /* Add the y axis */
        statisticsSvg.append("g")
            .call(yAxis)

        /* Instantiate the lines */
        for (const i in gameStatistics.players) {
            lines[i](resourceStatistics)
        }

        /* FIXME: for now use a fixed set of colors instead of the right colors for each player */
        const colors = ["red", "blue"]

        /* Add the lines */
        for (const i in gameStatistics.players) {
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

                // eslint-disable-next-line
                .attr("cx", function (data, index) {
                    const xScaled = xScale(data.time)

                    if (xScaled === undefined) {
                        return 0
                    }

                    return xScaled
                })
                .attr("cy", function (data) {
                    const yScaled = yScale(data.values[i])

                    if (yScaled === undefined) {
                        return 0
                    }

                    return yScaled
                })
                .attr("r", 5)
                .on("mouseover",
                    (d, measurementIndex) => {

                        const dotElement = d3.select(d3.event.target)

                        dotElement
                            .attr("fill", "orange")
                            .attr("r", 10)

                        let xScaled = xScale(d.time)
                        let yScaled = yScale(d.values[i])

                        if (xScaled === undefined) {
                            xScaled = 0
                        }

                        if (yScaled === undefined) {
                            yScaled = 0
                        }

                        statisticsSvg
                            .append("text")
                            .attr("id", "textlabel" + i + "-" + measurementIndex)
                            .attr("x", xScaled + 20)
                            .attr("y", yScaled + 20)
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

export default Statistics