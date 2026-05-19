import React from 'react'
import { Button } from '@fluentui/react-components'
import { Player } from './player'
import './manage_players.css'
import { Nation, PlayerColor, PLAYER_COLORS, PlayerId, GameId } from '../../api/types'
import { api } from '../../api/ws-api'
import { addComputerPlayer } from '../../api/utils'
import { usePlayers } from '../../utils/hooks/hooks'


// Types
type ManagePlayersProps = {
    selfPlayerId: PlayerId
    maxPlayers: number
    gameId: GameId
}

// React components
/**
 * ManagePlayers component that manages the list of players, allowing the addition of computer players
 * and updating player information.
 * 
 * @param {ManagePlayersProps} props - The props for the ManagePlayers component.
 */
const ManagePlayers = ({ selfPlayerId, maxPlayers, gameId }: ManagePlayersProps) => {

    // Monitoring hooks
    const players = usePlayers(gameId)

    // Rendering
    const availableColors = new Set<PlayerColor>(PLAYER_COLORS)
    players.forEach(player => availableColors.delete(player.color))

    return (
        <div className='player-list'>

            {players.map(player => (
                <div key={player.id}>

                    <Player
                        isSelf={player.id === selfPlayerId}
                        player={player}
                        availableColors={availableColors}
                        onPlayerUpdated={(name: string, nation: Nation, color: PlayerColor) => {
                            localStorage.setItem('playerName', name)
                            localStorage.setItem('playerNation', nation)

                            api.updatePlayer(player.id, name, color, nation)
                        }}
                        onPlayerRemoved={() => {
                            if (player.id === selfPlayerId) {
                                console.error('Cannot remove self player')

                                return
                            }

                            api.removePlayer(player.id)
                        }}
                    />
                </div>
            ))}

            <Button
                onClick={() => addComputerPlayer(players, maxPlayers)}
                disabled={players.length >= maxPlayers}
            >
                Add computer player
            </Button>
        </div>
    )
}

export default ManagePlayers
