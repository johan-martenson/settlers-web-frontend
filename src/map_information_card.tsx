import React, { useEffect, useState } from 'react'
import { MapInformation, MapId } from './api/types'
import { Button, Text, Caption1 } from "@fluentui/react-components"
import { Card, CardHeader } from "@fluentui/react-components"
import './map_information_card.css'
import { makeImageFromMap } from './utils'

const cachedMapImages = new Map<MapId, HTMLImageElement>()

interface MapInformationCardProps {
    map: MapInformation
    expanded?: boolean
    controls?: boolean
    onMapSelected?: ((map: MapInformation) => void)
}

function MapInformationCard(props: MapInformationCardProps) {
    const [mapImage, setMapImage] = useState<HTMLImageElement>()

    useEffect(
        () => {
            const cachedImage = cachedMapImages.get(props.map.id)

            if (cachedImage) {
                setMapImage(cachedImage)
            } else {
                makeImageFromMap(props.map, 4, 2).then(
                    (image) => {
                        if (image) {
                            setMapImage(image)

                            cachedMapImages.set(props.map.id, image)
                        }
                    }
                )
            }
        },
        [props.map.id]
    )

    if (props.onMapSelected) {
        return (
            <Card>
                <CardHeader
                    image={<img src={(mapImage) ? mapImage.src : ""} />}
                    header={<Text weight="semibold">{props.map.title}</Text>}
                    description={
                        <Caption1>{props.map.maxPlayers} players, {props.map.width}x{props.map.height}, by {props.map.author}</Caption1>
                    }
                    action={<Button onClick={() => {
                        if (props.onMapSelected) {
                            props.onMapSelected(props.map)
                        }
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
                    header={<Text weight="semibold">{props.map.title}</Text>}
                    description={
                        <Caption1>{props.map.maxPlayers} players, {props.map.width}x{props.map.height}, by {props.map.author}</Caption1>
                    }
                />
            </Card>
        )
    }
}

export default MapInformationCard