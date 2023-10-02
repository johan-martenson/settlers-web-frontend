import React, { Component } from 'react'
import { canBeUpgraded, evacuateHouseOnPoint, findPossibleNewRoad, FlagInformation, GameId, getInformationOnPoint, getPlayers, HouseId, HouseInformation, LARGE_HOUSES, MEDIUM_HOUSES, PlayerId, PlayerInformation, Point, PointInformation, setSpeed, SMALL_HOUSES, upgradeMilitaryBuilding } from './api'
import './App.css'
import { ConstructionInfo } from './construction_info'
import EnemyHouseInfo from './enemy_house_info'
import FriendlyFlagInfo from './friendly_flag_info'
import FriendlyHouseInfo from './friendly_house_info'
import GameMenu from './game_menu'
import GameMessagesViewer from './game_messages_viewer'
import { CursorState, GameCanvas } from './game_render'
import Guide from './guide'
import MenuButton from './menu_button'
import { getHeadquarterForPlayer, monitor, startMonitoringGame } from './monitor'
import MusicPlayer from './music_player'
import Statistics from './statistics'
import { printVariables } from './stats'
import { SetTransportPriority } from './transport_priority'
import { TypeControl, Command } from './type_control'
import { isRoadAtPoint, removeHouseOrFlagOrRoadAtPointWebsocket } from './utils'

type Menu = 'MAIN' | 'FRIENDLY_HOUSE' | 'FRIENDLY_FLAG' | 'CONSTRUCTION' | 'GUIDE'

const MAX_SCALE = 80
const MIN_SCALE = 20

const LONGEST_TICK_LENGTH = 500

const globalSyncState = {
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
}

/* Track ongoing touches to make touch control work */
const ongoingTouches: Map<number, StoredTouch> = new Map()

interface StoredTouch {
    identifier: number
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
    observe?: boolean
    onLeaveGame: (() => void)
}

interface AppState {
    newRoad?: Point[]
    possibleRoadConnections?: Point[]

    selected: Point

    scale: number

    translateX: number
    translateY: number

    gameWidth: number
    gameHeight: number

    player: PlayerId

    activeMenu?: Menu

    showFriendlyHouseInfo?: ShowFriendlyHouseInfo
    showFriendlyFlagInfo?: ShowFriendlyFlagInfo
    showConstructionInfo?: PointInformation
    showEnemyHouseInfo?: ShowEnemyHouseInfo
    showHelp?: boolean
    showStatistics?: boolean
    menuVisible: boolean

    showTitles: boolean
    showAvailableConstruction: boolean
    showSetTransportPriority: boolean

    serverUnreachable?: string

    cursorState: CursorState

    showFpsCounter: boolean
}

class App extends Component<AppProps, AppState> {

    private keyHandlers: Map<number, (() => void)> = new Map()
    private selfNameRef = React.createRef<HTMLDivElement>()
    private typeControlRef = React.createRef<TypeControl>()
    private readonly commands: Map<string, Command>
    monitoringPromise: Promise<void>

    constructor(props: AppProps) {
        super(props)

        console.log("Start monitoring game")
        this.monitoringPromise = startMonitoringGame(this.props.gameId, this.props.selfPlayerId)

        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onMouseLeave = this.onMouseLeave.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)

        this.onTouchStart = this.onTouchStart.bind(this)
        this.onTouchEnd = this.onTouchEnd.bind(this)
        this.onTouchMove = this.onTouchMove.bind(this)
        this.onTouchCancel = this.onTouchCancel.bind(this)

        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyPress = this.onKeyPress.bind(this)

        this.toggleDetails = this.toggleDetails.bind(this)

        this.zoomOut = this.zoomOut.bind(this)
        this.zoomIn = this.zoomIn.bind(this)

        this.keyHandlers.set(27, this.closeActiveMenu) // ESC
        this.keyHandlers.set(32, this.toggleDetails)   // SPACE
        this.keyHandlers.set(38, this.moveGameUp)      // UP
        this.keyHandlers.set(40, this.moveGameDown)    // DOWN
        this.keyHandlers.set(39, this.moveGameRight)   // RIGHT
        this.keyHandlers.set(37, this.moveGameLeft)    // LEFT
        this.keyHandlers.set(187, this.zoomIn)         // +
        this.keyHandlers.set(189, this.zoomOut)        // -
        this.keyHandlers.set(77, this.showMenu)         // M

