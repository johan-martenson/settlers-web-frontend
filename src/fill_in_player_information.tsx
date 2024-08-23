import React, { useState } from 'react'
import { Label, Input, Button, InputOnChangeData } from '@fluentui/react-components'
import './fill_in_player_information.css'
import { Center } from './components/center'

// Types
type FillInPlayerInformationProps = {
    onPlayerInformationDone: (name: string) => void
}

// Constants
const DEFAULT_USER_NAME = localStorage.getItem('mostRecentPlayer') ?? ''

// React components
const FillInPlayerInformation = ({ onPlayerInformationDone }: FillInPlayerInformationProps) => {
    const [userName, setUserName] = useState<string>(DEFAULT_USER_NAME)

    return (
        <>
            <Center>
                <div id='set-player-name-dialog'>

                    <div id='label-and-input'>
                        <Label>Name</Label>
                        <Input
                            type='text'
                            onChange={(_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                setUserName(data.value)
                            }}

                            onKeyDown={(event: React.KeyboardEvent) => {
                                if (event.code === 'Enter') {
                                    if (userName && userName !== '') {
                                        localStorage.setItem('mostRecentPlayer', userName)
                                        onPlayerInformationDone(userName)
                                    }
                                }
                            }}
                            defaultValue={DEFAULT_USER_NAME}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={() => {
                            localStorage.setItem('mostRecentPlayer', userName)
                            onPlayerInformationDone(userName)
                        }}
                        disabled={!userName || userName === ''}
                        appearance='primary'
                    >Go</Button>
                </div>
            </Center>
        </>
    )
}

export { FillInPlayerInformation }
