import React, { useState, useEffect } from 'react'
import { Window } from '../../components/dialog'
import './statistics.css'
import { SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { Material, MATERIALS, Nation, PlayerInformation, AnyBuilding, SMALL_HOUSES } from '../../api/types'
import { HouseIcon, InventoryIcon } from '../../icons/icon'
import { api } from '../../api/ws-api'
import { ColorBox } from '../../components/utils'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, TooltipProps } from "recharts"
import styled from "styled-components";
import { StatisticsReply } from '../../api/ws/commands'
import { buildingPretty, materialPretty } from '../../pretty_strings'

// Types
type StatisticsProps = {
    nation: Nation
    onRaise: () => void
    onClose: () => void
}


type ProductionAreaGraphProps = {
    statistics: StatisticsReply
    material: Material
}

type BuildingStatisticsGraphProps = {
    statistics: StatisticsReply
    buildingType: AnyBuilding
}

// Dummy data


const dummyStatistics: StatisticsReply = {
    "currentTime": 523,
    "players": [
        {
            "id": "1",
            "productionStatistics": {
                "PLANK": [[0, 0], [23, 1], [24, 2], [62, 3], [73, 5]],
                "STONE": [[0, 0], [45, 1], [72, 3]]
            },
            "inventoryStatistics": {
                "PLANK": [[0, 10], [23, 11]]
            },
            "landStatistics": [[0, 20], [15, 23], [120, 70], [230, 82]],
            "buildingStatistics": {
                "ForesterHut": [[0, 0], [23, 1]],
                "Woodcutter": [[0, 0], [10, 1], [50, 2]],
                "Sawmill": [[0, 0], [15, 1]],
                "Quarry": [[0, 0], [72, 1]]
            }
        },
        {
            "id": "2",
            "productionStatistics": {
                "PLANK": [[0, 0], [18, 1], [19, 2], [203, 3]],
                "IRON_BAR": [[0, 0], [50, 1]]
            },
            "inventoryStatistics": {
                "PLANK": [[0, 10], [18, 11]],
                "COAL": [[0, 0], [73, 1]]
            },
            "landStatistics": [[0, 20], [23, 25]],
            "buildingStatistics": {}
        }
    ]
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
    const [statistics, setStatistics] = useState<StatisticsReply>({ "currentTime": 0, "players": [] })
    const [materialToShow, setMaterialToShow] = useState<Material>('PLANK')
    const [state, setState] = useState<'PRODUCTION' | 'LAND' | 'BUILDINGS'>('PRODUCTION')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [playersToShow, setPlayersToShow] = useState<PlayerInformation[]>(Array.from(api.players.values()))
    const [selectedBuilding, setSelectedBuilding] = useState<AnyBuilding>('ForesterHut')

    useEffect(() => {
        function statisticsUpdated() {
            console.log("Statistics updated")
        }

        async function fetchData(): Promise<void> {
            // Fetch data
            const statistics = await api.getStatistics()

            setStatistics(statistics)

            console.log(["Got statistics", statistics])

            // Subscribe to changes
            if (api.playerId) {
                api.addStatisticsListener(statisticsUpdated, api.playerId)
            } else {
                console.error("No player ID found")
            }
        }
        fetchData()
    }, [])

    const titleLabel = 'Statistics'

    return (
        <>
            <Window heading={titleLabel} onClose={onClose} hoverInfo={hoverInfo} onRaise={onRaise}>
                <div id='stats-page'>
                    <TabList
                        selectedValue={state}
                        onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                            if (data.value === 'LAND') {
                                setState('LAND')
                            } else if (data.value === 'PRODUCTION') {
                                setState('PRODUCTION')
                            } else {
                                setState('BUILDINGS')
                            }
                        }
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
                        <Tab
                            value={'BUILDINGS'}
                            onMouseEnter={() => setHoverInfo('Building statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            Buildings
                        </Tab>
                    </TabList>

                    {state === 'PRODUCTION' &&
                        <>
                            <ProductionAreaGraph statistics={statistics ?? dummyStatistics} material={materialToShow} />
                            <div className='select-materials'>
                                {[...MATERIALS].filter(material => material !== 'WELL_WORKER' && material !== 'STOREHOUSE_WORKER')
                                    .map(material => {
                                        const materialDisplay = materialPretty(material)

                                        return <div onClick={() => setMaterialToShow(material)} key={material}>
                                            <div
                                                onMouseEnter={() => setHoverInfo(materialDisplay)}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            ><InventoryIcon nation={nation} material={material} missing={material !== materialToShow} /></div>
                                        </div>
                                    })}
                            </div>
                        </>
                    }

                    {state === 'LAND' &&
                        <>
                            <LandAreaGraph statistics={statistics ?? dummyStatistics} />
                            <div className='select-players'>
                                {Array.from(api.players.values()).map(player => <div
                                    key={player.id}
                                >
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
                                </div>
                                )}
                            </div>
                        </>
                    }

                    {state === 'BUILDINGS' &&
                        <>
                            <BuildingStatisticsGraph statistics={statistics ?? dummyStatistics} buildingType={selectedBuilding} />
                            <div className='select-building'>
                                {SMALL_HOUSES.map(house => {
                                    const prettyHouse = buildingPretty(house)

                                    return (<div
                                        key={house}
                                        onClick={async () => {
                                            setSelectedBuilding(house)
                                        }}
                                        onMouseEnter={() => setHoverInfo(`Show statistics for ${prettyHouse.toLowerCase()}`)}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    >
                                        <HouseIcon nation={nation} houseType={house} drawShadow scale={0.5} />
                                    </div>)
                                })
                                }
                            </div>
                        </>
                    }

                </div>
            </Window>
        </>
    )
}

interface ChartData {
    time: number
    [key: string]: number | undefined
}

const CustomTooltipContainer = styled.div`
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
`

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
        return null
    }

    return (
        <CustomTooltipContainer>
            <p><strong>Time: {label}</strong></p>
            {payload.map((entry, index: number) => (
                <p key={index} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
            ))}
        </CustomTooltipContainer>
    )
}

