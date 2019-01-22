import React, { Component } from 'react';
import Button from './button.js';
import { attackBuilding } from './api.js';
import { Dialog } from './dialog.js';

class EnemyHouseInfo extends Component {

    render() {
        return (
            
          <Dialog label={this.props.house.type}>

              <img src="house.png" className="MediumIcon" alt="House"/>

              <Button label="Attack"
                      onButtonClicked={
                          (event) => {

                              attackBuilding(this.props.house, this.props.gameId, this.props.playerId);

                              this.props.closeDialog();
                          }
                }
                />

            </Dialog>
        );
    }
}

export default EnemyHouseInfo;
