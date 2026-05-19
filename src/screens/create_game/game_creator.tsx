import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input, Button, Field, InputOnChangeData } from '@fluentui/react-components'
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import ManagePlayers from './manage_players'
import { GameId, PlayerId, GameInformation, NATIONS } from '../../api/types'
import { GameListener, api } from '../../api/ws-api'
import { ChatBox } from '../../components/chat/chat'
import { Center } from '../../components/center'
import { dispatchInputKey, GenericCommand, GenericTypeControl } from '../play/type_control'
import { UiIcon } from '../../icons/icon'
import { useMaps } from '../../utils/hooks/hooks'
import { addComputerPlayer } from '../../api/utils'


// Types
type GameCreatorProps = {
    selfPlayerId: PlayerId

    onGameStarted: (gameId: GameId, selfPlayerId: PlayerId) => void
    onGameCreateCanceled: () => void
}

// Constants
const LOBBY_TYPING_SOURCE = 'LOBBY'

// React component
const GameCreator = ({ selfPlayerId, onGameStarted, onGameCreateCanceled }: GameCreatorProps) => {

    // References
    const selfContainerRef = useRef<HTMLDivElement | null>(null)
    const gameInformationRef = useRef<GameInformation>()

    // State
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [candidateTitle, setCandidateTitle] = useState<string>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()

    // Monitoring hooks
    const maps = useMaps()

    // Callbacks
    const onStartGameClicked = () => {
        if (gameInformation?.id !== undefined) {
            api.startGame(gameInformation?.id ?? '')
            onGameStarted(gameInformation?.id, selfPlayerId)
        } else {
            console.error('Game id is not set')
        }
    }

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        dispatchInputKey({
            key: event.key,
            metaKey: event.metaKey,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey
        },
            LOBBY_TYPING_SOURCE)
    }, [dispatchInputKey])

    // Memoized values
    const commands = useMemo(() => {
        const commands = new Map<string, GenericCommand<GameInformation>>()

        commands.set('Start game', {
            action: onStartGameClicked,
            hidden: state !== 'CREATE_GAME',
            icon: <UiIcon type='PLAY' />
        })
        commands.set('Leave game', {
            action: () => {
                api.removePlayer(selfPlayerId)
                onGameCreateCanceled()
            },
            hidden: state !== 'CREATE_GAME'
        })
        commands.set('Discard game', {
            action: () => {
                if (api.gameId !== undefined) {
                    console.log('Deleting game with id ' + api.gameId)

                    api.deleteGame(api.gameId)
                    api.stopFollowingGame()
                } else {
                    console.error('Game id is not set')
                }

                onGameCreateCanceled()
            },
            hidden: state !== 'CREATE_GAME',
            icon: <UiIcon type='TRASHCAN' />
        })
        commands.set('Cheating on/off', {
            action: (gameInformation: GameInformation) => {
                api.setCheating(!gameInformation.cheatingEnabled)
            },
            hidden: state !== 'CREATE_GAME'
        })
        NATIONS.forEach(nation => {
            commands.set(`Play as ${nation.toLocaleLowerCase()}`, {
                action: (gameInformation: GameInformation) => {
                    const selfPlayer = gameInformation.players.find(player => player.id === selfPlayerId)

                    if (selfPlayer) {
                        api.updatePlayer(selfPlayerId, selfPlayer.name, selfPlayer.color, nation)
                    }
                }
            })
        })
        maps.forEach(map => {
            commands.set('Map: ' + map.name, {
                action: (gameInformation: GameInformation) => {
                    if (!gameInformation.map || gameInformation.map.id !== map.id) {
                        api.setMap(map.id)
                    }
                }
            })
        })
        commands.set('Low resources', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_gameInformation: GameInformation) => {
                api.setInitialResources('LOW')
            }
        })
        commands.set('Medium resources', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_gameInformation: GameInformation) => {
                api.setInitialResources('MEDIUM')
            }
        })
        commands.set('High resources', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_gameInformation: GameInformation) => {
                api.setInitialResources('HIGH')
            }
        })
        commands.set('Others can join', {
            action: (gameInformation: GameInformation) => {
                api.setOthersCanJoin(!gameInformation.othersCanJoin)
            }
        })
        commands.set('Add computer player', {
            action: (gameInformation: GameInformation) => {
                addComputerPlayer(gameInformation.players, gameInformation.map?.maxPlayers ?? 3)
            }
        })
        gameInformation?.players
            .filter(player => player.id !== selfPlayerId)
            .forEach(player => {
                commands.set('Kick ' + player.name, {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    action: (_gameInformation: GameInformation) => {
                        api.removePlayer(player.id)
                    }
                })
            })

        return commands
    }, [state, maps, gameInformation, selfPlayerId, onStartGameClicked, onGameCreateCanceled])

    // Effects
    // Effect: Keep focusing the container to be able to catch keyboard events
    useEffect(() => {
        selfContainerRef?.current?.focus()
    }, [selfContainerRef])

    // Effect: Keep the game information reference up to date for the commands
    useEffect(() => {
        gameInformationRef.current = gameInformation
    }, [gameInformation])

    // Depends on the parent component:
    //  - Creating the game
    //  - Creating the player and adding it to the game
    //  - Starting to follow the game
    useEffect(() => {
        let cancelled = false

        // Listen to the game meta data
        const listener: GameListener = {
            onGameInformationChanged: (changedGameInformation: GameInformation) => {
                if (changedGameInformation.status === 'STARTED' && gameInformationRef.current?.status !== 'STARTED') {
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

                console.log('Game information changed', changedGameInformation)

                setGameInformation(changedGameInformation)
            }
        }

        api.addGameStateListener(listener);

        // Connect to an existing game or create a new one
        (async () => {
            const gameInformation = await api.getGameInformation()

            if (cancelled) {
                console.error('Cancelled while fetching game information')

                return
            }

            setGameInformation(gameInformation)
            setState('CREATE_GAME')

            // Set the default map if there is no map set
            if (gameInformation?.map === undefined) {
                const maps = await api.getMaps()

                if (cancelled) {
                    console.error('Cancelled while fetching maps')

                    return
                }

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

        return () => {
            cancelled = true
            api.removeGameStateListener(listener)
        }
    }, [])

    console.log('Rendering based on game information', gameInformation)

    return (
        <>
            {state === 'GET_NAME_FOR_GAME' &&
                <Center>

                    <div className='set-game-name-label'>

                        <Field label={'Enter a name for the game'} style={{ flex: '1 0 100%' }}>
                            <Input
                                id='set-name-for-game'
                                type='text'
                                placeholder='Name...'
                                autoFocus
                                onChange={(_event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                    setCandidateTitle(data.value)
                                }}
                                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
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
                                api.deleteGame(api.gameId)
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
                <div id='game-creation-screen' onKeyDown={onKeyDown} ref={selfContainerRef} tabIndex={-1}>

                    <div id='title'>Create game: {gameInformation?.name ?? ''}</div>

                    <div id='options-title'><h2>Options</h2></div>
                    <div id='options'>
                        <GameOptions
                            initialResources={gameInformation?.initialResources ?? 'MEDIUM'}
                            othersCanJoin={gameInformation?.othersCanJoin ?? true}
                            cheatingEnabled={gameInformation?.cheatingEnabled ?? false}
                            onResourcesChange={resources => api.setInitialResources(resources)}
                            onOthersCanJoinChange={othersCanJoin => api.setOthersCanJoin(othersCanJoin)}
                            onCheatingEnabledChange={cheatingEnabled => api.setCheating(cheatingEnabled)}
                        />
                    </div>

                    <div id='players-title'><h2>Players</h2></div>
                    <div id='players'>
                        <ManagePlayers
                            gameId={gameInformation.id}
                            selfPlayerId={selfPlayerId}
                            maxPlayers={gameInformation?.map?.maxPlayers ?? 3}
                        />
                    </div>

                    <div id='map-title'><h2>Select map</h2></div>
                    <div id='map'>
                        <MapSelection onMapSelected={map => {
                            console.log('Selected map', map)
                            if (!gameInformation?.map || gameInformation.map.id !== map.id) {
                                api.setMap(map.id)
                            }
                        }}
                            minPlayers={gameInformation?.players.length ?? 0} />
                    </div>

                    <div id='chat-title'><h2>Chat</h2></div>
                    <div id='chat'>
                        <ChatBox playerId={selfPlayerId} roomId={`game-${gameInformation?.id}`} />
                    </div>
                    <div id='start-or-cancel'>
                        <Button onClick={() => {
                            onGameCreateCanceled()
                        }} >
                            Leave
                        </Button>
                        <Button onClick={() => {
                            if (api.gameId !== undefined) {
                                api.deleteGame(api.gameId)
                            } else {
                                console.error('Game id is not set')
                            }

                            onGameCreateCanceled()

                        }} >
                            Discard game
                        </Button>
                        <Button onClick={onStartGameClicked}
                            disabled={!gameInformation?.map}
                            appearance='primary'
                        >
                            Launch game
                        </Button>
                    </div>
                    <div id='typing-control'>
                        <GenericTypeControl<GameInformation>
                        commands={commands}
                        param={gameInformation}
                        typingSource={LOBBY_TYPING_SOURCE}
                        />
                    </div>

                </div>
            }

        </>
    )
}

export { GameCreator }

