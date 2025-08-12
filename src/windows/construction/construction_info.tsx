import React, { useEffect, useState } from 'react'
import { AvailableConstruction, LARGE_HOUSES, MEDIUM_HOUSES, Nation, Point, PointInformation, SMALL_HOUSES, SmallBuilding } from '../../api/types'
import './construction_info.css'
import { ButtonRow, Window } from '../../components/dialog'
import { api } from '../../api/ws-api'
import { canBuildHouse, canBuildLargeHouse, canBuildMediumHouse, canBuildMine, canBuildRoad, canBuildSmallHouse, canRaiseFlag } from '../../utils/utils'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { FlagIcon, HouseIcon, UiIcon } from '../../icons/icon'
import { buildingPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'

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

// Constancs
const MINES: SmallBuilding[] = ['GoldMine', 'IronMine', 'CoalMine', 'GraniteMine']
const MINES_SET = new Set<SmallBuilding>(MINES)
const SMALL_BUILDINGS_EXCEPT_MINES: SmallBuilding[] = SMALL_HOUSES.filter(house => !MINES_SET.has(house))

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
    const [point, setPoint] = useState<PointInformation>(props.point)
    const [selected, setSelected] = useState<'Buildings' | 'FlagsAndRoads' | 'Monitor'>((canBuildHouse(point) || canBuildMine(point)) ? 'Buildings' : 'FlagsAndRoads')
    const [buildingSizeSelected, setBuildingSizeSelected] = useState<SizeLowerCase>('small')
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    const constructionOptions = new Map<'Buildings' | 'FlagsAndRoads', string>()
    const constructionInitialSelection = (canBuildHouse(point) || canBuildMine(point)) ? 'Buildings' : 'FlagsAndRoads'

    useEffect(
        () => {
            const listener = {
                onAvailableConstructionChanged: (availableConstruction: AvailableConstruction[]) => {
                    const updatedPoint: PointInformation = {
                        ...point,
                        canBuild: availableConstruction,
                    }

                    setPoint(updatedPoint)
                }
            }

            api.addAvailableConstructionListener(point, listener)

            return () => api.removeAvailableConstructionListener(point, listener)
        }, [point])

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
        <Window
            id='ConstructionInfo'
            className='construction-info-window'
            heading='Construction'
            onClose={onClose}
            hoverInfo={hoverInfo}
            onRaise={onRaise}
        >

            <div className='construction-info'>
                <TabList
                    defaultSelectedValue={constructionInitialSelection}
                    onTabSelect={
                        (_event: SelectTabEvent, data: SelectTabData) => {
                            const value = data.value

                            if (value === 'Buildings' || value === 'FlagsAndRoads' || value === 'Monitor') {
                                setSelected(value)
                            }
                        }}
                >
                    {Array.from(constructionOptions.entries(), ([key, value], index) => {

                        return <Tab
                            value={key}
                            key={index}
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
                                onClick={() => {
                                    console.info('Raising flag')

                                    api.placeFlag(point)
                                    onSelectPoint(point)
                                    onClose()
                                }}
                                onMouseEnter={() => setHoverInfo('Raise flag')}
                                onMouseLeave={() => setHoverInfo(undefined)}
                            >
                                <FlagIcon type='NORMAL' nation={nation} />
                            </Button>

                            {canBuildRoad(point) &&
                                <Button
                                    icon='road-1.png'
                                    onClick={() => {
                                        console.info('Starting to build road')

                                        onStartNewRoad(point)
                                        onClose()
                                    }}
                                >Build road</Button>
                            }
                        </ButtonRow>
                    </div>
                }

                {selected === 'Buildings' &&
                    <TabList
                        defaultSelectedValue={'small'}
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
                                key={value}
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
                                onClick={async () => {
                                    console.info('Creating house')

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
                        {MEDIUM_HOUSES.map(house => {
                            const prettyHouse = buildingPretty(house)

                            return (<div
                                key={house}
                                className='ConstructionItem'
                                onClick={async () => {
                                    console.info('Creating house')

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
                        {LARGE_HOUSES.filter(house => house !== 'Headquarter').map(house => {
                            const prettyHouse = buildingPretty(house)

                            return (<div
                                key={house}
                                className='ConstructionItem'
                                onClick={async () => {
                                    console.info('Creating house')

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
                            onClick={() => {
                                onStartMonitor(point)

                                onClose()
                            }}
                            onMouseEnter={() => setHoverInfo('Open monitor')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                        </Button>
                    </ButtonRow>
                }
            </div>
        </Window >
    )
}

export { ConstructionInfo }

