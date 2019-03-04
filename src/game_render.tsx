import React, { Component } from 'react';
import { AnimalInformation, AvailableConstruction, BorderInformation, CropInformation, FlagInformation, HeightInformation, HouseInformation, materialToColor, Point, PointString, RoadInformation, SignInformation, StoneInformation, TreeInformation, WorkerInformation } from './api';
import houseImageMap from './images';
import { camelCaseToWords, getBrightnessForNormals, getDotProduct, getGradientLineForTriangle, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, intToVegetationColor, pointToString, Vector, vegetationToInt, arrayToRgbStyle, Point3D } from './utils';


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

export interface TerrainAtPoint {
    point: Point
    straightBelow: vegetationInt
    belowToTheRight: vegetationInt
    height: number
}

export type HeightList = Array<HeightInformation>

interface GameCanvasProps {
    scale: number
    terrain: Array<TerrainAtPoint>
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
    builtHeightMap: boolean
    straightBelowNormals?: Map<number, Map<number, Vector>>
    downRightNormals?: Map<number, Map<number, Vector>>
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private selfRef = React.createRef<HTMLCanvasElement>();
    terrain: TerrainAtPoint[][]

    constructor(props: GameCanvasProps) {
        super(props);

        this.pointIsDiscovered = this.pointIsDiscovered.bind(this);
        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this);
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.getHeightForPoint = this.getHeightForPoint.bind(this);
        this.pointToPoint3D = this.pointToPoint3D.bind(this);

        this.state = {
            images: new Map(),
            builtHeightMap: false
        };

        this.loadImages(["tree.png", "stone.png", "worker.png", "rabbit-small-brown.png", "flag.png"]);

        this.loadImages(Array.from(new Set(houseImageMap.values())));

        /* Create the height array */
        this.terrain = Array<Array<TerrainAtPoint>>();