        this.moveGameRight = this.moveGameRight.bind(this)
        this.moveGameLeft = this.moveGameLeft.bind(this)
        this.moveGameUp = this.moveGameUp.bind(this)
        this.moveGameDown = this.moveGameDown.bind(this)

        this.closeActiveMenu = this.closeActiveMenu.bind(this)

        this.state = {
            showAvailableConstruction: false,
            translateX: 0,
            translateY: 0,
            selected: { x: 0, y: 0 },
            scale: 35,
            gameWidth: 0,
            gameHeight: 0,
            player: props.selfPlayerId,
            menuVisible: false,
            showTitles: true,
            showSetTransportPriority: false,
            cursorState: 'NOTHING',
            showFpsCounter: false
        }

        /* Set up type control commands */
        this.commands = new Map()

        SMALL_HOUSES.forEach(building => this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'small') !== undefined
        }
        ))
        MEDIUM_HOUSES.forEach(building => this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'medium') !== undefined
        }))
        LARGE_HOUSES.forEach(building => this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'large') !== undefined
        }))

        this.commands.set("Kill websocket", {
            action: () => monitor.killWebsocket(),
            filter: undefined
        })

        this.commands.set("Road", {
            action: async () => {
                console.log("Building road")

                // TODO: optimize by introducing a method to get information about two points with one call

                /* Get the possible connections from the server and draw them */
                const pointDownRight = { x: this.state.selected.x + 1, y: this.state.selected.y - 1 }
                const pointInformations = await monitor.getInformationOnPoints([this.state.selected, pointDownRight])

                const pointInformation = pointInformations.get(this.state.selected)
                const pointDownRightInformation = pointInformations.get(pointDownRight)

                if (pointInformation === undefined) {
                    console.error("Failed to get point information!")
                    console.error(this.state.selected)

                    return
                }

                /* If a house is selected, start the road from the flag */
                if (pointInformation.is && pointInformation.is === "building") {
                    if (pointDownRightInformation === undefined) {
                        console.error("Failed to get point down right information!")
                        console.error(pointDownRight)

                        return
                    }

                    this.setState(
                        {
                            newRoad: [pointDownRight],
                            possibleRoadConnections: pointDownRightInformation.possibleRoadConnections,
                            cursorState: 'BUILDING_ROAD'
                        }
                    )
                } else if (pointInformation.is && pointInformation.is === "flag") {

                    this.setState(
                        {
                            newRoad: [this.state.selected],
                            possibleRoadConnections: pointInformation.possibleRoadConnections,
                            cursorState: 'BUILDING_ROAD'
                        }
                    )
                }
            },
            filter: (pointInformation: PointInformation) => pointInformation.is === 'building' || pointInformation.is === 'flag'
        })

        this.commands.set("Flag", {
            action: () => {
                if (monitor.isAvailable(this.state.selected, 'FLAG')) {
                    monitor.placeFlag(this.state.selected)
                }
            },
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'flag') !== undefined
        })
        this.commands.set("Remove (house, flag, or road)", {
            action: () => removeHouseOrFlagOrRoadAtPointWebsocket(this.state.selected, monitor),
            filter: (pointInformation: PointInformation) => pointInformation.is !== undefined
        })
        this.commands.set("Statistics", {
            action: () => this.setState({ showStatistics: true }),
            filter: undefined
        })
        this.commands.set("Game information", {
            action: () => {
                console.info("Game id: " + this.props.gameId)
                console.info("Player id: " + this.props.selfPlayerId)

                getPlayers(this.props.gameId).then(players => console.info({ title: "Players: ", players }))
            },
            filter: undefined
        })
        this.commands.set("Titles", {
            action: () => this.setState({ showTitles: !this.state.showTitles }),
            filter: undefined
        })
        this.commands.set("Geologist", {
            action: async () => monitor.callGeologist(this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
        })
        this.commands.set("Scout", {
            action: async () => monitor.callScout(this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
        })
        this.commands.set("Evacuate building", {
            action: () => evacuateHouseOnPoint(this.state.selected, this.props.gameId, this.props.selfPlayerId),
            filter: (pointInformation: PointInformation) => pointInformation.is === 'building'
        })
        this.commands.set("Transport priority (set)", {
            action: () => this.setState({ showSetTransportPriority: true }),
            filter: undefined
        })
        this.commands.set("List statistics", {
            action: () => printVariables(),
            filter: undefined
        })
        this.commands.set("Upgrade", {
            action: async () => {
                const houseInformation = monitor.getHouseAtPointLocal(this.state.selected)

                if (houseInformation && canBeUpgraded(houseInformation)) {
                    upgradeMilitaryBuilding(this.props.gameId, this.props.selfPlayerId, houseInformation.id)
                }
            },
            filter: (pointInformation: PointInformation) => pointInformation.is === 'building'
        })
        this.commands.set("Fps", {
            action: () => { this.setState({ showFpsCounter: !this.state.showFpsCounter }) },
            filter: undefined
        })
        this.commands.set("Fps", {
            action: () => { this.setState({ showFpsCounter: !this.state.showFpsCounter }) },
            filter: undefined
        })
    }

    toggleDetails(): void {
        this.setState(
            {
                showTitles: true,
                showAvailableConstruction: !this.state.showAvailableConstruction
            }
        )
    }

    closeActiveMenu(): void {
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
        )
    }

    goToHouse(houseId: HouseId): void {
        console.info("Go to house " + houseId)

        const house = monitor.houses.get(houseId)

        if (house) {
            this.goToPoint({ x: house.x, y: house.y })

            this.setState({ selected: { x: house.x, y: house.y } })
        }
    }

    goToPoint(point: Point): void {
        console.info("Go to point: " + JSON.stringify(point))

        const scaleY = this.state.scale

        const newTranslateX = (globalSyncState.width / 2) - point.x * this.state.scale
        const newTranslateY = (globalSyncState.height / 2) + point.y * scaleY - globalSyncState.height

        this.setState({
            translateX: newTranslateX,
            translateY: newTranslateY
        })
    }

    onPlayerSelected(player: PlayerInformation): void {
        console.info("Selected player " + JSON.stringify(player))

        const scaleY = this.state.scale

        let newTranslateX = this.state.translateX
        let newTranslateY = this.state.translateY

        if (player.centerPoint) {
            newTranslateX = (globalSyncState.width / 2) - player.centerPoint.x * this.state.scale
            newTranslateY = (globalSyncState.height / 2) + player.centerPoint.y * scaleY - globalSyncState.height
        }

        this.setState({
            translateX: newTranslateX,
            translateY: newTranslateY,
            player: player.id
        })
    }

    closeFriendlyHouseInfo(): void {
        console.info("Closing friendly house info")

        this.setState({ showFriendlyHouseInfo: undefined })
    }

    showMenu(): void {

        /* Close active dialogs first */
        this.closeActiveMenu()

        /* Open the menu */
        this.setState(
            {
                menuVisible: true,
                activeMenu: 'MAIN'
            }
        )
    }

    showHelp(): void {
        this.setState(
            {
                activeMenu: 'GUIDE',
                showHelp: true
            }
        )
    }

    moveGameUp(): void {
        this.setState({ translateY: this.state.translateY + 10 })
    }

    moveGameDown(): void {
        this.setState({ translateY: this.state.translateY - 10 })
    }

    moveGameRight(): void {
        this.setState({ translateX: this.state.translateX - 10 })
    }

    moveGameLeft(): void {
        this.setState({ translateX: this.state.translateX + 10 })
    }

    zoomIn(): void {
        this.zoom(this.state.scale + 1)
    }

    /* Should move to the game canvas so the app doesn't have to know about this */
    zoom(newScale: number): void {

        // Set boundaries on how much scaling is allowed
        newScale = Math.min(newScale, MAX_SCALE)
        newScale = Math.max(newScale, MIN_SCALE)

        /* Center after zooming */
        const centerGamePoint = {
            x: (globalSyncState.width / 2 - this.state.translateX) / this.state.scale,
            y: (globalSyncState.height / 2 + this.state.translateY) / (this.state.scale)
        }

        const newTranslate = {
            x: globalSyncState.width / 2 - centerGamePoint.x * newScale,
            y: globalSyncState.height / 2 - globalSyncState.height + centerGamePoint.y * newScale
        }

        this.setState({
            translateX: newTranslate.x,
            translateY: newTranslate.y,
            scale: newScale
        })
    }

    onSpeedSliderChange(value: number): void {
        setSpeed(Math.round(LONGEST_TICK_LENGTH / value), this.props.gameId)
    }

    zoomOut(): void {
        this.zoom(this.state.scale - 1)
    }

    onMouseDown(event: React.MouseEvent): void {

        if (event.button === 2) {
            globalSyncState.mouseDown = true
            globalSyncState.mouseDownX = event.pageX
            globalSyncState.mouseDownY = event.pageY
            globalSyncState.mouseMoving = false

            globalSyncState.translateXAtMouseDown = this.state.translateX
            globalSyncState.translateYAtMouseDown = this.state.translateY

            this.setState({ cursorState: 'DRAGGING' })
        }

        event.stopPropagation()
    }

    onMouseMove(event: React.MouseEvent): void {
        if (globalSyncState.mouseDown) {
            const deltaX = (event.pageX - globalSyncState.mouseDownX)
            const deltaY = (event.pageY - globalSyncState.mouseDownY)

            /* Detect move to separate move from click */
            if (deltaX * deltaX + deltaY * deltaY > 25) {
                globalSyncState.mouseMoving = true
            }

            this.setState({
                translateX: globalSyncState.translateXAtMouseDown + deltaX,
                translateY: globalSyncState.translateYAtMouseDown + deltaY
            })
        }

        event.stopPropagation()
    }

    onMouseUp(event: React.MouseEvent): void {
        globalSyncState.mouseDown = false
        globalSyncState.mouseMoving = false

        this.setState({ cursorState: 'NOTHING' })

        event.stopPropagation()
    }

    // eslint-disable-next-line
    onMouseLeave(event: React.MouseEvent): void {
        this.setState({ cursorState: 'NOTHING' })

        globalSyncState.mouseDown = false
        globalSyncState.mouseMoving = false
    }

    async componentDidMount(): Promise<void> {

        if (document.addEventListener) {
            document.addEventListener('contextmenu', function (e) {

                // Do nothing. The purpose is to make it possible to drag the screen with the right mouse button

                e.preventDefault()
            }, false);
        }

        await this.monitoringPromise

        if (this.selfNameRef.current) {

            // Store the width and height of the canvas when it's been rendered
            globalSyncState.width = this.selfNameRef.current.clientWidth
            globalSyncState.height = this.selfNameRef.current.clientHeight

            console.info("Screen dimensions: " + globalSyncState.width + "x" + globalSyncState.height)

            /* Request focus if the game is not blocked */
            if (!this.state.menuVisible) {
                console.info("Putting focus on main game screen")
                this.selfNameRef.current.focus()
            }
        }

        /* Make sure the game data is loaded and being updated before accessing the game */
        await this.monitoringPromise

        /* Center the view on the headquarter on the first update */
        const headquarter = getHeadquarterForPlayer(this.props.selfPlayerId)

        if (headquarter) {
            this.goToHouse(headquarter.id)
        }

        /* Listen for changes in the window size */
        window.addEventListener("resize",
            () => {
                if (this.selfNameRef.current) {
                    globalSyncState.width = this.selfNameRef.current.clientWidth
                    globalSyncState.height = this.selfNameRef.current.clientHeight
                }
            }
        )
    }

    async onPointClicked(point: Point): Promise<void> {
        console.info("Clicked point: " + point.x + ", " + point.y)

        /* Ignore clicks if the player is an observer */
        if (this.props.observe) {
            return
        }

        /* Filter clicks that are really the end of moving the mouse */
        if (globalSyncState.mouseMoving) {
            return
        }

        /* A road is being built */
        if (this.state.newRoad && this.state.possibleRoadConnections) {
            const recent = this.state.newRoad[this.state.newRoad.length - 1]

            /* Create the possible new road including the addition */
            const possibleNewRoad = this.state.newRoad

            /* Handle the case where one of the directly adjacent possible new road connections is selected */
            if (this.state.possibleRoadConnections.find(e => e.x === point.x && e.y === point.y)) {
                possibleNewRoad.push(point)

                /* Handle the case where a point further away was clicked */
            } else {

                /* Get the possible road from the current point to the clicked point. Make sure to avoid the ongoing planned road */
                const possibleNewRoadSegment = await findPossibleNewRoad(recent, point, this.state.newRoad, this.props.gameId, this.props.selfPlayerId)

                if (possibleNewRoadSegment) {
                    possibleNewRoad.push(...possibleNewRoadSegment.possibleNewRoad.slice(1))
                } else {

                    /* Ignore the click if no possible road is available */
                    console.log("Not possible to include in road. Ignoring.")

                    return
                }
            }

            console.log("Ongoing road construction: " + JSON.stringify(possibleNewRoad))

            /* Handle the case when a flag is clicked and create a road to it. Also select the point of the flag */
            const flag = monitor.getFlagAtPointLocal(point)

            if (flag) {
                console.info("Placing road directly to flag")

                // Do this first to make the UI feel quicker
                this.setState({
                    newRoad: undefined,
                    possibleRoadConnections: [],
                    selected: point
                })

                // Create the road, including making an optimistic change first on the client side
                monitor.placeRoad(possibleNewRoad)

                /* Handle the case when a piece of road is clicked but there is no flag on it. Create the road */
            } else if (isRoadAtPoint(point, monitor.roads)) {

                console.info('Placing flag for road')

                if (monitor.isAvailable(point, 'FLAG')) {

                    // Start with changing the UI state to make the user experience feel quicker
                    this.setState({
                        newRoad: undefined,
                        possibleRoadConnections: []
                    })

                    monitor.placeRoadWithFlag(point, possibleNewRoad)
                }

                /* Add the new possible road points to the ongoing road and don't create the road */
            } else if (recent.x !== point.x || recent.y !== point.y) {
                console.info("Continuing road building with extended road segment")

                /* Get the available connections from the added point */
                const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.state.player)

                console.log("Possible new road direct adjacent road connections: " + JSON.stringify(pointInformation.possibleRoadConnections))

                this.setState({
                    newRoad: possibleNewRoad,
                    possibleRoadConnections: pointInformation.possibleRoadConnections,
                    cursorState: 'BUILDING_ROAD'
                })
            }

            /* Select the point */
        } else {
            console.info("Selecting point: " + point.x + ", " + point.y)

            this.setState({
                selected: point
            })
        }
    }

    async onDoubleClick(point: Point): Promise<void> {
        console.info("Double click on " + point.x + ", " + point.y)

        /* Ignore double clicks if the player is an observer */
        if (this.props.observe) {
            return
        }

        /* First, handle double clicks differently if a new road is being created */
        if (this.state.newRoad) {

            console.log("New road exists")

            if (monitor.isAvailable(point, 'FLAG')) {

                console.log("Can place flag")

                // Keep a reference to the new road so it doesn't get lost when the state is changed
                const newRoadPoints = this.state.newRoad
                const lastPoint = this.state.newRoad[this.state.newRoad.length - 1]

                // Only add this point to the road points if the distance is acceptable - otherwise let the backend fill in
                if (Math.abs(lastPoint.x - point.x) <=2 && Math.abs(lastPoint.y - point.y) <= 2) {
                    newRoadPoints.push(point)
                }

                // Update the state before calling the backend to make the user experience feel quicker
                this.setState(
                    {
                        newRoad: undefined,
                        possibleRoadConnections: undefined,
                        selected: point
                    }
                )

                // Call the backend to make the changes take effect
                // TODO: introduce a method in the backend to do both as a single operation and then use it here
                monitor.placeRoadWithFlag(point, newRoadPoints)

                console.info("Created flag and road")
            } else {
                console.log("Could not place flag")
            }

            return
        }

        /* Ignore double clicks on undiscovered land */
        if (!monitor.discoveredPoints.has(point)) {
            console.info("Ignoring un-discovered point")
            return
        }

        /* Handle click on house */
        const house = monitor.getHouseAtPointLocal(point)

        if (house) {
            console.info("Clicked house " + JSON.stringify(house))

            /* Show friendly house info for own house */
            if (house.playerId === this.state.player) {
                console.info("Friendly house")

                this.setState({
                    menuVisible: false,
                    showFriendlyHouseInfo: { house: house },
                    activeMenu: 'FRIENDLY_HOUSE'
                })
            } else {

                /* Show minimal house info for enemy's house */
                this.setState({
                    menuVisible: false,
                    showEnemyHouseInfo: { house: house }
                })
            }

            return
        }

        /* Handle the case where a flag was double clicked */
        const flag = monitor.getFlagAtPointLocal(point)

        if (flag) {

            console.info("Clicked flag")

            /* Show friendly flag dialog */
            if (flag.playerId === this.state.player) {
                console.info("Friendly flag")

                this.setState(
                    {
                        menuVisible: false,
                        showFriendlyFlagInfo: { flag: flag },
                        activeMenu: 'FRIENDLY_FLAG'
                    }
                )
            }

            return
        }

        /* Ask the server for what can be done on the spot */
        const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.state.player)

        /* Create a flag if it is the only possible construction */
        if (pointInformation.canBuild.length === 1 && pointInformation.canBuild[0] === 'flag') {
            monitor.placeFlag(pointInformation)

            this.setState({ selected: point })
        }

        else if (pointInformation.is === "road" && pointInformation.roadId) {
            this.setState(
                {
                    menuVisible: false,
                    showConstructionInfo: pointInformation,
                    activeMenu: 'CONSTRUCTION'
                }
            )
        }

        /* Open the window to construct houses/flags/roads */
        else if (pointInformation.canBuild && pointInformation.canBuild.length !== 0) {
            this.setState(
                {
                    showConstructionInfo: pointInformation,
                    activeMenu: 'CONSTRUCTION'
                }
            )
        }
    }

    onKeyDown(event: React.KeyboardEvent): void {
        if (event.key === "Escape") {

            /* Close the active menu (if there is an active menu) */
            if (this.state.activeMenu) {
                this.closeActiveMenu()

                /* Stop building a new road */
            } else if (this.state.newRoad) {
                this.setState({ newRoad: undefined, possibleRoadConnections: [] })

                /* Otherwise, send the escape to the type controller */
            } else if (this.typeControlRef && this.typeControlRef.current) {
                this.typeControlRef.current.onKeyDown(event)
            }

        } else if (event.key === " ") {
            this.toggleDetails()
        } else if (event.key === "Up") {
            this.moveGameUp()
        } else if (event.key === "Right") {
            this.moveGameRight()
        } else if (event.key === "Down") {
            this.moveGameDown()
        } else if (event.key === "Left") {
            this.moveGameLeft()
        } else if (event.key === "+") {
            this.zoomIn()
        } else if (event.key === "-") {
            this.zoomOut()
        } else if (event.key === "M") {
            this.showMenu()
        } else {
            if (this.typeControlRef && this.typeControlRef.current) {
                this.typeControlRef.current.onKeyDown(event)
            }
        }
    }

    onKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {

        /* Filter out input that should not result in type control */
        if (event.key === "+" || event.key === "-") {
            return
        }

        if (this.typeControlRef && this.typeControlRef.current) {
            this.typeControlRef.current.onKeyPress(event)
        }
    }

    async startNewRoad(point: Point): Promise<void> {

        /* Start the list of points in the new road with the clicked point */
        console.info("Start new road construction at: " + JSON.stringify({ x: point.x, y: point.y }))

        /* Get the possible connections from the server and draw them */
        const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.state.player)

        this.setState(
            {
                newRoad: [{ x: point.x, y: point.y }],
                possibleRoadConnections: pointInformation.possibleRoadConnections,
                cursorState: 'BUILDING_ROAD'
            }
        )
    }

    setShowTitles(showTitles: boolean): void {
        this.setState({ showTitles: showTitles })
    }

    copyTouch(touch: React.Touch): StoredTouch {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY }
    }

    onTouchStart(event: React.TouchEvent): void {

        event.preventDefault()

        console.log("touchstart.")

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {

            console.log("touchstart:" + i + "...")

            ongoingTouches.set(touches[i].identifier, this.copyTouch(touches[i]))

            console.log("touchstart:" + i + ".")
        }

        /* Only move map with one movement */
        if (!globalSyncState.touchMoveOngoing) {
            const touch = touches[0]

            globalSyncState.touchIdentifier = touch.identifier

            globalSyncState.mouseDownX = touch.pageX
            globalSyncState.mouseDownY = touch.pageY
            globalSyncState.mouseMoving = false
            globalSyncState.touchMoveOngoing = true

            globalSyncState.translateXAtMouseDown = this.state.translateX
            globalSyncState.translateYAtMouseDown = this.state.translateY
        }
    }

    onTouchMove(event: React.TouchEvent): void {

        event.preventDefault()

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier)

            if (!touch || !touch.identifier) {
                continue
            }

            if (globalSyncState.touchMoveOngoing && touch.identifier === globalSyncState.touchIdentifier) {
                const deltaX = (touch.pageX - globalSyncState.mouseDownX)
                const deltaY = (touch.pageY - globalSyncState.mouseDownY)

                /* Detect move to separate move from click */
                if (deltaX * deltaX + deltaY * deltaY > 25) {
                    globalSyncState.mouseMoving = true
                }

                this.setState({
                    translateX: globalSyncState.translateXAtMouseDown + deltaX,
                    translateY: globalSyncState.translateYAtMouseDown + deltaY
                })
            }

            /* Store ongoing touches just because ... */
            if (touch) {
                console.log("continuing touch " + touch)

                console.log("ctx.moveTo(" + touch.pageX + ", " + touch.pageY + ")")

                console.log("ctx.lineTo(" + touches[i].pageX + ", " + touches[i].pageY + ")")

                ongoingTouches.set(touch.identifier, touches[i])
                console.log(".")
            } else {
                console.log("can't figure out which touch to continue")
            }
        }
    }

    onTouchCancel(event: React.TouchEvent): void {
        event.preventDefault()

        console.log("touchcancel.")

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)
        }
    }

    onTouchEnd(event: React.TouchEvent): void {

        event.preventDefault()

        /* Stop moving */
        globalSyncState.touchMoveOngoing = false

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier)

            if (touch) {
                ongoingTouches.delete(touches[i].identifier)
            } else {
                console.log("can't figure out which touch to end")
            }
        }
    }

    render(): JSX.Element {

        return (
            <div
                className="App"
                ref={this.selfNameRef}
                onMouseDown={this.onMouseDown}
                onMouseMove={this.onMouseMove}
                onMouseUp={this.onMouseUp}
                onMouseLeave={this.onMouseLeave}
                onKeyDown={this.onKeyDown}
                onKeyPress={this.onKeyPress}
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchEnd={this.onTouchEnd}
                onTouchCancel={this.onTouchCancel}
                tabIndex={1}>

                <GameCanvas
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
                    width={globalSyncState.width}
                    height={globalSyncState.height}
                    cursorState={this.state.cursorState}
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
                        onLeaveGame={this.props.onLeaveGame}
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

                {this.state.showStatistics &&
                    <Statistics onClose={() => this.setState({ showStatistics: false })}
                        gameId={this.props.gameId}
                    />
                }

                {this.state.showSetTransportPriority &&
                    <SetTransportPriority onClose={() => this.setState({ showSetTransportPriority: false })}
                        gameId={this.props.gameId}
                        playerId={this.props.selfPlayerId}
                    />
                }

                <TypeControl commands={this.commands}
                    ref={this.typeControlRef}
                    selectedPoint={this.state.selected}
                    gameId={this.props.gameId}
                    playerId={this.props.selfPlayerId}
                />

                <GameMessagesViewer gameId={this.props.gameId}
                    playerId={this.props.selfPlayerId}
                    onGoToHouse={this.goToHouse.bind(this)}
                    onGoToPoint={this.goToPoint.bind(this)}
                />

                <MusicPlayer />
            </div>
        )
    }
}

export default App
