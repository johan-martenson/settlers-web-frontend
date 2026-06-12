import React, { useCallback, useMemo } from 'react'
import { Button } from "@fluentui/react-components"
import { ButtonRow, WindowWithTyping } from "../../components/dialog"
import { Point } from "../../api/types"
import { useState } from "react"
import './no_action_window.css'
import { GenericCommand } from '../../utils/typing-commands'
import { UiIcon } from '../../components/icons/icon'
import { Dismiss16Filled } from '@fluentui/react-icons'

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
            action: onReturnToHeadquarters,
            icon: <UiIcon type='PLUS_RETURN_TO_HEADQUARTERS' scale={0.5} />
        })

        cmds.set('Show house names', {
            action: onShowTitles,
            filter: () => !areHouseTitlesVisible,
            icon: <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
        })

        cmds.set('Hide house names', {
            action: onHideTitles,
            filter: () => areHouseTitlesVisible,
            icon: <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
        })

        cmds.set('Toggle house names', {
            action: areHouseTitlesVisible
                ? onHideTitles
                : onShowTitles,
            icon: <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
        })

        cmds.set('Show available construction', {
            action: onShowAvailableConstruction,
            filter: () => !isAvailableConstructionVisible,
            icon: <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
        })

        cmds.set('Hide available construction', {
            action: onHideAvailableConstruction,
            filter: () => isAvailableConstructionVisible,
            icon: <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
        })

        cmds.set('Toggle available construction', {
            action: isAvailableConstructionVisible
                ? onHideAvailableConstruction
                : onShowAvailableConstruction,
            icon: <UiIcon type='PLUS_AVAILABLE_BUILDINGS' scale={0.5} />
        })

        cmds.set('Monitor', {
            action: startMonitor,
            icon: <UiIcon type='MAGNIFYING_GLASS' scale={0.5} />
        })

        cmds.set('Close window', {
            action: onClose,
            icon: <Dismiss16Filled />
        })

        cmds.set('Debug', {
            action: (point: Point) => {
                console.log(point)
            },
            hidden: true
        })

        cmds.set('Copy point JSON', {
            action: async (point: Point) => {
                await navigator.clipboard.writeText(JSON.stringify(point, null, 2))
            },
            hidden: true
        })

        return cmds
    }, [
        onReturnToHeadquarters,
        onShowTitles,
        onHideTitles,
        onShowAvailableConstruction,
        onHideAvailableConstruction,
        startMonitor,
        onClose,
        areHouseTitlesVisible,
        isAvailableConstructionVisible
    ])

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