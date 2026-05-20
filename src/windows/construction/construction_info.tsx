import React, { useCallback, useMemo, useState } from 'react'
import { LARGE_HOUSE_VALUES, MEDIUM_HOUSE_VALUES, Nation, Point, PointInformation, PointInformationWithoutPossibleRoadConnections, SMALL_HOUSE_VALUES, SmallBuilding } from '../../api/types'
import './construction_info.css'
import { ButtonRow, WindowWithTyping } from '../../components/dialog'
import { api } from '../../api/ws-api'
import { canBuildHouse, canBuildLargeHouse, canBuildMediumHouse, canBuildMine, canBuildRoad, canBuildSmallHouse, canRaiseFlag } from '../../utils/utils'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { FlagIcon, HouseIcon, UiIcon } from '../../icons/icon'
import { buildingPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'
import { usePointInformation } from '../../utils/hooks/hooks'
import { GenericCommand } from '../../utils/typing_command_utils'

// Types
type ConstructionInfoProps = {
    point: PointInformation
    nation: Nation
    houseTitlesVisible: boolean
    availableConstructionVisible: boolean

    onSelectPoint: (point: Point) => void
    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
    onStartNewRoad: (point: Point) => void
    onShowHouseTitles: () => void
    onHideHouseTitles: () => void
    onShowAvailableConstruction: () => void
    onHideAvailableConstruction: () => void
}

type SizeLowerCase = 'small' | 'medium' | 'large'

// Constants
const MINES: SmallBuilding[] = ['GoldMine', 'IronMine', 'CoalMine', 'GraniteMine']
const MINES_SET = new Set<SmallBuilding>(MINES)
const SMALL_BUILDINGS_EXCEPT_MINES: SmallBuilding[] = SMALL_HOUSE_VALUES.filter(house => !MINES_SET.has(house))

// TODO: add monitor tab

// React components
const ConstructionInfo = ({
    nation,
    houseTitlesVisible,
    availableConstructionVisible,
    onSelectPoint,
    onStartNewRoad,
    onClose,
    onRaise,
    onStartMonitor,
    onShowHouseTitles,
    onHideHouseTitles,
    onShowAvailableConstruction,
    onHideAvailableConstruction,
    ...props }: ConstructionInfoProps) => {

    // Monitoring hooks
    const point = usePointInformation(props.point)

    // State
    const [selected, setSelected] = useState<'Buildings' | 'FlagsAndRoads' | 'Monitor'>((canBuildHouse(point) || canBuildMine(point)) ? 'Buildings' : 'FlagsAndRoads')
    const [buildingSizeSelected, setBuildingSizeSelected] = useState<SizeLowerCase>('small')
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<PointInformationWithoutPossibleRoadConnections>>()

        cmds.set('Close window', {
            action: () => onClose()
        })

        return cmds
    }, [])

    // Functions
    const raiseFlagAndClose = useCallback(() => {
        console.info('Construction window: raising flag')

        api.placeFlag(point)
        onSelectPoint(point)
        onClose()
    }, [point.x, point.y, onClose, onSelectPoint])

    const startNewRoadAndClose = useCallback(() => {
        console.info('Construction window: starting to build road')

        onStartNewRoad(point)
        onClose()
    }, [point.x, point.y, onStartNewRoad, onClose])

    const startMonitorAndClose = useCallback(() => {
        console.info(`Construction window: starting monitor for point: ${JSON.stringify(point)}`)

        onStartMonitor(point)
        onClose()
    }, [point.x, point.y, onClose, onStartMonitor])

    // Rendering
    const constructionOptions = new Map<'Buildings' | 'FlagsAndRoads', string>()

    if (canBuildHouse(point) || canBuildMine(point)) {
        constructionOptions.set('Buildings', 'Buildings')
    }

    if (canRaiseFlag(point)) {
        constructionOptions.set('FlagsAndRoads', 'Flags and roads')
    }

    const houseOptions = new Map<SizeLowerCase, string>()

    if (canBuildSmallHouse(point) || canBuildMine(point)) {
        houseOptions.set('small', 'Small')
    }

    if (canBuildMediumHouse(point)) {
        houseOptions.set('medium', 'Medium')
    }

    if (canBuildLargeHouse(point)) {
        houseOptions.set('large', 'Large')
    }

    return (
        <WindowWithTyping<PointInformationWithoutPossibleRoadConnections>
            id='ConstructionInfo'
            commands={commands}
            param={point}
            className='construction-info-window'
            heading='Construction'
            onClose={onClose}
            hoverInfo={hoverInfo}
            onRaise={onRaise}
        >

            <div className='construction-info'>
                <TabList
                    selectedValue={selected}
                    onTabSelect={
                        (_event: SelectTabEvent, data: SelectTabData) => {
                            const value = data.value

                            if (value === 'Buildings' || value === 'FlagsAndRoads' || value === 'Monitor') {
                                setSelected(value)
                            }
                        }}
                >
                    {Array.from(constructionOptions.entries(), ([key, value]) => {
                        return <Tab
                            value={key}
                            key={key}
                            onMouseEnter={() => setHoverInfo(`Construct ${value.toLowerCase()}`)}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            {key === 'Buildings' && <UiIcon type='SHOVEL' scale={0.5} />}
                            {key === 'FlagsAndRoads' && <UiIcon type='PULL_DOWN_FLAG' scale={0.5} />}
                        </Tab>
                    })}
                    <Tab
                        value={'Monitor'}
                        onMouseEnter={() => setHoverInfo('Create a monitor')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                    </Tab>
                </TabList>

                {selected === 'FlagsAndRoads' &&
                    <div className='dialog-section'>

                        <ButtonRow>
                            <Button
                                onClick={raiseFlagAndClose}
                                onMouseEnter={() => setHoverInfo('Raise flag')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <FlagIcon type='NORMAL' nation={nation} />
                            </Button>

                            {canBuildRoad(point) &&
                                <Button
                                    icon='road-1.png'
                                    onClick={startNewRoadAndClose}
                                >Build road</Button>
                            }
                        </ButtonRow>
                    </div>
                }

                {selected === 'Buildings' &&
                    <TabList
                        selectedValue={buildingSizeSelected}
                        onTabSelect={
                            (_event: SelectTabEvent, data: SelectTabData) => {
                                const value = data.value
                                if (value === 'small' || value === 'medium' || value === 'large') {
                                    setBuildingSizeSelected(value)
                                }
                            }}
                    >
                        {Array.from(houseOptions.entries(), ([key, value]) => {
                            return <Tab
                                value={key}
                                key={key}
                                onMouseEnter={() => setHoverInfo(`Place ${key} building`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                {value === 'Small' && <UiIcon type='RED_SMALL_AVAILABLE_BUILDING' scale={0.5} />}
                                {value === 'Medium' && <UiIcon type='RED_MEDIUM_AVAILABLE_BUILDING' scale={0.5} />}
                                {value === 'Large' && <UiIcon type='RED_LARGE_AVAILABLE_BUILDING' scale={0.5} />}
                            </Tab>
                        })}
                    </TabList>
                }

                {selected === 'Buildings' && buildingSizeSelected === 'small' &&
                    <ItemContainer rows>
                        {(canBuildMine(point) ? MINES : SMALL_BUILDINGS_EXCEPT_MINES).map((house) => {
                            const prettyHouse = buildingPretty(house)

                            return (<div
                                key={house}
                                className='ConstructionItem'
                                onClick={() => {
                                    console.info('Construction window: creating house')

                                    api.placeHouse(house, point)
                                    onSelectPoint(point)
                                    onClose()
                                }}
                                onMouseEnter={() => setHoverInfo(`Place ${prettyHouse.toLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <div className='house-construction-button'>
                                    <HouseIcon nation={nation} houseType={house} drawShadow />
                                </div>
                            </div>)
                        })}
                    </ItemContainer>
                }

                {selected === 'Buildings' && canBuildMediumHouse(point) && buildingSizeSelected === 'medium' &&
                    <ItemContainer rows>
                        {MEDIUM_HOUSE_VALUES.map(house => {
                            const prettyHouse = buildingPretty(house)

                            return (<div
                                key={house}
                                className='ConstructionItem'
                                onClick={() => {
                                    console.info('Construction window: creating house')

                                    api.placeHouse(house, point)
                                    onSelectPoint(point)
                                    onClose()
                                }}
                                onMouseEnter={() => setHoverInfo(`Place ${prettyHouse.toLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <div className='house-construction-button'>
                                    <HouseIcon nation={nation} houseType={house} drawShadow />
                                </div>
                            </div>)

                        })}
                    </ItemContainer>
                }

                {selected === 'Buildings' && canBuildLargeHouse(point) && buildingSizeSelected === 'large' &&
                    <ItemContainer rows>
                        {LARGE_HOUSE_VALUES.filter(house => house !== 'Headquarter').map(house => {
                            const prettyHouse = buildingPretty(house)

                            return (<div
                                key={house}
                                className='ConstructionItem'
                                onClick={() => {
                                    console.info('Construction window: creating house')

                                    api.placeHouse(house, point)
                                    onSelectPoint(point)
                                    onClose()
                                }}
                                onMouseEnter={() => setHoverInfo(`Place ${prettyHouse.toLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <div className='house-construction-button'>
                                    <HouseIcon nation={nation} houseType={house} drawShadow />
                                </div>
                            </div>)
                        })}
                    </ItemContainer>
                }

                {selected === 'Monitor' &&
                    <ButtonRow>
                        {!houseTitlesVisible &&
                            <Button
                                onClick={onShowHouseTitles}
                                onMouseEnter={() => setHoverInfo('Show house names')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                            </Button>}
                        {houseTitlesVisible &&
                            <Button
                                onClick={onHideHouseTitles}
                                onMouseEnter={() => setHoverInfo('Hide house names')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                            </Button>}
                        {!availableConstructionVisible &&
                            <Button
                                onClick={onShowAvailableConstruction}
                                onMouseEnter={() => setHoverInfo('Show available construction')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                            </Button>}

                        {availableConstructionVisible &&
                            <Button
                                onClick={onHideAvailableConstruction}
                                onMouseEnter={() => setHoverInfo('Hide available construction')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                            </Button>}
                        <Button
                            onClick={startMonitorAndClose}
                            onMouseEnter={() => setHoverInfo('Open monitor')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                        </Button>
                    </ButtonRow>
                }
            </div>
        </WindowWithTyping>
    )
}

export { ConstructionInfo }

