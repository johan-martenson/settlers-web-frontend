import React, { Component } from 'react';

import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

class GameInit extends Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.setHost = this.setHost.bind(this);
    }

    setHost(host) {
        console.log("Setting host to " + host);
        this.setState(
            {host: host}
        );
    }

    render() {

        return (
            <div>

              {typeof(this.state.host) !== "undefined" &&
                  <App url={this.state.host}/>
              }

              {(typeof(this.state.host) === "undefined") &&
                  <div>
                      <div className="Dialog">
                      <h1>Select host to connect to</h1>

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
