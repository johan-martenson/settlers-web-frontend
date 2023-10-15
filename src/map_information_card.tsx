import React, { Component } from 'react';
import { MapInformation, MapId, TerrainAtPoint } from './api';
import { Button, Text, Caption1 } from "@fluentui/react-components";
import { Card, CardHeader } from "@fluentui/react-components";
import './map_information_card.css';
import { makeImageFromMap } from './utils';

const cachedMapImages = new Map<MapId, HTMLImageElement>()

interface MapInformationCardProps {
    map: MapInformation
    expanded?: boolean
    controls?: boolean
    onMapSelected?: ((map: MapInformation) => void)
}

interface MapInformationCardState {
    expanded: boolean
    terrain?: TerrainAtPoint[]
    mapImage?: HTMLImageElement
}

class MapInformationCard extends Component<MapInformationCardProps, MapInformationCardState> {

    constructor(props: MapInformationCardProps) {
        super(props)

        this.state = {
            expanded: this.props.expanded ? this.props.expanded : false,
        }
    }

    async componentDidMount(): Promise<void> {
        console.log("Component did mount")

        const mapImage = await makeImageFromMap(this.props.map)

        if (!mapImage) {
            console.log("No image!")

            return
        }

        console.log("Got map image")
        console.log(mapImage)

        cachedMapImages.set(this.props.map.id, mapImage)

        this.setState({ mapImage })
    }

    async componentDidUpdate(): Promise<void> {
        const mapImage = cachedMapImages.get(this.props.map.id)

        if (mapImage) {
            this.setState({ mapImage })
        } else {
            const mapImage = await makeImageFromMap(this.props.map)

            if (!mapImage) {
                return
            }

            this.setState({ mapImage })

            cachedMapImages.set(this.props.map.id, mapImage)
        }
    }

    shouldComponentUpdate(nextProps: MapInformationCardProps, nextState: MapInformationCardState): boolean {
        return this.props.map.id !== nextProps.map.id ||
            this.props.onMapSelected !== nextProps.onMapSelected ||
            this.state.expanded !== nextState.expanded ||
            this.state.mapImage !== nextState.mapImage
    }

    onMapSelected(): void {

        if (this.props.onMapSelected) {
            this.props.onMapSelected(this.props.map)
        }
    }

    render(): JSX.Element {
        console.log(this.state.mapImage)

        if (this.props.onMapSelected) {
            return (
                <Card>
                    <CardHeader
                        image={<img src={(this.state.mapImage) ? this.state.mapImage.src : ""} />}
                        header={<Text weight="semibold">{this.props.map.title}</Text>}
                        description={
                            <Caption1>{this.props.map.maxPlayers} players, {this.props.map.width}x{this.props.map.height}, by {this.props.map.author}</Caption1>
                        }
                        action={ <Button onClick={this.onMapSelected.bind(this)}>Select</Button> }
                    />
                </Card>
            )
        } else {
            return (
                <Card>
                    <CardHeader
                        image={<img src={(this.state.mapImage) ? this.state.mapImage.src : ""} />}
                        header={<Text weight="semibold">{this.props.map.title}</Text>}
                        description={
                            <Caption1>{this.props.map.maxPlayers} players, {this.props.map.width}x{this.props.map.height}, by {this.props.map.author}</Caption1>
                        }
                    />
                </Card>
            )
        }

    }
}

export default MapInformationCard