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

function Follow({ point, onRaise, onClose, ...props }: FollowProps) {
    const myRef = useRef<HTMLDivElement | null>(null)

    // eslint-disable-next-line
    const [scale, setScale] = useState<number>(props?.scale ?? DEFAULT_SCALE)
    const [height, setHeight] = useState<number>(0)
    const [width, setWidth] = useState<number>(0)
    const [size, setSize] = useState<Size>('MEDIUM')

    // eslint-disable-next-line
    const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 })

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

    const newTranslateX = width / 2 - point.x * scale
    const newTranslateY = height / 2 + point.y * scale - height

    const view = { point, translate: { x: newTranslateX, y: newTranslateY }, scale }

    let className

    if (size === 'LARGE') {
        className = 'follow-window large'
    } else if (size === 'MEDIUM') {
        className = 'follow-window medium'
    } else {
        className = 'follow-window small'
    }

    return (
        <Window className={className} heading='Follow' onClose={onClose} onRaise={onRaise}>
            <div ref={myRef} className='follow-content'>
                <GameCanvas
                    cursor='NOTHING'
                    heightAdjust={DEFAULT_HEIGHT_ADJUSTMENT}
                    screenHeight={height}
                    showAvailableConstruction={false}
                    showHouseTitles={false}
                    view={view}
                />
            </div>
            <ButtonRow>
                <Button onClick={() => setSize('SMALL')}>Small</Button>
                <Button onClick={() => setSize('MEDIUM')}>Medium</Button>
                <Button onClick={() => setSize('LARGE')}>Large</Button>
            </ButtonRow>
        </Window>
    )
}

export { Follow }