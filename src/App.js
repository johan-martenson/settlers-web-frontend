import React, { Component } from 'react';
import {
    MenuButton,
    EnemyHouseInfo,
    ConstructionInfo,
    ServerUnreachable,
    vegetationToInt,
    GameCanvas,
    Menu,
    FriendlyHouseInfo,
    FriendlyFlagInfo
} from './components.jsx';

import {
    Guide
} from './guide.jsx';

import {
    setSpeed,
    getTerrain,
    getViewForPlayer,
    getInformationOnPoint,
    createFlag,
    createRoad,
    getPlayers
} from './api.js';

import './App.css';

var MENU_MENU = 0;
var MENU_FRIENDLY_HOUSE = 1;
var MENU_FRIENDLY_FLAG = 2;
var MENU_CONSTRUCTION = 3;
var MENU_GUIDE = 4;

var MAX_SCALE = 50;
var MIN_SCALE = 10;

var LONGEST_TICK_LENGTH = 500;

var globalSyncState = {
    mouseDown: false,
    mouseDownX: 0,
    mouseDownY: 0,
    mouseMoving: false,
    translateXAtMouseDown: 0,
    translateYAtMouseDown: 0,
    width: 0,
    height: 0
};

let ongoingTouches = {};

class App extends Component {

    constructor(props) {
        super(props);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchCancel = this.onTouchCancel.bind(this);

        this.onKeyDown = this.onKeyDown.bind(this);

        this.periodicFetch = this.periodicFetch.bind(this);
        this.toggleDetails = this.toggleDetails.bind(this);

        this.keyHandlers = {
            27: this.closeActiveMenu.bind(this), // ESC
            32: this.toggleDetails.bind(this),   // SPACE
            38: this.moveGameUp.bind(this),      // UP
            40: this.moveGameDown.bind(this),    // DOWN
            39: this.moveGameRight.bind(this),   // RIGHT
            37: this.moveGameLeft.bind(this),    // LEFT
            187: this.zoomIn.bind(this),         // +
            189: this.zoomOut.bind(this),        // -
            77: this.showMenu.bind(this)         // M
        };
        
        this.state = {
            houses: [],
            workers: [],
            roads: [],
            flags: [],
            trees: [],
            stones: [],
            borders: [],
            signs: [],
            animals: [],
            translateX: 0,
            translateY: 0,
            selected: {x: 0, y: 0},
            scale: 30,
            terrain: [],
            gameWidth: 0,
            gameHeight: 0,
            player: 0,
            menuVisible: false,
            discoveredPoints: new Map(),
            details: true
        };
    }

    toggleDetails() {
        console.info("Toggling details, was " + this.state.details);
        this.setState({details: !this.state.details});
    }

    onCannotReachServer(cmd) {
        this.setState({
            serverUnreachable: cmd
        });
    }

    onCanReachServer(cmd) {
        this.setState({
            serverUnreachable: undefined
        });
    }

    closeActiveMenu() {

        console.info("Closing active menu");

        if (typeof(this.state.activeMenu) === "undefined") {
            console.info("No active menu to close");
            return;
        }

        if (this.state.activeMenu === MENU_MENU) {
            console.info("Closing main menu");
            this.setState({menuVisible: false});
        } else if (this.state.activeMenu === MENU_FRIENDLY_HOUSE) {
            console.info("Closing friendly house menu");
            this.setState({showFriendlyHouseInfo: undefined});
        } else if (this.state.activeMenu === MENU_FRIENDLY_FLAG) {
            console.info("Closing friendly flag menu");
            this.setState({showFriendlyFlagInfo: undefined});
        } else if (this.state.activeMenu === MENU_CONSTRUCTION) {
            console.info("Closing construction menu");
            this.setState({showConstructionInfo: undefined});
        } else if (this.state.activeMenu === MENU_GUIDE) {
            console.info("Closing guide");
            this.setState({showHelp: undefined});
        }
    }
    
