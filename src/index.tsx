import React, { PropsWithChildren, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FillInPlayerInformation } from './screens/start/fill_in_player_information'
import './index.css'
import { Lobby } from './screens/lobby/lobby'
import { FluentProvider, makeStyles, teamsDarkTheme, tokens } from '@fluentui/react-components'
import { GameId, Nation, PlayerColor, PlayerId, PlayerInformation } from './api/types'
import Play from './screens/play/play'
import { api } from './api/ws-api'
import { GameCreator } from './screens/create_game/game_creator'
import { getFreeColor } from './utils/utils'

// Types
type PlayState = 'CONNECTING' | 'ENTER_PLAYER_INFORMATION' | 'LOBBY' | 'PLAY_GAME' | 'CREATE_GAME'

// Constants
const useStyles = makeStyles({
    wrapper: {
        backgroundColor: tokens.colorNeutralBackground2,
        width: '100%',
        height: '100%'
    }
})

const DEFAULT_PLAYER_COLOR: PlayerColor = 'WHITE'
const DEFAULT_PLAYER_NATION: Nation = 'JAPANESE'

const container = document.getElementById('root')

// React components
function GameInit() {
    const [state, setState] = useState<PlayState>('CONNECTING')
    const [player, setPlayer] = useState<PlayerInformation>()
    const [gameId, setGameId] = useState<GameId>()

    useEffect(() => {
        (async () => {
            const urlParams = new URLSearchParams(window.location.search)

            console.log('Index: location and url params', window.location, urlParams.toString())
            const gameId = urlParams.get('gameId')
            const playerId = urlParams.get('playerId')

            await api.connectAndWaitForConnection()

            setState('ENTER_PLAYER_INFORMATION')

            if (window.location.pathname === '/play' && gameId !== null && playerId !== null) {
                await api.followGame(gameId, playerId)

                setGameId(gameId)
                setPlayer(api.players.get(playerId))
                setState('PLAY_GAME')
            } else if (window.location.pathname === '/create' && gameId !== null && playerId !== null) {
                await api.followGame(gameId, playerId)

                console.log(`Index: Going to create game with gameId ${gameId} and playerId ${playerId}`)

                setGameId(gameId)
                setPlayer(api.players.get(playerId))
                setState('CREATE_GAME')
            } else {
                const selfPlayer = await api.createPlayer(
                    localStorage.getItem('playerName') ?? '',
                    DEFAULT_PLAYER_COLOR,
                    (localStorage.getItem('playerNation') ?? DEFAULT_PLAYER_NATION) as Nation,
                    'HUMAN'
                )

                console.log(selfPlayer)

                setPlayer(selfPlayer)
                setState('ENTER_PLAYER_INFORMATION')
            }
        })()
    }, [])

    async function onCreateNewGame(): Promise<void> {
        console.log('Index: Creating empty game, then going to create game screen')

        if (player === undefined) {
            console.error('Index: Player is undefined')
            return
        }

        const game = await api.createGame('', [player])

        api.followGame(game.id, player.id)

        setGameId(game.id)
        setState('CREATE_GAME')
        history.pushState(null, 'Settlers 2', `/create?gameId=${game.id}&playerId=${player.id}`)
    }

    async function onJoinExistingGame(gameId: GameId): Promise<void> {
        console.log(`Index: Joining game ${gameId} as player ${JSON.stringify(player)}`)

        if (player === undefined) {
            console.error('The player is not set')
            return
        }

        await api.connectAndWaitForConnection()

        const nextColor = getFreeColor(Array.from(api.players.values()))

        if (nextColor === undefined) {
            console.error(`Index: No free colors available for the player. Can't join game`)

            return
        }

        const updatedPlayer = await api.updatePlayer(player.id, player.name, nextColor, player.nation)

        api.addPlayerToGame(gameId, player.id)
        await api.followGame(gameId, player.id)

        console.log(gameId)
        console.log(updatedPlayer)

        setGameId(gameId)
        setPlayer(updatedPlayer)
        setState('CREATE_GAME')
    }

    function onGameStarted(gameId: GameId, selfPlayerId: PlayerId): void {
        history.pushState(null, 'Settlers 2', `/play?gameId=${gameId}&playerId=${selfPlayerId}`)
        setState('PLAY_GAME')
    }

    // Rendering
    return (
        <div style={{
            backgroundImage: "url('assets/backgrounds/ship.png')",
            height: '100vh',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
        }}>
            {state === 'CONNECTING' &&
                <div>Connecting...</div>
            }

            {state === 'ENTER_PLAYER_INFORMATION' &&
                <FillInPlayerInformation
                    onPlayerInformationDone={async (name) => {
                        console.log(`Set player name: ${name}`)

                        if (player !== undefined) {
                            const updatedPlayer = await api.updatePlayer(player.id, name, player.color, player.nation)

                            console.log(updatedPlayer)

                            setPlayer(updatedPlayer)
                            setState('LOBBY')
                        } else {
                            console.error('Player is undefined')
                        }
                    }}
                />
            }

            {state === 'LOBBY' && player &&
                <Lobby player={player} onJoinExistingGame={onJoinExistingGame} onCreateNewGame={onCreateNewGame} />
            }

            {state === 'CREATE_GAME' && player && gameId &&
                <GameCreator
                    onGameCreateCanceled={() => {
                        api.stopFollowingGame()
                        setState('LOBBY')
                        setGameId(undefined)
                        history.pushState(null, 'Settlers 2', `/`)
                    }}
                    selfPlayerId={player.id}
                    onGameStarted={onGameStarted}
                />
            }

            {state === 'PLAY_GAME' && gameId && player &&
                <Play
                    gameId={gameId}
                    selfPlayerId={player.id}
                    onLeaveGame={() => {
                        setGameId(undefined)
                        setState('LOBBY')
                    }}
                />
            }
        </div>
    )
}


if (container) {
    const root = createRoot(container)

    root.render(
        <FluentProvider theme={teamsDarkTheme}>
            <AppWrapper>
                <GameInit />
            </AppWrapper>
        </FluentProvider>)
}

function AppWrapper({ children }: PropsWithChildren) {
    const className = useStyles()

    return (<div className={className.wrapper}>{children}</div>)
}
