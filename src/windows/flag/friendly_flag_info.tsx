import React, { useEffect, useState } from 'react'
import { FlagInformation, Nation } from '../../api/types'
import './friendly_flag_info.css'
import { api } from '../../api/ws-api'
import { Button, Field } from '@fluentui/react-components'
import { FlagIcon, InventoryIcon, UiIcon } from '../../icons/icon'
import { ButtonRow, Window } from '../../components/dialog'
import { materialPretty } from '../../pretty_strings'

// Types
type FriendlyFlagInfoProps = {
    flag: FlagInformation
    nation: Nation

    onRaise: (() => void)
    onStartNewRoad: ((flag: FlagInformation) => void)
    onClose: (() => void)
}

// TODO: add monitor tab

// React components
const FriendlyFlagInfo = ({ nation, onClose, onStartNewRoad, onRaise, ...props }: FriendlyFlagInfoProps) => {
    const [flag, setFlag] = useState<FlagInformation>(props.flag)
    const [hoverInfo, setHoverInfo] = useState<string>()

    useEffect(() => {
        const listener = {
            onUpdate: setFlag,
            onRemove: onClose
        }

        api.addFlagListener(flag.id, listener)

        return () => api.removeFlagListener(flag.id, listener)
    }, [flag.id, onClose])

    return (
        <Window className='friendly-flag-info' heading='Flag' onClose={onClose} hoverInfo={hoverInfo} onRaise={onRaise}>
            <div className='flag-information'>
                <FlagIcon
                    type={flag.type}
                    nation={flag.nation}
                    scale={2.0}
                    color={flag.color}
                    animate
                    drawShadow
                    onMouseEnter={() => setHoverInfo('Flag')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                />

                <ButtonRow>
                    <Button
                        onClick={() => {
                            onStartNewRoad(flag)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Build road')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='LIGHT_ROAD_IN_NATURE' scale={0.5} />
                    </Button>
                    <Button
                        onClick={async () => {
                            api.removeFlag(flag.id)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Remove flag')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='BROKEN_FLAG' scale={0.5} />
                    </Button>

                    <Button
                        onClick={async () => {
                            api.callGeologist(flag)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Call geologist')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <div className='friendly-flag-info-button-icon-and-label'>
                            <UiIcon type='GEOLOGIST' scale={0.5} />
                        </div>
                    </Button>

                    <Button
                        onClick={async () => {
                            api.callScout(flag)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Call scout')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <div className='friendly-flag-info-button-icon-and-label'>
                            <InventoryIcon material='SCOUT' nation={nation} />
                        </div>
                    </Button>

                </ButtonRow>

                {flag.stackedCargo &&
                    <div className='friendly-flag-info-stacked-cargo'>
                        <Field label='Cargo waiting'>
                            <div className='friendly-flag-info-cargo-list'>
                                {flag.stackedCargo.map((material, index) => (
                                    <InventoryIcon
                                        material={material}
                                        key={index}
                                        nation={nation}
                                        inline
                                        onMouseEnter={() => setHoverInfo(`${materialPretty(material)}`)}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    />
                                ))}
                            </div>
                        </Field>
                    </div>
                }
            </div>
        </Window>
    )
}

export default FriendlyFlagInfo
