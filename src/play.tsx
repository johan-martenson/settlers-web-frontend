import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { ConstructionInfo } from './construction_info'
import FriendlyFlagInfo from './friendly_flag_info'
import GameMenu from './game_menu'
import GameMessagesViewer from './game_messages_viewer'
import { CursorState, GameCanvas } from './render/game_render'
import Guide from './guide'
import MenuButton from './menu_button'
import { GameListener, api } from './api/ws-api'
import MusicPlayer from './sound/music_player'
import Statistics from './statistics'
import { printVariables } from './stats'
import { SetTransportPriority } from './transport_priority'
import { TypeControl, Command } from './type_control'
import { isRoadAtPoint } from './utils'
import { HouseInformation, FlagInformation, PlayerId, GameId, Point, PointInformation, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, HouseId, PlayerInformation, GameState, RoadId } from './api/types'
import { Dismiss24Filled, CalendarAgenda24Regular, TopSpeed24Filled, AddCircle24Regular } from '@fluentui/react-icons'
import { FlagIcon, HouseIcon } from './icons/icon'
import { HouseInfo } from './house_info/house_info'
import { sfx } from './sound/sound_effects'
import { Quotas } from './quotas'
import { animator } from './utils/animator'
import { RoadInfo } from './road-info'
import { Debug } from './debug/debug'
import { Follow } from './follow'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE } from './render/constants'
import { ButtonRow } from './components/dialog'
import { Button } from '@fluentui/react-components'
import { NoActionWindow } from './no_action_window'
import { ExpandChatBox } from './chat/chat'
import { canBeUpgraded, getHeadquarterForPlayer, removeHouseOrFlagOrRoadAtPoint } from './api/utils'

// Types
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

type FollowWindow = {
    type: 'FOLLOW'
    point: Point
}

type NoActionWindow = {
    type: 'NO_ACTION'
    point: Point
}

type WindowType = HouseWindow |
    FlagWindow |
    ConstructionWindow |
    StatisticsWindow |
    GuideWindow |
    DebugWindow |
    QuotaWindow |
    RoadWindow |
    TransportPriorityWindow |
    FollowWindow |
    NoActionWindow

type Window = {
    id: number
} & WindowType

type StoredTouch = {
    identifier: number
    pageX: number
    pageY: number
}

type PlayProps = {
    selfPlayerId: PlayerId
    gameId: GameId

    onLeaveGame: (() => void)
}

export type NewRoad = {
    newRoad: Point[]
    possibleConnections: Point[]
}

// Constants
export const DEFAULT_VOLUME = 0.5

const MAX_SCALE = 150
const MIN_SCALE = 10
const ARROW_KEY_MOVE_DISTANCE = 20

// State
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

// Functions
function calcZoom(width: number, height: number, translate: { x: number, y: number }, prevScale: number, newScale: number) {
    const centerGamePoint = {
        x: (width / 2 - translate.x) / prevScale,
        y: (height / 2 + translate.y) / (prevScale)
    }

    return {
        x: width / 2 - centerGamePoint.x * newScale,
        y: height / 2 - height + centerGamePoint.y * newScale
    }
}

// React components
const Expired = () => {
    return (
        <div className='expired'>
            <h1>The game has expired</h1>
            <p>The game has expired and is frozen in time. You can stay and view the current game or go back to the lobby to start a new game.</p>
            <ButtonRow>
                <Button>Stay in game</Button>
                <Button onClick={() => window.location.href = ''}>Go to lobby</Button>
            </ButtonRow>

        </div>
    )
}

const PauseSign = () => {
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
                The game is paused
            </div>
        </div>
    )
}

