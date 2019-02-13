import React, { Component } from 'react';
import { GameInformation, getGames } from './api';
import Button from './button';
import './game_list.css';


interface GameListProps {
    hideStarted: boolean
    onJoinGame: ((game: GameInformation) => void)
}

interface GameListState {
    games?: GameInformation[]
}

class GameList extends Component<GameListProps, GameListState> {

    constructor(props: GameListProps) {
        super(props);

        this.state = {};
    }

    async componentDidMount() {

        const games = await getGames();

        this.setState(
            {
                games: games,
            });
    }

    render() {
        return (
            <div className="GameList">
                {this.state.games && this.state.games.map(
                    (game, index) => {

                        /* Optionally filter out already started games */
                        if (this.props.hideStarted &&
                            this.props.hideStarted &&
                            game.status === "STARTED") {
                            return null;
                        }

                        /* Add the game to the list */
                        return (
                            <div key={index} className="GameItem">
                                <div className="Title">Title: {game.name}</div>
                                <Button label="View" className="Choice"
                                    onButtonClicked={
                                        () => {
                                            console.log("Clicked view game " + index);
                                        }
                                    }
                                />

                                <Button label="Join" className="Choice" onButtonClicked={() => this.props.onJoinGame(game)} />

                            </div>);
                    }
                )
                }

                {!this.state.games &&
                    function () { return (<div>Loading...</div>); }()
                }

            </div>
        );
    }
}



export default GameList;
