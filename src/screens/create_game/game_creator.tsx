import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input, Button, Field, InputOnChangeData } from '@fluentui/react-components'
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import ManagePlayers from './manage_players'
import { GameId, PlayerId, GameInformation, NATIONS, isNation, MapInformation, ResourceLevel } from '../../api/types'
import { GameListener, api } from '../../api/ws-api'
import { ChatBox } from '../../components/chat/chat'
import { Center } from '../../components/center'
import { useMaps } from '../../utils/hooks/hooks'
import { addComputerPlayer } from '../../api/utils'
import { useTypingInput } from '../../utils/hooks/input'
import { executeCommand, findMatchingCommands, GenericCommand } from '../../utils/typing-commands'
import { UiIcon } from '../../components/icons/icon'
import { DialogTyping } from '../../components/typing/typing'


// Types
type GameCreatorProps = {
    selfPlayerId: PlayerId

    onGameStarted: (gameId: GameId, selfPlayerId: PlayerId) => void
    onGameCreateCanceled: () => void
}

// React component
const GameCreator = ({ selfPlayerId, onGameStarted, onGameCreateCanceled }: GameCreatorProps) => {

    // References
    const selfContainerRef = useRef<HTMLDivElement | null>(null)
    const gameInformationRef = useRef<GameInformation>(undefined)

    // State
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [candidateTitle, setCandidateTitle] = useState<string>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()
    const [filterTitle, setSearchTitle] = useState<string>('')
    const [filterAuthor, setSearchAuthor] = useState<string>('')
    const [filterMinPlayers, setFilterMinPlayers] = useState<number>(1)
    const [filterMaxPlayers, setFilterMaxPlayers] = useState<number>(8)

    // Monitoring hooks
    const maps = useMaps()
    const { inputValue, keyTyped } = useTypingInput()

    // Functions
    const onStartGameClicked = () => {
        if (gameInformation?.id !== undefined) {
            api.startGame(gameInformation?.id ?? '')
            onGameStarted(gameInformation?.id, selfPlayerId)
        } else {
            console.error('Game id is not set')
        }
    }

    const cancelAndRemoveGame = useCallback(() => {
        if (api.gameId !== undefined) {
            api.deleteGame(api.gameId)
        } else {
            console.error('Game id is not set')
        }

        onGameCreateCanceled()

    }, [])

    const selectMap = useCallback((map: MapInformation) => {
        console.log('Selected map', map)
        if (!gameInformation?.map || gameInformation.map.id !== map.id) {
            api.setMap(map.id)
        }
    }, [gameInformation])

    const setInitialResources = useCallback((resources: ResourceLevel) => api.setInitialResources(resources), [])

    const setOthersCanJoin = useCallback((othersCanJoin: boolean) => api.setOthersCanJoin(othersCanJoin), [])

    const setCheatingEnabled = useCallback((cheatingEnabled: boolean) => api.setCheating(cheatingEnabled), [])

    // Memoized values
    const commands = useMemo(() => {
        const commands = new Map<string, GenericCommand<GameInformation>>()

        commands.set('Enable cheating', {
            action: () => api.setCheating(true),
            filter: gameInformation => !gameInformation.cheatingEnabled
        })

        commands.set('Disable cheating', {
            action: () => api.setCheating(false),
            filter: gameInformation => gameInformation.cheatingEnabled
        })

        commands.set('Toggle cheating', {
            action: gameInformation => api.setCheating(!gameInformation.cheatingEnabled)
        })

        commands.set('Allow players to join', {
            action: () => api.setOthersCanJoin(true),
            filter: gameInformation => !gameInformation.othersCanJoin
        })

        commands.set('Prevent players from joining', {
            action: () => api.setOthersCanJoin(false),
            filter: gameInformation => gameInformation.othersCanJoin
        })

        commands.set('Toggle player joining', {
            action: gameInformation => api.setOthersCanJoin(!gameInformation.othersCanJoin)
        })

        commands.set('Set resources', {
            type: 'ENUM',
            values: ['LOW', 'MEDIUM', 'HIGH'],
            parameterName: 'level',
            action: (_gameInformation: GameInformation, level: string) => {
                if (
                    level === 'LOW'
                    || level === 'MEDIUM'
                    || level === 'HIGH'
                ) {
                    api.setInitialResources(level)
                }
            }
        })

        commands.set('Add computer players', {
            type: 'NUMBER',
            min: 1,
            max: gameInformation?.map?.maxPlayers ?? 8,
            parameterName: 'count',
            action: (gameInformation: GameInformation, count: number) => {
                for (let i = 0; i < count; i++) {
                    addComputerPlayer(gameInformation.players, gameInformation.map?.maxPlayers ?? 3)
                }
            }
        })

        commands.set('Launch game', {
            action: onStartGameClicked,
            hidden: state !== 'CREATE_GAME',
            icon: <UiIcon type='PLAY' scale={0.5} />
        })

        commands.set('Filter map title', {
            type: 'STRING',
            parameterName: 'title',
            action: (_gameInformation: GameInformation, title: string) => setSearchTitle(title)
        })

        commands.set('Clear map title filter', {
            action: () => setSearchTitle(''),
            filter: () => filterTitle.length > 0
        })

        commands.set('Filter map author', {
            type: 'STRING',
            parameterName: 'author',
            action: (_gameInformation: GameInformation, author: string) => setSearchAuthor(author)
        })

        commands.set('Clear map author filter', {
            action: () => setSearchAuthor(''),
            filter: () => filterAuthor.length > 0
        })

        commands.set('Set minimum players', {
            type: 'NUMBER',
            min: 1,
            max: 8,
            parameterName: 'count',
            action: (_gameInformation: GameInformation, count: number) =>
                setFilterMinPlayers(Math.min(count, filterMaxPlayers))
        })

        commands.set('Set maximum players', {
            type: 'NUMBER',
            min: 1,
            max: 8,
            parameterName: 'count',
            action: (_gameInformation: GameInformation, count: number) =>
                setFilterMaxPlayers(Math.max(count, filterMinPlayers))
        })

        for (let players = 1; players <= 8; players++) {
            commands.set(`Show ${players} player maps`, {
                action: () => {
                    setFilterMinPlayers(players)
                    setFilterMaxPlayers(players)
                }
            })
        }

        commands.set('Reset map filters', {
            action: () => {
                setSearchTitle('')
                setSearchAuthor('')
                setFilterMinPlayers(1)
                setFilterMaxPlayers(8)
            }
        })

        commands.set('Debug', {
            action: (gameInformation: GameInformation) => console.log(gameInformation),
            hidden: true
        })

        commands.set('Copy game JSON', {
            action: async (gameInformation: GameInformation) =>
                await navigator.clipboard.writeText(
                    JSON.stringify(gameInformation, null, 2)
                ),
            hidden: true
        })

        return commands
    }, [
        state,
        maps,
        gameInformation,
        selfPlayerId,
        onStartGameClicked,
        onGameCreateCanceled,
        filterTitle,
        filterAuthor,
        filterMinPlayers,
        filterMaxPlayers
    ])

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

    // Rendering
    const matches = findMatchingCommands(commands, inputValue, gameInformation)
    const topMatch = matches[0]

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
                        <Button onClick={cancelAndRemoveGame}>Cancel</Button>
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
                <div
                    id='game-creation-screen'
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === 'Enter') {
                            try {
                                executeCommand(topMatch, gameInformation)
                            } catch (error) {
                                console.error(`Lobby: failed to execute command ${inputValue}`, error)
                            }
                        }

                        keyTyped(event)
                    }}
                    ref={selfContainerRef}
                    tabIndex={-1}
                >

                    <div id='title'>Create game: {gameInformation?.name ?? ''}</div>

                    <div id='options-title'><h2>Options</h2></div>
                    <div id='options'>
                        <GameOptions
                            initialResources={gameInformation?.initialResources ?? 'MEDIUM'}
                            othersCanJoin={gameInformation?.othersCanJoin ?? true}
                            cheatingEnabled={gameInformation?.cheatingEnabled ?? false}
                            onResourcesChange={setInitialResources}
                            onOthersCanJoinChange={setOthersCanJoin}
                            onCheatingEnabledChange={setCheatingEnabled}
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
                        <MapSelection
                            onMapSelected={selectMap}
                            minPlayers={gameInformation?.players.length ?? 0}
                            filterTitle={filterTitle}
                            filterAuthor={filterAuthor}
                            filterMinPlayers={filterMinPlayers}
                            filterMaxPlayers={filterMaxPlayers}
                            onSetFilterAuthor={(author) => setSearchAuthor(author)}
                            onSetFilterTitle={(title) => setSearchTitle(title)}
                            onSetFilterMinPlayers={(minPlayers) => setFilterMinPlayers(minPlayers)}
                            onSetFilterMaxPlayers={(maxPlayers) => setFilterMaxPlayers(maxPlayers)}
                        />
                    </div>

                    <div id='chat-title'><h2>Chat</h2></div>
                    <div id='chat'>
                        <ChatBox playerId={selfPlayerId} roomId={`game-${gameInformation?.id}`} />
                    </div>
                    <div id='start-or-cancel'>
                        <Button onClick={onGameCreateCanceled} >
                            Leave
                        </Button>
                        <Button onClick={cancelAndRemoveGame} >
                            Discard game
                        </Button>
                        <Button onClick={onStartGameClicked}
                            disabled={!gameInformation?.map}
                            appearance='primary'
                        >
                            Launch game
                        </Button>
                    </div>
                    {inputValue && inputValue.length > 0 &&
                        <div id='game-creator-typing'>
                            <DialogTyping inputValue={inputValue} matches={matches} />
                        </div>
                    }

                </div>
            }

        </>
    )
}

export { GameCreator }

