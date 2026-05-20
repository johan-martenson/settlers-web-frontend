import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ButtonRow, WindowWithTyping } from '../../components/dialog'
import { Point, Size, WorkerId } from '../../api/types'
import { DEFAULT_SCALE, STANDARD_HEIGHT } from '../../render/constants'
import { GameCanvas, View } from '../../render/game_render'
import './follow.css'
import { Button } from '@fluentui/react-components'
import { animator } from '../../utils/animator'
import { calcTranslation } from '../../render/utils'
import { calcDistance, gamePointToScreenPointWithHeightAdjustment, screenPointToGamePointWithHeightAdjustment } from '../../utils/utils'
import { MoveUpdate, WorkerMoveListener, api } from '../../api/ws-api'
import { UiIcon } from '../../icons/icon'
import { useNonTriggeringState } from '../../utils/hooks/non_triggering'
import { GenericCommand } from '../../utils/typing_command_utils'

// Types
type FollowProps = {
    point: Point
    heightAdjust: number
    scale?: number

    onRaise: () => void
    onClose: () => void
}

type Moving = {
    moving: boolean
    mouseAt: Point
}

type PositionedEntity = {
    x: number
    y: number
    betweenPoints?: boolean
    previous?: Point
    next?: Point
    percentageTraveled?: number
}

// Constants
const MIN_SCALE = 10
const MAX_SCALE = 150

