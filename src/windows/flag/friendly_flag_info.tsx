import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlagInformation, Nation, Point } from '../../api/types'
import './friendly_flag_info.css'
import { api } from '../../api/ws-api'
import { Button, Field } from '@fluentui/react-components'
import { ButtonRow, WindowWithTyping } from '../../components/dialog'
import { useFlag } from '../../utils/hooks/hooks'
import { GenericCommand } from '../../utils/typing-commands'
import { FlagIcon, InventoryIcon, UiIcon } from '../../components/icons/icon'
import { materialPretty } from '../../utils/pretty-strings'
import { Dismiss16Filled } from '@fluentui/react-icons'
import { useCloseWhenFlagIsRemoved } from './use-close-when-flag-is-removed'

/// Types
type FriendlyFlagInfoProps = {
    flag: FlagInformation
    nation: Nation

    onRaise: () => void
    onStartNewRoad: (point: Point) => void
    onClose: () => void
}

/// Configuration
const FriendlyFlagLogConfig = {
    lifecycle: true,
    actions: true
}

// TODO: add monitor tab

/// React components
const FriendlyFlagInfo = ({ nation, onClose, onStartNewRoad, onRaise, ...props }: FriendlyFlagInfoProps) => {

    // State
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    // Monitoring hooks
    const flag = useFlag(props.flag.id)

    // Close when the flag is removed
    useCloseWhenFlagIsRemoved({ flag, onClose })

    // Functions
    const callScout = useCallback(() => {
        if (flag !== undefined) {
            api.callScout({ x: flag.x, y: flag.y })
        }
    }, [flag?.x, flag?.y])

    const callScoutAndClose = useCallback(() => {
        if (flag !== undefined) {
            api.callScout({ x: flag.x, y: flag.y })
        }

        onClose()
    }, [flag?.x, flag?.y, onClose])

    const callGeologist = useCallback(() => {
        if (flag !== undefined) {
            api.callGeologist({ x: flag.x, y: flag.y })
        }
    }, [flag?.x, flag?.y])

    const callGeologistAndClose = useCallback(() => {
        if (flag !== undefined) {
            api.callGeologist({ x: flag.x, y: flag.y })
        }

        onClose()
    }, [flag?.x, flag?.y, onClose])

    const removeFlagAndClose = useCallback(() => {
        if (flag !== undefined) {
            api.removeFlag(flag.id)
        }

        onClose()
    }, [flag?.id, onClose])

    const startNewRoadAndClose = useCallback(() => {
        if (flag !== undefined) {
            onStartNewRoad({ x: flag.x, y: flag.y })
        }

        onClose()
    }, [flag?.x, flag?.y, onClose, onStartNewRoad])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<FlagInformation>>()

        cmds.set('Build road', {
            action: startNewRoadAndClose,
            icon: <UiIcon type='LIGHT_ROAD_IN_NATURE' scale={0.5} />
        })

        cmds.set('Remove flag', {
            action: removeFlagAndClose,
            icon: <UiIcon type='BROKEN_FLAG' scale={0.5} />
        })

        cmds.set('Call geologist', {
            action: callGeologist,
            icon: <UiIcon type='GEOLOGIST' scale={0.5} />
        })

        cmds.set('Call scout', {
            action: callScout,
            icon: <InventoryIcon material='SCOUT' nation={nation} />
        })

        cmds.set('Log flag', {
            action: () => console.log(flag),
            hidden: true
        })

        cmds.set('Close window', {
            action: onClose,
            icon: <Dismiss16Filled />
        })

        return cmds
    }, [
        startNewRoadAndClose,
        removeFlagAndClose,
        callGeologist,
        callScout,
        onClose,
        nation
    ])

    const hoverFlag = useCallback(() => {
        setHoverInfo('Flag')
    }, [setHoverInfo])

    const hoverRemoveFlag = useCallback(() => {
        setHoverInfo('Remove flag')
    }, [setHoverInfo])

    const hoverCallGeologist = useCallback(() => {
        setHoverInfo('Call geologist')
    }, [setHoverInfo])

    const hoverCallScout = useCallback(() => {
        setHoverInfo('Call scout')
    }, [setHoverInfo])

    const hoverBuildRoad = useCallback(() => {
        setHoverInfo('Build road')
    }, [setHoverInfo])

    const clearHover = useCallback(() => {
        setHoverInfo(undefined)
    }, [setHoverInfo])


    // Rendering
    if (flag === undefined) {
        console.error(`Friendly flag window: flag with id ${props.flag.id} not found`)

        return null
    }

    const windowContent = useMemo(() => {

        if (FriendlyFlagLogConfig.lifecycle) {
            console.log('Friendly flag window: rendering content')
        }

        return (
            <div className='flag-information'>
                <FlagIcon
                    type={flag.type}
                    nation={flag.nation}
                    scale={2.0}
                    color={flag.color}
                    animate
                    drawShadow
                    onMouseEnter={hoverFlag}
                    onMouseLeave={clearHover}
                />

                <ButtonRow>
                    <Button
                        onClick={startNewRoadAndClose}
                        onMouseEnter={hoverBuildRoad}
                        onMouseLeave={clearHover}
                    >
                        <UiIcon type='LIGHT_ROAD_IN_NATURE' scale={0.5} />
                    </Button>
                    <Button
                        onClick={removeFlagAndClose}
                        onMouseEnter={hoverRemoveFlag}
                        onMouseLeave={clearHover}
                    >
                        <UiIcon type='BROKEN_FLAG' scale={0.5} />
                    </Button>

                    <Button
                        onClick={callGeologistAndClose}
                        onMouseEnter={hoverCallGeologist}
                        onMouseLeave={clearHover}
                    >
                        <div className='friendly-flag-info-button-icon-and-label'>
                            <UiIcon type='GEOLOGIST' scale={0.5} />
                        </div>
                    </Button>

                    <Button
                        onClick={callScoutAndClose}
                        onMouseEnter={hoverCallScout}
                        onMouseLeave={clearHover}
                    >
                        <div className='friendly-flag-info-button-icon-and-label'>
                            <InventoryIcon material='SCOUT' nation={nation} />
                        </div>
                    </Button>

                </ButtonRow>

                {flag.stackedCargo && flag.stackedCargo.length > 0 &&
                    <div className='friendly-flag-info-stacked-cargo'>
                        <Field label='Cargo waiting'>
                            <div className='friendly-flag-info-cargo-list'>
                                {flag.stackedCargo.map((material, index) => (
                                    <InventoryIcon
                                        material={material}
                                        key={`${material}-${index}`}
                                        nation={nation}
                                        inline
                                        onMouseEnter={() => setHoverInfo(`${materialPretty(material)}`)}
                                        onMouseLeave={clearHover}
                                    />
                                ))}
                            </div>
                        </Field>
                    </div>
                }
            </div>
        )
    }, [
        nation,
        flag.type,
        flag.nation,
        flag.color,
        flag.stackedCargo,
        hoverFlag,
        hoverRemoveFlag,
        hoverCallGeologist,
        hoverCallScout,
        hoverBuildRoad,
        clearHover,
        startNewRoadAndClose,
        removeFlagAndClose,
        callGeologistAndClose,
        callScoutAndClose
    ])

    if (FriendlyFlagLogConfig.lifecycle) {
        console.log('Friendly flag window: rendering window')
    }

    return (
        <WindowWithTyping<FlagInformation>
            commands={commands}
            param={flag}
            className='friendly-flag-info'
            heading='Flag'
            onClose={onClose}
            hoverInfo={hoverInfo}
            onRaise={onRaise}>
            {windowContent}
        </WindowWithTyping>
    )
}

export default FriendlyFlagInfo
