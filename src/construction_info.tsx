import React, { useEffect, useState } from 'react'
import { AvailableConstruction, LARGE_HOUSES, MEDIUM_HOUSES, Nation, Point, PointInformation, SMALL_HOUSES } from './api/types'
import './construction_info.css'
import { ButtonRow, Window } from './components/dialog'
import { monitor } from './api/ws-api'
import { camelCaseToWords, canBuildHouse, canBuildLargeHouse, canBuildMediumHouse, canBuildRoad, canBuildSmallHouse, canRaiseFlag } from './utils'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList, Tooltip } from '@fluentui/react-components'
import { FlagIcon, HouseIcon } from './icons/icon'

interface ConstructionInfoProps {
    point: PointInformation
    nation: Nation

    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
    onStartNewRoad: (point: Point) => void
}

// TODO: add monitor tab

const ConstructionInfo = ({ nation, onStartNewRoad, onClose, onRaise, onStartMonitor, ...props }: ConstructionInfoProps) => {
    const [point, setPoint] = useState<PointInformation>(props.point)
    const [selected, setSelected] = useState<'Buildings' | 'FlagsAndRoads' | 'Monitor'>((canBuildHouse(point)) ? 'Buildings' : 'FlagsAndRoads')
    const [buildingSizeSelected, setBuildingSizeSelected] = useState<'small' | 'medium' | 'large'>('small')
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    const constructionOptions = new Map()
    const constructionInitialSelection = canBuildHouse(point) ? "Buildings" : "FlagsAndRoads"

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

            monitor.addAvailableConstructionListener(point, listener)

            return () => monitor.removeAvailableConstructionListener(point, listener)
        }, [point])

    if (canBuildHouse(point)) {
        constructionOptions.set("Buildings", "Buildings")
    }

    if (canRaiseFlag(point)) {
        constructionOptions.set("FlagsAndRoads", "Flags and roads")
    }

    const houseOptions = new Map()

    if (canBuildSmallHouse(point)) {
        houseOptions.set("small", "Small")
    }

    if (canBuildMediumHouse(point)) {
        houseOptions.set("medium", "Medium")
    }

    if (canBuildLargeHouse(point)) {
        houseOptions.set("large", "Large")
    }

    return (
        <Window id="ConstructionInfo" className="construction-info-window" heading="Construction" onClose={onClose} hoverInfo={hoverInfo} onRaise={onRaise}>

            <div className='construction-info'>
                <TabList
                    defaultSelectedValue={constructionInitialSelection}
                    onTabSelect={
                        (_event: SelectTabEvent, data: SelectTabData) => {
                            const value = data.value

                            if (value === "Buildings" || value === "FlagsAndRoads" || value === 'Monitor') {
                                setSelected(value)
                            }
                        }
                    }
                >
                    {Array.from(constructionOptions.entries(), ([key, value], index) => {
                        return <Tab value={key} key={index}>{value}</Tab>
                    })}
                    <Tab value={'Monitor'}>
                        Monitor
                    </Tab>
                </TabList>

                {selected === "FlagsAndRoads" &&
                    <div className="dialog-section">

                        <ButtonRow>
                            <Tooltip content={'Raise flag'} relationship='label' withArrow>
                                <Button
                                    onClick={
                                        () => {
                                            console.info("Raising flag")
                                            monitor.placeFlag(point)

                                            onClose()
                                        }
                                    }

                                    onMouseEnter={() => setHoverInfo("Raise flag")}
                                    onMouseLeave={() => setHoverInfo(undefined)}
                                >
                                    <FlagIcon type='NORMAL' nation={nation} />

                                </Button>
                            </Tooltip>

                            {canBuildRoad(point) &&
                                <Button
                                    icon="road-1.png"
                                    onClick={
                                        () => {
                                            console.info("Starting to build road")

                                            onStartNewRoad(point)

                                            onClose()
                                        }
                                    }
                                >Build road</Button>
                            }
                        </ButtonRow>
                    </div>
                }

                {selected === "Buildings" &&
                    <TabList
                        defaultSelectedValue={"small"}
                        onTabSelect={
                            (_event: SelectTabEvent, data: SelectTabData) => {
                                const value = data.value
                                if (value === "small" || value === "medium" || value === "large") {
                                    setBuildingSizeSelected(value)
                                }
                            }
                        }>
                        {Array.from(houseOptions.entries(),
                            ([key, value]) => {
                                return <Tab value={key} key={value}>{value}</Tab>
                            }
                        )}
                    </TabList>
                }

                {selected === "Buildings" && buildingSizeSelected === "small" &&
                    <div className="dialog-section">
                        <div className="house-construction-buttons">
                            {SMALL_HOUSES.map(
                                (house) =>
                                    <Tooltip content={camelCaseToWords(house)} relationship='label' withArrow key={house}>
                                        <div className="ConstructionItem"
                                            onClick={
                                                async () => {
                                                    console.info("Creating house")
                                                    monitor.placeHouse(house, point)

                                                    onClose()
                                                }
                                            }

                                            onMouseEnter={() => setHoverInfo(house)}
                                            onMouseLeave={() => setHoverInfo(undefined)}
                                        >
                                            <div className='house-construction-button'>
                                                <HouseIcon nation={nation} houseType={house} drawShadow />
                                            </div>
                                        </div>
                                    </Tooltip>
                            )
                            }
                        </div>
                    </div>
                }

                {selected === "Buildings" &&
                    canBuildMediumHouse(point) &&
                    buildingSizeSelected === "medium" &&
                    <div className="dialog-section">
                        <div className="house-construction-buttons">
                            {MEDIUM_HOUSES.map(
                                (house) =>
                                    <Tooltip content={camelCaseToWords(house)} relationship='label' withArrow key={house}>
                                        <div className="ConstructionItem"
                                            onClick={
                                                async () => {
                                                    console.info("Creating house")
                                                    monitor.placeHouse(house, point)

                                                    onClose()
                                                }
                                            }

                                            onMouseEnter={() => setHoverInfo(house)}
                                            onMouseLeave={() => setHoverInfo(undefined)}
                                        >
                                            <div className='house-construction-button'>
                                                <HouseIcon nation={nation} houseType={house} drawShadow />
                                            </div>
                                        </div>
                                    </Tooltip>
                            )
                            }
                        </div>
                    </div>
                }

                {selected === "Buildings" &&
                    canBuildLargeHouse(point) &&
                    buildingSizeSelected === "large" &&
                    <div className="dialog-section">
                        <div className="house-construction-buttons">
                            {LARGE_HOUSES.filter(house => house !== 'Headquarter').map(
                                (house) =>
                                    <Tooltip content={camelCaseToWords(house)} relationship='label' withArrow key={house}>
                                        <div className="ConstructionItem"
                                            onClick={
                                                async () => {
                                                    console.info("Creating house")
                                                    monitor.placeHouse(house, point)

                                                    onClose()
                                                }
                                            }

                                            onMouseEnter={() => setHoverInfo(house)}
                                            onMouseLeave={() => setHoverInfo(undefined)}
                                        >
                                            <div className='house-construction-button'>
                                                <HouseIcon nation={nation} houseType={house} drawShadow />
                                            </div>
                                        </div>
                                    </Tooltip>
                            )
                            }
                        </div>
                    </div>
                }

                {selected === 'Monitor' &&
                    <ButtonRow>
                        <Button
                            onClick={() => onStartMonitor(point)}
                            onMouseEnter={() => setHoverInfo('Open monitor')}
                            onMouseLeave={() => setHoverInfo(undefined)}
                        >
                            Monitor
                        </Button>
                    </ButtonRow>
                }
            </div>
        </Window>
    )
}

export { ConstructionInfo }

