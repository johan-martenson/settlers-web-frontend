import { PLAYER_COLORS, PlayerColor, PlayerInformation } from "../../api/types"
import { api } from "../../api/ws-api"

async function addComputerPlayer(players: PlayerInformation[], maxPlayers: number): Promise<void> {
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

    const nextColor = colorsRemaining.values().next().value

    if (nextColor) {
        const newPlayer = await api.createPlayer(
            `Computer Player ${nextPlayer}`,
            nextColor,
            'ROMANS',
            'COMPUTER'
        )

        await api.addPlayerToGame(api.gameId ?? '', newPlayer.id)
    } else {
        console.error('No color available for computer player')
    }
}

export { addComputerPlayer }