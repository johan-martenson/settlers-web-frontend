import React, { useMemo, useState } from 'react'
import { WindowWithTyping } from '../../components/dialog'
import './statistics.css'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { Nation, AnyBuilding, GeneralStatisticsType, Merchandise, MERCHANDISE_VALUES, PlayerColor, PlayerId, TOOLS, SOLDIERS, GOODS, WORKERS, PlayerInformation, SMALL_HOUSE_VALUES, MEDIUM_HOUSE_VALUES, LARGE_HOUSE_VALUES, GENERAL_STATISTICS_TYPES, StatisticsView, STATISTICS_VIEWS } from '../../api/types'
import { api } from '../../api/ws-api'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Label } from 'recharts'
import { StatisticsReply } from '../../api/ws/commands'
import { LivePlayerButton } from '../../components/player_icon/player_icon'
import { ItemContainer } from '../../components/item_container'
import { MouseHandlerDataParam } from 'recharts/types/synchronisation/types'
import { useStatistics, useTime } from '../../utils/hooks/hooks'
import { GenericCommand } from '../../utils/typing-commands'
import { buildingPretty, generalStatisticsTypePretty, materialPretty, merchandisePretty, playerToColor, statisticsViewPretty } from '../../utils/pretty_strings'
import { HouseIcon, InventoryIcon, UiIcon, UiIconType } from '../../components/icons/icon'

// Types
type StatisticsProps = {
    nation: Nation
    playerId: PlayerId
    onRaise: () => void
    onClose: () => void
}

type BuildingStatisticsGraphProps = {
    statistics: StatisticsReply
    buildingType: AnyBuilding
    selectedPlayers: PlayerId[]

    setHover: (info: string | undefined) => void
}

type ChartData = {
    time: number
    [key: string]: number | undefined
}

type MerchandiseGraphProps = {
    statistics: StatisticsReply
    selectedMerchandise: Merchandise[]
    time: number
}

type GeneralStatisticsGraphProps = {
    statistics: StatisticsReply
    statType: GeneralStatisticsType
    selectedPlayers: PlayerId[]
    time: number
    setHover: (info: string | undefined) => void
}


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
    'currentTime': 1,
    'merchandise': {
        'WOOD': [],
        'PLANK': [],
        'STONE': [],
        'FOOD': [],
        'WATER': [],
        'BEER': [],
        'COAL': [],
        'IRON': [],
        'GOLD': [],
        'IRON_BAR': [],
        'COIN': [],
        'TOOLS': [],
        'WEAPONS': [],
        'BOAT': [],
    },
    'players': []
}

// Sample data
const sampleStatisticsData: StatisticsReply = {
    'currentTime': 523,
    'merchandise': {
        'WOOD': [[1, 0], [23, 1]]
    },
    'players': [
        {
            'id': '1',
            'buildingStatistics': {
                'ForesterHut': [[1, 0], [23, 1]],
                'Woodcutter': [[1, 0], [10, 1], [50, 2]],
                'Sawmill': [[1, 0], [15, 1]],
                'Quarry': [[1, 0], [72, 1]],
                'Headquarter': [[1, 1]]
            },
            'general': {
                'houses': [[1, 1], [23, 2]],
                'workers': [[1, 23], [123, 30]],
                'goods': [],
                'military': [],
                'coins': [],
                'production': [],
                'killedEnemies': [],
                'land': [[1, 20], [15, 23], [120, 70], [230, 82]]
            }
        },
        {
            'id': '2',
            'buildingStatistics': {},
            'general': {
                'houses': [[1, 1]],
                'workers': [[1, 23], [17, 24], [52, 25], [110, 27], [200, 28], [233, 29]],
                'goods': [],
                'military': [],
                'coins': [],
                'production': [],
                'killedEnemies': [],
                'land': [[1, 20], [10, 20], [150, 90], [270, 92]]
            }
        }
    ]
}

// Functions
const getSelectedPlayers = (statistics: StatisticsReply, selectedPlayers: PlayerId[]) =>
    statistics.players.filter(player => selectedPlayers.includes(player.id))

const collectSortedTimestamps = (timestamps: number[]) =>
    [...new Set(timestamps)].sort((a, b) => a - b)

