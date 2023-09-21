import React, { Component } from 'react'
import { Material, GameId, HouseInformation, PlayerId, isMaterial } from './api'
import './headquarter_info.css'
import Button from './button'

interface HeadquarterInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    itemsPerPage?: number
}

interface HeadquarterInfoState {
    page: number
    itemsPerPage: number
}

class HeadquarterInfo extends Component<HeadquarterInfoProps, HeadquarterInfoState> {

    constructor(props: HeadquarterInfoProps) {
        super(props)

        this.state = {
            page: 0,
            itemsPerPage: this.props.itemsPerPage ? this.props.itemsPerPage : 10
        }
    }

    calculateInventory(house: HouseInformation): Map<Material, number> {
        const inventory: Map<Material, number> = new Map()

        Object.entries(house.resources).forEach(
            ([material, hasAndNeeds]) => {
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

        return inventory
    }

    render() {

        const inventory = this.calculateInventory(this.props.house)
        const inventoryItems = []

        let index = 0
        for (const [material, amount] of inventory) {

            index = index + 1

            if (index < this.state.page * this.state.itemsPerPage) {
                continue
            }

            if (index > (this.state.page + 1) * this.state.itemsPerPage) {
                continue
            }

            inventoryItems.push(
                <div className="InventoryLabelValuePair" key={index} >
                    <div className="InventoryLabel">{material.replace(/_/g, ' ')}</div>
                    <div className="InventoryValue">{amount}</div>
                </div>
            )
        }

        return (
            <div>
                <div className="InventoryList">
                    {inventoryItems}
                </div>

                {this.state.page > 0 &&
                    <Button label="Previous" onButtonClicked={
                        () => {
                            this.setState({
                                page: this.state.page - 1
                            })
                        }
                    }
                    />
                }

                {(this.state.page + 1) * this.state.itemsPerPage < inventory.size &&
                    <Button label="Next" onButtonClicked={
                        () => {
                            this.setState({
                                page: this.state.page + 1
                            })
                        }
                    }
                    />
                }
            </div>
        )
    }
}

export default HeadquarterInfo
