import React, { Component } from 'react'
import { isMaterialUpperCase } from './api/rest-api'
import './headquarter_info.css'
import { Button } from '@fluentui/react-components'
import { HouseInformation, GameId, PlayerId, MaterialAllUpperCase, MATERIALS_UPPER_CASE_AS_STRING } from './api/types'
import { InventoryIcon } from './icon'

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

    calculateInventory(house: HouseInformation): Map<MaterialAllUpperCase, number> {
        const inventory = new Map<MaterialAllUpperCase, number>()

        MATERIALS_UPPER_CASE_AS_STRING.forEach(material => {

            if (!isMaterialUpperCase(material)) {
                console.error("Is not material: " + material)

                return
            }

            let hasAmount = 0

            if (house.resources[material]) {
                hasAmount = house.resources[material].has
            }

            if (hasAmount) {
                inventory.set(material, hasAmount)
            } else {
                inventory.set(material, 0)
            }
        })

        return inventory
    }

    render(): JSX.Element {

        const inventory = this.calculateInventory(this.props.house)
        const inventoryItems = []

        let index = 0
        for (const material of inventory.keys()) {
            const amount = inventory.get(material)

            if (material === 'WELL_WORKER' || material === 'STORAGE_WORKER') {
                continue
            }

            inventoryItems.push(
                <div className="inventory-material-amount-pair" key={index} >
                    <InventoryIcon nation='ROMANS' material={material} scale={1} label={material.toLowerCase()} />
                    {amount}
                </div>
            )

            index += 1
        }

        return (
            <div>
                <div className="inventory-list">
                    {inventoryItems}
                </div>

            </div>
        )
    }
}

export default HeadquarterInfo
