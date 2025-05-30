import React from 'react'
import { Button } from "@fluentui/react-components"
import { ButtonRow, Window } from "../../components/dialog"
import { Point } from "../../api/types"
import { useState } from "react"
import './no_action_window.css'
import { UiIcon } from '../../icons/icon'

// Types
type NoActionWindowProps = {
    point: Point
    areHouseTitlesVisible: boolean
    isAvailableConstructionVisible: boolean

    onShowTitles: () => void
    onHideTitles: () => void
    onShowAvailableConstruction: () => void
    onHideAvailableConstruction: () => void
    onStartMonitor: (point: Point) => void
    onRaise: () => void
    onClose: () => void
}

// React components
function NoActionWindow({
    point,
    areHouseTitlesVisible,
    isAvailableConstructionVisible,
    onShowTitles,
    onHideTitles,
    onShowAvailableConstruction,
    onHideAvailableConstruction,
    onStartMonitor,
    onRaise,
    onClose
}: NoActionWindowProps) {
    const [hoverInfo, setHoverInfo] = useState<string>()

    return (
        <Window className='no-action-window' heading='Monitor' onRaise={onRaise} onClose={onClose} hoverInfo={hoverInfo}>
            <ButtonRow>
                {!areHouseTitlesVisible &&
                    <Button
                        onClick={onShowTitles}
                        onMouseEnter={() => setHoverInfo('Show house names')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' />
                    </Button>}
                {areHouseTitlesVisible &&
                    <Button
                        onClick={onHideTitles}
                        onMouseEnter={() => setHoverInfo('Hide house names')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' />
                    </Button>}
                {!isAvailableConstructionVisible &&
                    <Button
                        onClick={onShowAvailableConstruction}
                        onMouseEnter={() => setHoverInfo('Show available construction')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_BUILDINGS' />
                    </Button>}

                {isAvailableConstructionVisible &&
                    <Button
                        onClick={onHideAvailableConstruction}
                        onMouseEnter={() => setHoverInfo('Hide available construction')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_BUILDINGS' />
                    </Button>}

                <Button
                    onClick={() => {
                        onStartMonitor(point)

                        onClose()
                    }}
                    onMouseEnter={() => setHoverInfo('Open monitor')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='MAGNIFYING_GLASS' />
                </Button>
            </ButtonRow>
        </Window>
    )
}

export { NoActionWindow }