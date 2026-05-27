import { useEffect } from "react"
import { PlayLogConfig } from "./config"

function usePreventContextMenu(): void {
    useEffect(() => {
        function preventContextMenu(event: MouseEvent): void {
            event.preventDefault()
        }

        if (PlayLogConfig.preventContextMenu) {
            console.log('Play: Adding context menu prevention')
        }

        window.addEventListener('contextmenu', preventContextMenu)

        return () => {
            if (PlayLogConfig.preventContextMenu) {
                console.log('Play: Removing context menu prevention')
            }

            window.removeEventListener('contextmenu', preventContextMenu)
        }
    }, [])
}

export {
    usePreventContextMenu
}
