import React, { Component } from 'react';
import { attackBuilding, GameId, HouseInformation, PlayerId } from './api';
import Button from './button';
import { Dialog } from './dialog';

interface EnemyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    closeDialog: (() => void)
}

interface EnemyHouseInfoState { }

class EnemyHouseInfo extends Component<EnemyHouseInfoProps, EnemyHouseInfoState> {

    render() {
        return (

            <Dialog heading={this.props.house.type}>

                <img src="house.png" className="MediumIcon" alt="House" />

                <Button label="Attack"
                    onButtonClicked={
                        () => {

                            //FIXME: make it possible to choose the number of attackers
                            attackBuilding(this.props.house.id, 10, this.props.gameId, this.props.playerId);

                            this.props.closeDialog();
                        }
                    }
                />

            </Dialog>
        );
    }
}

export default EnemyHouseInfo;
