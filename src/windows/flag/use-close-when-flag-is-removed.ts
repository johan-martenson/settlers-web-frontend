import { useEffect, useMemo } from "react"
import { FlagInformation } from "../../api/types"
import { api } from "../../api/ws-api"

/// Types
type UseWhenFlagIsRemovedProps = {
    flag: FlagInformation | undefined
    onClose: () => void
}

/// Hooks
function useCloseWhenFlagIsRemoved({ flag, onClose }: UseWhenFlagIsRemovedProps) {

    // Memos
    const flagListener = useMemo(() => ({
        onRemove: onClose
    }), [onClose])

    // Effects
    // Effect: close the window if the flag is removed
    useEffect(() => {
        if (flag !== undefined) {
            api.addFlagListener(flag.id, flagListener)
        }

        return () => {
            if (flag !== undefined) {
                api.removeFlagListener(flag.id, flagListener)
            }
        }
    }, [flag?.id, flagListener])
}

/// Exports
export {
    useCloseWhenFlagIsRemoved
}