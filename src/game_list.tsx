import React, { Component } from 'react';
import Button from './button';
import { PlayerId, GameId, GameInformation, getGames } from './api';
import { GameCreator } from './game_creator';
import App from './App';
import { Dialog } from './dialog';
import { EnteredPlayerInformation } from './fill_in_player_information';

import './game_list.css';

interface GameListProps {
    hideStarted: boolean
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

                                <Button label="Join" className="Choice" onButtonClicked={() => {}}/>
                                        
                            </div>);
                        }
                    )
                }

            {!this.state.games &&
                function () {return (<div>Loading...</div>);} ()
            }

            </div>
        );
    }
}



export default GameList;
