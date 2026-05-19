import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { UiIcon } from '../../icons/icon'
import { Point, RoadId, RoadInformation } from '../../api/types'
import { api } from '../../api/ws-api'
import './road-info.css'
import { ButtonRow, WindowWithTyping } from '../../components/dialog'
import { GenericCommand } from '../../screens/play/type_control'
import { useRoad } from '../../utils/hooks/hooks'

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

    // State
    const [selected, setSelected] = useState<'ROAD' | 'MONITOR'>('ROAD')
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    // Monitoring hooks
    const road = useRoad(roadId)

    // Functions
    const hoverManageRoad = useCallback(() => {
        setHoverInfo('Manage road')
    }, [])

    const hoverStartMonitoring = useCallback(() => {
        setHoverInfo('Start monitoring')
    }, [])

    const hoverRemoveRoad = useCallback(() => {
        setHoverInfo('Remove road')
    }, [])

    const hoverShowHouseNames = useCallback(() => {
        setHoverInfo('Show house names')
    }, [])

    const hoverHideHouseNames = useCallback(() => {
        setHoverInfo('Hide house names')
    }, [])

    const hoverShowAvailableConstruction = useCallback(() => {
        setHoverInfo('Show available construction')
    }, [])

    const hoverHideAvailableConstruction = useCallback(() => {
        setHoverInfo('Hide available construction')
    }, [])

    const hoverOpenMonitor = useCallback(() => {
        setHoverInfo('Open monitor')
    }, [])

    const clearHover = useCallback(() => {
        setHoverInfo(undefined)
    }, [])

    const removeRoad = useCallback(() => {
        api.removeRoad(roadId)
        onClose()
    }, [roadId, onClose])

    const openMonitor = useCallback(() => {
        if (road !== undefined) {
            const mid = Math.round(road.points.length / 2)

            onStartMonitor(road.points[mid])
            onClose()
        } else {
            console.error(`RoadInfo: road ${roadId} not found`)
        }
    }, [roadId, road, onStartMonitor, onClose])

    const selectRoadOrMonitor = useCallback((_event: SelectTabEvent, data: SelectTabData) => {
        const { value } = data

        if (value === 'ROAD' || value === 'MONITOR') {
            setSelected(value)
        }
    }, [])


    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<RoadInformation>>()

        cmds.set('Manage road', {
            action: (_roadInfo: RoadInformation) => {
                setSelected('ROAD')
            }
        })

        cmds.set('Monitor', {
            action: (_roadInfo: RoadInformation) => {
                setSelected('MONITOR')
            }
        })

        cmds.set('Show house names', {
            action: (_roadInfo: RoadInformation) => {
                onShowHouseTitles()
            }
        })

        cmds.set('Hide house names', {
            action: (_roadInfo: RoadInformation) => {
                onHideHouseTitles()
            }
        })

        cmds.set('Show available construction', {
            action: (_roadInfo: RoadInformation) => {
                onShowAvailableConstruction()
            }
        })

        cmds.set('Hide available construction', {
            action: (_roadInfo: RoadInformation) => {
                onHideAvailableConstruction()
            }
        })

        cmds.set('Open monitor', {
            action: (_roadInfo: RoadInformation) => {
                openMonitor()
            }
        })

        cmds.set('Remove road', {
            action: (_roadInfo: RoadInformation) => {
                removeRoad()
            }
        })

        cmds.set('Close window', {
            action: (_roadInfo: RoadInformation) => onClose()
        })

        return cmds
    }, [onClose, onShowHouseTitles, onHideHouseTitles, onShowAvailableConstruction, onHideAvailableConstruction, openMonitor, removeRoad])

    // Effects
    // Effect: close the window if the road is removed
    useEffect(() => {
        if (road === undefined) {
            onClose()
        }
    }, [road, onClose])

    // Rendering
    if (road === undefined) {
        return null
    }

    return (
        <WindowWithTyping<RoadInformation>
            commands={commands}
            param={road}
            className='road-info'
            heading='Road'
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
        >
            <UiIcon type='ROAD_AND_FLAGS' scale={1} />
            <TabList
                selectedValue={selected}
                onTabSelect={selectRoadOrMonitor}
            >
                <Tab
                    value='ROAD'
                    onMouseEnter={hoverManageRoad}
                    onMouseLeave={clearHover}
                >
                    Road
                </Tab>
                <Tab
                    value='MONITOR'
                    onMouseEnter={hoverStartMonitoring}
                    onMouseLeave={clearHover}
                >
                    <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                </Tab>
            </TabList>

            {selected === 'ROAD' &&
                <ButtonRow>
                    <Button
                        onClick={removeRoad}
                        onMouseEnter={hoverRemoveRoad}
                        onMouseLeave={clearHover}
                    >
                        <UiIcon type='SCISSORS' scale={0.5} />
                    </Button>
                </ButtonRow>
            }

            {selected === 'MONITOR' &&
                <ButtonRow>
                    {!houseTitlesVisible &&
                        <Button
                            onClick={onShowHouseTitles}
                            onMouseEnter={hoverShowHouseNames}
                            onMouseLeave={clearHover}
                        >
                            <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                        </Button>}
                    {houseTitlesVisible &&
                        <Button
                            onClick={onHideHouseTitles}
                            onMouseEnter={hoverHideHouseNames}
                            onMouseLeave={clearHover}
                        >
                            <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                        </Button>}
                    {!availableConstructionVisible &&
                        <Button
                            onClick={onShowAvailableConstruction}
                            onMouseEnter={hoverShowAvailableConstruction}
                            onMouseLeave={clearHover}
                        >
                            <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                        </Button>}

                    {availableConstructionVisible &&
                        <Button
                            onClick={onHideAvailableConstruction}
                            onMouseEnter={hoverHideAvailableConstruction}
                            onMouseLeave={clearHover}
                        >
                            <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                        </Button>}
                    <Button
                        onClick={openMonitor}
                        onMouseEnter={hoverOpenMonitor}
                        onMouseLeave={clearHover}
                    >
                        <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                    </Button>
                </ButtonRow>
            }

        </WindowWithTyping>
    )
}

export { RoadInfo }