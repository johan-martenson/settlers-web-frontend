import React, { Component } from 'react'
import { getTerrainForMap, MapInformation, MapId, TerrainAtPoint } from './api'
import Button from './button'
import Card from './card'
import ExpandCollapseToggle from './expand_collapse_toggle'
import { intToVegetationColor } from './game_render'
import './map_information_card.css'
import RawRow from './raw_row'
import { terrainInformationToTerrainAtPointList, isContext2D, vegetationToInt, arrayToRgbStyle } from './utils'

interface MapThumbnailProps {
    map: MapInformation
    className?: string
    terrain?: TerrainAtPoint[]
}

interface MapThumbnailState {
    cachedMapId?: MapId
    terrain?: TerrainAtPoint[]
    image?: ImageData
}

class MapThumbnail extends Component<MapThumbnailProps, MapThumbnailState> {

    private selfRef = React.createRef<HTMLCanvasElement>()

    constructor(props: MapThumbnailProps) {
        super(props)

        this.state = { terrain: this.props.terrain ? this.props.terrain : undefined }
    }

    async componentDidMount() {

        let terrain = this.state.terrain

        /* Get the terrain */
        if (!terrain) {
            const terrainInformation = await getTerrainForMap(this.props.map.id)

            terrain = terrainInformationToTerrainAtPointList(terrainInformation)
        }

        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = this.props.map.width * 2
        offscreenCanvas.height = this.props.map.height

        const ctx = offscreenCanvas.getContext("2d", { alpha: false })

        if (ctx) {
            this.setState(
                {
                    image: this.renderMap(ctx, terrain),
                    cachedMapId: this.props.map.id,
                    terrain: terrain
                }
            )
        }
    }

    async componentDidUpdate() {

        if (!this.selfRef.current) {
            console.log("ERROR: no self ref")
            return
        }

        const ctx = this.selfRef.current.getContext("2d")

        if (!ctx || !isContext2D(ctx)) {
            console.log("ERROR: No or invalid context")
            console.log(ctx)
            return
        }

        console.log("Drawing map thumbnail")

        if (this.state.cachedMapId !== this.props.map.id) {

            const terrainInformation = await getTerrainForMap(this.props.map.id)

            const terrain = terrainInformationToTerrainAtPointList(terrainInformation)

            const offscreenCanvas = document.createElement('canvas')
            offscreenCanvas.width = this.props.map.width * 2
            offscreenCanvas.height = this.props.map.height

            const ctx = offscreenCanvas.getContext("2d", { alpha: false })

            if (ctx) {
                this.setState(
                    {
                        image: this.renderMap(ctx, terrain),
                        cachedMapId: this.props.map.id,
                        terrain: terrain
                    }
                )
            }
        }

        if (this.state.image) {
            ctx.putImageData(this.state.image, 0, 0)
        }
    }

    private renderMap(ctx: CanvasRenderingContext2D, terrain: TerrainAtPoint[]) {

        const waterIntValue = vegetationToInt.get("W")

        if (waterIntValue) {
            const waterColor = intToVegetationColor.get(waterIntValue)

            if (waterColor) {
                ctx.fillStyle = arrayToRgbStyle(waterColor)
            } else {
                ctx.fillStyle = "gray"
            }
        }

        ctx.rect(0, 0, this.props.map.width * 2, this.props.map.height)

        ctx.fill()

        terrain.forEach(pointTerrainInformation => {

            const point = pointTerrainInformation.point

            if (point.x % 4 === 0 && point.y % 4 === 0) {

                const colorStraightBelow = intToVegetationColor.get(pointTerrainInformation.below)
                const colorBelowToTheRight = intToVegetationColor.get(pointTerrainInformation.downRight)

                if (colorStraightBelow && pointTerrainInformation.below !== waterIntValue) {
                    ctx.beginPath()
                    ctx.fillStyle = arrayToRgbStyle(colorStraightBelow)
                    ctx.rect(point.x, point.y, 4, 4)
                    ctx.fill()
                }

                if (colorBelowToTheRight && pointTerrainInformation.downRight !== waterIntValue) {
                    ctx.beginPath()
                    ctx.fillStyle = arrayToRgbStyle(colorBelowToTheRight)
                    ctx.rect(point.x + 4, point.y, 4, 4)
                    ctx.fill()
                }
            }
        }
        )

        /* Draw the starting points */
        ctx.fillStyle = 'yellow'
        this.props.map.startingPoints.forEach(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
            ctx.fill()
        }
        )

