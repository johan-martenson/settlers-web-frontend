import React, { Component } from 'react';
import { Material, GameId, getHouseInformation, HouseInformation, PlayerId, isMaterial } from './api';
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
    house: HouseInformation
}

class HeadquarterInfo extends Component<HeadquarterInfoProps, HeadquarterInfoState> {

    private periodicUpdates: NodeJS.Timeout | null = null

    constructor(props: HeadquarterInfoProps) {
        super(props);

        this.state = {
            inventory: new Map(),
            page: 0,
            itemsPerPage: this.props.itemsPerPage ? this.props.itemsPerPage : 10,
            house: props.house
        };
    }

    async componentDidMount() {

        console.info("House information is " + JSON.stringify(this.state.house));

        this.updateInventory(this.state.house)

        this.periodicUpdates = setInterval(async () => {
            const house = await getHouseInformation(this.props.house.id, this.props.playerId, this.props.gameId);
            console.info("UPDATING HOUSE")
            this.updateInventory(house)
        }, 1000)
    };

    componentWillUnmount() {
        if (this.periodicUpdates) {
            clearInterval(this.periodicUpdates)
        }
    }

    updateInventory(house: HouseInformation): void {
        const inventory: Map<Material, number> = new Map()

        Object.entries(house.resources).forEach(
            ([material, hasAndNeeds], index) => {
                const hasAmount = hasAndNeeds.has

                if (!isMaterial(material)) {
                    return
                }

                if (hasAmount) {
                    inventory.set(material, hasAmount)
                } else {
                    inventory.set(material, 0)
                }
            }
        )

        this.setState({
            inventory: inventory
        });


    }

    render() {

        if (this.state.inventory) {
            this.state.inventory.keys()
        }

        const inventoryItems = []

        let index = 0
        for (const [material, amount] of this.state.inventory) {

            index = index + 1

            inventoryItems.push(
                <div className="InventoryLabelValuePair" key={index} >
                    <div className="InventoryLabel">{material.replace(/_/g, ' ')}</div>
                    <div className="InventoryValue">{amount}</div>
                    plupp
                </div>
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
