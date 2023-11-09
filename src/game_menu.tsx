import React, { ChangeEvent, Component } from 'react'
import { GameId, PlayerId } from './api/types'
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable'
import { Button, Divider, Dropdown, Field, Slider, SliderOnChangeData, Switch, SwitchOnChangeData, Option } from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import './game_menu.css'
import { DEFAULT_SCALE } from './game_render'

interface GameMenuProps {
    gameId: GameId
    currentPlayerId: PlayerId
    maxZoom: number
    minZoom: number
    currentZoom: number
    areTitlesVisible: boolean
    currentSpeed: number
    isOpen: boolean
    isMusicPlayerVisible: boolean
    isTypingControllerVisible: boolean
    isAvailableConstructionVisible: boolean
    defaultZoom: number

    onChangedZoom: ((scale: number) => void)
    onSetSpeed: ((speed: number) => void)
    onSetTitlesVisible: ((showTitles: boolean) => void)
    onLeaveGame: (() => void)
    onStatistics: (() => void)
    onHelp: (() => void)
    onSetTransportPriority: (() => void)
    onClose: (() => void)
    onSetMusicPlayerVisible: ((visible: boolean) => void)
    onSetTypingControllerVisible: ((visible: boolean) => void)
    onSetAvailableConstructionVisible: ((visible: boolean) => void)
}
interface GameMenuState {
    zoom: number
    isOpen: boolean
}

class GameMenu extends Component<GameMenuProps, GameMenuState> {
    constructor(props: GameMenuProps) {
        super(props)

        this.state = {
            zoom: DEFAULT_SCALE,
            isOpen: false
        }
    }

    render(): JSX.Element {

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
                                value={this.state.zoom}
                                step={1}
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                    this.props.onChangedZoom(data.value)

                                    this.setState({ zoom: data.value })
                                }}
                            />
                            <Button onClick={() => {
                                this.props.onChangedZoom(this.props.defaultZoom)

                                this.setState({ zoom: DEFAULT_SCALE })
                            }} >Reset</Button>
                        </Field>
                        <Field label='Set game speed'>
                            <Dropdown defaultValue={"Normal"} onOptionSelect={(event: any, data: any) => console.log("Select new game speed: " + data.optionValue)}>
                                <Option>
                                    Fast
                                </Option>
                                <Option>
                                    Normal
                                </Option>
                                <Option>
                                    Slow
                                </Option>
                            </Dropdown>
                        </Field>
                        <Field label='Show house titles'>
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.onSetTitlesVisible(data.checked)}
                                defaultChecked={this.props.areTitlesVisible} />
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
                        <Field label="Show available construction">
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => this.props.onSetAvailableConstructionVisible(data.checked)}
                                defaultChecked={this.props.isAvailableConstructionVisible}
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
                            this.props.onHelp()

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

export default GameMenu
