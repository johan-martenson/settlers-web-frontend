import React, { Component } from 'react';
import { AnimalInformation, AvailableConstruction, BorderInformation, CropInformation, FlagInformation, HouseInformation, materialToColor, Point, PointString, RoadInformation, SignInformation, StoneInformation, TileInformation, TreeInformation, WorkerInformation } from './api';
import houseImageMap from './images';
import { camelCaseToWords, pointToString, intToVegetationColor, vegetationToInt } from './utils';


function stringToPoint(pointString: string): Point {

    const key = pointString.split(',');
    const x = Number(key[0]);
    const y = Number(key[1]);

    const point: Point = { x: x, y: y };

    return point
}

export interface ScreenPoint {
    x: number
    y: number
}

type vegetationInt = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface Tile {
    straightBelow: vegetationInt
    belowToTheRight: vegetationInt
    point: Point
}

export type TerrainList = Array<Tile>

interface GameCanvasProps {
    scale: number
    terrain: TerrainList
    translateX: number
    translateY: number
    screenWidth: number
    screenHeight: number
    roads: RoadInformation[]
    trees: TreeInformation[]
    houses: HouseInformation[]
    selectedPoint?: Point
    borders: BorderInformation[]
    signs: SignInformation[]
    animals: AnimalInformation[]
    crops: CropInformation[]
    stones: StoneInformation[]
    workers: WorkerInformation[]
    flags: FlagInformation[]
    possibleRoadConnections?: Point[]
    newRoad?: Point[]
    discoveredPoints: Set<string>
    showAvailableConstruction: boolean
    availableConstruction: Map<PointString, AvailableConstruction>
    showHouseTitles: boolean

    width: number
    height: number

    onPointClicked: ((point: Point) => void)
    onDoubleClick: ((point: Point) => void)
    onKeyDown: ((event: React.KeyboardEvent) => void)
}

interface GameCanvasState {
    hoverPoint?: Point
    context?: CanvasRenderingContext2D
    images: Map<string, HTMLImageElement>
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private selfRef = React.createRef<HTMLCanvasElement>();

