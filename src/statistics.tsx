import * as d3 from 'd3'
import React, { Component } from 'react'
import { getGameStatistics, getLandStatistics } from './api/rest-api'
import { Window } from './components/dialog'
import "./statistics.css"
import { SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from '@fluentui/react-components'
import { GameId, ProductionStatistics, LandStatistics, Material, MATERIALS, LandDataPoint, Measurement, Nation, PlayerColor } from './api/types'
import { InventoryIcon } from './icon'

interface StatisticsProps {
    onClose: (() => void)
    gameId: GameId
    nation: Nation
}

interface StatisticsState {
    productionStatistics?: ProductionStatistics
    landStatistics?: LandStatistics
    materialToShow: Material
    drawnStatistics: boolean
    state: "PRODUCTION" | "LAND"
}

const PLAYER_COLOR_MAPPING = new Map<PlayerColor, string>()

PLAYER_COLOR_MAPPING.set('BLUE', 'blue')
PLAYER_COLOR_MAPPING.set('BROWN', 'brown')
PLAYER_COLOR_MAPPING.set('GRAY', 'gray')
PLAYER_COLOR_MAPPING.set('GREEN', 'green')
PLAYER_COLOR_MAPPING.set('PURPLE', 'purple')
PLAYER_COLOR_MAPPING.set('RED', 'red')
PLAYER_COLOR_MAPPING.set('WHITE', 'white')
PLAYER_COLOR_MAPPING.set('YELLOW', 'yellow')

class Statistics extends Component<StatisticsProps, StatisticsState> {
    private landStatsContainerRef = React.createRef<SVGSVGElement>()
    private statsParentRef = React.createRef<HTMLDivElement>()

    private productionStatsContainerRef = React.createRef<SVGSVGElement>()

    constructor(props: StatisticsProps) {
        super(props)

        this.state = {
            drawnStatistics: false,
            materialToShow: "PLANK",
            state: "PRODUCTION"
        }
    }

    shouldComponentUpdate(): boolean {
        return !this.state.drawnStatistics
    }

    async componentDidUpdate(): Promise<void> {
        this.updateStatistics()
    }

    async componentDidMount(): Promise<void> {
        this.updateStatistics()
    }

    async updateStatistics(): Promise<void> {
        const productionStats = await getGameStatistics(this.props.gameId)
        const landStats = await getLandStatistics(this.props.gameId)

        if (!this.landStatsContainerRef?.current || !this.statsParentRef?.current) {
            console.error("Missing land stats reference")

            return
        }

        if (!this.productionStatsContainerRef?.current) {
            console.error("Missing production stats reference")

            return
        }

        this.drawProductionStatistics(this.productionStatsContainerRef.current, this.statsParentRef.current, productionStats, this.state.materialToShow)

        this.drawLandStatistics(this.landStatsContainerRef.current, this.statsParentRef.current, landStats)
    }

    render(): JSX.Element {
        const titleLabel = "Statistics"

        return (
            <Window heading={titleLabel} onClose={this.props.onClose}>
                <div id="stats-page">
                    <TabList onTabSelect={
                        (event: SelectTabEvent, data: SelectTabData) => {
                            this.setState({ state: (data.value === "LAND") ? "LAND" : "PRODUCTION" })
                        }
                    } >
                        <Tab value={"PRODUCTION"}>Production</Tab>
                        <Tab value={"LAND"}>Land</Tab>
                    </TabList>

                    <div ref={this.statsParentRef} id="stats-parent">
                        <svg id="land-stats-svg"
                            ref={this.landStatsContainerRef}
                            display={(this.state.state === 'LAND') ? 'block' : 'none'} />

                        <svg id="production-stats-svg"
                            ref={this.productionStatsContainerRef}
                            display={(this.state.state === 'PRODUCTION') ? 'block' : 'none'}
                        />
                    </div>

                    {this.state.state === 'PRODUCTION' &&
                        <div className='select-materials'>
                            {[...MATERIALS].filter(material => material !== 'WELL_WORKER' && material !== 'STOREHOUSE_WORKER')
                                .map(material => <div onClick={() => this.setState({ materialToShow: material })} key={material}>
                                    <Tooltip content={material.toLocaleLowerCase()} relationship={'label'}>
                                        <div><InventoryIcon nation={this.props.nation} material={material} missing={material !== this.state.materialToShow} /></div>
                                    </Tooltip>
                                </div>)}
                        </div>
                    }
                </div>
            </Window>
        )
    }

    onClose(): void {
        this.props.onClose()
    }

    drawLandStatistics(statisticsSvgElement: SVGSVGElement, parent: HTMLDivElement, landStatisticsWithGaps: LandStatistics): void {

        console.log(landStatisticsWithGaps.players)

        /*  Complement the reported land metrics */
        const landStatistics: LandDataPoint[] = []

        let previousMeasurement = undefined
        for (let i = 0; i < landStatisticsWithGaps.landStatistics.length; i++) {
            const measurement = landStatisticsWithGaps.landStatistics[i]

            if (previousMeasurement) {
                landStatistics.push(
                    {
                        time: measurement.time,
                        values: previousMeasurement.values
                    }
                )
            }

            landStatistics.push(measurement)

            previousMeasurement = measurement
        }

        landStatistics.push(
            {
                time: landStatisticsWithGaps.currentTime,
                values: landStatisticsWithGaps.landStatistics[landStatisticsWithGaps.landStatistics.length - 1].values
            }
        )

        const firstDataPoint = landStatistics[0]

        /* Define the full dimensions of the graph window */
        const fullHeight = parent.clientHeight
        const fullWidth = parent.clientWidth

        /* Set the margins */
        const margin = { top: 20, right: 20, bottom: 20, left: 20 }

        /* Calculate the inner dimensions */
        const height = fullHeight - margin.right - margin.left
        const width = fullWidth - margin.top - margin.bottom

        /* Calculate the max range of both axis and the min time value */
        let maxTimeCalculated = 0
        let maxValueCalculated = 0
        let minTimeCalculated = firstDataPoint.time

        landStatisticsWithGaps.landStatistics.forEach(
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

        // eslint-disable-next-line
        for (const i in landStatisticsWithGaps.players) {

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
        d3.selectAll("#land-stats-svg > *").remove()

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
        // eslint-disable-next-line
        for (const i in landStatisticsWithGaps.players) {
            lines[i](landStatistics)
        }

        /* Add the lines */
        // eslint-disable-next-line
        for (const i in landStatisticsWithGaps.players) {
            const player = landStatisticsWithGaps.players[i]
            const color = PLAYER_COLOR_MAPPING.get(player.color)

            if (color === undefined) {
                continue
            }

            statisticsSvg.append("path")
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .datum(landStatistics) // 10. Binds data to the line 
                .attr("class", "line") // Assign a class for styling 
                .attr("d", lines[i]) // 11. Calls the line generator 
                .on("mouseover",
                    (event) => {
                        d3.select(event.target)
                            .attr("stroke-width", 4)
                            .attr("stroke", "orange")
                    }
                )
                .on("mouseout",
                    (event) => {
                        d3.select(event.target)
                            .attr("stroke-width", 2)
                            .attr("stroke", color)
                    }
                )
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

    drawProductionStatistics(statisticsSvgElement: SVGSVGElement, parent: HTMLDivElement, productionStats: ProductionStatistics, material: Material): void {

        /* Get the right material statistics to graph */
        const resourceStatisticsFull = productionStats.materialStatistics[material]

        let resourceStatistics: Measurement[]

        if (resourceStatisticsFull) {
            resourceStatistics = (resourceStatisticsFull.length > 30) ? this.reduceDataArrayIfNeeded(resourceStatisticsFull, 30) : resourceStatisticsFull
        } else {
            resourceStatistics = [{
                time: 0,
                values: new Array<number>(productionStats.players.length).fill(0)
            }]
        }

        /* Define the full dimensions of the graph window */
        const fullHeight = parent.clientHeight
        const fullWidth = parent.clientWidth

        /* Set the margins */
        const margin = { top: 20, right: 20, bottom: 20, left: 20 }

        /* Calculate the inner dimensions */
        const height = fullHeight - margin.right - margin.left
        const width = fullWidth - margin.top - margin.bottom

        /* Calculate the max range of the axis */
        let maxTime = 0
        let maxValue = 0

        resourceStatistics.forEach(measurement => {
            maxTime = measurement.time
            measurement.values.forEach(value => maxValue = Math.max(maxValue, value))
        })

        maxValue = Math.max(maxValue, 10)

        /* Create each axis */
        const xScale = d3.scaleLinear()
            .domain([0, maxTime]).nice()
            .range([margin.left, width - margin.right])

        const yScale = d3.scaleLinear()
            .domain([0, maxValue]).nice()
            .range([height - margin.bottom, margin.top])
        //.range([height, 0])

        // eslint-disable-next-line
        const xAxis = d3.axisBottom(xScale)

        const yAxis = d3.axisLeft(yScale)

        /* Create the lines */
        const lines: d3.Line<LandDataPoint>[] = []

        // eslint-disable-next-line
        for (const i in productionStats.players) {

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
        d3.selectAll("#production-stats-svg > *").remove()

        /* Set the dimensions */
        statisticsSvg
            .attr("width", fullWidth)
            .attr("height", fullHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        /* Add the x axis */
        /*statisticsSvg.append("g")
            .attr("transform", "translate(0, " + (height - margin.top) + ")")
            .call(xAxis)*/

        /* Add the y axis */
        statisticsSvg.append("g")
            .attr("transform", `translate(30, 0)`)
            .call(yAxis)

        /* Instantiate the lines */
        // eslint-disable-next-line
        for (const i in productionStats.players) {
            lines[i](resourceStatistics)
        }

        /* FIXME: for now use a fixed set of colors instead of the right colors for each player */
        const colors = ["red", "blue"]

        /* Add the lines */
        // eslint-disable-next-line
        for (const i in productionStats.players) {
            statisticsSvg.append("path")
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-width", 4)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .datum(resourceStatistics) // 10. Binds data to the line 
                .attr("class", "line") // Assign a class for styling 
                .attr("d", lines[i]) // 11. Calls the line generator 
                .on("mouseover",
                    (event) => {
                        d3.select(event.target)
                            .attr("stroke", "orange")
                    }
                )
                .on("mouseout",
                    (event) => {
                        d3.select(event.target)
                            .attr("stroke", colors[i])
                    }
                )

            statisticsSvg.selectAll(".dot" + i)
                .data(resourceStatistics)
                .enter().append("circle")
                .attr("fill", "rgba(0, 0, 0, 0)")
                //.attr("fill", colors[i])
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
                    (event, d) => {
                        const dotElement = d3.select(event.target)

                        dotElement
                            .attr("fill", colors[i])
                            .attr("r", 5)

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
                            .attr("id", "textlabel-statistics-tooltip")
                            .attr("x", xScaled + 20)
                            .attr("y", yScaled + 20)
                            .text(d.values[i])
                    })
                .on("mouseout",

                    // eslint-disable-next-line
                    (event, d) => {
                        d3.select(event.target)
                            .attr("fill", "rgba(0, 0, 0, 0)")
                            .attr("r", 5)

                        d3.select("#textlabel-statistics-tooltip")
                            .remove()
                    })
        }
    }
}

export default Statistics