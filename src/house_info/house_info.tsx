import React, { useEffect, useState } from 'react'
import { Button } from "@fluentui/react-components"
import { GameId, HouseInformation, Nation, PlayerId } from "../api/types"
import { HouseIcon, InventoryIcon } from "../icon"
import './house_info.css'
import { HeadquarterInfo } from "./headquarter"
import { attackBuilding, getHouseInformationWithAttackPossibility, houseIsReady, isMaterialUpperCase, isMilitaryBuilding, pauseProductionForHouse, removeHouse, resumeProductionForHouse } from "../api/rest-api"
import { MilitaryBuilding } from "./military_building"
import { listenToHouse, monitor } from '../api/ws-api'

interface HouseInfoProps {
    house: HouseInformation
    selfPlayerId: PlayerId
    gameId: GameId
    nation: Nation
    onClose: (() => void)
}

const HouseInfo = (props: HouseInfoProps) => {

    const [house, setHouse] = useState<HouseInformation>(props.house)

    const selfPlayerId = props.selfPlayerId
    const nation = props.nation
    const gameId = props.gameId

    const onClose = props.onClose

    const ownHouse = (house.playerId === selfPlayerId)

    useEffect(() => {

        // Start monitoring when the component is mounted
        listenToHouse(house.id, (house: HouseInformation) => setHouse(house))

        monitor.addDetailedMonitoring(house.id)

        // Stop monitoring when the component is unmounted
        return () => monitor.removeDetailedMonitoring(house.id)

        // Only change detailed monitoring if the house id changes
    }, [house.id])

    return (
        <>
            {ownHouse && house.type === 'Headquarter' &&
                <HeadquarterInfo house={house} nation={nation} onClose={onClose} />
            }

            {ownHouse && house.state === 'PLANNED' &&
                <PlannedHouseInfo house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} />
            }

            {ownHouse && house.state === 'UNFINISHED' &&
                <UnfinishedHouseInfo house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} />
            }

            {ownHouse && house.type !== 'Headquarter' && houseIsReady(house) && isMilitaryBuilding(house) &&
                <MilitaryBuilding house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} />
            }

            {ownHouse && (house.state === 'OCCUPIED' || house.state === 'UNOCCUPIED') && !isMilitaryBuilding(house) &&
                <ProductionBuilding house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} />
            }

            {!ownHouse && !isMilitaryBuilding(house) &&
                <EnemyHouseInfo house={house} nation={nation} onClose={onClose} />
            }

            {!ownHouse && isMilitaryBuilding(house) &&
                <MilitaryEnemyHouseInfo house={house} gameId={gameId} selfPlayerId={selfPlayerId} nation={nation} onClose={onClose} />
            }
        </>
    )
}

interface PlannedHouseInfoProps {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onClose: (() => void)
}

const PlannedHouseInfo = ({ house, playerId, gameId, nation, onClose }: PlannedHouseInfoProps) => {
    return (
        <div className="house-info">

            <h1>Planned {house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} />

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >Destroy</Button>
            <Button onClick={onClose} >Close</Button>
        </div>
    )
}

interface EnemyHouseInfoProps {
    house: HouseInformation
    nation: Nation

    onClose: (() => void)
}

const EnemyHouseInfo = ({ house, nation, onClose }: EnemyHouseInfoProps) => {
    return (
        <div className="house-info">

            <h1>Enemy building: {house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} />
            <Button onClick={onClose} >Close</Button>
        </div>
    )
}

interface MilitaryEnemyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    selfPlayerId: PlayerId
    nation: Nation

    onClose: (() => void)
}

const MilitaryEnemyHouseInfo = ({ house, gameId, selfPlayerId, nation, onClose }: MilitaryEnemyHouseInfoProps) => {

    const [availableAttackers, setAvailableAttackers] = useState<number>(0)
    const [chosenAttackers, setChosenAttackers] = useState<number>(0)

    useEffect(() => {
        (async () => {
            const houseAttackInformation = await getHouseInformationWithAttackPossibility(
                house.id,
                gameId,
                house.playerId,
                selfPlayerId
            )

            setAvailableAttackers(houseAttackInformation.maxAttackers ?? 0)

            // TODO: run periodically, add cleanup, add dependency

        })()
    }, [])

    return (
        <div className="house-info">

            <h1>Military enemy building: {house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} />

            {availableAttackers === 0 && <div>No attack possible</div>}

            {availableAttackers !== 0 &&
                <div>
                    Attack
                    <div>Attackers: ({chosenAttackers}/{availableAttackers})</div>
                    <Button onClick={() => setChosenAttackers(Math.max(chosenAttackers - 1, 0))}>Fewer</Button>
                    <Button onClick={() => setChosenAttackers(Math.min(chosenAttackers + 1, availableAttackers))}>More</Button>
                    <Button onClick={() => attackBuilding(house, chosenAttackers, gameId, selfPlayerId)}>Attack</Button>
                </div>
            }
            <Button onClick={onClose} >Close</Button>
        </div>
    )
}

interface UnfinishedHouseInfo {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onClose: (() => void)
}

const UnfinishedHouseInfo = ({ house, playerId, gameId, nation, onClose }: UnfinishedHouseInfo) => {
    return (
        <div className="house-info">

            <h1>{house.type} under construction</h1>

            <HouseIcon houseType={house.type} nation={nation} />

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >Destroy</Button>
            <Button onClick={onClose} >Close</Button>
        </div>
    )
}

interface ProductionBuildingProps {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onClose: (() => void)
}

const ProductionBuilding = ({ house, playerId, gameId, nation, onClose }: ProductionBuildingProps) => {
    const producedMaterial = house.produces

    return (
        <div className="house-info">

            <h1>{house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} />

            <div className="production-info">

                <div>Productivity: {house.productivity}</div>

                {!house.productionEnabled && <div>Production disabled</div>}

                {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined).length > 0 &&
                    <div>Needs:
                        {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined)
                            .map(material => {

                                if (isMaterialUpperCase(material)) {
                                    const has = house.resources[material].has ?? 0
                                    const canHold = house.resources[material].canHold ?? 0
                                    const gap = Math.max(canHold - has, 0)

                                    return <>
                                        {Array.from({ length: gap }, () => 1).map(
                                            (value, index) => <InventoryIcon material={material} nation={nation} key={index} inline />)
                                        }
                                    </>
                                }
                            })
                        }
                    </div>
                }

                {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].has !== undefined).length > 0 &&
                    <div> Has:
                        {Object.keys(house.resources).filter(material => isMaterialUpperCase(material))
                            .map(material => {

                                if (isMaterialUpperCase(material)) {
                                    return <>
                                        {Array.from({ length: house.resources[material].has ?? 0 }, () => 1).map(
                                            (value, index) => <InventoryIcon material={material} nation={nation} key={index} inline />)
                                        }
                                    </>
                                }
                            })
                        }
                    </div>
                }


                {producedMaterial &&
                    <div>Produces: <InventoryIcon material={producedMaterial} nation={nation} inline /></div>
                }

            </div>

            {
                house.productionEnabled &&
                <Button onClick={() => pauseProductionForHouse(gameId, playerId, house.id)} >Pause production</Button>
            }

            {
                !house.productionEnabled &&
                <Button onClick={() => resumeProductionForHouse(gameId, playerId, house.id)} >Resume production</Button>
            }

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >Destroy</Button>
            <Button onClick={() => { onClose() }} >Close</Button>
        </div >
    )
}

export {
    HouseInfo
}