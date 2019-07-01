import React, { Component } from 'react';
import Button from './button';
import { Player } from './player';
import './select_player.css';
import { GameId, addComputerPlayerToGame, PlayerInformation, getPlayers, updatePlayer, removePlayerFromGame, PlayerType } from './api';

export interface PlayerCandidateType {
    name: string
    color: string
    type: PlayerType
}

interface ManagePlayersProps {
    selfPlayer: PlayerInformation
    selfPlayerIndex: number
    gameId: GameId
    onPlayerAdded?: ((player: PlayerInformation) => void)
    onPlayerRemoved?: ((player: PlayerInformation) => void)
}
interface ManagePlayersState {
    players: PlayerInformation[]
}

class ManagePlayers extends Component<ManagePlayersProps, ManagePlayersState> {

    constructor(props: ManagePlayersProps) {
        super(props);

        const players = [this.props.selfPlayer]

        this.state = { players: players };
    }

    async addAiPlayer(): Promise<void> {

        const aiPlayer: PlayerCandidateType = {
            name: "An AI player",
            type: "COMPUTER",
            color: "#777777"
        };

        const addedPlayer = await addComputerPlayerToGame(this.props.gameId, aiPlayer.name, aiPlayer.color)

        this.setState(
            {
                players: this.state.players.concat([addedPlayer])
            }
        );

        if (this.props.onPlayerAdded) {
            this.props.onPlayerAdded(addedPlayer)
        }
    }

    async onNameChanged(name: string, index: number): Promise<void> {

        const playerToUpdate = this.state.players[index]

        const updatedPlayer = await updatePlayer(this.props.gameId, playerToUpdate.id, name, this.state.players[index].color)

        const players = await getPlayers(this.props.gameId)

        this.setState({ players: players });

        console.log("Name changed to " + name)
        console.log(index);
    }

    async removePlayer(player: PlayerInformation): Promise<void> {

        const removedPlayer = await removePlayerFromGame(this.props.gameId, player.id)

        const players = await getPlayers(this.props.gameId)

        this.setState(
            {
                players: players
            }
        );

        if (this.props.onPlayerRemoved) {
            this.props.onPlayerRemoved(player)
        }
    }

    render() {

        return (
            <div className="PlayerList">
                Manage players
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
                                        onPlayerRemoved={() => { this.removePlayer(player); }} />
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
