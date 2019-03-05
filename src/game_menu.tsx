import React, { Component } from 'react';
import { GameId, PlayerId, PlayerInformation } from './api';
import Guide from './guide';
import MainMenu from './main_menu';
import OptionMenu from './options_menu';

interface GameMenuProps {
    onCloseMenu: (() => void)
    onPlayerSelected: ((player: PlayerInformation) => void)
    gameId: GameId
    currentPlayerId: PlayerId
    onChangedZoom: ((scale: number) => void)
    maxZoom: number
    minZoom: number
    currentZoom: number
    currentShowTitles: boolean
    adjustSpeed: ((speed: number) => void)
    setShowTitles: ((showTitles: boolean) => void)
    onLeaveGame: (() => void)
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

    onOptions(): void {
        this.setState(
            {
                state: "OPTIONS"
            }
        );
    }

    onClose(): void {
        this.props.onCloseMenu();
    }

    onChoose(): void {
        this.setState({ state: "OPTIONS" });
    }

    onPlayerSelected(player: PlayerInformation): void {
        this.props.onPlayerSelected(player);
    }

    render() {

        return (
            <div>
                {this.state.state === "MAIN" &&
                    <MainMenu
                        currentPlayerId={this.props.currentPlayerId}
                        gameId={this.props.gameId}
                        onHelp={() => { this.setState({ state: "HELP" }) }}
                        onClose={this.onClose.bind(this)}
                        onChoose={this.onChoose.bind(this)}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                        onLeaveGame={this.props.onLeaveGame}
                    />
                }

                {this.state.state === "OPTIONS" &&
                    <OptionMenu
                        maxZoom={this.props.maxZoom}
                        minZoom={this.props.minZoom}
                        currentZoom={this.props.currentZoom}
                        currentShowTitles={this.props.currentShowTitles}
                        onClose={() => { this.setState({ state: "MAIN" }) }}
                        onChangedZoom={this.props.onChangedZoom}
                        setShowTitles={this.props.setShowTitles.bind(this)}
                    />
                }

                {this.state.state === "HELP" &&
                    <Guide onClose={() => { this.setState({ state: "MAIN" }) }} />
                }
            </div>
        );
    }
}

export default GameMenu;
