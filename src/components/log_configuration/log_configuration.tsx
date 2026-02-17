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
import { WsApiLogConfig } from '../../api/ws-api'
import { WsCoreLogConfig } from '../../api/ws/core'
import { GlUtilsLogConfig } from '../../render/utils'
import { GameMenuLogConfig } from '../../screens/play/game_menu'
import { playConfigurationDebug, PlayLogConfig } from '../../screens/play/play'
import { HooksConfig } from '../../utils/hooks/config'
import { SoundEffectsLogConfig } from '../../sound/sound_effects'
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
    componentName: string,
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
                localStorage.setItem(`config.${componentName.toLowerCase()}.log`, JSON.stringify({ ...config }))
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
            localStorage.setItem(`config.${componentName.toLowerCase()}.log`, JSON.stringify({ ...config }))
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
    const [wsApiLogConfig, setWsApiLogConfig] = useDebugConfig(WsApiLogConfig)
    const [wsCoreLogConfig, setWsCoreLogConfig] = useDebugConfig(WsCoreLogConfig)
    const [gameMenuLogConfig, setGameMenuLogConfig] = useDebugConfig(GameMenuLogConfig)
    const [playLogConfig, setPlayLogConfig] = useDebugConfig(PlayLogConfig)
    const [hooksLogConfig, setHooksLogConfig] = useDebugConfig(HooksConfig)
    const [soundEffectLogConfig, setSoundEffectLogConfig] = useDebugConfig(SoundEffectsLogConfig)
    const [typeControlLogConfig, setTypeControlLogConfig] = useDebugConfig(TypeControlLogConfig)
    const [glUtilsLogConfig, setGlUtilsLogConfig] = useDebugConfig(GlUtilsLogConfig)
    const [renderLogConfig, setRenderLogConfig] = useDebugConfig(RenderLogConfig)

    const rows = [
        {
            component: 'WS Core',
            ...buildMultiSubsystemRow(
                'wscore',
                WsCoreLogConfig,
                wsCoreLogConfig,
                setWsCoreLogConfig,
                buildDescriptorsFromConfig(WsCoreLogConfig)
            )
        },
        {
            component: 'WS API',
            ...buildMultiSubsystemRow(
                'wsapi',
                WsApiLogConfig,
                wsApiLogConfig,
                setWsApiLogConfig,
                buildDescriptorsFromConfig(WsApiLogConfig)
            )
        },
        {
            component: 'Game Menu',
            ...buildMultiSubsystemRow(
                'gamemenu',
                GameMenuLogConfig,
                gameMenuLogConfig,
                setGameMenuLogConfig,
                buildDescriptorsFromConfig(GameMenuLogConfig)
            )
        },
        {
            component: 'GL utils',
            ...buildMultiSubsystemRow(
                'gl',
                GlUtilsLogConfig,
                glUtilsLogConfig,
                setGlUtilsLogConfig,
                buildDescriptorsFromConfig(GlUtilsLogConfig)
            )
        },
        {
            component: 'Type Control',
            ...buildMultiSubsystemRow(
                'typecontrol',
                TypeControlLogConfig,
                typeControlLogConfig,
                setTypeControlLogConfig,
                buildDescriptorsFromConfig(TypeControlLogConfig)
            )
        },
        {
            component: 'Sound effects',
            ...buildMultiSubsystemRow(
                'soundeffects',
                SoundEffectsLogConfig,
                soundEffectLogConfig,
                setSoundEffectLogConfig,
                buildDescriptorsFromConfig(SoundEffectsLogConfig)
            )
        },
        {
            component: 'Hooks',
            ...buildMultiSubsystemRow(
                'hooks',
                HooksConfig,
                hooksLogConfig,
                setHooksLogConfig,
                buildDescriptorsFromConfig(HooksConfig)
            )
        },
        {
            component: 'Render',
            ...buildMultiSubsystemRow(
                'render',
                RenderLogConfig,
                renderLogConfig,
                setRenderLogConfig,
                buildDescriptorsFromConfig(RenderLogConfig)
            )
        },
        {
            component: 'Play',
            ...buildMultiSubsystemRow(
                'play',
                PlayLogConfig,
                playLogConfig,
                setPlayLogConfig,
                buildDescriptorsFromConfig(PlayLogConfig)
            ),
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