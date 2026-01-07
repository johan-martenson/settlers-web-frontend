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
import { GL_UTILS_LOG_CONFIG } from '../../render/utils'
import { gameMenuDebugSettings } from '../../screens/play/game_menu'
import { playConfigurationDebug } from '../../screens/play/play'
import { HooksConfig } from '../../utils/hooks/config'
import { SOUND_EFFECTS_LOGGING } from '../../sound/sound_effects'
import { TypeControlLogConfig } from '../../screens/play/type_control'
import { RenderLogConfig } from '../../render/game_render'

// Types
type SubsystemDescriptor<T> = {
    name: string
    key: keyof T
}

// Functions
function buildMultiSubsystemRow<T extends Record<string, boolean>>(
    config: T,
    state: T,
    setState: React.Dispatch<React.SetStateAction<T>> | ((updater: (prev: T) => T) => void),
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
            setState(prev =>
                Object.fromEntries(
                    Object.keys(config).map(k => [k, value])
                ) as T
            )
        }
    }
}

// Hook
function useDebugConfig<T extends Record<string, boolean>>(config: T) {
    const [state, setState] = React.useState<T>({ ...config })

    function setAndSync(updater: (prev: T) => T) {
        setState(prev => {
            const next = updater(prev)

            Object.keys(next).forEach(key => {
                config[key as keyof T] = next[key] as T[keyof T]
            })

            return next
        })
    }

    return [state, setAndSync] as const
}

// React components
const DebugLogsTable = () => {
    const [wsApiReceiveDebug, setWsApiReceiveDebug] = React.useState<boolean>(wsApiCoreDebugSettings.receive)
    const [wsApiSendDebug, setWsApiSendDebug] = React.useState<boolean>(wsApiCoreDebugSettings.send)
    const [gameMenuDebug, setGameMenuDebug] = React.useState<boolean>(gameMenuDebugSettings.log)
    const [playConfigurationDebugEffects, setPlayConfigurationDebugEffects] = React.useState<boolean>(playConfigurationDebug.effects)
    const [playConfigurationDebugEvents, setPlayConfigurationDebugEvents] = React.useState<boolean>(playConfigurationDebug.events)
    const [hooks, setHooks] = useDebugConfig(HooksConfig)
    const [soundEffectLogging, setSoundEffectLogging] = useDebugConfig(SOUND_EFFECTS_LOGGING)
    const [typeControlLogging, setTypeControlLogging] = useDebugConfig(TypeControlLogConfig)
    const [glUtilsLogConfig, setGlUtilsLogConfig] = useDebugConfig(GL_UTILS_LOG_CONFIG)
    const [renderLogConfig, setRenderLogConfig] = useDebugConfig(RenderLogConfig)

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
            component: 'GL utils',
            ...buildMultiSubsystemRow(
                GL_UTILS_LOG_CONFIG,
                glUtilsLogConfig,
                setGlUtilsLogConfig,
                [
                    { name: 'Set buffer', key: 'setBuffer' },
                    { name: 'Draw', key: 'draw' },
                    { name: 'Init program', key: 'initProgram' },
                    { name: 'Make shader', key: 'makeShader' },
                ]
            )
        },
        {
            component: 'Type Control',
            ...buildMultiSubsystemRow(
                TypeControlLogConfig,
                typeControlLogging,
                setTypeControlLogging,
                [
                    { name: 'Lifecycle', key: 'lifecycle' },
                    { name: 'Input', key: 'input' },
                    { name: 'Commands', key: 'commands' },
                    { name: 'Selection', key: 'selection' },
                ]
            )
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
            component: 'Render',
            ...buildMultiSubsystemRow(
                RenderLogConfig,
                renderLogConfig,
                setRenderLogConfig,
                [
                    { name: 'Lifecycle', key: 'lifecycle' },
                    { name: 'Input', key: 'input' },
                    { name: 'Render loop', key: 'renderLoop' },
                    { name: 'gl', key: 'gl' },
                    { name: 'Assets', key: 'assets' },
                    { name: 'Textures', key: 'textures' },
                    { name: 'Terrain', key: 'terrain' },
                    { name: 'Normals', key: 'normals' },
                    { name: 'Roads', key: 'roads' },
                    { name: 'Fog of war', key: 'fogOfWar' },
                    { name: 'Workers', key: 'workers' },
                    { name: 'Debug', key: 'debug' },
                ])
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