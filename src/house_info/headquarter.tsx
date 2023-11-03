import React from 'react'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from "@fluentui/react-components"
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { HouseInformation, MATERIALS_UPPER_CASE, Nation, SOLDIER_TYPES, isHeadquarterInformation, rankToMaterial } from "../api/types"
import { HouseIcon, InventoryIcon } from "../icon"
import './house_info.css'
import { useState } from "react"
import { monitor } from "../api/ws-api"

interface HeadquarterInfoProps {
    house: HouseInformation
    nation: Nation
    onClose: (() => void)
}

const HeadquarterInfo = ({ house, nation, onClose }: HeadquarterInfoProps) => {

    const [panel, setPanel] = useState<'INVENTORY' | 'RESERVED'>('INVENTORY')

    return (
        <div className="house-info">

            <h1>Headquarters</h1>

            <HouseIcon houseType="Headquarter" nation={nation} />

            <TabList
                defaultSelectedValue={'INVENTORY'}
                onTabSelect={
                    (event: SelectTabEvent, data: SelectTabData) => {
                        const value = data.value

                        if (value == 'INVENTORY') {
                            setPanel('INVENTORY')
                        } else {
                            setPanel('RESERVED')
                        }
                    }
                }
            >
                <Tab value='INVENTORY'>Inventory</Tab>
                <Tab value='RESERVED'>Military</Tab>
            </TabList>

            {panel == 'INVENTORY' &&
                <div className="headquarter-inventory">
                    {Array.from(MATERIALS_UPPER_CASE).filter(material => material !== 'STORAGE_WORKER' && material !== 'WELL_WORKER').map(material => {
                        const amount = house.resources[material]?.has ?? 0

                        return (
                            <div className="headquarter-inventory-item" key={material} >
                                <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow >
                                    <div><InventoryIcon nation={nation} material={material} scale={1} label={material.toLowerCase()} /></div>
                                </Tooltip>
                                {amount}
                            </div>
                        )
                    })}
                </div>
            }

            {panel == 'RESERVED' &&
                <div className='headquarter-reserved-soldiers'>
                    {SOLDIER_TYPES.map(rank => {
                        if (isHeadquarterInformation(house)) {

                            const hosted = (house.soldiers) ? house.soldiers.filter(soldier => soldier === rank).length : 0

                            return (
                                <div className='headquarter-inventory-item' key={rank} style={{ display: "block" }}>
                                    ({hosted} / {house.reserved[rank]}) <InventoryIcon material={rankToMaterial(rank)} nation={nation} inline />
                                    <Subtract16Filled onClick={() => house.reserved[rank] !== 0 && monitor.setReservedSoldiers(rank, house.reserved[rank] - 1)} />
                                    <Add16Filled onClick={() => house.reserved[rank] !== 100 && monitor.setReservedSoldiers(rank, house.reserved[rank] + 1)} />
                                </div>
                            )
                        }

                    })}
                </div>
            }

            <Button onClick={() => onClose()} >Close</Button>

        </div>
    )
}

export { HeadquarterInfo }