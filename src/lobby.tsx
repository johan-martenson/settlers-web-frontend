import React, { Component } from 'react';
import Button from './button';
import { PlayerId, GameId, GameInformation, getGames } from './api';
import { GameCreator } from './game_creator';
import App from './App';
import { Dialog } from './dialog';
import { EnteredPlayerInformation } from './fill_in_player_information';
import GameList from './game_list'

type LobbyStates = "LIST_GAMES" | "CREATE_GAME" | "PLAY_GAME"

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

        this.state = {state: "LIST_GAMES"};

        this.createNewGame.bind(this);
        this.onCreateGameDone.bind(this);
    }

    createNewGame() {

        this.setState(
            {state: "CREATE_GAME"}
        );
    }

    onCreateGameDone() {
        this.setState(
            {state: "LIST_GAMES"}
        );
    }

    onGameCreateCanceled() {
        this.setState(
            {state: "LIST_GAMES"}
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
                        <GameList hideStarted={true} />
                        <Button label="Create new game" onButtonClicked={this.createNewGame.bind(this)} />
                    </Dialog>
                }

                {this.state.state === "PLAY_GAME" && this.state.gameId && this.state.selfPlayerId &&
                    <App gameId={this.state.gameId} selfPlayerId={this.state.selfPlayerId}/>
                }

            </div>

        );
    }
}


export {
    Lobby
};
