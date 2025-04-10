import React, { useEffect, useState } from 'react'
import { Button, Field } from '@fluentui/react-components'
import { PauseRegular, PlayRegular } from '@fluentui/react-icons'
import { AttackType, HouseInformation, Nation, PlayerId, isMaterial } from '../../api/types'
import { HouseIcon, InventoryIcon, UiIcon } from '../../icons/icon'
import './house_info.css'
import { HeadquarterInfo } from './headquarter'
import { MilitaryBuilding } from './military_building'
import { api } from '../../api/ws-api'
import { ButtonRow, Window } from '../../components/dialog'
import { houseIsReady, isMilitaryBuilding } from '../../api/utils'
import { buildingPretty, MATERIAL_FIRST_UPPERCASE, materialPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'

// Types
type HouseInfoProps = {
    house: HouseInformation
    selfPlayerId: PlayerId
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type PlannedHouseInfoProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type EnemyHouseInfoProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type MilitaryEnemyHouseInfoProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type UnfinishedHouseInfo = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

type ProductionBuildingProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
}

// React components
const HouseInfo = ({ selfPlayerId, nation, onClose, onRaise, ...props }: HouseInfoProps) => {
    const [house, setHouse] = useState<HouseInformation>(props.house)

    const isOwnHouse = (house.playerId === selfPlayerId)

    useEffect(() => {
        const houseListener = (house: HouseInformation) => setHouse(house)
        api.addHouseListener(house.id, houseListener)

        return () => api.removeHouseListener(house.id, houseListener)
    }, [house.id])

    return (
        <>
            {isOwnHouse && house.type === 'Headquarter' &&
                <HeadquarterInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.state === 'PLANNED' &&
                <PlannedHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.state === 'UNFINISHED' &&
                <UnfinishedHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.type !== 'Headquarter' && houseIsReady(house) && isMilitaryBuilding(house) &&
                <MilitaryBuilding house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && (house.state === 'OCCUPIED' || house.state === 'UNOCCUPIED') && !isMilitaryBuilding(house) &&
                <ProductionBuilding house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {!isOwnHouse && !isMilitaryBuilding(house) &&
                <EnemyHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {!isOwnHouse && isMilitaryBuilding(house) &&
                <MilitaryEnemyHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }
        </>
    )
}

const PlannedHouseInfo = ({ house, nation, onClose, onRaise }: PlannedHouseInfoProps) => {
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window
            className='house-info'
            heading={`Planned ${buildingPretty(house.type)}`}
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
        >
            <HouseIcon
                houseType={house.type}
                nation={nation}
                drawShadow
                onMouseEnter={() => setHoverInfo(`Planned ${house.type}`)}
                onMouseLeave={() => setHoverInfo(undefined)}
            />
            <Button
                onClick={() => {
                    api.removeBuilding(house.id)

                    onClose()
                }}
                onMouseEnter={() => setHoverInfo('Tear down')}
                onMouseLeave={() => setHoverInfo(undefined)}
            >
                <UiIcon type='DESTROY_BUILDING' />
            </Button>
        </Window>
    )
}

const EnemyHouseInfo = ({ house, nation, onClose, onRaise }: EnemyHouseInfoProps) => {
    return (
        <Window
            className='house-info'
            onClose={onClose}
            heading={`Enemy building: ${buildingPretty(house.type)}`}
            onRaise={onRaise}
        >
            <HouseIcon houseType={house.type} nation={nation} drawShadow />
        </Window>
    )
}

const MilitaryEnemyHouseInfo = ({ house, nation, onClose, onRaise }: MilitaryEnemyHouseInfoProps) => {
    const [chosenAttackers, setChosenAttackers] = useState<number>(0)
    const [attackType, setAttackType] = useState<AttackType>('STRONG')

    const availableAttackers = house.availableAttackers ?? 0

    return (
        <Window
            className='house-info'
            onClose={onClose}
            heading={`Military enemy building: ${buildingPretty(house.type)}`}
            onRaise={onRaise}
        >
            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            {house.availableAttackers === 0 && <div>No attack possible</div>}

            {house.availableAttackers !== 0 &&
                <div>
                    Attack
                    <Field label='Number of attackers'>
                        <div>
                            <div>Attackers: ({chosenAttackers}/{house.availableAttackers})</div>
                            <Button onClick={() => setChosenAttackers(Math.max(chosenAttackers - 1, 0))}>Fewer</Button>
                            <Button onClick={() => setChosenAttackers(Math.min(chosenAttackers + 1, availableAttackers))}>More</Button>
                        </div>
                    </Field>
                    <Field label='Weak or strong attackers'>
                        <div>
                            <Button onClick={() => setAttackType('WEAK')}>Weaker</Button>
                            <Button onClick={() => setAttackType('STRONG')}>Stronger</Button>
                        </div>
                    </Field>
                    <Button onClick={() => {
                        api.attackHouse(house.id, chosenAttackers, attackType)

                        onClose()
                    }}>Attack</Button>
                </div>
            }
        </Window>
    )
}

const UnfinishedHouseInfo = ({ house, nation, onClose, onRaise }: UnfinishedHouseInfo) => {
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window
            className='house-info'
            heading={`${buildingPretty(house.type)}`}
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
        >
            <HouseIcon
                houseType={house.type}
                nation={nation}
                drawShadow
                onMouseEnter={() => setHoverInfo(buildingPretty(house.type))}
                onMouseLeave={() => setHoverInfo(undefined)} />
            <div>Under construction ...</div>
            <meter
                max={100}
                value={house.constructionProgress}
                onMouseEnter={() => setHoverInfo(`${house.constructionProgress} / 100`)}
                onMouseLeave={() => setHoverInfo(undefined)} />

            {Object.keys(house.resources)
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

                                    return <div key={material}>
                                        {Array.from({ length: has }, () => 1).map((value, index) => (
                                            <span key={index}><InventoryIcon
                                                material={material}
                                                nation={nation}
                                                key={index}
                                                inline
                                                onMouseEnter={() => setHoverInfo(materialPretty(material))}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            /></span>
                                        ))}
                                        {Array.from({ length: gap }, () => 1).map((value, index) => (
                                            <span key={index + 10}><InventoryIcon
                                                material={material}
                                                nation={nation}
                                                key={index}
                                                inline
                                                missing
                                                onMouseEnter={() => setHoverInfo(materialPretty(material))}
                                                onMouseLeave={() => setHoverInfo(undefined)}
                                            /></span>
                                        ))}
                                    </div>
                                }
                            })
                        }
                    </div>
                </Field>
            }

            <Button
                onClick={() => {
                    api.removeBuilding(house.id)

                    onClose()
                }}
                onMouseEnter={() => setHoverInfo('Tear down')}
                onMouseLeave={() => setHoverInfo(undefined)}
            >
                <UiIcon type='DESTROY_BUILDING' />
            </Button>
        </Window>
    )
}

