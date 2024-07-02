import React, { PropsWithChildren, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FillInPlayerInformation } from './fill_in_player_information'
import './index.css'
import { Lobby } from './lobby'
import { FluentProvider, makeStyles, teamsDarkTheme, tokens } from '@fluentui/react-components'
import { GameId, PlayerId, PlayerInformation } from './api/types'
import Play from './play'
import { monitor } from './api/ws-api'

function GameInit() {
    const [state, setState] = useState<"ENTER_PLAYER_INFORMATION" | "LOBBY" | "PLAY_GAME">("ENTER_PLAYER_INFORMATION")
    const [player, setPlayer] = useState<PlayerInformation>()
    const [gameId, setGameId] = useState<GameId>()

    useEffect(
        () => {
            async function connectToExistingGame(gameId: GameId, playerId: PlayerId) {
                await monitor.connectAndWaitForConnection()

                monitor.setGame(gameId)
                monitor.setSelfPlayer(playerId)

                const selfPlayer = await monitor.setSelfPlayer(playerId)

                setPlayer(selfPlayer)
                setGameId(gameId)
            }

            async function connectWithoutGame() {
                await monitor.connectAndWaitForConnection()

                const selfPlayer = await monitor.createPlayer('', 'BROWN', 'AFRICANS', 'HUMAN')

                console.log(selfPlayer)

                setPlayer(selfPlayer)
            }

            const urlParams = new URLSearchParams(window.location.search)

            const gameId = urlParams.get("gameId")
            const playerId = urlParams.get("playerId")

            if (gameId !== null && playerId !== null) {
                connectToExistingGame(gameId, playerId)

                setState('PLAY_GAME')
            } else {
                connectWithoutGame()
            }
        }, [])

    return (
        <div style={{
            backgroundImage: 'url("assets/backgrounds/ship.png")',
            height: '100vh',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
        }}>
            {state === "ENTER_PLAYER_INFORMATION" &&
                <FillInPlayerInformation
                    onPlayerInformationDone={
                        async (name) => {
                            console.log("Set player name: " + name)

                            if (player !== undefined) {
                                const updatedPlayer = await monitor.updatePlayer(player.id, name, player.color, player.nation)

                                console.log(updatedPlayer)

                                setPlayer(updatedPlayer)

                                setState('LOBBY')
                            } else {
                                console.error('Player is undefined')
                            }
                        }
                    }
                />
            }

            {state === "LOBBY" && player && <Lobby player={player} />}

            {state === "PLAY_GAME" && gameId && player &&
                <Play gameId={gameId}
                    selfPlayerId={player.id}
                    onLeaveGame={
                        () => setState("LOBBY")
                    }
                />
            }
        </div>
    )
}

const container = document.getElementById('root')

if (container) {
    const root = createRoot(container)

    root.render(
        <FluentProvider theme={teamsDarkTheme}>
            <AppWrapper>
                <GameInit />
            </AppWrapper>
        </FluentProvider>)
}

const useStyles = makeStyles({
    wrapper: {
        backgroundColor: tokens.colorNeutralBackground2,
        width: "100%",
        height: "100%"
    }
})

function AppWrapper({ children }: PropsWithChildren) {
    const className = useStyles()

    return (<div className={className.wrapper}>{children}</div>)
}
