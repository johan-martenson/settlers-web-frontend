import React, { useEffect, useState } from 'react'
import { FlagDebugInfo, GameInformation, Point, PointInformation } from '../../api/types'
import { api, wsApiDebugSettings } from '../../api/ws-api'
import './debug.css'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Field, Switch } from '@fluentui/react-components'
import { VEGETATION } from './translate'
import { Window } from '../../components/dialog'
import { glUtilsDebug } from '../../render/utils'
import { wsApiCoreDebugSettings } from '../../api/ws/core'

// Types
type DebugProps = {
    point: Point

    onRaise: (() => void)
    onClose: (() => void)
}

// React components
function Value({ children }: { children?: React.ReactNode }) {
    return (
        <div className='value'><span>{children}</span></div>
    )
}

function Debug({ point, onClose, onRaise }: DebugProps) {
    const [flagInformation, setFlagInformation] = useState<FlagDebugInfo>()
    const [pointInformation, setPointInformation] = useState<PointInformation>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()
    const [wsApiReceiveDebug, setWsApiReceiveDebug] = useState<boolean>(wsApiCoreDebugSettings.receive)
    const [wsApiSendDebug, setWsApiSendDebug] = useState<boolean>(wsApiCoreDebugSettings.send)
    const [glUtilsDebugSetBuffer, setGlUtilsDebugSetBuffer] = useState<boolean>(glUtilsDebug.setBuffer)
    const [glUtilsDebugDraw, setGlUtilsDebugDraw] = useState<boolean>(glUtilsDebug.draw)
    const [glUtilsDebugInitProgram, setGlUtilsDebugInitProgram] = useState<boolean>(glUtilsDebug.initProgram)

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

    return (<Window className='debug-window' heading='Debug' onClose={onClose} onRaise={onRaise}>
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
                    <div className='monitored-world'>
                        <div>Crops
                            <ul>
                                {Array.from(api.crops.entries()).map(crop => <li key={crop[0]}>{crop[0]}: {JSON.stringify(crop[1])}</li>)}
                            </ul>
                        </div>
                    </div>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    </Window>)
}

export { Debug }