    onPlayerSelected(player) {
        console.info("Selected player " + player);

        console.info(" - Player id " + player.id);
        console.info(" - Player name " + player.name);
        console.info(" - Center spot " + player.centerPoint);

        let newTranslateX = this.state.translateX;
        let newTranslateY = this.state.translateY;

        if (typeof(player.centerPoint) !== "undefined") {
            newTranslateX = (globalSyncState.width  / 2) - player.centerPoint.x * this.state.scale;
            newTranslateY = (globalSyncState.height / 2) + player.centerPoint.y * this.state.scale - globalSyncState.height;
        }

        this.setState({
	    translateX: newTranslateX,
	    translateY: newTranslateY,
            player: player.id,
            discoveredPoints: new Map(player.discoveredPoints.map(
                (point) => ["x" + point.x + "y" + point.y, 1]))
        });
    }

    closeFriendlyHouseInfo() {
        console.info("Closing friendly house info");
        this.setState(
            {
                showFriendlyHouseInfo: undefined
            }
        );
        
    }

    showMenu() {

        /* Close active dialogs first */
        this.closeActiveMenu();

        /* Open the menu */
        this.setState(
            {
                menuVisible: true,
                activeMenu: MENU_MENU
            }
        );
    }

    showHelp() {
        this.setState(
            {
                activeMenu: MENU_GUIDE,
                showHelp: true
            }
        );
    }

    moveGameUp() {
        this.setState({
	    translateY: this.state.translateY + 10
        });
    }

    moveGameDown() {
        this.setState({
	    translateY: this.state.translateY - 10
        });
    }

    moveGameRight() {
        this.setState({
	    translateX: this.state.translateX - 10
        });
    }

    moveGameLeft() {
        this.setState({
	    translateX: this.state.translateX + 10
        });
    }
    
    zoomIn() {
        this.zoom(this.state.scale + 1);
    }


    /* Should move to the game canvas so the app doesn't have to know about this */
    zoom(scale) {

        /* Center after zooming */
        scale = Math.min(scale, MAX_SCALE);
        scale = Math.max(scale, MIN_SCALE);

        let newTranslateX = globalSyncState.width / 2 - (((globalSyncState.width / 2) - this.state.translateX) / this.state.scale) * scale;
        let newTranslateY = -globalSyncState.height + (globalSyncState.height - (globalSyncState.height / 2) + this.state.translateY)/this.state.scale * scale + (globalSyncState.height / 2);

        this.setState({
	    translateX: newTranslateX,
	    translateY: newTranslateY,
	    scale: scale
        });
    }

    onSpeedSliderChange(value) {
        setSpeed(Math.round(LONGEST_TICK_LENGTH / value), this.props.url);
    }
    
    zoomOut() {
        this.zoom(this.state.scale - 1);
    }

    onMouseDown(event) {
        globalSyncState.mouseDown = true;
        globalSyncState.mouseDownX = event.pageX;
        globalSyncState.mouseDownY = event.pageY;
        globalSyncState.mouseMoving = false;

        globalSyncState.translateXAtMouseDown = this.state.translateX;
        globalSyncState.translateYAtMouseDown = this.state.translateY;

        event.stopPropagation();
    }

    onMouseMove(event) {
	if (globalSyncState.mouseDown) {
	    let deltaX = (event.pageX - globalSyncState.mouseDownX);
	    let deltaY = (event.pageY - globalSyncState.mouseDownY);

            /* Detect move to separate move from click */
            if (deltaX*deltaX + deltaY*deltaY > 25) {
                globalSyncState.mouseMoving = true;
            }
            
	    this.setState({
		translateX: globalSyncState.translateXAtMouseDown + deltaX,
		translateY: globalSyncState.translateYAtMouseDown + deltaY
	    });
	}

        event.stopPropagation();
    }

    onMouseUp(event) {
        globalSyncState.mouseDown = false;

        event.stopPropagation();
    }

    periodicFetch() {

        if (this.state.player) {
        
            getViewForPlayer(this.props.url, this.state.player).then(
                (data) => {

                    this.setState({
                        houses: data.houses,
                        workers: data.workers,
                        roads: data.roads,
                        trees: data.trees,
                        flags: data.flags,
                        stones: data.stones,
                        borders: data.borders,
                        signs: data.signs,
                        animals: data.animals,
                        discoveredPoints: new Map(data.discoveredPoints.map(
                            (point) => ["x" + point.x + "y" + point.y, 1]))
                    });

                    this.onCanReachServer("get view for player");
                }).catch(
                    () => {
                        this.onCannotReachServer("get view for player");
                    }
                );
        }

        setTimeout(this.periodicFetch, 100);
    }

