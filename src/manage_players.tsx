import React, { Component } from 'react'
import Button from './button'
import { Player } from './player'
import './select_player.css'
import { GameId, addComputerPlayerToGame, PlayerInformation, getPlayers, updatePlayer, removePlayerFromGame, PlayerType } from './api'

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
            const addedPlayer = await addComputerPlayerToGame(this.props.gameId, "Computer Player " + i, PLAYER_COLORS[i])

            console.info(addedPlayer)

            addedPlayers.push(addedPlayer)

            if (this.props.onPlayerAdded) {
                this.props.onPlayerAdded(addedPlayer)
            }
        }

        this.setState({ players: addedPlayers.concat(this.state.players) })
    }

    async addAiPlayer(): Promise<void> {

        const aiPlayer: PlayerCandidateType = {
            name: "An AI player",
            type: "COMPUTER",
            color: "#777777"
        }

        const addedPlayer = await addComputerPlayerToGame(this.props.gameId, aiPlayer.name, aiPlayer.color)

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

        this.setState(
            {
                players: players
            }
        )

        if (this.props.onPlayerRemoved) {
            this.props.onPlayerRemoved(player)
        }
    }

    render(): JSX.Element {

        return (
            <div className="PlayerList">
                Manage players
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
                )
                }
                <Button label="Add AI player" onButtonClicked={this.addAiPlayer.bind(this)} />
            </div>
        )
    }
}

export default ManagePlayers
