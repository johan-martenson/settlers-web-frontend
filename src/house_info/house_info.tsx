import React, { useEffect, useState } from 'react'
import { Button, Field, Tooltip } from "@fluentui/react-components"
import { PauseRegular, PlayRegular } from '@fluentui/react-icons'
import { AttackType, GameId, HouseInformation, Nation, PlayerId, isMaterialUpperCase } from "../api/types"
import { HouseIcon, InventoryIcon, UiIcon } from "../icon"
import './house_info.css'
import { HeadquarterInfo } from "./headquarter"
import { attackBuilding, houseIsReady, isMilitaryBuilding, pauseProductionForHouse, removeHouse, resumeProductionForHouse } from "../api/rest-api"
import { MilitaryBuilding } from "./military_building"
import { monitor } from '../api/ws-api'
import { Window } from '../components/dialog'

interface HouseInfoProps {
    house: HouseInformation
    selfPlayerId: PlayerId
    gameId: GameId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const HouseInfo = ({ selfPlayerId, nation, gameId, onClose, onRaise, ...props }: HouseInfoProps) => {
    const [house, setHouse] = useState<HouseInformation>(props.house)

    const isOwnHouse = (house.playerId === selfPlayerId)

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
            {isOwnHouse && house.type === 'Headquarter' &&
                <HeadquarterInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.state === 'PLANNED' &&
                <PlannedHouseInfo house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.state === 'UNFINISHED' &&
                <UnfinishedHouseInfo house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.type !== 'Headquarter' && houseIsReady(house) && isMilitaryBuilding(house) &&
                <MilitaryBuilding house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && (house.state === 'OCCUPIED' || house.state === 'UNOCCUPIED') && !isMilitaryBuilding(house) &&
                <ProductionBuilding house={house} gameId={gameId} playerId={selfPlayerId} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {!isOwnHouse && !isMilitaryBuilding(house) &&
                <EnemyHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {!isOwnHouse && isMilitaryBuilding(house) &&
                <MilitaryEnemyHouseInfo house={house} gameId={gameId} selfPlayerId={selfPlayerId} nation={nation} onClose={onClose} onRaise={onRaise} />
            }
        </>
    )
}

interface PlannedHouseInfoProps {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const PlannedHouseInfo = ({ house, playerId, gameId, nation, onClose, onRaise }: PlannedHouseInfoProps) => {
    return (
        <Window className="house-info" heading={'Planned ' + house.type} onClose={onClose} onRaise={onRaise}>

            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            <Button onClick={() => {
                removeHouse(house.id, playerId, gameId)

                onClose()
            }}
            >
                <UiIcon type='DESTROY_BUILDING' />
                Destroy
            </Button>
        </Window>
    )
}

interface EnemyHouseInfoProps {
    house: HouseInformation
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const EnemyHouseInfo = ({ house, nation, onClose, onRaise }: EnemyHouseInfoProps) => {
    return (
        <Window className="house-info" onClose={onClose} heading={`Enemy building: ${house.type}`} onRaise={onRaise}>
            <HouseIcon houseType={house.type} nation={nation} drawShadow />
        </Window>
    )
}

interface MilitaryEnemyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    selfPlayerId: PlayerId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const MilitaryEnemyHouseInfo = ({ house, gameId, selfPlayerId, nation, onClose, onRaise }: MilitaryEnemyHouseInfoProps) => {
    const [chosenAttackers, setChosenAttackers] = useState<number>(0)
    const [attackType, setAttackType] = useState<AttackType>('STRONG')

    const availableAttackers = house.availableAttackers ?? 0

    return (
        <Window className="house-info" onClose={onClose} heading={`Military enemy building: {house.type}`} onRaise={onRaise}>
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
        </Window>
    )
}

interface UnfinishedHouseInfo {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const UnfinishedHouseInfo = ({ house, playerId, gameId, nation, onClose, onRaise }: UnfinishedHouseInfo) => {
    return (
        <Window className="house-info" heading={house.type} onClose={onClose} onRaise={onRaise}>

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
        </Window>
    )
}

interface ProductionBuildingProps {
    house: HouseInformation
    playerId: PlayerId
    gameId: GameId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const ProductionBuilding = ({ house, playerId, gameId, nation, onClose, onRaise }: ProductionBuildingProps) => {
    const producedMaterial = house.produces

    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window className="house-info production-building" onClose={onClose} heading={house.type} hoverInfo={hoverInfo} onRaise={onRaise}>

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
                                                    <span
                                                        onMouseEnter={() => setHoverInfo(material.toLocaleLowerCase())}
                                                        onMouseLeave={() => setHoverInfo(undefined)}
                                                    >
                                                        <InventoryIcon material={material} nation={nation} key={index} inline />
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {Array.from({ length: gap }, () => 1).map(
                                                (value, index) => <Tooltip content={material.toLocaleLowerCase()} relationship='label' withArrow key={index}>
                                                    <span
                                                        onMouseEnter={() => setHoverInfo(material.toLocaleLowerCase())}
                                                        onMouseLeave={() => setHoverInfo(undefined)}
                                                    >
                                                        <InventoryIcon material={material} nation={nation} key={index + 10} inline missing />
                                                    </span>
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
                    <div
                        onMouseEnter={() => setHoverInfo(producedMaterial)}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >Produces: <Tooltip content={producedMaterial} relationship='label' withArrow >
                            <span><InventoryIcon material={producedMaterial} nation={nation} inline /></span>
                        </Tooltip></div>
                }

            </div>

            <div className="building-button-row">
                {house.productionEnabled &&
                    <Tooltip content={'Pause production'} relationship='label' withArrow>
                        <Button
                            onClick={() => pauseProductionForHouse(gameId, playerId, house.id)}
                            onMouseEnter={() => setHoverInfo("Pause production")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        ><PauseRegular />
                        </Button>
                    </Tooltip>
                }

                {!house.productionEnabled &&
                    <Tooltip content={'Resume production'} relationship='label' withArrow>
                        <Button
                            onClick={() => resumeProductionForHouse(gameId, playerId, house.id)}
                            onMouseEnter={() => setHoverInfo("Resume production")}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <PlayRegular />
                        </Button>
                    </Tooltip>
                }

                <Tooltip content={'Remove'} relationship='label' withArrow>
                    <Button onClick={() => {
                        removeHouse(house.id, playerId, gameId)

                        onClose()
                    }}
                        onMouseEnter={() => setHoverInfo("Tear down")}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='DESTROY_BUILDING' />
                    </Button>
                </Tooltip>
            </div>
        </Window >
    )
}

export {
    HouseInfo
}