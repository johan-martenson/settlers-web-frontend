import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ButtonRow, WindowWithTyping } from "../../components/dialog"
import { makeImageFromMap } from "../../utils/utils"
import { api } from "../../api/ws-api"
import { Button } from "@fluentui/react-components"
import { UiIcon } from "../../icons/icon"
import { MapId } from "../../api/types"
import { useMapWithTerrain } from "../../utils/hooks/hooks"
import { GenericCommand } from "../../screens/play/type_control"

type MapViewProps = {
    mapId: MapId
    onClose: () => void
    onRaise: () => void
}

const MapView = ({ mapId, onClose, onRaise }: MapViewProps) => {

    // State
    // eslint-disable-next-line
    const [drawFogOfWar, setDrawFogOfWar] = useState<boolean>(true)
    const [drawPlayerLand, setDrawPlayerLand] = useState<boolean>(true)
    const [drawHouses, setDrawHouses] = useState<boolean>(true)
    const [drawRoads, setDrawRoads] = useState<boolean>(true)
    const [drawCount, setDrawCount] = useState<number>(0)
    const [hover, setHover] = useState<string>()

    // Hooks
    const mapWithTerrain = useMapWithTerrain(mapId)

    // Effects
    // Effect: make the component redraw when the game changes
    useEffect(
        () => {
            function redraw() {
                setDrawCount(prev => prev + 1)
            }

            function subscribeToChanges() {
                api.addHousesAddedOrRemovedListener(redraw)
                api.addRoadsListener(redraw)
                api.addOwnedLandListener(redraw)
                api.addDiscoveredPointsListener(redraw)
            }

            function unsubscribeFromChanges() {
                api.removeHousesAddedOrRemovedListener(redraw)
                api.removeRoadsListener(redraw)
                api.removeOwnedLandListener(redraw)
                api.removeDiscoveredPointsListener(redraw)
            }

            subscribeToChanges()

            return () => unsubscribeFromChanges()
        }, [])

    // Functions
    const toggleDrawPlayerLand = useCallback(() => {
        setDrawPlayerLand(prev => !prev)
    }, [])

    const toggleDrawHouses = useCallback(() => {
        setDrawHouses(prev => !prev)
    }, [])

    const toggleDrawRoads = useCallback(() => {
        setDrawRoads(prev => !prev)
    }, [])

    const clearHover = useCallback(() => {
        setHover(undefined)
    }, [])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<MapViewProps>>()

        cmds.set('Draw player land', {
            action: (_props: MapViewProps) => {
                setDrawPlayerLand(prev => !prev)
            }
        })

        cmds.set('Draw houses', {
            action: (_props: MapViewProps) => {
                setDrawHouses(prev => !prev)
            }
        })

        cmds.set('Draw roads', {
            action: (_props: MapViewProps) => {
                setDrawRoads(prev => !prev)
            }
        })

        cmds.set('Close window', {
            action: (_props: MapViewProps) => onClose()
        })

        return cmds
    }, [onClose])

    const mapImage = useMemo(() => {
        if (mapWithTerrain) {
            const mapImage = makeImageFromMap(mapWithTerrain,
                {
                    scaleDown: 2,
                    blockSize: 4,
                    drawStartingPoints: false,
                    drawFogOfWar
                },
                api.discoveredPoints,
                drawHouses ? api.houses.values() : undefined,
                drawRoads ? api.roads.values() : undefined,
                drawPlayerLand ? api.players.values() : undefined
            )

            if (!mapImage) {
                console.error('Failed to create map image')
            }

            return mapImage
        } else {
            console.error('Failed to get map')
        }

        return undefined
    }, [mapWithTerrain, api.discoveredPoints.size, drawFogOfWar, drawHouses, drawPlayerLand, drawRoads, drawCount])

    // Rendering
    return (
        <WindowWithTyping<MapViewProps>
            onClose={onClose}
            onRaise={onRaise}
            heading='Map'
            commands={commands}
            param={{ mapId, onClose, onRaise }}
            hoverInfo={hover}>
            <div>{mapWithTerrain?.name}</div>
            <img src={mapImage?.src ?? ''} />
            <ButtonRow>
                <Button
                    style={{ backgroundColor: drawPlayerLand ? 'lightblue' : undefined }}
                    onClick={toggleDrawPlayerLand}
                    onMouseEnter={() => setHover('Show player land')}
                    onMouseLeave={clearHover}
                >
                    <UiIcon type='OWNED_AREA_ON_MAP' scale={0.5} />
                </Button>
                <Button
                    style={{ backgroundColor: drawHouses ? 'lightblue' : undefined }}
                    onClick={toggleDrawHouses}
                    onMouseEnter={() => setHover('Show houses')}
                    onMouseLeave={clearHover}
                >
                    <UiIcon type='OWNED_BUILDINGS_ON_MAP' scale={0.5} />
                </Button>
                <Button
                    style={{ backgroundColor: drawRoads ? 'lightblue' : undefined }}
                    onClick={toggleDrawRoads}
                    onMouseEnter={() => setHover('Show roads')}
                    onMouseLeave={clearHover}
                >
                    <UiIcon type='OWNED_ROADS_ON_MAP' scale={0.5} />
                </Button>

            </ButtonRow>
        </WindowWithTyping>
    )
}

export { MapView }