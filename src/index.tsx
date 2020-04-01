import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EnteredPlayerInformation, FillInPlayerInformation } from './fill_in_player_information';
import './index.css';
import { Lobby } from './lobby';
import { GameId, PlayerId, getPlayers } from './api'
import App from './App'


interface GameInitProps { }
interface GameInitState {
    state: "ENTER_PLAYER_INFORMATION" | "LOBBY" | "PLAY_GAME"
    player?: EnteredPlayerInformation
    gameId?: GameId
    selfPlayerId?: PlayerId
}

class GameInit extends Component<GameInitProps, GameInitState> {

    constructor(props: GameInitProps) {
        super(props);

        this.state = {
            state: "ENTER_PLAYER_INFORMATION"
        };
    }

    async componentDidMount() {

        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get("gameId")
        const playerId = urlParams.get("playerId")

        if (gameId) {
            let selfPlayerId = playerId

            if (selfPlayerId === null || selfPlayerId === undefined) {
                selfPlayerId = (await getPlayers(gameId))[0].id
            }

            this.setState(
                {
                    state: "PLAY_GAME",
                    gameId: gameId,
                    selfPlayerId: selfPlayerId
                }
            )
        }
    }

    onPlayerInformationDone(player: EnteredPlayerInformation): void {

        console.log("Player entering lobby: " + JSON.stringify(player));

        this.setState(
            {
                player: player,
                state: "LOBBY"
            }
        );
    }

    render() {

        return (
            <div>
                {this.state.state === "ENTER_PLAYER_INFORMATION" &&
                    <FillInPlayerInformation onPlayerInformationDone={this.onPlayerInformationDone.bind(this)} />
                }

                {this.state.state === "LOBBY" && this.state.player &&
                    <Lobby player={this.state.player} />
                }

                {this.state.state === "PLAY_GAME" && this.state.gameId && this.state.selfPlayerId &&
                    <App gameId={this.state.gameId}
                        selfPlayerId={this.state.selfPlayerId}
                        onLeaveGame={
                            () => this.setState({ state: "LOBBY" })
                        }
                    />
                }
            </div>
        );
    }
}

ReactDOM.render(
    <GameInit />,
    document.getElementById('root')
);