        return ctx.getImageData(0, 0, this.props.map.width * 2, this.props.map.height)
    }

    private renderMapHighResolution(ctx: CanvasRenderingContext2D, terrain: TerrainAtPoint[]) {

        terrain.forEach(pointTerrainInformation => {

            const colorStraightBelow = intToVegetationColor.get(pointTerrainInformation.below)
            const colorBelowToTheRight = intToVegetationColor.get(pointTerrainInformation.downRight)
            const point = pointTerrainInformation.point

            if (colorStraightBelow) {
                ctx.beginPath()
                ctx.fillStyle = arrayToRgbStyle(colorStraightBelow)
                ctx.rect(point.x, point.y, 1, 1)
                ctx.fill()
            }

            if (colorBelowToTheRight) {
                ctx.beginPath()
                ctx.fillStyle = arrayToRgbStyle(colorBelowToTheRight)
                ctx.rect(point.x + 1, point.y, 1, 1)
                ctx.fill()
            }
        }
        )

        /* Draw the starting points */
        ctx.fillStyle = 'yellow'
        this.props.map.startingPoints.forEach(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
            ctx.fill()
        }
        )

        return ctx.getImageData(0, 0, this.props.map.width * 2, this.props.map.height)
    }

    render() {

        let className = "MapThumbnail"

        if (this.props.className) {
            className = className + " " + this.props.className
        }

        return (
            <div className={className}>
                <canvas width={this.props.map.width * 2} height={this.props.map.height} ref={this.selfRef} />
            </div>
        )
    }
}

interface MapInformationCardProps {
    map: MapInformation
    expanded?: boolean
    controls?: boolean
    onMapSelected?: ((map: MapInformation) => void)
}

interface MapInformationCardState {
    expanded: boolean
    terrain?: TerrainAtPoint[]
    cachedThumbnails: Map<MapId, JSX.Element>
}

class MapInformationCard extends Component<MapInformationCardProps, MapInformationCardState> {

    constructor(props: MapInformationCardProps) {
        super(props)

        this.state = {
            expanded: this.props.expanded ? this.props.expanded : false,
            cachedThumbnails: new Map()
        }
    }

    async componentDidMount() {
        this.cacheThumbnail()
    }

    async componentDidUpdate() {
        this.cacheThumbnail()
    }

    cacheThumbnail() {
        let thumbnail = this.state.cachedThumbnails.get(this.props.map.id)

        if (this.state.expanded && !thumbnail) {
            thumbnail = <MapThumbnail map={this.props.map} />

            this.setState(
                {
                    cachedThumbnails: (new Map(this.state.cachedThumbnails)).set(this.props.map.id, thumbnail)
                }
            )
        }
    }

    shouldComponentUpdate(nextProps: MapInformationCardProps, nextState: MapInformationCardState): boolean {

        if (this.props.map.id !== nextProps.map.id) {
            return true
        }

        if (this.props.onMapSelected !== nextProps.onMapSelected) {
            return true
        }

        if (this.state.expanded !== nextState.expanded) {
            return true
        }

        if (this.state.cachedThumbnails.size !== nextState.cachedThumbnails.size) {
            return true
        }

        return false
    }

    onMapSelected(): void {

        if (this.props.onMapSelected) {
            this.props.onMapSelected(this.props.map)
        }
    }

    render() {

        let thumbnail = this.state.cachedThumbnails.get(this.props.map.id)

        let controls = true

        if (this.props.controls === false) {
            controls = false
        }

        if (!thumbnail) {
            thumbnail = <div>Loading...</div>
        }

        return (
            <Card>
                <div className="MapCardTop">

                    {!this.state.expanded &&
                        <div className="MapCardTitle">{this.props.map.title}</div>
                    }

                    {this.state.expanded &&
                        <div className="MapCardTitle">
                            <strong>{this.props.map.title}</strong>
                        </div>
                    }

                    {controls &&
                        <div className="ExpandAndSelectButtons">
                            <Button onButtonClicked={() => this.onMapSelected()}>Select</Button>
                            <ExpandCollapseToggle onExpand={() => this.setState({ expanded: true })} onCollapse={() => this.setState({ expanded: false })} />
                        </div>
                    }
                </div>

                <div style={{ display: this.state.expanded ? undefined : "none" }}>
                    <RawRow>
                        <div className="MapCardAttributes">
                            <div className="MapCardAttribute">Title: {this.props.map.title}</div>
                            <div className="MapCardAttribute">Author: {this.props.map.author}</div>
                            <div className="MapCardAttribute">Dimensions: {this.props.map.width}x{this.props.map.height}</div>
                            <div className="MapCardAttribute">Max players: {this.props.map.maxPlayers}</div>
                        </div>

                        {this.state.expanded && thumbnail}

                    </RawRow>
                </div>

            </Card>
        )
    }
}

export default MapInformationCard