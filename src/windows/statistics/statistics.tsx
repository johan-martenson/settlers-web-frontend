import React, { useState, useEffect } from 'react'
import { Window } from '../../components/dialog'
import './statistics.css'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { Material, MATERIALS, Nation, PlayerInformation, AnyBuilding, SMALL_HOUSES, GeneralStatisticsType, Merchandise, MERCHANDISE_VALUES, PlayerColor, PlayerId } from '../../api/types'
import { HouseIcon, InventoryIcon } from '../../icons/icon'
import { api } from '../../api/ws-api'
import { ColorBox } from '../../components/utils'
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, CartesianGrid } from "recharts"
import { StatisticsReply } from '../../api/ws/commands'
import { buildingPretty, materialPretty, merchandisePretty, playerToColor } from '../../pretty_strings'
import PlayerButton from '../../components/player_button'

// Types
type StatisticsProps = {
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type ProductionAreaGraphProps = {
    statistics: StatisticsReply
    material: Material

    setHover: (info: string | undefined) => void
}

type BuildingStatisticsGraphProps = {
    statistics: StatisticsReply
    buildingType: AnyBuilding

    setHover: (info: string | undefined) => void
}

type LandAreaGraphProps = {
    statistics: StatisticsReply

    setHover: (info: string | undefined) => void
}

type StatisticsView = 'GENERAL' | 'MERCHANDISE' | 'PRODUCTION' | 'LAND' | 'BUILDINGS'

// Constants
const MERCHANDISE_STATS_COLORS: { [key in Merchandise]?: string } = {
    'WOOD': '#1E88E5',
    'PLANK': '#D32F2F',
    'STONE': '#FFB300',
    'FOOD': '#00897B',
    'WATER': '#673AB7',
    'BEER': '#F57C00',
    'COAL': '#7CB342',
    'IRON': '#E91E63',
    'GOLD': '#3F51B5',
    'IRON_BAR': '#00ACC1',
    'COIN': '#FF5722',
    'TOOLS': '#8BC34A',
    'WEAPONS': '#795548',
    'BOAT': '#757575',
}

const EMPTY_STATISTICS: StatisticsReply = {
    "currentTime": 1,
    "merchandise": {
        "WOOD": [],
        "PLANK": [],
        "STONE": [],
        "FOOD": [],
        "WATER": [],
        "BEER": [],
        "COAL": [],
        "IRON": [],
        "GOLD": [],
        "IRON_BAR": [],
        "COIN": [],
        "TOOLS": [],
        "WEAPONS": [],
        "BOAT": [],
    },
    "players": []
}

// Sample data
const sampleStatisticsData: StatisticsReply = {
    "currentTime": 523,
    "merchandise": {
        "WOOD": [[1, 0], [23, 1]]
    },
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
            "buildingStatistics": {
                "ForesterHut": [[1, 0], [23, 1]],
                "Woodcutter": [[1, 0], [10, 1], [50, 2]],
                "Sawmill": [[1, 0], [15, 1]],
                "Quarry": [[1, 0], [72, 1]],
                "Headquarter": [[1, 1]]
            },
            "general": {
                "houses": [[1, 1], [23, 2]],
                "workers": [[1, 23], [123, 30]],
                "goods": [],
                "military": [],
                "coins": [],
                "production": [],
                "killedEnemies": [],
                "land": [[1, 20], [15, 23], [120, 70], [230, 82]]
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
            "buildingStatistics": {},
            "general": {
                "houses": [[1, 1]],
                "workers": [[1, 23], [17, 24], [52, 25], [110, 27], [200, 28], [233, 29]],
                "goods": [],
                "military": [],
                "coins": [],
                "production": [],
                "killedEnemies": [],
                "land": [[1, 20], [10, 20], [150, 90], [270, 92]]
            }
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
    const [statistics, setStatistics] = useState<StatisticsReply>(EMPTY_STATISTICS)
    const [materialToShow, setMaterialToShow] = useState<Material>('PLANK')
    const [state, setState] = useState<StatisticsView>('GENERAL')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [playersToShow, setPlayersToShow] = useState<PlayerInformation[]>(Array.from(api.players.values()))
    const [selectedBuilding, setSelectedBuilding] = useState<AnyBuilding>('ForesterHut')
    const [generalStatistics, setGeneralStatistics] = useState<GeneralStatisticsType>('land')
    const [selectedMerchandise, setSelectedMerchandise] = useState<Merchandise[]>([])
    const [selectedPlayers, setSelectedPlayers] = useState<PlayerId[]>(Array.from(api.players.keys()))
    const [time, setTime] = useState<number>(0)

    useEffect(() => {
        function timeUpdated(updatedTime: number) {
            if (updatedTime > time + 20) {
                setTime(updatedTime)
            }
        }

        async function statisticsUpdated() {
            console.log("Statistics updated")

            const statistics = await api.getStatistics()

            setStatistics(statistics)
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

        api.addTimeListener(timeUpdated)

        return () => {
            if (api.playerId) {
                api.removeStatisticsListener(statisticsUpdated)
            }

            api.removeTimeListener(timeUpdated)
        }
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
                            } else if (data.value === 'BUILDINGS') {
                                setState('BUILDINGS')
                            } else if (data.value === 'MERCHANDISE') {
                                setState('MERCHANDISE')
                            } else {
                                setState('GENERAL')
                            }
                        }} >
                        <Tab
                            value={'GENERAL'}
                            onMouseEnter={() => setHoverInfo('General statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            General
                        </Tab>
                        <Tab
                            value={'MERCHANDISE'}
                        >
                            Merchandise
                        </Tab>
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

                    {state === 'GENERAL' &&
                        <>
                            <GeneralStatisticsGraph
                                statistics={statistics}
                                statType={generalStatistics}
                                setHover={setHoverInfo}
                                selectedPlayers={selectedPlayers}
                            />
                            <div>
                                {Array.from(api.players.values()).map(player => {

                                    return (
                                        <PlayerButton
                                            key={player.id}
                                            playerId={player.id}
                                            selected={selectedPlayers.includes(player.id)}
                                            onClick={() => setSelectedPlayers(prev => prev.includes(player.id)
                                                ? prev.filter(p => p !== player.id)
                                                : [...prev, player.id]
                                            )}
                                        />
                                    )
                                })}
                            </div>
                            <div>
                                <Button
                                    onClick={() => setGeneralStatistics('land')}
                                    onMouseEnter={() => setHoverInfo('Land')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Land
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('production')}
                                    onMouseEnter={() => setHoverInfo('Production')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Production
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('workers')}
                                    onMouseEnter={() => setHoverInfo('Workers')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Workers
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('houses')}
                                    onMouseEnter={() => setHoverInfo('Buildings')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Houses
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('goods')}
                                    onMouseEnter={() => setHoverInfo('Goods')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Goods
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('coins')}
                                    onMouseEnter={() => setHoverInfo('Coins')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Coins
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('military')}
                                    onMouseEnter={() => setHoverInfo('Military')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Military
                                </Button>
                                <Button
                                    onClick={() => setGeneralStatistics('killedEnemies')}
                                    onMouseEnter={() => setHoverInfo('Killed enemies')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Killed Enemies
                                </Button>
                            </div>
                        </>
                    }

                    {state == 'MERCHANDISE' &&
                        <>
                            <MerchandiseGraph statistics={statistics} selectedMerchandise={selectedMerchandise} time={time} />
                            <div className='select-merchandise'>
                                {MERCHANDISE_VALUES.map(merchandise => {
                                    const prettyMerchandise = merchandisePretty(merchandise).toLowerCase()

                                    return (
                                        <Button
                                            key={merchandise}
                                            style={{ backgroundColor: selectedMerchandise.includes(merchandise) ? MERCHANDISE_STATS_COLORS[merchandise] : undefined }}
                                            onClick={() => setSelectedMerchandise(prev => prev.includes(merchandise)
                                                ? prev.filter(m => m !== merchandise)
                                                : [...selectedMerchandise, merchandise as Merchandise])}
                                            onMouseEnter={() => setHoverInfo(`Show statistics for ${prettyMerchandise}`)}
                                            onMouseLeave={() => setHoverInfo(undefined)}
                                        >
                                            {merchandise === 'WOOD' && <InventoryIcon material='WOOD' nation={'ROMANS'} />}
                                            {merchandise === 'PLANK' && <InventoryIcon material='PLANK' nation={'ROMANS'} />}
                                            {merchandise === 'STONE' && <InventoryIcon material='STONE' nation={'ROMANS'} />}
                                            {merchandise === 'FOOD' && <>
                                                <InventoryIcon material='FISH' nation={'ROMANS'} />
                                                <InventoryIcon material='MEAT' nation={'ROMANS'} />
                                                <InventoryIcon material='BREAD' nation={'ROMANS'} />
                                            </>}
                                            {merchandise === 'WATER' && <InventoryIcon material='WATER' nation={'ROMANS'} />}
                                            {merchandise === 'BEER' && <InventoryIcon material='BEER' nation={'ROMANS'} />}
                                            {merchandise === 'COAL' && <InventoryIcon material='COAL' nation={'ROMANS'} />}
                                            {merchandise === 'IRON' && <InventoryIcon material='IRON' nation={'ROMANS'} />}
                                            {merchandise === 'GOLD' && <InventoryIcon material='GOLD' nation={'ROMANS'} />}
                                            {merchandise === 'IRON_BAR' && <InventoryIcon material='IRON_BAR' nation={'ROMANS'} />}
                                            {merchandise === 'COIN' && <InventoryIcon material='COIN' nation={'ROMANS'} />}
                                            {merchandise === 'TOOLS' && <InventoryIcon material='TONGS' nation={'ROMANS'} />}
                                            {merchandise === 'WEAPONS' && <>
                                                <InventoryIcon material='SWORD' nation={'ROMANS'} />
                                                <InventoryIcon material='SHIELD' nation={'ROMANS'} />
                                            </>}
                                            {merchandise === 'BOAT' && <InventoryIcon material='BOAT' nation={'ROMANS'} />}
                                        </Button>
                                    )
                                })}
                            </div>
                        </>
                    }

                    {state === 'PRODUCTION' &&
                        <>
                            <ProductionAreaGraph statistics={statistics ?? sampleStatisticsData} material={materialToShow} setHover={setHoverInfo} />
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
                            <LandAreaGraph statistics={statistics ?? sampleStatisticsData} setHover={info => setHoverInfo(info)} />
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
                            <BuildingStatisticsGraph statistics={statistics ?? sampleStatisticsData} buildingType={selectedBuilding} setHover={setHoverInfo} />
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

type MerchandiseGraphProps = {
    statistics: StatisticsReply
    selectedMerchandise: Merchandise[]
    time: number
}

const MerchandiseGraph = ({ statistics, selectedMerchandise, time }: MerchandiseGraphProps) => {

    // Collect all unique timestamps
    const allTimestamps = new Set<number>()
    const latest = Math.max(time, statistics.currentTime)

    selectedMerchandise.forEach(category => {
        if (category in statistics.merchandise && statistics.merchandise[category]) {
            statistics.merchandise[category].forEach(([time]) => allTimestamps.add(time))
        }
    })

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in merchandise data
    selectedMerchandise.forEach(category => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = statistics.merchandise[category]?.find(([t]) => t === time)
            if (found) {
                lastValue = found[1]
            }
            entry[category] = lastValue // Carry forward last known value
        })
    })

    // Sort data by time to ensure correct visualization
    chartData.sort((a, b) => a.time - b.time)

    if (chartData.length > 0 && chartData[chartData.length - 1].time != statistics.currentTime) {
        chartData.push({ ...chartData[chartData.length - 1], time: latest })
    } else {
        const zeroMeasurement: { [key: string]: number } = {}

        MERCHANDISE_VALUES.forEach(category => {
            zeroMeasurement[category] = 0
        })

        chartData.unshift({ time: 0, ...zeroMeasurement })
        chartData.push({ time: latest, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis
                    dataKey="time"
                    label={{ value: "Time", position: 'insideBottom', offset: -5, fill: 'white' }}
                    stroke="#FFFFFF"
                    type="number"
                    domain={[0, 'dataMax']}
                />
                <YAxis
                    label={{ value: "Merchandise", angle: -90, position: 'insideLeft', fill: 'white' }}
                    stroke="#FFFFFF"
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']}
                />
                {MERCHANDISE_VALUES.map(category => (
                    <Line
                        key={category}
                        type="stepAfter"
                        dataKey={category}
                        name={category}
                        stroke={MERCHANDISE_STATS_COLORS[category] ?? 'black'}
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

const ProductionAreaGraph = ({ statistics, material, setHover }: ProductionAreaGraphProps) => {
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
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}
                onMouseMove={(event: { activePayload?: { value?: number }[] }) => {
                    if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }
                }}
            >
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis
                    dataKey="time"
                    label={{ value: "Time", position: "insideBottom", offset: -5, fill: "white" }}
                    stroke="#FFFFFF" // Change X-axis color
                    type="number"
                    domain={[0, 'dataMax']} // Set the domain to dataMin and dataMax

                />
                <YAxis
                    label={{ value: "Production", angle: -90, position: "insideLeft", fill: "white" }}
                    stroke="#FFFFFF" // Change Y-axis color
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']} // Set the domain to dataMin and dataMax
                />
                <Legend />
                {statistics.players.map((player) => (
                    <Line
                        key={player.id}
                        type="stepAfter" // Use step-based line rendering
                        dataKey={`Player ${player.id}`}
                        name={api.players.get(player.id)?.name ?? `Player ${player.id}`}
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

const BuildingStatisticsGraph = ({ statistics, buildingType, setHover }: BuildingStatisticsGraphProps) => {
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
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}
                onMouseMove={(event: { activePayload?: { value?: number }[] }) => {
                    if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }
                }}
            >
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
                <Legend />
                {statistics.players.map(player => (
                    <Line
                        key={player.id}
                        type="stepAfter"
                        dataKey={`Player ${player.id}`}
                        name={api.players.get(player.id)?.name ?? `Player ${player.id}`}
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

const LandAreaGraph = ({ statistics, setHover }: LandAreaGraphProps) => {
    // Collect all unique timestamps
    const allTimestamps = new Set<number>()
    statistics.players.forEach(player => {
        player.general.land.forEach(([time]) => allTimestamps.add(time))
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
            const found = player.general.land.find(([t]) => t === time)
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
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}
                onMouseMove={(event: { activePayload?: { value?: number }[] }) => {
                    if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }
                }}
            >
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
                <Legend />
                {statistics.players.map(player => (
                    <Line
                        key={player.id}
                        type="stepAfter" // Use step-based line rendering
                        dataKey={`Player ${player.id}`}
                        name={api.players.get(player.id)?.name ?? `Player ${player.id}`}
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

type GeneralStatisticsGraphProps = {
    statistics: StatisticsReply
    statType: GeneralStatisticsType
    selectedPlayers: PlayerId[]
    setHover: (info: string | undefined) => void
}

const GeneralStatisticsGraph = ({ statistics, statType, selectedPlayers, setHover }: GeneralStatisticsGraphProps) => {
    const allTimestamps = new Set<number>()
    statistics.players.filter(p => selectedPlayers.includes(p.id)).forEach(player => {
        player.general[statType]?.forEach(([time]) => allTimestamps.add(time))
    })

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    statistics.players.filter(p => selectedPlayers.includes(p.id)).forEach(player => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = player.general[statType]?.find(([t]) => t === time)
            if (found) lastValue = found[1]
            entry[`Player ${player.id}`] = lastValue
        })
    })

    if (chartData.length > 0 && chartData[chartData.length - 1].time !== statistics.currentTime) {
        chartData.push({ ...chartData[chartData.length - 1], time: statistics.currentTime })
    } else {
        const zeroMeasurement: { [key: string]: number } = {}
        statistics.players.filter(p => selectedPlayers.includes(p.id)).forEach(player => {
            zeroMeasurement[`Player ${player.id}`] = 0
        })
        chartData.push({ time: 0, ...zeroMeasurement })
        chartData.push({ time: statistics.currentTime, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}
                onMouseMove={(event: { activePayload?: { value?: number }[] }) => {
                    if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }
                }}
            >
                <CartesianGrid stroke="#444" strokeDasharray="2 2" fill="lightgray" />
                <XAxis dataKey="time" label={{ value: "Time", position: "insideBottom", offset: -5, fill: "white" }} stroke="#FFFFFF" type="number" domain={[0, 'dataMax']} />
                <YAxis label={{ value: statType, angle: -90, position: "insideLeft", fill: "white" }} stroke="#FFFFFF" domain={[0, 'dataMax + 1']} allowDecimals={false} />
                <Legend />
                {statistics.players.map(player => {
                    const playerColor: PlayerColor = api.players.get(player.id)?.color ?? 'BLUE'
                    const color = playerToColor(playerColor)

                    return (
                        <Line
                            key={player.id}
                            type="stepAfter"
                            dataKey={`Player ${player.id}`}
                            name={`Player ${player.id}`}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls
                        />
                    )
                })}
            </LineChart>
        </ResponsiveContainer>
    )
}

export default Statistics