    constructor(props: GameCanvasProps) {
        super(props);

        this.pointIsDiscovered = this.pointIsDiscovered.bind(this);
        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this);
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);

        this.state = {
            images: new Map()
        };

        this.loadImages(["tree.png", "stone.png", "worker.png", "rabbit-small-brown.png", "flag.png"]);

        this.loadImages(Array.from(new Set(houseImageMap.values())));
    }

    loadImages(sources: string[]) {
        for (let source of sources) {
            console.log("Loading " + source);

            const image = new Image();

            image.addEventListener("load",
                () => {
                    console.log("Loaded " + source);
                    this.setState(
                        {
                            images: new Map(this.state.images).set(source, image)
                        }
                    )
                }
            );

            image.src = source;
        }
    }

    shouldComponentUpdate(nextProps: GameCanvasProps, nextState: GameCanvasState) {
        return this.props.scale !== nextProps.scale ||
            this.props.terrain !== nextProps.terrain ||
            this.props.translateX !== nextProps.translateX ||
            this.props.translateY !== nextProps.translateY ||
            this.props.screenWidth !== nextProps.screenWidth ||
            this.props.screenHeight !== nextProps.screenHeight ||
            this.props.roads !== nextProps.roads ||
            this.props.trees !== nextProps.trees ||
            this.props.houses !== nextProps.houses ||
            this.props.selectedPoint !== nextProps.selectedPoint ||
            this.props.borders !== nextProps.borders ||
            this.props.signs !== nextProps.signs ||
            this.props.animals !== nextProps.animals ||
            this.props.possibleRoadConnections !== nextProps.possibleRoadConnections ||
            this.props.newRoad !== nextProps.newRoad ||
            this.changedHouses(this.props.houses, nextProps.houses) ||
            (!this.state.hoverPoint && typeof (nextState.hoverPoint) !== "undefined") ||
            (typeof (this.state.hoverPoint) !== "undefined" &&
                (this.state.hoverPoint !== nextState.hoverPoint ||
                    this.state.hoverPoint.x !== nextState.hoverPoint.x ||
                    this.state.hoverPoint.y !== nextState.hoverPoint.y));
    }

    isContext2D(context: RenderingContext): context is CanvasRenderingContext2D {
        return true;
    }

    componentDidUpdate() {

        if (!this.selfRef.current) {
            console.log("ERROR: no self ref");
            return;
        }

        const width = this.selfRef.current.width;
        const height = this.selfRef.current.height;

        const ctx = this.selfRef.current.getContext("2d");

        if (!ctx || !this.isContext2D(ctx)) {
            console.log("ERROR: No or invalid context");
            console.log(ctx);
            return;
        }

        /* Clear the screen */
        ctx.save();

        ctx.fillStyle = 'black';

        ctx.rect(0, 0, width, height);

        ctx.fill();

        ctx.restore();

        /* Draw the tiles */
        for (let i = 0; i < this.props.terrain.length; i++) {

            const tile = this.props.terrain[i];

            if (!tile) {
                continue;
            }

            if (!this.pointIsDiscovered(tile.point)) {
                continue;
            }

            const point = this.gamePointToScreenPoint(tile.point);
            const right = this.gamePointToScreenPoint({ x: tile.point.x + 2, y: tile.point.y });
            const downLeft = this.gamePointToScreenPoint({ x: tile.point.x - 1, y: tile.point.y - 1 });
            const downRight = this.gamePointToScreenPoint({ x: tile.point.x + 1, y: tile.point.y - 1 });

            if (right.x < 0 || downLeft.x > width || downLeft.y < 0 || point.y > height) {
                continue;
            }

            /* Draw the tile right below */
            const colorBelow = intToVegetationColor.get(tile.straightBelow);

            if (!colorBelow) {
                continue;
            }

            ctx.save();

            ctx.fillStyle = colorBelow;

            ctx.beginPath()

            ctx.moveTo(point.x, point.y);
            ctx.lineTo(downLeft.x, downLeft.y);
            ctx.lineTo(downRight.x, downRight.y);

            ctx.closePath();

            ctx.fill();

            ctx.restore();

            /* Draw the tile down right */
            const colorDownRight = intToVegetationColor.get(tile.straightBelow);

            if (!colorDownRight) {
                continue;
            }

            ctx.save();

            ctx.fillStyle = colorDownRight;

            ctx.beginPath()

            ctx.moveTo(point.x, point.y);
            ctx.lineTo(downRight.x, downRight.y);
            ctx.lineTo(right.x, right.y);

            ctx.closePath();

            ctx.fill();

            ctx.restore();
        }

        /* Draw the roads */
        for (let road of this.props.roads) {
            const scaled = road.points.map(this.gamePointToScreenPoint);
            let previous = null;

            for (let point of scaled) {

                if (previous) {

                    if ((previous.x < 0 && point.x < 0) || (previous.x > width && point.x > width) ||
                        (previous.y < 0 && point.y < 0) || (previous.y > height && point.y > height)) {
                        previous = point;

                        continue;
                    }

                    ctx.save();

                    ctx.fillStyle = 'yellow'

                    ctx.beginPath();

                    ctx.moveTo(point.x, point.y);

                    ctx.lineTo(previous.x, previous.y);

                    ctx.closePath();

                    ctx.stroke();

                    ctx.restore();
                }

                previous = point;
            }
        }

        /* Draw the borders */
        for (let border of this.props.borders) {
            const borderColor = border.color;

            if (!borderColor) {
                continue;
            }

            for (let borderPoint of border.points) {

                if (!this.pointIsDiscovered(borderPoint)) {
                    continue;
                }

                const screenPoint = this.gamePointToScreenPoint(borderPoint);

                if (screenPoint.x < 0 || screenPoint.x > width || screenPoint.y < 0 || screenPoint.y > height) {
                    continue;
                }

                ctx.save();

                ctx.beginPath();
                ctx.fillStyle = 'blue';
                ctx.arc(screenPoint.x, screenPoint.y, 5, 0, 2 * Math.PI)
                ctx.fill();
                ctx.restore();
            }
        }

        /* Draw the ongoing new road if it exists */
        if (this.props.newRoad) {

            let previous = null;

            for (let point of this.props.newRoad.map(this.gamePointToScreenPoint)) {

                if (!this.pointIsDiscovered(point)) {
                    previous = null;

                    continue;
                }

                if (previous) {
                    ctx.save();

                    ctx.beginPath();

                    ctx.fillStyle = 'yellow';

                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(previous.x, previous.y);

                    ctx.closePath();

                    ctx.stroke()

                    ctx.restore();
                }

                previous = point;
            }
        }

        /* Draw available construction */
        if (this.props.showAvailableConstruction) {

            let first0 = true;
            let first1 = true;

            Object.entries(this.props.availableConstruction).map(
                (entry, index) => {
                    const gamePoint = stringToPoint(entry[0]);

                    if (this.pointIsDiscovered(gamePoint)) {

                        const point = this.gamePointToScreenPoint(gamePoint);

                        const available = entry[1];

                        if (available.includes("flag")) {
                            ctx.save();

                            ctx.fillStyle = 'yellow';

                            ctx.beginPath();

                            ctx.moveTo(point.x - 4, point.y);
                            ctx.lineTo(point.x - 4, point.y - 10);

                            ctx.closePath();

                            ctx.stroke();

                            ctx.rect(point.x - 4, point.y - 10, 5, 5);

                            ctx.fill();

                            ctx.restore();
                        }

                        if (available.includes("large")) {
                            ctx.save();

                            ctx.beginPath();
                            ctx.fillStyle = 'yellow';

                            ctx.rect(point.x + 5, point.y - 15, 15, 15);

                            ctx.fill();

                            ctx.restore();
                        }

                        if (available.includes("medium")) {
                            ctx.save();

                            ctx.beginPath();
                            ctx.fillStyle = 'yellow';

                            ctx.rect(point.x + 5, point.y - 10, 10, 10);

                            ctx.fill();

                            ctx.restore();
                        }

                        if (available.includes("small")) {
                            ctx.save();

                            ctx.beginPath();
                            ctx.fillStyle = 'yellow';

                            ctx.rect(point.x + 5, point.y - 6, 6, 6);

                            ctx.fill();

                            ctx.restore();
                        }

                        if (available.includes("mine")) {
                            ctx.save();

                            ctx.beginPath();
                            ctx.fillStyle = 'yellow';

                            ctx.arc(point.x + 5, point.y - 6, 6, 0, 2 * Math.PI);

                            ctx.fill();

                            ctx.restore();
                        }
                    }
                }
            );
        }

        /* Draw the houses */
        this.props.houses.map(
            (house, index) => {

                if (!this.pointIsDiscovered({ x: house.x, y: house.y })) {
                    return null;
                }

                const point = this.gamePointToScreenPoint(house);

                /* Draw the house next to the point, instead of on top */
                point.x -= 1.5 * this.props.scale;
                point.y -= 2 * this.props.scale;

                const houseImage = this.state.images.get(house.type);

                if (houseImage) {
                    ctx.save();

                    ctx.drawImage(houseImage, point.x, point.y);

                    ctx.restore();
                } else {
                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = 'red'

                    ctx.rect(point.x, point.y, 50, 50);

                    ctx.fill();

                    ctx.restore();
                }
            }
        );

        /* Draw the trees */
        this.props.trees.map(
            (tree, index) => {

                if (!this.pointIsDiscovered(tree)) {
                    return null;
                }

                const point = this.gamePointToScreenPoint(tree);

                /* Draw the house next to the point, instead of on top */
                point.x -= 1 * this.props.scale;
                point.y -= 3 * this.props.scale;

                const treeImage = this.state.images.get("tree.png");

                if (treeImage) {
                    ctx.save();
                    ctx.drawImage(treeImage, point.x, point.y, 1 * this.props.scale, 3 * this.props.scale);
                    ctx.restore();
                }
            }
        );

        /* Draw the crops */
        this.props.crops.map(
            (crop, index) => {

                if (!this.pointIsDiscovered(crop)) {
                    return null;
                }

                const point = this.gamePointToScreenPoint(crop);

                ctx.save();

                ctx.fillStyle = 'orange';

                ctx.ellipse(point.x, point.y,
                    0.5 * this.props.scale, 1 * this.props.scale,
                    0, 0, 2 * Math.PI);

                ctx.fill();

                ctx.restore();
            }
        );

        /* Draw the signs */
        this.props.signs.map(
            (sign, index) => {

                if (!this.pointIsDiscovered(sign)) {
                    return;
                }

                const point = this.gamePointToScreenPoint(sign);
                const fillColor = materialToColor.get(sign.type);

                if (fillColor) {
                    ctx.save();

                    ctx.fillStyle = fillColor;

                    ctx.rect(point.x - 5, point.y - 5, 10, 10);

                    ctx.fill();

                    ctx.restore();
                }
            }
        );

        /* Draw the stones */
        this.props.stones.map(
            (stone, index) => {

                if (!this.pointIsDiscovered(stone)) {
                    return null;
                }

                const point = this.gamePointToScreenPoint(stone);

                /* Draw the stone next to the point, instead of on top */
                point.x -= 10;
                point.y -= 50;

                const stoneImage = this.state.images.get("stone.png");

                if (stoneImage) {
                    ctx.save();

                    ctx.drawImage(stoneImage, point.x, point.y, 20, 50);

                    ctx.restore();
                }
            }
        );

        /* Draw workers */
        this.props.workers.map(
            (worker, index) => {

                if (worker.inside) {

                    // No rendering
                    return;

                } else if (worker.betweenPoints) {

                    if (!this.pointIsDiscovered(worker.previous) &&
                        !this.pointIsDiscovered(worker.next)) {
                        return;
                    }

                    const point1 = this.gamePointToScreenPoint(worker.previous);
                    const point2 = this.gamePointToScreenPoint(worker.next);


                    const point = {
                        x: point1.x + (point2.x - point1.x) * (worker.percentageTraveled / 100),
                        y: point1.y + (point2.y - point1.y) * (worker.percentageTraveled / 100)
                    };

                    point.y -= 15;

                    const workerImage = this.state.images.get("worker.png");

                    if (workerImage) {
                        ctx.save();

                        ctx.drawImage(workerImage, point.x, point.y, 10, 15);

                        ctx.restore();
                    }
                } else {

                    if (!this.pointIsDiscovered(worker)) {
                        return;
                    }

                    const point = this.gamePointToScreenPoint(worker);

                    point.y -= 15;

                    const workerImage = this.state.images.get("worker.png");

                    if (workerImage) {
                        ctx.save();

                        ctx.drawImage(workerImage, point.x, point.y, 10, 15);

                        ctx.restore();
                    }
                }
            }
        )

        /* Draw animals */
        this.props.animals.map(
            (animal, index) => {
                if (animal.betweenPoints) {

                    if (!this.pointIsDiscovered(animal.previous) &&
                        !this.pointIsDiscovered(animal.next)) {
                        return;
                    }

                    const point1 = this.gamePointToScreenPoint(animal.previous);
                    const point2 = this.gamePointToScreenPoint(animal.next);

                    const point = {
                        x: point1.x + (point2.x - point1.x) * (animal.percentageTraveled / 100),
                        y: point1.y + (point2.y - point1.y) * (animal.percentageTraveled / 100)
                    };

                    point.y -= 15;

                    const animalImage = this.state.images.get("rabbit-small-brown.png");

                    if (animalImage) {
                        ctx.save();

                        ctx.drawImage(animalImage, point.x, point.y, 20, 30);

                        ctx.restore();
                    }
                } else {

                    if (!this.pointIsDiscovered(animal)) {
                        return;
                    }

                    const point = this.gamePointToScreenPoint(animal);

                    point.y -= 15;

                    const animalImage = this.state.images.get("rabbit-small-brown.png");

                    if (animalImage) {
                        ctx.save();

                        ctx.drawImage(animalImage, point.x, point.y, 20, 30);

                        ctx.restore();
                    }
                }
            }
        );

        /* Draw flags */
        this.props.flags.map(
            (flag, index) => {

                if (!this.pointIsDiscovered(flag)) {
                    return;
                }

                const point = this.gamePointToScreenPoint(flag);

                /* Draw the flag slightly above the point */
                point.y -= 20;

                const flagImage = this.state.images.get("flag.png");

                if (flagImage) {
                    ctx.save();

                    ctx.drawImage(flagImage, point.x, point.y, 20, 30);

                    ctx.restore();
                }
            }
        );

        /* Draw house titles */
        if (this.props.showHouseTitles) {

            this.props.houses.map(
                (house, index) => {

                    if (!this.pointIsDiscovered({ x: house.x, y: house.y })) {
                        return;
                    }

                    const point = this.gamePointToScreenPoint(house);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1.5 * this.props.scale; // 30
                    point.y -= 2 * this.props.scale; // 15

                    let houseTitle = camelCaseToWords(house.type);

                    if (house.state === "UNFINISHED") {
                        houseTitle = "(" + houseTitle + ")";
                    }

                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = 'yellow';

                    ctx.fillText(houseTitle, point.x, point.y - 5);

                    ctx.restore();
                }
            )
        }

        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {
            this.props.possibleRoadConnections.map(
                (point, index) => {

                    if (!this.pointIsDiscovered(point)) {
                        return;
                    }

                    const screenPoint = this.gamePointToScreenPoint(point);

                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = 'orange';

                    ctx.arc(screenPoint.x, screenPoint.y, 3, 0, 2 * Math.PI);

                    ctx.fill();

                    ctx.restore();
                }
            );
        }

        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.props.selectedPoint);
            ctx.save();

            ctx.beginPath();
            ctx.fillStyle = 'orange';

            ctx.arc(screenPoint.x, screenPoint.y, 8, 0, 2 * Math.PI);

            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = 'yellow';

            ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);

            ctx.fill();

            ctx.restore();
        }

        /* Draw the hover point */
        if (this.state.hoverPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.state.hoverPoint);
            ctx.save();

            ctx.beginPath();
            ctx.fillStyle = 'brown';
            ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI);

            ctx.fillStyle = 'orange';
            ctx.arc(screenPoint.x, screenPoint.y, 5, 0, 2 * Math.PI);

            ctx.fill();

            ctx.restore();
        }
    }

    saveContext(context: CanvasRenderingContext2D) {
        this.setState(
            {
                context: context
            }
        );
    }

    changedHouses(houses1: HouseInformation[], houses2: HouseInformation[]) {

        if (houses1.length !== houses2.length) {
            return true;
        }

        for (let i = 0; i < houses1.length; i++) {
            const house1 = houses1[i];
            const house2 = houses2[i];

            if (house1.state !== house2.state) {
                return true;
            }

            if (house1.type !== house2.type) {
                return true;
            }
        }

        return false;
    }

    pointIsDiscovered(point: Point) {
        return this.props.discoveredPoints.has(pointToString(point));
    }

    gamePointToScreenPoint(gamePoint: Point) {
        return {
            x: gamePoint.x * this.props.scale + this.props.translateX,
            y: this.props.screenHeight - gamePoint.y * this.props.scale + this.props.translateY
        };
    }

    screenPointToGamePoint(screenPoint: ScreenPoint) {

        const gameX = (screenPoint.x - this.props.translateX) / this.props.scale;
        const gameY = (this.props.screenHeight - screenPoint.y + this.props.translateY) / this.props.scale;

        let roundedGameX = Math.round(gameX);
        let roundedGameY = Math.round(gameY);

        const faultX = gameX - roundedGameX;
        const faultY = gameY - roundedGameY;

        /* Call the handler directly if both points are odd or even */
        if ((roundedGameX + roundedGameY) % 2 !== 0) {

            /* Find the closest valid point (odd-odd, or even-even) */
            if (Math.abs(faultX) > Math.abs(faultY)) {

                if (faultX > 0) {
                    roundedGameX++;
                } else {
                    roundedGameX--;
                }
            } else if (Math.abs(faultX) < Math.abs(faultY)) {
                if (faultY > 0) {
                    roundedGameY++;
                } else {
                    roundedGameY--;
                }
            } else {
                roundedGameX++;
            }
        }

        return { x: roundedGameX, y: roundedGameY };
    }

    async onClick(event: React.MouseEvent) {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.log("ERROR: Received invalid click event");

            return;
        }

        /* Convert to game coordinates */
        if (this.selfRef.current) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.selfRef.current.width);
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.selfRef.current.height);

            const gamePoint = this.screenPointToGamePoint({ x: x, y: y });

            this.props.onPointClicked(gamePoint);
        }

        event.stopPropagation();
    }

    onDoubleClick(event: React.MouseEvent) {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.log("ERROR: Received invalid double click event");

            return;
        }

        /* Convert to game coordinates */
        if (this.selfRef.current) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.selfRef.current.width);
            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.selfRef.current.height);

            const screenPoint = this.screenPointToGamePoint({ x: x, y: y });

            this.props.onDoubleClick(screenPoint);
        }

        event.stopPropagation();
    }

    render() {

        let width = this.props.width;
        let height = this.props.height;

        if (width == 0 || height == 0) {
            width = 800;
            height = 800;
        }

        if (this.selfRef.current) {
            width = this.selfRef.current.width;
            height = this.selfRef.current.height;
        }

        return (
            <canvas
                width={width}
                height={height}
                className="GameCanvas"
                onKeyDown={this.props.onKeyDown}
                onClick={this.onClick}
                onDoubleClick={this.onDoubleClick}
                ref={this.selfRef}
                onMouseMove={
                    (event: React.MouseEvent) => {

                        /* Convert to game coordinates */
                        if (this.selfRef.current) {
                            const rect = event.currentTarget.getBoundingClientRect();
                            const x = ((event.clientX - rect.left) / (rect.right - rect.left) * this.selfRef.current.width);
                            const y = ((event.clientY - rect.top) / (rect.bottom - rect.top) * this.selfRef.current.height);

                            const hoverPoint = this.screenPointToGamePoint({ x: x, y: y });

                            if (!this.state.hoverPoint ||
                                this.state.hoverPoint.x !== hoverPoint.x ||
                                this.state.hoverPoint.y !== hoverPoint.y) {

                                this.setState(
                                    {
                                        hoverPoint: hoverPoint
                                    }
                                );
                            }
                        }

                        /* Allow the event to propagate to make scrolling work */
                    }
                }
            />
        );
    }
};


export { houseImageMap, GameCanvas, intToVegetationColor, vegetationToInt };

