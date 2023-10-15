import React, { Component } from 'react'
import { getPlayers, PlayerId, PlayerInformation } from './api'
import Button from './button'

interface SelectPlayerState {
    players: PlayerInformation[]
    gettingPlayers: boolean
}

interface SelectPlayerProps {
    currentPlayer: PlayerId
    onPlayerSelected: ((player: PlayerInformation) => void)
    gameId: string
}

class SelectPlayer extends Component<SelectPlayerProps, SelectPlayerState> {

    constructor(props: SelectPlayerProps) {
        super(props)

        this.state = {
            players: [],
            gettingPlayers: false
        }
    }

    shouldComponentUpdate(nextProps: SelectPlayerProps, nextState: SelectPlayerState): boolean {
        if (nextState.players === this.state.players &&
            nextState.gettingPlayers === this.state.gettingPlayers &&
            nextProps.currentPlayer === this.props.currentPlayer) {
            return false
        }

        return true
    }

    async updatePlayers(): Promise<void> {

        const players = await getPlayers(this.props.gameId)

        this.setState({
            players: players,
            gettingPlayers: false
        })
    }

    componentDidMount(): void {

        if (this.state.players.length === 0 && !this.state.gettingPlayers) {
            this.setState({
                gettingPlayers: true
            })

            console.info("Getting list of players from server")
            this.updatePlayers()
        }
    }

    render(): JSX.Element {
        return (
            <div className="PlayerSelect">
                {this.state.players.map(
                    (player) => {

                        if (this.props.currentPlayer && this.props.currentPlayer === player.id) {
                            return (
                                <Button label={player.name}
                                    key={player.id}
                                    id={player.id}
                                    selected={true}
                                    onButtonClicked={() => { this.props.onPlayerSelected(player) }}
                                />
                            )
                        } else {
                            return (
                                <Button label={player.name}
                                    key={player.id}
                                    id={player.id}
                                    onButtonClicked={() => { this.props.onPlayerSelected(player) }}
                                />
                            )
                        }
                    }
                )
                }
            </div>
        )
    }
}

export default SelectPlayer
