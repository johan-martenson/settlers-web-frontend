import React from 'react'
import { Button, Subtitle1 } from "@fluentui/react-components"
import { Player } from './player'
import './manage_players.css'
import { updatePlayer, removePlayerFromGame } from './api/rest-api'
import { PlayerType, PlayerInformation, GameId, Nation, PlayerColor, PLAYER_COLORS, PlayerId } from './api/types'
import { monitor } from './api/ws-api'

export interface PlayerCandidateType {
    name: string
    color: PlayerColor
    type: PlayerType
}

interface ManagePlayersProps {
    selfPlayerId: PlayerId
    gameId: GameId
    maxPlayers: number
    players: PlayerInformation[]
    onPlayerAdded?: ((player: PlayerInformation) => void)
    onPlayerRemoved?: ((player: PlayerInformation) => void)
}

const ManagePlayers = ({ selfPlayerId, gameId, players, maxPlayers, onPlayerRemoved, onPlayerAdded }: ManagePlayersProps) => {
    async function onPlayerUpdated(name: string, nation: Nation, color: PlayerColor, index: number): Promise<void> {
        const playerToUpdate = players[index]
        await updatePlayer(gameId, playerToUpdate.id, name, nation, color)
    }

    async function removePlayer(player: PlayerInformation): Promise<void> {
        await removePlayerFromGame(gameId, player.id)

        onPlayerRemoved && onPlayerRemoved(player)
    }

    async function addComputerPlayer(): Promise<void> {
        let nextPlayer = undefined

        for (let i = 0; i < maxPlayers; i++) {
            if (players.find(player => player.name === 'Computer Player ' + i) === undefined) {
                nextPlayer = i

                break
            }
        }

        if (nextPlayer === undefined) {
            return
        }

        const colorsRemaining = new Set<PlayerColor>(PLAYER_COLORS)

        players.forEach(player => colorsRemaining.delete(player.color))

        const nextColor = colorsRemaining.values().next()

        if (nextColor.value) {
            const addedPlayer = await monitor.addPlayerToGame(
                "Computer Player " + nextPlayer,
                nextColor.value,
                'ROMANS',
                'COMPUTER')

            onPlayerAdded && onPlayerAdded(addedPlayer)
        } else {
            console.error("No color available for computer player")
        }
    }

    const availableColors: Set<PlayerColor> = new Set()

    PLAYER_COLORS.forEach(color => availableColors.add(color))

    players.forEach(player => availableColors.delete(player.color))

    return (
        <div className="player-list">

            <Subtitle1 as="h4" block>Players</Subtitle1>

            {players.map(
                (player, index) => {
                    return (
                        <div key={index}>

                            {player.id === selfPlayerId &&
                                <Player key={index} isSelf={true}
                                    availableColors={availableColors}
                                    onPlayerUpdated={
                                        (name: string, nation: Nation, color: PlayerColor) => {
                                            onPlayerUpdated(name, nation, color, index)
                                        }
                                    }
                                    player={player}
                                />
                            }

                            {player.id !== selfPlayerId &&
                                <Player key={index} player={player}
                                    availableColors={availableColors}
                                    onPlayerUpdated={
                                        (name: string, nation: Nation, color: PlayerColor) => {
                                            onPlayerUpdated(name, nation, color, index)
                                        }
                                    }
                                    onPlayerRemoved={() => { removePlayer(player) }}
                                />
                            }
                        </div>
                    )
                }
            )}

            <Button
                onClick={() => addComputerPlayer()}
                disabled={players.length >= maxPlayers}
            >Add computer player</Button>
        </div>
    )
}

export default ManagePlayers
