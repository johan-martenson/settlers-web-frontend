import { useEffect } from 'react'
import { WebGlState } from './types'
import { PlayLogConfig } from '../screens/play/config'

// Types
type UseWebGlContextProps = {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    renderState: React.RefObject<WebGlState | null>

    initWebgl: (renderState: WebGlState) => void
    cleanupWebgl: (renderState: WebGlState) => void
    startRenderLoop: () => void
    stopRenderLoop: () => void
}

// Hooks
function useWebGlContext({
    canvasRef,
    renderState,
    initWebgl,
    cleanupWebgl,
    startRenderLoop,
    stopRenderLoop
}: UseWebGlContextProps) {
    if (PlayLogConfig.lifecycle) {
        console.log('useWebGlContext: Initializing WebGL context')
    }

    // Effect: initialize WebGL context and handle context loss/restoration
    useEffect(() => {
        const canvas = canvasRef.current

        if (!canvas) {
            console.error('useWebGlContext: Canvas ref is not set, cannot initialize WebGL context')

            return
        }

        function onContextLost(event: Event) {
            if (PlayLogConfig.lifecycle) {
                console.log('WebGL context lost')
            }

            event.preventDefault()

            if (renderState.current) {
                renderState.current.contextLost = true
            } else {
                console.warn('useWebGlContext: renderState ref is not set when handling context loss')
            }

            stopRenderLoop()
        }

        function onContextRestored() {
            if (PlayLogConfig.lifecycle) {
                console.log('WebGL context restored')
            }

            if (renderState.current) {
                initWebgl(renderState.current)
                renderState.current.contextLost = false
            } else {
                console.warn('useWebGlContext: renderState ref is not set when handling context restoration')
            }

            startRenderLoop()
        }

        canvas.addEventListener('webglcontextlost', onContextLost)
        canvas.addEventListener('webglcontextrestored', onContextRestored)

        if (PlayLogConfig.lifecycle) {
            console.log('useWebGlContext: Initializing WebGL context for the first time')
        }

        return () => {
            if (PlayLogConfig.lifecycle) {
                console.log('useWebGlContext: Cleaning up WebGL context')
            }

            canvas.removeEventListener('webglcontextlost', onContextLost)
            canvas.removeEventListener('webglcontextrestored', onContextRestored)

            stopRenderLoop()

            if (renderState.current) {
                cleanupWebgl(renderState.current)
            } else {
                console.warn('useWebGlContext: renderState ref is not set during cleanup')
            }
        }
    }, [renderState, canvasRef, initWebgl, cleanupWebgl, startRenderLoop, stopRenderLoop])
}

// Exports
export { useWebGlContext }