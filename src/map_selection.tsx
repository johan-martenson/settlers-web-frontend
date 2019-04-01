import React, { Component } from 'react';
import { MapInformation } from './api';
import { MapList } from './map_list';
import './map_selection.css';

interface MapSelectionProps {
    onMapSelected: ((map: MapInformation) => void)
    className?: string
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

        let className = this.props.className ? this.props.className : "";

        className = className + " MapSelection";

        return (
            <div className={className}>

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
