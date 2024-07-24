import React, { useEffect, useState } from 'react'
import { MapInformation, MapId } from './api/types'
import { Button, Text, Caption1 } from "@fluentui/react-components"
import { Card, CardHeader } from "@fluentui/react-components"
import './map_information_card.css'
import { makeImageFromMap } from './utils'

const cachedMapImages = new Map<MapId, HTMLImageElement>()

interface MapInformationCardProps {
    map: MapInformation
    onMapSelected?: ((map: MapInformation) => void)
}

function MapInformationCard({ map, onMapSelected }: MapInformationCardProps) {
    const [mapImage, setMapImage] = useState<HTMLImageElement>()

    useEffect(
        () => {
            const cachedImage = cachedMapImages.get(map.id)

            if (cachedImage) {
                setMapImage(cachedImage)
            } else {
                makeImageFromMap(map, 4, 2).then(
                    (image) => {
                        if (image) {
                            setMapImage(image)

                            cachedMapImages.set(map.id, image)
                        }
                    }
                )
            }
        },
        [map.id]
    )

    if (onMapSelected) {
        return (
            <Card>
                <CardHeader
                    image={<img src={(mapImage) ? mapImage.src : ""} />}
                    header={<Text weight="semibold">{map.name}</Text>}
                    description={
                        <Caption1>{map.maxPlayers} players, {map.width}x{map.height}, by {map.author}</Caption1>
                    }
                    action={<Button onClick={() => {
                        onMapSelected(map)
                    }
                    }>Select</Button>}
                />
            </Card>
        )
    } else {
        return (
            <Card>
                <CardHeader
                    image={<img src={(mapImage) ? mapImage.src : ""} />}
                    header={<Text weight="semibold">{map.name}</Text>}
                    description={
                        <Caption1>{map.maxPlayers} players, {map.width}x{map.height}, by {map.author}</Caption1>
                    }
                />
            </Card>
        )
    }
}

export default MapInformationCard