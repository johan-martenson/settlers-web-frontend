import React, { useEffect, useState } from 'react'
import { getMaps } from './api/rest-api'
import MapInformationCard from './map_information_card'
import './map_list.css'
import { MapInformation } from './api/types'

interface MapListProps {
    onMapSelected: ((map: MapInformation) => void)
    defaultSelect?: boolean
}

const MapList = ({ defaultSelect, onMapSelected }: MapListProps) => {
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
            {maps.map(
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

