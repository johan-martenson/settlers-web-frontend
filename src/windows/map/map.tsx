import React, { useEffect, useState } from "react"
import { ButtonRow, Window } from "../../components/dialog"
import { makeImageFromMap } from "../../utils/utils"
import { api } from "../../api/ws-api"
import { Button } from "@fluentui/react-components"
import { UiIcon } from "../../icons/icon"

type MapViewProps = {
    onClose: () => void
    onRaise: () => void
}

const MapView = ({ onClose, onRaise }: MapViewProps) => {
    // eslint-disable-next-line
    const [drawFogOfWar, setDrawFogOfWar] = useState<boolean>(true)
    const [drawPlayerLand, setDrawPlayerLand] = useState<boolean>(true)
    const [drawHouses, setDrawHouses] = useState<boolean>(true)
    const [mapImage, setMapImage] = useState<HTMLImageElement>()
    const [drawRoads, setDrawRoads] = useState<boolean>(true)
    const [drawCount, setDrawCount] = useState<number>(0)
    const [hover, setHover] = useState<string>()

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

    useEffect(
        () => {
            async function getAndRenderMap() {
                const gameInformation = await api.getGameInformation()
                const map = await api.getMap(gameInformation.map.id)

                if (map) {
                    const mapImage = await makeImageFromMap(map,
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

                    setMapImage(mapImage)

                    if (!mapImage) {
                        console.error('Failed to create map image')
                    }
                } else {
                    console.error('Failed to get map')
                }
            }

            getAndRenderMap()
        }, [api.map, api.discoveredPoints, drawFogOfWar, drawHouses, drawPlayerLand, drawRoads, drawCount])

    return (
        <Window onClose={onClose} onRaise={onRaise} heading='Map' hoverInfo={hover}>
            <img src={mapImage?.src ?? ''} />
            <ButtonRow>
                <Button
                    onClick={() => setDrawPlayerLand(prev => !prev)}
                    onMouseEnter={() => setHover('Show player land')}
                    onMouseLeave={() => setHover(undefined)}
                >
                    <UiIcon type='OWNED_AREA_ON_MAP' scale={0.5} />
                </Button>
                <Button
                    onClick={() => setDrawHouses(prev => !prev)}
                    onMouseEnter={() => setHover('Show houses')}
                    onMouseLeave={() => setHover(undefined)}
                >
                    <UiIcon type='OWNED_BUILDINGS_ON_MAP' scale={0.5} />
                </Button>
                <Button
                    onClick={() => setDrawRoads(prev => !prev)}
                    onMouseEnter={() => setHover('Show roads')}
                    onMouseLeave={() => setHover(undefined)}
                >
                    <UiIcon type='OWNED_ROADS_ON_MAP' scale={0.5} />
                </Button>

            </ButtonRow>
        </Window>
    )
}

export { MapView }