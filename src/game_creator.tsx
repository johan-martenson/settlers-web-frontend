import React, { Component, createRef } from 'react'
import { createGame, deleteGame, setMapForGame, startGame, setResourceLevelForGame, getMaps, setOthersCanJoinGame } from './api/rest-api'
import { Input, Button, Field } from "@fluentui/react-components"
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import './game_creator.css'
import ManagePlayers from './manage_players'
import { WorkerIcon } from './icon'
import { GameId, PlayerId, MapInformation, GameInformation, PlayerInformation, ResourceLevel } from './api/types'

interface SelfPlayer {
    name: string
}

interface GameCreatorProps {
    selfPlayer: SelfPlayer
    onGameStarted: ((gameId: GameId, selfPlayerId: PlayerId) => void)
    onGameCreateCanceled: (() => void)
    onCreateGameDone: (() => void)
}

interface GameCreatorState {
    state: "GET_NAME_FOR_GAME" | "CREATE_GAME"
    map?: MapInformation
    game?: GameInformation
    selfPlayer?: PlayerInformation
    isNameReady: boolean
}

class GameCreator extends Component<GameCreatorProps, GameCreatorState> {

    private titleFieldRef = createRef<HTMLInputElement>()
    private createGameButtonRef = createRef<typeof Button>()

    constructor(props: GameCreatorProps) {
        super(props)

        this.state = {
            state: "GET_NAME_FOR_GAME",
            isNameReady: false,
        }
    }

    componentDidMount(): void {

        if (this.titleFieldRef && this.titleFieldRef.current) {
            this.titleFieldRef.current.focus()
        }
    }

    async onMapSelected(map: MapInformation): Promise<void> {

        if (this.state.game) {
            console.log("Set map for game: " + JSON.stringify(map))

            await setMapForGame(map.id, this.state.game.id)

            this.setState({
                map: map,
            })

            /* Set focus on the start game button */
            if (this.createGameButtonRef && this.createGameButtonRef.current) {
                //this.createGameButtonRef.current.focus()
            }
        }
    }

    async onStartGame(): Promise<void> {

        if (!this.state.game) {
            console.log("ERROR: there is no game to start")

            return
        }

        if (!this.state.selfPlayer) {
            console.log("ERROR: can't start a game without knowing which player is 'self'")

            return
        }

        await startGame(this.state.game.id)

        this.props.onGameStarted(this.state.game.id, this.state.selfPlayer.id)
    }

    onDeleteGame(): void {

        if (this.state.game) {
            deleteGame(this.state.game.id)
        } else {
            console.log("ERROR: Can't delete when no game is set")
        }
    }

    isNameReady(): boolean {

        /* Handle the case when it's not possible to create a game */
        if (this.titleFieldRef && this.titleFieldRef.current && this.titleFieldRef.current.value !== "") {
            return true
        }

        /* Handle the case when it's possible to create a game */
        return false
    }

    // eslint-disable-next-line
    async setOthersCanJoin(othersCanJoin: boolean): Promise<void> {
        if (!this.state.game) {
            console.error("No game created!")

            return
        }

        setOthersCanJoinGame(this.state.game.id, (othersCanJoin) ? "CAN_JOIN" : "CANNOT_JOIN")
    }

    async setAvailableResources(level: ResourceLevel): Promise<void> {

        if (this.state.game) {
            await setResourceLevelForGame(level, this.state.game.id)
        }
    }

    async startCreatingGame(): Promise<void> {

        /* Ensure that there is a proper title for the game */
        const titleField = this.titleFieldRef.current

        if (!titleField || titleField.value === "") {
            console.log("ERROR: title field is empty")

            return
        }

        const gameTitle = titleField.value

        /* Assign a default map */
        const maps = await getMaps()

        let defaultMap

        for (const map of maps) {
            if (map.title === "Green Islands") {
                defaultMap = map

                break
            }
        }

        if (defaultMap === undefined && maps.length > 0) {
            defaultMap = maps[0]
        }

        const defaultMapId = defaultMap ? defaultMap.id : undefined

        /* Create the new game */
        const game: GameInformation = await createGame(gameTitle, defaultMapId, [
            {
                name: this.props.selfPlayer.name,
                color: "0xAABBCC",
                nation: "ROMANS"
            }
        ])

        /* Find the self player id */
        const selfPlayer = game.players[0]

        console.error(selfPlayer)

        /* Show the game creation panels */
        this.setState(
            {
                state: "CREATE_GAME",
                game: game,
                selfPlayer: selfPlayer,
                map: defaultMap
            }
        )

        /* Enable the "create game" button if there is a map set */
        if (defaultMap && this.createGameButtonRef && this.createGameButtonRef.current) {
            //this.createGameButtonRef.current.focus()
        }
    }

    render(): JSX.Element {


        return (
            <>
                {this.state.state === "GET_NAME_FOR_GAME" &&
                    <div>

                        <div className="set-game-name-label">

                            <Field label={"Enter a name for the game"} style={{flex: "1 0 100%"}}>
                                <Input type="text" placeholder="Name..."
                                    ref={this.titleFieldRef}
                                    onChange={

                                        // eslint-disable-next-line
                                        (event: React.FormEvent<HTMLInputElement>) => {
                                            if (this.isNameReady()) {
                                                this.setState({ isNameReady: true })
                                            }
                                        }
                                    }

                                    onKeyDown={
                                        (event) => {
                                            if (event.key === "Enter" && this.state.isNameReady) {
                                                this.startCreatingGame()
                                            }
                                        }
                                    }
                                />
                            </Field>
                            <Button onClick={this.props.onGameCreateCanceled} >Cancel</Button>
                            <Button
                                disabled={!this.state.isNameReady && !this.state.map}
                                appearance='primary'
                                onClick={
                                    async () => {
                                        await this.startCreatingGame()
                                    }
                                }
                            >Create game</Button>
                        </div>
                    </div>
                }

                {this.state.state === "CREATE_GAME" && this.state.game && this.state.selfPlayer &&
                    <div className="game-creation-screen">

                        <div className="create-game-columns">

                            <div className='options-column'>
                                <GameOptions setAvailableResources={this.setAvailableResources.bind(this)} setOthersCanJoin={this.setOthersCanJoin.bind(this)} />
                            </div>

                            <div className='players-column'>
                                <ManagePlayers gameId={this.state.game.id}
                                    selfPlayer={this.state.selfPlayer}
                                    defaultComputerPlayers={1}
                                    maxPlayers={10}
                                />
                            </div>

                            <div className='map-column'>
                                <MapSelection onMapSelected={this.onMapSelected.bind(this)} />
                            </div>
                        </div>
                        <div className='start-or-cancel'>
                            <Button onClick={this.onDeleteGame.bind(this)} >Discard game</Button>
                            <Button onClick={this.onStartGame.bind(this)}
                                disabled={!this.state.map}

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
}

export { GameCreator }

