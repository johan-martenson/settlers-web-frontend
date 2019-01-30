import React, { Component } from 'react';
import { GameId, PlayerId, HouseInformation, getHouseInformation } from './api';

interface HeadquarterInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    itemsPerPage?: number
}

interface HeadquarterInfoState {
    inventory: Map<string, number>
    page: number
    itemsPerPage: number
}

class HeadquarterInfo extends Component<HeadquarterInfoProps, HeadquarterInfoState> {

    constructor(props: HeadquarterInfoProps) {
        super(props);

        let itemsPerPage = 10;

        if (this.props.itemsPerPage) {
            itemsPerPage = this.props.itemsPerPage;
        }

        this.state = {
            inventory: new Map(),
            page: 0,
            itemsPerPage: itemsPerPage
        };
    }

    async componentDidMount() {

        const house = await getHouseInformation(this.props.house.id, this.props.playerId, this.props.gameId);

        console.info("Got house information " + JSON.stringify(house));

        this.setState({
            inventory: house.inventory
        });
    };
    
    render() {

        return (
            <div>
              <div className="InventoryList">
                {Object.keys(this.state.inventory).map(
                    (key, index) => {

                        if (this.state.page * this.state.itemsPerPage <= index &&
                            index < (this.state.page + 1) * this.state.itemsPerPage) {
                            return (
                                <span className="InventoryLabelValuePair" key={index} >
                                    <div className="InventoryLabel">{key.replace(/_/g, ' ')}</div>
                                    <div className="InventoryValue">{this.state.inventory.get(key)}</div>
                                </span>
                            );
                        } else {
                            return null;
                        }
                    }
                )
                }
            </div>

            {this.state.page > 0 &&
                <div className="Previous Button" onClick={
                    () => {
                        if (this.state.page > 0) {
                            this.setState({
                                page: this.state.page - 1
                            });
                        }
                    }
                }
             >Prev</div>
            }

            {(this.state.page + 1) * this.state.itemsPerPage < Object.keys(this.state.inventory).length &&
                <div className="Next Button" onClick={() => {
                    if ((this.state.page + 1) * this.state.itemsPerPage <
                        Object.keys(this.state.inventory).length) {
                        this.setState({
                            page: this.state.page + 1
                        });
                    }
                }
                }
                >Next</div>}
            </div>
        );
    }
}

export default HeadquarterInfo;
