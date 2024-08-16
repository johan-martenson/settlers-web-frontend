import React, { useEffect, useRef, useState } from 'react'
import { ButtonRow, Window } from './components/dialog'
import { Point, WorkerId } from './api/types'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE, STANDARD_HEIGHT } from './render/constants'
import { GameCanvas } from './render/game_render'
import './follow.css'
import { Button } from '@fluentui/react-components'
import { animator } from './utils/animator'
import { calcTranslation } from './render/utils'
import { calcDistance, gamePointToScreenPointWithHeightAdjustment, screenPointToGamePointWithHeightAdjustment } from './utils'
import { MoveUpdate, api } from './api/ws-api'

// Types
type FollowProps = {
    point: Point
    heightAdjust: number
    scale?: number

    onRaise: () => void
    onClose: () => void
}

type Size = 'SMALL' | 'MEDIUM' | 'LARGE'

type Moving = {
    moving: boolean
    mouseAt: Point
    translate: Point
}

// Constants
const MIN_SCALE = 10
const MAX_SCALE = 150

// React components
function Follow({ heightAdjust, point, onRaise, onClose, ...props }: FollowProps) {
    const myRef = useRef<HTMLDivElement | null>(null)

    // eslint-disable-next-line
    const [scale, setScale] = useState<number>(props?.scale ?? DEFAULT_SCALE)
    const [height, setHeight] = useState<number>(0)
    const [width, setWidth] = useState<number>(0)
    const [size, setSize] = useState<Size>('MEDIUM')

    // eslint-disable-next-line
    const [moving, setMoving] = useState<Moving>({ moving: false, mouseAt: { x: 0, y: 0 }, translate: { x: 0, y: 0 } })
    const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 })
    const [isCentered, setIsCentered] = useState<boolean>(false)
    const [hoverInfo, setHoverInfo] = useState<string>()
    const [idToFollow, setIdToFollow] = useState<WorkerId>()

    useEffect(
        () => {
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
        }, [idToFollow]
    )

    useEffect(
        () => {
            setWidth(myRef?.current?.clientWidth ?? 0)
            setHeight(myRef?.current?.clientHeight ?? 0)
        }, []
    )

    useEffect(
        () => {
            if (!isCentered && width > 0 && height > 0) {
                const newTranslateX = width / 2 - point.x * scale
                const newTranslateY = height / 2 + point.y * scale - height

                setTranslate({ x: newTranslateX, y: newTranslateY })
                setIsCentered(true)
            }
        }, [width, height, isCentered]
    )

    useEffect(
        () => {
            function resizeListener(): void {
                setHeight(myRef.current?.clientHeight ?? 0)
                setWidth(myRef.current?.clientWidth ?? 0)
            }

            if (myRef?.current) {
                myRef.current.addEventListener('resize', resizeListener)
            }

            return () => myRef?.current?.removeEventListener('resize', resizeListener)
        }
    )

    function goToBetweenPoints(from: Point, to: Point, progress: number): void {
        const heightAtFrom = api.allTiles.get(from)?.height ?? 0
        const heightAtTo = api.allTiles.get(to)?.height ?? 0

        const screenPointFrom = gamePointToScreenPointWithHeightAdjustment(
            from,
            heightAtFrom,
            translate.x,
            translate.y,
            scale,
            height,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPointTo = gamePointToScreenPointWithHeightAdjustment(
            to,
            heightAtTo,
            translate.x,
            translate.y,
            scale,
            height,
            heightAdjust,
            STANDARD_HEIGHT)

        const screenPoint = {
            x: screenPointFrom.x + (screenPointTo.x - screenPointFrom.x) * (progress / 100),
            y: screenPointFrom.y + (screenPointTo.y - screenPointFrom.y) * progress / 100
        }

        setTranslate({
            x: translate.x - screenPoint.x + width / 2,
            y: translate.y - screenPoint.y + height / 2
        })
    }

    // eslint-disable-next-line
    function goToPoint(point: Point): void {
        const heightAtPoint = api.allTiles.get(point)?.height ?? 0

        const screenPoint = gamePointToScreenPointWithHeightAdjustment(
            point,
            heightAtPoint,
            translate.x,
            translate.y,
            scale,
            height,
            heightAdjust,
            STANDARD_HEIGHT)

        setTranslate({
            x: translate.x - screenPoint.x + width / 2,
            y: translate.y - screenPoint.y + height / 2
        })
    }

    function findHeightAdjustedCenterGamePoint(translate: Point, scale: number): Point {
        const screenPoint = { x: width / 2, y: height / 2 }
        return screenPointToGamePointWithHeightAdjustment(screenPoint, translate, scale, height, heightAdjust)
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

    const view = { point, translate, scale }

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

                onWheel={(event: React.WheelEvent) => setScale((prevScale) => {
                    let newScale = prevScale - event.deltaY / 20.0

                    newScale = Math.min(newScale, MAX_SCALE)
                    newScale = Math.max(newScale, MIN_SCALE)

                    const newTranslate = calcTranslation(prevScale, newScale, translate, { width, height })

                    setTranslate(newTranslate)

                    return newScale
                })}

                // eslint-disable-next-line
                onMouseUp={(event: React.MouseEvent) => {
                    moving.moving = false
                }}

                onMouseMove={(event: React.MouseEvent) => {
                    if (moving.moving) {
                        setTranslate({ x: event.clientX - moving.mouseAt.x + translate.x, y: translate.y + (event.clientY - moving.mouseAt.y) })

                        moving.mouseAt = { x: event.clientX, y: event.clientY }
                    }
                }}

                onMouseDown={(event: React.MouseEvent) => {
                    if (event.button === 2) {
                        moving.moving = true
                        moving.mouseAt = { x: event.clientX, y: event.clientY }
                        moving.translate = translate

                        setIdToFollow(undefined)

                        event.stopPropagation()
                    }
                }}

            >
                <GameCanvas
                    cursor='NOTHING'
                    heightAdjust={DEFAULT_HEIGHT_ADJUSTMENT}
                    screenHeight={height}
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
                        onClick={() => setScale(prevScale => {
                            let newScale = prevScale + 10

                            newScale = Math.min(newScale, MAX_SCALE)
                            newScale = Math.max(newScale, MIN_SCALE)

                            const newTranslate = calcTranslation(prevScale, newScale, translate, { width, height })

                            animator.animateSeveralNoId(
                                (values: number[]) => {
                                    setScale(values[0])
                                    setTranslate({ x: values[1], y: values[2] })
                                },
                                [prevScale, translate.x, translate.y],
                                [newScale, newTranslate.x, newTranslate.y]
                            )

                            return prevScale
                        })}
                    >
                        +
                    </Button>
                    <Button
                        appearance='subtle'
                        onMouseEnter={() => setHoverInfo('Zoom out')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                        onClick={() => setScale(prevScale => {
                            let newScale = prevScale - 10

                            newScale = Math.min(newScale, MAX_SCALE)
                            newScale = Math.max(newScale, MIN_SCALE)

                            const newTranslate = calcTranslation(prevScale, newScale, translate, { width, height })

                            animator.animateSeveralNoId(
                                (values: number[]) => {
                                    setScale(values[0])
                                    setTranslate({ x: values[1], y: values[2] })
                                },
                                [prevScale, translate.x, translate.y],
                                [newScale, newTranslate.x, newTranslate.y]
                            )

                            return prevScale
                        })}
                    >
                        -
                    </Button>
                </div>
            </div>
            <ButtonRow>
                <Button
                    onClick={() => setSize('SMALL')}
                    onMouseEnter={() => setHoverInfo('Small window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <div className='small-symbol' />
                </Button>
                <Button
                    onClick={() => setSize('MEDIUM')}
                    onMouseEnter={() => setHoverInfo('Medium window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <div className='medium-symbol' />
                </Button>
                <Button
                    onClick={() => setSize('LARGE')}
                    onMouseEnter={() => setHoverInfo('Large window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    <div className='large-symbol' />
                </Button>

                {idToFollow === undefined &&
                    <Button onClick={() => startMonitor(findHeightAdjustedCenterGamePoint(translate, scale))}
                        onMouseEnter={() => setHoverInfo('Start monitoring')}
                        onMouseLeave={() => setHoverInfo(undefined)}
                    >
                        Monitor
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