import React from 'react'
import { Button } from "@fluentui/react-components"
import GameList from './game_list'
import './lobby.css'
import { GameId, PlayerInformation } from './api/types'
import { ChatBox } from './chat/chat'

// Types
type LobbyProps = {
    player: PlayerInformation

    onJoinExistingGame: (gameId: GameId) => void
    onCreateNewGame: () => void
}

// React components
const Lobby = ({ player, onCreateNewGame, onJoinExistingGame }: LobbyProps) => {
    return (
        <div id="center-on-screen">

            <div id="list-games-or-create-new">
                <h1>Available games</h1>
                <GameList onJoinGame={(gameId: GameId) => onJoinExistingGame(gameId)} />
                <Button onClick={() => onCreateNewGame()} autoFocus appearance='primary'>Create new game</Button>
            </div>
            <div className='lobby-chat'>
                <h1>Chat</h1>
                <ChatBox playerId={player.id} roomId='lobby' />
            </div>

        </div>
    )
}

export { Lobby }