    componentDidMount() {

        // Store the width and height of the canvas when it's been rendered
        globalSyncState.width = this.selfName.clientWidth;
        globalSyncState.height = this.selfName.clientHeight;

        console.info("Screen width: " + globalSyncState.width + ", height: " + globalSyncState.height);

        /* Request focus if the game is not blocked */
        if (!this.state.menuVisible) {
            console.info("Putting focus on main game screen");
            this.selfName.focus();
        }

        /* Fetch the view for the first time and center on the player's headquarter */
        getPlayers(this.props.url).then(
            (players) => {
                this.onCanReachServer("get players");

                console.info("Got players");
                console.info(players);

                this.setState({
                    player: players[0].id
                });

                getViewForPlayer(this.props.url, players[0].id).then(
                    (data) => {

                        console.info("Got initial data for player");

                        // Center the view on the headquarter on the first update
                        let headquarter = data.houses.find(h => h.type === "Headquarter");

                        let translateX = (globalSyncState.width / 2) - headquarter.x*this.state.scale;
                        let translateY = -globalSyncState.height + (globalSyncState.height / 2) + headquarter.y*this.state.scale;

                        this.setState({
                            houses: data.houses,
                            workers: data.workers,
                            roads: data.roads,
                            trees: data.trees,
                            flags: data.flags,
                            stones: data.stones,
                            borders: data.borders,
                            signs: data.signs,
                            animals: data.animals,
                            translateX: translateX,
                            translateY: translateY,
                            discoveredPoints: new Map(data.discoveredPoints.map(
                                (point) => ["x" + point.x + "y" + point.y, 1]))
                        });
                    }).catch(
                        () => this.onCannotReachServer("get view for player")
                    );
            }
        ).catch (
            () => this.onCannotReachServer("get players")
        );

        // Start getting game updates continuously from the server
        this.periodicFetch();

        // Get the terrain once
        if (this.state.terrain.length === 0) {
            console.info("Getting terrain from the server");
            getTerrain(this.props.url).then(
                (data) => {
                    console.info(JSON.stringify("Got terrain data from server"));

                    let start = 1;
                    let count = 0;
                    let terrain = new Array(((data.width * data.height) / 2) + 1);

                    for (let y = 1; y < data.height; y++) {
                        for (let x = start; x + 1 < data.width; x+= 2) {

                            let tile = {
                                x: x,
                                y: y,
                                straightBelow: vegetationToInt[data.straightBelow[count]],
                                belowToTheRight: vegetationToInt[data.belowToTheRight[count]]
                            };

                            terrain[count] = tile;

                            count++;
                        }

                        if (start === 1) {
                            start = 2;
                        } else {
                            start = 1;
                        }
                    }

                    this.setState({
                        terrain: terrain,
                        gameWidth: data.width,
                        gameHeight: data.height
                    });

                    this.onCanReachServer("get terrain");
                }
            ).catch(
                () => this.onCannotReachServer("get terrain")
            );
        }


        /* Listen for changes in the window size */
        window.addEventListener("resize", () => {
            globalSyncState.width = this.selfName.clientWidth;
            globalSyncState.height = this.selfName.clientHeight;
        });
    }

