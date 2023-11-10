import React, { useEffect, useState } from 'react'
import { Label, Input, Button, InputOnChangeData } from "@fluentui/react-components"
import { do_self_test } from './self_test'
import { HouseIcon, WorkerIcon } from './icon'
import './fill_in_player_information.css'

interface FillInPlayerInformationProps {
    onPlayerInformationDone: ((name: string) => void)
}

const FillInPlayerInformation = ({ onPlayerInformationDone }: FillInPlayerInformationProps) => {
    const [defaultUserName, setDefaultUserName] = useState<string>()
    const [userName, setUserName] = useState<string>()

    useEffect(
        () => {
            do_self_test()

            const lastPlayerName = localStorage.getItem("mostRecentPlayer")

            if (lastPlayerName) {
                setDefaultUserName(lastPlayerName)
            }

            return () => { }
        }, [])

    return (
        <>
            <div id="center-on-screen">
                <div id="set-player-name-dialog">

                    <div id="label-and-input">
                        <Label>Name</Label>
                        <Input type="text"
                            onChange={

                                // eslint-disable-next-line
                                (event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                    setUserName(data.value)
                                }
                            }

                            onKeyDown={
                                (event: React.KeyboardEvent) => {
                                    if (event.code === 'Enter') {
                                        if (userName && userName !== "") {
                                            localStorage.setItem("mostRecentPlayer", userName)

                                            onPlayerInformationDone(userName)
                                        }
                                    }
                                }
                            }
                            defaultValue={defaultUserName}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={() => onPlayerInformationDone(userName ?? defaultUserName ?? "")}
                        disabled={!userName || userName === ""}
                        appearance='primary'
                    >Go</Button>
                </div>
            </div >
            <div id="worker-animation">
                <WorkerIcon worker='General' animate nation='ROMANS' direction={'WEST'} scale={3} />
            </div>

            <div id="house-icon">
                <HouseIcon nation="ROMANS" houseType='Fortress' scale={2} />
            </div>
        </>
    )
}

export { FillInPlayerInformation }
