import { useCallback, useEffect, useRef } from 'react'
import { PlayLogConfig } from './config'

/// Types
type Point = {
    x: number
    y: number
}

type UseGestureNavigationProps = {
    elementRef: React.RefObject<HTMLElement | null>
    onPinchZoom?: (scaleDelta: number, center: Point) => void
}

type UseGestureNavigationResult = {
    resetGesture: () => void
}

type GestureEvent = Event & {
    scale: number
    clientX: number
    clientY: number
}

/// React components
function useGestureNavigation({ elementRef, onPinchZoom }: UseGestureNavigationProps): UseGestureNavigationResult {

    // State
    const previousScaleRef = useRef<number | null>(null)

    // Functions
    const resetGesture = useCallback(() => {
        if (PlayLogConfig.touch) {
            console.log('Play (gesture): resetting gesture state')
        }

        previousScaleRef.current = null
    }, [])

    const onGestureStart = useCallback((event: Event) => {
        event.preventDefault()

        const gestureEvent = event as GestureEvent

        previousScaleRef.current = gestureEvent.scale

        if (PlayLogConfig.touch) {
            console.log(`Play (gesture): gesturestart scale=${gestureEvent.scale}`)
        }
    }, [])

    const onGestureChange = useCallback((event: Event) => {
        event.preventDefault()

        const gestureEvent = event as GestureEvent
        const previousScale = previousScaleRef.current

        if (previousScale === null || previousScale <= 0) {
            previousScaleRef.current = gestureEvent.scale

            return
        }

        const scaleDelta = gestureEvent.scale / previousScale

        const center = {
            x: gestureEvent.clientX,
            y: gestureEvent.clientY
        }

        onPinchZoom?.(scaleDelta, center)

        previousScaleRef.current = gestureEvent.scale

        if (PlayLogConfig.touch) {
            console.log(`Play (gesture): gesturechange scale=${gestureEvent.scale}, delta=${scaleDelta}`)
        }
    }, [onPinchZoom])

    const onGestureEnd = useCallback((event: Event) => {
        event.preventDefault()

        if (PlayLogConfig.touch) {
            console.log('Play (gesture): gestureend')
        }

        previousScaleRef.current = null
    }, [])

    useEffect(() => {
        const element = elementRef.current

        if (!element) {
            return
        }

        element.addEventListener(
            'gesturestart',
            onGestureStart as EventListener,
            { passive: false }
        )

        element.addEventListener(
            'gesturechange',
            onGestureChange as EventListener,
            { passive: false }
        )

        element.addEventListener(
            'gestureend',
            onGestureEnd as EventListener,
            { passive: false }
        )

        if (PlayLogConfig.touch) {
            console.log('Play (gesture): started listening')
        }

        return () => {
            element.removeEventListener('gesturestart', onGestureStart as EventListener)
            element.removeEventListener('gesturechange', onGestureChange as EventListener)
            element.removeEventListener('gestureend', onGestureEnd as EventListener)

            previousScaleRef.current = null

            if (PlayLogConfig.touch) {
                console.log('Play (gesture): stopped listening')
            }
        }
    }, [
        elementRef,
        onGestureStart,
        onGestureChange,
        onGestureEnd
    ])

    return {
        resetGesture
    }
}

/// Exports
export {
    useGestureNavigation
}