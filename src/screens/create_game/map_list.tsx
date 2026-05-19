import React, { useEffect, useState } from 'react'
import MapInformationCard from './map_information_card'
import './map_list.css'
import { MapWithTerrain } from '../../api/types'
import { useMapsWithTerrain } from '../../utils/hooks/hooks'

// Types
type MapListProps = {
    defaultSelect?: boolean
    minPlayers: number
    filterTitle?: string
    filterAuthor?: string
    filterMinPlayers?: number
    filterMaxPlayers?: number
    onMapSelected: (map: MapWithTerrain) => void
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

    // State
    const [defaultSelectDone, setDefaultSelectDone] = useState(false)

    // Monitoring hooks
    const maps = useMapsWithTerrain()

    // Effects
    useEffect(() => {
        if (defaultSelect && !defaultSelectDone && maps && maps.length > 0) {
            onMapSelected(maps[0])

            setDefaultSelectDone(true)
        }
    }, [maps, defaultSelect, onMapSelected, defaultSelectDone])

    // Rendering
    const matches = maps
        .filter(map => map.maxPlayers >= minPlayers)
        .filter(map => filterTitle === '' || map.name.toLowerCase().includes(filterTitle.toLowerCase()))
        .filter(map => filterAuthor === '' || map.author.toLowerCase().includes(filterAuthor.toLowerCase()))
        .filter(map => filterMinPlayers <= map.maxPlayers)
        .filter(map => filterMaxPlayers >= map.maxPlayers)

    // Rendering
    return (
        <div>
            <div>
                {`${matches.length} of ${maps.length}`}
            </div>
            <div className='map-list'>
                {matches.map((map) => (
                    <div key={map.id}><MapInformationCard map={map} onMapSelected={() => onMapSelected(map)} /></div>
                ))}
            </div>
        </div>
    )
}

export { MapList }

