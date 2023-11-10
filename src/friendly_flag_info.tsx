import React, { useEffect, useState } from 'react'
import { FlagInformation, Nation } from './api/types'
import './friendly_flag_info.css'
import { monitor } from './api/ws-api'
import { Button, Field } from '@fluentui/react-components'
import { FlagIcon, InventoryIcon } from './icon'

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
        <div className='friendly-flag-info'>
            <h1>Flag</h1>

            <div className="flag-information">

                <FlagIcon type={flag.type} nation={flag.nation} />

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

                    <Button
                        onClick={
                            async () => {
                                monitor.callGeologist(flag)

                                onClose()
                            }
                        }
                    >
                        <div className='friendly-flag-info-button-icon-and-label'>
                            <InventoryIcon material='GEOLOGIST' nation={nation} />
                            Call geologist
                        </div>
                    </Button>

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
                            Send scout
                        </div>
                    </Button>
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
