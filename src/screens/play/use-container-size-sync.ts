import { RefObject, useEffect } from 'react'
import { api } from '../../api/ws-api'
import { PlayLogConfig } from './config'
import { ImmediateState } from './types'

type UseContainerSizeSyncProps = {
    gameId: string
    selfContainerRef: RefObject<HTMLDivElement | null>
    immediateStateRef: RefObject<ImmediateState>
}

function useContainerSizeSync({ gameId, selfContainerRef, immediateStateRef }: UseContainerSizeSyncProps): void {

    useEffect(() => {
        let cancelled = false

        async function initializeScreenSize(): Promise<void> {
            try {
                if (PlayLogConfig.lifecycle) {
                    console.log('Play (lifecycle): Initializing screen size')
                }

                await api.waitForGameDataAvailable()

                if (cancelled) {
                    console.warn(
                        'Play (lifecycle): Game data became available but effect already cancelled, aborting screen size initialization'
                    )

                    return
                }

                if (PlayLogConfig.lifecycle) {
                    console.log(
                        'Play (lifecycle): Game data is available, setting initial screen size'
                    )
                }

                requestAnimationFrame(() => {
                    if (cancelled) {
                        console.warn(
                            'Play (lifecycle): Initial screen size set but effect already cancelled, aborting'
                        )

                        return
                    }

                    if (selfContainerRef.current) {
                        if (PlayLogConfig.lifecycle) {
                            console.log('Play (lifecycle): Setting initial screen size')
                        }

                        immediateStateRef.current.screenSize = {
                            width: selfContainerRef.current.clientWidth,
                            height: selfContainerRef.current.clientHeight
                        }
                    } else {
                        console.error(
                            'Play (lifecycle): Failed to set initial screen size because container ref is not set'
                        )
                    }
                })
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to get initial game data', error)
                }
            }
        }

        function updateScreenSize(): void {
            if (selfContainerRef.current) {
                if (PlayLogConfig.lifecycle) {
                    console.log('Play (lifecycle): Updating screen size')
                }

                immediateStateRef.current.screenSize = {
                    width: selfContainerRef.current.clientWidth,
                    height: selfContainerRef.current.clientHeight
                }
            }
        }

        if (PlayLogConfig.lifecycle) {
            console.log('Play (lifecycle): Starting container size sync effect')
        }

        initializeScreenSize()

        window.addEventListener('resize', updateScreenSize)

        return () => {
            cancelled = true

            window.removeEventListener('resize', updateScreenSize)
        }
    }, [gameId, selfContainerRef, immediateStateRef])
}

export {
    useContainerSizeSync
}