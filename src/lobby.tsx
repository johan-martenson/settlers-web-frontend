import React, { useState } from 'react'
import { addHumanPlayerToGame, getGameInformation } from './api/rest-api'
import { Button } from "@fluentui/react-components"
import { GameCreator } from './game_creator'
import GameList from './game_list'
import './lobby.css'
import { GameId, PlayerId } from './api/types'
import Play from './play'

type LobbyStates = "LIST_GAMES" | "CREATE_GAME" | "PLAY_GAME" | "WAIT_FOR_GAME"

interface LobbyProps {
    playerName: string
}

const Lobby = ({ playerName }: LobbyProps) => {
    const [state, setState] = useState<LobbyStates>("LIST_GAMES")
    const [gameId, setGameId] = useState<GameId>()
    const [selfPlayerId, setSelfPlayerId] = useState<PlayerId>()

    async function waitForGameToStart(gameId: GameId): Promise<void> {
        if (gameId) {
            const game = await getGameInformation(gameId)

            if (game.status === "STARTED") {
                window.location.href = "?gameId=" + game.id + "&playerId=" + selfPlayerId
            } else {
                setTimeout(() => waitForGameToStart(gameId), 100)
            }
        }
    }

    async function joinGame(gameId: GameId): Promise<void> {
        console.log("Joining game " + gameId + " as player " + JSON.stringify(playerName))

        try {
            const player = await addHumanPlayerToGame(gameId, playerName, "#123456", "ROMANS")

            setGameId(gameId)
            setSelfPlayerId(player.id)
            setState("WAIT_FOR_GAME")

            waitForGameToStart(gameId)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div id="center-on-screen">

            {state === "CREATE_GAME" &&
                <GameCreator
                    playerName={playerName}
                    onGameCreateCanceled={() => setState("LIST_GAMES")}
                    onGameStarted={(gameId, selfPlayerId) => window.location.href = "?gameId=" + gameId + "&playerId=" + selfPlayerId}
                />
            }

            {state === "LIST_GAMES" &&
                <>
                    <div id="list-games-or-create-new">
                        <GameList onJoinGame={(gameId: GameId) => joinGame(gameId)} />
                        <Button onClick={() => setState("CREATE_GAME")} autoFocus appearance='primary'>Create new game</Button>
                    </div>
                </>
            }

            {state === "PLAY_GAME" && gameId && selfPlayerId &&
                <Play gameId={gameId}
                    selfPlayerId={selfPlayerId}
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

