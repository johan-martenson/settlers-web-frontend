import * as d3 from 'd3'
import React, { Component } from 'react'
import { getGameStatistics, getLandStatistics } from './api/rest-api'
import { Window } from './components/dialog'
import "./statistics.css"
import { SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from '@fluentui/react-components'
import { GameId, ProductionStatistics, LandStatistics, Material, MATERIALS, LandDataPoint, Measurement, Nation } from './api/types'
import { InventoryIcon } from './icon'

interface StatisticsProps {
    gameId: GameId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

type GraphHover = {
    x: number
    y: number
    value: number
}

interface StatisticsState {
    productionStatistics?: ProductionStatistics
    landStatistics?: LandStatistics
    materialToShow: Material
    drawnStatistics: boolean
    state: "PRODUCTION" | "LAND"
    hoverInfo?: string
    graphHover?: GraphHover
}

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

    shouldComponentUpdate(nextProps: StatisticsProps, nextState: StatisticsState): boolean {
        return !this.state.drawnStatistics || nextState.hoverInfo !== this.state.hoverInfo
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

        if (!this.statsParentRef?.current) {
            console.error("Missing stats parent reference")

            return
        }

        if (!this.landStatsContainerRef?.current) {
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
            <>
                <Window heading={titleLabel} onClose={this.props.onClose} hoverInfo={this.state.hoverInfo} onRaise={this.props.onRaise}>
                    <div id="stats-page">
                        <TabList
                            selectedValue={this.state.state}
                            onTabSelect={
                                (event: SelectTabEvent, data: SelectTabData) => {
                                    this.setState({ state: (data.value === "LAND") ? "LAND" : "PRODUCTION" })
                                }
                            } >
                            <Tab
                                value={"PRODUCTION"}
                                onMouseEnter={() => this.setState({ hoverInfo: 'Production statistics' })}
                                onMouseLeave={() => this.setState({ hoverInfo: undefined })}
                            >
                                Production
                            </Tab>
                            <Tab
                                value={"LAND"}
                                onMouseEnter={() => this.setState({ hoverInfo: 'Land size statistics' })}
                                onMouseLeave={() => this.setState({ hoverInfo: undefined })}
                            >
                                Land
                            </Tab>
                        </TabList>

                        <div ref={this.statsParentRef} id="stats-parent">
                            <svg id="land-stats-svg"
                                ref={this.landStatsContainerRef}
                                display={(this.state.state === 'LAND') ? 'inline-block' : 'none'} />

                            <svg id="production-stats-svg"
                                ref={this.productionStatsContainerRef}
                                display={(this.state.state === 'PRODUCTION') ? 'inline-block' : 'none'}
                            />
                        </div>

                        {this.state.state === 'PRODUCTION' &&
                            <div className='select-materials'>
                                {[...MATERIALS].filter(material => material !== 'WELL_WORKER' && material !== 'STOREHOUSE_WORKER')
                                    .map(material => <div onClick={() => this.setState({ materialToShow: material })} key={material}>
                                        <Tooltip content={material.toLocaleLowerCase()} relationship={'label'}>
                                            <div
                                                onMouseEnter={() => this.setState({ hoverInfo: material.toLocaleLowerCase() })}
                                                onMouseLeave={() => this.setState({ hoverInfo: undefined })}
                                            ><InventoryIcon nation={this.props.nation} material={material} missing={material !== this.state.materialToShow} /></div>
                                        </Tooltip>
                                    </div>)}
                            </div>
                        }
                    </div>
                </Window>

                {this.state.graphHover &&
                    <div style={{
                        left: "" + this.state.graphHover.x + "px",
                        top: "" + this.state.graphHover.y + "px",
                        zIndex: "5000",
                        width: "5em",
                        height: "2em",
                        position: "fixed",
                        backgroundColor: "white",
                        color: "black"
                    }}>
                        {this.state.graphHover.value}
                    </div>
                }
            </>
        )
    }

    drawLandStatistics(statisticsSvgElement: SVGSVGElement, parent: HTMLDivElement, landStatisticsWithGaps: LandStatistics): void {

        // Prepare the data - output is landStatistics, maxTime, and maxValue
        const landStatistics: LandDataPoint[] = []

        let maxValue = 0
        const maxTime = landStatisticsWithGaps.currentTime

        let previousMeasurement = undefined
        for (let i = 0; i < landStatisticsWithGaps.landStatistics.length; i++) {
            const measurement = landStatisticsWithGaps.landStatistics[i]

            // Add an extra measurement to make the graph jump straight up
            if (previousMeasurement) {
                landStatistics.push(
                    {
                        time: measurement.time,
                        values: previousMeasurement.values
                    }
                )
            }

            maxValue = Math.max(maxValue, measurement.values.reduce((a, b) => Math.max(a, b)))

            landStatistics.push(measurement)

            previousMeasurement = measurement
        }

        landStatistics.push(
            {
                time: landStatisticsWithGaps.currentTime,
                values: landStatisticsWithGaps.landStatistics[landStatisticsWithGaps.landStatistics.length - 1].values
            }
        )

        // Define layout - full width x height, the margin, and the inner width x height
        const fullHeight = parent.clientHeight
        const fullWidth = parent.clientWidth

        const margin = { top: 30, right: 40, bottom: 30, left: 50 }

        const dataAreaWidth = fullWidth - margin.top - margin.bottom
        const dataAreaHeight = fullHeight - margin.right - margin.left

        // Define the view and value ranges - output is xScale and yScale
        const xScale = d3.scaleLinear()
            .domain([0, maxTime]).nice()
            .range([0, dataAreaWidth])

        const yScale = d3.scaleLinear()
            .domain([0, maxValue]).nice()
            .range([dataAreaHeight, 0])

        // Create the lines
        const lines: d3.Line<LandDataPoint>[] = []

        landStatisticsWithGaps.players.forEach(
            (player, index) => lines.push(
                d3.line<LandDataPoint>()
                    .x((d) => xScale(d.time) ?? 0)
                    .y((d) => yScale(d.values[index]) ?? 0)
            ))

        // Remove the previous rendering (if any)
        d3.selectAll("#land-stats-svg > *").remove()

        // Get the svg to draw on
        const statisticsSvg = d3.select(statisticsSvgElement)

        // Color the background
        statisticsSvg.append('rect')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('width', dataAreaWidth)
            .attr('height', dataAreaHeight)
            .style('fill', 'lightgray')

        // Make the svg fill its parent and adapt when the size changes
        statisticsSvg
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
            .classed("svg-content", true)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        // Add the x axis and the y axis
        statisticsSvg.append("g")
            .attr("transform", `translate(${margin.left}, ${(margin.top + dataAreaHeight)})`)
            .call(d3.axisBottom(xScale).tickArguments([5]).tickSize(-dataAreaHeight))

        statisticsSvg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScale).tickArguments([5]).tickSize(-dataAreaWidth))

        // Add the lines
        landStatisticsWithGaps.players.forEach(
            (player, index) => statisticsSvg.append("path")
                .attr('transform', `translate(${margin.left}, ${margin.top})`)
                .attr("fill", "none")
                .attr("stroke", player.color)
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .datum(landStatistics) // Bind data to the line
                .attr("class", "line")
                .attr("d", lines[index]) // Call the line generator
                .on("mouseover", () => this.setState({ hoverInfo: player.name }))
                .on("mouseout", () => this.setState({ hoverInfo: undefined }))
        )
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

        // Prepare the data - output is resourceStatistics, maxTime, and maxValue
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

        let maxTime = 0
        let maxValue = 0

        resourceStatistics.forEach(measurement => {
            maxTime = measurement.time
            measurement.values.forEach(value => maxValue = Math.max(maxValue, value))
        })

        maxValue = Math.max(maxValue, 10)

        // Define layout - full width x height, the margin, and the inner width x height
        const fullHeight = parent.clientHeight
        const fullWidth = parent.clientWidth

        const margin = { top: 30, right: 40, bottom: 30, left: 40 }

        const dataAreaWidth = fullWidth - margin.top - margin.bottom
        const dataAreaHeight = fullHeight - margin.right - margin.left

        // Define the view and value ranges - output is xScale and yScale
        const xScale = d3.scaleLinear()
            .domain([0, maxTime]).nice()
            .range([0, dataAreaWidth])

        const yScale = d3.scaleLinear()
            .domain([0, maxValue]).nice()
            .range([dataAreaHeight, 0])

        // Create the lines
        const lines: d3.Line<LandDataPoint>[] = []

        productionStats.players.forEach(
            (player, i) => lines.push(
                d3.line<Measurement>()
                    .x(d => xScale(d.time) ?? 0)
                    .y(d => yScale(d.values[i]) ?? 0)))

        // Remove the previous rendering (if any)
        d3.selectAll("#production-stats-svg > *").remove()

        // Get the svg to draw on
        const statisticsSvg = d3.select(statisticsSvgElement)

        // Color the background
        statisticsSvg.append('rect')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .attr('width', dataAreaWidth)
            .attr('height', dataAreaHeight)
            .style('fill', 'lightgray')

        // Make the svg fill its parent and adapt when the size changes
        statisticsSvg
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
            .classed("svg-content", true)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        // Add the x axis and the y axis
        statisticsSvg.append("g")
            .attr("transform", `translate(${margin.left}, ${(margin.top + dataAreaHeight)})`)
            .call(d3.axisBottom(xScale).tickArguments([5]).tickSize(-dataAreaHeight))

        statisticsSvg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScale).tickArguments([5]).tickSize(-dataAreaWidth))

        // Instantiate the lines
        productionStats.players.forEach(
            (player, index) => lines[index](resourceStatistics)
        )

        /* Add the lines */
        productionStats.players.forEach(
            (player, index) => {
                const color = player.color
                const name = player.name

                statisticsSvg.append("path")
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 4)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .datum(resourceStatistics) // Bind data to the line
                    .attr("class", "line")
                    .attr("d", lines[index]) // Call the line generator
                    .on("mouseenter", () => this.setState({ hoverInfo: name }))
                    .on("mouseleave", () => this.setState({ hoverInfo: undefined }))

                statisticsSvg.selectAll(".dot" + index)
                    .data(resourceStatistics)
                    .enter().append("circle")
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)
                    .attr("fill", "rgba(0, 0, 0, 0)")
                    .attr("class", "dot")

                    .attr("cx", function (data) {
                        const xScaled = xScale(data.time)

                        if (xScaled === undefined) {
                            return 0
                        }

                        return xScaled
                    })
                    .attr("cy", function (data) {
                        const yScaled = yScale(data.values[index])

                        if (yScaled === undefined) {
                            return 0
                        }

                        return yScaled
                    })
                    .attr("r", 5)
                    .on("mouseenter",
                        (event, d) => {
                            this.setState({
                                hoverInfo: name,
                                graphHover: {
                                    x: event.pageX + 20, y: event.pageY + 20, value: d.values[index]
                                }
                            })
                        })

                    .on("mouseleave", () => this.setState({ hoverInfo: undefined, graphHover: undefined }))
            }
        )
    }
}

export default Statistics