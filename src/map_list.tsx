import React, { useEffect, useState } from 'react'
import MapInformationCard from './map_information_card'
import './map_list.css'
import { MapInformation } from './api/types'
import { api } from './api/ws-api'

// Types
type MapListProps = {
    defaultSelect?: boolean
    minPlayers: number
    filterTitle?: string
    filterAuthor?: string
    filterMinPlayers?: number
    filterMaxPlayers?: number
    onMapSelected: ((map: MapInformation) => void)
}

// React components
const MapList = ({ minPlayers, defaultSelect, filterTitle, filterAuthor, filterMinPlayers, filterMaxPlayers, onMapSelected }: MapListProps) => {
    const [maps, setMaps] = useState<MapInformation[]>([])

    useEffect(
        () => {
            (async () => {
                const maps = await api.getMaps()

                defaultSelect && onMapSelected(maps[0])

                setMaps(maps)
            })().then()
        }, [])

    const matches = maps
        .filter(map => map.maxPlayers >= minPlayers)
        .filter(map => filterTitle === undefined || filterTitle === "" || map.name.toLowerCase().includes(filterTitle.toLowerCase()))
        .filter(map => filterAuthor === undefined || filterAuthor === "" || map.author.toLowerCase().includes(filterAuthor.toLowerCase()))
        .filter(map => (filterMinPlayers ?? 0) <= map.maxPlayers)
        .filter(map => (filterMaxPlayers ?? 8) >= map.maxPlayers)

    return (
        <div>
            <div>
                {`${matches.length} of ${maps.length}`}
            </div>
            <div className="map-list">
                {matches.map((map, index) => {
                    return (
                        <div key={index} >
                            <MapInformationCard map={map} onMapSelected={() => onMapSelected(map)} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export { MapList }

