import React, { useMemo, useState } from 'react'
import { Button, Field } from '@fluentui/react-components'
import { AttackType, HouseInformation, Material, Nation, PlayerId, Point, isMaterial } from '../../api/types'
import './house_info.css'
import { HeadquarterInfo } from './headquarter'
import { MilitaryBuilding } from './military_building'
import { api } from '../../api/ws-api'
import { ButtonRow, WindowWithTyping } from '../../components/dialog'
import { houseIsReady, isMilitaryBuilding } from '../../api/utils'
import { ItemContainer } from '../../components/item_container'
import { useHouse } from '../../utils/hooks/hooks'
import { Dismiss16Filled } from '@fluentui/react-icons'
import { GenericCommand } from '../../utils/typing-commands'
import { buildingPretty, MATERIAL_FIRST_UPPERCASE, materialPretty } from '../../utils/pretty_strings'
import { HouseIcon, InventoryIcon, UiIcon } from '../../components/icons/icon'

// Types
type HouseInfoProps = {
    house: HouseInformation
    selfPlayerId: PlayerId
    nation: Nation
    onRaise: () => void
    onClose: () => void
    goToPoint: (point: Point) => void
}

type PlannedHouseInfoProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
    goToPoint: (point: Point) => void
}

type EnemyHouseInfoProps = {
    house: HouseInformation
    nation: Nation
    onRaise: () => void
    onClose: () => void
    goToPoint: (point: Point) => void
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
    goToPoint: (point: Point) => void
}

type ResourceDisplayProps = {
    house: HouseInformation
    nation: Nation
    setHoverInfo?: (text?: string) => void
    inline?: boolean
    padding?: string
}

// React components
export const ResourceDisplay = ({
    house,
    nation,
    setHoverInfo,
    inline,
    padding
}: ResourceDisplayProps) => {

    // Rendering
    const materials = Object.keys(house.resources)
        .filter((m): m is Material => isMaterial(m) && house.resources[m]?.canHold !== undefined)

    if (materials.length === 0) {
        return null
    }

    return (
        <ItemContainer padding={padding} inline={inline}>
            {materials.map(material => {
                const has = house.resources[material]?.has ?? 0
                const canHold = house.resources[material]?.canHold ?? 0
                const gap = Math.max(canHold - has, 0)

                return (
                    <div key={material}>
                        {Array.from({ length: has }).map((_, index) => (
                            <span
                                key={`${material}-has-${index}`}
                                onMouseEnter={() => setHoverInfo?.(materialPretty(material))}
                                onMouseLeave={() => setHoverInfo?.(undefined)}
                            >
                                <InventoryIcon
                                    material={material}
                                    nation={nation}
                                    inline
                                />
                            </span>
                        ))}

                        {Array.from({ length: gap }).map((_, index) => (
                            <span
                                key={`${material}-missing-${index}`}
                                onMouseEnter={() => setHoverInfo?.(materialPretty(material))}
                                onMouseLeave={() => setHoverInfo?.(undefined)}
                            >
                                <InventoryIcon
                                    material={material}
                                    nation={nation}
                                    inline
                                    missing
                                />
                            </span>
                        ))}
                    </div>
                )
            })}
        </ItemContainer>
    )
}

