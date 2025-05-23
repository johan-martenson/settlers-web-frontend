import React, { useEffect } from 'react'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { HouseInformation, Material, Nation, SOLDIER_TYPES, isHeadquarterInformation, rankToMaterial } from '../../api/types'
import { HouseIcon, InventoryIcon, UiIcon } from '../../icons/icon'
import './house_info.css'
import { useState } from 'react'
import { api } from '../../api/ws-api'
import { Window } from '../../components/dialog'
import { MATERIAL_LABELS, soldierPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'

// Types
type HeadquarterInfoProps = {
    house: HouseInformation
    nation: Nation

    onRaise: () => void
    onClose: () => void
}

// Constants
const INVENTORY_MATERIALS: Material[] = [
    'WOOD',
    'PLANK',
    'STONE',
    'PIG',
    'WHEAT',
    'FLOUR',
    'FISH',
    'MEAT',
    'BREAD',
    'WATER',
    'BEER',
    'COAL',
    'IRON',
    'COIN',
    'TONGS',
    'AXE',
    'SAW',
    'PICK_AXE',
    'HAMMER',
    'SHOVEL',
    'CRUCIBLE',
    'FISHING_ROD',
    'SCYTHE',
    'CLEAVER',
    'ROLLING_PIN',
    'BOW',
    'SWORD',
    'SHIELD',
    'BOAT',
    'BUILDER',
    'PLANER',
    'WOODCUTTER_WORKER',
    'FORESTER',
    'STONEMASON',
    'FISHERMAN',
    'HUNTER',
    'CARPENTER',
    'FARMER',
    'PIG_BREEDER',
    'DONKEY_BREEDER',
    'MILLER',
    'BAKER',
    'BUTCHER',
    'BREWER',
    'MINER',
    'IRON_FOUNDER',
    'ARMORER',
    'MINTER',
    'METALWORKER',
    'SHIPWRIGHT',
    'GEOLOGIST',
    'SCOUT',
    'DONKEY',
    'PRIVATE',
    'PRIVATE_FIRST_CLASS',
    'SERGEANT',
    'OFFICER',
    'GENERAL'
]

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
        <Window
            className='house-info'
            onClose={onClose}
            heading='Headquarters'
            hoverInfo={hover}
            onRaise={onRaise}
        >
            <HouseIcon
                houseType='Headquarter'
                nation={nation}
                drawShadow
                onMouseEnter={() => setHover(`Headquarters`)}
                onMouseLeave={() => setHover(undefined)}
            />

            <TabList
                defaultSelectedValue={'INVENTORY'}
                onTabSelect={
                    (event: SelectTabEvent, data: SelectTabData) => {
                        const value = data.value as 'INVENTORY' | 'RESERVED' | 'MILITARY_SETTINGS'

                        setPanel(value)
                    }
                }
            >
                <Tab
                    value='INVENTORY'
                    onMouseEnter={() => setHover(`Manage inventory`)}
                    onMouseLeave={() => setHover(undefined)}
                >Inventory</Tab>
                <Tab
                    value='RESERVED'
                    onMouseEnter={() => setHover(`Manage reserved soldiers`)}
                    onMouseLeave={() => setHover(undefined)}
                >Reserved soldiers</Tab>
                <Tab
                    value='MILITARY_SETTINGS'
                    onMouseEnter={() => setHover(`Manage military settings`)}
                    onMouseLeave={() => setHover(undefined)}
                >Military settings</Tab>
            </TabList>

            {panel === 'INVENTORY' &&
                <ItemContainer rows >
                    {Array.from(INVENTORY_MATERIALS)
                        .filter(material => material !== 'STOREHOUSE_WORKER' && material !== 'WELL_WORKER')
                        .map(material => {
                            const amount = house.resources[material]?.has ?? 0
                            const label = MATERIAL_LABELS.get(material) ?? material.toLocaleLowerCase()

                            return (
                                <div className='headquarter-inventory-item' key={material} >
                                    <div
                                        onMouseEnter={() => setHover(label)}
                                        onMouseLeave={() => setHover(undefined)}
                                    >
                                        <InventoryIcon nation={nation} material={material} scale={1} />
                                    </div>
                                    {amount}
                                </div>
                            )
                        })}
                </ItemContainer>
            }

            {panel === 'RESERVED' &&
                <ItemContainer>
                    {SOLDIER_TYPES.map(rank => {
                        if (isHeadquarterInformation(house)) {
                            const soldierDisplayName = soldierPretty(rank)

                            return (
                                <div className='headquarter-inventory-item' key={rank} style={{ display: 'block' }}>
                                    ({house.inReserve[rank]} / {house.reserved[rank]})
                                    <div
                                        style={{ display: 'inline' }}
                                        onMouseEnter={() => setHover(soldierDisplayName)}
                                        onMouseLeave={() => setHover(undefined)}
                                    >
                                        <InventoryIcon material={rankToMaterial(rank)} nation={nation} inline />
                                    </div>
                                    <UiIcon type='MINUS' scale={0.5}
                                        onMouseEnter={() => setHover(`Reduce reserved ${soldierDisplayName}s`)}
                                        onMouseLeave={() => setHover(undefined)}
                                        onClick={() => {
                                            if (house.reserved[rank] !== 0) {
                                                api.setReservedSoldiers(rank, house.reserved[rank] - 1)
                                            }
                                        }}
                                    />
                                    <UiIcon type='PLUS' scale={0.5}
                                        onMouseEnter={() => setHover(`Increase reserved ${soldierDisplayName}s`)}
                                        onMouseLeave={() => setHover(undefined)}
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
                </ItemContainer>
            }

            {panel === 'MILITARY_SETTINGS' &&
                <ItemContainer style={{ alignItems: 'flex-start' }}>
                    <Field label='Populate buildings with weak or strong soldiers'>
                        <div className='military-setting'>
                            <UiIcon
                                type='WEAK_SOLDIER_WITH_MINUS'
                                onMouseEnter={() => setHover(`Populate new military buildings with weaker soldiers`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={strengthWhenPopulatingBuildings}
                                onMouseEnter={() => setHover(`${strengthWhenPopulatingBuildings}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='STRONG_SOLDIER_WITH_PLUS'
                                onMouseEnter={() => setHover(`Populate new military buildings with stronger soldiers`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setStrengthWhenPopulatingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Weak or strong defenders'>
                        <div className='military-setting'>
                            <UiIcon
                                type='ONE_SHIELD_WITH_MINUS'
                                onMouseEnter={() => setHover(`Weaken defense`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setDefenseStrength(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={defenseStrength}
                                onMouseEnter={() => setHover(`${defenseStrength}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='TWO_SHIELDS_WITH_PLUS'
                                onMouseEnter={() => setHover(`Strengthen defense`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setDefenseStrength(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Defenders from surrounding buildings'>
                        <div className='military-setting'>
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_MINUS'
                                onMouseEnter={() => setHover(`Fewer defenders from surrounding buildings`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setDefenseFromSurroundingBuildings(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={defenseFromSurroundingBuildings}
                                onMouseEnter={() => setHover(`${defenseFromSurroundingBuildings}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_PLUS'
                                onMouseEnter={() => setHover(`More defenders from surrounding buildings`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setDefenseFromSurroundingBuildings(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Soldiers available for attack'>
                        <div className='military-setting'>
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_SWORDS_AND_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers available for attacks`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setSoldiersAvailableForAttack(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={soldiersAvailableForAttack}
                                onMouseEnter={() => setHover(`${soldiersAvailableForAttack}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_SWORDS_AND_PLUS'
                                onMouseEnter={() => setHover(`More soliders available for attacks`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setSoldiersAvailableForAttack(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings far from border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='SMALLEST_FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers far from the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateFarFromBorder(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={populateFarFromBorder}
                                onMouseEnter={() => setHover(`${populateFarFromBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='SMALLEST_FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers far from the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateFarFromBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings closer to border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='SMALLER_FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers closer to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateCloserToBorder(prev => Math.max(0, prev - 1))} />
                            <meter
                                min={0}
                                max={10}
                                value={populateCloserToBorder}
                                onMouseEnter={() => setHover(`${populateCloserToBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='SMALLER_FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers closer to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateCloserToBorder(prev => Math.min(10, prev + 1))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings close to border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers close to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateCloseToBorder(prev => Math.max(0, prev - 1))}
                            />
                            <meter
                                min={0}
                                max={10}
                                value={populateCloseToBorder}
                                onMouseEnter={() => setHover(`${populateCloseToBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers close to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => setPopulateCloseToBorder(prev => Math.min(10, prev + 1))}
                            />
                        </div>
                    </Field>
                </ItemContainer>
            }

        </Window>
    )
}

export { HeadquarterInfo }