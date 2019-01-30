import React, { Component } from 'react';
import OptionMenu from './options_menu';
import Guide from './guide';
import MainMenu from './main_menu';
import { GameId, PlayerInformation, PlayerId } from './api'

interface GameMenuProps {
    onCloseMenu: (() => void)
    onPlayerSelected: ((player: PlayerInformation) => void)
    gameId: GameId
    currentPlayerId: PlayerId
    onChangedZoom: ((scale: number) => void)
    maxZoom: number
    minZoom: number
    currentZoom: number
    adjustSpeed: ((speed: number) => void)
}
interface GameMenuState {
    state: "MAIN" | "OPTIONS" | "HELP"
}

class GameMenu extends Component<GameMenuProps, GameMenuState> {

    constructor(props: GameMenuProps) {
        super(props);

        this.state = {
            state: "MAIN"
        };
    }

    onOptions() {
        this.setState(
            {
                state: "OPTIONS"
            }
        );
    }

    onClose() {
        this.props.onCloseMenu();
    }

    onChoose() {
        this.setState({state: "OPTIONS"}); 
    }
    
    onPlayerSelected(player: PlayerInformation) {
        this.props.onPlayerSelected(player);
    }
    
    render() {

        return (
            <div>
                {this.state.state === "MAIN" &&
                    <MainMenu
                        currentPlayerId={this.props.currentPlayerId}
                        onHelp={() => {this.setState({state: "HELP"})}}
                        onClose={this.onClose.bind(this)}
                        onChoose={this.onChoose.bind(this)}
                        gameId={this.props.gameId}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                    />
                }

                {this.state.state === "OPTIONS" &&
                    <OptionMenu
                        maxZoom={this.props.maxZoom}
                        minZoom={this.props.minZoom}
                        currentZoom={this.props.currentZoom}
                        onClose={() => {this.setState({state: "MAIN"})}}
                        onChangedZoom={this.props.onChangedZoom} />
                }

                {this.state.state === "HELP" &&
                    <Guide onClose={() => {this.setState({state: "MAIN"})}} />
                }
            </div>
        );
    }
}

export default GameMenu;
