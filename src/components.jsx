import React, { Component } from 'react';
import {
    attackBuilding,
    getGameInformation,
    removeHouse,
    sendScout,
    callGeologist,
    removeFlag,
    SMALL_HOUSES,
    MEDIUM_HOUSES,
    LARGE_HOUSES,
    createBuilding,
    createFlag,
    materialToColor,
    getHouseInformation,
    getPlayers
} from './api.js';

var vegetationToInt = {
    "GRASS": 0,
    "MOUNTAIN": 1,
    "SWAMP": 2,
    "WATER": 3,

    'G': 0,
    'M': 1,
    'S': 2,
    'W': 3
};

var intToVegetationColor = {
    0: "green",
    1: "gray",
    2: "brown",
    3: "blue"
};

let immediateState = {
    dragging: false,
    clickOffset: 0
};

let houseImageMap = {
    Bakery:         "bakery-small.png",
    ForesterHut:    "house.png",
    Woodcutter:     "house.png",
    Well:           "well-with-tree-small.png",
    Quarry:         "house.png",
    Barracks:       "barracks-small.png",
    Guardhouse:     "house.png",
    Hunterhut:      "house.png",
    Fishery:        "house.png",
    Goldmine:       "house.png",
    Ironmine:       "house.png",
    Coalmine:       "house.png",
    Granitemine:    "house.png",
    Sawmill:        "sawmill-small.png",
    Watchtower:     "house.png",
    Mill:           "house.png",
    Mint:           "house.png",
    Slaughterhouse: "house.png",
    Catapult:       "house.png",
    Mint:           "house.png",
    Headquarter:    "headquarter-small.png",
    Farm:           "house.png",
    Pigfarm:        "house.png",
    Donkeyfarm:     "house.png",
    Fortress:       "fortress-small.png"
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
                    roundedGameX--;
                } else {
                    roundedGameX++;
                }
            } else if (Math.abs(faultX) < Math.abs(faultY)){
                if (faultY > 0) {
                    roundedGameY--;
                } else {
                    roundedGameY++;
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
                            <image href="worker.png" key={index} x={point.x} y={point.y} width="10" />
                        );
                    } else {
                        let point = this.gamePointToScreenPoint(worker);

                        point.y -= 15;

                        return (
                            <image href="worker.png" key={index} x={point.x} y={point.y} width={10} />
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
                        <image href="flag.png" key={index} x={point.x} y={point.y} width={15} />
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

                    let houseTitle = house.type;

                    if (house.state === "unfinished") {
                        houseTitle = "(" + house.type + ")";
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
                              >{houseTitle}</text>
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

class SelectPlayer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            players: [],
            gettingPlayers: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.url === this.props.url &&
            nextState.players === this.state.players &&
            nextState.gettingPlayers === this.state.gettingPlayers &&
            nextProps.currentPlayer === this.props.currentPlayer) {
            return false;
        }

        return true;
    }

    updatePlayers() {

        getPlayers(this.props.url).then(
            (players) => {
                this.setState({
                    players: players,
                    gettingPlayers: false
                });
            }).catch(
                (a, b, c) => {
                    this.setState({
                        gettingPlayers: false
                    });
                }
            );
    }
    
    componentDidMount() {

        if (this.state.players.length === 0 && this.state.gettingPlayers === false) {
            this.setState({
                gettingPlayers: true
            });

            console.info("Getting list of players from server");
            this.updatePlayers();
        }
    }
    
    onClick(event) {

        for (let player of this.state.players) {
            if (player.id === parseInt(event.target.id, 10)) {
                this.props.onPlayerSelected(player);

                break;
            }
        }
    }
    
    render () {
        return (
            <div className="PlayerSelect MenuSectionContent">
              {this.state.players.map(
                  (player, index) => {

                      // Don't change to ===, this comparison fails for some reason
                      if (typeof(this.props.currentPlayer) != "undefined" && this.props.currentPlayer === player.id) {
                          return (
                              <div key={player.id}
                                   className="Button Selected"
                                   id={player.id}
                                   onClick={this.onClick.bind(this)}>
                                {player.name}
                              </div>
                          );
                      }
                        
                      return (
                          <div key={player.id}
                               className="Button"
                               id={player.id}
                               onClick={this.onClick.bind(this)}>
                            {player.name}
                          </div>
                      );
                  }
              )
              }
            </div>
        );
    }
}

class Menu extends Component {

