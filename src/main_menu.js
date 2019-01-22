import React, { Component } from 'react';
import { Dialog, DialogSection } from './dialog.js';
import Button from './button.js';
import { getGameInformation } from './api.js';
import SelectPlayer from './select_player.js';

class MainMenu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentSpeed: 4,
            state: "MAIN"
        };
    }

    componentDidMount() {
        let game = getGameInformation(this.props.gameId);

        this.setState({currentSpeed: game.tickLength});
    }

    onOptions() {
        this.setState(
            {
                state: "OPTIONS"
            }
        );
    }
    
    onPlayerSelected(player) {
        this.props.onPlayerSelected(player);
    }

    render() {

        return (
            <Dialog heading="Menu" onCloseDialog={this.props.onClose}>

                <DialogSection heading="Select player">
                    <SelectPlayer onPlayerSelected={this.props.onPlayerSelected}
                        url={this.props.url}
                        currentPlayer={this.props.currentPlayer}
                        gameId={this.props.gameId}
                    />
                </DialogSection>

                <DialogSection>
                    <Button label="Options" onButtonClicked={this.props.onChoose} />

                    <Button label="Help" onButtonClicked={() => {this.props.onHelp();}} />

                </DialogSection>

            </Dialog>
        );
    }
}

export default MainMenu;
