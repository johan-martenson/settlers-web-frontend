import React, { Component } from 'react';
import {camelCaseToWords} from './utils.js';
import houseImageMap from './images.js';

import { materialToColor } from './api.js';

var vegetationToInt = {
    "GRASS": 0,
    "MOUNTAIN": 1,
    "SWAMP": 2,
    "WATER": 3,

    'G':  0,
    'M':  1,
    'SW': 2,
    'W':  3,
    'DW': 4,
    'SN': 5,
    'L':  6,
    'MM': 7,
    'ST': 8,
    'DE': 9
};

var intToVegetationColor = {
    0: "green",
    1: "gray",
    2: "brown",
    3: "lightblue",
    4: "blue",
    5: "white",
    6: "red",
    7: "lightgray",
    8: "darkorange",
    9: "orange"
};

class GameCanvas extends Component {
    constructor(props) {
        super(props);

        this.pointIsDiscovered = this.pointIsDiscovered.bind(this);
        this.gamePointToScreenPoint = this.gamePointToScreenPoint.bind(this);
        this.screenPointToGamePoint = this.screenPointToGamePoint.bind(this);

        this.state = {};
    }
    
    shouldComponentUpdate(nextProps, nextState) {
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
            this.props.details !== nextProps.details                                 ||
            this.props.borders !== nextProps.borders                                 ||
            this.props.signs !== nextProps.signs                                     ||
            this.props.animals !== nextProps.animals                                 ||
            this.props.possibleRoadConnections !== nextProps.possibleRoadConnections ||
            this.props.newRoad !== nextProps.newRoad                                 ||
            this.changedHouses(this.props.houses, nextProps.houses);
    }

    changedHouses(houses1, houses2) {

        if (houses1.length !== houses2.length) {
            return true;
        }

        for (let i = 0; i < houses1.length; i++) {
            let house1 = houses1[i];
            let house2 = houses2[i];

            if (house1.state !== house2.state) {
                return true;
            }

            if (house1.type !== house2.type) {
                return true;
            }
        }

        return false;
    }

    pointIsDiscovered(point) {
        let key = "x" + point.x + "y" + point.y;
        return this.props.discoveredPoints.has(key);
    }

    gamePointToScreenPoint(gamePoint) {
        return {
            x: gamePoint.x * this.props.scale + this.props.translateX,
            y: this.props.screenHeight - gamePoint.y * this.props.scale + this.props.translateY
        };
    }

