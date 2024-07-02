import React, { useState } from 'react'
import { Button } from "@fluentui/react-components"
import { GameCreator } from './game_creator'
import GameList from './game_list'
import './lobby.css'
import { GameId, PLAYER_COLORS, PlayerColor, PlayerInformation } from './api/types'
import Play from './play'
import { monitor } from './api/ws-api'
import { ChatBox } from './chat/chat'

type LobbyStates = "LIST_GAMES" | "CREATE_GAME" | "PLAY_GAME" | "WAIT_FOR_GAME"

interface LobbyProps {
    player: PlayerInformation
}

const Lobby = ({ player }: LobbyProps) => {
    const [state, setState] = useState<LobbyStates>("LIST_GAMES")
    const [gameId, setGameId] = useState<GameId>()

    async function joinGame(gameId: GameId): Promise<void> {
        console.log("Joining game " + gameId + " as player " + JSON.stringify(player.name))

        // Connect
        console.log('Connect and wait')
        await monitor.connectAndWaitForConnection()
        console.log('Done')

        // Add self player
        const colorsRemaining = new Set<PlayerColor>(PLAYER_COLORS)

        Array.from(monitor.players.values()).forEach(player => colorsRemaining.delete(player.color))

        const nextColor = colorsRemaining.values().next().value

        const updatedPlayer = await monitor.updatePlayer(player.id, player.name, nextColor, player.nation)

        console.log(updatedPlayer)

        console.log('Add self player')
        monitor.addPlayerToGame(player.id)
        console.log(`Done`)

        console.log('Start monitoring')
        await monitor.followGame(gameId, player.id)
        console.log('Done')

        setGameId(gameId)
        setState('CREATE_GAME')
    }

    return (
        <div id="center-on-screen">

            {state === "CREATE_GAME" &&
                <GameCreator
                    playerName={player.name}
                    onGameCreateCanceled={() => setState("LIST_GAMES")}
                    gameId={gameId}
                    selfPlayerId={player.id}
                    onGameStarted={(gameId, selfPlayerId) => window.location.href = "?gameId=" + gameId + "&playerId=" + selfPlayerId}
                />
            }

            {state === "LIST_GAMES" &&
                <>
                    <div id="list-games-or-create-new">
                        <h1>Available games</h1>
                        <GameList onJoinGame={(gameId: GameId) => joinGame(gameId)} />
                        <Button onClick={() => setState("CREATE_GAME")} autoFocus appearance='primary'>Create new game</Button>
                    </div>
                    <div className='lobby-chat'>
                        <h1>Chat</h1>
                        <ChatBox player={player} />
                    </div>
                </>
            }

            {state === "PLAY_GAME" && gameId &&
                <Play gameId={gameId}
                    selfPlayerId={player.id}
                    onLeaveGame={
                        () => setState("LIST_GAMES")
                    }
                />
            }

            {state === "WAIT_FOR_GAME" &&
                <div>Waiting for the game to start...</div>
            }
        </div>
    )
}

export { Lobby }