const ProductionBuilding = ({ house, nation, onClose, onRaise }: ProductionBuildingProps) => {
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window
            className='house-info production-building'
            onClose={onClose}
            heading={buildingPretty(house.type)}
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

            {house.state === 'UNOCCUPIED' && <div>Unoccupied</div>}

            <div className='production-info'>

                <div>Productivity: {house.productivity}</div>

                {!house.productionEnabled && <div>Production disabled</div>}

                {Object.keys(house.resources).filter(material => isMaterial(material) && house.resources[material].canHold !== undefined).length > 0 &&
                    <div>
                        Resources:
                        <ItemContainer padding='0.5em' inline>

                            {Object.keys(house.resources).filter(material => isMaterial(material) && house.resources[material].canHold !== undefined)
                                .map(material => {

                                    if (isMaterial(material)) {
                                        const has = house.resources[material].has ?? 0
                                        const canHold = house.resources[material].canHold ?? 0
                                        const gap = Math.max(canHold - has, 0)

                                        return <div key={material}>
                                            {Array.from({ length: has }, () => 1).map(
                                                (value, index) => <span
                                                    key={index}
                                                    onMouseEnter={() => setHoverInfo(MATERIAL_FIRST_UPPERCASE.get(material))}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <InventoryIcon material={material} nation={nation} key={index} inline />
                                                </span>
                                            )}
                                            {Array.from({ length: gap }, () => 1).map(
                                                (value, index) => <span
                                                    key={index + 10}
                                                    onMouseEnter={() => setHoverInfo(MATERIAL_FIRST_UPPERCASE.get(material))}
                                                    onMouseLeave={() => setHoverInfo(undefined)}
                                                >
                                                    <InventoryIcon material={material} nation={nation} key={index + 10} inline missing />
                                                </span>
                                            )}
                                        </div>
                                    }
                                })
                            }
                        </ItemContainer>
                    </div>
                }

                {house.produces &&
                    <div>Produces:

                        {house.produces.map(producedMaterial => (
                            <div
                                key={producedMaterial}
                                style={{ display: 'inline-block' }}
                                onMouseEnter={() => setHoverInfo(MATERIAL_FIRST_UPPERCASE.get(producedMaterial))}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <span><InventoryIcon material={producedMaterial} nation={nation} inline /></span>
                            </div>
                        ))}
                    </div>
                }

            </div>

            <ButtonRow>
                {house.productionEnabled &&
                    <Button
                        onClick={() => api.pauseProductionForHouse(house.id)}
                        onMouseEnter={() => setHoverInfo('Pause production')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    ><PauseRegular />
                    </Button>
                }

                {!house.productionEnabled &&
                    <Button
                        onClick={() => api.resumeProductionForHouse(house.id)}
                        onMouseEnter={() => setHoverInfo('Resume production')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <PlayRegular />
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
            </ButtonRow>
        </Window >
    )
}

export {
    HouseInfo
}