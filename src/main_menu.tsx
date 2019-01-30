import React, { Component } from 'react';
import { Dialog, DialogSection } from './dialog';
import Button from './button';
import { GameId, PlayerInformation, PlayerId, getGameInformation } from './api';
import SelectPlayer from './select_player';

interface MainMenuProps {
    gameId: GameId
    currentPlayerId: PlayerId
    onPlayerSelected: ((player: PlayerInformation) => void)
    onClose: (() => void)
    onChoose: (() => void)
    onHelp: (() => void)
}

interface MainMenuState {
    currentSpeed?: number
    state: "MAIN" | "OPTIONS" | "HELP"
}

class MainMenu extends Component<MainMenuProps, MainMenuState> {

    constructor(props: MainMenuProps) {
        super(props);

        this.state = {
            currentSpeed: 4,
            state: "MAIN"
        };
    }

    async componentDidMount() {
        const game = await getGameInformation(this.props.gameId);

        this.setState({currentSpeed: 50}); //game.tickLength});
    }

    onOptions() {
        this.setState(
            {
                state: "OPTIONS"
            }
        );
    }
    
    onPlayerSelected(player: PlayerInformation) {
        this.props.onPlayerSelected(player);
    }

    render() {

        return (
            <Dialog heading="Menu" onCloseDialog={this.props.onClose}>

                <DialogSection label="Select player">
                    <SelectPlayer onPlayerSelected={this.props.onPlayerSelected}
                        currentPlayer={this.props.currentPlayerId}
                        gameId={this.props.gameId}
                    />
                </DialogSection>

                <DialogSection>
                    <Button label="Options" onButtonClicked={this.props.onChoose} />

                    <Button label="Help" onButtonClicked={this.props.onHelp} />

                </DialogSection>

            </Dialog>
        );
    }
}

export default MainMenu;