    onPointClicked(point) {
        console.info("Point clicked");

        /* Filter clicks that are really the end of moving the mouse */
        if (globalSyncState.mouseMoving) {
            return;
        }

        /* A road is being built */
        if (this.state.newRoad) {

            let recent = this.state.newRoad[this.state.newRoad.length - 1];

            /* Handle the case when a flag is clicked and create a road to it */
            if (this.state.flags.find((f) => f.x === point.x && f.y === point.y)) {

                console.info("Placing road directly to flag");
                
                createRoad(this.state.newRoad.concat(point),
                           this.state.player,
                           this.props.url).then(
                               () => this.onCanReachServer("create road")
                           ).catch(
                               () => this.onCannotReachServer("create road")
                           );

                this.setState({
                    newRoad: undefined,
                    possibleRoadConnections: []
                });

            /* If the point is new, add it to the ongoing road */
            } else if (recent.x !== point.x || recent.y !== point.y) {
                console.info("Adding segment to road (onPointClicked) " + JSON.stringify(point));

                this.setState({
                    newRoad: this.state.newRoad.concat(point)
                });

                /* Get the available connections from the added point */
                getInformationOnPoint(point, this.props.url, this.state.player).then(
                    (data) => {
                        this.onCanReachServer("get information about point");
                                              
                        console.info("Got possible points 2");

                        this.setState({
                            possibleRoadConnections: data.possibleRoadConnections
                        });
                    }
                ).catch(
                    (a, b, c) => {
                        this.onCannotReachServer("get information about point");
                    }
                );
            }

        /* Select the point */
        } else {
            console.info("Selecting point: " + point.x + ", " + point.y);
            this.setState({
                selected: point
            });
        }
    }

    /* Determine if the given point is discovered by the curren player */
    pointIsDiscovered(point) {
        let key = "x" + point.x + "y" + point.y;
        return this.state.discoveredPoints.has(key);
    }

    onDoubleClick(point) {
        console.info("Double click on " + point.x + ", " + point.y);

        /* First, handle double clicks differently if a new road is being created */
        if (this.state.newRoad) {

            createFlag(point, this.state.player, this.props.url).then(
                (data) => {
                    this.onCanReachServer("create flag");

                    console.info("Created flag");

                    createRoad(this.state.newRoad,
                               this.state.player,
                               this.props.url).then(
                                   (data) => {
                                       this.onCanReachServer("build road");

                                       console.info("Created road");
                                          
                                       this.setState({
                                           newRoad: undefined,
                                           possibleRoadConnections: undefined
                                       });
                                   }
                               ).catch(
                                   (a, b, c) => {
                                       this.onCannotReachServer("build road");
                                   }
                                      );
                }).catch(
                    (a, b, c) => {
                        this.onCannotReachServer("create flag");
                    });

            return;
        }
        
        /* Ignore double clicks on undiscovered land */
        if (!this.pointIsDiscovered(point)) {
            console.info("Ignoring un-discovered point");
            return true;
        }

        /* Handle click on house */
        let house = this.state.houses.find((house) => house.x === point.x && house.y === point.y);

        console.info("Found this house on the spot: " + JSON.stringify(house));

        if (typeof(house) !== "undefined") {
            console.info("Clicked house " + JSON.stringify(house));

            /* Show friendly house info for own house */
            if (house.playerId === this.state.player) {
                console.info("Friendly house");

                this.setState({
                    menuVisible: false,
                    showFriendlyHouseInfo: {house: house},
                    activeMenu: MENU_FRIENDLY_HOUSE
                });
            } else {

                /* Show minimal house info for enemy's house */
                this.setState({
                    menuVisible: false,
                    showEnemyHouseInfo: {house: house}
                });
            }

            return true;
        }

        /* Handle the case where a flag was double clicked */
        let flag = this.state.flags.find((flag) => flag.x === point.x && flag.y === point.y);

        console.info("Found this flag on the spot: " + JSON.stringify(flag));

        if (typeof(flag) !== "undefined") {

            console.info("Clicked flag");

            /* Show friendly flag dialog */
            if (flag.playerId === this.state.player) {
                console.info("Friendly flag");

                this.setState(
                    {
                        menuVisible: false,
                        showFriendlyFlagInfo: {flag: flag},
                        activeMenu: MENU_FRIENDLY_FLAG
                    }
                );
            }

            return true;
        }

        /* Ask the server for what can be done on the spot */
        getInformationOnPoint(point, this.props.url, this.state.player).then(
            (data) => {

                this.onCanReachServer("get point information");

                // x, y
                // canBuild: ['small', 'medium', 'large', 'flag', 'mine', 'harbor']
                // isType: ('flag' | 'building' | 'stone' | 'tree')
                // (building: {type: ..., } | 
                if (typeof(data.canBuild) !== "undefined" && data.canBuild.length !== 0) {
                    this.setState({
                        showConstructionInfo: data,
                        activeMenu: MENU_CONSTRUCTION
                    });
                }
            }).catch(
                (a, b, c) => {
                    this.onCannotReachServer("get point information");
                });

        return true;
    }
    