    constructor(props) {
        super(props);

        this.state = {currentSpeed: 4};
    }

    componentDidMount() {
        let game = getGameInformation(this.props.url);

        this.setState({currentSpeed: game.tickLength});
    }

    render() {

        return (
            <div className="Dialog" ref={(selfName) => {this.selfName = selfName;}}>
              <h1>Menu</h1>

              <div className="MenuSectionLabel">Select player:</div>
              <SelectPlayer onPlayerSelected={this.props.onPlayerSelected}
                            url={this.props.url}
                            currentPlayer={this.props.currentPlayer}
                />

              <div className="MenuSectionLabel">Adjust zoom level:</div>
              <Slider max={this.props.maxZoom}
                      min={this.props.minZoom}
                      initialValue={this.props.currentZoom}
                      less="-"
                      more="+"
                      onValue={this.props.zoom}
                      />

              <div className="MenuSectionLabel">Adjust game speed:</div>
              <Slider max={10}
                      min={1}
                      initialValue={this.state.currentSpeed}
                      less="slower"
                      more="faster"
                      onValue={this.props.adjustSpeed}
                      />

              <div className="Button"
                   onClick={this.props.closeMenu}
                   onKeyDown={(event) => {
                       if (event.which === 27) {
                           this.props.closeMenu();
                           event.stopPropagation();
                       }
                    }
                }
                >Close</div>
            </div>
        );
    }
}

class HeadquarterInfo extends Component {
    constructor(props) {
        super(props);

        let itemsPerPage = 10;

        if (this.props.itemsPerPage) {
            itemsPerPage = this.props.itemsPerPage;
        }

        this.state = {
            inventory: {},
            page: 0,
            itemsPerPage: itemsPerPage
        };
    }

    componentDidMount() {

        getHouseInformation(this.props.house.houseId, this.props.url).then(
            (data) => {
                console.info("Got house information " + JSON.stringify(data));

                this.props.onCanReachServer("get house information");

                this.setState({
                    inventory: data.inventory
                });
            }).catch(
                (a, b, c) => {
                    this.props.onCannotReachServer("get house information");
                }
            );
    };
    
    render() {

        return (
            <div className="DialogSection">
              Inventory
              <div className="InventoryList">
                {Object.keys(this.state.inventory).map(
                    (key, index) => {

                        if (this.state.page * this.state.itemsPerPage <= index &&
                            index < (this.state.page + 1) * this.state.itemsPerPage) {
                            return (
                                <span className="InventoryLabelValuePair" key={index} >
                                  <div className="InventoryLabel">{key.replace(/_/g, ' ')}</div>
                                  <div className="InventoryValue">{this.state.inventory[key]}</div>
                                </span>
                            );
                        } else {
                            return null;
                        }
                    }
                )
                }
            </div>
            <div className="Previous Button" onClick={() => {
                if (this.state.page > 0) {
                    this.setState({
                        page: this.state.page - 1
                    });
                }
            }
                    }
                >Prev</div>
                <div className="Next Button" onClick={() => {
                    if ((this.state.page + 1) * this.state.itemsPerPage <
                        Object.keys(this.state.inventory).length) {
                        this.setState({
                            page: this.state.page + 1
                        });
                    }
                }
                    }
                >Next</div>
            </div>
        );
    }
}

class EnemyHouseInfo extends Component {

    render() {
        return (
            <div className="Dialog">

              <h1>{this.props.house.type}</h1>

              <img src="house.png" className="MediumIcon" alt="House"/>

              <div className="Button"
                   onClick={
                       (event) => {

                           attackBuilding(this.props.house, this.props.player, this.props.url);

                           this.props.closeDialog();

                           event.stopPropagation();
                       }
                }
                >
                Attack
              </div>

              <div className="Button"
                   onClick={
                       (event) => {
                           this.props.closeDialog();

                           event.stopPropagation();
                       }
                }
                >
                Close
              </div>

            </div>
        );
    }
}

class FriendlyHouseInfo extends Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {

