import React, { Component } from 'react';
import Button from './button.js';
import { getPlayers } from './api.js';

class SelectPlayer extends Component {

    constructor(props) {
        super(props);

        this.state = {
            players: [],
            gettingPlayers: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.url === this.props.url &&
            nextState.players === this.state.players &&
            nextState.gettingPlayers === this.state.gettingPlayers &&
            nextProps.currentPlayer === this.props.currentPlayer) {
            return false;
        }

        return true;
    }

    updatePlayers() {

        getPlayers(this.props.gameId).then(
            (players) => {
                this.setState({
                    players: players,
                    gettingPlayers: false
                });
            }).catch(
                (a, b, c) => {
                    this.setState({
                        gettingPlayers: false
                    });
                }
            );
    }
    
    componentDidMount() {

        if (this.state.players.length === 0 && this.state.gettingPlayers === false) {
            this.setState({
                gettingPlayers: true
            });

            console.info("Getting list of players from server");
            this.updatePlayers();
        }
    }
    
    onClick(event) {

        for (let player of this.state.players) {

            if (player.id === parseInt(event.currentTarget.id, 10)) {
                this.props.onPlayerSelected(player);

                break;
            }
        }
    }

    render () {
        return (
            <div className="PlayerSelect">
              {this.state.players.map(
                  (player, index) => {

                      // Don't change to ===, this comparison fails for some reason
                      let selected = typeof(this.props.currentPlayer) != "undefined" &&
                          this.props.currentPlayer === player.id;

                      return (
                          <Button label={player.name}
                                  key={player.id}
                                  id={player.id}
                                  selected={selected}
                                  onButtonClicked={this.onClick.bind(this)}
                          />
                      );
                  }
              )
              }
            </div>
        );
    }
}

export default SelectPlayer;
