import React, { useEffect, useState } from 'react'
import { Button, Field, Tooltip } from "@fluentui/react-components"
import { AttackType, GameId, HouseInformation, Nation, PlayerId, isMaterialUpperCase } from "../api/types"
import { HouseIcon, InventoryIcon, UiIcon } from "../icon"
import './house_info.css'
import { HeadquarterInfo } from "./headquarter"
import { attackBuilding, houseIsReady, isMilitaryBuilding, pauseProductionForHouse, removeHouse, resumeProductionForHouse } from "../api/rest-api"
import { MilitaryBuilding } from "./military_building"
import { monitor } from '../api/ws-api'

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
        monitor.listenToHouse(house.id, (house: HouseInformation) => setHouse(house))

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

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >
                <UiIcon type='DESTROY_BUILDING' />
                Destroy
            </Button>
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

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

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
    const [chosenAttackers, setChosenAttackers] = useState<number>(0)
    const [attackType, setAttackType] = useState<AttackType>('STRONG')

    const availableAttackers = house.availableAttackers ?? 0

    return (
        <div className="house-info">

            <h1>Military enemy building: {house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            {house.availableAttackers === 0 && <div>No attack possible</div>}

            {house.availableAttackers !== 0 &&
                <div>
                    Attack
                    <Field label="Number of attackers">
                        <div>
                            <div>Attackers: ({chosenAttackers}/{house.availableAttackers})</div>
                            <Button onClick={() => setChosenAttackers(Math.max(chosenAttackers - 1, 0))}>Fewer</Button>
                            <Button onClick={() => setChosenAttackers(Math.min(chosenAttackers + 1, availableAttackers))}>More</Button>
                        </div>
                    </Field>
                    <Field label="Weak or strong attackers">
                        <div>
                            <Button onClick={() => setAttackType('WEAK')}>Weaker</Button>
                            <Button onClick={() => setAttackType('STRONG')}>Stronger</Button>
                        </div>
                    </Field>
                    <Button onClick={() => {
                        attackBuilding(house, chosenAttackers, attackType, gameId, selfPlayerId)

                        onClose()
                    }
                    }>Attack</Button>
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

            <h1>{house.type}</h1>

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            <div>Under construction ...</div>
            <meter max={100} value={house.constructionProgress} />

            {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined).length > 0 &&
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
                                                <span><InventoryIcon material={material} nation={nation} key={index} inline /></span>
                                            </Tooltip>
                                        )}
                                        {Array.from({ length: gap }, () => 1).map(
                                            (value, index) => <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow key={index}>
                                                <span><InventoryIcon material={material} nation={nation} key={index} inline missing /></span>
                                            </Tooltip>
                                        )}
                                    </div>
                                }
                            })
                        }
                    </div>
                </Field>
            }

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >
                <UiIcon type='DESTROY_BUILDING' />
                Destroy
            </Button>
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

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            <div className="production-info">

                <div>Productivity: {house.productivity}</div>

                {!house.productionEnabled && <div>Production disabled</div>}

                {Object.keys(house.resources).filter(material => isMaterialUpperCase(material) && house.resources[material].canHold !== undefined).length > 0 &&
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
                                                    <span><InventoryIcon material={material} nation={nation} key={index} inline /></span>
                                                </Tooltip>
                                            )}
                                            {Array.from({ length: gap }, () => 1).map(
                                                (value, index) => <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow key={index}>
                                                    <span><InventoryIcon material={material} nation={nation} key={index + 10} inline missing /></span>
                                                </Tooltip>
                                            )}
                                        </div>
                                    }
                                })
                            }
                        </div>
                    </Field>
                }

                {producedMaterial &&
                    <div>Produces: <Tooltip content={producedMaterial} relationship='label' withArrow >
                        <span><InventoryIcon material={producedMaterial} nation={nation} inline /></span>
                    </Tooltip></div>
                }

            </div>

            {house.productionEnabled &&
                <Button onClick={() => pauseProductionForHouse(gameId, playerId, house.id)} >Pause production</Button>
            }

            {!house.productionEnabled &&
                <Button onClick={() => resumeProductionForHouse(gameId, playerId, house.id)} >Resume production</Button>
            }

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >
                <UiIcon type='DESTROY_BUILDING' />
                Destroy
            </Button>


            <Button onClick={() => { onClose() }} >Close</Button>
        </div >
    )
}

export {
    HouseInfo
}