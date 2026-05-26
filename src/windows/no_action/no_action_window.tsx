import React, { useCallback, useMemo } from 'react'
import { Button } from "@fluentui/react-components"
import { ButtonRow, WindowWithTyping } from "../../components/dialog"
import { Point } from "../../api/types"
import { useState } from "react"
import './no_action_window.css'
import { GenericCommand } from '../../utils/typing-commands'
import { UiIcon } from '../../components/icons/icon'

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
    onReturnToHeadquarters: () => void
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
    onReturnToHeadquarters,
    onRaise,
    onClose
}: NoActionWindowProps) {

    // State
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    // Functions
    const startMonitor = useCallback(() => {
        console.info(`No action window: starting monitor for point: ${JSON.stringify(point)}`)

        onStartMonitor({ x: point.x, y: point.y })
        onClose()
    }, [point.x, point.y, onClose, onStartMonitor])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<Point>>()

        cmds.set('Return to headquarters', {
            action: onReturnToHeadquarters
        })

        cmds.set('Show house names', {
            action: onShowTitles,
            hidden: areHouseTitlesVisible
        })

        cmds.set('Hide house names', {
            action: onHideTitles,
            hidden: !areHouseTitlesVisible
        })

        cmds.set('Show available construction', {
            action: onShowAvailableConstruction,
            hidden: isAvailableConstructionVisible
        })

        cmds.set('Hide available construction', {
            action: onHideAvailableConstruction,
            hidden: !isAvailableConstructionVisible
        })

        cmds.set('Open monitor', {
            action: startMonitor
        })

        cmds.set('close window', {
            action: onClose
        })

        return cmds
    }, [onReturnToHeadquarters,
        onShowTitles,
        onHideTitles,
        onShowAvailableConstruction,
        onHideAvailableConstruction,
        startMonitor,
        onClose,
        areHouseTitlesVisible,
        isAvailableConstructionVisible])

    // Rendering
    return (
        <WindowWithTyping<Point>
            commands={commands}
            param={point}
            className='no-action-window'
            heading='Monitor'
            onRaise={onRaise}
            onClose={onClose}
            hoverInfo={hoverInfo}
        >
            <ButtonRow>
                <Button
                    onClick={onReturnToHeadquarters}
                    onMouseEnter={() => setHoverInfo('Go to headquarters')}
                    onMouseLeave={() => setHoverInfo(undefined)}>
                    <UiIcon type='PLUS_RETURN_TO_HEADQUARTERS' scale={0.5} />
                </Button>
                {!areHouseTitlesVisible &&
                    <Button
                        onClick={onShowTitles}
                        onMouseEnter={() => setHoverInfo('Show house names')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                    </Button>}
                {areHouseTitlesVisible &&
                    <Button
                        onClick={onHideTitles}
                        onMouseEnter={() => setHoverInfo('Hide house names')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
                    </Button>}
                {!isAvailableConstructionVisible &&
                    <Button
                        onClick={onShowAvailableConstruction}
                        onMouseEnter={() => setHoverInfo('Show available construction')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                    </Button>}

                {isAvailableConstructionVisible &&
                    <Button
                        onClick={onHideAvailableConstruction}
                        onMouseEnter={() => setHoverInfo('Hide available construction')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
                    </Button>}

                <Button
                    onClick={startMonitor}
                    onMouseEnter={() => setHoverInfo('Open monitor')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
                </Button>
            </ButtonRow>
        </WindowWithTyping>
    )
}

export { NoActionWindow }