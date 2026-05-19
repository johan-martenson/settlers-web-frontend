import React, { useEffect, useState } from 'react'
import { MapInformation, MapId } from '../../api/types'
import { Button, Text, Caption1 } from '@fluentui/react-components'
import { Card, CardHeader } from '@fluentui/react-components'
import './map_information_card.css'
import { makeImageFromMap } from '../../utils/utils'
import { useMapWithTerrain } from '../../utils/hooks/hooks'

// Types
type MapInformationCardProps = {
    map: MapInformation
    onMapSelected?: (map: MapInformation) => void
}

// State
const cachedMapImages = new Map<MapId, HTMLImageElement>()

// React components
function MapInformationCard({ map, onMapSelected }: MapInformationCardProps) {

    // State
    const [mapImage, setMapImage] = useState<HTMLImageElement>()

    // Hooks
    const mapWithTerrain = useMapWithTerrain(map.id)

    // Effects
    useEffect(() => {
        let cancelled = false
        const cachedImage = cachedMapImages.get(map.id)

        if (cachedImage) {
            setMapImage(cachedImage)
        } else if (mapWithTerrain !== undefined) {
            const image = makeImageFromMap(mapWithTerrain,
                {
                    scaleDown: 1,
                    blockSize: 2,
                    drawStartingPoints: true
                },
                undefined,
                undefined,
                undefined,
                undefined
            )

            if (image && !cancelled) {
                setMapImage(image)
                cachedMapImages.set(map.id, image)
            }
        }

        return () => {
            cancelled = true
        }
    }, [mapWithTerrain])

    return (
        <Card>
            <CardHeader
                image={<img src={mapImage?.src ?? ''} alt={`Map preview of ${map.name}`} />}
                header={<Text weight='semibold'>{map.name}</Text>}
                description={
                    <Caption1>{map.maxPlayers} players, {map.width}x{map.height}, by {map.author}</Caption1>
                }
                action={onMapSelected && (
                    <Button onClick={() => onMapSelected(map)}>
                        Select
                    </Button>
                )}
            />
        </Card>
    )
}

export default MapInformationCard