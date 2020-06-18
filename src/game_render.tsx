import React, { Component } from 'react';
import { getCrops, getFlags, getHouses, getRoads, getSigns, getStones, getTrees, getWorkers, HeightInformation, HouseInformation, materialToColor, Point } from './api';
import houseImageMap, { Filename } from './images';
import { monitor } from './monitor';
import { camelCaseToWords, drawGradientTriangle, getBrightnessForNormals, getNormalForTriangle, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpLeft, getPointUpRight, intToVegetationColor, isContext2D, normalize, Point3D, same, Vector, vegetationToInt } from './utils';
import { PointMap } from './util_types';

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
    selectedPoint?: Point
    possibleRoadConnections?: Point[]
    newRoad?: Point[]
    showAvailableConstruction: boolean
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
    images: Map<Filename, HTMLImageElement>
    builtHeightMap: boolean
    straightBelowNormals?: PointMap<Vector>
    downRightNormals?: PointMap<Vector>
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private selfRef = React.createRef<HTMLCanvasElement>();
    private terrain: TerrainAtPoint[][]
    private lightVector: Vector
    private debuggedPoint: Point | undefined
    private renderingTask: NodeJS.Timeout | null = null

    constructor(props: GameCanvasProps) {
        super(props);

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

        this.loadImages(["tree.png", "stone.png", "worker.png", "rabbit-small-brown.png", "flag.png", "large-house-available.png", "medium-house-available.png", "small-house-available.png", "mine-available.png"]);

        this.loadImages(Array.from(new Set(houseImageMap.values())));

        /* Create the height array */
        this.terrain = Array<Array<TerrainAtPoint>>();

        /* Assign heights */
        if (this.props.terrain && this.props.terrain.length > 0) {
            this.buildHeightMap();
        }

        /* Define the light vector */
        this.lightVector = normalize({ x: -1, y: 1, z: -1 });
    }

    buildHeightMap(): void {

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
        const straightBelowNormals = new PointMap<Vector>()
        const downRightNormals = new PointMap<Vector>()

        this.props.terrain.forEach(
            (terrainAtPoint: TerrainAtPoint) => {

                const point = terrainAtPoint.point;

                const point3d: Point3D = {
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

                if (downLeftHeight !== undefined && downRightHeight !== undefined) {
                    const pointDownLeft3d: Point3D = {
                        x: pointDownLeft.x,
                        y: pointDownLeft.y,
                        z: downLeftHeight
                    }

                    const pointDownRight3d: Point3D = {
                        x: pointDownRight.x,
                        y: pointDownRight.y,
                        z: downRightHeight
                    }

                    straightBelowNormals.set(point3d, getNormalForTriangle(point3d, pointDownLeft3d, pointDownRight3d))
                }

                if (downRightHeight !== undefined && rightHeight !== undefined) {

                    const pointRight3d: Point3D = {
                        x: pointRight.x,
                        y: pointRight.y,
                        z: rightHeight
                    }

                    const pointDownRight3d: Point3D = {
                        x: pointDownRight.x,
                        y: pointDownRight.y,
                        z: downRightHeight
                    }

                    downRightNormals.set(point3d, getNormalForTriangle(point3d, pointDownRight3d, pointRight3d))
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

    loadImages(sources: string[]): void {
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
            this.props.selectedPoint !== nextProps.selectedPoint ||
            this.props.possibleRoadConnections !== nextProps.possibleRoadConnections ||
            this.props.newRoad !== nextProps.newRoad ||
            (!this.state.hoverPoint && typeof (nextState.hoverPoint) !== "undefined") ||
            (typeof (this.state.hoverPoint) !== "undefined" &&
                (this.state.hoverPoint !== nextState.hoverPoint ||
                    this.state.hoverPoint.x !== nextState.hoverPoint.x ||
                    this.state.hoverPoint.y !== nextState.hoverPoint.y));
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

        if (height === undefined) {
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
            return undefined;
        }

        return this.state.straightBelowNormals.get(point)
    }

    getNormalDownRight(point: Point): Vector | undefined {

        if (!this.state.downRightNormals) {
            return undefined;
        }

        return this.state.downRightNormals.get(point)
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

    componentDidMount() {

        /* Handle update of heights if needed */
        if (!this.state.builtHeightMap && this.props.terrain && this.props.terrain.length > 0) {
            console.info("Build height map during mount")
            this.buildHeightMap();
            return;
        }

        /* Create the rendering thread if it doesn't exist */
        if (!this.renderingTask) {
            this.renderingTask = setInterval(async () => {
                try {
                    this.renderGame()
                } catch (err) {
                    console.info(err)
                }
            }, 100)
        }
    }

    componentDidUpdate() {

        /* Handle update of heights if needed */
        if (!this.state.builtHeightMap && this.props.terrain && this.props.terrain.length > 0) {
            console.info("Build height map during update")
            this.buildHeightMap();
            return;
        }
    }

    renderGame(): void {

        /* Draw */
        if (!this.selfRef.current) {
            console.log("ERROR: no self ref");
            return;
        }

        const width = this.selfRef.current.width;
        const height = this.selfRef.current.height;

        const ctx = this.selfRef.current.getContext("2d");

        if (!ctx || !isContext2D(ctx)) {
            console.log("ERROR: No or invalid context");
            console.log(ctx);
            return;
        }

        /* Clear the screen */
        ctx.save();

        ctx.fillStyle = 'black';

        ctx.fillRect(0, 0, width, height);

        ctx.restore();

        const scaleY = this.props.scale * 0.5

        this.selfRef.current.width = this.props.width
        this.selfRef.current.height = this.props.height

        let oncePerNewSelectionPoint = false;

        if (this.props.selectedPoint && (!this.debuggedPoint || (this.debuggedPoint && !same(this.props.selectedPoint, this.debuggedPoint)))) {
            oncePerNewSelectionPoint = true;
            this.debuggedPoint = this.props.selectedPoint;
        }

        /* Draw the tiles */
        for (let i = 0; i < this.props.terrain.length; i++) {

            const tile = this.props.terrain[i];

            if (!tile) {
                continue;
            }

            const gamePoint = tile.point;

            let debug = false;

            if (oncePerNewSelectionPoint && this.debuggedPoint && same(this.debuggedPoint, gamePoint)) {
                debug = true;
                this.debuggedPoint = { x: gamePoint.x, y: gamePoint.y }
                console.log("Debugging " + JSON.stringify(gamePoint));
            }

            /* Filter points that are not yet discovered */
            if (!monitor.discoveredPoints.has(gamePoint)) {
                continue;
            }

            const gamePointRight = getPointRight(gamePoint);
            const gamePointDownLeft = getPointDownLeft(gamePoint);
            const gamePointDownRight = getPointDownRight(gamePoint);

            const gamePointRightDiscovered = monitor.discoveredPoints.has(gamePointRight)
            const gamePointDownLeftDiscovered = monitor.discoveredPoints.has(gamePointDownLeft)
            const gamePointDownRightDiscovered = monitor.discoveredPoints.has(gamePointDownRight)

            /* Filter the case where the game point down right is not discovered because it's part of both triangles so then there is nothing to draw */
            if (!gamePointDownRightDiscovered) {
                continue;
            }

            const screenPoint = this.gamePointToScreenPoint(gamePoint);
            const screenPointRight = this.gamePointToScreenPoint(gamePointRight);
            const screenPointDownLeft = this.gamePointToScreenPoint(gamePointDownLeft);
            const screenPointDownRight = this.gamePointToScreenPoint(gamePointDownRight);

            /* Filter the cases where both triangles are outside of the screen */
            if (screenPointRight.x < 0 || screenPointDownLeft.x > width || screenPointDownLeft.y < 0 || screenPoint.y > height) {
                continue;
            }

            /* Get intensity for each point */
            const intensityPoint = getBrightnessForNormals(this.getSurroundingNormals(gamePoint), this.lightVector);
            const intensityPointDownRight = getBrightnessForNormals(this.getSurroundingNormals(gamePointDownRight), this.lightVector);

            /* Draw the tile right below */
            if (gamePointDownLeftDiscovered && gamePointDownRightDiscovered) {

                /* Get the brightness for the game point down left here because now we know that it is discovered */
                const intensityPointDownLeft = getBrightnessForNormals(this.getSurroundingNormals(gamePointDownLeft), this.lightVector);
                const colorBelow = intToVegetationColor.get(tile.straightBelow);

                /* Skip this draw if there is no defined color. This is an error */
                if (!colorBelow) {
                    console.log("NO COLOR FOR VEGETATION BELOW");
                    console.log(tile.straightBelow);

                    continue;
                }

                drawGradientTriangle(ctx,
                    colorBelow,
                    { x: screenPoint.x, y: screenPoint.y - 1 },
                    { x: screenPointDownLeft.x - 1, y: screenPointDownLeft.y },
                    { x: screenPointDownRight.x + 1, y: screenPointDownRight.y },
                    intensityPoint,
                    intensityPointDownLeft,
                    intensityPointDownRight);
            }

            /* Draw the tile down right */
            if (gamePointDownRightDiscovered && gamePointRightDiscovered) {

                /* Get the brightness for the game point right here because now we know that the point is discovered */
                const intensityPointRight = getBrightnessForNormals(this.getSurroundingNormals(gamePointRight), this.lightVector);
                const colorDownRight = intToVegetationColor.get(tile.belowToTheRight);

                /* Skip this draw if there is no defined color. This is an error */
                if (!colorDownRight) {
                    console.log("NO COLOR FOR VEGETATION DOWN RIGHT");
                    console.log(tile.belowToTheRight);

                    continue;
                }

                drawGradientTriangle(ctx,
                    colorDownRight,
                    { x: screenPoint.x - 1, y: screenPoint.y - 1 },
                    { x: screenPointDownRight.x, y: screenPointDownRight.y + 1 },
                    { x: screenPointRight.x + 1, y: screenPointRight.y - 1 },
                    intensityPoint,
                    intensityPointDownRight,
                    intensityPointRight);
            }
        }

        /* Draw the roads */
        for (const [id, road] of getRoads()) {
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
        for (const [playerId, borderForPlayer] of monitor.border) {
            const borderColor = borderForPlayer.color

            if (!borderColor) {
                continue
            }

            for (const borderPoint of borderForPlayer.points) {

                if (!monitor.discoveredPoints.has(borderPoint)) {
                    continue
                }

                const screenPoint = this.gamePointToScreenPoint(borderPoint)

                if (screenPoint.x < 0 || screenPoint.x > width || screenPoint.y < 0 || screenPoint.y > height) {
                    continue
                }

                ctx.save()

                ctx.beginPath()
                ctx.fillStyle = 'blue'
                ctx.arc(screenPoint.x, screenPoint.y, 5, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill()

                ctx.restore()
            }
        }

        /* Draw the ongoing new road if it exists */
        if (this.props.newRoad) {

            let previous = null;

            for (let point of this.props.newRoad) {

                if (!monitor.discoveredPoints.has(point)) {
                    previous = null;

                    continue;
                }

                if (previous) {

                    const screenPointPrevious = this.gamePointToScreenPoint(previous);
                    const screenPointCurrent = this.gamePointToScreenPoint(point);

                    ctx.save();

                    ctx.beginPath();

                    ctx.fillStyle = 'yellow';
                    ctx.strokeStyle = 'yellow';

                    ctx.moveTo(screenPointCurrent.x, screenPointCurrent.y);
                    ctx.lineTo(screenPointPrevious.x, screenPointPrevious.y);

                    ctx.closePath();

                    ctx.stroke()

                    ctx.restore();
                }

                previous = point;
            }
        }

        /* Draw the houses */
        for (const [id, house] of getHouses()) {

            if (!monitor.discoveredPoints.has(house)) {
                continue
            }

            const point = this.gamePointToScreenPoint(house);

            /* Draw the house next to the point, instead of on top */

            const imageFilename = houseImageMap.get(house.type);

            if (imageFilename) {

                const houseImage = this.state.images.get(imageFilename);

                if (houseImage) {
                    ctx.save();

                    if (houseImage.width > 300 || houseImage.height > 300) {
                        point.x -= 1.5 * this.props.scale;
                        point.y -= 2 * scaleY

                        ctx.drawImage(houseImage, point.x, point.y, 3 * this.props.scale, 3 * scaleY)
                    } else {
                        point.x -= houseImage.width * this.props.scale / 40 / 1.4
                        point.y -= houseImage.height * this.props.scale / 40 / 1.1

                        ctx.drawImage(houseImage, point.x, point.y, houseImage.width * this.props.scale / 40, houseImage.height * this.props.scale / 40)
                    }
                    ctx.restore();
                } else {
                    point.x -= 1.5 * this.props.scale;
                    point.y -= 2 * scaleY

                    ctx.save();

                    ctx.fillStyle = 'yellow'

                    ctx.fillRect(point.x, point.y, 50, 50);

                    ctx.restore();
                }
            } else {
                point.x -= 1.5 * this.props.scale;
                point.y -= 2 * scaleY

                ctx.save();

                ctx.fillStyle = 'red'

                ctx.fillRect(point.x, point.y, 50, 50);

                ctx.restore();
            }
        }

        /* Draw the trees */
        for (const tree of getTrees()) {

            if (!monitor.discoveredPoints.has(tree) ||
                !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x - 1, y: tree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y - 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 1, y: tree.y + 1 }) ||
                !monitor.discoveredPoints.has({ x: tree.x - 2, y: tree.y }) ||
                !monitor.discoveredPoints.has({ x: tree.x + 2, y: tree.y })
            ) {
                continue
            }

            const point = this.gamePointToScreenPoint(tree);

            /* Draw the house next to the point, instead of on top */
            point.x -= 0.5 * this.props.scale;
            point.y -= 2.5 * scaleY

            const treeImage = this.state.images.get("tree.png");

            if (treeImage) {
                ctx.save();
                ctx.drawImage(treeImage, point.x, point.y, 1 * this.props.scale, 3 * scaleY);
                ctx.restore();
            }
        }

        /* Draw the crops */
        for (const crop of getCrops()) {

            if (!monitor.discoveredPoints.has(crop)) {
                continue
            }

            const point = this.gamePointToScreenPoint(crop);

            ctx.save();

            ctx.fillStyle = 'orange';

            ctx.beginPath()

            ctx.ellipse(point.x, point.y,
                1 * this.props.scale, 0.5 * scaleY,
                0, 0, 2 * Math.PI);

            ctx.closePath()

            ctx.fill();

            ctx.restore();
        }

        /* Draw the signs */
        for (const [id, sign] of getSigns()) {

            if (!monitor.discoveredPoints.has(sign)) {
                continue
            }

            const point = this.gamePointToScreenPoint(sign);
            const fillColor = materialToColor.get(sign.type);

            ctx.save();

            if (fillColor) {
                ctx.fillStyle = fillColor;
            } else {
                ctx.fillStyle = "brown"
            }

            ctx.fillRect(point.x - 5, point.y - 5, 10, 10);

            ctx.restore();
        }

        /* Draw the stones */
        for (const stone of getStones()) {

            if (!monitor.discoveredPoints.has(stone)) {
                continue
            }

            const point = this.gamePointToScreenPoint(stone);

            /* Draw the stone next to the point, instead of on top */
            point.x -= (2 * this.props.scale) / 2
            point.y -= 3 * scaleY / 2

            const stoneImage = this.state.images.get("stone.png");

            if (stoneImage) {
                ctx.save();

                ctx.drawImage(stoneImage, point.x, point.y, 2 * this.props.scale, 3 * scaleY);

                ctx.restore();
            }
        }

        /* Draw workers */
        for (const [id, worker] of getWorkers()) {

            if (worker.inside) {
                continue

            }
            
            if (worker.betweenPoints && worker.previous && worker.next) {

                if (!monitor.discoveredPoints.has(worker.previous) &&
                    !monitor.discoveredPoints.has(worker.next)) {
                    continue
                }

                const point1 = this.gamePointToScreenPoint(worker.previous);
                const point2 = this.gamePointToScreenPoint(worker.next);


                const point = {
                    x: point1.x + (point2.x - point1.x) * (worker.percentageTraveled / 100),
                    y: point1.y + (point2.y - point1.y) * (worker.percentageTraveled / 100)
                };

                point.y -= 1 * scaleY;

                const workerImage = this.state.images.get("worker.png");

                if (workerImage) {
                    ctx.save();

                    ctx.drawImage(workerImage, point.x, point.y, 0.25 * this.props.scale, 1.15 * scaleY)

                    ctx.restore();
                }
            } else {

                if (!monitor.discoveredPoints.has(worker)) {
                    continue
                }

                const point = this.gamePointToScreenPoint(worker);

                point.y -= 1 * scaleY;

                const workerImage = this.state.images.get("worker.png");

                if (workerImage) {
                    ctx.save();

                    ctx.drawImage(workerImage, point.x, point.y, 0.25 * this.props.scale, 1.15 * scaleY)

                    ctx.restore();
                }
            }
        }

        /* Draw animals */
        for (const animal of monitor.animals) {
            if (animal.betweenPoints) {

                if (!monitor.discoveredPoints.has(animal.previous) &&
                    !monitor.discoveredPoints.has(animal.next)) {
                    continue
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

                if (!monitor.discoveredPoints.has(animal)) {
                    continue
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

        /* Draw flags */
        for (const [id, flag] of getFlags()) {

            if (!monitor.discoveredPoints.has(flag)) {
                continue
            }

            const point = this.gamePointToScreenPoint(flag);

            /* Draw the flag slightly above the point */
            point.y -= 25
            point.x = point.x - 3

            const flagImage = this.state.images.get("flag.png");

            if (flagImage) {
                ctx.save();

                ctx.drawImage(flagImage, point.x, point.y, 10, 30);

                ctx.restore();
            }
        }

        /* Draw available construction */
        if (this.props.showAvailableConstruction) {

            for (const [gamePoint, available] of monitor.availableConstruction.entries()) {

                if (available.length === 0) {
                    continue
                }

                if (!monitor.discoveredPoints.has(gamePoint)) {
                    continue
                }

                const point = this.gamePointToScreenPoint(gamePoint);

                if (available.includes("large")) {
                    ctx.save();

                    const largeHouseAvailableImage = this.state.images.get("large-house-available.png")

                    if (largeHouseAvailableImage) {
                        ctx.drawImage(largeHouseAvailableImage, point.x, point.y, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow';
                        ctx.strokeStyle = 'black';

                        ctx.fillRect(point.x - 7, point.y - 15, 15, 15);

                        ctx.strokeRect(point.x - 7, point.y - 15, 15, 15);
                    }

                    ctx.restore();
                } else if (available.includes("medium")) {
                    ctx.save();

                    const mediumHouseAvailableImage = this.state.images.get("medium-house-available.png")

                    if (mediumHouseAvailableImage) {
                        ctx.drawImage(mediumHouseAvailableImage, point.x, point.y, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow';
                        ctx.strokeStyle = 'black';

                        ctx.fillRect(point.x - 5, point.y - 10, 10, 10);
                        ctx.strokeRect(point.x - 5, point.y - 10, 10, 10);
                    }

                    ctx.restore();
                } else if (available.includes("small")) {
                    ctx.save();

                    const smallHouseAvailableImage = this.state.images.get("small-house-available.png")

                    if (smallHouseAvailableImage) {
                        ctx.drawImage(smallHouseAvailableImage, point.x, point.y, 20, 20)
                    } else {
                        ctx.fillStyle = 'yellow';
                        ctx.strokeStyle = 'black'

                        ctx.fillRect(point.x - 3, point.y - 6, 6, 6);
                        ctx.strokeRect(point.x - 3, point.y - 6, 6, 6);

                    }

                    ctx.restore();
                } else if (available.includes("mine")) {
                    ctx.save();

                    const mineAvailableImage = this.state.images.get("mine-available.png")

                    if (mineAvailableImage) {
                        ctx.drawImage(mineAvailableImage, point.x, point.y, 20, 20)
                    } else {
                        ctx.beginPath();
                        ctx.fillStyle = 'yellow';
                        ctx.strokeStyle = 'black'

                        ctx.arc(point.x - 3, point.y - 6, 6, 0, 2 * Math.PI);

                        ctx.closePath()

                        ctx.fill();
                        ctx.stroke();
                    }
                    ctx.restore();
                } else if (available.includes("flag")) {
                    ctx.save();

                    ctx.fillStyle = 'yellow';
                    ctx.strokeStyle = 'black';

                    ctx.beginPath();

                    ctx.moveTo(point.x - 2, point.y);
                    ctx.lineTo(point.x - 2, point.y - 10);
                    ctx.lineTo(point.x + 3, point.y - 10);
                    ctx.lineTo(point.x + 3, point.y - 5);
                    ctx.lineTo(point.x, point.y - 5);
                    ctx.lineTo(point.x, point.y);

                    ctx.closePath();

                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                }
            }
        }

        /* Draw house titles */
        if (this.props.showHouseTitles) {

            for (const [id, house] of monitor.houses) {

                if (!monitor.discoveredPoints.has(house)) {
                    continue
                }

                const point = this.gamePointToScreenPoint(house);

                /* Draw the house next to the point, instead of on top */
                point.x -= 1.5 * this.props.scale; // 30
                point.y -= 2 * scaleY; // 15

                let houseTitle = camelCaseToWords(house.type);

                if (house.state === "UNFINISHED") {
                    houseTitle = "(" + houseTitle + ")";
                } else if (house.productivity) {
                    houseTitle = houseTitle + " (" + house.productivity + "%)"
                }

                ctx.save();

                ctx.font = "20px sans-serif"
                ctx.fillStyle = 'yellow';

                ctx.fillText(houseTitle, point.x, point.y - 5);

                ctx.restore();
            }
        }

        /* Draw possible road connections */
        if (this.props.possibleRoadConnections) {
            this.props.possibleRoadConnections.map(
                (point, index) => {

                    if (!monitor.discoveredPoints.has(point)) {
                        return;
                    }

                    const screenPoint = this.gamePointToScreenPoint(point);

                    ctx.save();

                    ctx.beginPath();
                    ctx.fillStyle = 'orange';
                    ctx.strokeStyle = 'black';

                    ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI);

                    ctx.closePath()

                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                }
            );
        }

        /* Draw the selected point */
        if (this.props.selectedPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.props.selectedPoint);
            ctx.save();

            ctx.beginPath();
            ctx.fillStyle = 'yellow';
            ctx.strokeStyle = 'black';

            ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI);

            ctx.closePath()

            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }

        /* Draw the hover point */
        if (this.state.hoverPoint) {
            const screenPoint = this.gamePointToScreenPoint(this.state.hoverPoint);
            ctx.save();

            ctx.beginPath();
            ctx.fillStyle = 'yellow';
            ctx.strokeStyle = 'black';

            ctx.arc(screenPoint.x, screenPoint.y, 7, 0, 2 * Math.PI);

            ctx.closePath()

            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    saveContext(context: CanvasRenderingContext2D): void {
        this.setState(
            {
                context: context
            }
        );
    }

    gamePointToScreenPoint(gamePoint: Point): ScreenPoint {
        return {
            x: gamePoint.x * this.props.scale + this.props.translateX,
            y: this.props.screenHeight - gamePoint.y * this.props.scale * 0.5 + this.props.translateY
        };
    }

    screenPointToGamePoint(screenPoint: ScreenPoint): Point {

        const gameX = (screenPoint.x - this.props.translateX) / this.props.scale;
        const gameY = (this.props.screenHeight - screenPoint.y + this.props.translateY) / (this.props.scale * 0.5);

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

    async onClick(event: React.MouseEvent): Promise<void> {

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

    onDoubleClick(event: React.MouseEvent): void {

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

