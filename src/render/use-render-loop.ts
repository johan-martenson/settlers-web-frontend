import { useCallback, useEffect } from 'react'
import { RenderState, View } from './types'
import { AvailableConstruction, CropInformation, Decoration, FallingTreeInformation, FlagInformation, HouseInformation, PlayerId, Point, ShipInformation, SignInformation, StoneInformation, TerrainAtPoint, TreeInformation, WildAnimalInformation, WorkerInformation } from '../api/types'
import { api, MonitoredBorderForPlayer } from '../api/ws-api'
import { PointMap } from '../utils/point-value-collections'

// Types
type UseRenderLoopProps = {
    renderState: React.RefObject<RenderState>
    navigationState: React.RefObject<View>
    renderGame: (
        renderState: RenderState,
        navigationState: View,
        houses: Iterable<HouseInformation>,
        flags: Iterable<FlagInformation>,
        trees: Iterable<TreeInformation>,
        crops: Iterable<CropInformation>,
        stones: Iterable<StoneInformation>,
        signs: Iterable<SignInformation>,
        workers: Iterable<WorkerInformation>,
        decorations: Iterable<Decoration>,
        fallingTrees: Iterable<FallingTreeInformation>,
        animals: Iterable<WildAnimalInformation>,
        ships: Iterable<ShipInformation>,
        availableConstruction: PointMap<AvailableConstruction[]>,
        borders: Iterable<MonitoredBorderForPlayer>,
        selfPlayerId: PlayerId,
        terrain: PointMap<TerrainAtPoint>
    ) => void
}

// Hooks
function useRenderLoop({ renderState, navigationState, renderGame }: UseRenderLoopProps) {

    // Functions
    const startRenderLoop = useCallback(() => {
        if (renderState.current.renderLoopIsRunning) {
            return
        }

        renderState.current.renderLoopIsRunning = true
        renderState.current.previous = performance.now()
        renderState.current.overshoot = 0

        const loop = () => {
            if (!renderState.current.renderLoopIsRunning) {
                return
            }

            if (api.playerId === undefined) {
                console.warn('useRenderLoop: playerId is undefined, skipping render loop iteration')

                renderState.current.renderLoopHandle = requestAnimationFrame(loop)

                return
            }

            renderGame(
                renderState.current,
                navigationState.current,
                api.houses.values(),
                api.flags.values(),
                api.trees.values(),
                api.crops.values(),
                api.stones.values(),
                api.signs.values(),
                api.workers.values(),
                api.decorations.values(),
                api.fallingTrees.values(),
                api.wildAnimals.values(),
                api.ships.values(),
                api.availableConstruction,
                api.border.values(),
                api.playerId,
                api.allTiles
            )

            renderState.current.renderLoopHandle = requestAnimationFrame(loop)
        }

        renderState.current.renderLoopHandle = requestAnimationFrame(loop)
    }, [renderState, renderGame])

    const stopRenderLoop = useCallback(() => {
        renderState.current.renderLoopIsRunning = false

        if (renderState.current.renderLoopHandle !== undefined) {
            cancelAnimationFrame(renderState.current.renderLoopHandle)

            renderState.current.renderLoopHandle = undefined
        }
    }, [renderState])

    // Effect: start/stop rendering based on visibility
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) {
                stopRenderLoop()
            } else {
                startRenderLoop()
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [startRenderLoop, stopRenderLoop])

    return {
        startRenderLoop,
        stopRenderLoop
    }
}

// Exports
export { useRenderLoop }