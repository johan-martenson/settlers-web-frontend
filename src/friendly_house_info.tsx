import React, { Component } from 'react';
import Button from './button';
import { PlayerId, GameId, HouseInformation, removeHouse } from './api';
import houseImageMap from './images';
import HeadquarterInfo from './headquarter_info';
import { Dialog, DialogSection } from './dialog';

interface FriendlyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    closeDialog: (() => void)
}

interface FriendlyHouseInfoState {}

class FriendlyHouseInfo extends Component<FriendlyHouseInfoProps, FriendlyHouseInfoState> {

    render() {

        return (
            <Dialog heading={this.props.house.type}>

                <img src={houseImageMap.get(this.props.house.type)} className="MediumIcon" alt="House"/>

                {(this.props.house.type === "Headquarter") &&
                    <DialogSection label="Inventory">
                        <HeadquarterInfo house={this.props.house} gameId={this.props.gameId} playerId={this.props.playerId} />
                    </DialogSection>
                }

                {(this.props.house.type !== "Headquarter") &&
                    <Button label="Destroy"
                        onButtonClicked={
                            async () => {
                                await removeHouse(this.props.house.id, this.props.gameId);

                                this.props.closeDialog();
                            }
                        }
                    />
                }

            </Dialog>
        );
    }
}

export default FriendlyHouseInfo;
