import React, { Component } from 'react'
import { GameId, getGameInformation, PlayerId, PlayerInformation } from './api'
import Button from './button'
import { Dialog, DialogSection } from './dialog'
import SelectPlayer from './select_player'

interface MainMenuProps {
    gameId: GameId
    currentPlayerId: PlayerId
    onPlayerSelected: ((player: PlayerInformation) => void)
    onSetTransportPriority: (() => void)
    onStatistics: (() => void)
    onClose: (() => void)
    onChoose: (() => void)
    onHelp: (() => void)
    onLeaveGame: (() => void)
}

interface MainMenuState {
    currentSpeed?: number
    state: "MAIN" | "OPTIONS" | "HELP"
}

class MainMenu extends Component<MainMenuProps, MainMenuState> {

    constructor(props: MainMenuProps) {
        super(props)

        this.state = {
            currentSpeed: 4,
            state: "MAIN"
        }
    }

    async componentDidMount() {

        await getGameInformation(this.props.gameId)

        this.setState({ currentSpeed: 50 }) //game.tickLength})
    }

    onOptions(): void {
        this.setState(
            {
                state: "OPTIONS"
            }
        )
    }

    onPlayerSelected(player: PlayerInformation): void {
        this.props.onPlayerSelected(player)
    }

    render() {

        return (
            <Dialog heading="Menu" onCloseDialog={this.props.onClose} floating={true}>

                <DialogSection label="Select player">
                    <SelectPlayer onPlayerSelected={this.props.onPlayerSelected}
                        currentPlayer={this.props.currentPlayerId}
                        gameId={this.props.gameId}
                    />
                </DialogSection>

                <DialogSection label="Game Utils">
                    <Button label="Statistics" onButtonClicked={this.props.onStatistics} />
                    <Button label="Set transport priority" onButtonClicked={this.props.onSetTransportPriority} />
                </DialogSection>

                <DialogSection>
                    <Button label="Options" onButtonClicked={this.props.onChoose} />
                    <Button label="Help" onButtonClicked={this.props.onHelp} />
                    <Button label="Leave game" onButtonClicked={this.props.onLeaveGame} />
                </DialogSection>

            </Dialog>
        )
    }
}

export default MainMenu
