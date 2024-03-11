import React, { useEffect } from 'react'
import { Button, Field, SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from "@fluentui/react-components"
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { HouseInformation, MATERIALS_UPPER_CASE, Nation, SOLDIER_TYPES, getSoldierDisplayName, isHeadquarterInformation, rankToMaterial } from "../api/types"
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
    const [panel, setPanel] = useState<'INVENTORY' | 'RESERVED' | 'MILITARY_SETTINGS'>('INVENTORY')
    const [strengthWhenPopulatingBuildings, setStrengthWhenPopulatingBuildings] = useState<number>(5)
    const [defenseFromSurroundingBuildings, setDefenseFromSurroundingBuildings] = useState<number>(5)
    const [defenseStrength, setDefenseStrength] = useState<number>(5)
    const [defendersStayHome, setDefendersStayHome] = useState<number>(5)
    const [populateFarFromBorder, setPopulateFarFromBorder] = useState<number>(5)
    const [populateCloserToBorder, setPopulateCloserToBorder] = useState<number>(5)
    const [populateCloseToBorder, setPopulateCloseToBorder] = useState<number>(5)

    useEffect(
        () => {
            (async () => {
                const strength = await monitor.getDefenseStrength()

                setDefenseStrength(strength)
            })().then()
        },
        [])

    useEffect(
        () => {
            monitor.setDefenseStrength(defenseStrength)
        },
        [defenseStrength])

    useEffect(
        () => {
            (async () => {
                const strength = await monitor.getStrengthWhenPopulatingMilitaryBuildings()

                setStrengthWhenPopulatingBuildings(strength)
            })().then()
        },
        [])

    useEffect(
        () => {
            monitor.setStrengthWhenPopulatingMilitaryBuildings(strengthWhenPopulatingBuildings)
        },
        [strengthWhenPopulatingBuildings])

    useEffect(
        () => {
            (async () => {
                const defenseFromSurroundingBuildings = await monitor.getDefenseFromSurroundingBuildings()

                setDefenseFromSurroundingBuildings(defenseFromSurroundingBuildings)
            })().then()
        }, [])

    useEffect(
        () => {
            monitor.setDefenseFromSurroundingBuildings(defenseFromSurroundingBuildings)
        },
        [defenseFromSurroundingBuildings])

    useEffect(
        () => {
            (async () => {
                //monitor.setDefendersStayHome(defendersStayHome)
            })
        },
        [defendersStayHome])

    useEffect(
        () => {
            (async () => {
                const populate = await monitor.getPopulateMilitaryFarFromBorder()

                setPopulateFarFromBorder(populate)
            })().then()
        }, []
    )

    useEffect(
        () => {
            (async () => {
                const populate = await monitor.getPopulateMilitaryCloserToBorder()

                setPopulateCloserToBorder(populate)
            })
        }
    )

    useEffect(
        () => {
            (async () => {
                const populate = await monitor.getPopulateMilitaryCloseToBorder()

                setPopulateCloseToBorder(populate)
            })().then()
        }, []
    )

    useEffect(
        () => monitor.setMilitaryPopulationFarFromBorder(populateFarFromBorder),
        [populateFarFromBorder]
    )

    useEffect(
        () => monitor.setMilitaryPopulationCloserToBorder(populateCloserToBorder),
        [populateCloserToBorder]
    )

    useEffect(
        () => monitor.setMilitaryPopulationCloseToBorder(populateCloseToBorder),
        [populateCloseToBorder]
    )

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
                        } else if (value === 'RESERVED') {
                            setPanel('RESERVED')
                        } else {
                            setPanel('MILITARY_SETTINGS')
                        }
                    }
                }
            >
                <Tab value='INVENTORY'>Inventory</Tab>
                <Tab value='RESERVED'>Reserved soldiers</Tab>
                <Tab value='MILITARY_SETTINGS'>Military settings</Tab>
            </TabList>

            {panel === 'INVENTORY' &&
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

            {panel === 'RESERVED' &&
                <div className='headquarter-reserved-soldiers'>
                    {SOLDIER_TYPES.map(rank => {
                        if (isHeadquarterInformation(house)) {
                            const hosted = (house.soldiers) ? house.soldiers.filter(soldier => soldier === rank).length : 0
                            const soldierDisplayName = getSoldierDisplayName(rank)

                            return (
                                <div className='headquarter-inventory-item' key={rank} style={{ display: "block" }}>
                                    ({hosted} / {house.reserved[rank]}) <Tooltip content={soldierDisplayName} relationship='label' withArrow key={rank}>
                                        <div style={{ display: "inline" }}><InventoryIcon material={rankToMaterial(rank)} nation={nation} inline /></div>
                                    </Tooltip>
                                    <Subtract16Filled onClick={() => house.reserved[rank] !== 0 && monitor.setReservedSoldiers(rank, house.reserved[rank] - 1)} />
                                    <Add16Filled onClick={() => house.reserved[rank] !== 100 && monitor.setReservedSoldiers(rank, house.reserved[rank] + 1)} />
                                </div>
                            )
                        }
                    })}
                </div>
            }

            {panel === 'MILITARY_SETTINGS' &&
                <div className='headquarters-military-settings'>
                    <Field label="Populate buildings with weak or strong soldiers">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={strengthWhenPopulatingBuildings} />
                            <Add16Filled onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Weak or strong defenders">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setDefenseStrength(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={defenseStrength} />
                            <Add16Filled onClick={() => setDefenseStrength(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Defenders from surrounding buildings">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setDefenseFromSurroundingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={defenseFromSurroundingBuildings} />
                            <Add16Filled onClick={() => setDefenseFromSurroundingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Defenders left out of attack">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setDefendersStayHome(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={defendersStayHome} />
                            <Add16Filled onClick={() => setDefendersStayHome(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Populate military buildings far from border">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setPopulateFarFromBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateFarFromBorder} />
                            <Add16Filled onClick={() => setPopulateFarFromBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Populate military buildings closer to border">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setPopulateCloserToBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateCloserToBorder} />
                            <Add16Filled onClick={() => setPopulateCloserToBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label="Populate military buildings close to border">
                        <div style={{ gap: "7px", display: "flex", flexDirection: "row" }}>
                            <Subtract16Filled onClick={() => setPopulateCloseToBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateCloseToBorder} />
                            <Add16Filled onClick={() => setPopulateCloseToBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>
                </div>
            }

            <Button onClick={() => onClose()} >Close</Button>

        </div >
    )
}

export { HeadquarterInfo }