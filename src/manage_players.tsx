import React, { Component } from 'react';
import { Button, Subtitle1 } from "@fluentui/react-components";
import { Player } from './player';
import './manage_players.css';
import { GameId, addComputerPlayerToGame, PlayerInformation, getPlayers, updatePlayer, removePlayerFromGame, PlayerType } from './api';

export interface PlayerCandidateType {
    name: string
    color: string
    type: PlayerType
}

const PLAYER_COLORS = [
    /*    "Yellow",
        "Red",
        "Blue",
        "Green",
        "Black",
        "White"*/
    "#AABBCC",
    "#BBCCAA",
    "#CCAABB"
]

interface ManagePlayersProps {
    selfPlayer: PlayerInformation
    gameId: GameId
    defaultComputerPlayers: number
    maxPlayers: number
    onPlayerAdded?: ((player: PlayerInformation) => void)
    onPlayerRemoved?: ((player: PlayerInformation) => void)
}

interface ManagePlayersState {
    players: PlayerInformation[]
}

class ManagePlayers extends Component<ManagePlayersProps, ManagePlayersState> {

    constructor(props: ManagePlayersProps) {
        super(props)

        const players = [this.props.selfPlayer]

        this.state = { players: players }
    }

    async componentDidMount(): Promise<void> {

        const addedPlayers: PlayerInformation[] = []

        console.info("Adding default computer players")

        for (let i = 0; i < this.props.defaultComputerPlayers; i++) {
            console.info("Adding computer player " + i)
            const addedPlayer = await addComputerPlayerToGame(this.props.gameId, "Computer Player " + i, PLAYER_COLORS[i], 'ROMANS')

            console.info(addedPlayer)

            addedPlayers.push(addedPlayer)

            if (this.props.onPlayerAdded) {
                this.props.onPlayerAdded(addedPlayer)
            }
        }

        this.setState({ players: this.state.players.concat(addedPlayers) })
    }

    async addComputerPlayer(): Promise<void> {

        console.log("Add computer player")

        let nextPlayer = undefined;

        // Find next computer player
        for (let i = 0; i < this.props.maxPlayers; i++) {
            if (this.state.players.find(player => player.name === 'Computer Player ' + i) === undefined) {
                console.log("Did not find Computer Player " + i)

                nextPlayer = i;

                break;
            }

            console.log("Did find Computer Player " + i)
        }

        console.log("Next player is: " + nextPlayer)

        if (nextPlayer === undefined) {
            return;
        }

        const aiPlayer: PlayerCandidateType = {
            name: "Computer Player " + nextPlayer,
            type: "COMPUTER",
            color: "#777777"
        }

        const addedPlayer = await addComputerPlayerToGame(this.props.gameId, aiPlayer.name, aiPlayer.color, 'ROMANS')

        this.setState(
            {
                players: this.state.players.concat([addedPlayer])
            }
        )

        if (this.props.onPlayerAdded) {
            this.props.onPlayerAdded(addedPlayer)
        }
    }

    async onNameChanged(name: string, index: number): Promise<void> {

        const playerToUpdate = this.state.players[index]

        await updatePlayer(this.props.gameId, playerToUpdate.id, name, this.state.players[index].color)

        const players = await getPlayers(this.props.gameId)

        this.setState({ players: players })

        console.log("Name changed to " + name)
        console.log(index)
    }

    async removePlayer(player: PlayerInformation): Promise<void> {

        await removePlayerFromGame(this.props.gameId, player.id)

        const players = await getPlayers(this.props.gameId)

        this.setState({ players: players })

        if (this.props.onPlayerRemoved) {
            this.props.onPlayerRemoved(player)
        }
    }

    render(): JSX.Element {

        return (
            <div className="player-list">
                <Subtitle1 as="h4" block>Players</Subtitle1>
                {this.state.players.map(
                    (player, index) => {
                        return (
                            <div key={index}>

                                {player.id === this.props.selfPlayer.id &&
                                    <Player key={index} isSelf={true}
                                        onNameChanged={
                                            (name: string) => {
                                                this.onNameChanged(name, index)
                                            }
                                        }
                                        player={player} />
                                }

                                {player.id !== this.props.selfPlayer.id &&
                                    <Player key={index} player={player}
                                        onNameChanged={
                                            (name: string) => {
                                                this.onNameChanged(name, index)
                                            }
                                        }
                                        onPlayerRemoved={() => { this.removePlayer(player) }} />
                                }
                            </div>
                        )
                    }
                )}
                <Button onClick={this.addComputerPlayer.bind(this)} >Add computer player</Button>
            </div>
        )
    }
}

export default ManagePlayers
