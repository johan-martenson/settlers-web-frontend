import React, { useState } from 'react'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components"
import { UiIcon } from "../../icons/icon"
import { Point, RoadId } from "../../api/types"
import { api } from "../../api/ws-api"
import './road-info.css'
import { ButtonRow, Window } from '../../components/dialog'

// Types
type RoadInfoProps = {
    roadId: RoadId
    houseTitlesVisible: boolean
    availableConstructionVisible: boolean

    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
    onShowHouseTitles: () => void
    onHideHouseTitles: () => void
    onShowAvailableConstruction: () => void
    onHideAvailableConstruction: () => void
}

// React components
/**
 * RoadInfo component provides options to manage a road or start monitoring it.
 *
 * @param roadId - The ID of the road being managed
 * @param onStartMonitor - Function to start monitoring a point on the road
 * @param onRaise - Function to raise the window to the top
 * @param onClose - Function to close the window
 */
const RoadInfo = ({
    roadId,
    houseTitlesVisible,
    availableConstructionVisible,
    onStartMonitor,
    onClose,
    onRaise,
    onShowHouseTitles,
    onHideHouseTitles,
    onShowAvailableConstruction,
    onHideAvailableConstruction,
}: RoadInfoProps) => {
    const [selected, setSelected] = useState<'ROAD' | 'MONITOR'>('ROAD')
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window className="road-info" heading='Road' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <UiIcon type='ROAD_AND_FLAGS' scale={1} />
            <TabList
                defaultSelectedValue={selected}
                onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
                    const { value } = data

                    if (value === 'ROAD' || value === 'MONITOR') {
                        setSelected(value)
                    }
                }}
            >
                <Tab
                    value='ROAD'
                    onMouseEnter={() => setHoverInfo('Manage road')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    Road
                </Tab>
                <Tab
                    value='MONITOR'
                    onMouseEnter={() => setHoverInfo('Start monitoring')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                </Tab>
            </TabList>

            {selected === 'ROAD' &&
                <ButtonRow>
                    <Button
                        onClick={() => {
                            api.removeRoad(roadId)

                            onClose()
                        }}
                        onMouseEnter={() => setHoverInfo('Remove road')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type="SCISSORS" scale={0.5} />
                    </Button>
                </ButtonRow>
            }

            {selected === 'MONITOR' &&
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
                            <UiIcon type='PLUS_AVAILABLE_BUILDINGS' />
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
                            const road = api.roads.get(roadId)

                            if (road !== undefined) {
                                const mid = Math.round(road.points.length / 2)

                                onStartMonitor(road.points[mid])

                                onClose()
                            }
                        }}
                        onMouseEnter={() => setHoverInfo('Open monitor')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                    </Button>
                </ButtonRow>
            }

        </Window >
    )
}

export { RoadInfo }