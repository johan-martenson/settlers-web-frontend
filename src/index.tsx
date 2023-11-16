import React, { Component, PropsWithChildren, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FillInPlayerInformation } from './fill_in_player_information'
import './index.css'
import { Lobby } from './lobby'
import { getPlayers } from './api/rest-api'
import App from './App'
import { FluentProvider, makeStyles, teamsDarkTheme, tokens } from '@fluentui/react-components'
import { GameId, PlayerId } from './api/types'

interface GameInitProps { }
interface GameInitState {
    state: "ENTER_PLAYER_INFORMATION" | "LOBBY" | "PLAY_GAME"
    player?: string
    gameId?: GameId
    selfPlayerId?: PlayerId
}

class GameInit extends Component<GameInitProps, GameInitState> {

    constructor(props: GameInitProps) {
        super(props)

        this.state = {
            state: "ENTER_PLAYER_INFORMATION"
        }
    }

    async componentDidMount(): Promise<void> {

        const urlParams = new URLSearchParams(window.location.search)
        const gameId = urlParams.get("gameId")
        const playerId = urlParams.get("playerId")

        if (gameId) {
            let selfPlayerId = playerId

            if (selfPlayerId === null || selfPlayerId === undefined) {
                selfPlayerId = (await getPlayers(gameId))[0].id
            }

            this.setState(
                {
                    state: "PLAY_GAME",
                    gameId: gameId,
                    selfPlayerId: selfPlayerId
                }
            )
        }
    }

    onPlayerInformationDone(name: string): void {

        console.log("Player entering lobby: " + name)

        this.setState(
            {
                player: name,
                state: "LOBBY"
            }
        )

        console.log("Now in lobby")
    }

    render(): JSX.Element {

        return (
            <div>
                {this.state.state === "ENTER_PLAYER_INFORMATION" &&
                    <FillInPlayerInformation onPlayerInformationDone={this.onPlayerInformationDone.bind(this)} />
                }

                {this.state.state === "LOBBY" && this.state.player &&
                    <Lobby playerName={this.state.player} />
                }

                {this.state.state === "PLAY_GAME" && this.state.gameId && this.state.selfPlayerId &&
                    <App gameId={this.state.gameId}
                        selfPlayerId={this.state.selfPlayerId}
                        onLeaveGame={
                            () => this.setState({ state: "LOBBY" })
                        }
                    />
                }
            </div>
        )
    }
}

const container = document.getElementById('root')

if (container) {
    const root = createRoot(container)

    root.render(
        <FluentProvider theme={teamsDarkTheme}>
            <AppWrapper>
                <GameInit />
            </AppWrapper>
        </FluentProvider>)
}

const useStyles = makeStyles({
    wrapper: {
        backgroundColor: tokens.colorNeutralBackground2,
        width: "100%",
        height: "100%"
    }
})

function AppWrapper({ children }: PropsWithChildren) {
    const className = useStyles()

    return (<div className={className.wrapper}>{children}</div>)
}
