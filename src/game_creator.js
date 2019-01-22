import React, { Component } from 'react';
import Button from './button.js';
import { MapList } from './map_list.js'
import { createGame, deleteGame, startGame } from './api.js';
import MenuSectionLabel from './menu_section_label.js';
import ManagePlayers from './manage_players.js';
import { Dialog, DialogSection } from './dialog.js';

class GameCreator extends Component {

    constructor(props) {
        super(props);

        console.log("GameCreator: " + JSON.stringify(this.props.selfPlayer));
        
        this.state = {
            mapSelected: false,
            state: "BEFORE_GAME_CREATED",
            players: [
                {
                    name: this.props.selfPlayer.name,
                    type: "HUMAN",
                    color: "#0000CC"
                }
            ]
        };
    }
    
    async createNewGame() {
        let name = this.titleField.value;

        /* Don't create games without a map */
        if (!this.state.mapSelected) {
            return;
        }

        /* Don't create a game without a name */
        console.log("Name: -" + name + "-");
        if (name === "") {
            return;
        }
        
        /* Create the game */
        console.log("Should create the game now");
        console.log("Title: " + this.titleField.value);

        let game = await createGame(
            {
                map: this.state.map.id,
                name: name,
                players: this.state.players
            }
        );

        let selfPlayerId = 0;

        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].name === this.props.selfPlayer.name) {
                selfPlayerId = game.players[i].id;
            }
        }
        
        console.log("GameCreator, createNewGame: " + JSON.stringify(game) + ", " + JSON.stringify(selfPlayerId));
        
        this.setState(
            {
                state: "GAME_CREATED",
                game: game,
                playerId: selfPlayerId
            }
        );
        
        return;
    }

    onMapSelected(map) {
        console.log(map);
        console.log("In game creator and map is selected: " + JSON.stringify(map));

        this.setState({
            mapSelected: true,
            map: map,
        });
    }

    async onStartGame() {
        console.log("GameCreator onStartGame: " + this.state.game.id + ", " + this.state.playerId);

        await startGame(this.state.game.id);
        
        this.props.onGameStarted(this.state.game.id, this.state.playerId);
    }

    onDeleteGame() {
        deleteGame(this.state.game.id);
    }
    
    render() {

        console.log("1 -- GameCreator render, players: " + JSON.stringify(this.state.players));

        let title = "Create new game";

        if (this.state.state === "GAME_CREATED") {
            title = "Game ready. Wait for players or start";
        }
        
        return (
                <Dialog heading={title} noCloseButton={true} closeLabel="Cancel">

                    {this.state.state === "BEFORE_GAME_CREATED" &&
                        <div>

                            <DialogSection label="Enter title">
                                <input type="text" placeholder="Title..."
                                    ref={(selfName) => {this.titleField = selfName;}} />
                            </DialogSection>

                            <DialogSection label="Select map">
                                Map: {this.state.mapSelected && this.state.map.title}
                                Select map
                                {this.state.mapSelected &&
                                    <MapList
                                        selectedMap={this.state.map}
                                        onMapSelected={
                                            (map) => {this.onMapSelected(map);}
                                        }
                                    />
                                }

                                {!this.state.mapSelected &&
                                    <MapList
                                        onMapSelected={
                                            (map) => {this.onMapSelected(map);}
                                        }
                                    />
                                }

                            </DialogSection>
                            <DialogSection>

                                <MenuSectionLabel label="Manage players" />
                                <ManagePlayers players={this.state.players} selfPlayerIndex={0}/>
                            </DialogSection>

                        </div>
                    }

                    {this.state.state === "GAME_CREATED" &&
                        <DialogSection label="Manage players">
                            <ManagePlayers players={this.state.players} selfPlayerIndex={0}/>

                            <Button label="Start game" onButtonClicked={this.onStartGame.bind(this)}/>
                            <Button label="Delete game" onButtonClicked={this.onDeleteGame.bind(this)}/>
                        </DialogSection>
                    }

                    {this.state.state === "BEFORE_GAME_CREATED" &&
                        <DialogSection>
                            <Button label="Cancel" onButtonClicked={this.props.onGameCreateCanceled} />
                            <Button label="Create game" onButtonClicked={
                                (event) => {
                                    this.createNewGame();
                                    }
                                }
                            />
                        </DialogSection>
                    }

            </Dialog>
        );
    }
}

export {
    GameCreator
};
