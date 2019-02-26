import React, { Component } from 'react';
import { getMaps, MapId, MapInformation } from './api';
import Button from './button';
import MapInformationCard from './map_information_card'
import Row from './row';
import './map_list.css';
import RawRow from './raw_row';

interface MapListProps {
    onMapSelected: ((map: MapInformation) => void)
    selectedMap?: MapInformation
}

interface MapListState {
    maps: MapInformation[];
}

class MapList extends Component<MapListProps, MapListState> {

    constructor(props: MapListProps) {
        super(props);

        this.state = { maps: [] };
    }

    async componentDidMount() {

        const maps = await getMaps();

        this.setState(
            {
                maps: maps,
            }
        );
    }

    onMapSelected(map: MapInformation) {
        this.props.onMapSelected(map);
    }

    render() {
        return (
            <div>
                {this.state.maps.map(
                    (map, index) => {

                        return (
                            <RawRow key={index} className="MapListItem">

                                <div className="MapInformationCard">
                                    <MapInformationCard map={map} />
                                </div>
                                <div className="MapSelectButton">
                                    {this.props.selectedMap &&
                                        <Button label="Selected"
                                            selected={true}
                                            onButtonClicked={
                                                () => {
                                                    console.log("Choosing map" + JSON.stringify(map));
                                                    this.onMapSelected(map);
                                                }
                                            }
                                        />
                                    }

                                    {!this.props.selectedMap &&
                                        <Button label="Select"
                                            onButtonClicked={
                                                () => {
                                                    this.onMapSelected(map);
                                                }
                                            }
                                        />
                                    }
                                </div>
                            </RawRow>
                        );
                    }
                )
                }
            </div>
        );
    }
}

export { MapList };

