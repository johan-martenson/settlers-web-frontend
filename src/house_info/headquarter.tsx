import React, { useEffect } from 'react'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from '@fluentui/react-components'
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { HouseInformation, MATERIALS, Nation, SOLDIER_TYPES, getSoldierDisplayName, isHeadquarterInformation, rankToMaterial } from '../api/types'
import { HouseIcon, InventoryIcon } from '../icons/icon'
import './house_info.css'
import { useState } from 'react'
import { api } from '../api/ws-api'
import { Window } from '../components/dialog'
import { MATERIAL_LABELS } from '../pretty_strings'

// Types
type HeadquarterInfoProps = {
    house: HouseInformation
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

// Constants

// React components
const HeadquarterInfo = ({ house, nation, onClose, onRaise }: HeadquarterInfoProps) => {
    const [panel, setPanel] = useState<'INVENTORY' | 'RESERVED' | 'MILITARY_SETTINGS'>('INVENTORY')
    const [strengthWhenPopulatingBuildings, setStrengthWhenPopulatingBuildings] = useState<number>(5)
    const [defenseFromSurroundingBuildings, setDefenseFromSurroundingBuildings] = useState<number>(5)
    const [defenseStrength, setDefenseStrength] = useState<number>(5)
    const [soldiersAvailableForAttack, setSoldiersAvailableForAttack] = useState<number>(5)
    const [populateFarFromBorder, setPopulateFarFromBorder] = useState<number>(5)
    const [populateCloserToBorder, setPopulateCloserToBorder] = useState<number>(5)
    const [populateCloseToBorder, setPopulateCloseToBorder] = useState<number>(5)
    const [loaded, setLoaded] = useState<boolean>(false)
    const [hover, setHover] = useState<string>()

    useEffect(() => {
        api.getMilitarySettings().then(
            (settings) => {
                setStrengthWhenPopulatingBuildings(settings.soldierStrengthWhenPopulatingBuildings)
                setDefenseFromSurroundingBuildings(settings.defenseFromSurroundingBuildings)
                setDefenseStrength(settings.defenseStrength)
                setSoldiersAvailableForAttack(settings.soldierAmountsAvailableForAttack)
                setPopulateFarFromBorder(settings.soldierAmountWhenPopulatingFarFromBorder)
                setPopulateCloserToBorder(settings.soldierAmountWhenPopulatingAwayFromBorder)
                setPopulateCloseToBorder(settings.soldierAmountWhenPopulatingCloseToBorder)

                setLoaded(true)
            }
        )
    }, [])

    useEffect(() => {
        if (loaded) {
            api.setMilitaryPopulationFarFromBorder(populateFarFromBorder)
        }
    }, [populateFarFromBorder, loaded])

    useEffect(() => {
        if (loaded) {
            api.setSoldiersAvailableForAttack(soldiersAvailableForAttack)
        }
    }, [soldiersAvailableForAttack, loaded])

    useEffect(() => {
        if (loaded) {
            api.setMilitaryPopulationCloserToBorder(populateCloserToBorder)
        }
    }, [populateCloserToBorder, loaded])

    useEffect(() => {
        if (loaded) {
            api.setMilitaryPopulationCloseToBorder(populateCloseToBorder)
        }
    }, [populateCloseToBorder, loaded])

    useEffect(() => {
        if (loaded) {
            api.setDefenseFromSurroundingBuildings(defenseFromSurroundingBuildings)
        }
    }, [defenseFromSurroundingBuildings, loaded])

    useEffect(() => {
        if (loaded) {
            api.setSoldiersAvailableForAttack(soldiersAvailableForAttack)
        }
    }, [soldiersAvailableForAttack, loaded])

    useEffect(() => {
        if (loaded) {
            api.setStrengthWhenPopulatingMilitaryBuildings(strengthWhenPopulatingBuildings)
        }
    }, [strengthWhenPopulatingBuildings, loaded])

    useEffect(() => {
        if (loaded) {
            api.setDefenseStrength(defenseStrength)
        }
    }, [defenseStrength, loaded])

    return (
        <Window className='house-info' onClose={onClose} heading='Headquarters' hoverInfo={hover} onRaise={onRaise}>
            <HouseIcon houseType='Headquarter' nation={nation} drawShadow />

            <TabList
                defaultSelectedValue={'INVENTORY'}
                onTabSelect={
                    (event: SelectTabEvent, data: SelectTabData) => {
                        const value = data.value as 'INVENTORY' | 'RESERVED' | 'MILITARY_SETTINGS'

                        setPanel(value)
                    }
                }
            >
                <Tab value='INVENTORY'>Inventory</Tab>
                <Tab value='RESERVED'>Reserved soldiers</Tab>
                <Tab value='MILITARY_SETTINGS'>Military settings</Tab>
            </TabList>

            {panel === 'INVENTORY' &&
                <div className='headquarter-inventory'>
                    {Array.from(MATERIALS)
                        .filter(material => material !== 'STOREHOUSE_WORKER' && material !== 'WELL_WORKER')
                        .map(material => {
                            const amount = house.resources[material]?.has ?? 0
                            const label = MATERIAL_LABELS.get(material) ?? material.toLocaleLowerCase()

                            return (
                                <div className='headquarter-inventory-item' key={material} >
                                    <Tooltip content={label} relationship='label' withArrow >
                                        <div
                                            onMouseEnter={() => setHover(label)}
                                            onMouseLeave={() => setHover(undefined)}
                                        >
                                            <InventoryIcon nation={nation} material={material} scale={1} />
                                        </div>
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
                            const soldierDisplayName = getSoldierDisplayName(rank)

                            return (
                                <div className='headquarter-inventory-item' key={rank} style={{ display: 'block' }}>
                                    ({house.inReserve[rank]} / {house.reserved[rank]})
                                    <Tooltip content={soldierDisplayName} relationship='label' withArrow key={rank}>
                                        <div
                                            style={{ display: 'inline' }}
                                            onMouseEnter={() => setHover(soldierDisplayName)}
                                            onMouseLeave={() => setHover(undefined)}
                                        >
                                            <InventoryIcon material={rankToMaterial(rank)} nation={nation} inline />
                                        </div>
                                    </Tooltip>
                                    <Subtract16Filled
                                        onClick={() => {
                                            if (house.reserved[rank] !== 0) {
                                                api.setReservedSoldiers(rank, house.reserved[rank] - 1)
                                            }
                                        }}
                                    />
                                    <Add16Filled
                                        onClick={() => {
                                            if (house.reserved[rank] !== 100) {
                                                api.setReservedSoldiers(rank, house.reserved[rank] + 1)
                                            }
                                        }}
                                    />
                                </div>
                            )
                        }
                    })}
                </div>
            }

            {panel === 'MILITARY_SETTINGS' &&
                <div className='headquarters-military-settings'>
                    <Field label='Populate buildings with weak or strong soldiers'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={strengthWhenPopulatingBuildings} />
                            <Add16Filled onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Weak or strong defenders'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setDefenseStrength(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={defenseStrength} />
                            <Add16Filled onClick={() => setDefenseStrength(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Defenders from surrounding buildings'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setDefenseFromSurroundingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={defenseFromSurroundingBuildings} />
                            <Add16Filled onClick={() => setDefenseFromSurroundingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Soldiers available for attack'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setSoldiersAvailableForAttack(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={soldiersAvailableForAttack} />
                            <Add16Filled onClick={() => setSoldiersAvailableForAttack(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings far from border'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setPopulateFarFromBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateFarFromBorder} />
                            <Add16Filled onClick={() => setPopulateFarFromBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings closer to border'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setPopulateCloserToBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateCloserToBorder} />
                            <Add16Filled onClick={() => setPopulateCloserToBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings close to border'>
                        <div style={{ gap: '7px', display: 'flex', flexDirection: 'row' }}>
                            <Subtract16Filled onClick={() => setPopulateCloseToBorder(prev => Math.max(0, prev - 1))} />
                            <meter min={0} max={10} value={populateCloseToBorder} />
                            <Add16Filled onClick={() => setPopulateCloseToBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>
                </div>
            }

        </Window>
    )
}

export { HeadquarterInfo }