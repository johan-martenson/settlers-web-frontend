import React, { Component, createRef } from 'react'
import { createGame, deleteGame, GameId, GameInformation, MapInformation, PlayerId, setMapForGame, startGame, setResourceLevelForGame, ResourceLevel, PlayerInformation, getMaps } from './api'
import BottomButtons from './bottom_buttons'
import Button from './button'
import { Dialog } from './dialog'
import './game_creator.css'
import GameOptions from './game_options'
import MapSelection from './map_selection'
import MapInformationCard from './map_information_card'
import './game_creator.css'
import ManagePlayers from './manage_players'

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
    private createGameButtonRef = createRef<Button>()

    constructor(props: GameCreatorProps) {
        super(props)

        this.state = {
            state: "GET_NAME_FOR_GAME",
            isNameReady: false,
        }
    }

    componentDidMount() {

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
                this.createGameButtonRef.current.focus()
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

    async setOthersCanJoin(othersCanJoin: boolean) {

    }

    async setAvailableResources(level: ResourceLevel) {

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
            }
        }

        const defaultMapId = defaultMap ? defaultMap.id : undefined

        /* Create the new game */
        const game: GameInformation = await createGame(gameTitle, defaultMapId, [
                {
                    name: this.props.selfPlayer.name,
                    color: "0xAABBCC"
                }
            ])

        /* Find the self player id */
        const selfPlayer = game.players[0]

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
            this.createGameButtonRef.current.focus()
        }
    }

    render() {

        return (
            <>
                {this.state.state === "GET_NAME_FOR_GAME" &&
                    <Dialog heading="Create Game" noCloseButton={true} closeLabel="Cancel">

                        <div className="SetGameNameLabel">
                            <div>Enter a new for the game:</div>
                            <input type="text" placeholder="Name..."
                                ref={this.titleFieldRef}
                                onChange={
                                    (e: React.FormEvent<HTMLInputElement>) => {
                                        if (this.isNameReady()) {
                                            this.setState({ isNameReady: true })
                                        }
                                    }
                                }

                                onKeyPress={
                                    (event) => {
                                        if (event.key === "Enter" && this.state.isNameReady) {
                                            this.startCreatingGame()
                                        }
                                    }
                                }
                            />
                        </div>
                        <BottomButtons>
                            <Button label="Cancel" onButtonClicked={this.props.onGameCreateCanceled} />
                            <Button label="Create game"
                                disabled={!this.state.isNameReady && !this.state.map}
                                onButtonClicked={
                                    async () => {
                                        await this.startCreatingGame()
                                    }
                                }
                            />
                        </BottomButtons>
                    </Dialog>
                }

                {this.state.state === "CREATE_GAME" && this.state.game && this.state.selfPlayer &&
                    <div>
                        <h1>Create Game</h1>
                        <div className="CreateGameColumns">
                            <div className="PlayersAndOptions">
                                <ManagePlayers gameId={this.state.game.id} selfPlayer={this.state.selfPlayer} selfPlayerIndex={0} defaultComputerPlayers={1} />
                                <GameOptions setAvailableResources={this.setAvailableResources.bind(this)} setOthersCanJoin={this.setOthersCanJoin.bind(this)} />
                            </div>

                            <div className="MapColumn">
                                Select map

                                {this.state.map &&
                                    <MapInformationCard map={this.state.map} expanded={true} controls={false} />
                                }

                                <MapSelection onMapSelected={this.onMapSelected.bind(this)} className={this.state.map ? "SmallMapSelection" : "FullMapSelection"} />
                            </div>
                        </div>
                        <BottomButtons>
                            <Button label="Delete game" onButtonClicked={this.onDeleteGame.bind(this)} />
                            <Button label="Start game" onButtonClicked={this.onStartGame.bind(this)} disabled={!this.state.map} ref={this.createGameButtonRef} />
                        </BottomButtons>
                    </div>
                }

            </>
        )
    }
}

export { GameCreator }