const fillSeriesWithCarryForward = (
    timestamps: number[],
    entries: [number, number][],
): (number | undefined)[] => {
    let lastValue: number | undefined = undefined

    return timestamps.map(time => {
        const found = entries.find(([t]) => t === time)
        if (found) lastValue = found[1]
        return lastValue
    })
}

const extendToTime = (
    chartData: ChartData[],
    targetTime: number
) => {
    if (chartData.length === 0) return

    const last = chartData[chartData.length - 1]

    if (last.time !== targetTime) {
        chartData.push({ ...last, time: targetTime })
    }
}

const buildZeroMeasurement = (keys: string[]) =>
    Object.fromEntries(keys.map(k => [k, 0]))

const renderPlayerLines = (
    players: PlayerInformation[],
    selectedPlayers: PlayerId[],
    getColor: (player: PlayerInformation, index: number) => string
) =>
    players
        .filter(player => selectedPlayers.includes(player.id))
        .map((player, index) => (
            <Line
                key={player.id}
                type='stepAfter'
                dataKey={`Player ${player.id}`}
                name={`Player ${player.id}`}
                stroke={getColor(player, index)}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
            />
        ))

const hoverHandlers = (setHover: (s?: string) => void, text?: string) => ({
    onMouseEnter: () => setHover(text),
    onMouseLeave: () => setHover(undefined)
})


// React components
/**
 * The Statistics component displays production and land statistics for players in the game.
 *
 * @param nation - The nation of the player
 * @param onRaise - Function to raise the window to the top
 * @param onClose - Function to close the window
 */
