import React, { Component } from 'react';
import {
    vegetationToInt,
    GameCanvas,
    TerrainList,
    ScreenPoint
} from './game_render';

import { pointToString, pointSetToStringSet } from './utils'

import FriendlyFlagInfo     from './friendly_flag_info';
import MenuButton           from './menu_button';
import { ConstructionInfo } from './construction_info';
import FriendlyHouseInfo    from './friendly_house_info';
import EnemyHouseInfo       from './enemy_house_info';
import GameMenu             from './game_menu';

import Guide from './guide';

import {
    setSpeed,
    getTerrain,
    getViewForPlayer,
    getInformationOnPoint,
    createFlag,
    createRoad,
    getPlayers,
    PlayerInformation,
    HouseInformation,
    WorkerInformation,
    RoadInformation,
    FlagInformation,
    TreeInformation,
    StoneInformation,
    BorderInformation,
    SignInformation,
    AvailableConstruction,
    CropInformation,
    AnimalInformation,
    PointInformation,
    PointString,
    Point,
    PlayerId,
    GameId
} from './api';

import './App.css';

const MENU_MENU = 0;
const MENU_FRIENDLY_HOUSE = 1;
const MENU_FRIENDLY_FLAG = 2;
const MENU_CONSTRUCTION = 3;
const MENU_GUIDE = 4;

const MAX_SCALE = 50;
const MIN_SCALE = 10;

const LONGEST_TICK_LENGTH = 500;

let globalSyncState = {
    mouseDown: false,
    mouseDownX: 0,
    mouseDownY: 0,
    mouseMoving: false,
    touchMoveOngoing: false,
    touchIdentifier: 0,
    translateXAtMouseDown: 0,
    translateYAtMouseDown: 0,
    width: 0,
    height: 0
};

const ongoingTouches: Map<any, StoredTouch> = new Map();

interface StoredTouch {
    identifier: any
    pageX: number
    pageY: number
}

interface ShowFriendlyHouseInfo {
    house: HouseInformation
}

interface ShowFriendlyFlagInfo {
    flag: FlagInformation
}

interface ShowEnemyHouseInfo {
    house: HouseInformation
}

interface AppProps {
    selfPlayerId: PlayerId
    gameId: GameId
}

interface AppState {
    houses: HouseInformation[]
    workers: WorkerInformation[]
    roads: RoadInformation[]
    flags: FlagInformation[]
    trees: TreeInformation[]
    stones: StoneInformation[]
    borders: BorderInformation[]
    signs: SignInformation[]
    crops: CropInformation[]
    animals: AnimalInformation[]
    availableConstruction: Map<PointString, AvailableConstruction>
    discoveredPoints: Set<string>

    newRoad?: Point[]
    possibleRoadConnections?: Point[]
    
    selected: Point

    scale: number

    terrain: TerrainList
    
    translateX: number
    translateY: number

    gameWidth: number
    gameHeight: number

    player: PlayerId

    activeMenu?: 0 | 1 | 2 | 3 | 4;
    
    showFriendlyHouseInfo?: ShowFriendlyHouseInfo
    showFriendlyFlagInfo?: ShowFriendlyFlagInfo
    showConstructionInfo?: PointInformation
    showEnemyHouseInfo?: ShowEnemyHouseInfo
    showHelp?: boolean
    menuVisible: boolean

    showTitles: boolean
    showAvailableConstruction: boolean

    serverUnreachable?: string
}

class App extends Component<AppProps, AppState> {

    private keyHandlers: Map<number, (() => void)> = new Map();
    private selfNameRef = React.createRef<HTMLDivElement>();
    