    screenPointToGamePoint(screenPoint) {

        let gameX = (screenPoint.x - this.props.translateX) / this.props.scale;
        let gameY = (this.props.screenHeight - screenPoint.y + this.props.translateY) / this.props.scale;

        let roundedGameX = Math.round(gameX);
        let roundedGameY = Math.round(gameY);

        let faultX = gameX - roundedGameX;
        let faultY = gameY - roundedGameY;

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

    onClick(event) {

        /* Convert to game coordinates */
        let dim = event.currentTarget.getBoundingClientRect();
        let relativeX = event.clientX - dim.left;
        let relativeY = event.clientY - dim.top;

        this.props.onPointClicked(this.screenPointToGamePoint({x: relativeX, y: relativeY}));

        /* Allow the event to propagate to make scrolling work */
    }

    onDoubleClick(event) {

        /* Convert to game coordinates */
        let dim = event.currentTarget.getBoundingClientRect();
        let relativeX = event.clientX - dim.left;
        let relativeY = event.clientY - dim.top;

        this.props.onDoubleClick(this.screenPointToGamePoint({x: relativeX, y: relativeY}));

        event.stopPropagation();
    }
    
    render() {
        
        return (
            <svg
              className="GameCanvas"
              onKeyDown={this.props.onKeyDown}
              onClick={this.onClick.bind(this)}
              onDoubleClick={this.onDoubleClick.bind(this)}
              ref={(selfName) => {this.selfName = selfName;}}
              onMouseMove={(event) => {

                  let dim = event.currentTarget.getBoundingClientRect();
                  let relativeX = event.clientX - dim.left;
                  let relativeY = event.clientY - dim.top;

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

              {this.props.terrain.filter(this.pointIsDiscovered).map(
                    (tile, index) => {

                        let upper  = this.gamePointToScreenPoint({x: tile.x    , y: tile.y   });
                        let left   = this.gamePointToScreenPoint({x: tile.x - 1, y: tile.y - 1});
                        let right  = this.gamePointToScreenPoint({x: tile.x + 1, y: tile.y - 1});

                        if (right.x > 0 && left.x < this.props.screenWidth &&
                            left.y > 0 && upper.y < this.props.screenHeight) {

                            let vegetation = tile.straightBelow;

                             return (
                                 <polygon
                                   points={left.x + " " + left.y + " " + right.x + " " + right.y + " " + upper.x + " " + upper.y}
                                   stroke={intToVegetationColor[vegetation]}
                                   fill={intToVegetationColor[vegetation]}
                                   key={index}
                                   />
                             );
                        } else {
                            return null;
                        }
                    })
              }

            {this.props.terrain.filter(this.pointIsDiscovered).map(
                (tile, index) => {

                    let left = this.gamePointToScreenPoint({x: tile.x     , y: tile.y   });
                    let right = this.gamePointToScreenPoint({x: tile.x + 2, y: tile.y   });
                    let lower = this.gamePointToScreenPoint({x: tile.x + 1, y: tile.y - 1});

                    if (right.x > 0 && left.x < this.props.screenWidth &&
                        lower.y > 0 && left.y < this.props.screenHeight) {
                        
                        let vegetation = tile.belowToTheRight;

                        return (
                            <polygon
                              points={left.x + " " + left.y + " " + right.x + " " + right.y + " " + lower.x + " " + lower.y}
                              stroke={intToVegetationColor[vegetation]}
                              fill={intToVegetationColor[vegetation]}
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

                    let scaled = road.points.map(this.gamePointToScreenPoint);

                    let splice0 = scaled.slice(0, road.points.length - 1);
                    let splice1 = scaled.slice(1, road.points.length);

                    return (
                        <g key={index}>
                          {splice0.map(
                              (p0, i) => {
                                  let p1 = splice1[i];

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
                                let screenPoint = this.gamePointToScreenPoint(point);
                                
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

            {(typeof(this.props.newRoad) !== "undefined") &&
             function () {
                 let scaled = this.props.newRoad.map(this.gamePointToScreenPoint);

                 let splice0 = scaled.slice(0, this.props.newRoad.length - 1);
                 let splice1 = scaled.slice(1, this.props.newRoad.length);

                 return (
                     <g>
                       {splice0.map(
                           (p0, i) => {
                               let p1 = splice1[i];

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
             }.bind(this) ()
            }

            {this.props.showAvailableConstruction && Object.entries(this.props.availableConstruction).map(
                (entry, index) => {

                    let key = entry[0].split(',');
                    let x = key[0];
                    let y = key[1];

                    let point = this.gamePointToScreenPoint({x: x, y: y});

                    let available = entry[1];

                    return (
                        <g key={index}>

                          {available.find((e) => e == "flag") &&
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

                          {available.find((e) => e == "large") &&
                                  <rect
                                        x={point.x + 5}
                                        y={point.y - 15}
                                        width={15}
                                        height={15}
                                        stroke="orange"
                                        fill="yellow"
                                        />
                          }

                          {available.find((e) => e == "medium") &&
                                      <rect
                                            x={point.x + 5}
                                            y={point.y - 10}
                                            width={10}
                                            height={10}
                                            stroke="orange"
                                            fill="yellow"
                                            />
                          }

                          {available.find((e) => e == "small") &&
                                      <rect
                                            x={point.x + 5}
                                            y={point.y - 6}
                                            width={6}
                                            height={6}
                                            stroke="orange"
                                            fill="yellow"
                                            />
                          }

                          {available.find((e) => e == "mine") &&
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

                    let point = this.gamePointToScreenPoint(house);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1.5 * this.props.scale;
                    point.y -= 2 * this.props.scale;

                    return (
                        <image href={houseImageMap[house.type]}
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

                    let point = this.gamePointToScreenPoint(tree);

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

                    let point = this.gamePointToScreenPoint(crop);

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
                    let point = this.gamePointToScreenPoint(sign);
                    let fillColor = materialToColor[sign.type];

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

                    let point = this.gamePointToScreenPoint(stone);

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
                        let point1 = this.gamePointToScreenPoint(worker.previous);
                        let point2 = this.gamePointToScreenPoint(worker.next);
                        
                        let point = {x: point1.x + (point2.x - point1.x) * (worker.percentageTraveled/100),
                                     y: point1.y + (point2.y - point1.y) * (worker.percentageTraveled/100)};

                        point.y -= 15;
                        
                        return (
                            <image href="worker.png" key={index} x={point.x} y={point.y} width="10" height="15"/>
                        );
                    } else {
                        let point = this.gamePointToScreenPoint(worker);

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
                        let point1 = this.gamePointToScreenPoint(animal.previous);
                        let point2 = this.gamePointToScreenPoint(animal.next);
                        
                        let point = {x: point1.x + (point2.x - point1.x) * (animal.percentageTraveled/100),
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
                        let point = this.gamePointToScreenPoint(animal);

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

                    let point = this.gamePointToScreenPoint(flag);

                    /* Draw the flag slightly above the point */
                    point.y -= 20;

                    return (
                        <image href="flag.png" key={index} x={point.x} y={point.y} width={15} height={20}/>
                    );
                }
            )}

            {this.props.houseTitles && this.props.houses.map(
                (house, index) => {

                    if (!this.pointIsDiscovered({x: house.x, y: house.y})) {
                        return null;
                    }

                    let point = this.gamePointToScreenPoint(house);

                    /* Draw the house next to the point, instead of on top */
                    point.x -= 1.5 * this.props.scale; // 30
                    point.y -= 2 * this.props.scale; // 15

                    let houseTitle = camelCaseToWords(house.type);

                    if (house.state === "unfinished") {
                        houseTitle = "(" + houseTitle + ")";
                    }

                    let textStyle = {
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

            {(typeof(this.props.possibleRoadConnections) !== "undefined") &&
             this.props.possibleRoadConnections.map(
                 (point, index) => {
                     let screenPoint = this.gamePointToScreenPoint(point);

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
            
            {(typeof this.props.selectedPoint !== "undefined") &&
             function() {
                 let point = this.gamePointToScreenPoint(this.props.selectedPoint);
                 
                 return (
                     <circle
                       cx={point.x}
                       cy={point.y}
                       r="10"
                       stroke="yellow"
                       fill="yellow"
                       />
                 );
             }.bind(this)()
            }

            {(typeof(this.state.hoverPoint) !== "undefined") &&
             function() {
                 let point = this.gamePointToScreenPoint(this.state.hoverPoint);
                 
                 return (
                     <circle
                       cx={point.x}
                       cy={point.y}
                       r="5"
                       stroke="brown"
                       fill="orange"
                       />
                 );
             }.bind(this)()
            }
            </svg>

        );
    }
};

function ServerUnreachable(props) {
    return (
        <div className="TransientErrorMessage">
          Failed to {props.command}. Cannot reach server.
        </div>
    );
}

export {
    houseImageMap,
    ServerUnreachable,
    GameCanvas,
    intToVegetationColor,
    vegetationToInt
};
