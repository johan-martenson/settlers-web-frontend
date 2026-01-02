import React, { useEffect } from "react"

function useTrackedRef<T>(target: T) {
    const ref = React.useRef(target)

    useEffect(() => {
        ref.current = target
    }, [target])

    return ref
}

export {
    useTrackedRef
}