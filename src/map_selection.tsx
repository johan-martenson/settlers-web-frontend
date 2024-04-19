import React, { useState } from 'react'
import { MapInformation } from './api/types'
import { MapList } from './map_list'
import './map_selection.css'
import { Divider, Input, InputOnChangeData, Label, Subtitle1 } from '@fluentui/react-components'
import MapInformationCard from './map_information_card'

interface MapSelectionProps {
    minPlayers: number
    onMapSelected: ((map: MapInformation) => void)
    className?: string
}

const MapSelection = ({ minPlayers, onMapSelected }: MapSelectionProps) => {
    const [map, setMap] = useState<MapInformation | undefined>()
    const [search, setSearch] = useState<string>()

    return (
        <div className="select-map">
            <Subtitle1 as="h4" block>Map</Subtitle1>

            {map &&
                <MapInformationCard map={map} expanded={true} controls={false} />
            }

            <Divider />

            <div>
                <Label>Search</Label>
                <Input type="text"
                    onChange={

                        // eslint-disable-next-line
                        (event: React.FormEvent<HTMLInputElement>, data: InputOnChangeData) => {
                            setSearch(data.value)
                        }
                    }

                    defaultValue={""}
                />

            </div>

            <MapList
                onMapSelected={
                    (selectedMap) => {
                        setMap(selectedMap)
                        onMapSelected(selectedMap)
                    }
                }

                minPlayers={minPlayers}
                filter={search}
                defaultSelect
            />
        </div>
    )
}

export default MapSelection