        return (
            <div className="Dialog">
              <h1>{this.props.house.type}</h1>
              <img src={houseImageMap[this.props.house.type]} className="MediumIcon" alt="House"/>
              {(this.props.house.type === "Headquarter") &&
                  <HeadquarterInfo house={this.props.house}
                                       url={this.props.url}
                                       onCanReachServer={this.props.onCanReachServer}
                                       onCannotReachServer={this.props.onCannotReachServer}
                                       />
                  }

                  {(this.props.house.type !== "Headquarter") &&
                      <span className="Button"
                                onClick={
                                    (event) => {
                                        removeHouse(this.props.house.houseId, this.props.url);

                                        this.props.closeDialog();

                                        event.stopPropagation();
                                    }
                                }
                            >
                            Destroy
                          </span>
                      }
              <div className="Button"
                   onClick={
                       (event) => {
                           this.props.closeDialog();

                           event.stopPropagation();
                       }
                   }
                   >
                  Close
              </div>
            </div>
        );
    }
}

function FriendlyFlagInfo(props) {
    return (
        <div className="Dialog">
          <h1>Flag</h1>

          <div className="DialogSection">

            <div className="Button ConstructionItem"
                 onClick={(event) => {
                     removeFlag(props.flag.flagId,
                                props.url).then(
                                    () => props.onCanReachServer).catch(
                                        () => props.onCannotReachServer);

                     props.closeDialog();
                     event.stopPropagation();
                  }
              }
              >
              <img src="flag.png" className="SmallIcon" alt="flag"/>
              <div>Remove</div>
            </div>

            <div className="Button ConstructionItem"
                 onClick={(event) => {
                     console.info("Starting to build road");

                     props.startNewRoad(props.flag);

                     props.closeDialog();

                     event.stopPropagation();
              }}
              >
              <img className="SmallIcon" src="road-1.png" alt="Road"/>
              <div>Build road</div>
            </div>

            <div className="Button ConstructionItem"
               onClick={(event) => {
                   console.info("Calling for geologist");

                   callGeologist(props.flag, props.player, props.url);

                   props.closeDialog();

                   event.stopPropagation();
            }}
            >
              <img className="SmallIcon" src="pickaxe2.png" alt="Geologist"/>
              <div>Call geologist</div>
            </div>

            <div className="Button ConstructionItem"
                 onClick={(event) => {
                     console.info("Sending scout");

                     sendScout(props.flag, props.player, props.url);

                     props.closeDialog();

                     event.stopPropagation();
              }}
              >
              <img className="SmallIcon" src="magnifier2.png" alt="Scout"/>
              <div>Send scout</div>
            </div>

          </div>

          <div className="Button"
               onClick={props.closeDialog}
               >
            Close
          </div>

        </div>
    );
}

function ServerUnreachable(props) {
    return (
        <div className="TransientErrorMessage">
          Failed to {props.command}. Cannot reach server.
        </div>
    );
}

class ConstructionInfo extends Component {

    constructor(props) {
        super(props);

        /* Determine which panel to show - buildings or flags and roads */
        let selected;

        if (typeof(props.selected) !== "undefined") {
            selected = props.selected;
        } else if (this.canBuildHouse() || this.canBuildMine()) {
            selected = "Buildings";
        } else {
            selected = "FlagsAndRoads";
        }

        /* In the case of buildings, start by showing small buildings */

        this.state = {
            selected: selected,
            buildingSizeSelected: "small"
        };
    }

    canRaiseFlag() {
        return this.props.point.canBuild.find((x) => x === "flag");
    }

    canBuildHouse() {
        return this.canBuildSmallHouse() || this.canBuildMediumHouse() || this.canBuildLargeHouse();
    }

    canBuildLargeHouse() {
        return this.props.point.canBuild.find((x) => x === "large");
    }

    canBuildMediumHouse() {
        return this.props.point.canBuild.find((x) => x === "medium");
    }

    canBuildSmallHouse() {
        return this.props.point.canBuild.find((x) => x === "small");
    }

    canBuildMine() {
        return this.props.point.canBuild.find((x) => x === "mine");
    }

    canBuildRoad() {
        return this.props.point.isType === "flag";
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return nextState.selected !== this.state.selected ||
            nextState.buildingSizeSelected !== this.state.buildingSizeSelected;
    }

