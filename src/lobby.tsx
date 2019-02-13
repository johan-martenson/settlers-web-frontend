import React, { Component } from 'react';
import { addPlayerToGame, GameId, GameInformation, PlayerId, getPlayers, getGameInformation } from './api';
import App from './App';
import Button from './button';
import { Dialog } from './dialog';
import { EnteredPlayerInformation } from './fill_in_player_information';
import { GameCreator } from './game_creator';
import GameList from './game_list';

type LobbyStates = "LIST_GAMES" | "CREATE_GAME" | "PLAY_GAME" | "WAIT_FOR_GAME"

interface LobbyState {
    gameId?: GameId
    selfPlayerId?: PlayerId
    state: LobbyStates
}

interface LobbyProps {
    player: EnteredPlayerInformation
}

class Lobby extends Component<LobbyProps, LobbyState> {

    constructor(props: LobbyProps) {
        super(props);

        this.state = { state: "LIST_GAMES" };

        this.createNewGame.bind(this);
        this.onCreateGameDone.bind(this);
    }

    createNewGame() {

        this.setState(
            { state: "CREATE_GAME" }
        );
    }

    onCreateGameDone() {
        this.setState(
            { state: "LIST_GAMES" }
        );
    }

    onGameCreateCanceled() {
        this.setState(
            { state: "LIST_GAMES" }
        );
    }

    onGameStarted(gameId: GameId, selfPlayerId: PlayerId) {

        this.setState(
            {
                state: "PLAY_GAME",
                gameId: gameId,
                selfPlayerId: selfPlayerId
            }
        );
    }

    render() {

        return (
            <div>

                {this.state.state === "CREATE_GAME" &&
                    <GameCreator
                        selfPlayer={this.props.player}
                        onCreateGameDone={this.onCreateGameDone.bind(this)}
                        onGameCreateCanceled={this.onGameCreateCanceled.bind(this)}
                        onGameStarted={this.onGameStarted.bind(this)}
                    />
                }

                {this.state.state === "LIST_GAMES" &&
                    <Dialog heading="Join an existing game or create a new game" noCloseButton={true}>
                        <GameList hideStarted={true} onJoinGame={this.onJoinGame.bind(this)} />
                        <Button label="Create new game" onButtonClicked={this.createNewGame.bind(this)} />
                    </Dialog>
                }

                {this.state.state === "PLAY_GAME" && this.state.gameId && this.state.selfPlayerId &&
                    <App gameId={this.state.gameId} selfPlayerId={this.state.selfPlayerId} onLeaveGame={() => this.setState({ state: "LIST_GAMES" })} />
                }

                {this.state.state === "WAIT_FOR_GAME" &&
                    <div>Waiting for the game to start...</div>
                }

            </div>

        );
    }

    async onJoinGame(game: GameInformation) {

        console.log("Joining game " + game.id + " as player " + JSON.stringify(this.props.player));

        try {
            const player = await addPlayerToGame(game.id, this.props.player.name, "#123456");
            console.log("Added player to game " + JSON.stringify(player));

            const players = await getPlayers(game.id);

            console.log("Players in game are now: " + JSON.stringify(players));

            if (game.status === "NOT_STARTED") {
                this.setState(
                    {
                        gameId: game.id,
                        state: "WAIT_FOR_GAME",
                        selfPlayerId: player.id
                    }
                );

                setTimeout(this.checkForGameStart.bind(this), 100);
            } else {
                this.setState(
                    {
                        gameId: game.id,
                        state: "PLAY_GAME",
                        selfPlayerId: player.id
                    }
                );
            }
        } catch (err) {
            console.log(err)
        }
    }

    async checkForGameStart() {

        if (this.state.gameId) {
            const game = await getGameInformation(this.state.gameId);

            if (game.status === "NOT_STARTED") {
                setTimeout(this.checkForGameStart.bind(this), 100);
            } else {
                this.setState({ state: "PLAY_GAME" });
            }
        }
    }
}

export { Lobby };

