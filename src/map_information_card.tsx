import React, { Component } from 'react';
import { getTerrainForMap, MapInformation } from './api';
import Button from './button';
import Card from './card';
import ExpandCollapseToggle from './expand_collapse_toggle';
import { intToVegetationColor, TerrainAtPoint } from './game_render';
import './map_information_card.css';
import RawRow from './raw_row';
import { terrainInformationToTerrainAtPointList } from './utils';

interface MapThumbnailProps {
    map: MapInformation
    className?: string
}

interface MapThumbnailState {
    terrain?: TerrainAtPoint[]
}

class MapThumbnail extends Component<MapThumbnailProps, MapThumbnailState> {

    private selfRef = React.createRef<HTMLCanvasElement>();

    constructor(props: MapThumbnailProps) {
        super(props);

        this.state = {};
    }

    isContext2D(context: RenderingContext): context is CanvasRenderingContext2D {
        return true;
    }

    async componentDidMount() {
        if (!this.state.terrain) {
            const terrain = await getTerrainForMap(this.props.map.id);

            this.setState({ terrain: terrainInformationToTerrainAtPointList(terrain) });
        }
    }

    componentDidUpdate() {

        if (!this.selfRef.current) {
            console.log("ERROR: no self ref");
            return;
        }

        const ctx = this.selfRef.current.getContext("2d");

        if (!ctx || !this.isContext2D(ctx)) {
            console.log("ERROR: No or invalid context");
            console.log(ctx);
            return;
        }

        /* Draw the terrain */
        if (this.state.terrain) {

            this.state.terrain.forEach(pointTerrainInformation => {

                const colorStraightBelow = intToVegetationColor.get(pointTerrainInformation.straightBelow);
                const colorBelowToTheRight = intToVegetationColor.get(pointTerrainInformation.belowToTheRight);

                const point = pointTerrainInformation.point;

                if (colorStraightBelow) {
                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = colorStraightBelow
                    ctx.rect(point.x, point.y, 1, 1);
                    ctx.fill();

                    ctx.restore();
                }

                if (colorBelowToTheRight) {
                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = colorBelowToTheRight
                    ctx.rect(point.x + 1, point.y, 1, 1);
                    ctx.fill();

                    ctx.restore();
                }
            });

            /* Draw the starting points */
            this.props.map.startingPoints.forEach(point => {
                ctx.save();

                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                ctx.fill();

                ctx.restore();
            })
        }
    }

    render() {

        let className = ""

        if (this.props.className) {
            className = this.props.className;
        }

        return (
            <div className={className}>
                <canvas width={this.props.map.width * 2} height={this.props.map.height} ref={this.selfRef} />
            </div>
        );
    }
}

interface MapInformationCardProps {
    map: MapInformation
    onMapSelected?: ((map: MapInformation) => void)
}

interface MapInformationCardState {
    expanded: boolean
}

class MapInformationCard extends Component<MapInformationCardProps, MapInformationCardState> {

    constructor(props: MapInformationCardProps) {
        super(props)

        this.state = { expanded: false };
    }

    onMapSelected() {
        if (this.props.onMapSelected) {
            this.props.onMapSelected(this.props.map);
        }
    }

    render() {
        return (
            <Card>
                <div className="MapCardTop">
                    <div className="MapCardTitle">{this.props.map.title}</div>

                    <div className="ExpandAndSelectButtons">
                        <Button onButtonClicked={() => this.onMapSelected()}>Select</Button>
                        <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} />
                    </div>
                </div>

                <div style={{ display: this.state.expanded ? undefined : "none" }}>
                    <RawRow>
                        <div className="MapCardAttributes">
                            <div className="MapCardAttribute">Title: {this.props.map.title}</div>
                            <div className="MapCardAttribute">Author: {this.props.map.author}</div>
                            <div className="MapCardAttribute">Dimensions: {this.props.map.width}x{this.props.map.height}</div>
                            <div className="MapCardAttribute">Max players: {this.props.map.maxPlayers}</div>
                        </div>
                        <MapThumbnail map={this.props.map} className="MapThumbnail RowItemRight" />
                    </RawRow>
                </div>

            </Card>
        );
    }
}

export default MapInformationCard;