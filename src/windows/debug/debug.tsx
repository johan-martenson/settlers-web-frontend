import React, { useEffect, useMemo, useState } from 'react'
import { AnyBuilding, FlagDebugInfo, FlagId, GameInformation, HouseId, HOUSES, isWorker, Nation, NATIONS, PlayerId, Point, PointInformation, TREE_TYPES, TreeId, TreeType, WORKER_TYPES, WorkerId, WorkerType } from '../../api/types'
import { api } from '../../api/ws-api'
import './debug.css'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from '@fluentui/react-components'
import { VEGETATION } from './translate'
import { WindowWithTyping } from '../../components/dialog'
import Selector from './select'
import { DebugLogsTable } from '../../components/log_configuration/log_configuration'
import { HouseTable } from '../../components/house_table/house_table'
import { UiIcon } from '../../components/icons/icon'

// Types
type DebugProps = {
    point: Point

    onGoToPoint: (point: Point) => void
    onRaise: () => void
    onClose: () => void
}

type HouseFilter = {
    types: AnyBuilding[]
    nations: Nation[]
    players: PlayerId[]
}

type FlagFilter = {
    nations: Nation[]
    players: PlayerId[]
    hasStackedCargo?: boolean
}

type TreeFilter = {
    types: TreeType[]
}

type WorkerFilter = {
    types: WorkerType[]
    players: PlayerId[]
    nations: Nation[]
}

// React components
function Value({ children }: { children?: React.ReactNode }) {
    return (
        <div className='value'><span>{children}</span></div>
    )
}

