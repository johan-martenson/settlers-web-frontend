import React, { useState } from 'react'
import { MapInformation } from './api/types'
import { MapList } from './map_list'
import './map_selection.css'
import { Subtitle1 } from '@fluentui/react-components'
import MapInformationCard from './map_information_card'

interface MapSelectionProps {
    onMapSelected: ((map: MapInformation) => void)
    className?: string
}

const MapSelection = ({ onMapSelected }: MapSelectionProps) => {

    const [map, setMap] = useState<MapInformation | undefined>()

    return (
        <div className="select-map">
            <Subtitle1 as="h4" block>Select map</Subtitle1>

            {map &&
                <MapInformationCard map={map} expanded={true} controls={false} />
            }

            <MapList
                onMapSelected={
                    (selectedMap) => {
                        setMap(selectedMap)
                        onMapSelected(selectedMap)
                    }
                }

                defaultSelect
            />
        </div>
    )
}

export default MapSelection
