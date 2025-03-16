import React from 'react'
import { Button } from '@fluentui/react-components'
import GameList from './game_list'
import './lobby.css'
import { GameId, PlayerInformation } from '../../api/types'
import { ChatBox } from '../../chat/chat'

// Types
type LobbyProps = {
    player: PlayerInformation

    onJoinExistingGame: (gameId: GameId) => void
    onCreateNewGame: () => void
}

// React components
/**
 * Lobby component that displays the available games and a chat box for the lobby.
 * 
 * @param {LobbyProps} props - The props for the Lobby component.
 */
const Lobby = ({ player, onCreateNewGame, onJoinExistingGame }: LobbyProps) => {
    return (
        <div id='lobby-screen'>
            <div id='lobby-title'>Lobby</div>
            <div id='game-list-title'><h1>Available games</h1></div>
            <div id='game-list'>
                <div id='game-list-content'>
                    <GameList onJoinGame={onJoinExistingGame}/>
                </div>
                <Button onClick={onCreateNewGame} autoFocus appearance='primary'>
                    Create new game
                </Button>
            </div>
            <div id='chat-title'><h1>Chat</h1></div>
            <div id='chat'>
                <ChatBox playerId={player.id} roomId='lobby' />
            </div>

        </div>
    )
}

export { Lobby }

