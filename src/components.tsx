import React, { Component } from 'react';
import { camelCaseToWords, pointToString } from './utils';
import houseImageMap from './images';

import { HouseInformation,
         TreeInformation,
         RoadInformation,
         TerrainInformation,
         SignInformation,
         AnimalInformation,
         CropInformation,
         StoneInformation,
         WorkerInformation,
         FlagInformation,
         BorderInformation,
         AvailableConstruction,
         TileInformation,
         materialToColor,
         PointString,
         Point
       } from './api';

function stringToPoint(pointString: string): Point {
                    
    const key = pointString.split(',');
    const x = Number(key[0]);
    const y = Number(key[1]);

    const point: Point = {x: x, y: y};
    
    return point
}

const vegetationToInt = new Map<TileInformation, number>();

vegetationToInt.set("G",0);
vegetationToInt.set("M",1);
vegetationToInt.set("SW",2);
vegetationToInt.set("W",3);
vegetationToInt.set("DW",4);
vegetationToInt.set("SN",5);
vegetationToInt.set("L",6);
vegetationToInt.set("MM",7);
vegetationToInt.set("ST",9);
vegetationToInt.set("DE",9);

const intToVegetationColor = new Map<number, string>();

intToVegetationColor.set(0, "green");
intToVegetationColor.set(1, "gray");
intToVegetationColor.set(2, "brown");
intToVegetationColor.set(3, "lightblue");
intToVegetationColor.set(4, "blue");
intToVegetationColor.set(5, "white");
intToVegetationColor.set(6, "red");
intToVegetationColor.set(7, "lightgray");
intToVegetationColor.set(8, "darkorange");
intToVegetationColor.set(9, "orange");

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
    hoverPoint?: Point
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
    
    onPointClicked: ((point: Point) => void)
    onDoubleClick: ((point: Point) => void)
    onKeyDown: ((event: React.KeyboardEvent) => void)
}

interface GameCanvasState {
    hoverPoint?: Point
}

class GameCanvas extends Component<GameCanvasProps, GameCanvasState> {

    private selfNameRef = React.createRef<SVGSVGElement>();
    
