import React, { useState } from 'react'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components"
import { UiIcon } from "./icons/icon"
import { Point, RoadId } from "./api/types"
import { api } from "./api/ws-api"
import './road-info.css'
import { ButtonRow, Window } from './components/dialog'

// Types
type RoadInfoProps = {
    roadId: RoadId

    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
}

// TODO: add monitor tab

// React components
/**
 * RoadInfo component provides options to manage a road or start monitoring it.
 *
 * @param roadId - The ID of the road being managed
 * @param onStartMonitor - Function to start monitoring a point on the road
 * @param onRaise - Function to raise the window to the top
 * @param onClose - Function to close the window
 */
const RoadInfo = ({ roadId, onStartMonitor, onClose, onRaise }: RoadInfoProps) => {
    const [selected, setSelected] = useState<'ROAD' | 'MONITOR'>('ROAD')
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window className="road-info" heading='Road' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <TabList
                defaultSelectedValue={selected}
                onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
                    const { value } = data

                    if (value === 'ROAD' || value === 'MONITOR') {
                        setSelected(value)
                    }
                }}
            >
                <Tab value='ROAD'>
                    Road
                </Tab>
                <Tab value='MONITOR'>
                    Monitor
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
                        <UiIcon type="SCISSORS" />
                    </Button>
                </ButtonRow>
            }

            {selected === 'MONITOR' &&
                <ButtonRow>
                    <Button
                        onClick={() => {
                            const road = api.roads.get(roadId)

                            if (road !== undefined) {
                                const mid = Math.round(road.points.length / 2)

                                onStartMonitor(road.points[mid])
                            }
                        }}
                        onMouseEnter={() => setHoverInfo('Open monitor')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Monitor
                    </Button>
                </ButtonRow>
            }

        </Window>
    )
}

export { RoadInfo }