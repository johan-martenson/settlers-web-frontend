import { useCallback, useEffect, useRef } from 'react'
import { PointMap } from '../utils/util_types_ng'
import { Vector } from '../utils/utils'
import { RenderState, TrianglesAtPoint } from './types'
import { Point } from '../api/types'
import { DrawingInformation } from '../assets/types'

// Types
type UseRenderStateSyncProps = {
    showAvailableConstruction: boolean
    selectedPoint?: Point
    newRoad?: Point[]
    possibleRoadConnections?: Point[]
    showHouseTitles: boolean
    fogOfWar: boolean
    showFpsCounter: boolean
    hideSelectedPoint: boolean
    hideHoverPoint: boolean
}

// Functions
function makeInitRenderState(): RenderState {
    return {
        previous: performance.now(),
        overshoot: 0,
        newRoadCurrentLength: 0,
        animationIndex: 0,
        normals: new PointMap<Vector>(),
        visiblePoints: new PointMap<TrianglesAtPoint>(),
        showHouseTitles: false,
        showAvailableConstruction: false,
        showFpsCounter: false,
        hideSelectedPoint: false,
        hideHoverPoint: false,
        renderLoopHandle: undefined,
        toDrawNormal: [],
        shadowsToDraw: [],
        toDrawHover: [],
        contextLost: false,
        fogOfWar: true
    }
}

// Hooks
function useRenderStateSync({
    showAvailableConstruction,
    selectedPoint,
    newRoad,
    possibleRoadConnections,
    showHouseTitles,
    fogOfWar,
    showFpsCounter,
    hideSelectedPoint,
    hideHoverPoint
}: UseRenderStateSyncProps) {

    // Use non-triggering state for render state and set initial values
    const renderState = useRef<RenderState>(makeInitRenderState())

    // Functions
    const pushNormalImage = useCallback((drawInfo: DrawingInformation | undefined, gamePoint: Point, height?: number) => {
        if (!drawInfo) {
            return
        }

        renderState.current.toDrawNormal.push({
            source: drawInfo,
            gamePoint,
            height
        })
    }, [renderState])

    const pushNormalImageWithShadow = useCallback((drawInfo: DrawingInformation[] | undefined, gamePoint: Point, height?: number) => {
        if (!drawInfo) {
            return
        }

        renderState.current.toDrawNormal.push({
            source: drawInfo[0],
            gamePoint,
            height
        })

        renderState.current.shadowsToDraw.push({
            source: drawInfo[1],
            gamePoint,
            height
        })
    }, [renderState])

    const pushHoverImage = useCallback((drawInfo: DrawingInformation | undefined, gamePoint: Point) => {
        if (!drawInfo) {
            return
        }

        renderState.current.toDrawHover.push({
            source: drawInfo,
            gamePoint
        })
    }, [renderState])

    const clearRenderQueues = useCallback(() => {
        renderState.current.toDrawNormal.length = 0
        renderState.current.shadowsToDraw.length = 0
        renderState.current.toDrawHover.length = 0
    }, [renderState])

    // Variables get captured by the closure of 'renderGame()' so pass the props in to it through renderState
    useEffect(
        () => {
            renderState.current.showAvailableConstruction = showAvailableConstruction
            renderState.current.selectedPoint = selectedPoint
            renderState.current.showHouseTitles = showHouseTitles
            renderState.current.fogOfWar = fogOfWar
            renderState.current.showFpsCounter = showFpsCounter
            renderState.current.hideSelectedPoint = hideSelectedPoint
            renderState.current.hideHoverPoint = hideHoverPoint

            if (newRoad !== undefined && newRoad.length > 0) {
                renderState.current.newRoad = { newRoad: newRoad, possibleConnections: possibleRoadConnections ?? [] }
            } else {
                renderState.current.newRoad = undefined
            }
        }, [showAvailableConstruction, selectedPoint, newRoad?.length, possibleRoadConnections?.length, showHouseTitles, fogOfWar])

    return { renderState, pushNormalImage, pushNormalImageWithShadow, pushHoverImage, clearRenderQueues }
}

// Exports
export { useRenderStateSync }
