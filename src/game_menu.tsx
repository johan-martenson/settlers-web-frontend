import React, { ChangeEvent, Component } from 'react';
import { GameId, PlayerId, PlayerInformation } from './api';
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable';
import { Button, Divider, Field, Slider, SliderOnChangeData, Switch, SwitchOnChangeData } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import SelectPlayer from './select_player';
import './game_menu.css'

interface GameMenuProps {
    gameId: GameId
    currentPlayerId: PlayerId
    maxZoom: number
    minZoom: number
    currentZoom: number
    currentShowTitles: boolean
    currentSpeed: number
    isOpen: boolean
    isMusicPlayerVisible: boolean
    isTypingControllerVisible: boolean
    defaultZoom: number

    onChangedZoom: ((scale: number) => void)
    onPlayerSelected: ((player: PlayerInformation) => void)
    adjustSpeed: ((speed: number) => void)
    setShowTitles: ((showTitles: boolean) => void)
    onLeaveGame: (() => void)
    onStatistics: (() => void)
    onHelp: (() => void)
    onSetTransportPriority: (() => void)
    onClose: (() => void)
    onSetMusicPlayerVisible: ((visible: boolean) => void)
    onSetTypingControllerVisible: ((visible: boolean) => void)
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
                        Menu
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                    <div className='menu'>
                        <Field label='Zoom'>
                            <Slider max={this.props.maxZoom}
                                min={this.props.minZoom}
                                defaultValue={this.props.currentZoom}
                                step={1}
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => this.props.onChangedZoom(data.value)}
                            />
                            <Button onClick={(ev) => {
                                this.props.onChangedZoom(this.props.defaultZoom)
                                // TODO: adjust the scale slider as well
                            }} >Reset</Button>
                        </Field>
                        <Field label='Show house titles'>
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.setShowTitles(data.checked)}
                                defaultChecked={this.props.currentShowTitles} />
                        </Field>
                        <Field label='Set game speed'>
                            <Slider max={10}
                                min={1}
                                defaultValue={this.props.currentSpeed}
                                step={1}
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => this.props.adjustSpeed(data.value)}
                            />
                        </Field>

                        <Field label='Show music player'>
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.onSetMusicPlayerVisible(data.checked)}
                                defaultChecked={this.props.isMusicPlayerVisible}
                            />
                        </Field>

                        <Field label='Show typing controller'>
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.onSetTypingControllerVisible(data.checked)}
                                defaultChecked={this.props.isTypingControllerVisible}
                            />
                        </Field>

                        <Button onClick={() => {
                            this.props.onStatistics()

                            this.props.onClose()
                        }
                        }
                        >Statistics</Button>
                        <Button onClick={() => {
                            this.props.onSetTransportPriority()

                            this.props.onClose()
                        }
                        }
                        >Set transport priority</Button>
                        <Button onClick={() => {
                            this.props.onHelp

                            this.props.onClose()
                        }
                        }
                        >Help</Button>

                        <Divider />

                        <Button onClick={this.props.onLeaveGame} >Leave game</Button>
                    </div>
                </DrawerBody>
            </Drawer>
        )
    }
}

export default GameMenu;
