import React, { useEffect, useState } from 'react'
import { Button, Subtitle1 } from "@fluentui/react-components"
import { Player } from './player'
import './manage_players.css'
import { PlayerType, PlayerInformation, Nation, PlayerColor, PLAYER_COLORS, PlayerId } from './api/types'
import { GameListener, monitor } from './api/ws-api'

export interface PlayerCandidateType {
    name: string
    color: PlayerColor
    type: PlayerType
}

interface ManagePlayersProps {
    selfPlayerId: PlayerId
    maxPlayers: number
}

const ManagePlayers = ({ selfPlayerId, maxPlayers }: ManagePlayersProps) => {
    const [players, setPlayers] = useState<PlayerInformation[]>(Array.from(monitor.players.values()))

    useEffect(
        () => {
            const listener: GameListener = {
                onPlayersChanged: (players: PlayerInformation[]) => setPlayers(players)
            }

            async function startListening() {
                const { players } = await monitor.getGameInformation()

                console.log(players)

                setPlayers(players)

                monitor.listenToGameState(listener)
            }

            startListening()

            return () => monitor.stopListeningToGameState(listener)
        }, []
    )

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
            const newPlayer = await monitor.createPlayer("Computer Player " + nextPlayer,
                nextColor.value,
                'ROMANS',
                'COMPUTER')

            await monitor.addPlayerToGame(newPlayer.id)
        } else {
            console.error("No color available for computer player")
        }
    }

    const availableColors: Set<PlayerColor> = new Set()

    PLAYER_COLORS.forEach(color => availableColors.add(color))

    players.forEach(player => availableColors.delete(player.color))

    console.log(players)

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
                                            monitor.updatePlayer(player.id, name, color, nation)
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
                                            monitor.updatePlayer(player.id, name, color, nation)
                                        }
                                    }
                                    onPlayerRemoved={() => { monitor.removePlayer(player.id) }}
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
