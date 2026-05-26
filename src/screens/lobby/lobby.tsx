import React, { useEffect, useMemo } from 'react'
import { Button } from '@fluentui/react-components'
import GameList from './game_list'
import './lobby.css'
import { GameId, PlayerInformation } from '../../api/types'
import { ChatBox } from '../../components/chat/chat'
import { useGames } from '../../utils/hooks/hooks'
import { api } from '../../api/ws-api'
import { useTypingInput } from '../../utils/hooks/input'
import { executeCommand, findMatchingCommands, GenericCommand } from '../../utils/typing-commands'
import { DialogTyping } from '../../components/typing/typing'

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
    }, [])

    // Hooks
    const games = useGames()
    const { inputValue, keyTyped } = useTypingInput()

    // Memos
    const commands = useMemo(() => {
        const commands = new Map<string, GenericCommand<object>>()

        commands.set('Create new game', {
            action: () => onCreateNewGame()
        })

        commands.set('Join game', {
            type: 'ENUM',
            values: games.map(game => game.name),
            action: (context: unknown, gameName: string) => {
                const game = games.find(game => game.name === gameName)
                if (game) {
                    onJoinExistingGame(game.id)
                }
            }
        })

        commands.set('Remove game', {
            type: 'ENUM',
            values: games.map(game => game.name),
            action: (context: unknown, gameName: string) => {
                const game = games.find(game => game.name === gameName)
                if (game) {
                    api.deleteGame(game.id)
                }
            }
        })

        return commands
    }, [games, onCreateNewGame, onJoinExistingGame])

    // Rendering
    const matches = findMatchingCommands(commands, inputValue, new Object())
    const topMatch = matches[0]

    return (
        <div
            id='lobby-screen'
            tabIndex={0}
            ref={selfContainerRef}
            onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === 'Enter') {
                    try {
                        executeCommand(topMatch, 'inputValue')
                    } catch (error) {
                        console.error(`Lobby: failed to execute command ${inputValue}`, error)
                    }
                }

                keyTyped(event)
            }}>
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

            {inputValue && inputValue.length > 0 &&
                <div id='typing-input'>
                    <DialogTyping inputValue={inputValue} matches={matches} />
                </div>
            }

        </div>
    )
}

export { Lobby }

