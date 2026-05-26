import { useCallback, useEffect, useRef, useState } from 'react'
import { PlayLogConfig } from './config'

// Types
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type WindowWithId<WindowType extends string = string> = {
    id: number
    type: WindowType
}
type UseWindowsProps<Window extends WindowWithId> = {
    isDuplicateWindow?: (existing: Window, candidate: Window) => boolean
}

type UseWindowsResult<Window extends WindowWithId> = {
    windows: Window[]

    openWindow: (window: DistributiveOmit<Window, 'id'>) => void
    openSingletonWindow: (window: DistributiveOmit<Window, 'id'>) => void

    closeWindow: (id: number) => void
    closeActiveWindow: () => void

    raiseWindow: (id: number) => void

    clearWindows: () => void
}

// Functions
function useWindows<Window extends WindowWithId>({
    isDuplicateWindow
}: UseWindowsProps<Window> = {}): UseWindowsResult<Window> {

    // State
    const [windows, setWindows] = useState<Window[]>([])

    // Refs
    const nextWindowIdRef = useRef(0)

    // Functions
    function withWindowId<Window extends WindowWithId>(
        window: DistributiveOmit<Window, 'id'>,
        id: number
    ): Window {
        return { ...window, id } as Window
    }

    const openWindow = useCallback((window: DistributiveOmit<Window, 'id'>) => {
        if (PlayLogConfig.windows) {
            console.log('Windows: Opening window requested', window)
        }

        setWindows(prevWindows => {
            if (isDuplicateWindow) {
                const duplicate = prevWindows.find(existing =>
                    isDuplicateWindow(
                        existing,
                        window as Window
                    )
                )

                if (duplicate) {
                    if (PlayLogConfig.windows) {
                        console.log('Windows: Duplicate window prevented. Raised existing window.', {
                            existing: duplicate,
                            requested: window
                        })
                    }

                    return [
                        ...prevWindows.filter(w => w.id !== duplicate.id),
                        duplicate
                    ]
                }
            }

            nextWindowIdRef.current += 1

            const id = nextWindowIdRef.current - 1

            if (PlayLogConfig.windows) {
                console.log('Windows: Allocated window id', id)
            }

            const createdWindow = withWindowId(
                window,
                id
            )

            if (PlayLogConfig.windows) {
                console.log('Windows: Window opened', createdWindow)
            }

            return [
                ...prevWindows,
                createdWindow
            ]
        })
    }, [isDuplicateWindow])

    const openSingletonWindow = useCallback((window: DistributiveOmit<Window, 'id'>) => {
        setWindows(prevWindows => {
            if (PlayLogConfig.windows) {
                console.log('Windows: Opening singleton window requested', window)
            }

            const existingWindow = prevWindows.find(existing => existing.type === window.type)

            if (existingWindow) {
                if (PlayLogConfig.windows) {
                    console.log(
                        'Windows: Raising existing singleton window',
                        existingWindow
                    )
                }

                return [
                    ...prevWindows.filter(w => w.id !== existingWindow.id),
                    existingWindow
                ]
            }

            nextWindowIdRef.current += 1

            const id = nextWindowIdRef.current - 1

            if (PlayLogConfig.windows) {
                console.log('Windows: Allocated window id', id)
            }

            const createdWindow = withWindowId(
                window,
                id
            )

            if (PlayLogConfig.windows) {
                console.log('Windows: Singleton window opened', createdWindow)
            }

            return [
                ...prevWindows,
                createdWindow
            ]
        })
    }, [])

    const closeWindow = useCallback((id: number) => {
        setWindows(prevWindows => {
            const exists = prevWindows.some(window => window.id === id)

            if (PlayLogConfig.windows) {
                console.log(
                    exists
                        ? 'Windows: Closing window'
                        : 'Windows: Cannot close missing window',
                    id
                )
            }

            if (!exists) {
                return prevWindows
            }

            return prevWindows.filter(window => window.id !== id)
        })
    }, [])

    const closeActiveWindow = useCallback(() => {
        setWindows(prevWindows => {
            if (prevWindows.length === 0) {
                if (PlayLogConfig.windows) {
                    console.log('Windows: No active window to close')
                }

                return prevWindows
            }

            const activeWindow = prevWindows[prevWindows.length - 1]

            if (PlayLogConfig.windows) {
                console.log('Windows: Closing active window', activeWindow)
            }

            return prevWindows.slice(0, -1)
        })
    }, [])

    const raiseWindow = useCallback((id: number) => {
        if (PlayLogConfig.windows) {
            console.log('Windows: Raising window', id)
        }

        setWindows(prevWindows => {
            const windowIndex = prevWindows.findIndex(w => w.id === id)

            if (windowIndex === -1) {
                if (PlayLogConfig.windows) {
                    console.log('Windows: Cannot raise window, not found', id)
                }

                return prevWindows
            }

            if (windowIndex === prevWindows.length - 1) {
                if (PlayLogConfig.windows) {
                    console.log('Windows: Window is already raised', id)
                }

                return prevWindows
            }

            const window = prevWindows[windowIndex]

            if (PlayLogConfig.windows) {
                console.log('Windows: Window raised to top', window)
            }

            return [
                ...prevWindows.filter(w => w.id !== id),
                window
            ]
        })
    }, [])

    const clearWindows = useCallback(() => {
        if (PlayLogConfig.windows) {
            console.log('Windows: Clearing all windows')
        }

        setWindows([])
    }, [])

    // Effects
    useEffect(() => {
        if (PlayLogConfig.windows) {
            console.log('Windows: Hook initialized')
        }

        return () => {
            if (PlayLogConfig.windows) {
                console.log('Windows: Hook destroyed')
            }
        }
    }, [])

    return {
        windows,
        openWindow,
        openSingletonWindow,
        closeWindow,
        closeActiveWindow,
        raiseWindow,
        clearWindows
    }
}

// Exports
export {
    useWindows
}