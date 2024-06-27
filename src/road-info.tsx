import React, { useState } from 'react'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components"
import { UiIcon } from "./icons/icon"
import { Point, RoadId } from "./api/types"
import { monitor } from "./api/ws-api"
import './road-info.css'
import { ButtonRow, Window } from './components/dialog'

type RoadInfoProps = {
    roadId: RoadId

    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
}

// TODO: add monitor tab

const RoadInfo = ({ roadId, onStartMonitor, onClose, onRaise }: RoadInfoProps) => {
    const [selected, setSelected] = useState<'ROAD' | 'MONITOR'>('ROAD')
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window className="road-info" heading='Road' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <TabList
                defaultSelectedValue={selected}
                onTabSelect={
                    (_event: SelectTabEvent, data: SelectTabData) => {
                        const value = data.value

                        if (value === 'ROAD' || value === 'MONITOR') {
                            setSelected(value)
                        }
                    }
                }
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
                            monitor.removeRoad(roadId)

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
                            const road = monitor.roads.get(roadId)

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