import React, { Component } from 'react';
import Player from './player.js';
import Button from './button.js';


class ManagePlayers extends Component {

    constructor(props) {
        super(props);

        console.log("2 -- ManagerPlayers constructor, players: " + JSON.stringify(props.players));
        
        if (typeof(props.players) === "undefined") {
            this.state = {players: []};
        } else {
            this.state = {players: props.players};
        }

        console.log("2 -- ManagerPlayers constructor, players: " + JSON.stringify(this.state.players));
    }

    addAiPlayer() {
        let aiPlayer = {
            name: "An AI player",
            type: "COMPUTER"
        };
        
        this.setState(
            {
                players: this.state.players.concat([aiPlayer])
            }
        );

        console.log("Manage players: players list: " + JSON.stringify(this.state.players.concat([aiPlayer])));
    }
    
    render() {

        console.log("3 -- ManagePlayers render, players: " + JSON.stringify(this.state.players));
        
        return(
            <div>
                {this.state.players.map(
                    (player, index) => {
                        return (
                            <div key={index}>

                                {index === this.props.selfPlayerIndex &&
                                    <Player key={index} isSelf={true} player={player} />
                                }

                                {index !== this.props.selfPlayerIndex &&
                                    <Player key={index} player={player} />
                                }
                            </div>
                        );
                    }
                )
                }
                <Button label="Add AI player" onButtonClicked={this.addAiPlayer.bind(this)} />
            </div>
        );
    }
}

export default ManagePlayers;