// React components
function Follow({ heightAdjust, point, scale = DEFAULT_SCALE, onRaise, onClose }: FollowProps) {

    // References
    const myRef = useRef<HTMLDivElement | null>(null)

    // State (that triggers re-renders)
    const [size, setSize] = useState<Size>('MEDIUM')
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [idToFollow, setIdToFollow] = useState<WorkerId>()

    // State that doesn't trigger re-renders
    const viewRef = useRef<View>({ scale, translate: { x: 0, y: 0 }, screenSize: { width: 100, height: 100 } })
    const moving = useNonTriggeringState<Moving>({ moving: false, mouseAt: { x: 0, y: 0 } })

    // Functions

    const findEntityPosition = useCallback((entity: {
        betweenPoints?: boolean
        previous?: Point
        next?: Point
        percentageTraveled?: number
        x: number
        y: number
    }): Point => {
        if (entity.betweenPoints && entity.previous && entity.next) {
            return {
                x: entity.previous.x + (entity.next.x - entity.previous.x) * (entity.percentageTraveled ?? 0) / 100.0,
                y: entity.previous.y + (entity.next.y - entity.previous.y) * (entity.percentageTraveled ?? 0) / 100.0
            }
        }

        return {
            x: entity.x,
            y: entity.y
        }
    }, [])

    const findClosestEntity = useCallback((
        gamePoint: Point,
        entities: Map<WorkerId, PositionedEntity>,
        currentDistance: number
    ): { id?: WorkerId, distance: number } => {
        let closestId: WorkerId | undefined
        let closestDistance = currentDistance

        for (const [id, entity] of entities) {
            const position = findEntityPosition(entity)

            if (position.x === gamePoint.x && position.y === gamePoint.y) {
                return {
                    id,
                    distance: 0
                }
            }

            const distance = calcDistance(gamePoint, position)

            if (distance < closestDistance) {
                closestDistance = distance
                closestId = id
            }
        }

        return {
            id: closestId,
            distance: closestDistance
        }
    }, [findEntityPosition])

    const centerViewOnScreenPoint = useCallback((screenPoint: Point): void => {
        viewRef.current.translate = {
            x: viewRef.current.translate.x - screenPoint.x + viewRef.current.screenSize.width / 2,
            y: viewRef.current.translate.y - screenPoint.y + viewRef.current.screenSize.height / 2
        }
    }, [])

    const zoomToScale = useCallback((newScale: number) => {
        const prevScale = viewRef.current.scale

        const clampedScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE))

        const newTranslate = calcTranslation(
            prevScale,
            clampedScale,
            viewRef.current.translate,
            viewRef.current.screenSize
        )

        animator.animateSeveralNoId(
            (values: number[]) => {
                viewRef.current.scale = values[0]
                viewRef.current.translate = {
                    x: values[1],
                    y: values[2]
                }
            },
            [
                prevScale,
                viewRef.current.translate.x,
                viewRef.current.translate.y
            ],
            [
                clampedScale,
                newTranslate.x,
                newTranslate.y
            ]
        )
    }, [])

    const centerView = useCallback((): void => {
        if (viewRef.current.screenSize.width <= 0 || viewRef.current.screenSize.height <= 0) {
            return
        }

        viewRef.current.translate = {
            x: viewRef.current.screenSize.width / 2 - point.x * viewRef.current.scale,
            y: viewRef.current.screenSize.height / 2 + point.y * viewRef.current.scale - viewRef.current.screenSize.height
        }
    }, [point])

    const goToBetweenPoints = useCallback((from: Point, to: Point, progress: number) => {
        const heightAtFrom = api.allTiles.get(from)?.height ?? 0
        const heightAtTo = api.allTiles.get(to)?.height ?? 0

        const screenPointFrom = gamePointToScreenPointWithHeightAdjustment(
            from,
            heightAtFrom,
            viewRef.current,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPointTo = gamePointToScreenPointWithHeightAdjustment(
            to,
            heightAtTo,
            viewRef.current,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPoint = {
            x: screenPointFrom.x + (screenPointTo.x - screenPointFrom.x) * (progress / 100),
            y: screenPointFrom.y + (screenPointTo.y - screenPointFrom.y) * progress / 100
        }

        centerViewOnScreenPoint(screenPoint)
    }, [heightAdjust])

    const goToPoint = useCallback((point: Point): void => {
        const heightAtPoint = api.allTiles.get(point)?.height ?? 0

        const screenPoint = gamePointToScreenPointWithHeightAdjustment(
            point,
            heightAtPoint,
            viewRef.current,
            heightAdjust,
            STANDARD_HEIGHT
        )

        centerViewOnScreenPoint(screenPoint)
    }, [heightAdjust])

    const findCenterGamePoint = useCallback((): Point => {
        const screenPoint = {
            x: viewRef.current.screenSize.width / 2,
            y: viewRef.current.screenSize.height / 2
        }

        return screenPointToGamePointWithHeightAdjustment(
            screenPoint,
            viewRef.current,
            heightAdjust
        )
    }, [heightAdjust])

    function startMonitor(gamePoint: Point): void {
        let distance = 2000
        let newIdToFollow: WorkerId | undefined

        const closestWorker = findClosestEntity(gamePoint, api.workers, distance)

        distance = closestWorker.distance
        newIdToFollow = closestWorker.id

        if (distance > 0) {
            const closestAnimal = findClosestEntity(gamePoint, api.wildAnimals, distance)

            distance = closestAnimal.distance

            if (closestAnimal.id !== undefined) {
                newIdToFollow = closestAnimal.id
            }
        }

        if (newIdToFollow !== undefined) {
            setIdToFollow(newIdToFollow)

            const worker = api.workers.get(newIdToFollow) ?? api.wildAnimals.get(newIdToFollow)

            if (worker) {
                const position = findEntityPosition(worker)

                goToPoint(position)
            }
        }
    }

    const zoomIn = useCallback(() => {
        zoomToScale(viewRef.current.scale + 10)
    }, [zoomToScale])

    const zoomOut = useCallback(() => {
        zoomToScale(viewRef.current.scale - 10)
    }, [zoomToScale])

    // Effects
    // Effect: handle following worker
    useEffect(() => {
        if (idToFollow !== undefined) {
            const moveListener: WorkerMoveListener = {
                id: idToFollow,
                onWorkerMoved: (move: MoveUpdate) => {
                    if (move.state === 'ON_POINT') {
                        //goToPoint(move.point)
                    } else if (move.state === 'BETWEEN_POINTS') {
                        goToBetweenPoints(move.previous, move.next, move.progress)
                    }
                }
            }

            api.addMovementForWorkerListener(moveListener)

            return () => api.removeMovementForWorkerListener(moveListener)
        }
    }, [idToFollow, goToBetweenPoints])


    // Effect: keep screen size synchronized with container size
    useEffect(() => {
        if (!myRef.current) {
            return
        }

        const element = myRef.current

        const updateScreenSize = (): void => {
            viewRef.current.screenSize = {
                width: element.clientWidth,
                height: element.clientHeight
            }
        }

        updateScreenSize()
        centerView()

        const resizeObserver = new ResizeObserver(() => {
            updateScreenSize()
            centerView()
        })

        resizeObserver.observe(element)

        return () => {
            resizeObserver.disconnect()
        }
    }, [centerView])

    // Effect: handle 'mouse up' for the full browser window to know when to stop moving the game view
    useEffect(() => {
        const stopMoving = (): void => {
            moving.moving = false
        }

        window.addEventListener('mouseup', stopMoving)

        return () => {
            window.removeEventListener('mouseup', stopMoving)
        }
    }, [moving])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<WorkerId | undefined>>()

        cmds.set('Zoom in', {
            action: () => zoomIn()
        })

        cmds.set('Zoom out', {
            action: () => zoomOut()
        })

        cmds.set('Close window', {
            action: () => onClose()
        })

        return cmds
    }, [zoomIn, zoomOut, onClose])

    // Rendering
    let className

    if (size === 'LARGE') {
        className = 'follow-window large'
    } else if (size === 'MEDIUM') {
        className = 'follow-window medium'
    } else {
        className = 'follow-window small'
    }

    return (
        <WindowWithTyping<WorkerId>
            commands={commands}
            param={idToFollow}
            className={className}
            heading='Monitor'
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hoverInfo}
        >
            <div
                ref={myRef}
                className='follow-content'

                onWheel={(event: React.WheelEvent) => {
                    zoomToScale(viewRef.current.scale - event.deltaY / 20.0)
                }}

                onMouseMove={(event: React.MouseEvent) => {
                    if (moving.moving) {
                        viewRef.current.translate = {
                            x: event.clientX - moving.mouseAt.x + viewRef.current.translate.x,
                            y: viewRef.current.translate.y + (event.clientY - moving.mouseAt.y)
                        }

                        moving.mouseAt = {
                            x: event.clientX,
                            y: event.clientY
                        }
                    }
                }}

                onContextMenu={e => e.preventDefault()}

                onMouseDown={(event: React.MouseEvent) => {
                    if (event.button === 2) {
                        moving.moving = true
                        moving.mouseAt = { x: event.clientX, y: event.clientY }

                        setIdToFollow(undefined)

                        event.stopPropagation()
                    }
                }}

            >
                <GameCanvas
                    cursor='NOTHING'
                    heightAdjust={heightAdjust}
                    showAvailableConstruction={false}
                    showHouseTitles={false}
                    viewRef={viewRef}
                    hideHoverPoint={true}
                    hideSelectedPoint={true}
                />
                <div className='zoom-buttons'>
                    <Button
                        appearance='subtle'
                        onMouseEnter={() => setHoverInfo('Zoom in')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                        onClick={zoomIn}
                    >
                        <UiIcon type='PLUS' />
                    </Button>
                    <Button
                        appearance='subtle'
                        onMouseEnter={() => setHoverInfo('Zoom out')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                        onClick={zoomOut}
                    >
                        <UiIcon type='MINUS' />
                    </Button>
                </div>
            </div>
            <ButtonRow>
                {size !== 'SMALL' &&
                    <Button
                        onClick={() => setSize(prev => {
                            if (prev === 'MEDIUM') {
                                return 'SMALL'
                            }

                            return 'MEDIUM'
                        })}
                        onMouseEnter={() => setHoverInfo('Smaller window')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='SHRINK_SCREEN_AND_MAGNIFYING_GLASS' />
                    </Button>
                }
                {size !== 'LARGE' &&
                    <Button
                        onClick={() => setSize(prev => {
                            if (prev === 'MEDIUM') {
                                return 'LARGE'
                            }

                            return 'MEDIUM'
                        })}
                        onMouseEnter={() => setHoverInfo('Larger window')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='ENLARGE_SCREEN_AND_MAGNIFYING_GLASS' />
                    </Button>
                }

                {idToFollow === undefined &&
                    <Button onClick={() => startMonitor(findCenterGamePoint())}
                        onMouseEnter={() => setHoverInfo('Start monitoring')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        <UiIcon type='FILM_CAMERA' />
                    </Button>
                }

                {idToFollow !== undefined &&
                    <Button onClick={() => setIdToFollow(undefined)}
                        onMouseEnter={() => setHoverInfo('Stop monitoring')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Stop monitoring
                    </Button>
                }


            </ButtonRow>
        </WindowWithTyping>
    )
}

export { Follow }