    constructor(props: GameCanvasProps) {
        super(props);

        this.pointIsDiscovered = this.pointIsDiscovered.bind(this);
        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this);
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);

        this.state = {};
    }
    
    shouldComponentUpdate(nextProps: GameCanvasProps, nextState: GameCanvasState) {
        return this.props.scale !== nextProps.scale                                  ||
            this.props.terrain !== nextProps.terrain                                 ||
            this.props.translateX !== nextProps.translateX                           ||
            this.props.translateY !== nextProps.translateY                           ||
            this.props.screenWidth !== nextProps.screenWidth                         ||
            this.props.screenHeight !== nextProps.screenHeight                       ||
            this.props.roads !== nextProps.roads                                     ||
            this.props.trees !== nextProps.trees                                     ||
            this.props.houses !== nextProps.houses                                   ||
            this.props.selectedPoint !== nextProps.selectedPoint                     ||
            this.props.borders !== nextProps.borders                                 ||
            this.props.signs !== nextProps.signs                                     ||
            this.props.animals !== nextProps.animals                                 ||
            this.props.possibleRoadConnections !== nextProps.possibleRoadConnections ||
            this.props.newRoad !== nextProps.newRoad                                 ||
            this.changedHouses(this.props.houses, nextProps.houses);
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
            } else if (Math.abs(faultX) < Math.abs(faultY)){
                if (faultY > 0) {
                    roundedGameY++;
                } else {
                    roundedGameY--;
                }
            } else {
                roundedGameX++;
            }
        }

        return {x: roundedGameX, y: roundedGameY};
    }

    onClick(event: React.MouseEvent) {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.log("ERROR: Received invalid click event");

            return;
        }

        /* Convert to game coordinates */
        const dim = event.currentTarget.getBoundingClientRect();
        const relativeX = event.clientX - dim.left;
        const relativeY = event.clientY - dim.top;
        
        this.props.onPointClicked(this.screenPointToGamePoint({x: relativeX, y: relativeY}));

        event.stopPropagation();
    }

    onDoubleClick(event: React.MouseEvent) {

        if (!event || !event.currentTarget || !(event.currentTarget instanceof Element)) {
            console.log("ERROR: Received invalid double click event");
            
            return;
        }
        
        /* Convert to game coordinates */
        const dim = event.currentTarget.getBoundingClientRect();
        const relativeX = event.clientX - dim.left;
        const relativeY = event.clientY - dim.top;

        this.props.onDoubleClick(this.screenPointToGamePoint({x: relativeX, y: relativeY}));

        event.stopPropagation();
    }

    drawHoverPoint(gamePoint: Point) {
        const screenPoint = this.gamePointToScreenPoint(gamePoint);
                 
        return (
            <circle
                cx={screenPoint.x}
                cy={screenPoint.y}
                r="5"
                stroke="brown"
                fill="orange"
            />
        );
    }
    
    drawSelectedPoint(gamePoint: Point) {
        const screenPoint = this.gamePointToScreenPoint(gamePoint);
                 
        return (
            <circle
                cx={screenPoint.x}
                cy={screenPoint.y}
                r="10"
                stroke="yellow"
                fill="yellow"
            />
        );
    }
    
    drawNewRoad(road: Point[]) {

        const scaled = road.map(this.gamePointToScreenPoint);

        const splice0 = scaled.slice(0, road.length - 1);
        const splice1 = scaled.slice(1, road.length);

        return (
            <g>
                {splice0.map(
                    (p0, i) => {
                        const p1 = splice1[i];

                        return (
                            <line x1={p0.x}
                                y1={p0.y}
                                x2={p1.x}
                                y2={p1.y}
                                key={i}
                                stroke="yellow"
                            />
                        );
                    }
                )
                }
            </g>
        );
    }

    
    render() {
        
        return (
            <svg
                className="GameCanvas"
                onKeyDown={this.props.onKeyDown}
                onClick={this.onClick}
                onDoubleClick={this.onDoubleClick}
                ref={this.selfNameRef}
                onMouseMove={
                    (event) => {

                        const dim = event.currentTarget.getBoundingClientRect();
                        const relativeX = event.clientX - dim.left;
                        const relativeY = event.clientY - dim.top;

                        if (!this.state.hoverPoint                ||
                            this.state.hoverPoint.x !== relativeX ||
                            this.state.hoverPoint.y !== relativeY) {

                            this.setState(
                                {
                                    hoverPoint: this.screenPointToGamePoint(
                                        {x: relativeX, y: relativeY})
                                }
                            );
                        }

                        /* Allow the event to propagate to make scrolling work */
                  
                    }
                }
            >

            {this.props.terrain.filter((tile) => this.pointIsDiscovered(tile.point)).map(
                (tile, index) => {

                    const point = tile.point;
                    
                    const upper  = this.gamePointToScreenPoint({x: point.x    , y: point.y   });
                    const left   = this.gamePointToScreenPoint({x: point.x - 1, y: point.y - 1});
                    const right  = this.gamePointToScreenPoint({x: point.x + 1, y: point.y - 1});

                    if (right.x > 0 && left.x < this.props.screenWidth &&
                        left.y > 0 && upper.y < this.props.screenHeight) {

                        const vegetation = tile.straightBelow;

                        return (
                            <polygon
                                points={left.x + " " + left.y + " " + right.x + " " + right.y + " " + upper.x + " " + upper.y}
                                stroke={intToVegetationColor.get(vegetation)}
                                fill={intToVegetationColor.get(vegetation)}
                                key={index}
                            />
                        );
                    } else {
                        return null;
                    }
                }
            )
            }

            {this.props.terrain.filter((tile) => this.pointIsDiscovered(tile.point)).map(
                (tile, index) => {
                    const point = tile.point;
                    
                    const left = this.gamePointToScreenPoint({x: point.x     , y: point.y   });
                    const right = this.gamePointToScreenPoint({x: point.x + 2, y: point.y   });
                    const lower = this.gamePointToScreenPoint({x: point.x + 1, y: point.y - 1});

                    if (right.x > 0 && left.x < this.props.screenWidth &&
                        lower.y > 0 && left.y < this.props.screenHeight) {
                        
                        const vegetation = tile.belowToTheRight;

                        return (
                            <polygon
                              points={left.x + " " + left.y + " " + right.x + " " + right.y + " " + lower.x + " " + lower.y}
                              stroke={intToVegetationColor.get(vegetation)}
                              fill={intToVegetationColor.get(vegetation)}
                              key={index}
                              />
                        );
                    } else {
                        return null;
                    }
                })
            }

            {this.props.roads.map(
                (road, index) => {

                    const scaled = road.points.map(this.gamePointToScreenPoint);

                    const splice0 = scaled.slice(0, road.points.length - 1);
                    const splice1 = scaled.slice(1, road.points.length);

                    return (
                        <g key={index}>
                          {splice0.map(
                              (p0, i) => {
                                  const p1 = splice1[i];

                                  return (
                                      <line x1={p0.x}
                                            y1={p0.y}
                                            x2={p1.x}
                                            y2={p1.y}
                                            key={i}
                                            stroke="yellow"
                                            />
                                  );
                              })
                          }
                        </g>
                    );
                }
            )
            }

            {this.props.borders.map(
                (border, indexOuter) => {

                    return (
                        <g key={indexOuter}>
                        {border.points.map(
                            (point, indexInner) => {
                                const screenPoint = this.gamePointToScreenPoint(point);
                                
                                return (
                                    <circle cx={screenPoint.x}
                                            cy={screenPoint.y}
                                            fill={border.color}
                                            key={indexInner}
                                            r="4"
                                            />
                                );
                            })}
                        </g>
                    );
                })
            }

            {this.props.newRoad && this.drawNewRoad(this.props.newRoad)}

            {this.props.showAvailableConstruction && Object.entries(this.props.availableConstruction).map(
                (entry, index) => {

                    const gamePoint = stringToPoint(entry[0]);

                    const point = this.gamePointToScreenPoint(gamePoint);

                    const available = entry[1];

                    return (
                        <g key={index}>

                            {available.find((e: AvailableConstruction) => e == "flag") &&
                              <g>
                              <line x1={point.x - 4}
                                    y1={point.y}
                                    x2={point.x - 4}
                                    y2={point.y - 10}
                                    stroke="orange"
                                    />
                                  <rect
                                        x={point.x - 4}
                                        y={point.y - 10}
                                        width={5}
                                        height={5}
                                        fill="yellow"
                                        stroke="orange"
                                        />
                                  </g>
                          }

                          {available.find((e: AvailableConstruction) => e == "large") &&
                                  <rect
                                        x={point.x + 5}
                                        y={point.y - 15}
                                        width={15}
                                        height={15}
                                        stroke="orange"
                                        fill="yellow"
                                        />
                          }

                          {available.find((e: AvailableConstruction) => e == "medium") &&
                                      <rect
                                            x={point.x + 5}
                                            y={point.y - 10}
                                            width={10}
                                            height={10}
                                            stroke="orange"
                                            fill="yellow"
                                            />
                          }

                          {available.find((e: AvailableConstruction) => e == "small") &&
                                      <rect
                                            x={point.x + 5}
                                            y={point.y - 6}
                                            width={6}
                                            height={6}
                                            stroke="orange"
                                            fill="yellow"
                                            />
                          }

                        {available.find((e: AvailableConstruction) => e == "mine") &&
                                      <circle
                                            cx={point.x + 6}
                                            cy={point.y - 6}
                                            width={6}
                                            height={6}
                                            stroke="orange"
                                            fill="yellow"
                                            />
                          }

                        </g>
                    );
                }
            )}

            {this.props.houses.map(
                (house, index) => {

                    if (!this.pointIsDiscovered({x: house.x, y: house.y})) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(house);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1.5 * this.props.scale;
                    point.y -= 2 * this.props.scale;

                    return (
                        <image href={houseImageMap.get(house.type)}
                            width={3 * this.props.scale}
                            height={3 * this.props.scale}
                            x={point.x}
                            y={point.y}
                            key={index}
                        />
                    );
                }
            )}

            {this.props.trees.map(
                (tree, index) => {

                    if (!this.pointIsDiscovered(tree)) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(tree);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1 * this.props.scale;
                    point.y -= 3 * this.props.scale;

                    return (
                        <image href="tree.png"
                               width={1 * this.props.scale}
                               height={3 * this.props.scale}
                               x={point.x}
                               y={point.y}
                               key={index}/>
                    );
                }
            )}

            {this.props.crops.map(
                (crop, index) => {

                    if (!this.pointIsDiscovered(crop)) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(crop);

                    return (
                        <ellipse cx={point.x}
                                 cy={point.y}
                                 ry={0.5 * this.props.scale}
                                 rx={1 * this.props.scale}
                                 fill="orange"
                                 key={index}
                                 />
                    );
                }
            )}

            {this.props.signs.map(
                (sign, index) => {
                    const point = this.gamePointToScreenPoint(sign);
                    const fillColor = materialToColor.get(sign.type);

                    return (
                        <rect
                          x={point.x - 5}
                          y={point.y - 5}
                          width="10"
                          height="10"
                          fill={fillColor}
                          stroke={fillColor}
                          key={index}
                          />
                    );
                }
            )
            }
            
            {this.props.stones.map(
                (stone, index) => {

                    if (!this.pointIsDiscovered(stone)) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(stone);

                    /* Draw the stone next to the point, instead of on top */
                    point.x -= 10;
                    point.y -= 50;

                    return (
                        <image href="stone.png" width="20" height="50" x={point.x} y={point.y} key={index}/>
                    );
                }
            )}

            {this.props.workers.map(
                (worker, index) => {

                    if (worker.inside) {
                        return null;
                    
                    } else if (worker.betweenPoints) {
                        const point1 = this.gamePointToScreenPoint(worker.previous);
                        const point2 = this.gamePointToScreenPoint(worker.next);
                        
                        const point = {x: point1.x + (point2.x - point1.x) * (worker.percentageTraveled/100),
                                     y: point1.y + (point2.y - point1.y) * (worker.percentageTraveled/100)};

                        point.y -= 15;
                        
                        return (
                            <image href="worker.png" key={index} x={point.x} y={point.y} width="10" height="15"/>
                        );
                    } else {
                        const point = this.gamePointToScreenPoint(worker);

                        point.y -= 15;

                        return (
                            <image href="worker.png" key={index} x={point.x} y={point.y} width={10} height={15}/>
                        );
                    }
                })
            }

            {this.props.animals.map(
                (animal, index) => {

                    if (animal.betweenPoints) {
                        const point1 = this.gamePointToScreenPoint(animal.previous);
                        const point2 = this.gamePointToScreenPoint(animal.next);
                        
                        const point = {x: point1.x + (point2.x - point1.x) * (animal.percentageTraveled/100),
                                     y: point1.y + (point2.y - point1.y) * (animal.percentageTraveled/100)};

                        point.y -= 15;
                        
                        return (
                            <image href="rabbit-small-brown.png"
                                   key={index}
                                   x={point.x}
                                   y={point.y}
                                   width="20"
                                    />
                        );

                    } else {
                        const point = this.gamePointToScreenPoint(animal);

                        point.y -= 15;

                        return (
                            <image href="rabbit-small-brown.png"
                                   x={point.x}
                                   y={point.y}
                                   key={index}
                                   width="20"
                                   />
                        );
                    }
                })
            }
            
            {this.props.flags.map(
                (flag, index) => {

                    if (!this.pointIsDiscovered(flag)) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(flag);

                    /* Draw the flag slightly above the point */
                    point.y -= 20;

                    return (
                        <image href="flag.png" key={index} x={point.x} y={point.y} width={15} height={20}/>
                    );
                }
            )}

            {this.props.showHouseTitles && this.props.houses.map(
                (house, index) => {

                    if (!this.pointIsDiscovered({x: house.x, y: house.y})) {
                        return null;
                    }

                    const point = this.gamePointToScreenPoint(house);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1.5 * this.props.scale; // 30
                    point.y -= 2 * this.props.scale; // 15

                    let houseTitle = camelCaseToWords(house.type);

                    if (house.state === "UNFINISHED") {
                        houseTitle = "(" + houseTitle + ")";
                    }

                    const textStyle = {
                        background: "white",
                        backgroundColor: "white"
                    };

                    return (
                        <text x={point.x}
                              y={point.y - 5}
                              stroke="yellow"
                              fill="yellow"
                              fontSize="12"
                              style={textStyle}
                              key={index}
                              >
                          {houseTitle}
                        </text>
                    );
                }
            )}

            {this.props.possibleRoadConnections &&
             this.props.possibleRoadConnections.map(
                 (point, index) => {
                     const screenPoint = this.gamePointToScreenPoint(point);

                     return (
                         <circle cx={screenPoint.x}
                                 cy={screenPoint.y}
                                 r="3"
                                 fill="orange"
                                 key={index}
                                 />
                     );
                 }
             )
            }
            
            {this.props.selectedPoint && this.drawSelectedPoint(this.props.selectedPoint)}

            {this.state.hoverPoint && this.drawHoverPoint(this.state.hoverPoint)}
            </svg>

        );
    }
};


export {
    houseImageMap,
    GameCanvas,
    intToVegetationColor,
    vegetationToInt
};
