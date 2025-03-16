import React, { useState } from 'react'
import { Button, Field, Tooltip } from '@fluentui/react-components'
import { HouseInformation, Nation, SoldierType, isMaterial, rankToMaterial } from '../../api/types'
import { HouseIcon, InventoryIcon, UiIcon } from '../../icons/icon'
import './house_info.css'
import { api } from '../../api/ws-api'
import { ButtonRow, Window } from '../../components/dialog'
import { canBeUpgraded, isEvacuated } from '../../api/utils'
import { buildingPretty, soldierPretty } from '../../pretty_strings'

// Types
type MilitaryBuildingProps = {
    house: HouseInformation
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

// React components
const MilitaryBuilding = ({ house, nation, onClose, onRaise }: MilitaryBuildingProps) => {
    const [hoverInfo, setHoverInfo] = useState<string>()

    const soldiers: (SoldierType | null)[] = []

    if (house.soldiers && house.maxSoldiers) {
        soldiers.push(...house.soldiers)

        for (let i = 0; i < house.maxSoldiers - house.soldiers.length; i++) {
            soldiers.push(null)
        }
    }

    const hasCoins = house.resources?.COIN?.has ?? 0
    const canHoldCoins = house.resources?.COIN?.canHold ?? 0
    const gapCoins = canHoldCoins - hasCoins

    // TODO: show resources when upgrading. Show text 'is upgrading...'

    return (
        <Window
            className='house-info'
            heading={buildingPretty(house.type)}
            onClose={onClose}
            hoverInfo={hoverInfo}
            onRaise={onRaise}
        >

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            {house.upgrading && <div>Upgrading ...</div>}

            {house.upgrading &&
                Object.keys(house.resources)
                    .filter(material => isMaterial(material) && house.resources[material].canHold !== undefined).length > 0 &&
                <Field label='Resources'>
                    <div>
                        {Object.keys(house.resources)
                            .filter(material => isMaterial(material) && house.resources[material].canHold !== undefined)
                            .map(material => {
                                if (isMaterial(material)) {
                                    const has = house.resources[material].has ?? 0
                                    const canHold = house.resources[material].canHold ?? 0
                                    const gap = Math.max(canHold - has, 0)
                                    const materialLabel = material.charAt(0) + material.substring(1).toLocaleLowerCase()

                                    return <div key={material}>
                                        {Array.from({ length: has }, () => 1).map((value, index) => (
                                            <Tooltip content={materialLabel} relationship='label' withArrow key={index}>
                                                <span
                                                    onMouseEnter={() => setHoverInfo(materialLabel)}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <InventoryIcon material={material} nation={nation} inline />
                                                </span>
                                            </Tooltip>
                                        ))}
                                        {Array.from({ length: gap }, () => 1).map((value, index) => (
                                            <Tooltip content={materialLabel} relationship='label' withArrow key={index}>
                                                <span
                                                    onMouseEnter={() => setHoverInfo(materialLabel)}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <InventoryIcon material={material} nation={nation} inline missing />
                                                </span>
                                            </Tooltip>
                                        ))}
                                    </div>
                                }
                            })}
                    </div>
                </Field>
            }

            <Field label='Soldiers' >
                <div>
                    {soldiers.map((rank, index) => {
                        if (rank) {
                            const soldierDisplayName = soldierPretty(rank)
                            const soldierMaterial = rankToMaterial(rank)

                            console.log(soldierDisplayName)

                            return (
                                <Tooltip content={soldierDisplayName} relationship='label' withArrow key={index} >
                                    <div
                                        onMouseEnter={() => setHoverInfo(soldierDisplayName)}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                        style={{ display: 'inline' }}>
                                        <InventoryIcon material={soldierMaterial} nation={nation} key={index} inline />
                                    </div>
                                </Tooltip>
                            )
                        } else {
                            return (
                                <Tooltip content='Open space for additional soldier' relationship='label' withArrow key={index} >
                                    <div style={{ display: 'inline' }}>
                                        <InventoryIcon material={'PRIVATE'} nation={nation} key={index} inline missing />
                                    </div>
                                </Tooltip>
                            )
                        }
                    })}
                </div>
            </Field>

            <Field label='Coins'>
                <div>
                    {Array.from({ length: hasCoins }, () => 1).map((_, index) => (
                        <Tooltip content='Coin' relationship={'label'} withArrow key={index}>
                            <span
                                onMouseEnter={() => setHoverInfo('Coin')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            ><InventoryIcon material={'COIN'} nation={nation} inline /></span>
                        </Tooltip>
                    ))}
                    {Array.from({ length: gapCoins }, () => 1).map((_, index) => (
                        <Tooltip content='Coin' relationship={'label'} withArrow key={index}>
                            <span
                                onMouseEnter={() => setHoverInfo(`Can hold ${gapCoins} coins more`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            ><InventoryIcon material={'COIN'} nation={nation} inline missing /></span>
                        </Tooltip>
                    ))}
                </div>
            </Field>

            <ButtonRow>
                {house.promotionsEnabled ?
                    <Button
                        onClick={() => { api.disablePromotionsForHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Disable promotions')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Disable<br />promotions
                    </Button>
                    :
                    <Button
                        onClick={() => { api.enablePromotionsForHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Enable promotions')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Enable<br />promotions
                    </Button>
                }

                {isEvacuated(house) &&
                    <Button
                        onClick={() => { api.cancelEvacuationForHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Cancel evacuation')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Cancel<br />evacuation
                    </Button>
                }

                {!isEvacuated(house) &&
                    <Button
                        onClick={() => { api.evacuateHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Evacuate')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >Evacuate</Button>
                }

                {canBeUpgraded(house) && !house.upgrading &&
                    <Button
                        onClick={() => api.upgrade(house.id)}
                        onMouseEnter={() => setHoverInfo('Upgrade')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        {house.type === 'Barracks' && <HouseIcon houseType='GuardHouse' nation={nation} scale={0.5} />}
                        {house.type === 'GuardHouse' && <HouseIcon houseType='WatchTower' nation={nation} scale={0.5} />}
                        {house.type === 'WatchTower' && <HouseIcon houseType='Fortress' nation={nation} scale={0.5} />}
                    </Button>
                }


                <Tooltip content={'Remove'} relationship='label' withArrow>
                    <Button onClick={() => {
                        api.removeBuilding(house.id)

                        onClose()
                    }}
                        onMouseEnter={() => setHoverInfo('Tear down')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='DESTROY_BUILDING' />
                    </Button>
                </Tooltip>

            </ButtonRow>
        </Window>
    )
}

export { MilitaryBuilding }