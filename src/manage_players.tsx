import React, { useState } from 'react'
import { Button, Subtitle1 } from "@fluentui/react-components"
import { Player } from './player'
import './manage_players.css'
import { addComputerPlayerToGame, getPlayers, updatePlayer, removePlayerFromGame } from './api/rest-api'
import { PlayerType, PlayerInformation, GameId, Nation } from './api/types'

export interface PlayerCandidateType {
    name: string
    color: string
    type: PlayerType
}

interface ManagePlayersProps {
    selfPlayer: PlayerInformation
    gameId: GameId
    defaultComputerPlayers: number
    maxPlayers: number
    onPlayerAdded?: ((player: PlayerInformation) => void)
    onPlayerRemoved?: ((player: PlayerInformation) => void)
}

const ManagePlayers = ({ selfPlayer, gameId, maxPlayers, onPlayerRemoved, onPlayerAdded }: ManagePlayersProps) => {
    const [players, setPlayers] = useState<PlayerInformation[]>([selfPlayer])


    async function onPlayerUpdated(name: string, nation: Nation, index: number): Promise<void> {

        const playerToUpdate = players[index]
        await updatePlayer(gameId, playerToUpdate.id, name, nation, playerToUpdate.color)

        const updatedPlayers = await getPlayers(gameId)
        setPlayers(updatedPlayers)
    }

    async function removePlayer(player: PlayerInformation): Promise<void> {

        await removePlayerFromGame(gameId, player.id)

        const updatedPlayers = await getPlayers(gameId)
        setPlayers(updatedPlayers)

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

        const newComputerPlayer: PlayerCandidateType = {
            name: "Computer Player " + nextPlayer,
            type: "COMPUTER",
            color: "#777777"
        }

        const addedPlayer = await addComputerPlayerToGame(gameId, newComputerPlayer.name, newComputerPlayer.color, 'ROMANS')

        const updatedPlayers = await getPlayers(gameId)
        setPlayers(updatedPlayers)

        onPlayerAdded && onPlayerAdded(addedPlayer)
    }

    return (
        <div className="player-list">

            <Subtitle1 as="h4" block>Players</Subtitle1>

            {players.map(
                (player, index) => {
                    return (
                        <div key={index}>

                            {player.id === selfPlayer.id &&
                                <Player key={index} isSelf={true}
                                    onPlayerUpdated={
                                        (name: string, nation: Nation) => {
                                            onPlayerUpdated(name, nation, index)
                                        }
                                    }
                                    player={player}
                                />
                            }

                            {player.id !== selfPlayer.id &&
                                <Player key={index} player={player}
                                    onPlayerUpdated={
                                        (name: string, nation: Nation) => {
                                            onPlayerUpdated(name, nation, index)
                                        }
                                    }
                                    onPlayerRemoved={() => { removePlayer(player) }}
                                />
                            }
                        </div>
                    )
                }
            )}
            <Button onClick={() => addComputerPlayer()} >Add computer player</Button>
        </div>
    )
}

export default ManagePlayers
