import { useCallback, useState } from "react";
import { RoadBuildingState } from "./types";
import { PlayLogConfig } from "./config";
import { Point } from "../../api/types";

const EMPTY_ROAD_BUILDING_STATE: RoadBuildingState = {
    active: false,
    road: [],
    possibleConnections: []
}

function useRoadBuilding() {

    // State
    const [roadBuildingState, setRoadBuildingState] = useState<RoadBuildingState>(EMPTY_ROAD_BUILDING_STATE)

    // Functions
    const clearRoadBuilding = useCallback(() => {
        if (PlayLogConfig.roads) {
            console.log('Play (roads): clearing road building state')
        }

        setRoadBuildingState(EMPTY_ROAD_BUILDING_STATE)
    }, [])

    const startRoadBuilding = useCallback((
        road: Point[],
        possibleConnections: Point[]
    ) => {
        if (PlayLogConfig.roads) {
            console.log(
                'Play (roads): starting road building',
                {
                    road,
                    possibleConnections
                }
            )
        }

        setRoadBuildingState({
            active: true,
            road,
            possibleConnections
        })
    }, [])

    const updateRoadBuilding = useCallback((
        road: Point[],
        possibleConnections: Point[]
    ) => {
        if (PlayLogConfig.roads) {
            console.log(
                'Play (roads): updating road building',
                {
                    road,
                    possibleConnections
                }
            )
        }

        setRoadBuildingState({
            active: true,
            road,
            possibleConnections
        })
    }, [])

    return {
        roadBuildingState,
        clearRoadBuilding,
        startRoadBuilding,
        updateRoadBuilding
    }
}

// Exports
export { useRoadBuilding }
