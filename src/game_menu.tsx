import React, { ChangeEvent, Component } from 'react';
import { GameId, PlayerId, PlayerInformation } from './api';
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable';
import { Button, Slider, SliderOnChangeData, Switch, SwitchOnChangeData } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import SelectPlayer from './select_player';

interface GameMenuProps {
    gameId: GameId
    currentPlayerId: PlayerId
    maxZoom: number
    minZoom: number
    currentZoom: number
    currentShowTitles: boolean
    currentSpeed: number
    isOpen: boolean

    onChangedZoom: ((scale: number) => void)
    onPlayerSelected: ((player: PlayerInformation) => void)
    adjustSpeed: ((speed: number) => void)
    setShowTitles: ((showTitles: boolean) => void)
    onLeaveGame: (() => void)
    onStatistics: (() => void)
    onHelp: (() => void)
    onSetTransportPriority: (() => void)
    onClose: (() => void)
}
interface GameMenuState {
}

class GameMenu extends Component<GameMenuProps, GameMenuState> {

    constructor(props: GameMenuProps) {
        super(props);

        this.state = {
            isOpen: false
        };
    }

    render(): JSX.Element {

        console.log(this.props)

        return (
            <Drawer
                type='overlay'
                separator
                open={this.props.isOpen}
                onOpenChange={() => this.props.onClose()}>
                <DrawerHeader>

                    <DrawerHeaderTitle
                        action={
                            <Button
                                appearance="subtle"
                                aria-label="Close"
                                icon={<Dismiss24Regular />}
                                onClick={() => this.props.onClose()}
                            />
                        }
                    >
                        Default Drawer
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                    <SelectPlayer onPlayerSelected={this.props.onPlayerSelected}
                        currentPlayer={this.props.currentPlayerId}
                        gameId={this.props.gameId}
                    />
                    <Button onClick={this.props.onLeaveGame} >Leave game</Button>
                    <Slider max={this.props.maxZoom}
                        min={this.props.minZoom}
                        defaultValue={this.props.currentZoom}
                        step={1}
                        onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => this.props.onChangedZoom(data.value)}
                    />
                    <Switch
                        onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.setShowTitles(data.checked)}
                        defaultChecked={this.props.currentShowTitles} />

                    <Slider max={10}
                        min={1}
                        defaultValue={this.props.currentSpeed}
                        step={1}
                        onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => this.props.adjustSpeed(data.value)}
                    />
                    <Button onClick={this.props.onStatistics} >Statistics</Button>
                    <Button onClick={this.props.onSetTransportPriority} >Set transport priority</Button>
                    <Button onClick={this.props.onHelp} >Help</Button>
                </DrawerBody>
            </Drawer>
        )
    }
}

export default GameMenu;