    render () {

        return (
            <div className="Dialog" id="ConstructionInfo">
              <h1>Construction</h1>

              <div className="PanelChoices">
                {this.canBuildHouse() &&
                    <div className={this.state.selected === "Buildings" ? "Button SelectedChoice" : "Button Choice"}
                             onClick={() => this.setState({selected: "Buildings"})}
                          >
                          Buildings
                        </div>
                    }
                    {this.canRaiseFlag() &&
                        <div className={this.state.selected === "FlagsAndRoads" ? "Button SelectedChoice" : "Button Choice"}
                                 onClick={() => this.setState({selected: "FlagsAndRoads"})}
                              >
                              Flags and roads
                            </div>
                        }
              </div>

              {this.state.selected === "FlagsAndRoads" &&
                  <div className="DialogSection">
                            <div className="DialogSection">
                                  <div className="Button ConstructionItem"
                                           onClick={(event) => {
                                               console.info("Raising flag");
                                               createFlag(this.props.point,
                                                          this.props.player,
                                                          this.props.url).then(
                                                              () => this.props.onCanReachServer
                                                          ).catch(
                                                              () => this.props.onCannotReachServer
                                                          );
                                                   
                                               this.props.closeDialog();
                                               event.stopPropagation();
                                           }
                                                   }
                                        >
                                        <img className="SmallIcon"
                                                 src="flag.png"
                                                 alt="Flag"/>
                                            <div>Raise flag</div>
                                      </div>
                                      {this.canBuildRoad() &&
                                       <div className="Button ConstructionItem"
                                                onClick={(event) =>{
                                                    console.info("Starting to build road");

                                                    this.props.startNewRoad(this.props.point);

                                                    event.stopPropagation();
                                                }}
                                             >
                                             <img className="SmallIcon"
                                                      src="road-1.png"
                                                      alt="Road"/>
                                                 <div>Build road</div>
                                           </div>
                                           }
                                </div>
                      </div>
                  }
              
                  {this.state.selected === "Buildings" &&
                      <div className="PanelChoices">
                            <div className={this.state.buildingSizeSelected === "small" ? "Button SelectedChoice" : "Button Choice"}
                                     onClick={() => this.setState({buildingSizeSelected: "small"})}
                                  >
                                  Small
                                </div>
                                <div className={this.state.buildingSizeSelected === "medium" ? "Button SelectedChoice" : "Button Choice"}
                                         onClick={() => this.setState({buildingSizeSelected: "medium"})}
                                      >
                                      Medium
                                    </div>
                                    <div className={this.state.buildingSizeSelected === "large" ? "Button SelectedChoice" : "Button Choice"}
                                             onClick={() => this.setState({buildingSizeSelected: "large"})}
                                          >
                                          Large
                                        </div>

                          </div>
                      }

                      {this.state.selected === "Buildings" && this.state.buildingSizeSelected === "small" &&
                          <div className="DialogSection">
                                    {SMALL_HOUSES.map((house, index) => {

                                        return (
                                            <div className="Button ConstructionItem"
                                                 key={index}
                                                 onClick={(event) => {
                                                     console.info("Creating house");
                                                     createBuilding(house,
                                                                    this.props.point,
                                                                    this.props.player,
                                                                    this.props.url).then(
                                                                        this.props.onCanReachServer("create building")
                                                                    ).catch(
                                                                        this.props.onCannotReachServer("create building")
                                                                    );

                                                     this.props.closeDialog();

                                                     event.stopPropagation();
                                                  }
                                              }
                                              >
                                              <img src={houseImageMap[house]}
                                                   className="SmallIcon"
                                                   alt="House"/>
                                              <div>
                                                {house}
                                              </div>
                                            </div>
                                        );
                                    })
                                    }
                       </div>
                      }

            {this.state.selected === "Buildings"          &&
             this.canBuildMediumHouse()                   &&
             this.state.buildingSizeSelected === "medium" &&
             <div className="DialogSection">
             {MEDIUM_HOUSES.map((house, index) => {

                 return (
                     <div className="Button ConstructionItem"
                          key={index}
                          onClick={(event) => {
                              console.info("Creating house");
                              createBuilding(house,
                                             this.props.point,
                                             this.props.player,
                                             this.props.url).then(
                                                 () => this.props.onCanReachServer("create building")
                                             ).catch(
                                                 () => this.props.onCannotReachServer("create building")
                                             );

                              this.props.closeDialog();

                              event.stopPropagation();
                           }
                       }
                       >
                       <img src={houseImageMap[house]}
                            className="SmallIcon"
                            alt="House"/>

                       <div>
                         {house}
                       </div>
                     </div>
                 );
             })
             }
             </div>
            }

            {this.state.selected === "Buildings"         &&
             this.canBuildMediumHouse()                  &&
             this.state.buildingSizeSelected === "large" &&
             <div className="DialogSection">
             {LARGE_HOUSES.map((house, index) => {

                 if (house === "Headquarter") {
                     return null;
                 } else {

                     return (
                         <div className="Button ConstructionItem"
                              key={index}
                              onClick={(event) => {
                                  console.info("Creating house");
                                  createBuilding(house,
                                                 this.props.point,
                                                 this.props.player,
                                                 this.props.url).then(
                                                     () => this.props.onCanReachServer("create building")
                                                 ).catch(
                                                     () => this.props.onCannotReachServer("create building")
                                                 );
                                  this.props.closeDialog();

                                  event.stopPropagation();
                               }
                           }
                           >
                           <img src={houseImageMap[house]}
                                className="SmallIcon"
                                alt="House"/>
                           <div>
                             {house}
                           </div>
                         </div>
                     );
                 }
             })
             }
             </div>
            }

                <div className="Button"
            onClick={this.props.closeDialog}
                >
                Close
            </div>
                </div>
        );
    }
}

