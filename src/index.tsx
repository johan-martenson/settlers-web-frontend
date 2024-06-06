import React, { PropsWithChildren, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FillInPlayerInformation } from './fill_in_player_information'
import './index.css'
import { Lobby } from './lobby'
import { getPlayers } from './api/rest-api'
import { FluentProvider, makeStyles, teamsDarkTheme, tokens } from '@fluentui/react-components'
import { GameId, PlayerId } from './api/types'
import Play from './play'

function GameInit() {
    const [state, setState] = useState<"ENTER_PLAYER_INFORMATION" | "LOBBY" | "PLAY_GAME">("ENTER_PLAYER_INFORMATION")
    const [player, setPlayer] = useState<string>()
    const [gameId, setGameId] = useState<GameId>()
    const [selfPlayerId, setSelfPlayerId] = useState<PlayerId>()

    useEffect(
        () => {
            const urlParams = new URLSearchParams(window.location.search)
            const gameId = urlParams.get("gameId")
            const playerId = urlParams.get("playerId")

            if (gameId) {
                if (playerId === null || playerId === undefined) {
                    getPlayers(gameId).then(
                        (players) => {
                            const player = players[0]

                            setGameId(gameId)
                            setSelfPlayerId(player.id)
                            setState("PLAY_GAME")
                        })
                } else {
                    setGameId(gameId)
                    setSelfPlayerId(playerId)
                    setState("PLAY_GAME")
                }
            }
        },
        []
    )

    return (
        <div>
            {state === "ENTER_PLAYER_INFORMATION" &&
                <FillInPlayerInformation
                    onPlayerInformationDone={
                        (name) => {
                            console.log("Player entering lobby: " + name)

                            setPlayer(name)
                            setState("LOBBY")

                            console.log("Now in lobby")
                        }
                    }
                />
            }

            {state === "LOBBY" && player && <Lobby playerName={player} />}

            {state === "PLAY_GAME" && gameId && selfPlayerId &&
                <Play gameId={gameId}
                    selfPlayerId={selfPlayerId}
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
