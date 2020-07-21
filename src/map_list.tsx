import React, { Component } from 'react'
import { getMaps, MapInformation } from './api'
import MapInformationCard from './map_information_card'
import './map_list.css'

interface MapListProps {
    onMapSelected: ((map: MapInformation) => void)
}

interface MapListState {
    maps: MapInformation[]
}

class MapList extends Component<MapListProps, MapListState> {

    constructor(props: MapListProps) {
        super(props)

        this.state = { maps: [] }
    }

    async componentDidMount() {

        const maps = await getMaps()

        this.setState(
            {
                maps: maps,
            }
        )
    }

    onMapSelected(map: MapInformation): void {
        this.props.onMapSelected(map)
    }

    render() {
        return (
            <div className="MapList">
                {this.state.maps.map(
                    (map, index) => {

                        return (
                            <div key={index} className="MapListItem">
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

