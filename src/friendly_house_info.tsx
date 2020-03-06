import React, { Component } from 'react';
import { GameId, HouseInformation, PlayerId, removeHouse } from './api';
import Button from './button';
import { Dialog, DialogSection } from './dialog';
import HeadquarterInfo from './headquarter_info';
import houseImageMap from './images';

interface FriendlyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    closeDialog: (() => void)
}

interface FriendlyHouseInfoState { }

class FriendlyHouseInfo extends Component<FriendlyHouseInfoProps, FriendlyHouseInfoState> {

    render() {

        return (
            <Dialog heading={this.props.house.type} floating onCloseDialog={this.props.closeDialog}>

                <img src={houseImageMap.get(this.props.house.type)} className="MediumIcon" alt="House" />

                {(this.props.house.type === "Headquarter") &&
                    <DialogSection label="Inventory">
                        <HeadquarterInfo house={this.props.house} gameId={this.props.gameId} playerId={this.props.playerId} />
                    </DialogSection>
                }

                {(this.props.house.type !== "Headquarter") &&
                    <Button label="Destroy"
                        onButtonClicked={
                            async () => {
                                await removeHouse(this.props.house.id, this.props.playerId, this.props.gameId);

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
