import React, { Component } from 'react';
import { Material, GameId, getHouseInformation, HouseInformation, PlayerId } from './api';
import './headquarter_info.css'

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

        this.state = {
            inventory: new Map(),
            page: 0,
            itemsPerPage: this.props.itemsPerPage ? this.props.itemsPerPage : 10
        };
    }

    async componentDidMount() {

        const house = await getHouseInformation(this.props.house.id, this.props.playerId, this.props.gameId);

        console.info("Got house information ");
        console.info(house);

        const inventory: Map<Material, number> = new Map()

        house.resources.forEach(
            (value, key) => {

                const hasAmount = value.get("has")

                if (hasAmount) {
                    inventory.set(key, hasAmount)
                } else {
                    inventory.set(key, 0)
                }
            }
        )

        this.setState({
            inventory: inventory
        });
    };

    render() {

        if (this.state.inventory) {
            this.state.inventory.keys()
        }

        const inventoryItems = []

        let index = 0
        for (const [material, amount] of this.state.inventory) {

            index = index + 1

            inventoryItems.push(
                <span className="InventoryLabelValuePair" key={index} >
                    <div className="InventoryLabel">{material.replace(/_/g, ' ')}</div>
                    <div className="InventoryValue">{amount}</div>
                </span>
            )
        }

        return (
            <div>
                <div className="InventoryList">
                    {inventoryItems}
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
                    <div className="Next Button" onClick={
                        () => {
                            if ((this.state.page + 1) * this.state.itemsPerPage <
                                Object.keys(this.state.inventory).length) {
                                this.setState({
                                    page: this.state.page + 1
                                });
                            }
                        }
                    }
                    >
                        Next
                    </div>}
            </div>
        );
    }
}

export default HeadquarterInfo;
