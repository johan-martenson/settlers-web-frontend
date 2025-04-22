import React, { useState } from 'react'
import { Button, Field } from '@fluentui/react-components'
import { HouseInformation, Nation, Point, SoldierType, isMaterial, rankToMaterial } from '../../api/types'
import { HouseIcon, InventoryIcon, UiIcon } from '../../icons/icon'
import './house_info.css'
import { api } from '../../api/ws-api'
import { ButtonRow, Window } from '../../components/dialog'
import { canBeUpgraded, isEvacuated } from '../../api/utils'
import { buildingPretty, soldierPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'

// Types
type MilitaryBuildingProps = {
    house: HouseInformation
    nation: Nation

    onRaise: () => void
    onClose: () => void
    goToPoint: (point: Point) => void
}

// React components
const MilitaryBuilding = ({ house, nation, goToPoint, onClose, onRaise }: MilitaryBuildingProps) => {
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

            <HouseIcon
                houseType={house.type}
                nation={nation}
                drawShadow
                onMouseEnter={() => setHoverInfo(buildingPretty(house.type))}
                onMouseLeave={() => setHoverInfo(undefined)}
            />

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
                                            <span
                                                key={index}
                                                onMouseEnter={() => setHoverInfo(materialLabel)}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            >
                                                <InventoryIcon material={material} nation={nation} inline />
                                            </span>
                                        ))}
                                        {Array.from({ length: gap }, () => 1).map((value, index) => (
                                            <span
                                                key={index + 10}
                                                onMouseEnter={() => setHoverInfo(materialLabel)}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            >
                                                <InventoryIcon material={material} nation={nation} inline missing />
                                            </span>
                                        ))}
                                    </div>
                                }
                            })}
                    </div>
                </Field>
            }

            <Field label='Soldiers' >
                <ItemContainer rows>
                    {soldiers.map((rank, index) => {
                        if (rank) {
                            const soldierDisplayName = soldierPretty(rank)
                            const soldierMaterial = rankToMaterial(rank)

                            return (
                                <div
                                    key={rank + index}
                                    onMouseEnter={() => setHoverInfo(soldierDisplayName)}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                    style={{ display: 'inline' }}>
                                    <InventoryIcon material={soldierMaterial} nation={nation} key={index} inline />
                                </div>
                            )
                        } else {
                            return (
                                <div
                                    style={{ display: 'inline' }}
                                    key={index + 10}
                                >
                                    <InventoryIcon material={'PRIVATE'} nation={nation} key={index} inline missing />
                                </div>
                            )
                        }
                    })}
                </ItemContainer>
            </Field>

            <Field label='Coins'>
                <ItemContainer rows>
                    {Array.from({ length: hasCoins }, () => 1).map((_value, index) => (
                        <span
                            key={index}
                            onMouseEnter={() => setHoverInfo('Coin')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        ><InventoryIcon material={'COIN'} nation={nation} inline /></span>
                    ))}
                    {Array.from({ length: gapCoins }, () => 1).map((_, index) => (
                        <span
                            key={index + 10}
                            onMouseEnter={() => setHoverInfo(`Can hold ${gapCoins} coins more`)}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        ><InventoryIcon material={'COIN'} nation={nation} inline missing /></span>
                    ))}
                </ItemContainer>
            </Field>

            <ButtonRow>
                {house.promotionsEnabled ?
                    <Button
                        onClick={() => { api.disablePromotionsForHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Disable promotions')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='COIN' />
                    </Button>
                    :
                    <Button
                        onClick={() => { api.enablePromotionsForHouse(house.id) }}
                        onMouseEnter={() => setHoverInfo('Enable promotions')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='COIN_CROSSED_OUT' />
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
                    >
                        <UiIcon type='SEND_OUT_ARROWS' />
                    </Button>
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


                <Button onClick={() => {
                    api.removeBuilding(house.id)

                    onClose()
                }}
                    onMouseEnter={() => setHoverInfo('Tear down')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='DESTROY_BUILDING' />
                </Button>
                <Button
                    onClick={() => {
                        goToPoint(house)
                    }}
                    onMouseEnter={() => setHoverInfo(`Go to the ${buildingPretty(house.type).toLowerCase()}`)}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='GO_TO_POINT' />
                </Button>

            </ButtonRow>
        </Window>
    )
}

export { MilitaryBuilding }