function Debug({ point, onGoToPoint, onClose, onRaise }: DebugProps) {

    // State
    const [openSections, setOpenSections] = useState<string[]>([])
    const [flagInformation, setFlagInformation] = useState<FlagDebugInfo>()
    const [pointInformation, setPointInformation] = useState<PointInformation>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()
    const [houseFilter, setHouseFilter] = useState<HouseFilter>({ types: [], nations: [], players: [] })
    const [flagFilter, setFlagFilter] = useState<FlagFilter>({ nations: [], players: [] })
    const [treeFilter, setTreeFilter] = useState<TreeFilter>({ types: [] })
    const [workerFilter, setWorkerFilter] = useState<WorkerFilter>({ types: [], nations: [], players: [] })

    // Effects
    useEffect(
        () => {
            (async () => {
                console.log(point)
                const pointInformation = await api.getInformationOnPoint(point)
                setPointInformation(pointInformation)

                const gameInformation = await api.getGameInformation()
                console.log(gameInformation)
                setGameInformation(gameInformation)

                if (pointInformation?.is === 'FLAG') {
                    const flagInformation = await api.getFlagDebugInfo(pointInformation.flagId)
                    console.log(flagInformation)
                    setFlagInformation(flagInformation)
                }
            })()
        }, [point.x, point.y, point]
    )

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map()

        cmds.set('Close window', {
            action: () => onClose()
        })

        cmds.set('Game', {
            action: () => setOpenSections(['1'])
        })

        cmds.set('Map', {
            action: () => setOpenSections(['2'])
        })

        cmds.set('Players', {
            action: () => setOpenSections(['3'])
        })

        cmds.set('Debug logs', {
            action: () => setOpenSections(['4'])
        })

        cmds.set('Point', {
            action: () => setOpenSections(['5'])
        })

        cmds.set('Monitored world', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Houses', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Trees', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Flags', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Workers', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Decorations', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Crops', {
            action: () => setOpenSections(['6'])
        })

        cmds.set('Clear filters', {
            action: () => {
                setHouseFilter({
                    types: [],
                    nations: [],
                    players: []
                })

                setFlagFilter({
                    nations: [],
                    players: []
                })

                setTreeFilter({
                    types: []
                })

                setWorkerFilter({
                    types: [],
                    nations: [],
                    players: []
                })
            }
        })

        cmds.set('Go to selected building', {
            action: () => {
                if (
                    pointInformation?.is === 'BUILDING'
                    && pointInformation.buildingId !== undefined
                ) {
                    const house = api.houses.get(
                        pointInformation.buildingId
                    )

                    if (house) {
                        onGoToPoint(house)
                    }
                }
            },
            filter: () =>
                pointInformation?.is === 'BUILDING'
        })

        cmds.set('Go to selected flag', {
            action: () => {
                if (
                    pointInformation?.is === 'FLAG'
                    && pointInformation.flagId !== undefined
                ) {
                    const flag = api.flags.get(
                        pointInformation.flagId
                    )

                    if (flag) {
                        onGoToPoint(flag)
                    }
                }
            },
            filter: () =>
                pointInformation?.is === 'FLAG'
        })

        cmds.set('Go to selected tree', {
            action: () => {
                const tree = Array.from(api.trees.values())
                    .find(tree =>
                        tree.x === point.x
                        && tree.y === point.y
                    )

                if (tree) {
                    onGoToPoint(tree)
                }
            },
            filter: () =>
                Array.from(api.trees.values())
                    .some(tree =>
                        tree.x === point.x
                        && tree.y === point.y
                    )
        })

        cmds.set('Go to house', {
            type: 'STRING',
            parameterName: 'id',
            action: (_context: unknown, id: HouseId) => {
                const house = api.houses.get(id)

                if (house) {
                    onGoToPoint(house)
                }
            }
        })

        cmds.set('Go to flag', {
            type: 'STRING',
            parameterName: 'id',
            action: (_context: unknown, id: FlagId) => {
                const flag = api.flags.get(id)

                if (flag) {
                    onGoToPoint(flag)
                }
            }
        })

        cmds.set('Go to worker', {
            type: 'STRING',
            parameterName: 'id',
            action: (_context: unknown, id: WorkerId) => {
                const worker = api.workers.get(id)

                if (worker) {
                    onGoToPoint(worker)
                }
            }
        })

        cmds.set('Go to tree', {
            type: 'STRING',
            parameterName: 'id',
            action: (_context: unknown, id: TreeId) => {
                const tree = Array.from(api.trees.values())
                    .find(tree => tree.id === id)

                if (tree) {
                    onGoToPoint(tree)
                }
            }
        })

        cmds.set('House type', {
            type: 'ENUM',
            parameterName: 'type',
            values: Array.from(HOUSES),
            action: (_context: unknown, houseType: AnyBuilding) => {
                setOpenSections(['6'])

                setHouseFilter(prev => ({
                    ...prev,
                    types: [houseType]
                }))
            }
        })

        cmds.set('Tree type', {
            type: 'ENUM',
            parameterName: 'type',
            values: Array.from(TREE_TYPES),
            action: (_context: unknown, treeType: TreeType) => {
                setOpenSections(['6'])

                setTreeFilter({
                    types: [treeType]
                })
            }
        })

        return cmds
    }, [
        onClose,
        onGoToPoint,
        point.x,
        point.y,
        pointInformation
    ])

    // Rendering
    const vegetationBelow = api.allTiles.get(point)?.below
    const vegetationDownRight = api.allTiles.get(point)?.downRight
    const tree = Array.from(api.trees.values()).find(tree => tree.x === point.x && tree.y === point.y)

    return (<WindowWithTyping<PointInformation>
        commands={commands}
        param={pointInformation}
        className='debug-window'
        heading='Debug'
        onClose={onClose}
        onRaise={onRaise}
        width={'60em'}
    >
        <div className='debug-window-contents'>

            <Accordion
                multiple
                openItems={openSections}
                onToggle={(_event, data) => setOpenSections(data.openItems as string[])}
            >

                <AccordionItem value='1'>
                    <AccordionHeader>Game</AccordionHeader>
                    <AccordionPanel>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div>Game id: <Value>{api.gameId}</Value></div>
                        </div>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem value='2'>
                    <AccordionHeader>Map</AccordionHeader>
                    <AccordionPanel>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div>Id: <Value>{gameInformation?.map.id}</Value></div>
                            <div>Name: <Value>{gameInformation?.map.name}</Value></div>
                            <div>Author: <Value>{gameInformation?.map.author}</Value></div>
                            <div>Size: <Value>{gameInformation?.map.width}</Value>x<Value>{gameInformation?.map.height}</Value></div>
                            <div>Max players: <Value>{gameInformation?.map.maxPlayers}</Value></div>
                        </div>

                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem value='3'>
                    <AccordionHeader>Players</AccordionHeader>
                    <AccordionPanel>
                        <div className='players-list'>
                            {Array.from(
                                api.players, ([playerId, playerInformation]) => (
                                    <div key={playerId}>
                                        Name: <Value>{playerInformation.name}</Value>, nation: <Value>{playerInformation.nation}</Value>, id: <Value>{playerInformation.id}</Value>,
                                        <a href={`/?gameId=${api.gameId}&playerId=${playerId}`} >Play as</a>
                                    </div>
                                ))}
                        </div>

                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem value='4'>
                    <AccordionHeader>Debug logs</AccordionHeader>
                    <AccordionPanel>
                        <DebugLogsTable />
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem value='5'>
                    <AccordionHeader>Point</AccordionHeader>
                    <AccordionPanel>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div>Point (x, y, z): <Value>{point.x}, {point.y}, {api.getHeight(point)}</Value></div>
                            <div>Tile below: <Value>{api.allTiles.get(point)?.below}</Value> (<Value>{vegetationBelow !== undefined && VEGETATION.get(vegetationBelow)}</Value>)</div>
                            <div>Tile down-right: <Value>{api.allTiles.get(point)?.downRight}</Value> (<Value>{vegetationDownRight !== undefined && VEGETATION.get(vegetationDownRight)}</Value>)</div>

                            {flagInformation &&
                                <>
                                    <h2>Flag</h2>
                                    {flagInformation.cargos.map((cargo, index) => (
                                        <div key={index}>
                                            <Value>{cargo.material}</Value> to <Value>{cargo.targetType}</Value> at <Value>({cargo.target.x}, {cargo.target.y})</Value>
                                        </div>
                                    ))}
                                </>
                            }

                            {pointInformation?.is === 'BUILDING' &&
                                <div>Building: <Value>{JSON.stringify(api.houses.get(pointInformation.buildingId), null, 2)}</Value></div>
                            }

                            <div>Can build: {pointInformation?.canBuild.map((build, index) => <Value key={index}>{build}</Value>)}</div>

                            {api.decorations.has(point) &&
                                <div>Decoration: <Value>{api.decorations.get(point)?.decoration ?? ''}</Value></div>
                            }

                            {tree &&
                                <div>Tree
                                    <div>Id: <Value>{tree.id}</Value></div>
                                    <div>Type: <Value>{tree.type}</Value></div>
                                    <div>Size: <Value>{tree.size}</Value></div>
                                </div>
                            }
                        </div>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem value='6'>
                    <AccordionHeader>Monitored world</AccordionHeader>
                    <AccordionPanel>
                        <div className='monitored-world' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <details>
                                <summary>Crops</summary>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    {Array.from(api.crops.entries()).map(cropEntry => {
                                        const crop = cropEntry[1]
                                        return (
                                            <div key={crop.id}>
                                                Id: <Value>{crop.id}</Value>
                                                Point: <Value>({crop.x}, {crop.y})</Value>
                                                Growth: <Value>{crop.state}</Value> (<Value>{crop.growth}</Value>)
                                                Crop type: <Value>{crop.type}</Value>
                                            </div>)
                                    })}
                                </div>
                            </details>

                            <details>
                                <summary>Trees</summary>
                                <div>
                                    <Selector label='Select tree types' items={Array.from(TREE_TYPES)} onSelectedItems={types => setTreeFilter(prev => ({ ...prev, types }))} />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        {Array.from(api.trees.values())
                                            .filter(tree => treeFilter.types.length === 0 || treeFilter.types.includes(tree.type))
                                            .map(tree => <div key={tree.id}>Id: <Value>{tree.id}</Value>, point: <Value>{tree.x},{tree.y}</Value>, type: <Value>{tree.type}</Value>, size: <Value>{tree.size}</Value>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(tree)} />
                                            </div>)}
                                    </div>
                                </div>
                            </details>

                            <details>
                                <summary>Houses</summary>
                                <div>
                                    <Selector label='Select house types' items={Array.from(HOUSES)} onSelectedItems={types => setHouseFilter(prev => ({ ...prev, types }))} />
                                    <Selector label='Select nations' items={Array.from(NATIONS.values())} onSelectedItems={nations => setHouseFilter(prev => ({ ...prev, nations }))} />

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <HouseTable
                                            houses={Array.from(api.houses.values())
                                                .filter(house => houseFilter.types.length === 0 || houseFilter.types.includes(house.type))
                                                .filter(house => houseFilter.nations.length === 0 || houseFilter.nations.includes(house.nation))}
                                            goToPoint={onGoToPoint} />
                                    </div>
                                </div>
                            </details>

                            <details>
                                <summary>Decorations</summary>
                                <div>
                                    {Array.from(api.decorations.entries()).map(decoration => <div key={`${decoration[0].x},${decoration[0].y}`}>{JSON.stringify(decoration[1])}</div>)}
                                </div>
                            </details>

                            <details>
                                <summary>Flags</summary>
                                <div>
                                    <Selector label='Select players' items={Array.from(api.players.keys())} onSelectedItems={players => setFlagFilter(prev => ({ ...prev, players }))} />
                                    <Selector label='Select nations' items={Array.from(NATIONS.values())} onSelectedItems={nations => setFlagFilter(prev => ({ ...prev, nations }))} />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        {Array.from(api.flags.values())
                                            .filter(flag => flagFilter.nations.length === 0 || flagFilter.nations.includes(flag.nation))
                                            .filter(flag => flagFilter.players.length === 0 || flagFilter.players.includes(flag.playerId))
                                            .map(flag => <div key={flag.id}><Value>{flag.id}</Value> <Value>{flag.x},{flag.y}</Value> <Value>{flag.playerId}</Value> <Value>{flag.nation}</Value>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(flag)} />
                                            </div>)}
                                    </div>
                                </div>
                            </details>

                            <details>
                                <summary>Players</summary>
                                <div>
                                    {Array.from(api.players.values()).map(player => <div key={player.id}>{JSON.stringify(player)}</div>)}
                                </div>
                            </details>

                            <details>
                                <summary>Workers</summary>
                                <div>
                                    <Selector items={Array.from(WORKER_TYPES)} label='Select worker types' onSelectedItems={types => setWorkerFilter(prev => ({ ...prev, types }))} />

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        {Array.from(api.workers.values())
                                            .filter(worker => workerFilter.types.length === 0 || workerFilter.types.includes(worker.type))
                                            .filter(worker => workerFilter.nations.length === 0 || workerFilter.nations.includes(worker.nation))
                                            .map(worker => <div key={worker.id}><Value>{worker.id}</Value> <Value>{worker.type}</Value> <Value>{worker.nation}</Value>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(worker)} />
                                            </div>)}
                                    </div>
                                </div>
                            </details>
                        </div>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </div>
    </WindowWithTyping >)
}

export {
    Debug,
    Value
}