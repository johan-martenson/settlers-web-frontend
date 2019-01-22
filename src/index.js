import React, { Component } from 'react';

import ReactDOM from 'react-dom';
import App from './App';
import {Lobby} from './lobby.js'
import './index.css';
import { FillInPlayerInformation } from './fill_in_player_information.js';

class GameInit extends Component {

    constructor(props) {
        super(props);

        this.state = {
            state: "ENTER_PLAYER_INFORMATION"
        };

        this.setHost = this.setHost.bind(this);
    }

    setHost(host) {
        console.log("Setting host to " + host);
        this.setState(
            {host: host}
        );
    }

    onPlayerInformationDone(player) {
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

            {this.state.state === "PLAY_GAME" &&
                  <App url={this.state.host}/>
            }

            {this.state.state === "ENTER_PLAYER_INFORMATION" &&
             <FillInPlayerInformation onPlayerInformationDone={this.onPlayerInformationDone.bind(this)} />
            }

            {this.state.state === "LOBBY" &&
             <Lobby apiHost={this.state.host} player={this.state.player}/>
            }

            {this.state.state === "SELECT_HOST" &&
                  <div>
                      <div className="Dialog">
                      <h1>Select host</h1>

                      <div className="MenuSectionLabel">Predefined hosts:</div>
                      <div className="Button"
                               onClick={() => this.setHost("http://192.168.1.134:8080")}
                            >Johan's laptop (192.168.1.134)</div>
                      <div className="Button"
                               onClick={() => this.setHost("http://localhost:8080")} >
                               On this computer
                      </div>

                      <div className="MenuSectionLabel">Select other host:</div>
                      <div className="InputTextFieldContainer">
                          <input type="text"
                              placeholder="Other host..."
                              ref={(selfName) => {this.hostField = selfName;}} />
                      </div>
                      <div className="Button" onClick={
                          () => {this.setHost(this.hostField.value);}
                          }
                      >Connect to other host</div>
                  </div>
              </div>
            }

          </div>
        );
    }
}

ReactDOM.render(
  <GameInit url='http://localhost:8080' />,
  document.getElementById('root')
);
