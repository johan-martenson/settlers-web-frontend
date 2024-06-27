import React, { useEffect, useState } from 'react'
import { deleteGame, getMaps } from './api/rest-api'
import { Input, Button, Field, InputOnChangeData } from "@fluentui/react-components"
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import './game_creator.css'
import ManagePlayers from './manage_players'
import { GameId, PlayerId, MapInformation, PlayerInformation, ResourceLevel, GameState } from './api/types'
import { GameListener, monitor } from './api/ws-api'

const DEFAULT_COLOR = 'RED'
const DEFAULT_NATION = 'JAPANESE'

interface GameCreatorProps {
    playerName: string

    onGameStarted: ((gameId: GameId, selfPlayerId: PlayerId) => void)
    onGameCreateCanceled: (() => void)
}

const GameCreator = ({ playerName, onGameStarted, onGameCreateCanceled }: GameCreatorProps) => {
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [gameId, setGameId] = useState<GameId>()
    const [map, setMap] = useState<MapInformation>()
    const [selfPlayerId, setSelfPlayerId] = useState<PlayerId>()
    const [othersCanJoin, setOthersCanJoin] = useState<boolean>(true)
    const [name, setName] = useState<string>('')
    const [initialResources, setInitialResources] = useState<ResourceLevel>('MEDIUM')
    const [players, setPlayers] = useState<PlayerInformation[]>([])
    const [candidateTitle, setCandidateTitle] = useState<string>()

    useEffect(
        () => {
            const listener: GameListener = {
                onMapChanged: (map: MapInformation) => setMap(map),
                onAllowOthersJoinChanged: (othersCanJoin: boolean) => setOthersCanJoin(othersCanJoin),
                onTitleChanged: (title: string) => setName(title),
                onInitialResourcesChanged: (resources: ResourceLevel) => setInitialResources(resources),
                onPlayersChanged: (players: PlayerInformation[]) => setPlayers(players),
                onGameStateChanged: (gameState: GameState) => {
                    if (gameState === 'STARTED') {
                        if (monitor.gameId === undefined) {
                            console.error('Game id is undefined')

                            return
                        }

                        if (monitor.playerId === undefined) {
                            console.error("Player id is undefined")

                            return
                        }

                        onGameStarted(monitor.gameId, monitor.playerId)
                    }
                },
            }

            async function createEmptyGameAndStartListening() {
                const maps = await getMaps()

                const greenIslandsMap = maps.find(map => map.title === 'Green Islands')
                let defaultMap = greenIslandsMap

                if (!defaultMap && maps.length > 0) {
                    defaultMap = maps[0]
                }

                if (defaultMap !== undefined) {
                    const game = await monitor.connectToNewGame(
                        '',
                        defaultMap.id,
                        [
                            {
                                name: playerName,
                                color: DEFAULT_COLOR,
                                nation: DEFAULT_NATION
                            }
                        ],
                    )

                    console.log('Created game')
                    console.log(game)

                    setSelfPlayerId(game.players[0].id)
                    setPlayers(game.players)
                    setMap(defaultMap)
                    setGameId(game.id)

                    monitor.listenToGameState(listener)
                } else {
                    console.error('Failed to load the default map')
                }
            }

            createEmptyGameAndStartListening()

            return () => monitor.stopListeningToGameState(listener)
        }, []
    )

    return (
        <>
            {state === "GET_NAME_FOR_GAME" &&
                <div>

                    <div className="set-game-name-label">

                        <Field label={"Enter a name for the game"} style={{ flex: "1 0 100%" }}>
                            <Input type="text" placeholder="Name..."
                                autoFocus
                                onChange={
                                    (_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                        setCandidateTitle(data.value)
                                    }
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && candidateTitle !== undefined) {
                                        monitor.setTitle(candidateTitle)

                                        setState('CREATE_GAME')
                                    }
                                }}

                                tabIndex={-1}
                            />
                        </Field>
                        <Button onClick={() => {
                            if (monitor.gameId !== undefined) {
                                deleteGame(monitor.gameId)
                            } else {
                                console.error('Game id is not set')
                            }

                            onGameCreateCanceled()
                        }} >Cancel</Button>
                        <Button
                            disabled={!candidateTitle}
                            appearance='primary'
                            onClick={() => {
                                if (candidateTitle !== undefined) {
                                    monitor.setTitle(candidateTitle)

                                    setState('CREATE_GAME')
                                }
                            }}
                        >Create game</Button>
                    </div>
                </div>
            }

            {state === "CREATE_GAME" && gameId && selfPlayerId &&
                <div className="game-creation-screen">

                    <h1>{name}</h1>

                    <div className="create-game-columns">

                        <div className='options-column'>
                            <GameOptions
                                initialResources={initialResources}
                                othersCanJoin={othersCanJoin}
                                setAvailableResources={(resources) => monitor.setInitialResources(resources)}
                                setOthersCanJoin={(othersCanJoin: boolean) => monitor.setOthersCanJoin(othersCanJoin)}
                            />
                        </div>

                        <div className='players-column'>
                            <ManagePlayers
                                gameId={gameId}
                                selfPlayerId={selfPlayerId}
                                maxPlayers={map?.maxPlayers ?? 3}
                                players={players}
                            />
                        </div>

                        <div className='map-column'>
                            <MapSelection onMapSelected={(map: MapInformation) => monitor.setMap(map.id)} minPlayers={players.length} />
                        </div>
                    </div>
                    <div className='start-or-cancel'>
                        <Button onClick={() => {
                            if (monitor.gameId !== undefined) {
                                deleteGame(monitor.gameId)
                            } else {
                                console.error('Game id is not set')
                            }

                            onGameCreateCanceled()

                        }} >Discard game</Button>
                        <Button onClick={async () => {
                            monitor.startGame()
                        }}
                            disabled={!map}

                            appearance='primary'
                        >Launch game</Button>
                    </div>
                </div>
            }

        </>
    )
}

export { GameCreator }

