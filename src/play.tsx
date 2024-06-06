import React, { useEffect, useRef, useState } from 'react'
import { canBeUpgraded, evacuateHouseOnPoint, findPossibleNewRoad, setSpeed, upgradeMilitaryBuilding } from './api/rest-api'
import './App.css'
import { ConstructionInfo } from './construction_info'
import FriendlyFlagInfo from './friendly_flag_info'
import GameMenu from './game_menu'
import GameMessagesViewer from './game_messages_viewer'
import { CursorState, DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE, GameCanvas } from './game_render'
import Guide from './guide'
import MenuButton from './menu_button'
import { GameListener, getHeadquarterForPlayer, monitor, startMonitoringGame } from './api/ws-api'
import MusicPlayer from './sound/music_player'
import Statistics from './statistics'
import { printVariables } from './stats'
import { SetTransportPriority } from './transport_priority'
import { TypeControl, Command } from './type_control'
import { isRoadAtPoint, removeHouseOrFlagOrRoadAtPointWebsocket } from './utils'
import { HouseInformation, FlagInformation, PlayerId, GameId, Point, PointInformation, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, HouseId, PlayerInformation, GameState, RoadId } from './api/types'
import { Dismiss24Filled, CalendarAgenda24Regular, TopSpeed24Filled, AddCircle24Regular } from '@fluentui/react-icons'
import { FlagIcon, HouseIcon } from './icon'
import { HouseInfo } from './house_info/house_info'
import { sfx } from './sound/sound_effects'
import { Quotas } from './quotas'
import { animator } from './utils/animator'
import { RoadInfo } from './road-info'
import { Debug } from './debug/debug'

type HouseWindow = {
    type: 'HOUSE'
    house: HouseInformation
}

type FlagWindow = {
    type: 'FLAG'
    flag: FlagInformation
}

type ConstructionWindow = {
    type: 'CONSTRUCTION_WINDOW'
    pointInformation: PointInformation
}

type StatisticsWindow = {
    type: 'STATISTICS'
}

type GuideWindow = {
    type: 'GUIDE'
}

type DebugWindow = {
    type: 'DEBUG'
}

type QuotaWindow = {
    type: 'QUOTA'
}

type RoadWindow = {
    type: 'ROAD_INFO'
    roadId: RoadId
}

type TransportPriorityWindow = {
    type: 'TRANSPORT_PRIORITY'
}

type WindowType = HouseWindow |
    FlagWindow |
    ConstructionWindow |
    StatisticsWindow |
    GuideWindow |
    DebugWindow |
    QuotaWindow |
    RoadWindow |
    TransportPriorityWindow

type Window = {
    id: number
} & WindowType

let trackNextWindowId = 0

function nextWindowId(): number {
    trackNextWindowId++

    return trackNextWindowId - 1
}

const MAX_SCALE = 70
const MIN_SCALE = 10
const ARROW_KEY_MOVE_DISTANCE = 20

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
    scale: 35.0//DEFAULT_SCALE
}

/* Track ongoing touches to make touch control work */
const ongoingTouches: Map<number, StoredTouch> = new Map()

interface StoredTouch {
    identifier: number
    pageX: number
    pageY: number
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
            justifyContent: "center",
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: "black", borderRadius: "5px"
            }}>
                {message}
            </div>
        </div>
    )
}

interface PlayProps {
    selfPlayerId: PlayerId
    gameId: GameId

    onLeaveGame: (() => void)
}

type NewRoad = {
    newRoad: Point[]
    possibleConnections: Point[]
}

