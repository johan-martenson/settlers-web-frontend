import React from 'react'
import { HooksConfig } from './config'

// eslint-disable-next-line
function useNonTriggeringState<T extends object | any[]>(initialValue: T): T {

    if (HooksConfig.useNonTriggeringState) {
        console.log('Hooks (nonTriggeringState): creating non-triggering state', initialValue)
    }

    // eslint-disable-next-line
    const [nonTriggeringState, setNonTriggeringState] = React.useState<T>(initialValue)

    return nonTriggeringState
}

export {
    useNonTriggeringState
}
