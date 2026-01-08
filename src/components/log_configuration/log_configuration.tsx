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
function prettifyKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase())
}

function buildMultiSubsystemRow<T extends Record<string, boolean>>(
    config: T,
    state: T,
    setState: React.Dispatch<React.SetStateAction<T>> | ((updater: (prev: T) => T) => void),
    descriptors: SubsystemDescriptor<T>[]
) {
    return {
        subsystems: descriptors.map(({ name, key }) => ({
            name: prettifyKey(name),
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

function buildDescriptorsFromConfig<T extends Record<string, boolean>>(
    config: T,
    nameMapper?: (key: keyof T & string) => string
): SubsystemDescriptor<T>[] {
    return Object.keys(config).map(key => ({
        key: key as keyof T,
        name: nameMapper
            ? nameMapper(key as keyof T & string)
            : key
    }))
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
    const [gameMenuLogConfig, setGameMenuLogConfig] = React.useState<boolean>(gameMenuDebugSettings.log)
    const [playConfigurationDebugEffects, setPlayConfigurationDebugEffects] = React.useState<boolean>(playConfigurationDebug.effects)
    const [playConfigurationDebugEvents, setPlayConfigurationDebugEvents] = React.useState<boolean>(playConfigurationDebug.events)
    const [hooksLogConfig, setHooksLogConfig] = useDebugConfig(HooksConfig)
    const [soundEffectLogConfig, setSoundEffectLogConfig] = useDebugConfig(SOUND_EFFECTS_LOGGING)
    const [typeControlLogConfig, setTypeControlLogConfig] = useDebugConfig(TypeControlLogConfig)
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
                    checked: gameMenuLogConfig,
                    onChange: () => {
                        gameMenuDebugSettings.log = !gameMenuDebugSettings.log
                        setGameMenuLogConfig(prev => !prev)
                    }
                }
            ],
            onToggleAll: (value: boolean) => {
                gameMenuDebugSettings.log = value
                setGameMenuLogConfig(value)
            }
        },
        {
            component: 'GL utils',
            ...buildMultiSubsystemRow(
                GL_UTILS_LOG_CONFIG,
                glUtilsLogConfig,
                setGlUtilsLogConfig,
                buildDescriptorsFromConfig(GL_UTILS_LOG_CONFIG)
            )
        },
        {
            component: 'Type Control',
            ...buildMultiSubsystemRow(
                TypeControlLogConfig,
                typeControlLogConfig,
                setTypeControlLogConfig,
                buildDescriptorsFromConfig(TypeControlLogConfig)
            )
        },
        {
            component: 'Sound effects',
            ...buildMultiSubsystemRow(
                SOUND_EFFECTS_LOGGING,
                soundEffectLogConfig,
                setSoundEffectLogConfig,
                buildDescriptorsFromConfig(SOUND_EFFECTS_LOGGING)
            )
        },
        {
            component: 'Hooks',
            ...buildMultiSubsystemRow(
                HooksConfig,
                hooksLogConfig,
                setHooksLogConfig,
                buildDescriptorsFromConfig(HooksConfig)
            )
        },
        {
            component: 'Render',
            ...buildMultiSubsystemRow(
                RenderLogConfig,
                renderLogConfig,
                setRenderLogConfig,
                buildDescriptorsFromConfig(RenderLogConfig)
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