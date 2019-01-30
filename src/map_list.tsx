import React, { Component } from 'react';
import { MapInformation, getMaps } from './api';
import Button from './button';

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

        this.state = {maps: []};
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
    
    render () {
        return (
            <div>
                {this.state.maps.map(
                    (map, index) => {
                        
                        return (
                            <div key={index}>

                                {this.props.selectedMap &&
                                    <Button label={map.title + " (Max " + map.maxPlayers + " players)"}
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
                                    <Button label={map.title + " (Max " + map.maxPlayers + " players)"}
                                        onButtonClicked={
                                            () => {
                                                console.log("Choosing map" + JSON.stringify(map));
                                                this.onMapSelected(map);
                                            }
                                        }
                                    />
                             
                                }
                             </div>
                        );
                    }
                )
                }
            </div>
        );
    }
}

export {
    MapList
};
    
