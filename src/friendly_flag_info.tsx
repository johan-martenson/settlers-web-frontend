import React, { useEffect, useState } from 'react'
import { FlagInformation, Nation } from './api/types'
import './friendly_flag_info.css'
import { monitor } from './api/ws-api'
import { Button, Field, Tooltip } from '@fluentui/react-components'
import { FlagIcon, InventoryIcon, UiIcon } from './icon'
import { ButtonRow, Window } from './components/dialog'

interface FriendlyFlagInfoProps {
    flag: FlagInformation
    nation: Nation

    onRaise: (() => void)
    onStartNewRoad: ((flag: FlagInformation) => void)
    onClose: (() => void)
}

// TODO: add monitor tab

const FriendlyFlagInfo = ({ nation, onClose, onStartNewRoad, onRaise, ...props }: FriendlyFlagInfoProps) => {
    const [flag, setFlag] = useState<FlagInformation>(props.flag)
    const [hoverInfo, setHoverInfo] = useState<string>()

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
        <Window className='friendly-flag-info' heading='Flag' onClose={onClose} hoverInfo={hoverInfo} onRaise={onRaise}>
            <div className="flag-information">

                <FlagIcon type={flag.type} nation={flag.nation} scale={2.0} color={flag.color} animate drawShadow />

                <ButtonRow>

                    <Tooltip content={'Remove flag'} relationship='label' withArrow>
                        <Button
                            onClick={
                                async () => {
                                    monitor.removeFlag(flag.id)

                                    onClose()
                                }
                            }
                            onMouseEnter={() => setHoverInfo("Remove flag")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            Remove
                        </Button>
                    </Tooltip>

                    <Tooltip content='Build road' relationship='label' withArrow>
                        <Button
                            onClick={
                                () => {
                                    onStartNewRoad(flag)

                                    onClose()
                                }
                            }
                            onMouseEnter={() => setHoverInfo("Build road")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >Build road</Button>
                    </Tooltip>

                    <Tooltip content={"Call geologist"} relationship='label' withArrow>
                        <Button
                            onClick={
                                async () => {
                                    monitor.callGeologist(flag)

                                    onClose()
                                }
                            }
                            onMouseEnter={() => setHoverInfo("Call geologist")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <div className='friendly-flag-info-button-icon-and-label'>
                                <UiIcon type='GEOLOGIST' />
                            </div>
                        </Button>
                    </Tooltip>

                    <Tooltip content={"Call scout"} relationship='label' withArrow>
                        <Button
                            onClick={
                                async () => {
                                    monitor.callScout(flag)

                                    onClose()
                                }
                            }
                            onMouseEnter={() => setHoverInfo("Call scout")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <div className='friendly-flag-info-button-icon-and-label'>
                                <InventoryIcon material='SCOUT' nation={nation} />
                            </div>
                        </Button>
                    </Tooltip>
                </ButtonRow>

                {flag.stackedCargo &&
                    <div className='friendly-flag-info-stacked-cargo'>
                        <Field label='Cargo waiting'>
                            <div className='friendly-flag-info-cargo-list'>
                                {flag.stackedCargo.map((material, index) => <InventoryIcon material={material} key={index} nation={nation} inline />)}
                            </div>
                        </Field>
                    </div>
                }
            </div>

        </Window>
    )
}

export default FriendlyFlagInfo