const HouseInfo = ({ selfPlayerId, nation, goToPoint, onClose, onRaise, ...props }: HouseInfoProps) => {

    // Monitoring hooks
    const house = useHouse(props.house.id)

    // Rendering
    const isOwnHouse = (house?.playerId === selfPlayerId)

    if (house === undefined) {
        console.error(`House window: house ${props.house.id} is undefined`)

        return null
    }

    return (
        <div>
            {isOwnHouse && house.type === 'Headquarter' &&
                <HeadquarterInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.state === 'PLANNED' &&
                <PlannedHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} goToPoint={goToPoint} />
            }

            {isOwnHouse && house.state === 'UNFINISHED' &&
                <UnfinishedHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }

            {isOwnHouse && house.type !== 'Headquarter' && houseIsReady(house) && isMilitaryBuilding(house) &&
                <MilitaryBuilding house={house} nation={nation} onClose={onClose} onRaise={onRaise} goToPoint={goToPoint} />
            }

            {isOwnHouse && (house.state === 'OCCUPIED' || house.state === 'UNOCCUPIED') && !isMilitaryBuilding(house) &&
                <ProductionBuilding house={house} nation={nation} onClose={onClose} onRaise={onRaise} goToPoint={goToPoint} />
            }

            {!isOwnHouse && !isMilitaryBuilding(house) &&
                <EnemyHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} goToPoint={goToPoint} />
            }

            {!isOwnHouse && isMilitaryBuilding(house) &&
                <MilitaryEnemyHouseInfo house={house} nation={nation} onClose={onClose} onRaise={onRaise} />
            }
        </div>
    )
}

const PlannedHouseInfo = ({ house, nation, onClose, onRaise, goToPoint }: PlannedHouseInfoProps) => {

    // State
    const [hoverInfo, setHoverInfo] = useState<string>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('go to house', {
            action: (house: HouseInformation) => goToPoint(house),
            icon: <UiIcon type='GO_TO_POINT' scale={0.5} />
        })

        cmds.set('tear down', {
            action: (house: HouseInformation) => {
                api.removeBuilding(house.id)
                onClose()
            },
            icon: <UiIcon type='DESTROY_BUILDING' scale={0.5} />
        })

        cmds.set('close window', {
            action: () => onClose(),
            icon: <Dismiss16Filled />
        })

        cmds.set('debug', {
            action: (house: HouseInformation) => console.log(house)
        })

        return cmds
    }, [onClose, goToPoint])

    // Rendering
    return (
        <WindowWithTyping<HouseInformation>
            commands={commands}
            className='house-info'
            heading={`Planned ${buildingPretty(house.type)}`}
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
            param={house}
        >
            <HouseIcon
                houseType={house.type}
                nation={nation}
                drawShadow
                onMouseEnter={() => setHoverInfo(`Planned ${house.type}`)}
                onMouseLeave={() => setHoverInfo(undefined)}
            />
            <ButtonRow>
                <Button
                    onClick={() => {
                        api.removeBuilding(house.id)

                        onClose()
                    }}
                    onMouseEnter={() => setHoverInfo('Tear down')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='DESTROY_BUILDING' scale={0.5} />
                </Button>
                <Button
                    onClick={() => {
                        goToPoint(house)
                    }}
                    onMouseEnter={() => setHoverInfo('Go to house')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='GO_TO_POINT' scale={0.5} />
                </Button>

            </ButtonRow>
        </WindowWithTyping>
    )
}

const EnemyHouseInfo = ({ house, nation, onClose, onRaise, goToPoint }: EnemyHouseInfoProps) => {

    // State
    const [hoverInfo, setHoverInfo] = useState<string>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('go to building', {
            action: (house: HouseInformation) => goToPoint(house),
            filter: (house: HouseInformation) => houseIsReady(house)
        })

        cmds.set('close window', {
            action: () => onClose()
        })

        cmds.set('debug', {
            action: (house: HouseInformation) => console.log(house),
            hidden: true
        })

        return cmds
    }, [onClose, goToPoint])

    // Rendering
    return (
        <WindowWithTyping<HouseInformation>
            commands={commands}
            className='house-info'
            onClose={onClose}
            heading={`Enemy building: ${buildingPretty(house.type)}`}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
            param={house}
        >
            <HouseIcon houseType={house.type} nation={nation} drawShadow />
            <Button
                onClick={() => goToPoint(house)}
                onMouseEnter={() => setHoverInfo('Go to house')}
                onMouseLeave={() => setHoverInfo(undefined)}
            >
                <UiIcon type='GO_TO_POINT' scale={0.5} />
            </Button>
        </WindowWithTyping>
    )
}

