import React, { useEffect, useRef, useState } from 'react'
import { ButtonRow, Window } from '../../components/dialog'
import { Point, Size, WorkerId } from '../../api/types'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE, STANDARD_HEIGHT } from '../../render/constants'
import { GameCanvas, View } from '../../render/game_render'
import './follow.css'
import { Button } from '@fluentui/react-components'
import { animator } from '../../utils/animator'
import { calcTranslation } from '../../render/utils'
import { calcDistance, gamePointToScreenPointWithHeightAdjustment, screenPointToGamePointWithHeightAdjustment } from '../../utils/utils'
import { MoveUpdate, api } from '../../api/ws-api'
import { UiIcon } from '../../icons/icon'

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
    translate: Point
}

// Constants
const MIN_SCALE = 10
const MAX_SCALE = 150

// React components
function Follow({ heightAdjust, point, scale = DEFAULT_SCALE, onRaise, onClose }: FollowProps) {
    const myRef = useRef<HTMLDivElement | null>(null)

    const [size, setSize] = useState<Size>('MEDIUM')

    // eslint-disable-next-line
    const [moving, setMoving] = useState<Moving>({ moving: false, mouseAt: { x: 0, y: 0 }, translate: { x: 0, y: 0 } })
    const [isCentered, setIsCentered] = useState<boolean>(false)
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [idToFollow, setIdToFollow] = useState<WorkerId>()

    // eslint-disable-next-line
    const [view, neverSetView] = useState<View>({ scale, translate: { x: 0, y: 0 }, screenSize: { width: 100, height: 100 } })

    useEffect(() => {
        if (idToFollow !== undefined) {
            const moveListener = {
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
    }, [idToFollow])

    useEffect(() => {
        view.screenSize = {
            width: myRef?.current?.clientWidth ?? 0,
            height: myRef?.current?.clientHeight ?? 0

        }
    }, [myRef])

    useEffect(() => {
        if (!isCentered && view.screenSize.width > 0 && view.screenSize.height > 0) {
            const newTranslateX = view.screenSize.width / 2 - point.x * view.scale
            const newTranslateY = view.screenSize.height / 2 + point.y * view.scale - view.screenSize.height

            view.translate = ({ x: newTranslateX, y: newTranslateY })
            setIsCentered(true) // FIXME: this changes the variable that the effect depends on. Fix!
        }
    }, [isCentered])

    useEffect(() => {
        function resizeListener(): void {
            if (myRef.current) {
                view.screenSize = {
                    width: myRef.current.clientWidth,
                    height: myRef.current.clientHeight
                }
            }
        }

        if (myRef?.current) {
            myRef.current.addEventListener('resize', resizeListener)
        }

        return () => myRef?.current?.removeEventListener('resize', resizeListener)
    }, [myRef])

    function goToBetweenPoints(from: Point, to: Point, progress: number): void {
        const heightAtFrom = api.allTiles.get(from)?.height ?? 0
        const heightAtTo = api.allTiles.get(to)?.height ?? 0

        const screenPointFrom = gamePointToScreenPointWithHeightAdjustment(
            from,
            heightAtFrom,
            view,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPointTo = gamePointToScreenPointWithHeightAdjustment(
            to,
            heightAtTo,
            view,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPoint = {
            x: screenPointFrom.x + (screenPointTo.x - screenPointFrom.x) * (progress / 100),
            y: screenPointFrom.y + (screenPointTo.y - screenPointFrom.y) * progress / 100
        }

        view.translate = {
            x: view.translate.x - screenPoint.x + view.screenSize.width / 2,
            y: view.translate.y - screenPoint.y + view.screenSize.height / 2
        }
    }

    // eslint-disable-next-line
    function goToPoint(point: Point): void {
        const heightAtPoint = api.allTiles.get(point)?.height ?? 0

        const screenPoint = gamePointToScreenPointWithHeightAdjustment(
            point,
            heightAtPoint,
            view,
            heightAdjust,
            STANDARD_HEIGHT)

        view.translate = {
            x: view.translate.x - screenPoint.x + view.screenSize.width / 2,
            y: view.translate.y - screenPoint.y + view.screenSize.height / 2
        }
    }

    function findHeightAdjustedCenterGamePoint(view: View): Point {
        const screenPoint = { x: view.screenSize.width / 2, y: view.screenSize.height / 2 }
        return screenPointToGamePointWithHeightAdjustment(screenPoint, view, heightAdjust)
    }

    function startMonitor(gamePoint: Point): void {
        let distance = 2000
        let newIdToFollow

        for (const [id, worker] of api.workers) {
            let position

            if (worker.betweenPoints && worker.previous && worker.next) {
                position = {
                    x: worker.previous.x + (worker.next.x - worker.previous.x) * (worker.percentageTraveled / 100.0),
                    y: worker.previous.y + (worker.next.y - worker.previous.y) * (worker.percentageTraveled / 100.0)
                }
            } else {
                position = { x: worker.x, y: worker.y }
            }

            if (position.x === gamePoint.x && position.y === gamePoint.y) {
                newIdToFollow = id
                distance = 0

                break
            }

            const tempDistance = calcDistance(gamePoint, position)

            if (tempDistance < distance) {
                distance = tempDistance

                newIdToFollow = id
            }
        }

        if (distance > 0) {
            for (const [id, animal] of api.wildAnimals) {
                let position

                if (animal.betweenPoints && animal.previous && animal.next) {
                    position = {
                        x: animal.previous.x + (animal.next.x - animal.previous.x) * (animal.percentageTraveled / 100.0),
                        y: animal.previous.y + (animal.next.y - animal.previous.y) * (animal.percentageTraveled / 100.0)
                    }
                } else {
                    position = { x: animal.x, y: animal.y }
                }

                if (position.x === gamePoint.x && position.y === gamePoint.y) {
                    newIdToFollow = id
                    distance = 0

                    break
                }

                const tempDistance = calcDistance(gamePoint, position)

                if (tempDistance < distance) {
                    distance = tempDistance

                    newIdToFollow = id
                }
            }
        }

        if (newIdToFollow) {
            setIdToFollow(newIdToFollow)

            const worker = api.workers.get(newIdToFollow) ?? api.wildAnimals.get(newIdToFollow)

            if (worker) {
                let position

                if (worker.betweenPoints && worker.previous && worker.next) {
                    position = {
                        x: worker.previous.x + (worker.next.x - worker.previous.x) * (worker.percentageTraveled / 100.0),
                        y: worker.previous.y + (worker.next.y - worker.previous.y) * (worker.percentageTraveled / 100.0)
                    }
                } else {
                    position = { x: worker.x, y: worker.y }
                }

                goToPoint(position)
            }
        }
    }

    let className

    if (size === 'LARGE') {
        className = 'follow-window large'
    } else if (size === 'MEDIUM') {
        className = 'follow-window medium'
    } else {
        className = 'follow-window small'
    }

    return (
        <Window className={className} heading='Monitor' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <div
                ref={myRef}
                className='follow-content'

                onWheel={(event: React.WheelEvent) => {
                    const prevScale = view.scale
                    let newScale = prevScale - event.deltaY / 20.0

                    newScale = Math.min(newScale, MAX_SCALE)
                    newScale = Math.max(newScale, MIN_SCALE)

                    view.translate = calcTranslation(prevScale, newScale, view.translate, view.screenSize)
                    view.scale = newScale
                }}

                // eslint-disable-next-line
                onMouseUp={(event: React.MouseEvent) => {
                    moving.moving = false
                }}

                onMouseMove={(event: React.MouseEvent) => {
                    if (moving.moving) {
                        view.translate = {
                            x: event.clientX - moving.mouseAt.x + view.translate.x,
                            y: view.translate.y + (event.clientY - moving.mouseAt.y)
                        }

                        moving.mouseAt = {
                            x: event.clientX,
                            y: event.clientY
                        }
                    }
                }}

                onMouseDown={(event: React.MouseEvent) => {
                    if (event.button === 2) {
                        moving.moving = true
                        moving.mouseAt = { x: event.clientX, y: event.clientY }
                        moving.translate = view.translate

                        setIdToFollow(undefined)

                        event.stopPropagation()
                    }
                }}

            >
                <GameCanvas
                    cursor='NOTHING'
                    heightAdjust={DEFAULT_HEIGHT_ADJUSTMENT}
                    showAvailableConstruction={false}
                    showHouseTitles={false}
                    view={view}
                    hideHoverPoint={true}
                    hideSelectedPoint={true}
                />
                <div className='zoom-buttons'>
                    <Button
                        appearance='subtle'
                        onMouseEnter={() => setHoverInfo('Zoom in')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                        onClick={() => {
                            const prevScale = view.scale
                            let newScale = prevScale + 10

                            newScale = Math.min(newScale, MAX_SCALE)
                            newScale = Math.max(newScale, MIN_SCALE)

                            const newTranslate = calcTranslation(prevScale, newScale, view.translate, view.screenSize)

                            animator.animateSeveralNoId(
                                (values: number[]) => {
                                    view.scale = values[0]
                                    view.translate = { x: values[1], y: values[2] }
                                },
                                [prevScale, view.translate.x, view.translate.y],
                                [newScale, newTranslate.x, newTranslate.y]
                            )
                        }}
                    >
                    </Button>
                    <Button
                        appearance='subtle'
                        onMouseEnter={() => setHoverInfo('Zoom out')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                        onClick={() => {
                            const prevScale = view.scale
                            let newScale = prevScale - 10

                            newScale = Math.min(newScale, MAX_SCALE)
                            newScale = Math.max(newScale, MIN_SCALE)

                            const newTranslate = calcTranslation(prevScale, newScale, view.translate, view.screenSize)

                            animator.animateSeveralNoId(
                                (values: number[]) => {
                                    view.scale = values[0]
                                    view.translate = { x: values[1], y: values[2] }
                                },
                                [prevScale, view.translate.x, view.translate.y],
                                [newScale, newTranslate.x, newTranslate.y]
                            )
                        }}
                    >
                        -
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
                    <Button onClick={() => startMonitor(findHeightAdjustedCenterGamePoint(view))}
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
        </Window>
    )
}

export { Follow }