        /* Assign heights */
        if (this.props.terrain && this.props.terrain.length > 0) {
            this.buildHeightMap();
        }
    }

    buildHeightMap() {

        /* Create the array to hold the terrain information */
        this.props.terrain.forEach(
            (terrainAtPoint: TerrainAtPoint) => {
                const point = terrainAtPoint.point;

                if (!this.terrain[point.x]) {
                    this.terrain[point.x] = new Array<TerrainAtPoint>();
                }

                this.terrain[point.x][point.y] = terrainAtPoint;
            }
        );

        /* Calculate and store the normals per triangle */
        const straightBelowNormals = new Map<number, Map<number, Vector>>();
        const downRightNormals = new Map<number, Map<number, Vector>>();

        this.props.terrain.forEach(
            (terrainAtPoint: TerrainAtPoint) => {

                const point = {
                    x: terrainAtPoint.point.x,
                    y: terrainAtPoint.point.y,
                    z: terrainAtPoint.height
                };

                const pointDownLeft = getPointDownLeft(point);
                const pointDownRight = getPointDownRight(point);
                const pointRight = getPointRight(point);

                const downLeftHeight = this.getHeightForPoint(pointDownLeft);
                const downRightHeight = this.getHeightForPoint(pointDownRight);
                const rightHeight = this.getHeightForPoint(pointRight);

                if (downLeftHeight && downRightHeight) {
                    const pointDownLeft3d = {
                        x: pointDownLeft.x,
                        y: pointDownLeft.y,
                        z: downLeftHeight
                    }

                    const pointDownRight3d = {
                        x: pointDownRight.x,
                        y: pointDownRight.y,
                        z: downRightHeight
                    }

                    let xStraightBelowMap = straightBelowNormals.get(point.x);

                    if (!xStraightBelowMap) {
                        xStraightBelowMap = new Map<number, Vector>();
                        straightBelowNormals.set(point.x, xStraightBelowMap);
                    }

                    xStraightBelowMap.set(point.y, getNormalForTriangle(point, pointDownLeft3d, pointDownRight3d));
                }

                if (downRightHeight && rightHeight) {

                    const pointRight3d = {
                        x: pointRight.x,
                        y: pointRight.y,
                        z: rightHeight
                    }

                    const pointDownRight3d = {
                        x: pointDownRight.x,
                        y: pointDownRight.y,
                        z: downRightHeight
                    }

                    let xDownRightMap = downRightNormals.get(point.x);


                    if (!xDownRightMap) {
                        xDownRightMap = new Map<number, Vector>();
                        downRightNormals.set(point.x, xDownRightMap);
                    }

                    xDownRightMap.set(point.y, getNormalForTriangle(point, pointDownRight3d, pointRight3d));
                }
            }
        );

        this.setState(
            {
                builtHeightMap: true,
                straightBelowNormals: straightBelowNormals,
                downRightNormals: downRightNormals
            }
        );
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

    getHeightForPoint(point: Point): number | undefined {
        const xTerrainArray = this.terrain[point.x];

        if (!xTerrainArray) {
            return undefined;
        }

        const yTerrainArray = xTerrainArray[point.y];

        if (!yTerrainArray) {
            return undefined;
        }

        const height = yTerrainArray.height;
        return height;
    }

    pointToPoint3D(point: Point): Point3D | undefined {
        const height = this.getHeightForPoint(point)

        if (!height) {
            return undefined;
        }

        return {
            x: point.x,
            y: point.y,
            z: height
        };
    }

    getNormalStraightBelow(point: Point): Vector | undefined {

        if (!this.state.straightBelowNormals) {
            console.log("NO STATE STRAIGHT BELOW NORMALS");

            return undefined;
        }

        const xStraightBelowMap = this.state.straightBelowNormals.get(point.x);

        if (!xStraightBelowMap) {
            console.log("NO STRAIGHT BELOW MAP");

            return undefined;
        }

        const normal = xStraightBelowMap.get(point.y);

        return normal;
    }

    getNormalDownRight(point: Point): Vector | undefined {

        if (!this.state.downRightNormals) {
            return undefined;
        }

        const xDownRightMap = this.state.downRightNormals.get(point.x);

        if (!xDownRightMap) {
            return undefined;
        }

        const normal = xDownRightMap.get(point.y);

        return normal;
    }

    getSurroundingNormals(gamePoint: Point): (Vector | undefined)[] {
        const normalUpLeft = this.getNormalStraightBelow(getPointUpLeft(gamePoint))
        const normalAbove = this.getNormalDownRight(getPointUpLeft(gamePoint))
        const normalUpRight = this.getNormalStraightBelow(getPointUpRight(gamePoint))
        const normalDownRight = this.getNormalDownRight(gamePoint)
        const normalBelow = this.getNormalStraightBelow(gamePoint)
        const normalDownLeft = this.getNormalDownRight(getPointLeft(gamePoint))

        return [
            normalUpLeft,
            normalAbove,
            normalUpRight,
            normalDownRight,
            normalBelow,
            normalDownLeft
        ];
    }

    componentDidUpdate() {

        /* Handle update of heights if needed */
        if (!this.state.builtHeightMap && this.props.terrain && this.props.terrain.length > 0) {
            this.buildHeightMap();
            return;
        }

        /* Draw */
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

            const gamePoint = tile.point;
            const gamePointRight = { x: tile.point.x + 2, y: tile.point.y };
            const gamePointDownLeft = { x: tile.point.x - 1, y: tile.point.y - 1 };
            const gamePointDownRight = { x: tile.point.x + 1, y: tile.point.y - 1 };

            const point = this.gamePointToScreenPoint(gamePoint);
            const right = this.gamePointToScreenPoint(gamePointRight);
            const downLeft = this.gamePointToScreenPoint(gamePointDownLeft);
            const downRight = this.gamePointToScreenPoint(gamePointDownRight);

            if (right.x < 0 || downLeft.x > width || downLeft.y < 0 || point.y > height) {
                continue;
            }

            const lightVector = { x: -1, y: -1, z: 0 };

            /* Draw the tile right below */
            const colorBelow = intToVegetationColor.get(tile.straightBelow);

            if (!colorBelow) {
                continue;
            }

            /* Get intensity for each point */
            const intensityPoint = getBrightnessForNormals(this.getSurroundingNormals(gamePoint), lightVector);
            const intensityPointDownLeft = getBrightnessForNormals(this.getSurroundingNormals(gamePointDownLeft), lightVector);
            const intensityPointDownRight = getBrightnessForNormals(this.getSurroundingNormals(gamePointDownRight), lightVector);
            const intensityPointRight = getBrightnessForNormals(this.getSurroundingNormals(gamePointRight), lightVector);

            const intensity1 = this.getBrightnessForTriangle(gamePoint, gamePointDownLeft, gamePointDownRight, lightVector);

            ctx.save();

            if (colorBelow === 'green') {
                let rgb = [0, 150 + (20 * Math.abs(intensity1)), 0];

                //const fillStyle = 'rgb(' + Math.floor(rgb[0]) + ', ' + Math.floor(rgb[1]) + ', ' + Math.floor(rgb[2]) + ')';
                const fillStyle = arrayToRgbStyle(rgb);

                ctx.fillStyle = fillStyle;
            } else if (colorBelow === 'gray') {

                const minIntensity = Math.min(intensityPoint, intensityPointDownLeft, intensityPointDownRight);
                const maxIntensity = Math.max(intensityPoint, intensityPointDownLeft, intensityPointDownRight);

                const minColor = [
                    150 + (20 * Math.abs(minIntensity)),
                    150 + (20 * Math.abs(minIntensity)),
                    150 + (20 * Math.abs(minIntensity)),
                ];

                if (minIntensity === maxIntensity) {
                    ctx.fillStyle = arrayToRgbStyle(minColor);
                    //ctx.fillStyle = 'gray';
                } else {

                    const maxColor = [
                        150 + (20 * Math.abs(maxIntensity)),
                        150 + (20 * Math.abs(maxIntensity)),
                        150 + (20 * Math.abs(maxIntensity)),
                    ];

                    const gradientGamePoints = getGradientLineForTriangle(gamePoint, intensityPoint, gamePointDownLeft, intensityPointDownLeft, gamePointDownRight, intensityPointDownRight);

                    const gradientScreenPoints = [
                        this.gamePointToScreenPoint(gradientGamePoints[0]),
                        this.gamePointToScreenPoint(gradientGamePoints[1])
                    ];

                    if (gradientGamePoints[0].x === gradientGamePoints[1].x && gradientGamePoints[0].y === gradientGamePoints[1].y ) {
                        console.log();
                        console.log("THEY ARE EQUAL");
                        console.log(gamePoint);
                        console.log(gradientGamePoints);
                        console.log(gradientScreenPoints);
                    }

                    console.log(JSON.stringify(gamePoint) + ": " + JSON.stringify(gradientGamePoints) + " (" + JSON.stringify(gradientScreenPoints) + ")");

                    try {
                        const gradient = ctx.createLinearGradient(
                            gradientScreenPoints[0].x, gradientScreenPoints[0].y, gradientScreenPoints[1].x, gradientScreenPoints[1].y
                        );
                        gradient.addColorStop(0, arrayToRgbStyle(maxColor));
                        gradient.addColorStop(1, arrayToRgbStyle(minColor));

                        ctx.fillStyle = gradient;
                    } catch (e) {
                        console.log("");

                        console.log("FAILED!");
                        console.log(gradientGamePoints);
                        console.log(gradientScreenPoints);
                    }

                }
            } else {
                ctx.fillStyle = colorBelow;
            }

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

            const intensity2 = this.getBrightnessForTriangle(gamePoint, gamePointDownRight, gamePointRight, lightVector);
            if (colorDownRight === 'green') {
                let rgb = [0, 150 + (20 * Math.abs(intensity2)), 0];

                //const fillStyle = 'rgb(' + Math.floor(rgb[0]) + ', ' + Math.floor(rgb[1]) + ', ' + Math.floor(rgb[2]) + ')';
                const fillStyle = arrayToRgbStyle(rgb);

                ctx.fillStyle = fillStyle;
            } else if (colorBelow === 'gray') {
                const minIntensity = Math.min(intensityPoint, intensityPointDownRight, intensityPointRight);
                const maxIntensity = Math.max(intensityPoint, intensityPointDownRight, intensityPointRight);

                const minColor = [
                    150 + (20 * Math.abs(minIntensity)),
                    150 + (20 * Math.abs(minIntensity)),
                    150 + (20 * Math.abs(minIntensity)),
                ];

                if (minIntensity === maxIntensity) {
                    ctx.fillStyle = arrayToRgbStyle(minColor);
                } else {

                    const maxColor = [
                        150 + (20 * Math.abs(maxIntensity)),
                        150 + (20 * Math.abs(maxIntensity)),
                        150 + (20 * Math.abs(maxIntensity)),
                    ];

                    const gradientGamePoints = getGradientLineForTriangle(gamePoint, intensityPoint, gamePointDownRight, intensityPointDownRight, gamePointRight, intensityPointRight);

                    const gradientScreenPoints = [
                        this.gamePointToScreenPoint(gradientGamePoints[0]),
                        this.gamePointToScreenPoint(gradientGamePoints[1])
                    ];

                    try {
                        const gradient = ctx.createLinearGradient(
                            gradientScreenPoints[0].x, gradientScreenPoints[0].y, gradientScreenPoints[1].x, gradientScreenPoints[1].y
                        );
                        gradient.addColorStop(0, arrayToRgbStyle(maxColor));
                        gradient.addColorStop(1, arrayToRgbStyle(minColor));

                        ctx.fillStyle = gradient;
                    } catch (e) {
                        console.log("");

                        console.log("FAILED!");
                        console.log(gradientGamePoints);
                        console.log(gradientScreenPoints);
                    }
                }
            } else {
                ctx.fillStyle = colorDownRight;
            }

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

    private getBrightnessForTriangle(gamePoint: Point, gamePointDownLeft: { x: number; y: number; }, gamePointDownRight: { x: number; y: number; }, lightVector: { x: number; y: number; z: number; }) {

        const normal = getNormalForTriangle(this.pointToPoint3D(gamePoint), this.pointToPoint3D(gamePointDownLeft), this.pointToPoint3D(gamePointDownRight));

        const alignment = getDotProduct(normal, lightVector);

        return alignment;
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