const MilitaryEnemyHouseInfo = ({ house, nation, onClose, onRaise }: MilitaryEnemyHouseInfoProps) => {

    // State
    const [chosenAttackers, setChosenAttackers] = useState<number>(1)
    const [attackType, setAttackType] = useState<AttackType>('STRONG')
    const [hoverInfo, setHoverInfo] = useState<string>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('attack', {
            action: (house: HouseInformation) => api.attackHouse(house.id, chosenAttackers, attackType),
            filter: (house: HouseInformation) => isMilitaryBuilding(house) && house.availableAttackers !== undefined && house.availableAttackers > 0
        })

        cmds.set('weaker attackers', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_house: HouseInformation) => setAttackType('WEAK'),
            filter: (house: HouseInformation) => isMilitaryBuilding(house) && house.availableAttackers !== undefined && house.availableAttackers > 0 && attackType !== 'WEAK'
        })

        cmds.set('stronger attackers', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_house: HouseInformation) => setAttackType('STRONG'),
            filter: (house: HouseInformation) => isMilitaryBuilding(house) && house.availableAttackers !== undefined && house.availableAttackers > 0 && attackType !== 'STRONG'
        })

        cmds.set('more attackers', {
            action: (house: HouseInformation) => setChosenAttackers(Math.min(chosenAttackers + 1, house.availableAttackers ?? 0)),
            filter: (house: HouseInformation) => isMilitaryBuilding(house) && house.availableAttackers !== undefined && chosenAttackers < (house.availableAttackers ?? 0)
        })

        cmds.set('fewer attackers', {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: (_house: HouseInformation) => setChosenAttackers(Math.max(chosenAttackers - 1, 1)),
            filter: (house: HouseInformation) => isMilitaryBuilding(house) && house.availableAttackers !== undefined && chosenAttackers > 1
        })

        cmds.set('close window', {
            action: () => onClose()
        })

        return cmds
    }, [chosenAttackers, attackType, onClose])

    // Rendering
    const availableAttackers = house.availableAttackers ?? 0

    return (
        <WindowWithTyping<HouseInformation>
            commands={commands}
            className='house-info'
            onClose={onClose}
            heading={`Enemy ${buildingPretty(house.type)}`}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
            param={house}
        >
            <HouseIcon houseType={house.type} nation={nation} drawShadow />

            {house.availableAttackers === 0 && <div>No attack possible</div>}

            {house.availableAttackers !== 0 &&
                <div>
                    Attack
                    <div>
                        <div>Attackers: ({chosenAttackers}/{house.availableAttackers})</div>
                        <ButtonRow>
                            <Button
                                onClick={() => setChosenAttackers(Math.max(chosenAttackers - 1, 1))}
                                onMouseEnter={() => setHoverInfo('Fewer attackers')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='ONE_YELLOW_SHIELD' scale={0.5} />
                            </Button>
                            <Button
                                onClick={() => setChosenAttackers(Math.min(chosenAttackers + 1, availableAttackers))}
                                onMouseEnter={() => setHoverInfo('More attackers')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='FIVE_YELLOW_SHIELDS' scale={0.5} />
                            </Button>
                            <Button
                                style={{ backgroundColor: attackType === 'WEAK' ? 'lightblue' : undefined }}
                                onClick={() => setAttackType('WEAK')}
                                onMouseEnter={() => setHoverInfo('Weaker attackers')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='ROMAN_PRIVATE' scale={0.5} />
                            </Button>
                            <Button
                                style={{ backgroundColor: attackType === 'STRONG' ? 'lightblue' : undefined }}
                                onClick={() => setAttackType('STRONG')}
                                onMouseEnter={() => setHoverInfo('Stronger attackers')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='ROMAN_GENERAL' scale={0.5} />
                            </Button>
                        </ButtonRow>
                    </div>
                    <Button
                        onClick={() => {
                            api.attackHouse(house.id, chosenAttackers, attackType)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Launch attack')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='TWO_SWORDS' scale={0.5} />
                    </Button>
                </div>
            }
        </WindowWithTyping>
    )
}

const UnfinishedHouseInfo = ({ house, nation, onClose, onRaise }: UnfinishedHouseInfo) => {

    // State
    const [hoverInfo, setHoverInfo] = useState<string>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('tear down', {
            action: (house: HouseInformation) => {
                api.removeBuilding(house.id)
                onClose()
            },
            icon: <UiIcon type='DESTROY_BUILDING' scale={0.5} />
        })

        cmds.set('debug', {
            action: () => {
                console.log(house)
            }
        })

        cmds.set('close window', {
            action: () => onClose(),
            icon: <Dismiss16Filled />
        })

        return cmds
    }, [onClose])

    // Rendering
    return (
        <WindowWithTyping
            className='house-info'
            heading={`${buildingPretty(house.type)}`}
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
            commands={commands}
            param={house}
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

            <Field label='Resources'>
                <ResourceDisplay house={house} nation={nation} setHoverInfo={setHoverInfo} />
            </Field>

            <Button
                onClick={() => {
                    api.removeBuilding(house.id)

                    onClose()
                }}
                onMouseEnter={() => setHoverInfo('Tear down')}
                onMouseLeave={() => setHoverInfo(undefined)}
            >
                <UiIcon type='DESTROY_BUILDING' scale={0.5} />
            </Button>
        </WindowWithTyping>
    )
}

const ProductionBuilding = ({ house, nation, goToPoint, onClose, onRaise }: ProductionBuildingProps) => {

    // State
    const [hoverInfo, setHoverInfo] = useState<string>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<HouseInformation>>()

        cmds.set('go to building', {
            action: (house: HouseInformation) => goToPoint(house),
            icon: <UiIcon type='GO_TO_POINT' scale={0.5} />
        })

        cmds.set('pause production', {
            action: (house: HouseInformation) => api.pauseProductionForHouse(house.id),
            filter: (house: HouseInformation) => house.productionEnabled
        })

        cmds.set('resume production', {
            action: (house: HouseInformation) => api.resumeProductionForHouse(house.id),
            filter: (house: HouseInformation) => !house.productionEnabled
        })

        cmds.set('tear down', {
            action: (house: HouseInformation) => {
                api.removeBuilding(house.id)
                onClose()
            },
            icon: <UiIcon type='DESTROY_BUILDING' scale={0.5} />
        })

        cmds.set('debug', {
            action: () => {
                console.log(house)
            },
            hidden: true
        })

        cmds.set('close window', {
            action: () => onClose(),
            icon: <Dismiss16Filled />
        })

        return cmds
    }, [onClose, goToPoint])


    // Rendering
    return (
        <WindowWithTyping<HouseInformation>
            commands={commands}
            param={house}
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

                {house.productionEnabled &&
                    <div
                        onMouseEnter={() => setHoverInfo(`Productivity: ${house.productivity}%`)}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        {house.productivity}%
                    </div>
                }

                {!house.productionEnabled && <div>Production disabled</div>}

                <ResourceDisplay house={house} nation={nation} setHoverInfo={setHoverInfo} />

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
                    >
                        <UiIcon type='GEARS' scale={0.5} />
                    </Button>
                }

                {!house.productionEnabled &&
                    <Button
                        onClick={() => api.resumeProductionForHouse(house.id)}
                        onMouseEnter={() => setHoverInfo('Resume production')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='GEARS_CROSSED_OVER' scale={0.5} />
                    </Button>
                }

                <Button onClick={() => {
                    api.removeBuilding(house.id)
                    onClose()
                }}
                    onMouseEnter={() => setHoverInfo('Tear down')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='DESTROY_BUILDING' scale={0.5} />
                </Button>
                <Button
                    onClick={() => {
                        goToPoint(house)
                    }}
                    onMouseEnter={() => setHoverInfo(`Go to the ${buildingPretty(house.type).toLowerCase()}`)}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='GO_TO_POINT' scale={0.5} />
                </Button>
            </ButtonRow>
        </WindowWithTyping>
    )
}

export {
    HouseInfo
}