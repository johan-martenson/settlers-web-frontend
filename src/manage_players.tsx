import React, { Component } from 'react';
import Button from './button';
import { Player } from './player';

import './select_player.css';

export interface PlayerType {
    name: string
    color: string
    type: "HUMAN" | "COMPUTER"
}

interface ManagePlayersProps {
    players: PlayerType[]
    selfPlayerIndex: number
}
interface ManagePlayersState {
    players: PlayerType[]
}

class ManagePlayers extends Component<ManagePlayersProps, ManagePlayersState> {

    constructor(props: ManagePlayersProps) {
        super(props);

        const players = props.players || [];
        
        this.state = {players: players};
    }

    addAiPlayer() {
        let aiPlayer: PlayerType = {
            name: "An AI player",
            type: "COMPUTER",
            color: "#777777"
        };
        
        this.setState(
            {
                players: this.state.players.concat([aiPlayer])
            }
        );
    }

    onNameChanged(name: string, index: number) {

        const players = [...this.state.players];

        players[index].name = name;
        
        this.setState({players: players});
        
        console.log("Name changed to " + name)
        console.log(index);
    }
    
    removePlayer(player: PlayerType) {
        this.setState(
            {
                players: this.state.players.filter(e => e === player)
            }
        );
    }
    
    render() {

        console.log(this.state);
        
        return(
            <div className="PlayerList">
                {this.state.players.map(
                    (player, index) => {
                        return (
                            <div key={index}>

                                {index === this.props.selfPlayerIndex &&
                                 <Player key={index} isSelf={true}
                                     onNameChanged={
                                     (name: string) => {
                                         this.onNameChanged(name, index);
                                     }
                                 }
                                     player={player} />
                                }

                                {index !== this.props.selfPlayerIndex &&
                                 <Player key={index} player={player}
                                     onNameChanged={
                                     (name: string) => {
                                         this.onNameChanged(name, index);
                                     }
                                 }
                                     onPlayerRemoved={() => {this.removePlayer(player);}} />
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
