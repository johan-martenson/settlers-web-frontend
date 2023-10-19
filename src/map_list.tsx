import React, { Component } from 'react'
import { getMaps } from './api'
import MapInformationCard from './map_information_card'
import './map_list.css'
import { MapInformation } from './api/types'

interface MapListProps {
    onMapSelected: ((map: MapInformation) => void)
    defaultSelect?: boolean
}

interface MapListState {
    maps: MapInformation[]
}

class MapList extends Component<MapListProps, MapListState> {

    constructor(props: MapListProps) {
        super(props)

        this.state = { maps: [] }
    }

    async componentDidMount(): Promise<void> {

        const maps = await getMaps()

        if (this.props.defaultSelect) {
            this.props.onMapSelected(maps[0])
        }

        this.setState(
            {
                maps: maps,
            }
        )
    }

    onMapSelected(map: MapInformation): void {
        this.props.onMapSelected(map)
    }

    render(): JSX.Element {
        return (
            <div className="map-list">
                {this.state.maps.map(
                    (map, index) => {

                        return (
                            <div key={index} >
                                <MapInformationCard map={map} onMapSelected={this.onMapSelected.bind(this)} />
                            </div>
                        )
                    }
                )
                }
            </div>
        )
    }
}

export { MapList }

