import React, { Component } from 'react';
import Button from './button.js';
import { removeHouse } from './api.js';
import houseImageMap from './images.js';
import HeadquarterInfo from './headquarter_info.js';
import { Dialog, DialogSection } from './dialog.js';

class FriendlyHouseInfo extends Component {

    render() {

        return (
            <Dialog heading={this.props.house.type}>

                <img src={houseImageMap[this.props.house.type]} className="MediumIcon" alt="House"/>

                {(this.props.house.type === "Headquarter") &&
                 <DialogSection label="Inventory">
                     <HeadquarterInfo house={this.props.house}
                         gameId={this.props.gameId}
                         player={this.props.player}
                         onCanReachServer={this.props.onCanReachServer}
                         onCannotReachServer={this.props.onCannotReachServer}
                    />
                 </DialogSection>
                }

                {(this.props.house.type !== "Headquarter") &&
                    <Button label="Destroy"
                        onClick={
                            (event) => {
                                removeHouse(this.props.house.houseId, this.props.url);

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
