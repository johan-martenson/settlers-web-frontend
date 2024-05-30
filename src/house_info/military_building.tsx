import React from 'react'
import { Button, Field, Tooltip } from "@fluentui/react-components"
import { Dismiss16Filled, ExpandUpRight24Filled } from '@fluentui/react-icons'
import { GameId, HouseInformation, Nation, PlayerId, SoldierType, getSoldierDisplayName, isMaterialUpperCase, rankToMaterial } from "../api/types"
import { HouseIcon, InventoryIcon, UiIcon } from "../icon"
import './house_info.css'
import { canBeUpgraded, cancelEvacuationForHouse, disablePromotionsForHouse, enablePromotionsForHouse, evacuateHouse, isEvacuated, removeHouse } from "../api/rest-api"
import { monitor } from '../api/ws-api'
import { Window } from '../components/dialog'

interface MilitaryBuildingProps {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onClose: (() => void)
}

const MilitaryBuilding = ({ house, playerId, gameId, nation, onClose }: MilitaryBuildingProps) => {
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

    // TODO: show resources when upgrading. Show text "is upgrading..."

    return (
        <Window className="house-info" heading={house.type} onClose={onClose}>

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            {house.upgrading && <div>Upgrading ...</div>}

            {house.upgrading &&
                Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined).length > 0 &&
                <Field label="Resources">
                    <div>
                        {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined)
                            .map(material => {

                                if (isMaterialUpperCase(material)) {
                                    const has = house.resources[material].has ?? 0
                                    const canHold = house.resources[material].canHold ?? 0
                                    const gap = Math.max(canHold - has, 0)

                                    return <div key={material}>
                                        {Array.from({ length: has }, () => 1).map(
                                            (value, index) => <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow key={index}>
                                                <span><InventoryIcon material={material} nation={nation} inline /></span>
                                            </Tooltip>
                                        )}
                                        {Array.from({ length: gap }, () => 1).map(
                                            (value, index) => <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow key={index}>
                                                <span><InventoryIcon material={material} nation={nation} inline missing /></span>
                                            </Tooltip>
                                        )}
                                    </div>
                                }
                            })
                        }
                    </div>
                </Field>
            }

            <Field label="Soldiers" >
                <div>
                    {soldiers.map(
                        (rank, index) => {
                            if (rank) {
                                const soldierDisplayName = getSoldierDisplayName(rank)
                                const soldierMaterial = rankToMaterial(rank)

                                console.log(soldierDisplayName)

                                return (
                                    <Tooltip content={soldierDisplayName} relationship='label' withArrow key={index} >
                                        <div style={{ display: 'inline' }}><InventoryIcon material={soldierMaterial} nation={nation} key={index} inline /></div>
                                    </Tooltip>
                                )
                            } else {
                                return (
                                    <Tooltip content="Open space for additional soldier" relationship='label' withArrow key={index} >
                                        <div style={{ display: 'inline' }}><InventoryIcon material={'PRIVATE'} nation={nation} key={index} inline missing /></div>
                                    </Tooltip>
                                )
                            }
                        }
                    )}
                </div>
            </Field>

            <Field label="Coins">
                <div>
                    {Array.from({ length: hasCoins }, () => 1).map(
                        (value, index) => <Tooltip content="Coin" relationship={'label'} withArrow key={index}>
                            <span><InventoryIcon material={'COIN'} nation={nation} inline /></span>
                        </Tooltip>
                    )}
                    {Array.from({ length: gapCoins }, () => 1).map(
                        (value, index) => <Tooltip content="Coin" relationship={'label'} withArrow key={index}>
                            <span><InventoryIcon material={'COIN'} nation={nation} inline missing /></span>
                        </Tooltip>
                    )}
                </div>
            </Field>

            <div className='building-button-row'>
                {house.promotionsEnabled &&
                    <Button onClick={() => { disablePromotionsForHouse(gameId, playerId, house.id) }} >Disable<br />promotions</Button>
                }

                {!house.promotionsEnabled &&
                    <Button onClick={() => { enablePromotionsForHouse(gameId, playerId, house.id) }} >Enable<br />promotions</Button>
                }

                {isEvacuated(house) &&
                    <Button onClick={() => { cancelEvacuationForHouse(gameId, playerId, house.id) }} >Cancel<br />evacuation</Button>
                }

                {!isEvacuated(house) &&
                    <Button onClick={() => { evacuateHouse(gameId, playerId, house.id) }} >Evacuate</Button>
                }

                {canBeUpgraded(house) && !house.upgrading &&
                    <Button onClick={() => monitor.upgrade(house.id)} >
                        <ExpandUpRight24Filled />
                    </Button>
                }


                <Tooltip content={'Remove'} relationship='label' withArrow>
                    <Button onClick={() => {
                        removeHouse(house.id, playerId, gameId)

                        onClose()
                    }}
                    >
                        <UiIcon type='DESTROY_BUILDING' />
                    </Button>
                </Tooltip>

            </div>

            <Button onClick={onClose} >
                <Dismiss16Filled />
            </Button>
        </Window>
    )
}

export { MilitaryBuilding }