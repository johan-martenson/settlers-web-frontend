import React, { useState } from 'react'
import { createGame, deleteGame, setMapForGame, startGame, setResourceLevelForGame, getMaps, setOthersCanJoinGame } from './api/rest-api'
import { Input, Button, Field, InputOnChangeData } from "@fluentui/react-components"
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import './game_creator.css'
import ManagePlayers from './manage_players'
import { WorkerIcon } from './icon'
import { GameId, PlayerId, MapInformation, GameInformation, PlayerInformation, ResourceLevel } from './api/types'

interface GameCreatorProps {
    playerName: string
    onGameStarted: ((gameId: GameId, selfPlayerId: PlayerId) => void)
    onGameCreateCanceled: (() => void)
}

const GameCreator = ({ playerName, onGameStarted, onGameCreateCanceled }: GameCreatorProps) => {
    const [state, setState] = useState<'GET_NAME_FOR_GAME' | 'CREATE_GAME'>('GET_NAME_FOR_GAME')
    const [map, setMap] = useState<MapInformation>()
    const [game, setGame] = useState<GameInformation>()
    const [selfPlayer, setSelfPlayer] = useState<PlayerInformation>()
    const [title, setTitle] = useState<string>()

    async function onMapSelected(map: MapInformation): Promise<void> {
        if (game) {
            await setMapForGame(map.id, game.id)

            setMap(map)
        }
    }

    async function onStartGame(): Promise<void> {
        if (game && selfPlayer) {
            await startGame(game.id)

            onGameStarted(game.id, selfPlayer.id)
        } else {
            console.error("Game or selfPlayer is not set")
        }
    }

    function onDeleteGame(): void {
        if (game) {
            deleteGame(game.id)
        } else {
            console.error("Can't delete when no game is set")
        }
    }

    async function setOthersCanJoin(othersCanJoin: boolean): Promise<void> {
        if (game) {
            setOthersCanJoinGame(game.id, (othersCanJoin) ? "CAN_JOIN" : "CANNOT_JOIN")
        } else {
            console.error("No game created!")
        }
    }

    async function setAvailableResources(level: ResourceLevel): Promise<void> {
        if (game) {
            await setResourceLevelForGame(level, game.id)
        }
    }

    async function startCreatingGame(): Promise<void> {
        if (title) {

            /* Assign a default map */
            const maps = await getMaps()

            const greenIslandsMap = maps.find(map => map.title === 'Green Islands')
            let defaultMap = greenIslandsMap

            if (!defaultMap && maps.length > 0) {
                defaultMap = maps[0]
            }

            const defaultMapId = defaultMap ? defaultMap.id : undefined

            /* Create the new game */
            const game: GameInformation = await createGame(title, defaultMapId, [
                {
                    name: playerName,
                    color: "0xAABBCC",
                    nation: "ROMANS"
                }
            ])

            setGame(game)
            setMap(defaultMap)
            setSelfPlayer(game.players[0])
            setState('CREATE_GAME')
        } else {
            console.error("No title set")
        }
    }

    return (
        <>
            {state === "GET_NAME_FOR_GAME" &&
                <div>

                    <div className="set-game-name-label">

                        <Field label={"Enter a name for the game"} style={{ flex: "1 0 100%" }}>
                            <Input type="text" placeholder="Name..."
                                autoFocus
                                onChange={
                                    // eslint-disable-next-line
                                    (event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                                        setTitle(data.value)
                                    }
                                }

                                onKeyDown={
                                    (event) => {
                                        if (event.key === "Enter" && title !== undefined && title !== "") {
                                            startCreatingGame()
                                        }
                                    }
                                }

                                tabIndex={-1}
                            />
                        </Field>
                        <Button onClick={onGameCreateCanceled} >Cancel</Button>
                        <Button
                            disabled={!title && !map}
                            appearance='primary'
                            onClick={
                                async () => {
                                    await startCreatingGame()
                                }
                            }
                        >Create game</Button>
                    </div>
                </div>
            }

            {state === "CREATE_GAME" && game && selfPlayer &&
                <div className="game-creation-screen">

                    <div className="create-game-columns">

                        <div className='options-column'>
                            <GameOptions setAvailableResources={setAvailableResources.bind(this)} setOthersCanJoin={setOthersCanJoin.bind(this)} />
                        </div>

                        <div className='players-column'>
                            <ManagePlayers gameId={game.id}
                                selfPlayer={selfPlayer}
                                defaultComputerPlayers={1}
                                maxPlayers={10}
                            />
                        </div>

                        <div className='map-column'>
                            <MapSelection onMapSelected={onMapSelected} />
                        </div>
                    </div>
                    <div className='start-or-cancel'>
                        <Button onClick={onDeleteGame} >Discard game</Button>
                        <Button onClick={onStartGame}
                            disabled={!map}

                            appearance='primary'
                        >Launch game</Button>
                    </div>
                </div>
            }

            <div id="worker-animation">
                <WorkerIcon worker='General' animate nation='ROMANS' direction={'WEST'} scale={3} />
            </div>

        </>
    )
}

export { GameCreator }

