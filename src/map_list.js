import React, { Component } from 'react';
import { getMaps } from './api.js';
import Button from './button.js';

class MapList extends Component {

    constructor(props) {
        super(props);

        this.state = {loadedMaps: false};
    }

    componentDidMount() {

        getMaps().then(
            (maps) => {
                this.setState(
                    {maps: maps,
                     loadedMaps: true
                    });
                console.log("Loaded maps: " + JSON.stringify(maps));
            }
        ).catch(
            (a, b, c) => {
                console.log("Failed to get maps: " + a + " " + b + " " + c);
            }
        )
    }

    onMapSelected(map) {
        console.log("On Map selected: " + JSON.stringify(map));
        this.props.onMapSelected(map);
        console.log("Map is still " + map);
    }
    
    render() {
        return (
                <div>
                {this.state.loadedMaps && this.state.maps.map(
                    (map, index) => {
                        
                        return (
                                <div key={index}>

                            {typeof(this.props.selectedMap) !== "undefined" &&
                                <Button label={map.title + " (Max " + map.maxPlayers + " players)"}
                                    selected="true"
                                    onButtonClicked={
                                        (event) => {
                                            console.log("Choosing map" + JSON.stringify(map));
                                            this.onMapSelected(map);
                                        }
                                    }
                                />
                            }

                            {typeof(this.props.selectedMap) === "undefined" &&
                                <Button label={map.title + " (Max " + map.maxPlayers + " players)"}
                                    onButtonClicked={
                                        (event) => {
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
    
