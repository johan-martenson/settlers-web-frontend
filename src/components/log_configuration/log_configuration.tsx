import * as React from 'react'
import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Table,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    Switch
} from '@fluentui/react-components'
import { wsApiDebugSettings } from '../../api/ws-api'
import { wsApiCoreDebugSettings } from '../../api/ws/core'
import { glUtilsDebug } from '../../render/utils'
import { gameMenuDebugSettings } from '../../screens/play/game_menu'
import { playConfigurationDebug } from '../../screens/play/play'
import { HooksConfig } from '../../utils/hooks/config'
import { SOUND_EFFECTS_LOGGING } from '../../sound/sound_effects'

// Types
type SubsystemDescriptor<T> = {
    name: string
    key: keyof T
}

// Functions
function buildMultiSubsystemRow<T extends Record<string, boolean>>(
    config: T,
    state: T,
    setState: React.Dispatch<React.SetStateAction<T>>,
    descriptors: SubsystemDescriptor<T>[]
) {
    return {
        subsystems: descriptors.map(({ name, key }) => ({
            name,
            checked: state[key],
            onChange: () => {
                config[key] = !state[key] as T[keyof T]
                setState(prev => ({ ...prev, [key]: !prev[key] }))
            }
        })),
        onToggleAll: (value: boolean) => {
            Object.keys(config).forEach(key => {
                config[key as keyof T] = value as T[keyof T]
            })
            setState(
                Object.fromEntries(
                    Object.keys(config).map(k => [k, value])
                ) as T
            )
        }
    }
}

