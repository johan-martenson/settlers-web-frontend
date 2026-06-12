import { PlayerId } from '../../api/types'
import { api } from '../../api/ws-api'
import { LivePlayerButton } from '../../components/player_icon/player_icon'

// Types
type PlayerSelectorProps = {
    selectedPlayers: PlayerId[]
    setSelectedPlayers: React.Dispatch<React.SetStateAction<PlayerId[]>>
    setHoverInfo: (info?: string) => void
}

// React components
function PlayerSelector({
    selectedPlayers,
    setSelectedPlayers,
    setHoverInfo
}: PlayerSelectorProps) {

    // Rendering
    const hoverHandlers = (setHover: (s?: string) => void, text?: string) => ({
        onMouseEnter: () => setHover(text),
        onMouseLeave: () => setHover(undefined)
    })

    return (
        <div>
            {Array.from(api.players.values()).map(player => {
                const selected = selectedPlayers.includes(player.id)

                return (
                    <LivePlayerButton
                        key={player.id}
                        playerId={player.id}
                        selected={selected}
                        onClick={() =>
                            setSelectedPlayers(prev =>
                                prev.includes(player.id)
                                    ? prev.filter(p => p !== player.id)
                                    : [...prev, player.id]
                            )
                        }
                        {...hoverHandlers(
                            setHoverInfo,
                            selected
                                ? `Hide statistics for ${player.name}`
                                : `Show statistics for ${player.name}`
                        )}
                    />
                )
            })}
        </div>
    )
}

// Exports
export { PlayerSelector }