    onKeyDown(event) {
        console.info("Key down: " + event.which);

        if (event.which in this.keyHandlers) {
            this.keyHandlers[event.which]();
        }
    }

    startNewRoad(point) {

        /* Start the list of points in the new road with the clicked point */
        console.info("Add segment to road (startNewRoad) " + JSON.stringify(point));
        this.setState({
            newRoad: [point]
        });

        /* Get the possible connections from the server and draw them */
        getInformationOnPoint(point, this.props.url, this.state.player).then(
            (data) => {
                this.onCanReachServer("get information about point");

                this.setState({
                    possibleRoadConnections: data.possibleRoadConnections
                });
            }).catch(
                () => {
                    this.onCannotReachServer("get information about point");
                }
            );
    }

    screenPointToGamePoint(screenPoint) {

        let gameX = (screenPoint.x - this.props.translateX) / this.props.scale;
        let gameY = (screenPoint.y - this.props.translateY) / this.props.scale;

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

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    }

    onTouchStart(evt) {

        evt.preventDefault();

        console.log("touchstart.");

        let touches = evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {

            console.log("touchstart:" + i + "...");

            ongoingTouches[touches[i].identifier] = this.copyTouch(touches[i]);

            console.log("touchstart:" + i + ".");
        }

        /* Only move map with one movement */
        if (!globalSyncState.touchMoveOngoing) {
            let touch = touches[0];

            globalSyncState.touchIdentifier = touch.identifier;

            globalSyncState.mouseDownX = touch.pageX;
            globalSyncState.mouseDownY = touch.pageY;
            globalSyncState.mouseMoving = false;
            globalSyncState.touchMoveOngoing = true;

            globalSyncState.translateXAtMouseDown = this.state.translateX;
            globalSyncState.translateYAtMouseDown = this.state.translateY;
        }
    }