const Play = ({ gameId, selfPlayerId, onLeaveGame }: PlayProps) => {

    // References
    const selfNameRef = useRef<HTMLDivElement | null>(null)

    // State
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
    const [newRoad, setNewRoad] = useState<Point[]>()
    const [possibleRoadConnections, setPossibleRoadConnections] = useState<Point[]>()
    const [player, setPlayer] = useState<PlayerInformation>()
    const [windowHeight, setWindowHeight] = useState<number>(0)
    const [ongoingTouches, neverSetOngoingTouched] = useState<Map<number, StoredTouch>>(new Map<number, StoredTouch>())
    const [nextWindowIdContainer, neverSetNextWindowIdContainer] = useState<{ nextWindowId: number }>({ nextWindowId: 0 })

    // Effects
    const gameMonitorCallbacks: GameListener = {
        onMonitoringStarted: () => {
            setMonitoringReady(true)
            console.log("Monitoring started")
        },
        onGameStateChanged: (gameState: GameState) => setGameState(gameState)
    }

    useEffect(
        () => {
            if (newRoad === undefined) {
                setCursor('NOTHING')
            } else {
                setCursor('BUILDING_ROAD')
            }
        }, [newRoad]
    )

    useEffect(
        () => {
            async function connectAndFollow(gameId: GameId, selfPlayerId: PlayerId): Promise<void> {
                await api.connectAndWaitForConnection()

                api.addGameStateListener(gameMonitorCallbacks)

                await api.followGame(gameId, selfPlayerId)
            }

            console.log("Use effect: Start listening to game")

            connectAndFollow(gameId, selfPlayerId)

            return () => {
                console.log('Use effect: Stop listening to game')

                api.removeGameStateListener(gameMonitorCallbacks)
            }
        }, [gameId, selfPlayerId]
    )

    useEffect(
        () => {
            console.log("Use effect: start event and window resize listeners")

            function nopEventListener(event: MouseEvent): void {
                event.preventDefault()
            }

            function windowResizeListener(): void {
                if (selfNameRef.current) {
                    immediateUxState.width = selfNameRef.current.clientWidth
                    immediateUxState.height = selfNameRef.current.clientHeight

                    setWindowHeight(selfNameRef.current.clientHeight)
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
            function setTypingCommands(): void {
                const player = api.players.get(selfPlayerId)
                const nation = player?.nation ?? 'VIKINGS'
                const color = player?.color ?? 'GREEN'

                const commands = new Map()

                SMALL_HOUSES.forEach(building => commands.set(building, {
                    action: (point: Point) => api.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'small') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))
                MEDIUM_HOUSES.forEach(building => commands.set(building, {
                    action: (point: Point) => api.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'medium') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))
                LARGE_HOUSES.forEach(building => building !== 'Headquarter' && commands.set(building, {
                    action: (point: Point) => api.placeHouse(building, point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'large') !== undefined,
                    icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
                }))

                commands.set("Kill websocket", {
                    action: () => api.killWebsocket(),
                    icon: <Dismiss24Filled />
                })

                commands.set("Road", {
                    action: async (point: Point) => {
                        console.log("Building road")

                        /* Get the possible connections from the server and draw them */
                        const pointDownRight = { x: point.x + 1, y: point.y - 1 }
                        const pointInformations = await api.getInformationOnPoints([point, pointDownRight])

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

                            setNewRoad([pointDownRight])
                            setPossibleRoadConnections(pointDownRightInformation.possibleRoadConnections)
                        } else if (pointInformation.is && pointInformation.is === "flag") {
                            setNewRoad([point])
                            setPossibleRoadConnections(pointInformation.possibleRoadConnections)
                        }
                    },
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'building' || pointInformation.is === 'flag'
                })

                commands.set("Flag", {
                    action: (point: Point) => api.placeFlag(point),
                    filter: (pointInformation: PointInformation) => pointInformation.canBuild.find(a => a === 'flag') !== undefined,
                    icon: <FlagIcon nation={nation} type="NORMAL" animate scale={0.7} color={color} />
                })
                commands.set("Remove (house, flag, or road)", {
                    action: (point: Point) => removeHouseOrFlagOrRoadAtPoint(point),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'building' &&
                        api.houses.get(pointInformation?.buildingId)?.type !== 'Headquarter'
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
                    action: (point: Point) => api.callGeologist(point),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
                })
                commands.set("Scout", {
                    action: (point: Point) => api.callScout(point),
                    filter: (pointInformation: PointInformation) => pointInformation.is === 'flag'
                })
                commands.set("Evacuate building", {
                    action: (point: Point) => {
                        const house = api.houseAt(point)

                        if (house !== undefined) {
                            api.evacuateHouse(house.id)
                        }
                    },
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
                        const houseInformation = api.getHouseAtPointLocal(point)

                        if (houseInformation && canBeUpgraded(houseInformation)) {
                            api.upgradeHouse(houseInformation.id)
                        }
                    },
                    filter: (pointInformation: PointInformation) => {
                        if (pointInformation.is !== 'building' || pointInformation?.buildingId === undefined) {
                            return false
                        }

                        const houseInformation = api.houses.get(pointInformation.buildingId)

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
                    action: () => api.pauseGame()
                })
                commands.set("Resume game", {
                    action: () => api.resumeGame()
                })
                commands.set("Debug", {
                    action: () => openSingletonWindow({ type: 'DEBUG' })
                })
                commands.set("Follow", {
                    action: (point: Point) => openWindow({ type: 'FOLLOW', point })
                })

                setCommands(commands)
            }

            console.log('Use effect: set commands')

            api.waitForGameDataAvailable().then(
                () => {
                    setTypingCommands()

                    // Store information about the player
                    setPlayer(api.players.get(selfPlayerId))

                    if (selfNameRef.current) {
                        immediateUxState.width = selfNameRef.current.clientWidth
                        immediateUxState.height = selfNameRef.current.clientHeight

                        setWindowHeight(selfNameRef.current.clientHeight)

                        /* Request focus if the game is not blocked */
                        if (!showMenu) {
                            selfNameRef.current.focus()
                        }
                    }

                    /* Center the view on the headquarter on the first update */
                    const headquarter = getHeadquarterForPlayer(selfPlayerId)

                    if (headquarter) {
                        goToHouse(headquarter.id)
                    }
                })
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

    // Functions
    const nextWindowId = useCallback(() => {
        nextWindowIdContainer.nextWindowId += 1

        return nextWindowIdContainer.nextWindowId - 1
    }, [nextWindowIdContainer])

    const openSingletonWindow = useCallback((window: WindowType) => {
        setWindows(prevWindows => [
            ...prevWindows.filter(w => w.type !== window.type),
            {
                ...window,
                id: nextWindowId()
            }])
    }, [])

    const openWindow = useCallback((window: WindowType) => {
        setWindows(windows => [
            ...windows,
            {
                ...window,
                id: nextWindowId()
            }])
    }, [])

    const closeWindow = useCallback((id: number) => {
        setWindows(windows => windows.filter(w => w.id !== id))
    }, [])

    const closeActiveWindow = useCallback(() => setWindows(windows => windows.slice(0, -2)), [])

    const raiseWindow = useCallback((id: number) => {
        setWindows(prevWindows => {
            const window = prevWindows.find(w => w.id === id)

            const remaining = prevWindows.filter(w => w.id !== id)

            return window !== undefined ? [...remaining, window] : remaining
        })
    }, [])

    const goToHouse = useCallback((houseId: HouseId) => {
        console.info("Go to house immediately: " + houseId)

        const house = api.houses.get(houseId)

        if (house) {
            goToPoint({ x: house.x, y: house.y })

            setSelected({ x: house.x, y: house.y })
        }
    }, [])

    const scrollToHouse = useCallback((houseId: HouseId) => {
        console.info("Go to house: " + houseId)

        const house = api.houses.get(houseId)

        if (house) {
            scrollToPoint({ x: house.x, y: house.y })

            setSelected({ x: house.x, y: house.y })
        }
    }, [])

    const setNewTranslatedAnimated = useCallback((newTranslateX: number, newTranslateY: number) => {
        animator.animateSeveral('TRANSLATE', (newTranslate) => {
            immediateUxState.translate = {
                x: newTranslate[0],
                y: newTranslate[1]
            }
        },
            [immediateUxState.translate.x, immediateUxState.translate.y],
            [newTranslateX, newTranslateY])
    }, [])

    const goToPoint = useCallback((point: Point) => {
        const scaleY = immediateUxState.scale

        const newTranslateX = (immediateUxState.width / 2) - point.x * immediateUxState.scale
        const newTranslateY = (immediateUxState.height / 2) + point.y * scaleY - immediateUxState.height

        immediateUxState.translate = {
            x: newTranslateX,
            y: newTranslateY
        }
    }, [])

    const scrollToPoint = useCallback((point: Point) => {
        if (animateMapScrolling) {
            const scaleY = immediateUxState.scale

            const newTranslateX = (immediateUxState.width / 2) - point.x * immediateUxState.scale
            const newTranslateY = (immediateUxState.height / 2) + point.y * scaleY - immediateUxState.height

            setNewTranslatedAnimated(newTranslateX, newTranslateY)
        } else {
            goToPoint(point)
        }
    }, [animateMapScrolling])

    const moveGame = useCallback((newTranslateX: number, newTranslateY: number) => {
        if (animateMapScrolling) {
            setNewTranslatedAnimated(newTranslateX, newTranslateY)
        } else {
            immediateUxState.translate = { x: newTranslateX, y: newTranslateY }
        }
    }, [animateMapScrolling])

    const zoom = useCallback((newScale: number) => {
        newScale = Math.min(newScale, MAX_SCALE)
        newScale = Math.max(newScale, MIN_SCALE)

        if (animateZoom) {
            animator.animate('ZOOM', (newScale) => {
                immediateUxState.translate = calcZoom(
                    immediateUxState.width,
                    immediateUxState.height,
                    immediateUxState.translate,
                    immediateUxState.scale,
                    newScale)
                immediateUxState.scale = newScale
            },
                immediateUxState.scale,
                newScale)
        } else {
            immediateUxState.translate = calcZoom(
                immediateUxState.width,
                immediateUxState.height,
                immediateUxState.translate,
                immediateUxState.scale,
                newScale)
            immediateUxState.scale = newScale
        }
    }, [animateZoom])

    const onMouseDown = useCallback((event: React.MouseEvent) => {
        if (event.button === 2) {
            immediateUxState.mouseDown = true
            immediateUxState.mouseDownX = event.pageX
            immediateUxState.mouseDownY = event.pageY
            immediateUxState.mouseMoving = false

            immediateUxState.translateXAtMouseDown = immediateUxState.translate.x
            immediateUxState.translateYAtMouseDown = immediateUxState.translate.y

            setCursor('DRAGGING')
        } else if (event.button === 0 && newRoad !== undefined) {
            setCursor('BUILDING_ROAD_PRESSED')
        }

        event.stopPropagation()
    }, [])

    const onMouseMove = useCallback((event: React.MouseEvent) => {
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
    }, [])

    const onMouseUp = useCallback((event: React.MouseEvent) => {
        if (immediateUxState.mouseMoving) {
            immediateUxState.mouseDown = false
            immediateUxState.mouseMoving = false

            setCursor('NOTHING')
        }

        if (newRoad !== undefined) {
            setCursor('BUILDING_ROAD')
        }

        event.stopPropagation()
    }, [])

    // eslint-disable-next-line
    const onMouseLeave = useCallback((_event: React.MouseEvent) => {
        setCursor('NOTHING')

        immediateUxState.mouseDown = false
        immediateUxState.mouseMoving = false
    }, [])

    const onPointClicked = useCallback(async (point: Point) => {
        console.info("Clicked point: " + point.x + ", " + point.y)

        /* Filter clicks that are really the end of moving the mouse */
        if (immediateUxState.mouseMoving) {
            return
        }

        /* A road is being built */
        if (newRoad && possibleRoadConnections) {
            const recent = newRoad[newRoad.length - 1]

            /* Create the possible new road including the addition */
            const possibleNewRoad = newRoad

            /* Handle the case where one of the directly adjacent possible new road connections is selected */
            if (possibleRoadConnections?.find(e => e.x === point.x && e.y === point.y)) {
                possibleNewRoad.push(point)

                /* Handle the case where a point further away was clicked */
            } else {

                /* Get the possible road from the current point to the clicked point. Make sure to avoid the ongoing planned road */
                // TODO: move to ws API
                const possibleNewRoadSegment = (await api.findPossibleNewRoad(recent, point, newRoad)).possibleRoad

                if (possibleNewRoadSegment) {
                    possibleNewRoad.push(...possibleNewRoadSegment.slice(1))
                } else {

                    /* Ignore the click if no possible road is available */
                    console.log("Not possible to include in road. Ignoring.")

                    return
                }
            }

            console.log("Ongoing road construction: " + JSON.stringify(possibleNewRoad))

            /* Handle the case when a flag is clicked and create a road to it. Also select the point of the flag */
            const flag = api.getFlagAtPointLocal(point)

            if (flag) {
                console.info("Placing road directly to flag")

                // Do this first to make the UI feel quicker
                setNewRoad(undefined)
                setSelected(point)

                // Create the road, including making an optimistic change first on the client side
                api.placeRoad(possibleNewRoad)

                /* Handle the case when a piece of road is clicked but there is no flag on it. Create the road */
            } else if (isRoadAtPoint(point, api.roads)) {
                console.info('Placing flag for road')

                if (api.isAvailable(point, 'FLAG')) {

                    // Start with changing the UI state to make the user experience feel quicker
                    setNewRoad(undefined)

                    api.placeRoadWithFlag(point, possibleNewRoad)
                }

                /* Add the new possible road points to the ongoing road and don't create the road */
            } else if (recent.x !== point.x || recent.y !== point.y) {
                console.info("Continuing road building with extended road segment")

                /* Get the available connections from the added point */
                const pointInformation = await api.getInformationOnPoint(point)

                console.log("Possible new road direct adjacent road connections: " + JSON.stringify(pointInformation.possibleRoadConnections))

                setNewRoad(possibleNewRoad)
                setPossibleRoadConnections(pointInformation.possibleRoadConnections)
            }

            /* Select the point */
        } else {
            console.info("Selecting point: " + point.x + ", " + point.y)

            setSelected(point)
        }
    }, [newRoad, possibleRoadConnections])

    const onPointDoubleClicked = useCallback(async (point: Point) => {
        console.info("Double click on " + point.x + ", " + point.y)

        /* First, handle double clicks differently if a new road is being created */
        if (newRoad) {
            console.log("New road exists")

            if (api.isAvailable(point, 'FLAG')) {
                console.log("Can place flag")

                // Keep a reference to the new road so it doesn't get lost when the state is changed
                const newRoadPoints = newRoad
                const lastPoint = newRoad[newRoad.length - 1]

                // Only add this point to the road points if the distance is acceptable - otherwise let the backend fill in
                if (Math.abs(lastPoint.x - point.x) <= 2 && Math.abs(lastPoint.y - point.y) <= 2) {
                    newRoadPoints.push(point)
                }

                // Update the state before calling the backend to make the user experience feel quicker
                setNewRoad(undefined)
                setSelected(point)

                // Call the backend to make the changes take effect
                api.placeRoadWithFlag(point, newRoadPoints)

                console.info("Created flag and road")
            } else {
                console.log("Could not place flag")
            }

            return
        }

        /* Show 'no action' window if the point is not discovered */
        if (!api.discoveredPoints.has(point)) {
            openWindow({ type: 'NO_ACTION', point })

            return
        }

        /* Handle click on house */
        const house = api.getHouseAtPointLocal(point)

        if (house) {
            console.info("Clicked house " + JSON.stringify(house))

            /* Show friendly house info for own house */
            console.info("Friendly house")

            openWindow({ type: 'HOUSE', house })

            setShowMenu(false)

            return
        }

        /* Handle the case where a flag was double clicked */
        const flag = api.getFlagAtPointLocal(point)

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
        const pointInformation = await api.getInformationOnPoint(point)

        /* Create a flag if it is the only possible construction */
        if (pointInformation.canBuild.length === 1 && pointInformation.canBuild[0] === 'flag') {
            api.placeFlag(pointInformation)

            setSelected(point)
        }

        else if (pointInformation.is === "road" && pointInformation.roadId) {
            openWindow({ type: 'ROAD_INFO', roadId: pointInformation.roadId })
        }

        /* Open the window to construct houses/flags/roads */
        else if (pointInformation.canBuild && pointInformation.canBuild.length !== 0) {
            openWindow({ type: 'CONSTRUCTION_WINDOW', pointInformation: pointInformation })
        } else {
            openWindow({ type: 'NO_ACTION', point })
        }
    }, [newRoad])

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === "Escape") {

            // Close the active menu (if there is an active menu)
            if (windows.length > 0) {
                closeActiveWindow()

                // Stop building a new road
            } else if (newRoad || possibleRoadConnections) {
                setNewRoad(undefined)
                setPossibleRoadConnections(undefined)

                api.removeLocalRoad("LOCAL")

                // Otherwise, send the escape to the type controller
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
    }, [windows, newRoad])

    const startNewRoad = useCallback(async (point: Point) => {

        /* Start the list of points in the new road with the clicked point */
        console.info("Start new road construction at: " + JSON.stringify({ x: point.x, y: point.y }))

        /* Get the possible connections from the server and draw them */
        const pointInformation = await api.getInformationOnPoint(point)

        setNewRoad([{ x: point.x, y: point.y }])
        setPossibleRoadConnections(pointInformation.possibleRoadConnections)
    }, [])

    const copyTouch = useCallback((touch: React.Touch) => {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY }
    }, [])

    const onTouchStart = useCallback((event: React.TouchEvent) => {
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
    }, [ongoingTouches])

    const onTouchMove = useCallback((event: React.TouchEvent) => {
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
    }, [ongoingTouches])

    const onWheel = useCallback((event: React.WheelEvent) => {
        zoom(immediateUxState.scale - event.deltaY / 20.0)
    }, [])

    const onTouchCancel = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        console.log("touchcancel.")

        /* Stop moving */
        immediateUxState.touchMoveOngoing = false

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)
        }
    }, [ongoingTouches])

    const onTouchEnd = useCallback((event: React.TouchEvent) => {
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
    }, [ongoingTouches])

    // Render
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
                screenHeight={windowHeight}
                onKeyDown={onKeyDown}
                onPointClicked={(point: Point) => onPointClicked(point)}
                selectedPoint={selected}
                onDoubleClick={(point: Point) => onPointDoubleClicked(point)}
                showHouseTitles={showTitles}
                newRoad={newRoad}
                possibleRoadConnections={possibleRoadConnections}
                showAvailableConstruction={showAvailableConstruction}
                cursor={cursor}
                heightAdjust={heightAdjust}
            />

            <MenuButton onMenuButtonClicked={() => setShowMenu(true)} />

            <GameMenu
                onChangedZoom={newScale => zoom(newScale)}
                minZoom={MIN_SCALE}
                maxZoom={MAX_SCALE}
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
                onSetMusicVolume={(newVolume: number) => animator.animate(
                    'MUSIC_VOLUME',
                    volume => setMusicVolume(volume),
                    musicVolume,
                    newVolume,
                    0.05
                )}
                onSetSoundEffectsVolume={(newVolume: number) => animator.animate(
                    'EFFECTS_VOLUME',
                    volume => sfx.setSoundEffectsVolume(volume),
                    musicVolume,
                    newVolume,
                    0.05
                )}
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
                            onStartMonitor={(point: Point) => openWindow({ type: 'FOLLOW', point })}
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
                        />
                    case 'ROAD_INFO':
                        return <RoadInfo
                            key={window.id}
                            roadId={window.roadId}
                            onStartMonitor={(point: Point) => openWindow({ type: 'FOLLOW', point })}
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
                    case 'FOLLOW':
                        return <Follow
                            point={window.point}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            key={window.id}
                            heightAdjust={heightAdjust}
                        />
                    case 'NO_ACTION':
                        return <NoActionWindow
                            point={window.point}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            key={window.id}
                            areHouseTitlesVisible={showTitles}
                            isAvailableConstructionVisible={showAvailableConstruction}
                            onShowTitles={() => setShowTitles(true)}
                            onHideTitles={() => setShowTitles(false)}
                            onShowAvailableConstruction={() => setShowAvailableConstruction(true)}
                            onHideAvailableConstruction={() => setShowAvailableConstruction(false)}
                            onStartMonitor={(point: Point) => openWindow({ type: 'FOLLOW', point })} />
                }
            })}

            {showTypingController &&
                <TypeControl commands={commands} selectedPoint={selected} />
            }

            <GameMessagesViewer
                nation={player?.nation ?? 'ROMANS'}
                onGoToHouse={(houseId: HouseId) => scrollToHouse(houseId)}
                onGoToPoint={(point: Point) => scrollToPoint(point)}
            />

            <ExpandChatBox playerId={selfPlayerId} roomId={`game-${gameId}`} />

            {showMusicPlayer &&
                <MusicPlayer volume={musicVolume} />
            }

            {gameState === 'PAUSED' &&
                <PauseSign />
            }

            {gameState === 'EXPIRED' &&
                <Expired />
            }
        </div>
    )
}

export default Play
