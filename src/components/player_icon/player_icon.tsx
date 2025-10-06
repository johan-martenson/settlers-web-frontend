import React, { useEffect, useState } from 'react'
import { PlayerColor, PlayerId, PlayerInformation } from '../../api/types'
import { api } from '../../api/ws-api'
import { Button } from '@fluentui/react-components'
import { playerToColor } from '../../pretty_strings'
import './player_icon.css'

// Types
type StaticPlayerIconProps = {
    color: PlayerColor
    name: string
    selected?: boolean
}

type PlayerButtonProps = {
    playerId: PlayerId
    selected?: boolean
    onClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

// Functions
function createPlayerIcon(name: string, color: PlayerColor, selected: boolean = false): JSX.Element {
    return (
        <div
            key={name}
            className={selected ? 'player-icon selected' : 'player-icon'}
            style={{
                borderBottomColor: selected ? playerToColor(color) : undefined
            }}
        >
            <span
                className='colored-square'
                style={{
                    backgroundColor: playerToColor(color)
                }}
            />
            {name}
        </div>
    )
}


// React components
const StaticPlayerIcon = ({ name, color, selected = false }: StaticPlayerIconProps) => {
    return createPlayerIcon(name, color, selected)
}

const LivePlayerIcon = ({ playerId }: PlayerButtonProps) => {
    const [player, setPlayer] = useState<PlayerInformation | undefined>(api.players.get(playerId))

    useEffect(() => {
        const playerListener = (player: PlayerInformation) => setPlayer(player)
        api.addPlayerInformationListener(playerId, playerListener)

        return () => api.removePlayerInformationListener(playerId, playerListener)
    }, [playerId])

    return (
        <>
            {player ?
                <div key={player.id}>
                    {createPlayerIcon(player.name, player.color)}
                </div>
                :
                <div>...</div>}
        </>
    )
}

const PlayerButtonOld = ({ playerId, selected = false, onClick }: PlayerButtonProps) => {
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
                    borderBottomWidth: selected ? '3px' : undefined,
                    columnGap: '1em'
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

const LivePlayerButton = ({ playerId, selected = false, onClick, onMouseEnter, onMouseLeave }: PlayerButtonProps) => {
    return (
        <Button
            key={playerId}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className='player-button'
            style={{ backgroundColor: selected ? 'lightblue' : undefined }}

        >
            <LivePlayerIcon playerId={playerId} onClick={onClick} />
        </Button>
    )
}

export {
    StaticPlayerIcon,
    LivePlayerIcon,
    LivePlayerButton
}