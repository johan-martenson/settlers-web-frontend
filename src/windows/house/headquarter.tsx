import React, { useMemo } from 'react'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { HouseInformation, Material, Nation, SOLDIER_TYPES, isHeadquarterInformation, rankToMaterial } from '../../api/types'
import './house_info.css'
import { useState } from 'react'
import { api } from '../../api/ws-api'
import { WindowWithTyping } from '../../components/dialog'
import { ItemContainer } from '../../components/item_container'
import { usePlayer } from '../../utils/hooks/hooks'
import { GenericCommand } from '../../utils/typing-commands'
import { MATERIAL_LABELS, soldierPretty } from '../../utils/pretty_strings'
import { HouseIcon, InventoryIcon, UiIcon } from '../../components/icons/icon'


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
    'GOLD',
    'IRON_BAR',
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
const MAX_RESERVED = 100

// Functions
export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}


// React components
const HeadquarterInfo = ({ house, nation, onClose, onRaise }: HeadquarterInfoProps) => {

    // State
    const [panel, setPanel] = useState<'INVENTORY' | 'RESERVED' | 'MILITARY_SETTINGS'>('INVENTORY')
    const [hover, setHover] = useState<string>()

    // Monitoring hooks
    const player = usePlayer(house.playerId)

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('Inventory', {
            action: () => setPanel('INVENTORY'),
        })

        cmds.set('Reserved soldiers', {
            action: () => setPanel('RESERVED'),
        })

        cmds.set('Military settings', {
            action: () => setPanel('MILITARY_SETTINGS'),
        })

        cmds.set('Close window', {
            action: onClose,
        })

        INVENTORY_MATERIALS.forEach(material => {
            cmds.set(`Block ${material} from inventory`, {
                action: (house: HouseInformation) => api.blockDelivery(house.id, material),
            })

            cmds.set(`Unblock ${material} from inventory`, {
                action: (house: HouseInformation) => api.allowDelivery(house.id, material),
            })

            cmds.set(`Send out ${material}`, {
                action: (house: HouseInformation) => api.sendOutMaterial(house.id, material),
            })

            cmds.set(`Stop sending out ${material}`, {
                action: (house: HouseInformation) => api.stopSendingOutMaterial(house.id, material),
            })
        })

        SOLDIER_TYPES.forEach(rank => {
            cmds.set(`Set reserved ${rank} soldiers`, {
                action: (house: HouseInformation) => {
                    if (isHeadquarterInformation(house)) {
                        const soldierDisplayName = soldierPretty(rank)
                        setHover(`Manage reserved ${soldierDisplayName}s`)
                    }
                },
            })
        })

        return cmds
    }, [onClose])

    // Rendering
    if (player === undefined) {
        console.error(`Headquarters window: player ${house.playerId} is undefined`)

        return null
    }

    return (
        <WindowWithTyping<HouseInformation>
            commands={commands}
            param={house}
            hoverInfo={hover}
            className='house-info'
            onClose={onClose}
            heading='Headquarters'
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
                selectedValue={panel}
                onTabSelect={
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    (_event: SelectTabEvent, data: SelectTabData) => {
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
                    {INVENTORY_MATERIALS
                        .filter(material => material !== 'STOREHOUSE_WORKER' && material !== 'WELL_WORKER')
                        .map(material => {
                            const amount = house.resources[material]?.has ?? 0
                            const label = MATERIAL_LABELS.get(material) ?? material.toLowerCase()

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
                        if (!isHeadquarterInformation(house)) {
                            console.error(`Headquarters window: house ${house.id} is not a headquarters`)

                            return null
                        }

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
                                        if (house.reserved[rank] !== MAX_RESERVED) {
                                            api.setReservedSoldiers(rank, house.reserved[rank] + 1)
                                        }
                                    }}
                                />
                            </div>
                        )
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
                                onClick={() => api.setStrengthWhenPopulatingMilitaryBuildings(clamp(player.strengthWhenPopulatingBuildings - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.strengthWhenPopulatingBuildings}
                                onMouseEnter={() => setHover(`${player.strengthWhenPopulatingBuildings}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='STRONG_SOLDIER_WITH_PLUS'
                                onMouseEnter={() => setHover(`Populate new military buildings with stronger soldiers`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setStrengthWhenPopulatingMilitaryBuildings(clamp(player.strengthWhenPopulatingBuildings + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Weak or strong defenders'>
                        <div className='military-setting'>
                            <UiIcon
                                type='ONE_SHIELD_WITH_MINUS'
                                onMouseEnter={() => setHover(`Weaken defense`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setDefenseStrength(clamp(player.defenseStrength - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.defenseStrength}
                                onMouseEnter={() => setHover(`${player.defenseStrength}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='TWO_SHIELDS_WITH_PLUS'
                                onMouseEnter={() => setHover(`Strengthen defense`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setDefenseStrength(clamp(player.defenseStrength + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Defenders from surrounding buildings'>
                        <div className='military-setting'>
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_MINUS'
                                onMouseEnter={() => setHover(`Fewer defenders from surrounding buildings`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setDefenseFromSurroundingBuildings(clamp(player.defenseFromSurroundingBuildings - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.defenseFromSurroundingBuildings}
                                onMouseEnter={() => setHover(`${player.defenseFromSurroundingBuildings}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_YELLOW_SHIELD_AND_PLUS'
                                onMouseEnter={() => setHover(`More defenders from surrounding buildings`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setDefenseFromSurroundingBuildings(clamp(player.defenseFromSurroundingBuildings + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Soldiers available for attack'>
                        <div className='military-setting'>
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_SWORDS_AND_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers available for attacks`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setSoldiersAvailableForAttack(clamp(player.soldiersAvailableForAttack - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.soldiersAvailableForAttack}
                                onMouseEnter={() => setHover(`${player.soldiersAvailableForAttack}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='MILITARY_BUILDING_WITH_SWORDS_AND_PLUS'
                                onMouseEnter={() => setHover(`More soldiers available for attacks`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setSoldiersAvailableForAttack(clamp(player.soldiersAvailableForAttack + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings far from border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='SMALLEST_FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers far from the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationFarFromBorder(clamp(player.militaryPopulationFarFromBorder - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.militaryPopulationFarFromBorder}
                                onMouseEnter={() => setHover(`${player.militaryPopulationFarFromBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='SMALLEST_FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers far from the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationFarFromBorder(clamp(player.militaryPopulationFarFromBorder + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings closer to border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='SMALLER_FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers closer to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationCloserToBorder(clamp(player.militaryPopulationAwayFromBorder - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.militaryPopulationAwayFromBorder}
                                onMouseEnter={() => setHover(`${player.militaryPopulationAwayFromBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='SMALLER_FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers closer to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationCloserToBorder(clamp(player.militaryPopulationAwayFromBorder + 1, 0, 10))} />
                        </div>
                    </Field>

                    <Field label='Populate military buildings close to border'>
                        <div className='military-setting'>
                            <UiIcon
                                type='FORTRESS_WITH_MINUS'
                                onMouseEnter={() => setHover(`Fewer soldiers close to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationCloseToBorder(clamp(player.militaryPopulationCloseToBorder - 1, 0, 10))} />
                            <meter
                                min={0}
                                max={10}
                                value={player.militaryPopulationCloseToBorder}
                                onMouseEnter={() => setHover(`${player.militaryPopulationCloseToBorder}/10`)}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <UiIcon
                                type='FORTRESS_WITH_PLUS'
                                onMouseEnter={() => setHover(`More soldiers close to the border`)}
                                onMouseLeave={() => setHover(undefined)}
                                onClick={() => api.setMilitaryPopulationCloseToBorder(clamp(player.militaryPopulationCloseToBorder + 1, 0, 10))}
                            />
                        </div>
                    </Field>
                </ItemContainer>
            }

        </WindowWithTyping>
    )
}

export { HeadquarterInfo }