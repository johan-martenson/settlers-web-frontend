import React, { useState, useEffect } from 'react'
import { Window } from '../../components/dialog'
import './statistics.css'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { Nation, AnyBuilding, SMALL_HOUSES, GeneralStatisticsType, Merchandise, MERCHANDISE_VALUES, PlayerColor, PlayerId, TOOLS, SOLDIERS, GOODS, WORKERS, MEDIUM_HOUSES, LARGE_HOUSES } from '../../api/types'
import { HouseIcon, InventoryIcon, UiIcon, UiIconType } from '../../icons/icon'
import { api } from '../../api/ws-api'
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, CartesianGrid } from "recharts"
import { StatisticsReply } from '../../api/ws/commands'
import { buildingPretty, materialPretty, merchandisePretty, playerToColor } from '../../pretty_strings'
import PlayerButton from '../../components/player_button'
import { ItemContainer } from '../../components/item_container'

// Types
type StatisticsProps = {
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type BuildingStatisticsGraphProps = {
    statistics: StatisticsReply
    buildingType: AnyBuilding

    setHover: (info: string | undefined) => void
}

type StatisticsView = 'GENERAL' | 'MERCHANDISE' | 'INVENTORY' | 'BUILDINGS'

// Constants
const GENERAL_STATISTICS_LABELS: GeneralStatisticsType[] = ['land', 'production', 'workers', 'houses', 'goods', 'coins', 'military', 'killedEnemies']

const GENERAL_STATISTICS_UI_ICONS: Map<GeneralStatisticsType, UiIconType> = new Map([
    ['land', 'MAP_WITH_QUESTION_MARK'],
    ['production', 'GEARS_WITH_QUESTION_MARK'],
    ['workers', 'WORKERS_WITH_QUESTION_MARK'],
    ['houses', 'BUILDINGS_WITH_QUESTION_MARK'],
    ['goods', 'GOODS_WITH_QUESTION_MARK'],
    ['coins', 'COINS_WITH_QUESTION_MARK'],
    ['military', 'GENERAL_WITH_QUESTION_MARK'],
    ['killedEnemies', 'ANGEL_WITH_QUESTION_MARK']
])

const GENERAL_STATISTICS: { [key in GeneralStatisticsType]?: { label: string, color: string } } = {
    'land': { label: 'Land', color: '#1E88E5' },
    'production': { label: 'Production', color: '#D32F2F' },
    'workers': { label: 'Workers', color: '#FFB300' },
    'houses': { label: 'Houses', color: '#00897B' },
    'goods': { label: 'Goods', color: '#673AB7' },
    'coins': { label: 'Coins', color: '#F57C00' },
    'military': { label: 'Military', color: '#7CB342' },
    'killedEnemies': { label: 'Killed Enemies', color: '#757575' }
}

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
    const [state, setState] = useState<StatisticsView>('GENERAL')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [buildingsView, setBuildingsView] = useState<'CURRENT' | 'HISTORICAL'>('CURRENT')
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
                            if (data.value === 'INVENTORY') {
                                setState('INVENTORY')
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
                            <UiIcon type='WREATH_ON_MAP' />
                        </Tab>
                        <Tab
                            value={'MERCHANDISE'}
                            onMouseEnter={() => setHoverInfo('Merchandise statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <UiIcon type='GOODS_ON_MAP' />
                        </Tab>
                        <Tab
                            value={'INVENTORY'}
                            onMouseEnter={() => setHoverInfo('Inventory')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <UiIcon type='WORKERS_GOODS_AND_QUESTION_MARK' />
                        </Tab>
                        <Tab
                            value={'BUILDINGS'}
                            onMouseEnter={() => setHoverInfo('Building statistics')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <UiIcon type='HOUSE_ON_MAP' />
                        </Tab>
                    </TabList>

                    {state === 'GENERAL' &&
                        <div style={{ rowGap: '1em', display: 'flex', flexDirection: 'column' }}>
                            <GeneralStatisticsGraph
                                statistics={statistics}
                                statType={generalStatistics}
                                setHover={setHoverInfo}
                                selectedPlayers={selectedPlayers}
                                time={time}
                            />
                            <div>
                                Players:
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
                            </div>
                            <div>
                                Available statistics:
                                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5em' }}>
                                    {GENERAL_STATISTICS_LABELS.map(stat => {
                                        const uiIcon = GENERAL_STATISTICS_UI_ICONS.get(stat)

                                        return (
                                            <Button
                                                key={stat}
                                                style={{ backgroundColor: generalStatistics === stat ? 'lightblue' : undefined }}
                                                onClick={() => setGeneralStatistics(stat)}
                                                onMouseEnter={() => setHoverInfo(GENERAL_STATISTICS[stat]?.label)}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            >
                                                {uiIcon !== undefined && <UiIcon type={uiIcon} />}
                                            </Button>)
                                    }
                                    )}
                                </div>
                            </div>
                        </div>
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
                                            {merchandise === 'WOOD' && <InventoryIcon material='WOOD' nation={nation} />}
                                            {merchandise === 'PLANK' && <InventoryIcon material='PLANK' nation={nation} />}
                                            {merchandise === 'STONE' && <InventoryIcon material='STONE' nation={nation} />}
                                            {merchandise === 'FOOD' && <UiIcon type='FOOD' scale={0.4} />}
                                            {merchandise === 'WATER' && <InventoryIcon material='WATER' nation={nation} />}
                                            {merchandise === 'BEER' && <InventoryIcon material='BEER' nation={nation} />}
                                            {merchandise === 'COAL' && <InventoryIcon material='COAL' nation={nation} />}
                                            {merchandise === 'IRON' && <InventoryIcon material='IRON' nation={nation} />}
                                            {merchandise === 'GOLD' && <InventoryIcon material='GOLD' nation={nation} />}
                                            {merchandise === 'IRON_BAR' && <InventoryIcon material='IRON_BAR' nation={nation} />}
                                            {merchandise === 'COIN' && <InventoryIcon material='COIN' nation={nation} />}
                                            {merchandise === 'TOOLS' && <InventoryIcon material='TONGS' nation={nation} />}
                                            {merchandise === 'WEAPONS' && <UiIcon type='WEAPONS_MOVING' scale={0.4} />}
                                            {merchandise === 'BOAT' && <InventoryIcon material='BOAT' nation={nation} />}
                                        </Button>
                                    )
                                })}
                            </div>
                        </>
                    }

                    {state === 'INVENTORY' && <div>
                        <div>
                            Goods

                            <div className='inventory-item-list' style={{ height: '10em' }}>
                                {Array.from(GOODS).map(material =>
                                (<div
                                    key={material}
                                    onMouseEnter={() => setHoverInfo(`${materialPretty(material)}: 0`)}
                                    onMouseLeave={() => setHoverInfo(undefined)}>
                                    <InventoryIcon material={material} nation={nation} scale={1} inline /> 0
                                </div>))}
                            </div>
                        </div>
                        <div>
                            Tools

                            <div className='inventory-item-list'>
                                {Array.from(TOOLS).map(tool =>
                                (<div
                                    key={tool}
                                    onMouseEnter={() => setHoverInfo(`${materialPretty(tool)}: 0`)}
                                    onMouseLeave={() => setHoverInfo(undefined)}>
                                    <InventoryIcon material={tool} nation={nation} scale={1} inline /> 0
                                </div>))}
                            </div>
                        </div>
                        <div>
                            Workers

                            <div className='inventory-item-list' style={{ height: '15em' }}>
                                {Array.from(WORKERS).map(worker =>
                                (<div
                                    key={worker}
                                    onMouseEnter={() => setHoverInfo(`${materialPretty(worker)}: 0`)}
                                    onMouseLeave={() => setHoverInfo(undefined)}>
                                    <InventoryIcon material={worker} nation={nation} scale={1} inline /> 0
                                </div>))}
                            </div>
                        </div>
                        <div>
                            Soldiers

                            <div className='inventory-item-list' style={{ height: '6em' }}>
                                {(SOLDIERS).map(soldier =>
                                (<div
                                    key={soldier}
                                    onMouseEnter={() => setHoverInfo(`${materialPretty(soldier)}: 0`)}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    <InventoryIcon material={soldier} nation={nation} scale={1} inline />: 0
                                </div>))}
                            </div>
                        </div>

                    </div>}

                    {state === 'BUILDINGS' &&
                        <>
                            <TabList
                                selectedValue={buildingsView}
                                onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                                    if (data.value === 'CURRENT') {
                                        setBuildingsView('CURRENT')
                                    } else if (data.value === 'HISTORICAL') {
                                        setBuildingsView('HISTORICAL')
                                    }
                                }}>
                                <Tab
                                    value={'CURRENT'}
                                    onMouseEnter={() => setHoverInfo('Current buildings')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Current
                                </Tab>
                                <Tab
                                    value={'HISTORICAL'}
                                    onMouseEnter={() => setHoverInfo('Historical buildings')}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    Historical
                                </Tab>
                            </TabList>

                            {buildingsView === 'CURRENT' && <>
                                <div>
                                    Small buildings

                                    <ItemContainer height='15em' rows>
                                        {SMALL_HOUSES.map(house => {
                                            return (
                                                <div
                                                    key={house}
                                                    onMouseEnter={() => setHoverInfo(`${house}: 0 under construction, 0 ready`)}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <HouseIcon houseType={house} nation={nation} scale={0.5} /> 0 / 0
                                                </div>)
                                        })}
                                    </ItemContainer>
                                </div>

                                <div>
                                    Medium buildings

                                    <ItemContainer height='15em'>
                                        {MEDIUM_HOUSES.map(house => {
                                            return (
                                                <div
                                                    key={house}
                                                    onMouseEnter={() => setHoverInfo(`${house}: 0 under construction, 0 ready`)}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <HouseIcon houseType={house} nation={nation} scale={0.5} /> 0 / 0
                                                </div>)
                                        })}
                                    </ItemContainer>
                                </div>


                                <div>
                                    Large buildings

                                    <ItemContainer height='10em'>
                                        {LARGE_HOUSES.map(house => {
                                            return (
                                                <div
                                                    key={house}
                                                    onMouseEnter={() => setHoverInfo(`${house}: 0 under construction, 0 ready`)}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <HouseIcon houseType={house} nation={nation} scale={0.5} /> 0 / 0
                                                </div>)
                                        })}
                                    </ItemContainer>
                                </div>
                            </>}

                            {buildingsView === 'HISTORICAL' &&
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
                                </>}
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

type GeneralStatisticsGraphProps = {
    statistics: StatisticsReply
    statType: GeneralStatisticsType
    selectedPlayers: PlayerId[]
    time: number
    setHover: (info: string | undefined) => void
}

const GeneralStatisticsGraph = ({ statistics, statType, selectedPlayers, time, setHover }: GeneralStatisticsGraphProps) => {
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
        chartData.push({ time: Math.max(time, statistics.currentTime), ...zeroMeasurement })
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




