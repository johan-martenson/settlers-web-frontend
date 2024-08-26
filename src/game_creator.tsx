import React, { useEffect, useState } from 'react'
import { Input, Button, Field, InputOnChangeData } from '@fluentui/react-components'
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import ManagePlayers from './manage_players'
import { GameId, PlayerId, MapInformation, GameInformation } from './api/types'
import { GameListener, api } from './api/ws-api'
import { ChatBox } from './chat/chat'
import { Center } from './components/center'

// Types
type GameCreatorProps = {
    selfPlayerId: PlayerId

    onGameStarted: (gameId: GameId, selfPlayerId: PlayerId) => void
    onGameCreateCanceled: () => void
}

// React component
const GameCreator = ({ selfPlayerId, onGameStarted, onGameCreateCanceled }: GameCreatorProps) => {
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [candidateTitle, setCandidateTitle] = useState<string>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()

    // Depends on the parent component:
    //  - Creating the game
    //  - Creating the player and adding it to the game
    //  - Starting to follow the game
    useEffect(() => {

        // Listen to the game meta data
        const listener: GameListener = {
            onGameInformationChanged: (changedGameInformation: GameInformation) => {
                if (changedGameInformation.status === 'STARTED' && gameInformation?.status !== 'STARTED') {
                    if (api.gameId === undefined) {
                        console.error('Game id is undefined')
                        return
                    }

                    if (api.playerId === undefined) {
                        console.error('Player id is undefined')
                        return
                    }

                    onGameStarted(api.gameId, api.playerId)
                }

                setGameInformation(changedGameInformation)
            }
        }

        api.addGameStateListener(listener);

        // Connect to an existing game or create a new one
        (async () => {
            const gameInformation = await api.getGameInformation()

            setGameInformation(gameInformation)
            setState('CREATE_GAME')

            // Set the default map if there is no map set
            if (gameInformation?.map === undefined) {
                const maps = await api.getMaps()
                const greenIslandsMap = maps.find(map => map.name === 'Green Islands')
                api.setMap(greenIslandsMap?.id ?? maps[0].id)
            }

            // Get a name for the game if none is set, otherwise go directly to the create screen
            if (!gameInformation?.name) {
                setState('GET_NAME_FOR_GAME')
            } else {
                setState('CREATE_GAME')
            }
        })()

        return () => api.removeGameStateListener(listener)
    }, [])

    return (
        <>
            {state === 'GET_NAME_FOR_GAME' &&
                <Center>

                    <div className='set-game-name-label'>

                        <Field label={'Enter a name for the game'} style={{ flex: '1 0 100%' }}>
                            <Input
                                type='text'
                                placeholder='Name...'
                                autoFocus
                                onChange={(_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                    setCandidateTitle(data.value)
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && candidateTitle !== undefined) {
                                        api.setTitle(candidateTitle)

                                        setState('CREATE_GAME')
                                    }
                                }}
                                tabIndex={-1}
                            />
                        </Field>
                        <Button onClick={() => {
                            if (api.gameId !== undefined) {
                                api.deleteGame()
                            } else {
                                console.error('Game id is not set')
                            }

                            onGameCreateCanceled()
                        }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!candidateTitle}
                            appearance='primary'
                            onClick={() => {
                                if (candidateTitle !== undefined) {
                                    api.setTitle(candidateTitle)

                                    setState('CREATE_GAME')
                                }
                            }}
                        >
                            Create game
                        </Button>
                    </div>
                </Center>
            }

            {state === 'CREATE_GAME' && gameInformation?.id && selfPlayerId &&
                <div className='game-creation-screen'>

                    <h1>{gameInformation?.name ?? ''}</h1>

                    <div className='create-game-columns'>

                        <div className='options-column'>
                            <GameOptions
                                initialResources={gameInformation?.initialResources ?? 'MEDIUM'}
                                othersCanJoin={gameInformation?.othersCanJoin ?? true}
                                setAvailableResources={resources => api.setInitialResources(resources)}
                                setOthersCanJoin={othersCanJoin => api.setOthersCanJoin(othersCanJoin)}
                            />
                        </div>

                        <div className='players-column'>
                            <ManagePlayers
                                selfPlayerId={selfPlayerId}
                                maxPlayers={gameInformation?.map?.maxPlayers ?? 3}
                            />
                        </div>

                        <div className='map-column'>
                            <MapSelection onMapSelected={map => {
                                console.log(map)
                                console.log(gameInformation)

                            if (!gameInformation?.map || gameInformation.map.id !== map.id) {
                                    api.setMap(map.id)
                                }
                            }}
                                minPlayers={gameInformation?.players.length ?? 0} />
                        </div>

                        <div className='game-create-chat'>
                            <h2>Chat</h2>
                            <ChatBox playerId={selfPlayerId} roomId={`game-${gameInformation?.id}`} />
                        </div>
                    </div>
                    <div className='start-or-cancel'>
                        <Button onClick={() => {
                            if (api.gameId !== undefined) {
                                api.deleteGame()
                            } else {
                                console.error('Game id is not set')
                            }

                            onGameCreateCanceled()

                        }} >
                            Discard game
                        </Button>
                        <Button onClick={async () => {
                            api.startGame()

                            onGameStarted(gameInformation?.id, selfPlayerId)
                        }}
                            disabled={!gameInformation?.map}
                            appearance='primary'
                        >
                            Launch game
                        </Button>
                    </div>
                </div>
            }

        </>
    )
}

export { GameCreator }

