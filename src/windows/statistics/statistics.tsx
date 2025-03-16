import * as d3 from 'd3'
import React, { useState, useEffect, useRef } from 'react'
import { Window } from '../../components/dialog'
import './statistics.css'
import { SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from '@fluentui/react-components'
import { ProductionStatistics, LandStatistics, Material, MATERIALS, LandDataPoint, Measurement, Nation, PlayerInformation } from '../../api/types'
import { InventoryIcon } from '../../icons/icon'
import { api } from '../../api/ws-api'
import { ColorBox } from '../../components/utils'

// Types
type GraphHover = {
    x: number
    y: number
    value: number
}

type StatisticsProps = {
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

// React components
/**
 * The Statistics component displays production and land statistics for players in the game.
 *
 * @param nation - The nation of the player
 * @param onRaise - Function to raise the window to the top
 * @param onClose - Function to close the window
 */
const Statistics: React.FC<StatisticsProps> = ({ nation, onRaise, onClose }: StatisticsProps) => {
    const landStatsContainerRef = useRef<SVGSVGElement>(null)
    const productionStatsContainerRef = useRef<SVGSVGElement>(null)
    const statsParentRef = useRef<HTMLDivElement>(null)

    const [productionStatistics, setProductionStatistics] = useState<ProductionStatistics>()
    const [landStatistics, setLandStatistics] = useState<LandStatistics>()
    const [materialToShow, setMaterialToShow] = useState<Material>('PLANK')
    const [state, setState] = useState<'PRODUCTION' | 'LAND'>('PRODUCTION')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [graphHover, setGraphHover] = useState<GraphHover>()
    const [playersToShow, setPlayersToShow] = useState<PlayerInformation[]>(Array.from(api.players.values()))

    useEffect(() => {
        async function fetchData(): Promise<void> {
            const productionStats = await api.getProductionStatistics()
            const landStats = await api.getLandStatistics()

            setProductionStatistics(productionStats)
            setLandStatistics(landStats)
        }
        fetchData()
    }, [])  // Run once on mount and when gameId changes

    useEffect(() => {
        if (productionStatsContainerRef.current && statsParentRef.current && productionStatistics) {
            drawProductionStatistics(
                productionStatsContainerRef.current,
                statsParentRef.current,
                productionStatistics!,
                materialToShow
            )
        }
        if (landStatsContainerRef.current && statsParentRef.current && landStatistics) {
            drawLandStatistics(
                landStatsContainerRef.current,
                statsParentRef.current,
                landStatistics!
            )
        }
    }, [productionStatistics, landStatistics, materialToShow, state, playersToShow])

    function drawLandStatistics(statisticsSvgElement: SVGSVGElement, parent: HTMLDivElement, landStatisticsWithGaps: LandStatistics): void {

        // Prepare the data - output is landStatistics, maxTime, and maxValue
        const landStatistics: LandDataPoint[] = []

        let maxValue = 0
        const maxTime = landStatisticsWithGaps.currentTime

        let previousMeasurement = undefined
        for (let i = 0; i < landStatisticsWithGaps.landStatistics.length; i++) {
            const measurement = landStatisticsWithGaps.landStatistics[i]

            // Add an extra measurement to make the graph jump straight up
            if (previousMeasurement) {
                landStatistics.push({
                    time: measurement.time,
                    values: previousMeasurement.values
                })
            }

            maxValue = Math.max(maxValue, ...measurement.values)
            landStatistics.push(measurement)
            previousMeasurement = measurement
        }

        landStatistics.push({
            time: landStatisticsWithGaps.currentTime,
            values: landStatisticsWithGaps.landStatistics[landStatisticsWithGaps.landStatistics.length - 1].values
        })

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
        landStatisticsWithGaps.players.forEach((player, index) =>
            lines.push(
                d3.line<LandDataPoint>()
                    .x(d => xScale(d.time) ?? 0)
                    .y(d => yScale(d.values[index]) ?? 0)
            )
        )

        // Remove the previous rendering (if any)
        d3.selectAll('#land-stats-svg > *').remove()

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
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`)
            .classed('svg-content', true)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Add the x axis and the y axis
        statisticsSvg.append('g')
            .attr('transform', `translate(${margin.left}, ${(margin.top + dataAreaHeight)})`)
            .call(d3.axisBottom(xScale).tickArguments([5]).tickSize(-dataAreaHeight))

        statisticsSvg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScale).tickArguments([5]).tickSize(-dataAreaWidth))

        // Add the lines
        landStatisticsWithGaps.players.forEach((player, index) => {
            if (playersToShow.find(p => p.name === player.name)) {
                statisticsSvg.append('path')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)
                    .attr('fill', 'none')
                    .attr('stroke', player.color)
                    .attr('stroke-width', 2)
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .datum(landStatistics)
                    .attr('class', 'line')
                    .attr('d', lines[index])
                    .on('mouseover', () => setHoverInfo(player.name))
                    .on('mouseout', () => setHoverInfo(undefined))
            }
        })
    }

    function reduceDataArrayIfNeeded(dataArray: Measurement[], amount: number): Measurement[] {
        const resultArray: Measurement[] = []
        const ratio = Math.floor(dataArray.length / amount)

        for (let i = 0; i < dataArray.length; i++) {
            if (i === 0 || i === dataArray.length - 1 || i % ratio === 0) {
                resultArray.push(dataArray[i])
            }
        }

        return resultArray
    }

    function drawProductionStatistics(statisticsSvgElement: SVGSVGElement, parent: HTMLDivElement, productionStats: ProductionStatistics, material: Material): void {

        // Prepare the data - output is resourceStatistics, maxTime, and maxValue
        const resourceStatisticsFull = productionStats.materialStatistics[material]

        let resourceStatistics: Measurement[]

        if (resourceStatisticsFull) {
            resourceStatistics = (resourceStatisticsFull.length > 30) ? reduceDataArrayIfNeeded(resourceStatisticsFull, 30) : resourceStatisticsFull
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
        d3.selectAll('#production-stats-svg > *').remove()

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
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`)
            .classed('svg-content', true)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

        // Add the x axis and the y axis
        statisticsSvg.append('g')
            .attr('transform', `translate(${margin.left}, ${(margin.top + dataAreaHeight)})`)
            .call(d3.axisBottom(xScale).tickArguments([5]).tickSize(-dataAreaHeight))

        statisticsSvg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
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

                statisticsSvg.append('path')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 4)
                    .attr('stroke-linejoin', 'round')
                    .attr('stroke-linecap', 'round')
                    .datum(resourceStatistics) // Bind data to the line
                    .attr('class', 'line')
                    .attr('d', lines[index]) // Call the line generator
                    .on('mouseenter', () => setHoverInfo(name))
                    .on('mouseleave', () => setHoverInfo(undefined))

                statisticsSvg.selectAll('.dot' + index)
                    .data(resourceStatistics)
                    .enter().append('circle')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)
                    .attr('fill', 'rgba(0, 0, 0, 0)')
                    .attr('class', 'dot')

                    .attr('cx', function (data) {
                        const xScaled = xScale(data.time)

                        if (xScaled === undefined) {
                            return 0
                        }

                        return xScaled
                    })
                    .attr('cy', function (data) {
                        const yScaled = yScale(data.values[index])

                        if (yScaled === undefined) {
                            return 0
                        }

                        return yScaled
                    })
                    .attr('r', 5)
                    .on('mouseenter',
                        (event, d) => {
                            setHoverInfo(name)
                            setGraphHover({
                                x: event.pageX + 20, y: event.pageY + 20, value: d.values[index]
                            })
                        })

                    .on('mouseleave', () => {
                        setHoverInfo(undefined)
                        setGraphHover(undefined)
                    })
            }
        )
    }

    const titleLabel = 'Statistics'

    return (
        <>
            <Window heading={titleLabel} onClose={onClose} hoverInfo={hoverInfo} onRaise={onRaise}>
                <div id='stats-page'>
                    <TabList
                        selectedValue={state}
                        onTabSelect={(event: SelectTabEvent, data: SelectTabData) => setState((data.value === 'LAND') ? 'LAND' : 'PRODUCTION')
                        } >
                        <Tab
                            value={'PRODUCTION'}
                            onMouseEnter={() => setHoverInfo('Production statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            Production
                        </Tab>
                        <Tab
                            value={'LAND'}
                            onMouseEnter={() => setHoverInfo('Land size statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            Land
                        </Tab>
                    </TabList>

                    <div ref={statsParentRef} id='stats-parent'>
                        <svg id='land-stats-svg'
                            ref={landStatsContainerRef}
                            display={(state === 'LAND') ? 'inline-block' : 'none'} />

                        <svg id='production-stats-svg'
                            ref={productionStatsContainerRef}
                            display={(state === 'PRODUCTION') ? 'inline-block' : 'none'}
                        />
                    </div>

                    {state === 'PRODUCTION' &&
                        <div className='select-materials'>
                            {[...MATERIALS].filter(material => material !== 'WELL_WORKER' && material !== 'STOREHOUSE_WORKER')
                                .map(material => <div onClick={() => setMaterialToShow(material)} key={material}>
                                    <Tooltip content={material.toLocaleLowerCase()} relationship='label'>
                                        <div
                                            onMouseEnter={() => setHoverInfo(material.toLocaleLowerCase())}
                                            onMouseLeave={() => setHoverInfo(undefined)}
                                        ><InventoryIcon nation={nation} material={material} missing={material !== materialToShow} /></div>
                                    </Tooltip>
                                </div>)}
                        </div>
                    }

                    {state === 'LAND' &&
                        <div className='select-players'>
                            {Array.from(api.players.values()).map(player => <div
                                key={player.id}
                            >
                                <Tooltip content={player.name} relationship='label'>
                                    <div
                                        style={{ gap: '15px' }}
                                        onClick={() => {
                                            if (playersToShow.find(p => p.id === player.id)) {
                                                const remaining = playersToShow.filter(p => p.id !== player.id)

                                                setPlayersToShow(remaining)
                                            } else {
                                                setPlayersToShow([...playersToShow, player])
                                            }
                                        }}
                                        onMouseEnter={() => {
                                            if (playersToShow.find(p => p.id === player.id) !== undefined) {
                                                setHoverInfo(`Hide ${player.name}`)
                                            } else {
                                                setHoverInfo(`Show ${player.name}`)
                                            }
                                        }}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    >
                                        {player.name}
                                        <ColorBox color={player.color} />
                                    </div>
                                </Tooltip>
                            </div>
                            )}
                        </div>
                    }
                </div>
            </Window>

            {graphHover &&
                <div style={{
                    left: '' + graphHover.x + 'px',
                    top: '' + graphHover.y + 'px',
                    zIndex: '5000',
                    width: '5em',
                    height: '2em',
                    position: 'fixed',
                    backgroundColor: 'white',
                    color: 'black'
                }}>
                    {graphHover.value}
                </div>
            }
        </>
    )
}

export default Statistics