    constructor(props: AppProps) {
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

        this.zoomOut = this.zoomOut.bind(this);
        this.zoomIn = this.zoomIn.bind(this);

        this.keyHandlers.set(27, this.closeActiveMenu) // ESC
        this.keyHandlers.set(32, this.toggleDetails)   // SPACE
        this.keyHandlers.set(38, this.moveGameUp)      // UP
        this.keyHandlers.set(40, this.moveGameDown)    // DOWN
        this.keyHandlers.set(39, this.moveGameRight)   // RIGHT
        this.keyHandlers.set(37, this.moveGameLeft)    // LEFT
        this.keyHandlers.set(187, this.zoomIn)         // +
        this.keyHandlers.set(189, this.zoomOut)        // -
        this.keyHandlers.set(77, this.showMenu)         // M

        this.moveGameRight = this.moveGameRight.bind(this);
        this.moveGameLeft = this.moveGameLeft.bind(this);
        this.moveGameUp = this.moveGameUp.bind(this);
        this.moveGameDown = this.moveGameDown.bind(this);

        this.closeActiveMenu = this.closeActiveMenu.bind(this);
        
        this.state = {
            houses: [],
            workers: [],
            roads: [],
            flags: [],
            trees: [],
            stones: [],
            borders: [],
            signs: [],
            availableConstruction: new Map(),
            showAvailableConstruction: false,
            crops: [],
            animals: [],
            translateX: 0,
            translateY: 0,
            selected: {x: 0, y: 0},
            scale: 30,
            terrain: [],
            gameWidth: 0,
            gameHeight: 0,
            player: props.selfPlayerId,
            menuVisible: false,
            discoveredPoints: new Set(),
            showTitles: false
        };
    }

    toggleDetails() {
        const current = this.state.showTitles || this.state.showAvailableConstruction;
        
        this.setState(
            {
                showTitles: !current,
                showAvailableConstruction: !current
            }
        );
    }

    closeActiveMenu() {

        this.setState(
            {
                activeMenu: undefined,
                showConstructionInfo: undefined,
                showHelp: undefined,
                showEnemyHouseInfo: undefined,
                showFriendlyFlagInfo: undefined,
                showFriendlyHouseInfo: undefined,
                menuVisible: false
            }
        );
    }
    
