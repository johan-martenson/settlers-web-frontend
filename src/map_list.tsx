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
    onMapSelected: (map: MapInformation) => void
}

// Constants
const DEFAULT_MAX_PLAYERS = 8

// React components
const MapList = ({
    minPlayers,
    defaultSelect,
    filterTitle = '',
    filterAuthor = '',
    filterMinPlayers = 0,
    filterMaxPlayers = DEFAULT_MAX_PLAYERS,
    onMapSelected
}: MapListProps) => {
    const [maps, setMaps] = useState<MapInformation[]>([])

    useEffect(() => {
        (async () => {
            const maps = await api.getMaps()

            defaultSelect && onMapSelected(maps[0])

            setMaps(maps)
        })()
    }, [defaultSelect, onMapSelected])

    const matches = maps
        .filter(map => map.maxPlayers >= minPlayers)
        .filter(map => filterTitle === '' || map.name.toLowerCase().includes(filterTitle.toLowerCase()))
        .filter(map => filterAuthor === '' || map.author.toLowerCase().includes(filterAuthor.toLowerCase()))
        .filter(map => filterMinPlayers <= map.maxPlayers)
        .filter(map => filterMaxPlayers >= map.maxPlayers)

    return (
        <div>
            <div>
                {`${matches.length} of ${maps.length}`}
            </div>
            <div className='map-list'>
                {matches.map((map, index) => (
                    <div key={index} >
                        <MapInformationCard map={map} onMapSelected={() => onMapSelected(map)} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export { MapList }

