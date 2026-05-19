import React, { useState } from 'react'
import { Label, Input, Button, InputOnChangeData } from '@fluentui/react-components'
import './fill_in_player_information.css'
import { Center } from '../../components/center'

// Types
type FillInPlayerInformationProps = {
    onPlayerInformationDone: (name: string) => void
}

// Constants
const DEFAULT_USER_NAME = localStorage.getItem('mostRecentPlayer') ?? ''

// React components
const FillInPlayerInformation = ({ onPlayerInformationDone }: FillInPlayerInformationProps) => {
    const [userName, setUserName] = useState<string>(DEFAULT_USER_NAME)

    // Render
    const previousUserName = localStorage.getItem('mostRecentPlayer')
    return (
        <Center>
            <div id='set-player-name-dialog'>

                {previousUserName &&
                    <>
                        <div>
                            <Button
                                appearance='primary'
                                onClick={() => {
                                    onPlayerInformationDone(previousUserName)
                                }}>Enter as {previousUserName}</Button>
                        </div>
                        <div>or</div>
                    </>}

                <div id='label-and-input'>
                    <Label>Name</Label>
                    <Input
                        id='set-player-name'
                        type='text'
                        value={userName}
                        onChange={(_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                            setUserName(data.value)
                        }}

                        onKeyDown={(event: React.KeyboardEvent) => {
                            if (event.key === 'Enter') {
                                const userNameTrimmed = userName.trim()

                                if (userNameTrimmed && userNameTrimmed !== '') {
                                    localStorage.setItem('mostRecentPlayer', userNameTrimmed)
                                    onPlayerInformationDone(userNameTrimmed)
                                }
                            }
                        }}
                        autoFocus
                    />

                    <Button
                        onClick={() => {
                            const userNameTrimmed = userName.trim()

                            localStorage.setItem('mostRecentPlayer', userNameTrimmed)
                            onPlayerInformationDone(userNameTrimmed)
                        }}
                        disabled={!userName || userName.trim() === ''}
                        appearance='primary'
                    >Go</Button>
                </div>
            </div>
        </Center>
    )
}

export { FillInPlayerInformation }
