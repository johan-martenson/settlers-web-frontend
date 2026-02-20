import React, { useCallback, useEffect } from 'react'
import { Button } from '@fluentui/react-components'
import GameList from './game_list'
import './lobby.css'
import { GameId, PlayerInformation } from '../../api/types'
import { ChatBox } from '../../components/chat/chat'
import { dispatchInputKey, GenericCommand, GenericTypeControl } from '../play/type_control'
import { useGames } from '../../utils/hooks/hooks'
import { api } from '../../api/ws-api'

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


    // References
    const selfContainerRef = React.useRef<HTMLDivElement>(null)

    // Effects
    useEffect(() => {
        selfContainerRef?.current?.focus()
    }, [selfContainerRef])

    // Monitoring
    const games = useGames()

    // Callbacks
    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            dispatchInputKey({
                key: event.key,
                metaKey: event.metaKey,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            })
        } else {
            dispatchInputKey({
                key: event.key,
                metaKey: event.metaKey,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            })
        }
    }, [dispatchInputKey])

    // Rendering
    const commands = new Map<string, GenericCommand<object>>()

    commands.set('Create new game', {
        action: () => onCreateNewGame(),
        icon: <></>
    })

    games.forEach(game => {
        commands.set(`Join ${game.name}`, {
            action: () => {
                console.log('Joining game with id ' + game.id)
                onJoinExistingGame(game.id)
            },
            icon: <></>
        })
    })
    games.forEach(game => {
        commands.set(`Remove game ${game.name}`, {
            action: () => {
                api.deleteGame(game.id)
            },
            icon: <></>
        })
    })

    return (
        <div id='lobby-screen' tabIndex={0} ref={selfContainerRef} onKeyDown={onKeyDown}>
            <div id='lobby-title'>Lobby</div>
            <div id='game-list-title'><h1>Available games</h1></div>
            <div id='game-list'>
                <div id='game-list-content'>
                    <GameList onJoinGame={onJoinExistingGame} />
                </div>
                <Button onClick={onCreateNewGame} autoFocus appearance='primary'>
                    Create new game
                </Button>
            </div>
            <div id='chat-title'><h1>Chat</h1></div>
            <div id='chat'>
                <ChatBox playerId={player.id} roomId='lobby' />
            </div>

            <GenericTypeControl<object> commands={commands} param={{} as object} />

        </div>
    )
}

export { Lobby }

