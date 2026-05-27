import { useEffect, useMemo, useState } from "react"
import { GameId, GameState, PlayerId } from "../../api/types"
import { api, GameListener } from "../../api/ws-api"
import { PlayLogConfig } from "./config"

function useGameState(selfPlayerId: PlayerId, gameId: GameId) {
    const [gameState, setGameState] = useState<GameState>('STARTED')
    const [monitoringReady, setMonitoringReady] = useState<boolean>(false)

    // Listener callbacks for monitoring the game state
    const gameMonitorCallbacks = useMemo<GameListener>(() => ({
        onMonitoringStarted: () => {
            setMonitoringReady(true)

            if (PlayLogConfig.gameState) {
                console.log('Play (game state): Monitoring started')
            }
        },
        onGameStateChanged: (gameState: GameState) => setGameState(gameState)
    }), [])


    // Effect: follow the game and listen to the game state
    useEffect(() => {
        let cancelled = false

        async function connectAndFollow(gameId: GameId, selfPlayerId: PlayerId): Promise<void> {
            await api.connectAndWaitForConnection()

            if (cancelled) {
                console.warn('Play (game state): Connection established but effect already cancelled, aborting follow')

                return
            }

            api.addGameStateListener(gameMonitorCallbacks)

            console.log('Play (game state): Connected to API, now starting to follow game')

            await api.followGame(gameId, selfPlayerId)
        }

        if (PlayLogConfig.gameState) {
            console.log(`Play (game state): Start listening to game with gameId ${gameId} and playerId ${selfPlayerId}`)
        }

        connectAndFollow(gameId, selfPlayerId)

        return () => {
            cancelled = true

            if (PlayLogConfig.gameState) {
                console.log('Play (game state): Stop listening to game')
            }

            api.removeGameStateListener(gameMonitorCallbacks)
            api.stopFollowingGame()
        }
    }, [PlayLogConfig.gameState, gameId, selfPlayerId, gameMonitorCallbacks])

    return {
        gameState,
        monitoringReady
    }
}

export {
    useGameState
}


