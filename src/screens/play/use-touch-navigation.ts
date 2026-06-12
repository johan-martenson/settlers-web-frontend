import { useCallback, useRef } from 'react'
import { PlayLogConfig } from './config'

type Point = {
    x: number
    y: number
}

type StoredTouch = Pick<
    React.Touch,
    'identifier' | 'pageX' | 'pageY'
>

type ImmediateState = {
    mouseDownAt: Point
    mouseMoving: boolean
    touchMoveOngoing: boolean
    primaryTouchIdentifier: number
    translateAtMouseDown: Point
    translate: Point
}

type UseTouchNavigationProps = {
    immediateStateRef: React.MutableRefObject<ImmediateState>
    ongoingTouches: Map<number, StoredTouch>
    onPinchZoomIn?: () => void
    onPinchZoomOut?: () => void
}

type UseTouchNavigationResult = {
    onTouchStart: (event: React.TouchEvent) => void
    onTouchMove: (event: React.TouchEvent) => void
    onTouchEnd: (event: React.TouchEvent) => void
    onTouchCancel: (event: React.TouchEvent) => void
    resetTouches: () => void
}

function useTouchNavigation({
    immediateStateRef,
    ongoingTouches,
    onPinchZoomIn,
    onPinchZoomOut
}: UseTouchNavigationProps): UseTouchNavigationResult {
    const lastPinchDistanceRef = useRef<number | null>(null)

    // Functions
    const copyTouch = useCallback((touch: React.Touch): StoredTouch => ({
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY
    }), [])

    const resetTouches = useCallback(() => {
        if (PlayLogConfig.touch) {
            console.log('Play (touch): resetting touch state')
        }

        ongoingTouches.clear()

        immediateStateRef.current.touchMoveOngoing = false
        immediateStateRef.current.mouseMoving = false

        lastPinchDistanceRef.current = null
    }, [immediateStateRef, ongoingTouches])

    const onTouchStart = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        if (PlayLogConfig.touch) {
            console.log(
                `Play (touch): touchstart with ${event.changedTouches.length} changed touches`
            )
        }

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i]

            ongoingTouches.set(
                touch.identifier,
                copyTouch(touch)
            )

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): registered touch ${touch.identifier} at (${touch.pageX}, ${touch.pageY})`
                )
            }
        }

        if (ongoingTouches.size === 2) {
            const [firstTouch, secondTouch] = Array.from(ongoingTouches.values())

            const deltaX = secondTouch.pageX - firstTouch.pageX
            const deltaY = secondTouch.pageY - firstTouch.pageY

            lastPinchDistanceRef.current = Math.hypot(deltaX, deltaY)
        }

        if (!immediateStateRef.current.touchMoveOngoing) {
            const touch = touches[0]

            if (!touch) {
                if (PlayLogConfig.touch) {
                    console.warn('Play (touch): touchstart without touches')
                }

                return
            }

            immediateStateRef.current.primaryTouchIdentifier = touch.identifier

            immediateStateRef.current.mouseDownAt = {
                x: touch.pageX,
                y: touch.pageY
            }

            immediateStateRef.current.mouseMoving = false
            immediateStateRef.current.touchMoveOngoing = true

            immediateStateRef.current.translateAtMouseDown = {
                ...immediateStateRef.current.translate
            }

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): started primary touch ${touch.identifier}`
                )
            }
        }
    }, [copyTouch, immediateStateRef, ongoingTouches])

    const onTouchMove = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            const currentTouch = touches[i]

            const previousTouch = ongoingTouches.get(
                currentTouch.identifier
            )

            if (!previousTouch) {
                if (PlayLogConfig.touch) {
                    console.warn(
                        `Play (touch): missing previous touch for identifier ${currentTouch.identifier}`
                    )
                }

                continue
            }

            if (
                immediateStateRef.current.touchMoveOngoing &&
                currentTouch.identifier === immediateStateRef.current.primaryTouchIdentifier
            ) {
                const deltaX =
                    currentTouch.pageX -
                    immediateStateRef.current.mouseDownAt.x

                const deltaY =
                    currentTouch.pageY -
                    immediateStateRef.current.mouseDownAt.y

                if (deltaX ** 2 + deltaY ** 2 > 25) {
                    immediateStateRef.current.mouseMoving = true
                }

                immediateStateRef.current.translate = {
                    x: immediateStateRef.current.translateAtMouseDown.x + deltaX,
                    y: immediateStateRef.current.translateAtMouseDown.y + deltaY
                }

                if (PlayLogConfig.touch) {
                    console.log(
                        `Play (touch): moving primary touch ${currentTouch.identifier} to (${currentTouch.pageX}, ${currentTouch.pageY})`
                    )
                }
            }

            ongoingTouches.set(
                currentTouch.identifier,
                copyTouch(currentTouch)
            )
        }

        if (ongoingTouches.size === 2) {
            const [firstTouch, secondTouch] = Array.from(ongoingTouches.values())

            const deltaX = secondTouch.pageX - firstTouch.pageX
            const deltaY = secondTouch.pageY - firstTouch.pageY

            const pinchDistance = Math.hypot(deltaX, deltaY)

            if (lastPinchDistanceRef.current !== null) {
                if (pinchDistance > lastPinchDistanceRef.current) {
                    onPinchZoomIn?.()
                } else if (pinchDistance < lastPinchDistanceRef.current) {
                    onPinchZoomOut?.()
                }
            }

            lastPinchDistanceRef.current = pinchDistance
        }
    }, [
        copyTouch,
        immediateStateRef,
        ongoingTouches,
        onPinchZoomIn,
        onPinchZoomOut
    ])

    const onTouchEnd = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        const activeTouchEnded = Array.from(event.changedTouches).some(
            touch => touch.identifier === immediateStateRef.current.primaryTouchIdentifier
        )

        if (activeTouchEnded) {
            immediateStateRef.current.touchMoveOngoing = false
            immediateStateRef.current.mouseMoving = false

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): primary touch ${immediateStateRef.current.primaryTouchIdentifier} ended`
                )
            }
        }

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): removed touch ${touches[i].identifier}`
                )
            }
        }

        if (ongoingTouches.size < 2) {
            lastPinchDistanceRef.current = null
        }

        if (PlayLogConfig.touch) {
            console.log('Play (touch): touchend')
        }
    }, [immediateStateRef, ongoingTouches])

    const onTouchCancel = useCallback((event: React.TouchEvent) => {
        event.preventDefault()

        const activeTouchCancelled = Array.from(event.changedTouches).some(
            touch => touch.identifier === immediateStateRef.current.primaryTouchIdentifier
        )

        if (activeTouchCancelled) {
            immediateStateRef.current.touchMoveOngoing = false
            immediateStateRef.current.mouseMoving = false

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): primary touch ${immediateStateRef.current.primaryTouchIdentifier} cancelled`
                )
            }
        }

        const touches = event.changedTouches

        for (let i = 0; i < touches.length; i++) {
            ongoingTouches.delete(touches[i].identifier)

            if (PlayLogConfig.touch) {
                console.log(
                    `Play (touch): removed cancelled touch ${touches[i].identifier}`
                )
            }
        }

        if (ongoingTouches.size < 2) {
            lastPinchDistanceRef.current = null
        }

        if (PlayLogConfig.touch) {
            console.log('Play (touch): touchcancel')
        }
    }, [immediateStateRef, ongoingTouches])

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
        resetTouches
    }
}

export {
    useTouchNavigation
}