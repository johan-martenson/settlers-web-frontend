import React, { useEffect, useState } from 'react'
import { AnyBuilding, FlagDebugInfo, GameInformation, HOUSES, Nation, NATIONS, PlayerId, Point, PointInformation, TREE_TYPES, TreeType, WORKER_TYPES, WorkerType } from '../../api/types'
import { api, wsApiDebugSettings } from '../../api/ws-api'
import './debug.css'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Field, Switch } from '@fluentui/react-components'
import { VEGETATION } from './translate'
import { Window } from '../../components/dialog'
import { glUtilsDebug } from '../../render/utils'
import { wsApiCoreDebugSettings } from '../../api/ws/core'
import Selector from './select'
import { UiIcon } from '../../icons/icon'

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
    const [flagInformation, setFlagInformation] = useState<FlagDebugInfo>()
    const [pointInformation, setPointInformation] = useState<PointInformation>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()
    const [wsApiReceiveDebug, setWsApiReceiveDebug] = useState<boolean>(wsApiCoreDebugSettings.receive)
    const [wsApiSendDebug, setWsApiSendDebug] = useState<boolean>(wsApiCoreDebugSettings.send)
    const [glUtilsDebugSetBuffer, setGlUtilsDebugSetBuffer] = useState<boolean>(glUtilsDebug.setBuffer)
    const [glUtilsDebugDraw, setGlUtilsDebugDraw] = useState<boolean>(glUtilsDebug.draw)
    const [glUtilsDebugInitProgram, setGlUtilsDebugInitProgram] = useState<boolean>(glUtilsDebug.initProgram)
    const [houseFilter, setHouseFilter] = useState<HouseFilter>({ types: [], nations: [], players: [] })
    const [flagFilter, setFlagFilter] = useState<FlagFilter>({ nations: [], players: [] })
    const [treeFilter, setTreeFilter] = useState<TreeFilter>({ types: [] })
    const [workerFilter, setWorkerFilter] = useState<WorkerFilter>({ types: [], nations: [], players: [] })

    useEffect(
        () => {
            wsApiCoreDebugSettings.receive = wsApiReceiveDebug
            wsApiCoreDebugSettings.send = wsApiSendDebug
            wsApiDebugSettings.receive = wsApiReceiveDebug
        }, [wsApiReceiveDebug, wsApiSendDebug]
    )

    useEffect(
        () => {
            glUtilsDebug.setBuffer = glUtilsDebugSetBuffer
            glUtilsDebug.draw = glUtilsDebugDraw
            glUtilsDebug.initProgram = glUtilsDebugInitProgram
        }, [glUtilsDebugSetBuffer, glUtilsDebugDraw, glUtilsDebugInitProgram]
    )

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

    const vegetationBelow = api.allTiles.get(point)?.below
    const vegetationDownRight = api.allTiles.get(point)?.downRight
    const tree = Array.from(api.trees.values()).find(tree => tree.x === point.x && tree.y === point.y)

    return (<Window className='debug-window' heading='Debug' onClose={onClose} onRaise={onRaise} width={'60em'}>
        <Accordion multiple>

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
                    <div className='debug-logs'>
                        <Field label='WS API receive'>
                            <Switch checked={wsApiReceiveDebug} onChange={() => setWsApiReceiveDebug(prev => !prev)} />
                        </Field>
                        <Field label='WS API send'>
                            <Switch checked={wsApiSendDebug} onChange={() => setWsApiSendDebug(prev => !prev)} />
                        </Field>
                        <Field label='GL utils set buffer'>
                            <Switch checked={glUtilsDebugSetBuffer} onChange={() => setGlUtilsDebugSetBuffer(prev => !prev)} />
                        </Field>
                        <Field label='GL utils draw'>
                            <Switch checked={glUtilsDebugDraw} onChange={() => setGlUtilsDebugDraw(prev => !prev)} />
                        </Field>
                        <Field label='GL utils init rogram'>
                            <Switch checked={glUtilsDebugInitProgram} onChange={() => setGlUtilsDebugInitProgram(prev => !prev)} />
                        </Field>
                    </div>
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
                                        .map(tree => <div key={tree.id}><Value>{tree.id}</Value> <Value>{tree.x},{tree.y}</Value> <Value>{tree.type}</Value> <Value>{tree.size}</Value>
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
                                    {Array.from(api.houses.values())
                                        .filter(house => houseFilter.types.length === 0 || houseFilter.types.includes(house.type))
                                        .filter(house => houseFilter.nations.length === 0 || houseFilter.nations.includes(house.nation))
                                        .map(house => <div key={house.id}><Value>{house.type}</Value> <Value>{house.playerId}</Value>
                                            <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(house)} />
                                        </div>)}
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
    </Window>)
}

export { Debug }