const Statistics: React.FC<StatisticsProps> = ({ nation, playerId, onRaise, onClose }: StatisticsProps) => {

    // State
    const [state, setState] = useState<StatisticsView>('GENERAL')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [buildingsView, setBuildingsView] = useState<'CURRENT' | 'HISTORICAL'>('CURRENT')
    const [selectedBuilding, setSelectedBuilding] = useState<AnyBuilding>('ForesterHut')
    const [generalStatistics, setGeneralStatistics] = useState<GeneralStatisticsType>('land')
    const [selectedMerchandise, setSelectedMerchandise] = useState<Merchandise[]>([])
    const [selectedPlayers, setSelectedPlayers] = useState<PlayerId[]>(Array.from(api.players.keys()))

    // Monitoring hooks
    const statistics = useStatistics(playerId)
    const time = useTime(20)

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<StatisticsView>>()

        STATISTICS_VIEWS.forEach(view => {
            cmds.set(`Show ${statisticsViewPretty(view)} statistics`, {
                action: () => setState(view)
            })
        })

        GENERAL_STATISTICS_TYPES.forEach(statsType => {
            cmds.set(`Show ${generalStatisticsTypePretty(statsType)} statistics`, {
                action: () => setGeneralStatistics(statsType),
                filter: (view: StatisticsView) => view === 'GENERAL' && generalStatistics !== statsType
            })
        })

        MERCHANDISE_VALUES.forEach(merchandise => {
            cmds.set(`Show ${merchandisePretty(merchandise)} statistics`, {
                action: () => setSelectedMerchandise(prev => [...prev, merchandise]),
                filter: (view: StatisticsView) => view === 'MERCHANDISE' && !selectedMerchandise.includes(merchandise)
            })

            cmds.set(`Hide ${merchandisePretty(merchandise)} statistics`, {
                action: () => setSelectedMerchandise(prev => prev.filter(merch => merch !== merchandise)),
                filter: (view: StatisticsView) => view === 'MERCHANDISE' && selectedMerchandise.includes(merchandise)
            })
        })

        api.players.forEach(player => {
            cmds.set(`Show statistics for ${player.name}`, {
                action: () => setSelectedPlayers(prev => [...prev, player.id]),
                filter: (view: StatisticsView) => view === 'GENERAL' && !selectedPlayers.includes(player.id)
            })

            cmds.set(`Hide statistics for ${player.name}`, {
                action: () => setSelectedPlayers(prev => prev.filter(playerId => playerId !== player.id)),
                filter: (view: StatisticsView) => view === 'GENERAL' && selectedPlayers.includes(player.id)
            })
        })

        cmds.set('Set player name', {
            type: 'STRING',
            action: (name: string, plupp: string) => console.log(name, plupp)
        })

        cmds.set('Set player age', {
            type: 'NUMBER',
            action: (context: string, age: number) => console.log(age)
        })

        cmds.set('Set color', {
            type: 'ENUM',
            values: ['red', 'green', 'blue'],
            action: (context: string, color: string) => console.log(color)
        })

        cmds.set('Close window',
            {
                action: () => onClose()
            }
        )

        return cmds
    }, [onClose, generalStatistics, selectedMerchandise, selectedPlayers])

    // Rendering
    const titleLabel = 'Statistics'

    return (<>
        <WindowWithTyping<StatisticsView>
            commands={commands}
            param={state}
            heading={titleLabel}
            onClose={onClose}
            hoverInfo={hoverInfo}
            onRaise={onRaise}
        >
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
                        {...hoverHandlers(setHoverInfo, 'General statistics')}
                    >
                        <UiIcon type='WREATH_ON_MAP' />
                    </Tab>
                    <Tab
                        value={'MERCHANDISE'}
                        {...hoverHandlers(setHoverInfo, 'Merchandise statistics')}
                    >
                        <UiIcon type='GOODS_ON_MAP' />
                    </Tab>
                    <Tab
                        value={'INVENTORY'}
                        onMouseEnter={() => setHoverInfo('Inventory')}
                    >
                        <UiIcon type='WORKERS_GOODS_AND_QUESTION_MARK' />
                    </Tab>
                    <Tab
                        value={'BUILDINGS'}
                        {...hoverHandlers(setHoverInfo, 'Buildings')}
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
                                    const selected = selectedPlayers.includes(player.id)

                                    return (
                                        <LivePlayerButton
                                            key={player.id}
                                            playerId={player.id}
                                            selected={selected}
                                            onClick={() => setSelectedPlayers(prev => prev.includes(player.id)
                                                ? prev.filter(p => p !== player.id)
                                                : [...prev, player.id]
                                            )}
                                            {...hoverHandlers(setHoverInfo, selected
                                                ? `Hide statistics for ${player.name}`
                                                : `Show statistics for ${player.name}`)}
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
                                            {...hoverHandlers(setHoverInfo, GENERAL_STATISTICS[stat]?.label)}
                                        >
                                            {uiIcon !== undefined && <UiIcon type={uiIcon} />}
                                        </Button>)
                                }
                                )}
                            </div>
                        </div>
                    </div>
                }

                {state === 'MERCHANDISE' &&
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
                                            : [...prev, merchandise as Merchandise])}
                                        {...hoverHandlers(setHoverInfo, `Show statistics for ${prettyMerchandise}`)}
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
                                {...hoverHandlers(setHoverInfo, `${materialPretty(material)}: 0`)}>
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
                                    {SMALL_HOUSE_VALUES.map(house => {
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
                                    {MEDIUM_HOUSE_VALUES.map(house => {
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
                                    {LARGE_HOUSE_VALUES.map(house => {
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
                                <BuildingStatisticsGraph
                                    statistics={statistics ?? sampleStatisticsData}
                                    buildingType={selectedBuilding} setHover={setHoverInfo}
                                    selectedPlayers={selectedPlayers}
                                />
                                Players:
                                <div>
                                    {Array.from(api.players.values()).map(player => {
                                        const selected = selectedPlayers.includes(player.id)

                                        return (
                                            <LivePlayerButton
                                                key={player.id}
                                                playerId={player.id}
                                                selected={selected}
                                                onClick={() => setSelectedPlayers(prev => prev.includes(player.id)
                                                    ? prev.filter(p => p !== player.id)
                                                    : [...prev, player.id]
                                                )}
                                                onMouseEnter={() => setHoverInfo(selected
                                                    ? `Hide statistics for ${player.name}`
                                                    : `Show statistics for ${player.name}`)}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            />
                                        )
                                    })}
                                </div>

                                {(() => {
                                    const housesContainer = (houseTypes: readonly AnyBuilding[]) => (
                                        <ItemContainer rows>
                                            {houseTypes.map(house => {
                                                const prettyHouse = buildingPretty(house).toLowerCase()
                                                const selected = selectedBuilding === house

                                                return (
                                                    <div
                                                        key={house}
                                                        style={{
                                                            borderBottomWidth: '2px',
                                                            borderBottomStyle: selected ? 'solid' : undefined,
                                                            borderBottomColor: 'lightblue'
                                                        }}
                                                        onClick={() => {
                                                            setSelectedBuilding(house)
                                                        }}
                                                        {...hoverHandlers(setHoverInfo, selected
                                                            ? `Hide statistics for ${prettyHouse}`
                                                            : `Show statistics for ${prettyHouse}`)}
                                                    >
                                                        <HouseIcon nation={nation} houseType={house} drawShadow scale={0.5} />
                                                    </div>)
                                            })}
                                        </ItemContainer>
                                    )

                                    return (<>
                                        <div>
                                            Small buildings
                                            {housesContainer(SMALL_HOUSE_VALUES)}
                                        </div>
                                        <div>
                                            Medium buildings
                                            {housesContainer(MEDIUM_HOUSE_VALUES)}
                                        </div>
                                        <div>
                                            Large buildings
                                            {housesContainer(LARGE_HOUSE_VALUES)}
                                        </div>
                                    </>)
                                })()}
                            </>
                        }
                    </>
                }
            </div>
        </WindowWithTyping>
    </>)
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
    const sortedTimestamps = collectSortedTimestamps(Array.from(allTimestamps))

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in merchandise data
    selectedMerchandise.forEach(category => {
        const values = fillSeriesWithCarryForward(
            sortedTimestamps,
            statistics.merchandise[category] ?? []
        )

        values.forEach((value, index) => {
            chartData[index][category] = value
        })
    })

    // Sort data by time to ensure correct visualization
    chartData.sort((a, b) => a.time - b.time)

    extendToTime(chartData, latest)

    if (chartData.length === 0) {
        const zeroMeasurement = buildZeroMeasurement(selectedMerchandise)

        selectedMerchandise.forEach(category => {
            zeroMeasurement[category] = 0
        })

        chartData.unshift({ time: 0, ...zeroMeasurement })
        chartData.push({ time: latest, ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width='100%' height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid stroke='#444' strokeDasharray='2 2' fill='lightgray' />
                <XAxis
                    dataKey='time'
                    label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: 'white' }}
                    stroke='#FFFFFF'
                    type='number'
                    domain={[0, 'dataMax']}
                />
                <YAxis
                    label={{ value: 'Merchandise', angle: -90, position: 'insideLeft', fill: 'white' }}
                    stroke='#FFFFFF'
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']}
                />
                {selectedMerchandise.map(category => (
                    <Line
                        key={category}
                        type='stepAfter'
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

const BuildingStatisticsGraph = ({ statistics, buildingType, selectedPlayers, setHover }: BuildingStatisticsGraphProps) => {
    const selectedPlayerStatistics = getSelectedPlayers(statistics, selectedPlayers)

    // Collect all unique timestamps and sort them
    const sortedTimestamps = collectSortedTimestamps(selectedPlayerStatistics.flatMap(
        player => player.buildingStatistics[buildingType]?.map(([time]) => time) ?? []
    ))

    // Initialize chart data with all timestamps
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // Fill in player data
    selectedPlayerStatistics.forEach(player => {
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const data = player.buildingStatistics[buildingType]?.find(([t]) => t === time)

            entry[`Player ${player.id}`] = data?.[1]
        })
    })

    // Add an initial empty value if the chart data array is empty
    if (chartData.length === 0) {
        chartData.push({
            time: 0,
            ...Object.fromEntries(selectedPlayerStatistics.map(player => [`Player ${player.id}`, 0])),
        })
    }

    // Put in a measurement for the current time if it's missing
    extendToTime(chartData, statistics.currentTime)

    return (
        <ResponsiveContainer width='100%' height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}

                // eslint-disable-next-line
                onMouseMove={(event: MouseHandlerDataParam) => {
                    /*if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }*/
                }}
            >
                <CartesianGrid stroke='#444' strokeDasharray='2 2' fill='lightgray' />
                <XAxis
                    dataKey='time'
                    label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: 'white' }}
                    stroke='#FFFFFF'
                    type='number'
                    domain={[0, 'dataMax']}
                />
                <YAxis
                    label={{ value: 'Buildings', angle: -90, position: 'insideLeft', fill: 'white' }}
                    stroke='#FFFFFF'
                    domain={[0, 'dataMax + 1']} // Set the domain to dataMin and dataMax
                    allowDecimals={false}
                />
                {statistics.players
                    .filter(playerId => selectedPlayers.includes(playerId.id))
                    .map(player => (
                        <Line
                            key={player.id}
                            type='stepAfter'
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

const GeneralStatisticsGraph = ({ statistics, statType, selectedPlayers: selectedPlayerIds, time, setHover }: GeneralStatisticsGraphProps) => {

    // Collect all unique timestamps where selected players have data for the current stat type
    const allTimestamps = new Set<number>()

    const selectedPlayerStatistics = getSelectedPlayers(statistics, selectedPlayerIds)

    selectedPlayerStatistics.forEach(player => {
        player.general[statType]?.forEach(([time]) => allTimestamps.add(time))
    })

    // Sort timestamps chronologically and initialize chart data with time-only entries
    const sortedTimestamps = collectSortedTimestamps([...allTimestamps])
    const chartData: ChartData[] = sortedTimestamps.map(time => ({ time }))

    // For each selected player, fill the chartData with the most recent known value at each timestamp
    selectedPlayerStatistics.forEach(player => {
        let lastValue: number | undefined = undefined
        sortedTimestamps.forEach((time, index) => {
            const entry = chartData[index]
            const found = player.general[statType]?.find(([t]) => t === time)
            if (found) lastValue = found[1]
            entry[`Player ${player.id}`] = lastValue
        })
    })

    // Extend chart data to current time if it’s not already included
    extendToTime(chartData, statistics.currentTime)

    // Handle case where there’s no data: add zero-filled placeholders from time 0 to max time
    if (chartData.length === 0) {
        const zeroMeasurement = buildZeroMeasurement(selectedPlayerStatistics.map(player => `Player ${player.id}`))
        selectedPlayerStatistics.forEach(player => {
            zeroMeasurement[`Player ${player.id}`] = 0
        })
        chartData.push({ time: 0, ...zeroMeasurement })
        chartData.push({ time: Math.max(time, statistics.currentTime), ...zeroMeasurement })
    }

    return (
        <ResponsiveContainer width='100%' height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={() => setHover(undefined)}

                // eslint-disable-next-line
                onMouseMove={(event: MouseHandlerDataParam) => {
                    /*if (event?.activePayload) {
                        const yValue = event.activePayload[0]?.value

                        if (yValue !== undefined) {
                            setHover(`${yValue}`)
                        } else {
                            setHover(undefined)
                        }
                    }*/
                }}
            >
                <CartesianGrid stroke='#444' strokeDasharray='2 2' fill='lightgray' />
                <XAxis dataKey='time' stroke='#FFFFFF' type='number' domain={[0, 'dataMax']}>
                    <Label value='Time' position='bottom' offset={-5} fill='white' style={{ textTransform: 'capitalize' }} />
                </XAxis>
                <YAxis stroke='#FFFFFF' domain={[0, 'dataMax + 1']} allowDecimals={false}>
                    <Label angle={-90} value={statType} position='left' offset={-5} fill='white' style={{ textTransform: 'capitalize' }} />
                </YAxis>

                {statistics.players
                    .filter(playerId => selectedPlayerIds.includes(playerId.id))
                    .map(player => {
                        const playerColor: PlayerColor = api.players.get(player.id)?.color ?? 'BLUE'
                        const color = playerToColor(playerColor)

                        return (
                            <Line
                                key={player.id}
                                type='linear'
                                dataKey={`Player ${player.id}`}
                                name={`Player ${player.id}`}
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                connectNulls
                            />
                        )
                    })}
            </LineChart>
        </ResponsiveContainer>
    )
}

export default Statistics
