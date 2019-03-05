import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { EnteredPlayerInformation, FillInPlayerInformation } from './fill_in_player_information';
import './index.css';
import { Lobby } from './lobby';


interface GameInitProps { }
interface GameInitState {
    state: "ENTER_PLAYER_INFORMATION" | "LOBBY" | "PLAY_GAME"
    player?: EnteredPlayerInformation
}

class GameInit extends Component<GameInitProps, GameInitState> {

    constructor(props: GameInitProps) {
        super(props);

        this.state = {
            state: "ENTER_PLAYER_INFORMATION"
        };
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
            </div>
        );
    }
}

ReactDOM.render(
    <GameInit />,
    document.getElementById('root')
);
