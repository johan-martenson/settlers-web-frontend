import React, { PropsWithChildren, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FillInPlayerInformation } from './fill_in_player_information'
import './index.css'
import { Lobby } from './lobby'
import { FluentProvider, makeStyles, teamsDarkTheme, tokens } from '@fluentui/react-components'
import { GameId, PlayerId, PlayerInformation } from './api/types'
import Play from './play'
import { monitor } from './api/ws-api'
import { GameCreator } from './game_creator'
import { getFreeColor } from './utils'

type PlayState = 'ENTER_PLAYER_INFORMATION' | 'LOBBY' | 'PLAY_GAME' | 'CREATE_GAME'

function GameInit() {
    const [state, setState] = useState<PlayState>('ENTER_PLAYER_INFORMATION')
    const [player, setPlayer] = useState<PlayerInformation>()
    const [gameId, setGameId] = useState<GameId>()

    useEffect(
        () => {
            (async () => {
                const urlParams = new URLSearchParams(window.location.search)

                const gameId = urlParams.get('gameId')
                const playerId = urlParams.get('playerId')

                await monitor.connectAndWaitForConnection()

                if (gameId !== null && playerId !== null) {
                    await monitor.followGame(gameId, playerId)

                    setGameId(gameId)
                    setPlayer(monitor.players.get(playerId))
                    setState('PLAY_GAME')
                } else {
                    const selfPlayer = await monitor.createPlayer('', 'BROWN', 'AFRICANS', 'HUMAN')

                    console.log(selfPlayer)

                    setPlayer(selfPlayer)
                    setState('ENTER_PLAYER_INFORMATION')
                }
            })().then()
        }, [])

    async function onCreateNewGame(): Promise<void> {
        console.log('Creating empty game, then going to create game screen')

        if (player === undefined) {
            console.error('Player is undefined')

            return
        }

        const game = await monitor.createGame('', [player])

        monitor.followGame(game.id, player.id)

        setGameId(game.id)
        setState('CREATE_GAME')
    }

    async function onJoinExistingGame(gameId: GameId): Promise<void> {
        console.log(`Joining game ${gameId} as player ${JSON.stringify(player)}`)

        if (player === undefined) {
            console.error('The player is not set')

            return
        }

        await monitor.connectAndWaitForConnection()

        const nextColor = getFreeColor(Array.from(monitor.players.values()))
        const updatedPlayer = await monitor.updatePlayer(player.id, player.name, nextColor, player.nation)

        monitor.addPlayerToGame(gameId, player.id)

        await monitor.followGame(gameId, player.id)

        console.log(gameId)
        console.log(updatedPlayer)

        setGameId(gameId)
        setPlayer(updatedPlayer)
        setState('CREATE_GAME')
    }

    function onGameStarted(gameId: GameId, selfPlayerId: PlayerId): void {
        history.pushState(null, 'Settlers 2', `/?gameId=${gameId}&playerId=${selfPlayerId}`)

        setState('PLAY_GAME')
    }

    return (
        <div style={{
            backgroundImage: 'url("assets/backgrounds/ship.png")',
            height: '100vh',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
        }}>
            {state === 'ENTER_PLAYER_INFORMATION' &&
                <FillInPlayerInformation
                    onPlayerInformationDone={
                        async (name) => {
                            console.log(`Set player name: ${name}`)

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

            {state === 'LOBBY' && player &&
                <Lobby player={player} onJoinExistingGame={onJoinExistingGame} onCreateNewGame={onCreateNewGame} />
            }

            {state === 'CREATE_GAME' && player && gameId &&
                <GameCreator
                    onGameCreateCanceled={() => {
                        setState('LOBBY')
                        setGameId(undefined)
                    }}
                    selfPlayerId={player.id}
                    onGameStarted={onGameStarted}
                />
            }

            {state === 'PLAY_GAME' && gameId && player &&
                <Play
                    gameId={gameId}
                    selfPlayerId={player.id}
                    onLeaveGame={
                        () => {
                            setGameId(undefined)
                            setState('LOBBY')
                        }
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
        width: '100%',
        height: '100%'
    }
})

function AppWrapper({ children }: PropsWithChildren) {
    const className = useStyles()

    return (<div className={className.wrapper}>{children}</div>)
}
