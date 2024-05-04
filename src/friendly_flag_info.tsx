import React, { useEffect, useState } from 'react'
import { FlagInformation, Nation } from './api/types'
import './friendly_flag_info.css'
import { monitor } from './api/ws-api'
import { Button, Field, Tooltip } from '@fluentui/react-components'
import { FlagIcon, InventoryIcon, UiIcon } from './icon'

interface FriendlyFlagInfoProps {
    flag: FlagInformation
    nation: Nation
    onStartNewRoad: ((flag: FlagInformation) => void)
    onClose: (() => void)
}

const FriendlyFlagInfo = (props: FriendlyFlagInfoProps) => {
    const nation = props.nation

    const onClose = props.onClose
    const onStartNewRoad = props.onStartNewRoad

    const [flag, setFlag] = useState<FlagInformation>(props.flag)

    useEffect(
        () => {
            const listener = {
                onUpdate: (updatedFlag: FlagInformation) => setFlag(updatedFlag),
                onRemove: () => onClose()
            }

            monitor.listenToFlag(flag.id, listener)

            return () => { monitor.stopListeningToFlag(flag.id, listener) }
        }, [])

    return (
        <div className='friendly-flag-info' onWheel={(event) => event.stopPropagation()}>
            <h1>Flag</h1>

            <div className="flag-information">

                <FlagIcon type={flag.type} nation={flag.nation} scale={2.0} color={flag.color} animate drawShadow />

                <div className="button-row">

                    <Button
                        onClick={
                            async () => {
                                monitor.removeFlag(flag.id)

                                onClose()
                            }
                        }
                    >Remove</Button>

                    <Button
                        onClick={
                            () => {
                                onStartNewRoad(flag)

                                onClose()
                            }
                        }
                    >Build road</Button>

                    <Tooltip content={"Call geologist"} relationship='label' withArrow>
                        <Button
                            onClick={
                                async () => {
                                    monitor.callGeologist(flag)

                                    onClose()
                                }
                            }
                        >
                            <div className='friendly-flag-info-button-icon-and-label'>
                                <UiIcon type='GEOLOGIST' />
                            </div>
                        </Button>
                    </Tooltip>

                    <Tooltip content={"Call geologist"} relationship='label' withArrow>
                        <Button
                            onClick={
                                async () => {
                                    monitor.callScout(flag)

                                    onClose()
                                }
                            }
                        >
                            <div className='friendly-flag-info-button-icon-and-label'>
                                <InventoryIcon material='SCOUT' nation={nation} />
                            </div>
                        </Button>
                    </Tooltip>
                </div>

                {flag.stackedCargo &&
                    <div className='friendly-flag-info-stacked-cargo'>
                        <Field label='Cargo waiting'>
                            <div className='friendly-flag-info-cargo-list'>
                                {flag.stackedCargo.map(material => <InventoryIcon material={material} key={material} nation={nation} inline />)}
                            </div>
                        </Field>
                    </div>
                }
            </div>
            <Button onClick={() => onClose()}>Close</Button>

        </div>
    )
}

export default FriendlyFlagInfo
