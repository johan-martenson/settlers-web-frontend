import React, { Component } from 'react'
import { canBeUpgraded, evacuateHouseOnPoint, findPossibleNewRoad, getInformationOnPoint, getPlayers, setSpeed, upgradeMilitaryBuilding } from './api/rest-api'
import './App.css'
import { ConstructionInfo } from './construction_info'
import FriendlyFlagInfo from './friendly_flag_info'
import GameMenu from './game_menu'
import GameMessagesViewer from './game_messages_viewer'
import { CursorState, DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE, GameCanvas } from './game_render'
import Guide from './guide'
import MenuButton from './menu_button'
import { getHeadquarterForPlayer, monitor, startMonitoringGame } from './api/ws-api'
import MusicPlayer from './sound/music_player'
import Statistics from './statistics'
import { printVariables } from './stats'
import { SetTransportPriority } from './transport_priority'
import { TypeControl, Command } from './type_control'
import { isRoadAtPoint, removeHouseOrFlagOrRoadAtPointWebsocket } from './utils'
import { HouseInformation, FlagInformation, PlayerId, GameId, Point, PointInformation, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, HouseId, PlayerInformation, GameState } from './api/types'
import { Dismiss24Filled, CalendarAgenda24Regular, TextBulletListSquare24Regular, TopSpeed24Filled, AddCircle24Regular } from '@fluentui/react-icons'
import { FlagIcon, HouseIcon } from './icon'
import { HouseInfo } from './house_info/house_info'
import { sfx } from './sound/sound_effects'
import { Quotas } from './quotas'

type Menu = 'MAIN' | 'FRIENDLY_HOUSE' | 'FRIENDLY_FLAG' | 'CONSTRUCTION' | 'GUIDE'

const MAX_SCALE = 70
const MIN_SCALE = 10

const LONGEST_TICK_LENGTH = 500

export const DEFAULT_VOLUME = 0.5

export const immediateUxState = {
    mouseDown: false,
    mouseDownX: 0,
    mouseDownY: 0,
    mouseMoving: false,
    touchMoveOngoing: false,
    touchIdentifier: 0,
    translateXAtMouseDown: 0,
    translateYAtMouseDown: 0,
    width: 0,
    height: 0,
    translate: { x: 0, y: 0 },
    scale: DEFAULT_SCALE
}

let nextAnimation = 0

/* Track ongoing touches to make touch control work */
const ongoingTouches: Map<number, StoredTouch> = new Map()

type OngoingAnimation = {
    counter: number
    timer: NodeJS.Timeout
}

const ANIMATION_FPS = 40
const ANIMATION_LENGTH_MS = 200
const ANIMATION_STEPS = (ANIMATION_LENGTH_MS / 1000) * ANIMATION_FPS

const ongoingAnimations: Map<number, OngoingAnimation> = new Map()

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

interface PauseSignProps {
    message: string
}

const PauseSign = ({ message }: PauseSignProps) => {

    return (
        <div style={{
            position: "absolute",
            left: "0",
            right: "0",
            top: "50%",
            fontSize: "5rem",
            color: "white",
            height: "auto",
            lineHeight: "8rem",
            display: "flex",
            justifyContent: "center"
        }}>
            <div style={{
                backgroundColor: "black", borderRadius: "5px"
            }}>
                {message}
            </div>
        </div>
    )
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

    gameWidth: number
    gameHeight: number

    player?: PlayerInformation

    activeMenu?: Menu

    showFriendlyHouseInfo?: ShowFriendlyHouseInfo
    showFriendlyFlagInfo?: ShowFriendlyFlagInfo
    showConstructionInfo?: PointInformation
    showHelp?: boolean
    showStatistics?: boolean
    showQuotas?: boolean
    showMenu: boolean
    isMusicPlayerVisible: boolean
    isTypingControllerVisible: boolean

    showTitles: boolean
    showAvailableConstruction: boolean
    showSetTransportPriority: boolean
    gameState: GameState

    serverUnreachable?: string

    cursorState: CursorState

    showFpsCounter: boolean

    musicVolume: number
    heightAdjust: number
}

class App extends Component<AppProps, AppState> {

    private keyHandlers: Map<number, (() => void)> = new Map()
    private selfNameRef = React.createRef<HTMLDivElement>()
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
        this.keyHandlers.set(77, this.showMenu)        // M