    onPlayerSelected(player: PlayerInformation) {
        console.info("Selected player " + JSON.stringify(player));

        let newTranslateX = this.state.translateX;
        let newTranslateY = this.state.translateY;

        if (player.centerPoint) {
            newTranslateX = (globalSyncState.width  / 2) - player.centerPoint.x * this.state.scale;
            newTranslateY = (globalSyncState.height / 2) + player.centerPoint.y * this.state.scale - globalSyncState.height;
        }

        this.setState({
	    translateX: newTranslateX,
	    translateY: newTranslateY,
            player: player.id,
            discoveredPoints: pointSetToStringSet(player.discoveredPoints)
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
    zoom(scale: number) {

        /* Center after zooming */
        scale = Math.min(scale, MAX_SCALE);
        scale = Math.max(scale, MIN_SCALE);

        const newTranslateX = globalSyncState.width / 2 - (((globalSyncState.width / 2) - this.state.translateX) / this.state.scale) * scale;
        const newTranslateY = -globalSyncState.height + (globalSyncState.height - (globalSyncState.height / 2) + this.state.translateY)/this.state.scale * scale + (globalSyncState.height / 2);

        this.setState({
	    translateX: newTranslateX,
	    translateY: newTranslateY,
	    scale: scale
        });
    }

    onSpeedSliderChange(value: number) {
        setSpeed(Math.round(LONGEST_TICK_LENGTH / value), this.props.gameId);
    }
    
    zoomOut() {
        this.zoom(this.state.scale - 1);
    }

    onMouseDown(event: React.MouseEvent) {
        globalSyncState.mouseDown = true;
        globalSyncState.mouseDownX = event.pageX;
        globalSyncState.mouseDownY = event.pageY;
        globalSyncState.mouseMoving = false;

        globalSyncState.translateXAtMouseDown = this.state.translateX;
        globalSyncState.translateYAtMouseDown = this.state.translateY;

        event.stopPropagation();
    }

    onMouseMove(event: React.MouseEvent) {
	if (globalSyncState.mouseDown) {
	    const deltaX = (event.pageX - globalSyncState.mouseDownX);
	    const deltaY = (event.pageY - globalSyncState.mouseDownY);

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

    onMouseUp(event: React.MouseEvent) {
        globalSyncState.mouseDown = false;

        event.stopPropagation();
    }

    async periodicFetch() {

        if (this.state.player) {
        
            const view = await getViewForPlayer(this.props.gameId, this.state.player);

            this.setState({
                houses: view.houses,
                workers: view.workers,
                roads: view.roads,
                trees: view.trees,
                flags: view.flags,
                stones: view.stones,
                borders: view.borders,
                signs: view.signs,
                availableConstruction: view.availableConstruction,
                crops: view.crops,
                animals: view.animals,
                discoveredPoints: new Set<string>(view.discoveredPoints.map(pointToString))
            });
        }

        setTimeout(this.periodicFetch, 100);
    }

    async componentDidMount() {

        if (this.selfNameRef.current) {
        
            // Store the width and height of the canvas when it's been rendered
            globalSyncState.width = this.selfNameRef.current.clientWidth;
            globalSyncState.height = this.selfNameRef.current.clientHeight;

            console.info("Screen width: " + globalSyncState.width + ", height: " + globalSyncState.height);
                        
            /* Request focus if the game is not blocked */
            if (!this.state.menuVisible) {
                console.info("Putting focus on main game screen");
                this.selfNameRef.current.focus();
            }
        }

        /* Fetch the view for the first time and center on the player's headquarter */
        const players = await getPlayers(this.props.gameId);

        console.info("Got players: " + JSON.stringify(players));

        this.setState({
            player: players[0].id
        });

        const view = await getViewForPlayer(this.props.gameId, players[0].id);

        console.info("Got initial view for player");

        // Center the view on the headquarter on the first update
        const headquarter = view.houses.find(h => h.type === "Headquarter");

        if (headquarter) {
                        
            const translateX = (globalSyncState.width / 2) - headquarter.x*this.state.scale;
            const translateY = -globalSyncState.height + (globalSyncState.height / 2) + headquarter.y*this.state.scale;

            this.setState({
                houses: view.houses,
                workers: view.workers,
                roads: view.roads,
                trees: view.trees,
                flags: view.flags,
                stones: view.stones,
                borders: view.borders,
                signs: view.signs,
                availableConstruction: view.availableConstruction,
                crops: view.crops,
                animals: view.animals,
                translateX: translateX,
                translateY: translateY,
                discoveredPoints: new Set<string>(view.discoveredPoints.map(pointToString))
            });
            
        }

        // Start getting game updates continuously from the server
        this.periodicFetch();

        // Get the terrain once
        if (this.state.terrain.length === 0) {
            const view = await getTerrain(this.props.gameId);

            console.info(JSON.stringify("Got terrain view from server"));

            let start = 1;
            let count = 0;
            const terrain = new Array(((view.width * view.height) / 2) + 1);

            for (let y = 1; y < view.height; y++) {
                for (let x = start; x + 1 < view.width; x+= 2) {

                    const point: Point = {
                        x: Number(x),
                        y: Number(y)
                    };

                    const tile = {
                        point: point,
                        straightBelow: vegetationToInt.get(view.straightBelow[count]),
                        belowToTheRight: vegetationToInt.get(view.belowToTheRight[count])
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
                gameWidth: view.width,
                gameHeight: view.height
            });
        }

        /* Listen for changes in the window size */
        window.addEventListener("resize",
                                () => {
                                    if (this.selfNameRef.current) {
                                        globalSyncState.width = this.selfNameRef.current.clientWidth;
                                        globalSyncState.height = this.selfNameRef.current.clientHeight;
                                    }
                                }
                               );
    }

    onPointClicked(point: Point) {
        console.info("Point clicked");

        /* Filter clicks that are really the end of moving the mouse */
        if (globalSyncState.mouseMoving) {
            return;
        }

        /* A road is being built */
        if (this.state.newRoad) {

            const recent = this.state.newRoad[this.state.newRoad.length - 1];

            /* Handle the case when a flag is clicked and create a road to it */
            if (this.state.flags.find((f) => f.x === point.x && f.y === point.y)) {

                console.info("Placing road directly to flag");
                
                createRoad(this.state.newRoad.concat(point),
                           this.props.gameId,
                           this.state.player).then(
                           ).catch(
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
                getInformationOnPoint(point, this.props.gameId, this.state.player).then(
                    (data) => {
                        console.info("Got possible points 2");

                        this.setState({
                            possibleRoadConnections: data.possibleRoadConnections
                        });
                    }
                ).catch(
                    (reason: any) => {
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

    /* Determine if the given point is discovered by the current player */
    pointIsDiscovered(point: Point) {
        return this.state.discoveredPoints.has(pointToString(point));
    }

    onDoubleClick(point: Point) {
        console.info("Double click on " + point.x + ", " + point.y);

        /* First, handle double clicks differently if a new road is being created */
        if (this.state.newRoad) {

            createFlag(point, this.props.gameId, this.state.player).then(
                (flag) => {
                    console.info("Created flag");

                    if (this.state.newRoad) {
                        createRoad(this.state.newRoad,
                                   this.props.gameId,
                                   this.state.player).then(
                                       (flag) => {
                                           console.info("Created road");
                                          
                                           this.setState({
                                               newRoad: undefined,
                                               possibleRoadConnections: undefined
                                           });
                                       }
                                   ).catch(
                                       (reason: any) => {
                                       }
                                   );
                    }
                }).catch(
                    (reason: any) => {
                    });

            return;
        }
        
        /* Ignore double clicks on undiscovered land */
        if (!this.pointIsDiscovered(point)) {
            console.info("Ignoring un-discovered point");
            return true;
        }

        /* Handle click on house */
        const house = this.state.houses.find((house) => house.x === point.x && house.y === point.y);

        console.info("Found this house on the spot: " + JSON.stringify(house));

        if (house) {
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
        const flag = this.state.flags.find((flag) => flag.x === point.x && flag.y === point.y);

        if (flag) {

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
        getInformationOnPoint(point, this.props.gameId, this.state.player).then(
            (pointInformation) => {

                // x, y
                // canBuild: ['small', 'medium', 'large', 'flag', 'mine', 'harbor']
                // isType: ('flag' | 'building' | 'stone' | 'tree')
                // (building: {type: ..., } | 
                if (pointInformation.canBuild && pointInformation.canBuild.length !== 0) {
                    this.setState({
                        showConstructionInfo: pointInformation,
                        activeMenu: MENU_CONSTRUCTION
                    });
                }
            }).catch(
                (reason: any) => {
                });

        return true;
    }
    
    onKeyDown(event: React.KeyboardEvent) {
        console.info("Key down: " + event.which);

        if (event.which) {
            const handler = this.keyHandlers.get(event.which);

            if (handler) {
                handler();
            }
        }
    }

    startNewRoad(point: Point) {

        /* Start the list of points in the new road with the clicked point */
        console.info("Add segment to road (startNewRoad) " + JSON.stringify(point));
        this.setState({
            newRoad: [point]
        });

        /* Get the possible connections from the server and draw them */
        getInformationOnPoint(point, this.props.gameId, this.state.player).then(
            (pointInformation) => {
                this.setState({
                    possibleRoadConnections: pointInformation.possibleRoadConnections
                });
            }).catch(

            );
    }

    setShowTitles(showTitles: boolean) {
        this.setState({showTitles: showTitles});
    }
    
    copyTouch(touch: React.Touch): StoredTouch {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    }
 
    onTouchStart(event: React.TouchEvent) {

        event.preventDefault();

        console.log("touchstart.");

        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {

            console.log("touchstart:" + i + "...");

            ongoingTouches.set(touches[i].identifier, this.copyTouch(touches[i]));

            console.log("touchstart:" + i + ".");
        }

        /* Only move map with one movement */
        if (!globalSyncState.touchMoveOngoing) {
            const touch = touches[0];

            globalSyncState.touchIdentifier = touch.identifier;

            globalSyncState.mouseDownX = touch.pageX;
            globalSyncState.mouseDownY = touch.pageY;
            globalSyncState.mouseMoving = false;
            globalSyncState.touchMoveOngoing = true;

            globalSyncState.translateXAtMouseDown = this.state.translateX;
            globalSyncState.translateYAtMouseDown = this.state.translateY;
        }
    }

    onTouchMove(event: React.TouchEvent) {

        event.preventDefault();

        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier);

            if (!touch || !touch.identifier) {
                continue;
            }
            
            if (globalSyncState.touchMoveOngoing && touch.identifier === globalSyncState.touchIdentifier) {
	        const deltaX = (touch.pageX - globalSyncState.mouseDownX);
	        const deltaY = (touch.pageY - globalSyncState.mouseDownY);

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

                ongoingTouches.set(touch.identifier, touches[i]);
                console.log(".");
            } else {
                console.log("can't figure out which touch to continue");
            }
        }
    }

    onTouchCancel(event: React.TouchEvent) {
        event.preventDefault();

        console.log("touchcancel.");

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false;

        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier);
        }
    }

    onTouchEnd(event: React.TouchEvent) {

        event.preventDefault();

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false;

        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier);

            if (touch) {
                ongoingTouches.delete(touches[i].identifier);
            } else {
                console.log("can't figure out which touch to end");
            }
        }
    }

    render() {

        return (
            <div
                className="App"
                ref={this.selfNameRef}
                onMouseDown={this.onMouseDown}
                onMouseMove={this.onMouseMove}
                onMouseUp={this.onMouseUp}
                onKeyDown={this.onKeyDown}
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchEnd={this.onTouchEnd}
                onTouchCancel={this.onTouchCancel}
                tabIndex={1}>

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
                    availableConstruction={this.state.availableConstruction}
                    crops={this.state.crops}
                    animals={this.state.animals}
                    scale={this.state.scale}
                    translateX={this.state.translateX}
                    translateY={this.state.translateY}
                    screenWidth={globalSyncState.width}
                    screenHeight={globalSyncState.height}
                    onKeyDown={this.onKeyDown}
                    onPointClicked={this.onPointClicked.bind(this)}
                    selectedPoint={this.state.selected}
                    onDoubleClick={this.onDoubleClick.bind(this)}
                    showHouseTitles={this.state.showTitles}
                    newRoad={this.state.newRoad}
                    possibleRoadConnections={this.state.possibleRoadConnections}
                    showAvailableConstruction={this.state.showAvailableConstruction}
                />

                <MenuButton onMenuButtonClicked={this.showMenu.bind(this)} />

                {this.state.menuVisible &&
                    <GameMenu
                        currentPlayerId={this.state.player}
                        onCloseMenu={this.closeActiveMenu.bind(this)}
                        onPlayerSelected={this.onPlayerSelected.bind(this)}
                        onChangedZoom={this.zoom.bind(this)}
                        currentZoom={this.state.scale}
                        minZoom={MIN_SCALE}
                        maxZoom={MAX_SCALE}
                        adjustSpeed={this.onSpeedSliderChange.bind(this)}
                        gameId={this.props.gameId}
                        setShowTitles={this.setShowTitles.bind(this)}
                        currentShowTitles={this.state.showTitles}
                    />
                }

                {this.state.showFriendlyHouseInfo &&
                    <FriendlyHouseInfo
                        house={this.state.showFriendlyHouseInfo.house}
                        gameId={this.props.gameId}
                        playerId={this.state.player}
                        closeDialog={this.closeActiveMenu.bind(this)}
                    />
                }

                {this.state.showFriendlyFlagInfo &&
                    <FriendlyFlagInfo
                        flag={this.state.showFriendlyFlagInfo.flag}
                        closeDialog={this.closeActiveMenu.bind(this)}
                        startNewRoad={this.startNewRoad.bind(this)}
                        playerId={this.state.player}
                        gameId={this.props.gameId}
                   />
                }

                {this.state.showEnemyHouseInfo &&
                    <EnemyHouseInfo
                        house={this.state.showEnemyHouseInfo.house}
                        closeDialog={this.closeActiveMenu.bind(this)}
                        playerId={this.state.player}
                        gameId={this.props.gameId}
                    />
                }

                {this.state.showHelp &&
                    <Guide onClose={this.closeActiveMenu.bind(this)} />
                }

                {this.state.showConstructionInfo &&
                    <ConstructionInfo point={this.state.showConstructionInfo}
                        closeDialog={this.closeActiveMenu.bind(this)}
                        playerId={this.state.player}
                        startNewRoad={this.startNewRoad.bind(this)}
                        gameId={this.props.gameId}
                    />
                }
            </div>
        );
    }
}

export default App;
