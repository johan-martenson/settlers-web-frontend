import { useCallback, useEffect, useRef } from 'react'
import { PointMap } from '../utils/point-value-collections'
import { Vector } from '../utils/utils'
import { RenderState, RenderType, TrianglesAtPoint } from './types'
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
        decorationsRenderQueue: [],
        decorationsShadowRenderQueue: [],
        gameObjectsRenderQueue: [],
        gameObjectsShadowRenderQueue: [],
        availableConstructionRenderQueue: [],
        possibleRoadConnectionsRenderQueue: [],
        selectedPointRenderQueue: [],
        hoverPointRenderQueue: [],
        houseTitlesRenderQueue: [],

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
    const pushImage = useCallback((
        drawInfo: DrawingInformation | undefined,
        gamePoint: Point,
        renderQueue: RenderType,
        height?: number
    ) => {
        if (!drawInfo) {
            return
        }

        const toPush = {
            source: drawInfo,
            gamePoint,
            height
        }

        if (renderQueue === 'DECORATION') {
            renderState.current.decorationsRenderQueue.push(toPush)
        } else if (renderQueue === 'OBJECT') {
            renderState.current.gameObjectsRenderQueue.push(toPush)
        } else if (renderQueue === 'AVAILABLE_CONSTRUCTION') {
            renderState.current.availableConstructionRenderQueue.push(toPush)
        } else if (renderQueue === 'POSSIBLE_ROAD_CONNECTIONS') {
            renderState.current.possibleRoadConnectionsRenderQueue.push(toPush)
        } else if (renderQueue === 'SELECTED_POINT') {
            renderState.current.selectedPointRenderQueue.push(toPush)
        } else if (renderQueue === 'HOVER') {
            renderState.current.hoverPointRenderQueue.push(toPush)
        }
    }, [renderState])

    const pushImageWithShadow = useCallback((
        drawInfo: DrawingInformation[] | undefined,
         gamePoint: Point,
         renderQueue: RenderType,
          height?: number) => {
        if (!drawInfo) {
            return
        }

        const image = {
            source: drawInfo[0],
            gamePoint,
            height
        }

        const shadow = {
            source: drawInfo[1],
            gamePoint,
            height
        }

        if (renderQueue === 'DECORATION') {
            renderState.current.decorationsRenderQueue.push(image)
            renderState.current.decorationsShadowRenderQueue.push(shadow)
        } else if (renderQueue === 'OBJECT') {
            renderState.current.gameObjectsRenderQueue.push(image)
            renderState.current.gameObjectsShadowRenderQueue.push(shadow)
        } else if (renderQueue === 'AVAILABLE_CONSTRUCTION') {
            console.error('Shadows for available construction are not supported')
        } else if (renderQueue === 'POSSIBLE_ROAD_CONNECTIONS') {
            console.error('Shadows for possible road connections are not supported')
        } else if (renderQueue === 'SELECTED_POINT') {
            console.error('Shadows for selected point are not supported')
        } else if (renderQueue === 'HOVER') {
            console.error('Shadows for hover point are not supported')
        }
    }, [renderState])

    const clearRenderQueues = useCallback(() => {
        renderState.current.decorationsRenderQueue.length = 0
        renderState.current.decorationsShadowRenderQueue.length = 0
        renderState.current.gameObjectsRenderQueue.length = 0
        renderState.current.gameObjectsShadowRenderQueue.length = 0
        renderState.current.availableConstructionRenderQueue.length = 0
        renderState.current.possibleRoadConnectionsRenderQueue.length = 0
        renderState.current.selectedPointRenderQueue.length = 0
        renderState.current.hoverPointRenderQueue.length = 0
        renderState.current.houseTitlesRenderQueue.length = 0
    }, [renderState])

    // Effects
    // Effect: variables get captured by the closure of 'renderGame()' so pass the props in to it through renderState
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

    return { renderState, pushImage, pushImageWithShadow, clearRenderQueues }
}

// Exports
export { useRenderStateSync }
