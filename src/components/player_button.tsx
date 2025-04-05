import React, { useEffect, useState } from 'react'
import { PlayerId, PlayerInformation } from '../api/types'
import { api } from '../api/ws-api'
import { Button } from '@fluentui/react-components'
import { playerToColor } from '../pretty_strings'

type PlayerButtonProps = {
    playerId: PlayerId
    selected?: boolean
    onClick?: () => void
}

const PlayerButton = ({ playerId, selected = false, onClick }: PlayerButtonProps) => {
    const [player, setPlayer] = useState<PlayerInformation | undefined>(api.players.get(playerId))

    useEffect(() => {
        const playerListener = (player: PlayerInformation) => setPlayer(player)
        api.addPlayerInformationListener(playerId, playerListener)

        return () => api.removePlayerInformationListener(playerId, playerListener)
    }, [playerId])

    return (
        <>
            {player && <Button
                key={player.id}
                style={{
                    borderBottomColor: selected ? playerToColor(player.color) : undefined,
                    borderBottomWidth: selected ? '3px' : undefined
                }}
                onClick={onClick}
            >
                <span
                    style={{
                        display: 'inline-block',
                        backgroundColor: playerToColor(player.color),
                        width: '1em',
                        height: '1em'
                    }}
                />
                {player.name}
            </Button>}

            {player === undefined && <div>...</div>}
        </>
    )
}

export default PlayerButton;