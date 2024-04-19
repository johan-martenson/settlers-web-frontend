import React, { useEffect, useState } from 'react'
import { getMaps } from './api/rest-api'
import MapInformationCard from './map_information_card'
import './map_list.css'
import { MapInformation } from './api/types'

interface MapListProps {
    onMapSelected: ((map: MapInformation) => void)
    defaultSelect?: boolean
    minPlayers: number
    filter?: string
}

const MapList = ({ minPlayers, defaultSelect, filter, onMapSelected }: MapListProps) => {
    const [maps, setMaps] = useState<MapInformation[]>([])

    useEffect(
        () => {
            (async () => {
                const maps = await getMaps()

                defaultSelect && onMapSelected(maps[0])

                setMaps(maps)
            })().then()
        }, [])

    return (
        <div className="map-list">
            {maps
            .filter(map => map.maxPlayers >= minPlayers)
            .filter(map => filter === undefined || map.title.toLowerCase().includes(filter.toLowerCase()))
            .map(
                (map, index) => {
                    return (
                        <div key={index} >
                            <MapInformationCard map={map} onMapSelected={() => onMapSelected(map)} />
                        </div>
                    )
                }
            )
            }
        </div>
    )
}

export { MapList }

