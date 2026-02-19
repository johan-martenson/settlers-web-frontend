import React, { useEffect, useState } from 'react'
import { Button } from '@fluentui/react-components'
import { Player } from './player'
import './manage_players.css'
import { PlayerType, PlayerInformation, Nation, PlayerColor, PLAYER_COLORS, PlayerId, GameInformation } from '../../api/types'
import { GameListener, api } from '../../api/ws-api'
import { addComputerPlayer } from './utils'

// Types
export type PlayerCandidateType = {
    name: string
    color: PlayerColor
    type: PlayerType
}

type ManagePlayersProps = {
    selfPlayerId: PlayerId
    maxPlayers: number
}

// React components
/**
 * ManagePlayers component that manages the list of players, allowing the addition of computer players
 * and updating player information.
 * 
 * @param {ManagePlayersProps} props - The props for the ManagePlayers component.
 */
const ManagePlayers = ({ selfPlayerId, maxPlayers }: ManagePlayersProps) => {
    const [players, setPlayers] = useState<PlayerInformation[]>(Array.from(api.players.values()))

    useEffect(() => {
        const listener: GameListener = {
            onGameInformationChanged: (gameInformation: GameInformation) => setPlayers(gameInformation.players)
        }

        async function startListening(): Promise<void> {
            const { players } = await api.getGameInformation()

            setPlayers(players)

            api.addGameStateListener(listener)
        }

        startListening()

        return () => api.removeGameStateListener(listener)
    }, [])

    const availableColors = new Set<PlayerColor>(PLAYER_COLORS)
    players.forEach(player => availableColors.delete(player.color))

    return (
        <div className='player-list'>

            {players.map(player => (
                <div key={player.id}>

                    {player.id === selfPlayerId &&
                        <Player
                            key={player.id}
                            isSelf={true}
                            availableColors={availableColors}
                            onPlayerUpdated={(name: string, nation: Nation, color: PlayerColor) => {
                                localStorage.setItem('playerName', name)
                                localStorage.setItem('playerNation', nation)

                                api.updatePlayer(player.id, name, color, nation)
                            }}
                            player={player}
                        />
                    }

                    {player.id !== selfPlayerId &&
                        <Player
                            key={player.id}
                            player={player}
                            availableColors={availableColors}
                            onPlayerUpdated={(name: string, nation: Nation, color: PlayerColor) => {
                                api.updatePlayer(player.id, name, color, nation)
                            }}
                            onPlayerRemoved={() => { api.removePlayer(player.id) }}
                        />
                    }
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