    onTouchMove(evt) {

        evt.preventDefault();

        var touches = evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            let touch = ongoingTouches[touches[i].identifier];

            if (globalSyncState.touchMoveOngoing && touch.identifier === globalSyncState.touchIdentifier) {
	        let deltaX = (touch.pageX - globalSyncState.mouseDownX);
	        let deltaY = (touch.pageY - globalSyncState.mouseDownY);

                /* Detect move to separate move from click */
                if (deltaX*deltaX + deltaY*deltaY > 25) {
                    globalSyncState.mouseMoving = true;
                }

	        this.setState({
		    translateX: globalSyncState.translateXAtMouseDown + deltaX,
		    translateY: globalSyncState.translateYAtMouseDown + deltaY
	        });
            }

            /* Store ongoing touches just because ... */
            if (touch) {
                console.log("continuing touch " + touch);

                console.log("ctx.moveTo(" + touch.pageX + ", " + touch.pageY + ");");

                console.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");

                ongoingTouches[touch.identifier] = touches[i];
                console.log(".");
            } else {
                console.log("can't figure out which touch to continue");
            }
        }
    }

    onTouchCancel(evt) {
        evt.preventDefault();

        console.log("touchcancel.");

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false;

        let touches = evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            delete ongoingTouches[touches[i].identifier];
        }
    }

    onTouchEnd(evt) {

        evt.preventDefault();

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false;

        let touches = evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            let touch = ongoingTouches[touches[i].identifier];

            if (touch) {
                delete ongoingTouches[touches[i].identifier];
            } else {
                console.log("can't figure out which touch to end");
            }
        }
    }

    render() {

        return (
            <div
              className="App"
              ref={(selfName) => {this.selfName = selfName;}}
              onMouseDown={this.onMouseDown}
              onMouseMove={this.onMouseMove}
              onMouseUp={this.onMouseUp}
              onKeyDown={this.onKeyDown}
              onTouchStart={this.onTouchStart}
              onTouchMove={this.onTouchMove}
              onTouchEnd={this.onTouchEnd}
              onTouchCancel={this.onTouchCancel}
              tabIndex="1">

              <GameCanvas
                terrain={this.state.terrain}
                discoveredPoints={this.state.discoveredPoints}
                roads={this.state.roads}
                houses={this.state.houses}
                trees={this.state.trees}
                flags={this.state.flags}
                workers={this.state.workers}
                stones={this.state.stones}
                borders={this.state.borders}
                signs={this.state.signs}
                animals={this.state.animals}
                scale={this.state.scale}
                translateX={this.state.translateX}
                translateY={this.state.translateY}
                screenWidth={globalSyncState.width}
                screenHeight={globalSyncState.height}
                onKeyDown={this.onKeyDown}
                onPointClicked={this.onPointClicked.bind(this)}
                selectedPoint={this.state.selected}
                hoverPoint={this.state.hoverPoint}
                inFocus={!this.state.menuVisible}
                onDoubleClick={this.onDoubleClick.bind(this)}
                houseTitles={this.state.details}
                newRoad={this.state.newRoad}
                possibleRoadConnections={this.state.possibleRoadConnections}
                />

              <MenuButton onMenuButtonClicked={this.showMenu.bind(this)} />

              {this.state.menuVisible &&
                  <Menu
                        currentPlayer={this.state.player}
                        url={this.props.url}
                        closeMenu={this.closeActiveMenu.bind(this)}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                        zoom={this.zoom.bind(this)}
                        currentZoom={this.state.scale}
                        minZoom={MIN_SCALE}
                        maxZoom={MAX_SCALE}
                        adjustSpeed={this.onSpeedSliderChange.bind(this)}
                        showHelp={this.showHelp.bind(this)}
                  />
              }

              {typeof(this.state.showFriendlyHouseInfo) !== "undefined" &&
                  <FriendlyHouseInfo house={this.state.showFriendlyHouseInfo.house}
                                         url={this.props.url}
                                         player={this.state.player}
                                         closeDialog={this.closeActiveMenu.bind(this)}
                                         onCanReachServer={this.onCanReachServer.bind(this)}
                                         onCannotReachServer={this.onCannotReachServer.bind(this)}
                                         />
              }

              {typeof(this.state.showFriendlyFlagInfo) !== "undefined" &&
                  <FriendlyFlagInfo flag={this.state.showFriendlyFlagInfo.flag}
                                            closeDialog={this.closeActiveMenu.bind(this)}
                                            url={this.props.url}
                                            onCanReachServer={this.onCanReachServer.bind(this)}
                                            onCannotReachServer={this.onCannotReachServer.bind(this)}
                                            startNewRoad={this.startNewRoad.bind(this)}
                                            player={this.state.player}
                                            />
              }

              {typeof(this.state.showEnemyHouseInfo) !== "undefined" &&
                  <EnemyHouseInfo house={this.state.showEnemyHouseInfo.house}
                                      url={this.props.url}
                                      closeDialog={this.closeActiveMenu.bind(this)}
                                      onCanReachServer={this.onCanReachServer.bind(this)}
                                      onCannotReachServer={this.onCannotReachServer.bind(this)}
                                      player={this.state.player}
                                      />
              }

              {typeof(this.state.showHelp) !== "undefined" &&
                  <Guide closeDialog={this.closeActiveMenu.bind(this)}/>
              }

              {typeof(this.state.serverUnreachable) !== "undefined" &&
                  <ServerUnreachable command={this.state.serverUnreachable}
                                                 />
              }

              {typeof(this.state.showConstructionInfo) !== "undefined" &&
                  <ConstructionInfo point={this.state.showConstructionInfo}
                                        closeDialog={this.closeActiveMenu.bind(this)}
                                        url={this.props.url}
                                        player={this.state.player}
                                        onCanReachServer={this.onCanReachServer.bind(this)}
                                        onCannotReachServer={this.onCannotReachServer.bind(this)}
                                        startNewRoad={this.startNewRoad.bind(this)}
                                        />
              }
            </div>
        );
    }
}

export default App;