        this.moveGameRight = this.moveGameRight.bind(this)
        this.moveGameLeft = this.moveGameLeft.bind(this)
        this.moveGameUp = this.moveGameUp.bind(this)
        this.moveGameDown = this.moveGameDown.bind(this)

        this.closeActiveMenu = this.closeActiveMenu.bind(this)

        this.state = {
            showAvailableConstruction: false,
            selected: { x: 0, y: 0 },
            gameWidth: 0,
            gameHeight: 0,
            showMenu: false,
            showTitles: true,
            showSetTransportPriority: false,
            cursorState: 'NOTHING',
            showFpsCounter: false,
            isMusicPlayerVisible: true,
            isTypingControllerVisible: true,
            musicVolume: 1,
            heightAdjust: DEFAULT_HEIGHT_ADJUSTMENT,
            gameState: 'STARTED'
        }

        /* Set up type control commands */
        this.commands = new Map()

        SMALL_HOUSES.forEach(building => this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'small') !== undefined,
            icon: <HouseIcon houseType={building} nation={'ROMANS'} scale={0.5} />
        }
        ))
        MEDIUM_HOUSES.forEach(building => this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'medium') !== undefined,
            icon: <HouseIcon houseType={building} nation={'ROMANS'} scale={0.5} />
        }))
        LARGE_HOUSES.forEach(building => building !== 'Headquarter' && this.commands.set(building, {
            action: () => monitor.placeHouse(building, this.state.selected),
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'large') !== undefined,
            icon: <HouseIcon houseType={building} nation={'ROMANS'} scale={0.5} />
        }))

        this.commands.set("Kill websocket", {
            action: () => monitor.killWebsocket(),
            icon: <Dismiss24Filled />
        })

        this.commands.set("Road", {
            action: async () => {
                console.log("Building road")

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
            filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'flag') !== undefined,
            icon: <FlagIcon nation="ROMANS" type="NORMAL" animate scale={0.7} />
        })
        this.commands.set("Remove (house, flag, or road)", {
            action: () => removeHouseOrFlagOrRoadAtPointWebsocket(this.state.selected, monitor),
            filter: (pointInformation: PointInformation) => pointInformation.is !== undefined &&
                (pointInformation?.buildingId == undefined || monitor.houses.get(pointInformation?.buildingId)?.type !== 'Headquarter')
        })
        this.commands.set("Statistics", {
            action: () => this.setState({ showStatistics: true })
        })
        this.commands.set("Game information", {
            action: () => {
                console.info("Game id: " + this.props.gameId)
                console.info("Player id: " + this.props.selfPlayerId)

                getPlayers(this.props.gameId).then(players => console.info({ title: "Players: ", players }))
            },
            icon: <TextBulletListSquare24Regular />
        })
        this.commands.set("Titles", {
            action: () => this.setState({ showTitles: !this.state.showTitles })
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
        this.commands.set("Transport priority", {
            action: () => this.setState({ showSetTransportPriority: true })
        })
        this.commands.set("List statistics", {
            action: () => printVariables()
        })
        this.commands.set("Upgrade", {
            action: async () => {
                const houseInformation = monitor.getHouseAtPointLocal(this.state.selected)

                if (houseInformation && canBeUpgraded(houseInformation)) {
                    upgradeMilitaryBuilding(this.props.gameId, this.props.selfPlayerId, houseInformation.id)
                }
            },
            filter: (pointInformation: PointInformation) => {

                if (pointInformation.is !== 'building' || pointInformation?.buildingId === undefined) {
                    return false
                }

                const houseInformation = monitor.houses.get(pointInformation.buildingId)

                return (houseInformation?.state === 'OCCUPIED' || houseInformation?.state === 'UNOCCUPIED') &&
                    (houseInformation?.type == 'Barracks' || houseInformation?.type == 'GuardHouse' ||
                        houseInformation?.type == 'WatchTower')
            },
            icon: <AddCircle24Regular />
        })
        this.commands.set("Fps", {
            action: () => { this.setState({ showFpsCounter: !this.state.showFpsCounter }) },
            icon: <TopSpeed24Filled />
        })
        this.commands.set("Menu", {
            action: () => {
                this.showMenu.bind(this)()
            },
            icon: <CalendarAgenda24Regular />
        })
        this.commands.set("Quotas", {
            action: () => {
                this.setState({ showQuotas: true })
            }
        })
        this.commands.set("Pause game", {
            action: () => monitor.pauseGame()
        })
        this.commands.set("Resume game", {
            action: () => monitor.resumeGame()
        })

        // Listen to the game state
        monitor.listenToGameState((gameState: GameState) => this.setState({ gameState }))
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
                showFriendlyFlagInfo: undefined,
                showFriendlyHouseInfo: undefined,
                showMenu: false
            }
        )
    }

    goToHouseAnimated(houseId: HouseId): void {
        console.info("Go to house with animation: " + houseId)

        const house = monitor.houses.get(houseId)

        if (house) {
            this.goToPointAnimated({ x: house.x, y: house.y })

            this.setState({ selected: { x: house.x, y: house.y } })
        }
    }

    goToHouseImmediate(houseId: HouseId): void {
        console.info("Go to house immediately: " + houseId)

        const house = monitor.houses.get(houseId)

        if (house) {
            this.goToPointImmediate({ x: house.x, y: house.y })

            this.setState({ selected: { x: house.x, y: house.y } })
        }
    }

    goToPointAnimated(point: Point): void {
        console.info("Go to point animated: " + JSON.stringify(point))

        const id = getNextAnimationId()

        const scaleY = immediateUxState.scale

        const newTranslateX = (immediateUxState.width / 2) - point.x * immediateUxState.scale
        const newTranslateY = (immediateUxState.height / 2) + point.y * scaleY - immediateUxState.height

        const start = { x: immediateUxState.translate.x, y: immediateUxState.translate.y }
        const diffX = newTranslateX - immediateUxState.translate.x
        const diffY = newTranslateY - immediateUxState.translate.y

        const timer = setInterval(
            () => {
                const animation = ongoingAnimations.get(id)

                if (animation) {
                    const factor = (1 - Math.cos(Math.PI * (animation.counter / ANIMATION_STEPS))) / 2

                    immediateUxState.translate = {
                        x: start.x + diffX * factor,
                        y: start.y + diffY * factor
                    }

                    if (animation.counter == ANIMATION_STEPS) {
                        clearInterval(animation.timer)
                    }

                    animation.counter += 1
                }
            }, 1000 / ANIMATION_FPS)

        ongoingAnimations.set(id, { counter: 0, timer })
    }

    goToPointImmediate(point: Point): void {
        console.info("Go to point immediately: " + JSON.stringify(point))

        const scaleY = immediateUxState.scale

        const newTranslateX = (immediateUxState.width / 2) - point.x * immediateUxState.scale
        const newTranslateY = (immediateUxState.height / 2) + point.y * scaleY - immediateUxState.height

        immediateUxState.translate = {
            x: newTranslateX,
            y: newTranslateY
        }
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
                showMenu: true,
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
        immediateUxState.translate.y += 10
    }

    moveGameDown(): void {
        immediateUxState.translate.y -= 10
    }

    moveGameRight(): void {
        immediateUxState.translate.x -= 10
    }

    moveGameLeft(): void {
        immediateUxState.translate.x += 10
    }

    zoomIn(): void {
        this.zoom(immediateUxState.scale + 1)
    }

    /* Should move to the game canvas so the app doesn't have to know about this? */
    zoom(newScale: number): void {

        // Set boundaries on how much scaling is allowed
        newScale = Math.min(newScale, MAX_SCALE)
        newScale = Math.max(newScale, MIN_SCALE)

        /* Center after zooming */
        const centerGamePoint = {
            x: (immediateUxState.width / 2 - immediateUxState.translate.x) / immediateUxState.scale,
            y: (immediateUxState.height / 2 + immediateUxState.translate.y) / (immediateUxState.scale)
        }

        const newTranslate = {
            x: immediateUxState.width / 2 - centerGamePoint.x * newScale,
            y: immediateUxState.height / 2 - immediateUxState.height + centerGamePoint.y * newScale
        }

        immediateUxState.translate = newTranslate
        immediateUxState.scale = newScale
    }

    onSpeedSliderChange(value: number): void {
        setSpeed(Math.round(LONGEST_TICK_LENGTH / value), this.props.gameId)
    }

    zoomOut(): void {
        this.zoom(immediateUxState.scale - 1)
    }

    onMouseDown(event: React.MouseEvent): void {

        if (event.button === 2) {
            immediateUxState.mouseDown = true
            immediateUxState.mouseDownX = event.pageX
            immediateUxState.mouseDownY = event.pageY
            immediateUxState.mouseMoving = false

            immediateUxState.translateXAtMouseDown = immediateUxState.translate.x
            immediateUxState.translateYAtMouseDown = immediateUxState.translate.y

            this.setState({ cursorState: 'DRAGGING' })
        }

        event.stopPropagation()
    }

    onMouseMove(event: React.MouseEvent): void {
        if (immediateUxState.mouseDown) {
            const deltaX = (event.pageX - immediateUxState.mouseDownX)
            const deltaY = (event.pageY - immediateUxState.mouseDownY)

            /* Detect move to separate move from click */
            if (deltaX * deltaX + deltaY * deltaY > 25) {
                immediateUxState.mouseMoving = true
            }

            immediateUxState.translate = {
                x: immediateUxState.translateXAtMouseDown + deltaX,
                y: immediateUxState.translateYAtMouseDown + deltaY
            }
        }

        event.stopPropagation()
    }

    onMouseUp(event: React.MouseEvent): void {
        immediateUxState.mouseDown = false
        immediateUxState.mouseMoving = false

        this.setState({ cursorState: 'NOTHING' })

        event.stopPropagation()
    }

    // eslint-disable-next-line
    onMouseLeave(event: React.MouseEvent): void {
        this.setState({ cursorState: 'NOTHING' })

        immediateUxState.mouseDown = false
        immediateUxState.mouseMoving = false
    }

    async componentDidMount(): Promise<void> {

        if (document.addEventListener) {
            document.addEventListener('contextmenu', function (e) {

                // Do nothing. The purpose is to make it possible to drag the screen with the right mouse button
                e.preventDefault()
            }, false)
        }

        await this.monitoringPromise

        // Store information about the player
        this.setState({ player: monitor.players.get(this.props.selfPlayerId) })

        if (this.selfNameRef.current) {

            // Store the width and height of the canvas when it's been rendered
            immediateUxState.width = this.selfNameRef.current.clientWidth
            immediateUxState.height = this.selfNameRef.current.clientHeight

            console.info("Screen dimensions: " + immediateUxState.width + "x" + immediateUxState.height)

            /* Request focus if the game is not blocked */
            if (!this.state.showMenu) {
                console.info("Putting focus on main game screen")
                this.selfNameRef.current.focus()
            }
        }

        /* Make sure the game data is loaded and being updated before accessing the game */
        await this.monitoringPromise

        /* Center the view on the headquarter on the first update */
        const headquarter = getHeadquarterForPlayer(this.props.selfPlayerId)

        if (headquarter) {
            this.goToHouseImmediate(headquarter.id)
        }

        /* Listen for changes in the window size */
        window.addEventListener("resize",
            () => {
                if (this.selfNameRef.current) {
                    immediateUxState.width = this.selfNameRef.current.clientWidth
                    immediateUxState.height = this.selfNameRef.current.clientHeight
                }
            }
        )

        /* Start running sound effects */
        sfx.startEffects()
    }

    async onPointClicked(point: Point): Promise<void> {
        console.info("Clicked point: " + point.x + ", " + point.y)

        /* Ignore clicks if the player is an observer */
        if (this.props.observe) {
            return
        }

        /* Filter clicks that are really the end of moving the mouse */
        if (immediateUxState.mouseMoving) {
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
                const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.props.selfPlayerId)

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
                if (Math.abs(lastPoint.x - point.x) <= 2 && Math.abs(lastPoint.y - point.y) <= 2) {
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
            console.info("Friendly house")

            this.setState({
                showMenu: false,
                showFriendlyHouseInfo: { house: house },
                activeMenu: 'FRIENDLY_HOUSE'
            })

            return
        }

        /* Handle the case where a flag was double clicked */
        const flag = monitor.getFlagAtPointLocal(point)

        if (flag) {

            console.info("Clicked flag")

            /* Show friendly flag dialog */
            if (flag.playerId === this.props.selfPlayerId) {
                console.info("Friendly flag")

                this.setState(
                    {
                        showMenu: false,
                        showFriendlyFlagInfo: { flag: flag },
                        activeMenu: 'FRIENDLY_FLAG'
                    }
                )
            }

            return
        }

        /* Ask the server for what can be done on the spot */
        const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.props.selfPlayerId)

        /* Create a flag if it is the only possible construction */
        if (pointInformation.canBuild.length === 1 && pointInformation.canBuild[0] === 'flag') {
            monitor.placeFlag(pointInformation)

            this.setState({ selected: point })
        }

        else if (pointInformation.is === "road" && pointInformation.roadId) {
            this.setState(
                {
                    showMenu: false,
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

                monitor.removeLocalRoad("LOCAL")

                /* Otherwise, send the escape to the type controller */
            } else {
                const keyEvent = new CustomEvent("key", { detail: { key: event.key } })

                document.dispatchEvent(keyEvent)
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
            const keyEvent = new CustomEvent("key", { detail: { key: event.key } })

            document.dispatchEvent(keyEvent)
        }
    }

    async startNewRoad(point: Point): Promise<void> {

        /* Start the list of points in the new road with the clicked point */
        console.info("Start new road construction at: " + JSON.stringify({ x: point.x, y: point.y }))

        /* Get the possible connections from the server and draw them */
        const pointInformation = await getInformationOnPoint(point, this.props.gameId, this.props.selfPlayerId)

        this.setState(
            {
                newRoad: [{ x: point.x, y: point.y }],
                possibleRoadConnections: pointInformation.possibleRoadConnections,
                cursorState: 'BUILDING_ROAD'
            }
        )
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
        if (!immediateUxState.touchMoveOngoing) {
            const touch = touches[0]

            immediateUxState.touchIdentifier = touch.identifier

            immediateUxState.mouseDownX = touch.pageX
            immediateUxState.mouseDownY = touch.pageY
            immediateUxState.mouseMoving = false
            immediateUxState.touchMoveOngoing = true

            immediateUxState.translateXAtMouseDown = immediateUxState.translate.x
            immediateUxState.translateYAtMouseDown = immediateUxState.translate.y
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

            if (immediateUxState.touchMoveOngoing && touch.identifier === immediateUxState.touchIdentifier) {
                const deltaX = (touch.pageX - immediateUxState.mouseDownX)
                const deltaY = (touch.pageY - immediateUxState.mouseDownY)

                /* Detect move to separate move from click */
                if (deltaX * deltaX + deltaY * deltaY > 25) {
                    immediateUxState.mouseMoving = true
                }

                immediateUxState.translate = {
                    x: immediateUxState.translateXAtMouseDown + deltaX,
                    y: immediateUxState.translateYAtMouseDown + deltaY
                }
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
        immediateUxState.touchMoveOngoing = false

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)
        }
    }

    onTouchEnd(event: React.TouchEvent): void {

        event.preventDefault()

        /* Stop moving */
        immediateUxState.touchMoveOngoing = false

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
                onTouchStart={this.onTouchStart}
                onTouchMove={this.onTouchMove}
                onTouchEnd={this.onTouchEnd}
                onTouchCancel={this.onTouchCancel}
                tabIndex={1}>

                <GameCanvas
                    screenWidth={immediateUxState.width}
                    screenHeight={immediateUxState.height}
                    onKeyDown={this.onKeyDown}
                    onPointClicked={this.onPointClicked.bind(this)}
                    selectedPoint={this.state.selected}
                    onDoubleClick={this.onDoubleClick.bind(this)}
                    showHouseTitles={this.state.showTitles}
                    newRoad={this.state.newRoad}
                    possibleRoadConnections={this.state.possibleRoadConnections}
                    showAvailableConstruction={this.state.showAvailableConstruction}
                    width={immediateUxState.width}
                    height={immediateUxState.height}
                    cursorState={this.state.cursorState}
                    heightAdjust={this.state.heightAdjust}
                />

                <MenuButton onMenuButtonClicked={this.showMenu.bind(this)} />

                <GameMenu
                    currentPlayerId={this.props.selfPlayerId}
                    onChangedZoom={this.zoom.bind(this)}
                    currentZoom={immediateUxState.scale}
                    minZoom={MIN_SCALE}
                    maxZoom={MAX_SCALE}
                    onSetSpeed={this.onSpeedSliderChange.bind(this)}
                    gameId={this.props.gameId}
                    onSetTitlesVisible={(showTitles: boolean) => this.setState({ showTitles: showTitles })}
                    areTitlesVisible={this.state.showTitles}
                    onLeaveGame={this.props.onLeaveGame}
                    currentSpeed={0}
                    onStatistics={() => this.setState({ showStatistics: true })}
                    onHelp={() => this.setState({ showHelp: true })}
                    onSetTransportPriority={() => this.setState({ showSetTransportPriority: true })}
                    isOpen={this.state.showMenu}
                    onClose={() => this.setState({ showMenu: false })}
                    onSetMusicPlayerVisible={(visible: boolean) => this.setState({ isMusicPlayerVisible: visible })}
                    isMusicPlayerVisible={this.state.isMusicPlayerVisible}
                    isTypingControllerVisible={this.state.isTypingControllerVisible}
                    onSetTypingControllerVisible={(visible: boolean) => this.setState({ isTypingControllerVisible: visible })}
                    defaultZoom={DEFAULT_SCALE}
                    isAvailableConstructionVisible={this.state.showAvailableConstruction}
                    onSetAvailableConstructionVisible={(visible: boolean) => this.setState({ showAvailableConstruction: visible })}
                    onSetMusicVolume={(volume: number) => this.setState({ musicVolume: volume })}
                    onSetHeightAdjust={(heightAdjust: number) => this.setState({ heightAdjust })}
                />

                {this.state.showFriendlyHouseInfo &&
                    <HouseInfo
                        gameId={this.props.gameId}
                        selfPlayerId={this.props.selfPlayerId}
                        house={this.state.showFriendlyHouseInfo.house}
                        nation={this.state.player?.nation ?? 'ROMANS'}
                        onClose={this.closeActiveMenu.bind(this)}
                    />
                }

                {this.state.showFriendlyFlagInfo &&
                    <FriendlyFlagInfo
                        flag={this.state.showFriendlyFlagInfo.flag}
                        onClose={this.closeActiveMenu.bind(this)}
                        onStartNewRoad={this.startNewRoad.bind(this)}
                        nation={this.state.player?.nation ?? 'ROMANS'}
                    />
                }

                {this.state.showHelp &&
                    <Guide onClose={this.closeActiveMenu.bind(this)} />
                }

                {this.state.showConstructionInfo &&
                    <ConstructionInfo point={this.state.showConstructionInfo}
                        onClose={this.closeActiveMenu.bind(this)}
                        onStartNewRoad={this.startNewRoad.bind(this)}
                        nation={(this.state.player) ? this.state.player.nation : "ROMANS"}
                    />
                }

                {this.state.showStatistics &&
                    <Statistics
                        onClose={() => this.setState({ showStatistics: false })}
                        gameId={this.props.gameId}
                        nation={this.state.player?.nation ?? 'ROMANS'}
                    />
                }

                {this.state.showQuotas &&
                    <Quotas
                        nation={this.state.player?.nation ?? 'ROMANS'}
                        onClose={() => this.setState({ showQuotas: false })}
                    />
                }

                {this.state.showSetTransportPriority &&
                    <SetTransportPriority
                        onClose={() => this.setState({ showSetTransportPriority: false })}
                        nation={this.state.player?.nation ?? 'ROMANS'}
                        gameId={this.props.gameId}
                        playerId={this.props.selfPlayerId}
                    />
                }

                {this.state.isTypingControllerVisible &&
                    <TypeControl commands={this.commands}
                        selectedPoint={this.state.selected}
                        gameId={this.props.gameId}
                        playerId={this.props.selfPlayerId}
                    />
                }

                <GameMessagesViewer
                    playerId={this.props.selfPlayerId}
                    nation={this.state.player?.nation ?? 'ROMANS'}
                    onGoToHouse={this.goToHouseAnimated.bind(this)}
                    onGoToPoint={this.goToPointAnimated.bind(this)}
                />

                {this.state.isMusicPlayerVisible &&
                    <MusicPlayer volume={this.state.musicVolume} />
                }

                {this.state.gameState === 'PAUSED' &&
                    <PauseSign message='PAUSED' />
                }

                {this.state.gameState === 'EXPIRED' &&
                    <PauseSign message='EXPIRED' />
                }

            </div>
        )
    }
}

function getNextAnimationId(): number {
    nextAnimation += 1

    return nextAnimation - 1
}

export default App
