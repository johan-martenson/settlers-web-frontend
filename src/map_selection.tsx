import React, { Component } from 'react';
import { MapInformation } from './api';
import { MapList } from './map_list';
import './map_selection.css';

interface MapSelectionProps {
    onMapSelected: ((map: MapInformation) => void)
}

interface MapSelectionState {
    map?: MapInformation
}

class MapSelection extends Component<MapSelectionProps, MapSelectionState> {

    constructor(props: MapSelectionProps) {
        super(props);

        this.state = {}
    }

    render() {

        return (
            <div className="MapSelection">

                <div>
                    Map: {this.state.map && this.state.map.title}
                </div>

                <MapList
                    onMapSelected={
                        (map) => {
                            this.setState({ map: map });
                            this.props.onMapSelected(map);
                        }
                    }
                />
            </div>
        );
    }
}

export default MapSelection;
