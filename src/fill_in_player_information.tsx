import React, { useEffect, useState } from 'react'
import { Label, Input, Button, InputOnChangeData } from "@fluentui/react-components"
import { do_self_test } from './self_test'
import { HouseIcon, WorkerIcon } from './icon'
import './fill_in_player_information.css'

interface FillInPlayerInformationProps {
    onPlayerInformationDone: ((name: string) => void)
}

const defaultUserName = localStorage.getItem("mostRecentPlayer") ?? ""

const FillInPlayerInformation = ({ onPlayerInformationDone }: FillInPlayerInformationProps) => {
    const [userName, setUserName] = useState<string>(defaultUserName)

    useEffect(
        () => {
            do_self_test()

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
                                (_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
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
                        onClick={() => {
                            localStorage.setItem("mostRecentPlayer", userName)

                            onPlayerInformationDone(userName)
                        }}
                        disabled={!userName || userName === ""}
                        appearance='primary'
                    >Go</Button>
                </div>
            </div>
            <div id="worker-animation">
                <WorkerIcon worker='General' animate nation='ROMANS' direction={'WEST'} scale={3} drawShadow />
            </div>

            <div id="house-icon">
                <HouseIcon nation="ROMANS" houseType='Fortress' scale={2} drawShadow />
            </div>
        </>
    )
}

export { FillInPlayerInformation }
