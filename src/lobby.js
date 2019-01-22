import React, { Component } from 'react';
import Button from './button.js';
import { getGames } from './api.js';
import { GameCreator } from './game_creator.js';
import App from './App.js';
import { Dialog } from './dialog.js';

class GameList extends Component {

    constructor(props) {
        super(props);

        this.state = {loadedGames: false};
    }

    componentDidMount() {

        getGames(this.props.apiHost).then(
            (games) => {
                this.setState(
                    {games: games,
                     loadedGames: true
                    });
                console.log("Set games to: " + games);
            }
        ).catch(
            (a, b, c) => {
                console.log("Failed to set games: " + a + " " + b + " " + c);
            }
        );
    }
    
    render() {
        return (
                <div>
                {this.state.loadedGames &&
                        this.state.games.map(
                            (game, index) => {

                                /* Optionally filter out already started games */
                                if (typeof(this.props.hideStarted) !== "undefined" &&
                                    this.props.hideStarted &&
                                    game.status === "STARTED") {
                                    return null;
                                }

                                /* Add the game to the list */
                                return (<div key={index}>
                                        Title: {game.name}
                                        <Button label="View"
                                        onButtonClicked={
                                            () => {
                                                console.log("Clicked view game " + index);
                                            }
                                        }
                                        />

                                        <Button label="Join"/>
                                        
                                        </div>);
                            }
                        )
                }

            {(!this.state.loadedGames) &&
             function () {return (<div>Loading...</div>);} ()}

            </div>
        );
    }
}

class Lobby extends Component {

    constructor(props) {
        super(props);

        this.state = {state: "LIST_GAMES"};

        this.createNewGame.bind(this);
        this.onCreateGameDone.bind(this);
    }

    createNewGame() {
        console.log("Should go to create game editor now");
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

    onGameStarted(gameId, playerId) {
        console.log("Lobby onGameStarted: " + gameId + ", " + playerId);

        this.setState(
            {
                state: "PLAY_GAME",
                gameId: gameId,
                playerId: playerId
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
                        <GameList apiHost={this.props.apiHost} hideStarted={true} />
                        <Button label="Create new game" onButtonClicked={this.createNewGame.bind(this)} />
                    </Dialog>
                }

                {this.state.state === "PLAY_GAME" &&
                    <App url="http://localhost:3000" gameId={this.state.gameId} />
                }

            </div>

        );
    }
}


export {
    Lobby
};