const ProductionAreaGraph = ({ statistics, material }: ProductionAreaGraphProps) => {
    // Collect all unique timestamps
    const allTimestamps = new Set<number>()
    statistics.players.forEach(player => {
        player.productionStatistics[material]?.forEach(([time]) => allTimestamps.add(time))
    })

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in player data
    statistics.players.forEach(player => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = player.productionStatistics[material]?.find(([t]) => t === time)
            if (found) {
                lastValue = found[1]
            }
            entry[`Player ${player.id}`] = lastValue // Carry forward last known value
        })
    })

    // Sort data by time to ensure correct visualization
    chartData.sort((a, b) => a.time - b.time)

    if (chartData.length > 0 && chartData[chartData.length - 1].time != statistics.currentTime) {
        chartData.push({ ...chartData[chartData.length - 1], time: statistics.currentTime })
    } else {
        const zeroMeasurement: { [key: string]: number } = {}

        statistics.players.forEach(player => {
            zeroMeasurement[`Player ${player.id}`] = 0
        })

        chartData.push({ time: 0, ...zeroMeasurement })
        chartData.push({ time: statistics.currentTime, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis
                    dataKey="time"
                    label={{ value: "Time", position: "insideBottom", offset: -5, fill: "white" }}
                    stroke="#FFFFFF" // Change X-axis color
                    type="number"
                    domain={['0', 'dataMax']} // Set the domain to dataMin and dataMax

                />
                <YAxis
                    label={{ value: "Production", angle: -90, position: "insideLeft", fill: "white" }}
                    stroke="#FFFFFF" // Change Y-axis color
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']} // Set the domain to dataMin and dataMax
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {statistics.players.map((player) => (
                    <Line
                        key={player.id}
                        type="stepAfter" // Use step-based line rendering
                        dataKey={`Player ${player.id}`}
                        name={`Player ${player.id}`}
                        stroke={`hsl(${Number(player.id) * 100}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls // Ensures continuous lines even if some timestamps are missing
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}

const BuildingStatisticsGraph = ({ statistics, buildingType }: BuildingStatisticsGraphProps) => {
    // Collect all unique timestamps
    const allTimestamps = new Set<number>()
    statistics.players.forEach(player => {
        player.buildingStatistics[buildingType]?.forEach(([time]) => allTimestamps.add(time))
    })

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in player data
    statistics.players.forEach(player => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = player.buildingStatistics[buildingType]?.find(([t]) => t === time)
            if (found) {
                lastValue = found[1]
            }
            entry[`Player ${player.id}`] = lastValue // Carry forward last known value
        })
    })

    // Ensure the graph extends to the current time
    if (chartData.length > 0 && chartData[chartData.length - 1].time != statistics.currentTime) {
        chartData.push({ ...chartData[chartData.length - 1], time: statistics.currentTime })
    } else {
        const zeroMeasurement: { [key: string]: number } = {}

        statistics.players.forEach(player => {
            zeroMeasurement[`Player ${player.id}`] = 0
        })

        chartData.push({ time: 0, ...zeroMeasurement })
        chartData.push({ time: statistics.currentTime, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis
                    dataKey="time"
                    label={{ value: "Time", position: "insideBottom", offset: -5, fill: "white" }}
                    stroke="#FFFFFF"
                    type="number"
                    domain={[0, 'dataMax']}
                />
                <YAxis
                    label={{ value: "Buildings", angle: -90, position: "insideLeft", fill: "white" }}
                    stroke="#FFFFFF"
                    domain={[0, 'dataMax + 1']} // Set the domain to dataMin and dataMax
                    allowDecimals={false}
                />
                <Tooltip />
                <Legend />
                {statistics.players.map(player => (
                    <Line
                        key={player.id}
                        type="stepAfter"
                        dataKey={`Player ${player.id}`}
                        name={`Player ${player.id}`}
                        stroke={`hsl(${Number(player.id) * 100}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}

const LandAreaGraph = ({ statistics }: { statistics: StatisticsReply }) => {
    // Collect all unique timestamps
    const allTimestamps = new Set<number>()
    statistics.players.forEach(player => {
        player.landStatistics.forEach(([time]) => allTimestamps.add(time))
    })

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in player data
    statistics.players.forEach(player => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = player.landStatistics.find(([t]) => t === time)
            if (found) {
                lastValue = found[1]
            }
            entry[`Player ${player.id}`] = lastValue // Carry forward last known value
        })
    })

    // Sort data by time to ensure correct visualization
    chartData.sort((a, b) => a.time - b.time)

    if (chartData.length > 0 && chartData[chartData.length - 1].time != statistics.currentTime) {
        chartData.push({ ...chartData[chartData.length - 1], time: statistics.currentTime })
    } else {
        const zeroMeasurement: { [key: string]: number } = {}

        statistics.players.forEach(player => {
            zeroMeasurement[`Player ${player.id}`] = 0
        })

        chartData.push({ time: 0, ...zeroMeasurement })
        chartData.push({ time: statistics.currentTime, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis
                    dataKey="time"
                    label={{ value: "Time", position: "insideBottom", offset: -5, fill: "white" }}
                    stroke="#FFFFFF" // Change X-axis color
                    type="number"
                    domain={[0, 'dataMax']} // Set the domain to dataMin and dataMax
                />
                <YAxis
                    label={{ value: "Land Size", angle: -90, position: "insideLeft", fill: "white" }}
                    stroke="#FFFFFF" // Change Y-axis color
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']} // Set the domain to dataMin and dataMax
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {statistics.players.map((player) => (
                    <Line
                        key={player.id}
                        type="stepAfter" // Use step-based line rendering
                        dataKey={`Player ${player.id}`}
                        name={`Player ${player.id}`}
                        stroke={`hsl(${Number(player.id) * 100}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls // Ensures continuous lines even if some timestamps are missing
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}

export default Statistics




