import { MutableRefObject, useEffect } from 'react'
import { sfx } from '../../sound/sound_effects'
import { PlayLogConfig } from './config'
import { ImmediateState } from './types'

// Types
type UseSoundEffectsProps = {
    immediateStateRef: MutableRefObject<ImmediateState>
}

// Hooks
function useSoundEffects({ immediateStateRef }: UseSoundEffectsProps): void {

    // Effects
    useEffect(() => {
        if (PlayLogConfig.sound) {
            console.log('Play (sound): Starting sound effects')
        }

        sfx.startEffects(immediateStateRef.current)

        return () => {
            if (PlayLogConfig.sound) {
                console.log('Play (sound): Stopping sound effects')
            }

            sfx.stopEffects()
        }
    }, [immediateStateRef])
}

// Exports
export {
    useSoundEffects
}