const Play = ({ gameId, selfPlayerId, onLeaveGame }: PlayProps) => {
    const selfNameRef = useRef<HTMLDivElement | null>(null)

    const [commands, setCommands] = useState<Map<string, Command>>(new Map())
    const [monitoringReady, setMonitoringReady] = useState<boolean>(false)
    const [showAvailableConstruction, setShowAvailableConstruction] = useState<boolean>(false)
    const [selected, setSelected] = useState<Point>({ x: 0, y: 0 })
    const [showMenu, setShowMenu] = useState<boolean>(false)
    const [windows, setWindows] = useState<Window[]>([])
    const [showTitles, setShowTitles] = useState<boolean>(true)
    const [cursor, setCursor] = useState<CursorState>('NOTHING')
    const [showFpsCounter, setShowFpsCounter] = useState<boolean>(false)
    const [showMusicPlayer, setShowMusicPlayer] = useState<boolean>(true)
    const [showTypingController, setShowTypingController] = useState<boolean>(true)
    const [musicVolume, setMusicVolume] = useState<number>(1)
    const [heightAdjust, setHeightAdjust] = useState<number>(DEFAULT_HEIGHT_ADJUSTMENT)
    const [animateMapScrolling, setAnimateMapScrolling] = useState<boolean>(true)
    const [animateZoom, setAnimateZoom] = useState<boolean>(true)
    const [gameState, setGameState] = useState<GameState>('STARTED')
    const [newRoad, setNewRoad] = useState<NewRoad>()
    const [player, setPlayer] = useState<PlayerInformation>()

    const gameMonitorCallbacks: GameListener = {
        onMonitoringStarted: () => {
            setMonitoringReady(true)
            console.log("Monitoring started")
        },
        onGameStateChanged: (gameState: GameState) => setGameState(gameState)
    }

    useEffect(
        () => {
            console.log("Use effect: Start listening to game")

            monitor.listenToGameState(gameMonitorCallbacks)

            startMonitoringGame(gameId, selfPlayerId)

            return () => {
                console.log('Use effect: Stop listening to game')

                monitor.stopListeningToGameState(gameMonitorCallbacks)
            }
        }, [gameId, selfPlayerId]
    )

    function openSingletonWindow(window: WindowType): void {
        const updatedWindows = windows.filter(w => w.type !== window.type)

        const windowWithId = {
            ...window,
            id: nextWindowId()
        }

        updatedWindows.push(windowWithId)

        setWindows(updatedWindows)
    }

    function openWindow(window: WindowType): void {
        const updatedWindows = [...windows]

        const windowWithId = {
            ...window,
            id: nextWindowId()
        }

        updatedWindows.push(windowWithId)

        setWindows(updatedWindows)
    }

    function closeWindow(id: number): void {
        setWindows(windows.filter(w => w.id !== id))
    }

    function raiseWindow(id: number): void {
        const window = windows.find(w => w.id === id)

        if (window !== undefined) {
            const remaining = windows.filter(w => w.id !== id)

            remaining.push(window)

            setWindows(remaining)
        }
    }

    function goToHouse(houseId: HouseId): void {
        console.info("Go to house immediately: " + houseId)

        const house = monitor.houses.get(houseId)

        if (house) {
            goToPoint({ x: house.x, y: house.y })

            setSelected({ x: house.x, y: house.y })
        }
    }

    function setNewTranslatedAnimated(newTranslateX: number, newTranslateY: number) {
        animator.animateSeveral('TRANSLATE', (newTranslate) => {
            immediateUxState.translate = {
                x: newTranslate[0],
                y: newTranslate[1]
            }
        },
            [immediateUxState.translate.x, immediateUxState.translate.y],
            [newTranslateX, newTranslateY])
    }

    function goToPoint(point: Point): void {
        console.info("Go to point: " + JSON.stringify(point))

        const scaleY = immediateUxState.scale

        const newTranslateX = (immediateUxState.width / 2) - point.x * immediateUxState.scale
        const newTranslateY = (immediateUxState.height / 2) + point.y * scaleY - immediateUxState.height

        if (animateMapScrolling) {
            setNewTranslatedAnimated(newTranslateX, newTranslateY)
        } else {
            immediateUxState.translate = {
                x: newTranslateX,
                y: newTranslateY
            }
        }
    }

    function moveGame(newTranslateX: number, newTranslateY: number): void {
        if (animateMapScrolling) {
            setNewTranslatedAnimated(newTranslateX, newTranslateY)
        } else {
            immediateUxState.translate = { x: newTranslateX, y: newTranslateY }
        }
    }

    function zoom(newScale: number): void {

        // Set boundaries on how much scaling is allowed
        newScale = Math.min(newScale, MAX_SCALE)
        newScale = Math.max(newScale, MIN_SCALE)

        if (animateZoom) {
            animator.animate('ZOOM', (newScale) => {
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
            },
                immediateUxState.scale,
                newScale)
        } else {
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
    }

    function onMouseDown(event: React.MouseEvent): void {
        if (event.button === 2) {
            immediateUxState.mouseDown = true
            immediateUxState.mouseDownX = event.pageX
            immediateUxState.mouseDownY = event.pageY
            immediateUxState.mouseMoving = false

            immediateUxState.translateXAtMouseDown = immediateUxState.translate.x
            immediateUxState.translateYAtMouseDown = immediateUxState.translate.y

            setCursor('DRAGGING')
        }

        event.stopPropagation()
    }

    function onMouseMove(event: React.MouseEvent): void {
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

    function onMouseUp(event: React.MouseEvent): void {
        immediateUxState.mouseDown = false
        immediateUxState.mouseMoving = false

        setCursor('NOTHING')

        event.stopPropagation()
    }

    // eslint-disable-next-line
    function onMouseLeave(_event: React.MouseEvent): void {
        setCursor('NOTHING')

        immediateUxState.mouseDown = false
        immediateUxState.mouseMoving = false
    }

    useEffect(
        () => {
            console.log("Use effect: start event and window resize listeners")

            function nopEventListener(event: MouseEvent) {
                event.preventDefault()
            }

            function windowResizeListener() {
                if (selfNameRef.current) {
                    immediateUxState.width = selfNameRef.current.clientWidth
                    immediateUxState.height = selfNameRef.current.clientHeight
                }
            }

            if (document.addEventListener) {
                document.addEventListener('contextmenu', nopEventListener, false)
            }

            window.addEventListener("resize", windowResizeListener)

            return () => {
                console.log('Use effect: removing event and window resize listeners')

                document.removeEventListener('contextmenu', nopEventListener)
                window.removeEventListener('resize', windowResizeListener)
            }
        }, [selfNameRef]
    )

    useEffect(
        () => {
            console.log('Use effect: set commands')

            if (monitoringReady && commands.size === 0) {
                const player = monitor.players.get(selfPlayerId)
                const nation = player?.nation ?? 'VIKINGS'
                const color = player?.color ?? 'GREEN'

                const commands = new Map()

                SMALL_HOUSES.forEach(building => commands.set(building, {
                    action: (point: Point) => monitor.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'small') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))
                MEDIUM_HOUSES.forEach(building => commands.set(building, {
                    action: (point: Point) => monitor.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'medium') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))
                LARGE_HOUSES.forEach(building => building !== 'Headquarter' && commands.set(building, {
                    action: (point: Point) => monitor.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'large') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))

                commands.set("Kill websocket", {
                    action: () => monitor.killWebsocket(),
                    icon: <Dismiss24Filled />
                })

                commands.set("Road", {
                    action: async (point: Point) => {
                        console.log("Building road")

                        /* Get the possible connections from the server and draw them */
                        const pointDownRight = { x: point.x + 1, y: point.y - 1 }
                        const pointInformations = await monitor.getInformationOnPoints([point, pointDownRight])

                        const pointInformation = pointInformations.get(point)
                        const pointDownRightInformation = pointInformations.get(pointDownRight)

                        if (pointInformation === undefined) {
                            console.error(`Failed to get point information: ${point}!`)

                            return
                        }

                        /* If a house is selected, start the road from the flag */
                        if (pointInformation.is && pointInformation.is === "building") {
                            if (pointDownRightInformation === undefined) {
                                console.error(`Failed to get point down right information: ${pointDownRight}!`)

                                return
                            }

                            setNewRoad({
                                newRoad: [pointDownRight],
                                possibleConnections: pointDownRightInformation.possibleRoadConnections
                            })
                            setCursor('BUILDING_ROAD')
                        } else if (pointInformation.is && pointInformation.is === "flag") {
                            setNewRoad({
                                newRoad: [point],
                                possibleConnections: pointInformation.possibleRoadConnections
                            })

                            setCursor('BUILDING_ROAD')
                        }
                    },
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'building' || pointInformation.is === 'flag'
                })

                commands.set("Flag", {
                    action: (point: Point) => monitor.placeFlag(point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'flag') !== undefined,
                    icon: <FlagIcon nation={nation} type="NORMAL" animate scale={0.7} color={color} />
                })
                commands.set("Remove (house, flag, or road)", {
                    action: (point: Point) => removeHouseOrFlagOrRoadAtPointWebsocket(point, monitor),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'building' &&
                        monitor.houses.get(pointInformation?.buildingId)?.type !== 'Headquarter'
                })
                commands.set("Statistics", {
                    action: () => {
                        openSingletonWindow({ type: 'STATISTICS' })
                    }
                })
                commands.set("Titles", {
                    action: () => setShowTitles(!showTitles)
                })
                commands.set("Geologist", {
                    action: (point: Point) => monitor.callGeologist(point),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
                })
                commands.set("Scout", {
                    action: (point: Point) => monitor.callScout(point),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
                })
                commands.set("Evacuate building", {
                    action: (point: Point) => evacuateHouseOnPoint(point, gameId, selfPlayerId), // TODO: replace this with a call to monitor.evacuate...
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'building'
                })
                commands.set("Transport priority", {
                    action: () => openSingletonWindow({ type: 'TRANSPORT_PRIORITY' })
                })
                commands.set("List statistics", {
                    action: () => printVariables()
                })
                commands.set("Upgrade", {
                    action: (point: Point) => {
                        const houseInformation = monitor.getHouseAtPointLocal(point)

                        if (houseInformation && canBeUpgraded(houseInformation)) {
                            upgradeMilitaryBuilding(gameId, selfPlayerId, houseInformation.id)
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
                commands.set("Fps", {
                    action: () => { setShowFpsCounter(!showFpsCounter) },
                    icon: <TopSpeed24Filled />
                })
                commands.set("Menu", {
                    action: () => {
                        setShowMenu(true)
                    },
                    icon: <CalendarAgenda24Regular />
                })
                commands.set("Quotas", {
                    action: () => openSingletonWindow({ type: 'QUOTA' })
                })
                commands.set("Pause game", {
                    action: () => monitor.pauseGame()
                })
                commands.set("Resume game", {
                    action: () => monitor.resumeGame()
                })
                commands.set("Debug", {
                    action: () => openSingletonWindow({ type: 'DEBUG' })
                })

                setCommands(commands)

                // Store information about the player
                setPlayer(monitor.players.get(selfPlayerId))

                if (selfNameRef.current) {
                    immediateUxState.width = selfNameRef.current.clientWidth
                    immediateUxState.height = selfNameRef.current.clientHeight

                    /* Request focus if the game is not blocked */
                    if (!showMenu) {
                        selfNameRef.current.focus()
                    }
                }

                /* Center the view on the headquarter on the first update */
                const headquarter = getHeadquarterForPlayer(selfPlayerId)

                console.log(['Time to go to headquarters', headquarter])

                if (headquarter) {
                    goToHouse(headquarter.id)
                }

            }
        }, [monitoringReady]
    )

    useEffect(
        () => {
            console.log('Use effect: start sound effects')

            sfx.startEffects()

            return () => {
                console.log('Use effect: stop sound effects')

                sfx.stopEffects()
            }
        }, []
    )

    async function onPointClicked(point: Point): Promise<void> {
        console.info("Clicked point: " + point.x + ", " + point.y)

        /* Filter clicks that are really the end of moving the mouse */
        if (immediateUxState.mouseMoving) {
            return
        }

        /* A road is being built */
        if (newRoad && newRoad.possibleConnections) {
            const recent = newRoad.newRoad[newRoad.newRoad.length - 1]

            /* Create the possible new road including the addition */
            const possibleNewRoad = newRoad.newRoad

            /* Handle the case where one of the directly adjacent possible new road connections is selected */
            if (newRoad.possibleConnections.find(e => e.x === point.x && e.y === point.y)) {
                possibleNewRoad.push(point)

                /* Handle the case where a point further away was clicked */
            } else {

                /* Get the possible road from the current point to the clicked point. Make sure to avoid the ongoing planned road */
                // TODO: move to ws API
                const possibleNewRoadSegment = await findPossibleNewRoad(recent, point, newRoad.newRoad, gameId, selfPlayerId)

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
                setNewRoad(undefined)
                setSelected(point)

                // Create the road, including making an optimistic change first on the client side
                monitor.placeRoad(possibleNewRoad)

                /* Handle the case when a piece of road is clicked but there is no flag on it. Create the road */
            } else if (isRoadAtPoint(point, monitor.roads)) {
                console.info('Placing flag for road')

                if (monitor.isAvailable(point, 'FLAG')) {

                    // Start with changing the UI state to make the user experience feel quicker
                    setNewRoad(undefined)

                    monitor.placeRoadWithFlag(point, possibleNewRoad)
                }

                /* Add the new possible road points to the ongoing road and don't create the road */
            } else if (recent.x !== point.x || recent.y !== point.y) {
                console.info("Continuing road building with extended road segment")

                /* Get the available connections from the added point */
                const pointInformation = await monitor.getInformationOnPoint(point)

                console.log("Possible new road direct adjacent road connections: " + JSON.stringify(pointInformation.possibleRoadConnections))

                setNewRoad({
                    newRoad: possibleNewRoad,
                    possibleConnections: pointInformation.possibleRoadConnections
                })

                setCursor('BUILDING_ROAD')
            }

            /* Select the point */
        } else {
            console.info("Selecting point: " + point.x + ", " + point.y)

            setSelected(point)
        }
    }

    async function onDoubleClick(point: Point): Promise<void> {
        console.info("Double click on " + point.x + ", " + point.y)

        /* First, handle double clicks differently if a new road is being created */
        if (newRoad) {
            console.log("New road exists")

            if (monitor.isAvailable(point, 'FLAG')) {
                console.log("Can place flag")

                // Keep a reference to the new road so it doesn't get lost when the state is changed
                const newRoadPoints = newRoad.newRoad
                const lastPoint = newRoad.newRoad[newRoad.newRoad.length - 1]

                // Only add this point to the road points if the distance is acceptable - otherwise let the backend fill in
                if (Math.abs(lastPoint.x - point.x) <= 2 && Math.abs(lastPoint.y - point.y) <= 2) {
                    newRoadPoints.push(point)
                }

                // Update the state before calling the backend to make the user experience feel quicker
                setNewRoad(undefined)
                setSelected(point)

                // Call the backend to make the changes take effect
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

            openWindow({ type: 'HOUSE', house })

            setShowMenu(false)

            return
        }

        /* Handle the case where a flag was double clicked */
        const flag = monitor.getFlagAtPointLocal(point)

        if (flag) {
            console.info("Clicked flag")

            /* Show friendly flag dialog */
            if (flag.playerId === selfPlayerId) {
                console.info("Friendly flag")

                openWindow({ type: 'FLAG', flag })
            }

            return
        }

        /* Ask the server for what can be done on the spot */
        const pointInformation = await monitor.getInformationOnPoint(point)

        /* Create a flag if it is the only possible construction */
        if (pointInformation.canBuild.length === 1 && pointInformation.canBuild[0] === 'flag') {
            monitor.placeFlag(pointInformation)

            setSelected(point)
        }

        else if (pointInformation.is === "road" && pointInformation.roadId) {
            openWindow({ type: 'ROAD_INFO', roadId: pointInformation.roadId })

            console.log("SHOWING ROAD INFO WINDOW")
        }

        /* Open the window to construct houses/flags/roads */
        else if (pointInformation.canBuild && pointInformation.canBuild.length !== 0) {
            openWindow({ type: 'CONSTRUCTION_WINDOW', pointInformation: pointInformation })
        }
    }

    function onKeyDown(event: React.KeyboardEvent): void {
        if (event.key === "Escape") {

            /* Close the active menu (if there is an active menu) */
            if (windows.length > 0) {
                closeWindow(windows[windows.length - 1].id)

                /* Stop building a new road */
            } else if (newRoad) {
                setNewRoad(undefined)

                monitor.removeLocalRoad("LOCAL")

                /* Otherwise, send the escape to the type controller */
            } else {
                const keyEvent = new CustomEvent("key", { detail: { key: event.key, metaKey: event.metaKey, altKey: event.altKey, ctrlKey: event.ctrlKey } })

                document.dispatchEvent(keyEvent)
            }
        } else if (event.key === " ") {
            setShowTitles(true)
            setShowAvailableConstruction(!showAvailableConstruction)
        } else if (event.key === "ArrowUp") {
            moveGame(immediateUxState.translate.x, immediateUxState.translate.y + ARROW_KEY_MOVE_DISTANCE)
        } else if (event.key === "ArrowRight") {
            moveGame(immediateUxState.translate.x - ARROW_KEY_MOVE_DISTANCE, immediateUxState.translate.y)
        } else if (event.key === "ArrowDown") {
            moveGame(immediateUxState.translate.x, immediateUxState.translate.y - ARROW_KEY_MOVE_DISTANCE)
        } else if (event.key === "ArrowLeft") {
            moveGame(immediateUxState.translate.x + ARROW_KEY_MOVE_DISTANCE, immediateUxState.translate.y)
        } else if (event.key === "+") {
            zoom(immediateUxState.scale + 1)
        } else if (event.key === "-") {
            zoom(immediateUxState.scale - 1)
        } else if (event.key === "M") {
            setShowMenu(true)
        } else {
            const keyEvent = new CustomEvent("key", { detail: { key: event.key, metaKey: event.metaKey, altKey: event.altKey, ctrlKey: event.ctrlKey } })

            document.dispatchEvent(keyEvent)
        }
    }

    async function startNewRoad(point: Point): Promise<void> {

        /* Start the list of points in the new road with the clicked point */
        console.info("Start new road construction at: " + JSON.stringify({ x: point.x, y: point.y }))

        /* Get the possible connections from the server and draw them */
        const pointInformation = await monitor.getInformationOnPoint(point)

        setNewRoad({
            newRoad: [{ x: point.x, y: point.y }],
            possibleConnections: pointInformation.possibleRoadConnections
        })

        setCursor('BUILDING_ROAD')
    }

    function copyTouch(touch: React.Touch): StoredTouch {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY }
    }

    function onTouchStart(event: React.TouchEvent): void {
        event.preventDefault()

        console.log("touchstart.")

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            console.log("touchstart:" + i + "...")

            ongoingTouches.set(touches[i].identifier, copyTouch(touches[i]))

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

    function onTouchMove(event: React.TouchEvent): void {
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

    function onWheel(event: React.WheelEvent): void {
        zoom(immediateUxState.scale - event.deltaY / 20.0)
    }

    function onTouchCancel(event: React.TouchEvent): void {
        event.preventDefault()

        console.log("touchcancel.")

        /* Stop moving */
        immediateUxState.touchMoveOngoing = false

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)
        }
    }

    function onTouchEnd(event: React.TouchEvent): void {
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

    return (
        <div
            className="App"
            ref={selfNameRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onKeyDown={onKeyDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            onWheel={onWheel}
            tabIndex={1}>

            <GameCanvas
                screenWidth={immediateUxState.width}
                screenHeight={immediateUxState.height}
                onKeyDown={onKeyDown}
                onPointClicked={(point: Point) => onPointClicked(point)}
                selectedPoint={selected}
                onDoubleClick={(point: Point) => onDoubleClick(point)}
                showHouseTitles={showTitles}
                newRoad={newRoad?.newRoad}
                possibleRoadConnections={newRoad?.possibleConnections}
                showAvailableConstruction={showAvailableConstruction}
                width={immediateUxState.width}
                height={immediateUxState.height}
                cursorState={cursor}
                heightAdjust={heightAdjust}
            />

            <MenuButton onMenuButtonClicked={() => setShowMenu(true)} />

            <GameMenu
                onChangedZoom={newScale => zoom(newScale)}
                minZoom={MIN_SCALE}
                maxZoom={MAX_SCALE}
                onSetSpeed={value => setSpeed(Math.round(LONGEST_TICK_LENGTH / value), gameId)}
                gameId={gameId}
                onSetTitlesVisible={(showTitles: boolean) => setShowTitles(showTitles)}
                areTitlesVisible={showTitles}
                onLeaveGame={onLeaveGame}
                onStatistics={() => openSingletonWindow({ type: 'STATISTICS' })}
                onHelp={() => openSingletonWindow({ type: 'GUIDE' })}
                onSetTransportPriority={() => openSingletonWindow({ type: 'TRANSPORT_PRIORITY' })}
                isOpen={showMenu}
                isAnimateMapScrollingSet={animateMapScrolling}
                isAnimateZoomingSet={animateZoom}
                isAvailableConstructionVisible={showAvailableConstruction}
                isMusicPlayerVisible={showMusicPlayer}
                isTypingControllerVisible={showTypingController}
                defaultZoom={DEFAULT_SCALE}
                onClose={() => setShowMenu(false)}
                onSetMusicPlayerVisible={(visible: boolean) => setShowMusicPlayer(visible)}
                onSetTypingControllerVisible={(visible: boolean) => setShowTypingController(visible)}
                onSetAvailableConstructionVisible={(visible: boolean) => setShowAvailableConstruction(visible)}
                onSetMusicVolume={(volume: number) => setMusicVolume(volume)}
                onSetHeightAdjust={(heightAdjust: number) => setHeightAdjust(heightAdjust)}
                onSetAnimateMapScrolling={(animateMapScrolling) => setAnimateMapScrolling(animateMapScrolling)}
                onSetAnimateZooming={(animateZoom) => setAnimateZoom(animateZoom)}
                onQuota={() => openSingletonWindow({ type: 'QUOTA' })}
            />

            {windows.map(window => {
                switch (window.type) {
                    case 'CONSTRUCTION_WINDOW':
                        return <ConstructionInfo
                            key={window.id}
                            point={window.pointInformation}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            onStartNewRoad={startNewRoad.bind(this)}
                            nation={(player) ? player.nation : "ROMANS"}
                        />
                    case 'FLAG':
                        return <FriendlyFlagInfo
                            key={window.id}
                            flag={window.flag}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            onStartNewRoad={startNewRoad.bind(this)}
                            nation={player?.nation ?? 'ROMANS'}
                        />
                    case 'HOUSE':
                        return <HouseInfo
                            key={window.id}
                            gameId={gameId}
                            selfPlayerId={selfPlayerId}
                            house={window.house}
                            nation={player?.nation ?? 'ROMANS'}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'GUIDE':
                        return <Guide
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            key={window.id}
                        />
                    case 'STATISTICS':
                        return <Statistics
                            key={window.id}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            gameId={gameId}
                            nation={player?.nation ?? 'ROMANS'}
                        />
                    case 'QUOTA':
                        return <Quotas
                            key={window.id}
                            nation={player?.nation ?? 'ROMANS'}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'TRANSPORT_PRIORITY':
                        return <SetTransportPriority
                            key={window.id}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            nation={player?.nation ?? 'ROMANS'}
                            gameId={gameId}
                            playerId={selfPlayerId}
                        />
                    case 'ROAD_INFO':
                        return <RoadInfo
                            key={window.id}
                            roadId={window.roadId}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'DEBUG':
                        return <Debug
                            point={selected}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            key={window.id}
                        />
                }
            })}

            {showTypingController &&
                <TypeControl commands={commands}
                    selectedPoint={selected}
                    gameId={gameId}
                    playerId={selfPlayerId}
                />
            }

            <GameMessagesViewer
                playerId={selfPlayerId}
                nation={player?.nation ?? 'ROMANS'}
                onGoToHouse={(houseId: HouseId) => goToHouse(houseId)}
                onGoToPoint={(point: Point) => goToPoint(point)}
            />

            {showMusicPlayer &&
                <MusicPlayer volume={musicVolume} />
            }

            {gameState === 'PAUSED' &&
                <PauseSign message='PAUSED' />
            }

            {gameState === 'EXPIRED' &&
                <PauseSign message='EXPIRED' />
            }
        </div>
    )
}


export default Play
