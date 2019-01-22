import React, { Component } from 'react';
import OptionMenu from './options_menu.js';
import Guide from './guide.jsx';
import MainMenu from './main_menu.js';

class GameMenu extends Component {

    constructor(props) {
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
    
    onPlayerSelected(player) {
        this.props.onPlayerSelected(player);
    }
    
    render() {

        return (
            <div>
                {this.state.state === "MAIN" &&
                    <MainMenu
                        onHelp={() => {this.setState({state: "HELP"})}}
                        onClose={this.onClose.bind(this)}
                        onChoose={this.onChoose.bind(this)}
                        gameId={this.props.gameId}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                    />
                }

                {this.state.state === "OPTIONS" &&
                    <OptionMenu
                        onClose={() => {this.setState({state: "MAIN"})}}
                        onChangedZoom={this.props.onChangedZoom} />
                }

                {this.state.state === "HELP" &&
                    <Guide onClose={() => {this.setState({state: "MAIN"})}}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                    />
                }
            </div>
        );
    }
}

export default GameMenu;
