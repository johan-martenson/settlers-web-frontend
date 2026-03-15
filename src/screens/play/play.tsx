import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './play.css'
import { ConstructionInfo } from '../../windows/construction/construction_info'
import FriendlyFlagInfo from '../../windows/flag/friendly_flag_info'
import GameMenu from './game_menu'
import GameMessagesViewer from './game_messages_viewer'
import { CursorState, GameCanvas } from '../../render/game_render'
import Guide from '../../windows/help/guide'
import MenuButton from './menu_button'
import { GameListener, api } from '../../api/ws-api'
import MusicPlayer from '../../sound/music_player'
import Statistics from '../../windows/statistics/statistics'
import { printVariables } from '../../utils/stats/stats'
import { SetTransportPriority } from '../../windows/transport_priority/transport_priority'
import { TypeControl, Command, dispatchInputKey } from './type_control'
import { isRoadAtPoint } from '../../utils/utils'
import { HouseInformation, FlagInformation, PlayerId, GameId, Point, PointInformation, SMALL_HOUSES, MEDIUM_HOUSES, LARGE_HOUSES, HouseId, PlayerInformation, GameState, RoadId } from '../../api/types'
import { Dismiss24Filled, CalendarAgenda24Regular, TopSpeed24Filled, AddCircle24Regular, PauseFilled } from '@fluentui/react-icons'
import { FlagIcon, HouseIcon, UiIcon } from '../../icons/icon'
import { HouseInfo } from '../../windows/house/house_info'
import { sfx } from '../../sound/sound_effects'
import { Quotas } from '../../windows/quotas/quotas'
import { animator } from '../../utils/animator'
import { RoadInfo } from '../../windows/road/road-info'
import { Debug } from '../../windows/debug/debug'
import { Follow } from '../../windows/monitor/follow'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE } from '../../render/constants'
import { ButtonRow } from '../../components/dialog'
import { Button } from '@fluentui/react-components'
import { NoActionWindow } from '../../windows/no_action/no_action_window'
import { ExpandChatBox } from '../../components/chat/chat'
import { canBeUpgraded, getHeadquarterForPlayer, removeHouseOrFlagOrRoadAtPoint } from '../../api/utils'
import { calcTranslation } from '../../render/utils'
import Tools from '../../windows/tools/tools'
import { MapView } from '../../windows/map/map'
import { useNonTriggeringState } from '../../utils/hooks/non_triggering'
import { usePlayer } from '../../utils/hooks/hooks'

// Types
type HouseWindow = {
    type: 'HOUSE'
    house: HouseInformation
}

type ToolsWindow = {
    type: 'TOOLS'
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

type MapWindow = {
    type: 'MAP'
}

type WindowType =
    | HouseWindow
    | FlagWindow
    | ConstructionWindow
    | StatisticsWindow
    | GuideWindow
    | DebugWindow
    | QuotaWindow
    | RoadWindow
    | TransportPriorityWindow
    | FollowWindow
    | ToolsWindow
    | NoActionWindow
    | MapWindow

type Window = { id: number } & WindowType

type StoredTouch = {
    identifier: number
    pageX: number
    pageY: number
}

type PlayProps = {
    selfPlayerId: PlayerId
    gameId: GameId

    onLeaveGame: () => void
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


// Configuration
export const playConfigurationDebug = {
    events: false,
    effects: false
}

export const PlayLogConfig = {
    lifecycle: true,        // mounting, effects, start/stop listeners
    connection: true,       // connecting, following game state
    commands: true,         // command setup, typing commands
    camera: true,           // centering, view control
    roads: true,            // road building, placement logic
    flags: true,            // flag placement & interaction
    houses: true,           // house interaction
    selection: true,        // point / object selection
    input: true,            // mouse, touch, click, double-click
    touch: false,           // verbose touch-move diagnostics
    sound: true,            // sound effects lifecycle
    windows: true,          // opening UI windows
    data: false,            // raw data dumps (JSON.stringify)
    errors: true,           // error situations
    ...(JSON.parse(localStorage.getItem('config.play.log') ?? '{}'))  // override log settings from local storage if it exists
}

// State
function makeDefaultImmediateState() {
    return {
        mouseDown: false,
        mouseDownAt: { x: 0, y: 0 },
        mouseMoving: false,
        touchMoveOngoing: false,
        touchIdentifier: 0,
        translateAtMouseDown: { x: 0, y: 0 },
        screenSize: { width: 0, height: 0 },
        translate: { x: 0, y: 0 },
        scale: DEFAULT_SCALE
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
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            fontSize: '5rem',
            color: 'white',
            height: 'auto',
            lineHeight: '8rem',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: 'black', borderRadius: '5px'
            }}>
                The game is paused
            </div>
        </div>
    )
}

