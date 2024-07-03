import React, { useEffect, useState } from 'react'
import { deleteGame } from './api/rest-api'
import { Input, Button, Field, InputOnChangeData } from "@fluentui/react-components"
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import './game_creator.css'
import ManagePlayers from './manage_players'
import { GameId, PlayerId, MapInformation, PlayerInformation, ResourceLevel, GameState, GameInformation } from './api/types'
import { GameListener, monitor } from './api/ws-api'

const DEFAULT_COLOR = 'RED'
const DEFAULT_NATION = 'JAPANESE'

interface GameCreatorProps {
    playerName: string
    gameId?: GameId
    selfPlayerId?: PlayerId

    onGameStarted: (gameId: GameId, selfPlayerId: PlayerId) => void
    onGameCreateCanceled: () => void
    onGameIdSet: (gameId: GameId) => void
}

const GameCreator = ({ playerName, onGameStarted, onGameCreateCanceled, onGameIdSet, ...props }: GameCreatorProps) => {
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [gameId, setGameId] = useState<GameId | undefined>(props?.gameId)
    const [map, setMap] = useState<MapInformation>()
    const [selfPlayerId, setSelfPlayerId] = useState<PlayerId | undefined>(props?.selfPlayerId)
    const [othersCanJoin, setOthersCanJoin] = useState<boolean>(true)
    const [gameName, setGameName] = useState<string>('')
    const [initialResources, setInitialResources] = useState<ResourceLevel>('MEDIUM')
    const [players, setPlayers] = useState<PlayerInformation[]>([])
    const [candidateTitle, setCandidateTitle] = useState<string>()

    useEffect(
        () => {
            const listener: GameListener = {
                onMapChanged: (map: MapInformation) => setMap(map),
                onAllowOthersJoinChanged: (othersCanJoin: boolean) => {
                    console.log(`Setting others can join to ${othersCanJoin}`)

                    setOthersCanJoin(othersCanJoin)
                },
                onTitleChanged: (title: string) => setGameName(title),
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
                let game: GameInformation | undefined

                console.log('Create game (if needed)')
                console.log(`Game id: ${gameId}`)

                if (gameId !== undefined) {
                    console.log('Already have game id. Joining existing game')

                    setState('CREATE_GAME')

                    // Fill in state from the game
                    setPlayers(Array.from(monitor.players.values()))
                    setMap(monitor.map)
                    setOthersCanJoin(monitor.othersCanJoin ?? true)
                    setGameName(monitor.gameName ?? '')
                    setMap(game?.map)
                    setInitialResources(monitor?.initialResources ?? 'MEDIUM')
                } else {
                    console.log('No game id. Creating new game')

                    // Connect
                    await monitor.connectAndWaitForConnection()

                    console.log('Connected. Creating game')

                    // Create an empty game
                    const game = await monitor.createGame(gameName, players)

                    console.log(`Created game`)
                    console.log(game)

                    onGameIdSet(game.id)

                    // Set the default map
                    const maps = await monitor.getMaps()

                    console.log('Got maps')
                    console.log(maps)

                    const greenIslandsMap = maps.find(map => map.name === 'Green Islands')
                    let defaultMap = greenIslandsMap

                    if (!defaultMap && maps.length > 0) {
                        defaultMap = maps[0]
                    }

                    if (defaultMap !== undefined) {
                        console.log(`Setting map to map id: ${defaultMap.id}`)

                        monitor.setMap(defaultMap.id)

                        setMap(defaultMap)

                        console.log('Map set')
                    } else {
                        console.error(`Failed to find default map`)
                    }

                    // Add the self player
                    console.log('Adding player')

                    const selfPlayer = await monitor.createPlayer(playerName, DEFAULT_COLOR, DEFAULT_NATION, 'HUMAN')

                    await monitor.addPlayerToGame(selfPlayer.id)

                    console.log('Player added')
                    console.log(selfPlayer)

                    console.log('Starting to monitor')
                    monitor.followGame(game.id, selfPlayer.id)

                    console.log('Monitoring started')

                    setSelfPlayerId(selfPlayer.id)
                    setPlayers([selfPlayer])
                    setGameId(game.id)
                    setOthersCanJoin(game.othersCanJoin)
                    setGameName(game.name)
                    setMap(game?.map)
                    setInitialResources(game.initialResources)

                    console.log(game)
                }

                monitor.listenToGameState(listener)
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

                    <h1>{gameName}</h1>

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
                                selfPlayerId={selfPlayerId}
                                maxPlayers={map?.maxPlayers ?? 3}
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