// React components
const DebugLogsTable = () => {
    const [wsApiReceiveDebug, setWsApiReceiveDebug] = React.useState<boolean>(wsApiCoreDebugSettings.receive)
    const [wsApiSendDebug, setWsApiSendDebug] = React.useState<boolean>(wsApiCoreDebugSettings.send)
    const [glUtilsDebugSetBuffer, setGlUtilsDebugSetBuffer] = React.useState<boolean>(glUtilsDebug.setBuffer)
    const [glUtilsDebugDraw, setGlUtilsDebugDraw] = React.useState<boolean>(glUtilsDebug.draw)
    const [glUtilsDebugInitProgram, setGlUtilsDebugInitProgram] = React.useState<boolean>(glUtilsDebug.initProgram)
    const [gameMenuDebug, setGameMenuDebug] = React.useState<boolean>(gameMenuDebugSettings.log)
    const [playConfigurationDebugEffects, setPlayConfigurationDebugEffects] = React.useState<boolean>(playConfigurationDebug.effects)
    const [playConfigurationDebugEvents, setPlayConfigurationDebugEvents] = React.useState<boolean>(playConfigurationDebug.events)
    const [hooks, setHooks] = React.useState({ ...HooksConfig })
    const [soundEffectLogging, setSoundEffectLogging] = React.useState({ ...SOUND_EFFECTS_LOGGING })

    const updateHook = (key: keyof typeof HooksConfig, value: boolean) => {
        HooksConfig[key] = value
        setHooks(prev => ({ ...prev, [key]: value }))
    }

    const updateSoundEffectLogging = (key: keyof typeof SOUND_EFFECTS_LOGGING, value: boolean) => {
        SOUND_EFFECTS_LOGGING[key] = value
        setSoundEffectLogging(prev => ({ ...prev, [key]: value }))
    }

    const rows = [
        {
            component: 'WS API',
            subsystems: [
                {
                    name: 'Receive',
                    checked: wsApiReceiveDebug,
                    onChange: () => {
                        wsApiCoreDebugSettings.receive = !wsApiReceiveDebug
                        wsApiDebugSettings.receive = !wsApiReceiveDebug
                        setWsApiReceiveDebug(prev => !prev)
                    }
                },
                {
                    name: 'Send',
                    checked: wsApiSendDebug,
                    onChange: () => {
                        wsApiCoreDebugSettings.send = !wsApiSendDebug
                        setWsApiSendDebug(prev => !prev)
                    }
                }
            ],
            onToggleAll: (value: boolean) => {
                wsApiCoreDebugSettings.receive = value
                wsApiCoreDebugSettings.send = value
                wsApiDebugSettings.receive = value
                setWsApiReceiveDebug(value)
                setWsApiSendDebug(value)
            }
        },
        {
            component: 'GL Utils',
            subsystems: [
                {
                    name: 'Set buffer',
                    checked: glUtilsDebugSetBuffer,
                    onChange: () => {
                        glUtilsDebug.setBuffer = !glUtilsDebugSetBuffer
                        setGlUtilsDebugSetBuffer(prev => !prev)
                    }
                },
                {
                    name: 'Draw',
                    checked: glUtilsDebugDraw,
                    onChange: () => {
                        glUtilsDebug.draw = !glUtilsDebugDraw
                        setGlUtilsDebugDraw(prev => !prev)
                    }
                },
                {
                    name: 'Init program',
                    checked: glUtilsDebugInitProgram,
                    onChange: () => {
                        glUtilsDebug.initProgram = !glUtilsDebugInitProgram
                        setGlUtilsDebugInitProgram(prev => !prev)
                    }
                }
            ],
            onToggleAll: (value: boolean) => {
                glUtilsDebug.setBuffer = value
                glUtilsDebug.draw = value
                glUtilsDebug.initProgram = value
                setGlUtilsDebugSetBuffer(value)
                setGlUtilsDebugDraw(value)
                setGlUtilsDebugInitProgram(value)
            }
        },
        {
            component: 'Game Menu',
            subsystems: [
                {
                    name: 'Log',
                    checked: gameMenuDebug,
                    onChange: () => {
                        gameMenuDebugSettings.log = !gameMenuDebugSettings.log
                        setGameMenuDebug(prev => !prev)
                    }
                }
            ],
            onToggleAll: (value: boolean) => {
                gameMenuDebugSettings.log = value
                setGameMenuDebug(value)
            }
        },
        {
            component: 'Sound effects',
            ...buildMultiSubsystemRow(
                SOUND_EFFECTS_LOGGING,
                soundEffectLogging,
                setSoundEffectLogging,
                [
                    { name: 'Lifecycle', key: 'lifecycle' },
                    { name: 'Loading', key: 'loading' },
                    { name: 'Actions', key: 'actions' },
                    { name: 'Events', key: 'events' },
                    { name: 'Playback', key: 'playback' },
                    { name: 'Volume', key: 'volume' },
                ]
            )
        },
        {
            component: 'Hooks',
            ...buildMultiSubsystemRow(
                HooksConfig,
                hooks,
                setHooks,
                [
                    { name: 'useTime', key: 'useTime' },
                    { name: 'useStatistics', key: 'useStatistics' },
                    { name: 'useTransportPriority', key: 'useTransportPriority' },
                    { name: 'usePlayer', key: 'usePlayer' },
                    { name: 'useMaps', key: 'useMaps' },
                    { name: 'useHouse', key: 'useHouse' },
                    { name: 'useChatMessages', key: 'useChatMessages' },
                    { name: 'useGameMessages', key: 'useGameMessages' },
                    { name: 'useGames', key: 'useGames' },
                    { name: 'useNonTriggeringState', key: 'useNonTriggeringState' },
                ]
            )
        },
        {
            component: 'Play',
            subsystems: [
                {
                    name: 'Effects',
                    checked: playConfigurationDebugEffects,
                    onChange: () => {
                        playConfigurationDebug.effects = !playConfigurationDebug.effects
                        setPlayConfigurationDebugEffects(prev => !prev)
                    }
                },
                {
                    name: 'Events',
                    checked: playConfigurationDebugEvents,
                    onChange: () => {
                        playConfigurationDebug.events = !playConfigurationDebug.events
                        setPlayConfigurationDebugEvents(prev => !prev)
                    }
                }
            ],
            onToggleAll: (value: boolean) => {
                playConfigurationDebug.effects = value
                playConfigurationDebug.events = value
                setPlayConfigurationDebugEffects(value)
                setPlayConfigurationDebugEvents(value)
            }
        }
    ]

    return (
        <div className='debug-logs'>
            <Accordion collapsible multiple>
                {rows.map(({ component, subsystems, onToggleAll }) => {
                    const allOn = subsystems.every(s => s.checked)

                    return (
                        <AccordionItem key={component} value={component}>
                            <AccordionHeader
                                expandIconPosition='end'
                                inline={false}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <span>{component}</span>
                                <Switch
                                    checked={allOn}
                                    onChange={(_, data) => onToggleAll(data.checked ?? false)}
                                />
                            </AccordionHeader>

                            <AccordionPanel>
                                <Table arial-label={`${component} debug settings`} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHeaderCell>Subsystem</TableHeaderCell>
                                            <TableHeaderCell>Enabled</TableHeaderCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subsystems.map(s => (
                                            <TableRow key={s.name}>
                                                <TableCell>{s.name}</TableCell>
                                                <TableCell>
                                                    <Switch checked={s.checked} onChange={s.onChange} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionPanel>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </div>
    )
}

export { DebugLogsTable }