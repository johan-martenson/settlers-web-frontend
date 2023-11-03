import React from 'react'
import { Button } from "@fluentui/react-components"
import { GameId, HouseInformation, Nation, PlayerId, SoldierType, rankToMaterial } from "../api/types"
import { HouseIcon, InventoryIcon } from "../icon"
import './house_info.css'
import { canBeUpgraded, cancelEvacuationForHouse, disablePromotionsForHouse, enablePromotionsForHouse, evacuateHouse, isEvacuated, upgradeMilitaryBuilding } from "../api/rest-api"

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

    return (
        <div className="house-info">

            <h1>{house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} />

            <div>Soldiers: {soldiers.map(
                (soldier, index) => {
                    if (soldier) {
                        return <InventoryIcon material={rankToMaterial(soldier)} nation={nation} key={index} inline />
                    } else {
                        return <div key={index}>Empty</div>
                    }
                }
            )}
            </div>

            <div>Gold:
                {Array.from({ length: hasCoins }, () => 1).map(
                    (value, index) => <span className="coin" key={index} />)
                }
                {Array.from({ length: canHoldCoins }, () => 2).map(
                    (value, index) => <span className="coin-missing" key={index} />)
                }
            </div>

            {house.promotionsEnabled &&
                <Button onClick={() => { disablePromotionsForHouse(gameId, playerId, house.id) }} >Disable promotions</Button>
            }

            {!house.promotionsEnabled &&
                <Button onClick={() => { enablePromotionsForHouse(gameId, playerId, house.id) }} >Enable promotions</Button>
            }

            {isEvacuated(house) &&
                <Button onClick={() => { cancelEvacuationForHouse(gameId, playerId, house.id) }} >Cancel evacuation</Button>
            }

            {!isEvacuated(house) &&
                <Button onClick={() => { evacuateHouse(gameId, playerId, house.id) }} >Evacuate</Button>
            }

            {canBeUpgraded(house) && !house.upgrading &&
                <Button onClick={() => upgradeMilitaryBuilding(gameId, playerId, house.id)} >Upgrade</Button>
            }

            <Button onClick={onClose} >Close</Button>
        </div>
    )
}

export { MilitaryBuilding }