const Play = ({ gameId, selfPlayerId, onLeaveGame }: PlayProps) => {

    // References
    const selfContainerRef = useRef<HTMLDivElement | null>(null)
    const immediateStateRef = useRef(makeDefaultImmediateState())

    // State (that triggers re-renders)
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
    const [fogOfWar, setFogOfWar] = useState<boolean>(true)

    // Monitoring
    const player = usePlayer(selfPlayerId)

    // State (that doesn't trigger re-renders)
    const ongoingTouches = useNonTriggeringState<Map<number, StoredTouch>>(new Map<number, StoredTouch>())
    const nextWindowIdContainer = useNonTriggeringState<{ nextWindowId: number }>({ nextWindowId: 0 })

    // Constants
    const gameMonitorCallbacks = useMemo<GameListener>(() => ({
        onMonitoringStarted: () => {
            setMonitoringReady(true)
            if (PlayLogConfig.lifecycle) {
                console.log('Play (lifecycle): Monitoring started')
            }
        },
        onGameStateChanged: (gameState: GameState) => setGameState(gameState)
    }), [])

    // Effects
    useEffect(() => {
        if (PlayLogConfig.lifecycle) {
            console.log(`Play (lifecycle): show menu. Show menu: ${showMenu}`)
        }
        if (!showMenu) {
            selfContainerRef?.current?.focus()
        }
    }, [showMenu])

    useEffect(() => {
        if (PlayLogConfig.lifecycle) {
            console.log(`Play (lifecycle): new road. New road: ${JSON.stringify(newRoad)}`)
        }
        setCursor(newRoad === undefined ? 'NOTHING' : 'BUILDING_ROAD')
    }, [newRoad])

    useEffect(() => {
        let cancelled = false

        if (PlayLogConfig.lifecycle) {
            console.log(`Play (lifecycle): gameId or playerId changed. GameId: ${gameId}, PlayerId: ${selfPlayerId}`)
        }

        async function connectAndFollow(gameId: GameId, selfPlayerId: PlayerId): Promise<void> {
            await api.connectAndWaitForConnection()

            if (cancelled) {
                return
            }

            api.addGameStateListener(gameMonitorCallbacks)
            await api.followGame(gameId, selfPlayerId)
        }

        if (PlayLogConfig.connection) {
            console.log(`Play (connection): Start listening to game with gameId ${gameId} and playerId ${selfPlayerId}`)
        }

        connectAndFollow(gameId, selfPlayerId)

        return () => {
            cancelled = true

            if (PlayLogConfig.connection) {
                console.log('Play (connection): Stop listening to game')
            }

            api.removeGameStateListener(gameMonitorCallbacks)
            api.stopFollowingGame()
        }
    }, [gameId, selfPlayerId])

    useEffect(() => {
        if (PlayLogConfig.lifecycle) {
            console.log('Play (lifecycle): start event and window resize listeners')
        }

        function nopEventListener(event: MouseEvent): void {
            event.preventDefault()
        }

        function windowResizeListener(): void {
            if (selfContainerRef.current) {
                immediateStateRef.current.screenSize = {
                    width: selfContainerRef.current.clientWidth,
                    height: selfContainerRef.current.clientHeight
                }
            }
        }

        document.addEventListener('contextmenu', nopEventListener, false)
        window.addEventListener('resize', windowResizeListener)

        return () => {
            if (PlayLogConfig.lifecycle) {
                console.log('Play (lifecycle): Removing event and window resize listeners')
            }

            document.removeEventListener('contextmenu', nopEventListener)
            window.removeEventListener('resize', windowResizeListener)
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        if (PlayLogConfig.commands) {
            console.log('Play (commands): set commands, center on headquarters')
        }

        function setTypingCommands(): void {
            if (PlayLogConfig.commands) {
                console.log('Play (commands): Set commands')
            }

            const player = api.players.get(selfPlayerId)
            const nation = player?.nation ?? 'VIKINGS'
            const color = player?.color ?? 'GREEN'

            // TODO: memoize commands
            const commands = new Map<string, Command>()

            SMALL_HOUSES.forEach(building => commands.set(building, {
                action: (point: Point) => api.placeHouse(building, point),
                filter: (pointInformation: PointInformation) => pointInformation.canBuild.includes('SMALL'),
                icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
            }))
            MEDIUM_HOUSES.forEach(building => commands.set(building, {
                action: (point: Point) => api.placeHouse(building, point),
                filter: (pointInformation: PointInformation) => pointInformation.canBuild.includes('MEDIUM'),
                icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
            }))
            LARGE_HOUSES.forEach(building => building !== 'Headquarter' && commands.set(building, {
                action: (point: Point) => api.placeHouse(building, point),
                filter: (pointInformation: PointInformation) => pointInformation.canBuild.includes('LARGE'),
                icon: <HouseIcon houseType={building} nation={nation} scale={0.5} />
            }))

            commands.set('Kill websocket', {
                action: () => api.killWebsocket(),
                hidden: true,
                icon: <Dismiss24Filled />
            })

            commands.set('Road', {
                action: async (point: Point) => {
                    if (PlayLogConfig.roads) {
                        console.log('Play (roads): Building road')
                    }

                    const pointDownRight = { x: point.x + 1, y: point.y - 1 }
                    const pointInformations = await api.getInformationOnPoints([point, pointDownRight])

                    const pointInformation = pointInformations.get(point)
                    const pointDownRightInformation = pointInformations.get(pointDownRight)

                    if (pointInformation === undefined) {
                        console.error(`Failed to get point information: ${point}!`)
                        return
                    }

                    // If a house is selected, start the road from the flag
                    if (pointInformation.is === 'BUILDING' && pointDownRightInformation !== undefined) {
                        setNewRoad([pointDownRight])
                        setPossibleRoadConnections(pointDownRightInformation.possibleRoadConnections)
                    } else if (pointInformation.is === 'FLAG') {
                        setNewRoad([point])
                        setPossibleRoadConnections(pointInformation.possibleRoadConnections)
                    }
                },
                filter: (pointInformation: PointInformation) => pointInformation.is === 'BUILDING' || pointInformation.is === 'FLAG',
                icon: <UiIcon type='LIGHT_ROAD_IN_NATURE' scale={0.5} />
            })

            commands.set('Flag', {
                action: (point: Point) => api.placeFlag(point),
                filter: (pointInformation: PointInformation) => pointInformation.canBuild.includes('FLAG'),
                icon: <FlagIcon nation={nation} type='NORMAL' animate scale={0.7} color={color} />
            })
            commands.set('Remove (house, flag, or road)', {
                action: (point: Point) => removeHouseOrFlagOrRoadAtPoint(point),
                filter: (pointInformation: PointInformation) => (pointInformation.is === 'BUILDING' &&
                    api.houses.get(pointInformation?.buildingId)?.type !== 'Headquarter') ||
                    (pointInformation.is === 'FLAG' && api.flags.get(pointInformation.flagId)?.playerId === selfPlayerId) ||
                    (pointInformation.is === 'ROAD' && api.roads.get(pointInformation.roadId)?.playerId === selfPlayerId),
            })
            commands.set('Statistics', { action: () => openSingletonWindow({ type: 'STATISTICS' }) })
            commands.set('Titles', {
                action: () => setShowTitles(prev => !prev),
                icon: <UiIcon type='PLUS_AVAILABLE_SMALL_BUILDING_WITH_TITLES' scale={0.5} />
            })
            commands.set('Available construction', {
                action: () => setShowAvailableConstruction(prev => !prev),
            })
            commands.set('Geologist', {
                action: (point: Point) => api.callGeologist(point),
                filter: (pointInformation: PointInformation) => pointInformation.is === 'FLAG'
            })
            commands.set('Scout', {
                action: (point: Point) => api.callScout(point),
                filter: (pointInformation: PointInformation) => pointInformation.is === 'FLAG'
            })
            commands.set('Evacuate building', {
                action: (point: Point) => {
                    const house = api.houseAt(point)

                    if (house !== undefined) {
                        api.evacuateHouse(house.id)
                    }
                },
                filter: (pointInformation: PointInformation) => pointInformation.is === 'BUILDING',
                icon: <UiIcon type='SEND_OUT_ARROWS' scale={0.5} />
            })
            commands.set('Transport priority', {
                action: () => openSingletonWindow({ type: 'TRANSPORT_PRIORITY' }),
                icon: <UiIcon type='TRANSPORT_PRIORITY' scale={0.5} />
            })
            commands.set('List statistics', { action: () => printVariables() })
            commands.set('Upgrade', {
                action: (point: Point) => {
                    const houseInformation = api.getHouseAtPointLocal(point)

                    if (houseInformation && canBeUpgraded(houseInformation)) {
                        api.upgradeHouse(houseInformation.id)
                    }
                },
                filter: (pointInformation: PointInformation) => {
                    if (pointInformation.is !== 'BUILDING' || pointInformation.buildingId === undefined) {
                        return false
                    }

                    const houseInformation = api.houses.get(pointInformation.buildingId)
                    return houseInformation !== undefined
                        && ['Barracks', 'GuardHouse', 'WatchTower'].includes(houseInformation.type)
                        && ['OCCUPIED', 'UNOCCUPIED'].includes(houseInformation.state)
                },
                icon: <AddCircle24Regular />
            })
            commands.set('Fps', {
                action: () => setShowFpsCounter(!showFpsCounter),
                hidden: true,
                icon: <TopSpeed24Filled />
            })
            commands.set('Menu', {
                action: () => setShowMenu(true),
                icon: <CalendarAgenda24Regular />
            })
            commands.set('Quotas', { action: () => openSingletonWindow({ type: 'QUOTA' }) })
            commands.set('Pause game', {
                action: () => api.pauseGame(gameId),
                icon: <PauseFilled />
            })
            commands.set('Resume game', {
                action: () => api.resumeGame(gameId),
                icon: <UiIcon type='RIGHT_ARROW' scale={0.5} />
            })
            commands.set('Debug', {
                action: () => openSingletonWindow({ type: 'DEBUG' }),
                hidden: true,
                icon: <UiIcon type='SPRAY_CAN' scale={0.5} />
            })
            commands.set('Follow', {
                action: (point: Point) => openWindow({ type: 'FOLLOW', point }),
                icon: <UiIcon type='FILM_CAMERA' scale={0.5} />
            })
            commands.set('Tools', {
                action: () => openSingletonWindow({ type: 'TOOLS' }),
                icon: <UiIcon type='TOOLS_WITH_QUESTION_MARK' scale={0.5} />
            })
            commands.set('Map', {
                action: () => openWindow({ type: 'MAP' }),
                icon: <UiIcon type='GLOBE_WITH_MAGNIFYING_GLASS' scale={0.5} />
            })
            commands.set('GiveMeSomeMore', {
                action: () => api.cheat('GIVE_ME_SOME_MORE'),
                hidden: true
            })
            commands.set('ShowMeTheWorld', {
                action: () => api.cheat('SHOW_ME_THE_WORLD'),
                hidden: true
            })
            commands.set('Fog of war', {
                action: () => setFogOfWar(prev => !prev),
                hidden: true
            })

            setCommands(commands)
        }

        api.waitForGameDataAvailable()
            .then(() => {
                if (cancelled) {
                    return
                }

                setTypingCommands()

                if (selfContainerRef.current) {
                    immediateStateRef.current.screenSize = {
                        width: selfContainerRef.current.clientWidth,
                        height: selfContainerRef.current.clientHeight
                    }
                }

                // Center the view on the headquarter on the first update
                if (PlayLogConfig.camera) {
                    console.log('Play (camera): Center on headquarters')
                }

                const headquarter = getHeadquarterForPlayer(selfPlayerId)
                if (headquarter) {
                    if (PlayLogConfig.camera) {
                        console.log(`Play (camera): Center on headquarters: ${JSON.stringify(headquarter)}`)
                    }

                    goToHouse(headquarter.id)
                } else {
                    console.error('Failed to find headquarter for player! Cannot center view on it!')
                }
            })
            .catch(console.error)

        return () => {
            cancelled = true
        }
    }, [monitoringReady, selfPlayerId, gameId])

    // Effect: reset if gameId changes
    useEffect(() => {
        immediateStateRef.current = makeDefaultImmediateState()
    }, [gameId])

    // Effect: sound effects lifecycle
    useEffect(() => {
        if (PlayLogConfig.sound) {
            console.log('Play (sound): start sound effects')
        }

        sfx.startEffects(immediateStateRef.current)

        return () => {
            if (PlayLogConfig.sound) {
                console.log('Play (sound): Stop sound effects')
            }

            sfx.stopEffects()
        }
    }, [])

    // Functions
    const nextWindowId = useCallback(() => {
        nextWindowIdContainer.nextWindowId += 1
        return nextWindowIdContainer.nextWindowId - 1
    }, [nextWindowIdContainer])

    const openSingletonWindow = useCallback((window: WindowType) => {
        setWindows(prevWindows => prevWindows.find(w => w.type === window.type)
            ? prevWindows
            : [...prevWindows, { ...window, id: nextWindowId() }]
        )
    }, [nextWindowId])

    const openWindow = useCallback((window: WindowType) => {
        if (PlayLogConfig.windows) {
            console.log(`Play (windows): Opening: ${JSON.stringify(window)}`)
        }


        setWindows(prevWindows => (
            prevWindows.find(w => w.type === 'HOUSE' && window.type === 'HOUSE' && w.house.id === window.house.id) ||
            prevWindows.find(w => w.type === 'FLAG' && window.type === 'FLAG' && w.flag.id === window.flag.id) ||
            prevWindows.find(w => w.type === 'ROAD_INFO' && window.type === 'ROAD_INFO' && w.roadId === window.roadId) ||
            prevWindows.find(w => w.type === 'CONSTRUCTION_WINDOW' && window.type === 'CONSTRUCTION_WINDOW' &&
                (w.pointInformation.x === window.pointInformation.x && w.pointInformation.y === window.pointInformation.y))
        )
            ? prevWindows
            : [...prevWindows, { ...window, id: nextWindowId() }])
    }, [nextWindowId])

    const closeWindow = useCallback((id: number) => {
        setWindows(prevWindows => prevWindows.filter(w => w.id !== id))
    }, [])

    const closeActiveWindow = useCallback(() => setWindows(windows => windows.slice(0, -1)), [])

    const raiseWindow = useCallback((id: number) => {
        setWindows(prevWindows => {
            const window = prevWindows.find(w => w.id === id)
            return window !== undefined ? [...prevWindows.filter(w => w.id !== id), window] : prevWindows
        })
    }, [])

    const goToHouse = useCallback((houseId: HouseId) => {
        if (PlayLogConfig.selection) {
            console.info('Play (selection): Go to house immediately: ' + houseId)
        }

        const house = api.houses.get(houseId)
        if (house) {
            goToPoint({ x: house.x, y: house.y })
            setSelected({ x: house.x, y: house.y })
        }
    }, [])

    const setNewTranslatedAnimated = useCallback((newTranslate: { x: number, y: number }) => {
        animator.animateSeveral('TRANSLATE', newTranslate => {
            immediateStateRef.current.translate = { x: newTranslate[0], y: newTranslate[1] }
        },
            [immediateStateRef.current.translate.x, immediateStateRef.current.translate.y],
            [newTranslate.x, newTranslate.y])
    }, [])

    const goToPoint = useCallback((point: Point) => {
        const scaleY = immediateStateRef.current.scale

        immediateStateRef.current.translate = {
            x: (immediateStateRef.current.screenSize.width / 2) - point.x * immediateStateRef.current.scale,
            y: (immediateStateRef.current.screenSize.height / 2) + point.y * scaleY - immediateStateRef.current.screenSize.height

        }
    }, [])

    const scrollToPoint = useCallback((point: Point) => {
        if (animateMapScrolling) {
            const scaleY = immediateStateRef.current.scale

            setNewTranslatedAnimated({
                x: (immediateStateRef.current.screenSize.width / 2) - point.x * immediateStateRef.current.scale,
                y: (immediateStateRef.current.screenSize.height / 2) + point.y * scaleY - immediateStateRef.current.screenSize.height
            })
        } else {
            goToPoint(point)
        }
    }, [animateMapScrolling, setNewTranslatedAnimated, goToPoint])

    const moveGame = useCallback((newTranslate: { x: number, y: number }) => {
        if (animateMapScrolling) {
            setNewTranslatedAnimated(newTranslate)
        } else {
            immediateStateRef.current.translate = newTranslate
        }
    }, [animateMapScrolling, setNewTranslatedAnimated])

    const zoom = useCallback((newScale: number) => {
        newScale = Math.min(newScale, MAX_SCALE)
        newScale = Math.max(newScale, MIN_SCALE)

        if (animateZoom) {
            animator.animate('ZOOM', (newScale) => {
                immediateStateRef.current.translate = calcTranslation(
                    immediateStateRef.current.scale,
                    newScale,
                    immediateStateRef.current.translate,
                    immediateStateRef.current.screenSize,
                )
                immediateStateRef.current.scale = newScale
            },
                immediateStateRef.current.scale,
                newScale)
        } else {
            immediateStateRef.current.translate = calcTranslation(
                immediateStateRef.current.scale,
                newScale,
                immediateStateRef.current.translate,
                immediateStateRef.current.screenSize
            )
            immediateStateRef.current.scale = newScale
        }
    }, [animateZoom])

    const onMouseDown = useCallback((event: React.MouseEvent) => {
        if (event.button === 2) {
            immediateStateRef.current.mouseDown = true
            immediateStateRef.current.mouseDownAt = { x: event.pageX, y: event.pageY }
            immediateStateRef.current.mouseMoving = false

            immediateStateRef.current.translateAtMouseDown = { ...immediateStateRef.current.translate }

            setCursor('DRAGGING')
        } else if (event.button === 0 && newRoad !== undefined) {
            setCursor('BUILDING_ROAD_PRESSED')
        }

        event.stopPropagation()
    }, [newRoad])

    const onMouseMove = useCallback((event: React.MouseEvent) => {
        if (immediateStateRef.current.mouseDown) {
            const deltaX = (event.pageX - immediateStateRef.current.mouseDownAt.x)
            const deltaY = (event.pageY - immediateStateRef.current.mouseDownAt.y)

            // Detect move to separate move from click
            if (deltaX ** 2 + deltaY ** 2 > 25) {
                immediateStateRef.current.mouseMoving = true
            }

            immediateStateRef.current.translate = {
                x: immediateStateRef.current.translateAtMouseDown.x + deltaX,
                y: immediateStateRef.current.translateAtMouseDown.y + deltaY
            }
        }

        event.stopPropagation()
    }, [])

    const onMouseUp = useCallback((event: React.MouseEvent) => {
        if (immediateStateRef.current.mouseMoving) {
            immediateStateRef.current.mouseDown = false
            immediateStateRef.current.mouseMoving = false

            setCursor('NOTHING')
        }

        if (newRoad !== undefined) {
            setCursor('BUILDING_ROAD')
        }

        event.stopPropagation()
    }, [newRoad])

    // eslint-disable-next-line
    const onMouseLeave = useCallback((_event: React.MouseEvent) => {
        setCursor('NOTHING')

        immediateStateRef.current.mouseDown = false
        immediateStateRef.current.mouseMoving = false
    }, [])

    const onPointClicked = useCallback(async (point: Point) => {
        if (PlayLogConfig.selection) {
            console.info(`Play (selection): Clicked point: ${point.x}, ${point.y}`)
        }

        // Filter clicks that are really the end of moving the mouse
        if (immediateStateRef.current.mouseMoving) {
            return
        }

        // A road is being built
        if (newRoad && possibleRoadConnections) {
            const recent = newRoad[newRoad.length - 1]
            const possibleNewRoad = [...newRoad]

            // Handle the case where one of the directly adjacent possible new road connections is selected
            if (possibleRoadConnections?.find(e => e.x === point.x && e.y === point.y)) {
                possibleNewRoad.push(point)

                // Handle the case where a point further away was clicked
            } else {

                // Get the possible road from the current point to the clicked point. Make sure to avoid the ongoing planned road
                const possibleNewRoadSegment = (await api.findPossibleNewRoad(recent, point, newRoad)).possibleRoad

                if (possibleNewRoadSegment && newRoad) {
                    possibleNewRoad.push(...possibleNewRoadSegment.slice(1))
                } else {
                    if (PlayLogConfig.roads) {
                        console.log('Play (roads): Not possible to include in road. Ignoring.')
                    }

                    return
                }
            }

            if (PlayLogConfig.roads) {
                console.log(`Play (roads): Ongoing road construction: ${JSON.stringify(possibleNewRoad)}`)
            }

            // Handle the case when a flag is clicked and create a road to it. Also select the point of the flag
            const flag = api.getFlagAtPointLocal(point)

            if (flag) {
                if (PlayLogConfig.roads) {
                    console.info('Play (roads): Placing road directly to flag')
                }

                // Do this first to make the UI feel quicker
                setNewRoad(undefined)
                setSelected(point)

                // Create the road, including making an optimistic change first on the client side
                api.placeRoad(possibleNewRoad)

                // Handle the case when a piece of road is clicked but there is no flag on it. Create the road
            } else if (isRoadAtPoint(point, api.roads)) {
                if (PlayLogConfig.roads) {
                    console.info('Play (roads): Placing flag for road')
                }

                if (api.isAvailable(point, 'FLAG')) {

                    // Start with changing the UI state to make the user experience feel quicker
                    setNewRoad(undefined)

                    api.placeRoadWithFlag(point, possibleNewRoad)
                }

                // Add the new possible road points to the ongoing road and don't create the road
            } else if (recent.x !== point.x || recent.y !== point.y) {
                if (PlayLogConfig.roads) {
                    console.info('Play (roads): Continuing road building with extended road segment')
                }

                // Get the available connections from the added point
                const pointInformation = await api.getInformationOnPoint(point)

                if (PlayLogConfig.roads) {
                    console.log(`Play (roads): Possible new road direct adjacent road connections: ${JSON.stringify(pointInformation.possibleRoadConnections)}`)
                }

                if (pointInformation !== undefined) {
                    setNewRoad(possibleNewRoad)
                    setPossibleRoadConnections(pointInformation.possibleRoadConnections)
                }
            }

            // Select the point
        } else {
            if (PlayLogConfig.selection) {
                console.info(`Play (selection): Selecting point: ${point.x}, ${point.y}`)
            }

            setSelected(point)
        }
    }, [newRoad, possibleRoadConnections])

    const onPointDoubleClicked = useCallback(async (point: Point) => {
        if (PlayLogConfig.input) {
            console.info(`Play (input): Double click on ${point.x}, ${point.y}`)
        }

        // First, handle double clicks differently if a new road is being created
        if (newRoad) {
            if (PlayLogConfig.roads) {
                console.log('Play (roads): New road exists')
            }

            if (api.isAvailable(point, 'FLAG')) {
                if (PlayLogConfig.flags) {
                    console.log('Play (flags): Can place flag')
                }

                // Keep a reference to the new road so it doesn't get lost when the state is changed
                const newRoadPoints = [...newRoad]
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

                if (PlayLogConfig.flags) {
                    console.info('Play (flags): Created flag and road')
                }
            } else {
                console.log('Could not place flag')
            }

            return
        }

        // Show 'no action' window if the point is not discovered
        if (!api.discoveredPoints.has(point)) {
            openWindow({ type: 'NO_ACTION', point })

            return
        }

        // Handle click on house
        const house = api.getHouseAtPointLocal(point)
        if (PlayLogConfig.houses) {
            console.log(`Play (houses): House on local: ${JSON.stringify(house)}`)
        }

        if (house) {
            if (PlayLogConfig.houses) {
                console.info(`Play (houses): Clicked house: ${JSON.stringify(house)}`)
            }


            openWindow({ type: 'HOUSE', house })
            setShowMenu(false)

            return
        }

        // Handle the case where a flag was double clicked
        const flag = api.getFlagAtPointLocal(point)
        if (PlayLogConfig.flags) {
            console.log(`Play (flags): Flag on local: ${JSON.stringify(flag)}`)
        }

        if (flag) {
            if (PlayLogConfig.flags) {
                console.info('Play (flags): Clicked flag')
            }

            if (flag.playerId === selfPlayerId) {
                if (PlayLogConfig.flags) {
                    console.info('Play (flags): Friendly flag')
                }

                openWindow({ type: 'FLAG', flag })
            }

            return
        }

        // Ask the server for what can be done on the spot
        const pointInformation = await api.getInformationOnPoint(point)
        if (PlayLogConfig.data) {
            console.log(`Play (data): Point information: ${JSON.stringify(pointInformation)}`)
        }

        // Create a flag if it is the only possible construction
        if (pointInformation.canBuild.length === 1 && pointInformation.canBuild[0] === 'FLAG') {
            api.placeFlag(point)

            setSelected(point)
        } else if (pointInformation.is === 'ROAD') {
            openWindow({ type: 'ROAD_INFO', roadId: pointInformation.roadId })
        } else if (pointInformation.canBuild.length !== 0) {
            if (PlayLogConfig.windows) {
                console.log('Play (windows): Opening construction window')
            }

            openWindow({ type: 'CONSTRUCTION_WINDOW', pointInformation: pointInformation })
        } else {
            openWindow({ type: 'NO_ACTION', point })
        }
    }, [newRoad, selfPlayerId, setNewRoad, setSelected, setShowMenu, openWindow])

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {

            // Close the active menu (if there is an active menu)
            if (windows.length > 0) {
                closeActiveWindow()

                // Stop building a new road
            } else if (newRoad || possibleRoadConnections) {
                setNewRoad(undefined)
                setPossibleRoadConnections(undefined)

                api.removeLocalRoad('LOCAL')

                // Otherwise, send the escape to the type controller
            } else {
                dispatchInputKey({
                    key: event.key,
                    metaKey: event.metaKey,
                    altKey: event.altKey,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey
                })
            }
        } else if (event.key === ' ') {
            setShowTitles(true)
            setShowAvailableConstruction(!showAvailableConstruction)
        } else if (event.key === 'ArrowUp') {
            moveGame({ ...immediateStateRef.current.translate, y: immediateStateRef.current.translate.y + ARROW_KEY_MOVE_DISTANCE })
        } else if (event.key === 'ArrowRight') {
            moveGame({ ...immediateStateRef.current.translate, x: immediateStateRef.current.translate.x - ARROW_KEY_MOVE_DISTANCE })
        } else if (event.key === 'ArrowDown') {
            moveGame({ ...immediateStateRef.current.translate, y: immediateStateRef.current.translate.y - ARROW_KEY_MOVE_DISTANCE })
        } else if (event.key === 'ArrowLeft') {
            moveGame({ ...immediateStateRef.current.translate, x: immediateStateRef.current.translate.x + ARROW_KEY_MOVE_DISTANCE })
        } else if (event.key === '+') {
            zoom(immediateStateRef.current.scale + 1)
        } else if (event.key === '-') {
            zoom(immediateStateRef.current.scale - 1)
        } else if (event.key === 'M') {
            setShowMenu(true)
        } else {
            dispatchInputKey({
                key: event.key,
                metaKey: event.metaKey,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            })
        }

        event.preventDefault()
    }, [windows, newRoad, possibleRoadConnections, showAvailableConstruction, moveGame, zoom, setNewRoad, setPossibleRoadConnections, setShowMenu])

    const startNewRoad = useCallback(async (point: Point) => {

        // Start the list of points in the new road with the clicked point
        if (PlayLogConfig.roads) {
            console.info(`Play (roads): Start new road construction at: ${JSON.stringify({ x: point.x, y: point.y })}`)
        }

        // Get the possible connections from the server and draw them
        const pointInformation = await api.getInformationOnPoint(point)

        if (pointInformation !== undefined) {
            setNewRoad([point])
            setPossibleRoadConnections(pointInformation.possibleRoadConnections)
        }
    }, [])

    const copyTouch = useCallback((touch: React.Touch) => {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY }
    }, [])

    const onTouchStart = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        if (PlayLogConfig.touch) {
            console.log('Play (touch): touchstart')
        }

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.set(touches[i].identifier, copyTouch(touches[i]))
        }

        // Only move map with one movement
        if (!immediateStateRef.current.touchMoveOngoing) {
            const touch = touches[0]

            immediateStateRef.current.touchIdentifier = touch.identifier
            immediateStateRef.current.mouseDownAt = { x: touch.pageX, y: touch.pageY }
            immediateStateRef.current.mouseMoving = false
            immediateStateRef.current.touchMoveOngoing = true
            immediateStateRef.current.translateAtMouseDown = { ...immediateStateRef.current.translate }
        }
    }, [ongoingTouches, copyTouch])

    const onTouchMove = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier)

            if (!touch || !touch.identifier) {
                continue
            }

            if (immediateStateRef.current.touchMoveOngoing && touch.identifier === immediateStateRef.current.touchIdentifier) {
                const deltaX = (touch.pageX - immediateStateRef.current.mouseDownAt.x)
                const deltaY = (touch.pageY - immediateStateRef.current.mouseDownAt.y)

                // Detect move to separate move from click
                if (deltaX ** 2 + deltaY ** 2 > 25) {
                    immediateStateRef.current.mouseMoving = true
                }

                immediateStateRef.current.translate = {
                    x: immediateStateRef.current.translateAtMouseDown.x + deltaX,
                    y: immediateStateRef.current.translateAtMouseDown.y + deltaY
                }
            }

            // Store ongoing touches just because ...
            if (touch) {
                if (PlayLogConfig.touch) {
                    console.log('Play (touch): continuing touch ' + touch)
                    console.log('ctx.moveTo(' + touch.pageX + ', ' + touch.pageY + ')')
                    console.log('ctx.lineTo(' + touches[i].pageX + ', ' + touches[i].pageY + ')')
                }

                ongoingTouches.set(touch.identifier, touches[i])
            } else {
                console.error("can't figure out which touch to continue")
            }
        }
    }, [ongoingTouches])

    const onWheel = useCallback((event: React.WheelEvent) => {
        zoom(immediateStateRef.current.scale - event.deltaY / 20.0)
    }, [zoom])

    const onTouchCancel = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        if (PlayLogConfig.touch) {
            console.log('Play (touch): touchcancel')
        }


        // Stop moving
        immediateStateRef.current.touchMoveOngoing = false
        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)
        }
    }, [ongoingTouches])

    const onTouchEnd = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        // Stop moving
        immediateStateRef.current.touchMoveOngoing = false
        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const touch = ongoingTouches.get(touches[i].identifier)

            if (touch) {
                ongoingTouches.delete(touches[i].identifier)
            } else {
                console.error("can't figure out which touch to end")
            }
        }
    }, [ongoingTouches])

    // Render
    return (
        <div
            className='App'
            ref={selfContainerRef}
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
                onPointClicked={onPointClicked}
                selectedPoint={selected}
                onDoubleClick={onPointDoubleClicked}
                showHouseTitles={showTitles}
                newRoad={newRoad}
                possibleRoadConnections={possibleRoadConnections}
                showAvailableConstruction={showAvailableConstruction}
                cursor={cursor}
                heightAdjust={heightAdjust}
                viewRef={immediateStateRef}
                fogOfWar={fogOfWar}
            />

            <MenuButton onMenuButtonClicked={() => setShowMenu(true)} />

            <GameMenu
                onChangedZoom={zoom}
                minZoom={MIN_SCALE}
                maxZoom={MAX_SCALE}
                onSetTitlesVisible={setShowTitles}
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
                onSetMusicPlayerVisible={setShowMusicPlayer}
                onSetTypingControllerVisible={setShowTypingController}
                onSetAvailableConstructionVisible={setShowAvailableConstruction}
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
                    sfx.volume,
                    newVolume,
                    0.05
                )}
                onSetHeightAdjust={setHeightAdjust}
                onSetAnimateMapScrolling={setAnimateMapScrolling}
                onSetAnimateZooming={setAnimateZoom}
                onQuota={() => openSingletonWindow({ type: 'QUOTA' })}
                onManageToolPriorities={() => openSingletonWindow({ type: 'TOOLS' })}
                onViewMap={() => openSingletonWindow({ type: 'MAP' })}
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
                            onStartNewRoad={startNewRoad}
                            nation={(player) ? player.nation : 'ROMANS'}
                            houseTitlesVisible={showTitles}
                            availableConstructionVisible={showAvailableConstruction}
                            onShowHouseTitles={() => setShowTitles(true)}
                            onHideHouseTitles={() => setShowTitles(false)}
                            onShowAvailableConstruction={() => setShowAvailableConstruction(true)}
                            onHideAvailableConstruction={() => setShowAvailableConstruction(false)}
                            onSelectPoint={point => setSelected(point)}
                        />
                    case 'FLAG':
                        return <FriendlyFlagInfo
                            key={window.id}
                            flag={window.flag}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            onStartNewRoad={startNewRoad}
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
                            goToPoint={scrollToPoint}
                        />
                    case 'GUIDE':
                        return <Guide
                            key={window.id}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'STATISTICS':
                        return <Statistics
                            key={window.id}
                            playerId={selfPlayerId}
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
                            houseTitlesVisible={showTitles}
                            availableConstructionVisible={showAvailableConstruction}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            onShowHouseTitles={() => setShowTitles(true)}
                            onHideHouseTitles={() => setShowTitles(false)}
                            onShowAvailableConstruction={() => setShowAvailableConstruction(true)}
                            onHideAvailableConstruction={() => setShowAvailableConstruction(false)}
                            onStartMonitor={() => openWindow({ type: 'FOLLOW', point: selected })}
                        />
                    case 'DEBUG':
                        return <Debug
                            key={window.id}
                            point={selected}
                            onGoToPoint={point => goToPoint(point)}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'FOLLOW':
                        return <Follow
                            key={window.id}
                            point={window.point}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            heightAdjust={heightAdjust}
                        />
                    case 'TOOLS':
                        return <Tools
                            key={window.id}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                    case 'NO_ACTION':
                        return <NoActionWindow
                            key={window.id}
                            point={window.point}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                            areHouseTitlesVisible={showTitles}
                            isAvailableConstructionVisible={showAvailableConstruction}
                            onShowTitles={() => setShowTitles(true)}
                            onHideTitles={() => setShowTitles(false)}
                            onShowAvailableConstruction={() => setShowAvailableConstruction(true)}
                            onHideAvailableConstruction={() => setShowAvailableConstruction(false)}
                            onStartMonitor={(point: Point) => openWindow({ type: 'FOLLOW', point })}
                            onReturnToHeadquarters={() => {
                                const headquarter = getHeadquarterForPlayer(selfPlayerId)
                                if (headquarter) {
                                    scrollToPoint(headquarter)
                                    setSelected(headquarter)
                                }
                            }}
                        />
                    case 'MAP':
                        return <MapView
                            key={window.id}
                            onClose={() => closeWindow(window.id)}
                            onRaise={() => raiseWindow(window.id)}
                        />
                }
            })}

            {showTypingController &&
                <TypeControl commands={commands} selectedPoint={selected} />
            }

            <GameMessagesViewer
                nation={player?.nation ?? 'ROMANS'}
                onGoToPoint={scrollToPoint}
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
