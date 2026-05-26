import React from 'react'
import { Button } from "@fluentui/react-components"
import { ButtonRow } from "../dialog"

const Expired = () => {
    return (
        <div className='expired'>
            <h1>The game has expired</h1>
            <p>The game has expired and is frozen in time. You can stay and view the current game or go back to the lobby to start a new game.</p>
            <ButtonRow>
                <Button>Stay in game</Button>
                <Button onClick={() => window.location.href = ''}>Go to lobby</Button>
            </ButtonRow>

        </div>
    )
}

export { Expired }