class Slider extends Component {

    constructor(props) {
        super(props);

        this.state = ({
            step: (typeof(this.props.step) !== "undefined") ? this.props.step : 1,
            value: this.props.initialValue,
            scaleLength: 0
        });
    }

    componentDidMount() {

        this.setState({
            scaleLength: this.scale.clientWidth
        });

        this.indicator.focus();
    }
    
    render() {
        let percentage = (this.state.value - this.props.min) / (this.props.max - this.props.min);

        return (
            <div className="Slider MenuSectionContent">
              <div className="SliderLessLabel Button"
                   onClick={(event) => {
                       console.info("Decreasing");

                       let newValue = 0;
                       
                       if (this.state.value - this.state.step < this.props.min) {
                           newValue = this.props.min;
                       } else {
                           newValue = this.state.value - this.state.step;
                       }

                       this.setState({value: newValue});
                       this.props.onValue(newValue);

                       event.stopPropagation();
                   }
               }
                   >{this.props.less}</div>
              <div className="SliderScale"
                   ref={(selfName) => {this.scale = selfName;}}
                onMouseDown={
                    (event) => {
                        
                        if (event.target === this.indicator) {

                            /* Convert to game coordinates */
                            let dim = event.currentTarget.getBoundingClientRect();
                            let relativeX = event.clientX - dim.left;

                            event.stopPropagation();

                            immediateState.dragging = true;
                            immediateState.clickOffset = relativeX - this.indicator.offsetLeft;
                        }
                    }
                }

                onMouseMove={(event) => {
                    if (immediateState.dragging) {

                        /* Convert to game coordinates */
                        let dim = event.currentTarget.getBoundingClientRect();
                        let relativeX = event.clientX - dim.left;
                        
                        relativeX -= immediateState.clickOffset;

                        let newPercentage = relativeX / this.scale.clientWidth;
                        let newValue = (this.props.max - this.props.min) * newPercentage + this.props.min;

                        if (newValue >= this.props.min && newValue <= this.props.max) {
                            this.setState({value: newValue});

                            this.props.onValue(newValue);
                        }

                        event.stopPropagation();
                    }
                }}
                  
                onMouseUp={
                    (event) => {

                        if (immediateState.dragging) {
                            immediateState.dragging = false;

                            event.stopPropagation();
                        }
                    }
                  }

                  onMouseOut={
                      (event) => {
                          if (immediateState.dragging) {
                              immediateState.dragging = false;

                              event.stopPropagation();
                          }
                      }
                  }
                  
                >
                <div className="SliderIndicator"
                     tabIndex="0"
                     ref={(selfName) => this.indicator = selfName}
                     style={
                         {left: "" + (percentage * 100) + "%"}
                     }
                  
                     />
              </div>
              <div className="SliderMoreLabel Button"
                   onClick={() => {
                       console.info("Decreasing");

                       let newValue = 0;

                       if (this.state.value + this.state.step > this.props.max) {
                           newValue = this.props.max;
                       } else {
                           newValue = this.state.value + this.state.step;
                       }

                       this.setState({value: newValue});
                       this.props.onValue(newValue);
                    }
                }
                >{this.props.more}</div>
            </div>
        );
    }
}

export {
    EnemyHouseInfo,
    ConstructionInfo,
    ServerUnreachable,
    FriendlyFlagInfo,
    FriendlyHouseInfo,
    Menu,
    GameCanvas,
    intToVegetationColor,
    vegetationToInt,
    SelectPlayer
};
