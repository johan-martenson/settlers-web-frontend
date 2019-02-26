import React, { Component, createRef } from 'react';
import Button from './button';
import {
    MapInformation,
    GameId,
    PlayerId,
    GameInformation,
    createGame,
    deleteGame,
    startGame,
    setMapForGame
} from './api';

import ManagePlayers from './manage_players';
import { Dialog, DialogSection } from './dialog';
import MapSelection from './map_selection';
import GameOptions from './game_options'
import BottomButtons from './bottom_buttons'

interface SelfPlayer {
    name: string
}

export type PlayerType = "HUMAN" | "COMPUTER"

export interface Player {
    name: string
    color: string
    type: PlayerType
}

interface GameCreatorProps {
    selfPlayer: SelfPlayer
    onGameStarted: ((gameId: GameId, selfPlayerId: PlayerId) => void)
    onGameCreateCanceled: (() => void)
    onCreateGameDone: (() => void)
}

interface GameCreatorState {
    state: "GET_NAME_FOR_GAME" | "CREATE_GAME"
    players: Player[]
    map?: MapInformation
    game?: GameInformation
    selfPlayerId?: PlayerId
    isNameReady: boolean
}

class GameCreator extends Component<GameCreatorProps, GameCreatorState> {

    private titleFieldRef = createRef<HTMLInputElement>();

    constructor(props: GameCreatorProps) {
        super(props);

        this.state = {
            state: "GET_NAME_FOR_GAME",
            isNameReady: false,
            players: [
                {
                    name: this.props.selfPlayer.name,
                    type: "HUMAN",
                    color: "#0000CC"
                }
            ]
        };
    }

    async onMapSelected(map: MapInformation) {

        if (this.state.game) {

            console.log("Set map for game: " + JSON.stringify(map));

            await setMapForGame(map.id, this.state.game.id);

            this.setState({
                map: map,
            });
        }
    }

    async onStartGame() {

        if (!this.state.game) {
            console.log("ERROR: there is no game to start");

            return;
        }

        if (!this.state.selfPlayerId) {
            console.log("ERROR: can't start a game without knowing which player is 'self'");

            return;
        }

        await startGame(this.state.game.id);

        this.props.onGameStarted(this.state.game.id, this.state.selfPlayerId);
    }

    onDeleteGame() {

        if (this.state.game) {
            deleteGame(this.state.game.id);
        } else {
            console.log("ERROR: Can't delete when no game is set");
        }
    }

    isNameReady(): boolean {

        /* Handle the case when it's not possible to create a game */
        if (this.titleFieldRef && this.titleFieldRef.current && this.titleFieldRef.current.value !== "") {

            return true;

        }

        /* Handle the case when it's possible to create a game */
        return false;
    }

    render() {

        return (
            <>
                {this.state.state === "GET_NAME_FOR_GAME" &&
                    <Dialog heading="Create Game" noCloseButton={true} closeLabel="Cancel">

                        <DialogSection label="Enter a new for the game: ">
                            <input type="text" placeholder="Name..."
                                ref={this.titleFieldRef}
                                onChange={(e: React.FormEvent<HTMLInputElement>) => {
                                    if (this.isNameReady()) {
                                        this.setState({ isNameReady: true });
                                    }
                                }
                                }
                            />
                            <BottomButtons>
                                <Button label="Cancel" onButtonClicked={this.props.onGameCreateCanceled} />
                                <Button label="Create game"
                                    disabled={!this.state.isNameReady && !this.state.map}
                                    onButtonClicked={
                                        async () => {

                                            const titleField = this.titleFieldRef.current;

                                            if (!titleField || titleField.value === "") {
                                                console.log("ERROR: title field is empty");

                                                return;
                                            }

                                            const gameTitle = titleField.value;

                                            const game: GameInformation = await createGame({
                                                name: gameTitle,
                                                map: undefined,
                                                players: this.state.players
                                            })

                                            /* Find the self player id */
                                            let selfPlayerId;

                                            for (let i = 0; i < game.players.length; i++) {
                                                const player = game.players[i];

                                                if (player.name === this.props.selfPlayer.name) {
                                                    selfPlayerId = player.id;

                                                    break;
                                                }
                                            }

                                            this.setState(
                                                {
                                                    state: "CREATE_GAME",
                                                    game: game,
                                                    selfPlayerId: selfPlayerId
                                                }
                                            );
                                        }
                                    }
                                />
                            </BottomButtons>
                        </DialogSection>
                    </Dialog>
                }

                {this.state.state === "CREATE_GAME" &&
                    <Dialog heading="Create game" noCloseButton={true}>
                        <MapSelection onMapSelected={this.onMapSelected.bind(this)} />
                        <ManagePlayers players={this.state.players} selfPlayerIndex={0} />
                        <GameOptions />
                        <BottomButtons>
                            <Button label="Delete game" onButtonClicked={this.onDeleteGame.bind(this)} />
                            <Button label="Start game"
                                onButtonClicked={this.onStartGame.bind(this)}
                                disabled={!this.state.map}
                            />
                        </BottomButtons>
                    </Dialog>
                }

            </>
        );
    }
}

export {
    GameCreator
};
