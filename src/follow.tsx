import React, { useEffect, useRef, useState } from 'react'
import { ButtonRow, Window } from './components/dialog'
import { Point } from './api/types'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE } from './render/constants'
import { GameCanvas } from './game_render'
import './follow.css'
import { Button } from '@fluentui/react-components'

type FollowProps = {
    point: Point
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

function Follow({ point, onRaise, onClose, ...props }: FollowProps) {
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
            function resizeListener() {
                setHeight(myRef.current?.clientHeight ?? 0)
                setWidth(myRef.current?.clientWidth ?? 0)
            }

            if (myRef?.current) {
                myRef.current.addEventListener('resize', resizeListener)
            }

            return () => myRef?.current?.removeEventListener('resize', resizeListener)
        }
    )

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
        <Window className={className} heading='Follow' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <div
                ref={myRef}
                className='follow-content'

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
            </div>
            <ButtonRow>
                <Button
                    onClick={() => setSize('SMALL')}
                    onMouseEnter={() => setHoverInfo('Small window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    Small
                </Button>
                <Button
                    onClick={() => setSize('MEDIUM')}
                    onMouseEnter={() => setHoverInfo('Medium window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    Medium
                </Button>
                <Button
                    onClick={() => setSize('LARGE')}
                    onMouseEnter={() => setHoverInfo('Large window')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                >
                    Large
                </Button>
            </ButtonRow>
        </Window>
    )
}

export { Follow }