import React, { Component } from 'react'
import { MapInformation } from './api'
import { MapList } from './map_list'
import './map_selection.css'
import { Subtitle1 } from '@fluentui/react-components'
import MapInformationCard from './map_information_card'

interface MapSelectionProps {
    onMapSelected: ((map: MapInformation) => void)
    className?: string
}

interface MapSelectionState {
    map?: MapInformation
}

class MapSelection extends Component<MapSelectionProps, MapSelectionState> {

    constructor(props: MapSelectionProps) {
        super(props)

        this.state = {}
    }

    render(): JSX.Element {

        return (
            <div className="select-map">
                <Subtitle1 as="h4" block>Select map</Subtitle1>

                {this.state.map &&
                    <MapInformationCard map={this.state.map} expanded={true} controls={false} />
                }

                <MapList
                    onMapSelected={
                        (map) => {
                            this.setState({ map: map })
                            this.props.onMapSelected(map)
                        }
                    }

                    defaultSelect
                />
            </div>
        )
    }
}

export default MapSelection
