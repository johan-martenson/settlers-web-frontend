import React, { ChangeEvent, useState } from 'react'
import { GameId, PlayerId } from './api/types'
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable'
import { Button, Divider, Dropdown, Field, Slider, SliderOnChangeData, Switch, SwitchOnChangeData, Option } from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import './game_menu.css'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE } from './game_render'
import { sfx } from './sound/sound_effects'
import { DEFAULT_VOLUME } from './App'

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
    onSetMusicVolume: ((volume: number) => void)
    onSetHeightAdjust: ((heightAdjust: number) => void)
}

const GameMenu = (
    { minZoom, maxZoom, isOpen, defaultZoom, areTitlesVisible, isMusicPlayerVisible, isTypingControllerVisible, isAvailableConstructionVisible,
        onClose, onChangedZoom, onSetTitlesVisible, onSetMusicPlayerVisible, onSetTypingControllerVisible, onSetAvailableConstructionVisible, onLeaveGame, onStatistics,
        onHelp, onSetTransportPriority, onSetMusicVolume, onSetHeightAdjust }: GameMenuProps
) => {
    const [zoom, setZoom] = useState<number>(DEFAULT_SCALE)

    return (
        <Drawer type='overlay' separator open={isOpen} onOpenChange={() => onClose()}>
            <DrawerHeader>

                <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onClose()} />} >
                    Menu
                </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>
                <div className='menu'>
                    <Field label='Zoom'>
                        <Slider max={maxZoom}
                            min={minZoom}
                            value={zoom}
                            step={1}
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                onChangedZoom(data.value)

                                setZoom(data.value)
                            }}
                        />
                        <Button onClick={() => {
                            onChangedZoom(defaultZoom)

                            setZoom(DEFAULT_SCALE)
                        }} >Reset</Button>
                    </Field>
                    <Field label='Set game speed'>
                        <Dropdown defaultValue={"Normal"} onOptionSelect={(event: any, data: any) => console.log("Select new game speed: " + data.optionValue)}>
                            <Option>Fast</Option>
                            <Option>Normal</Option>
                            <Option>Slow</Option>
                        </Dropdown>
                    </Field>
                    <Field label='Show house titles'>
                        <Switch
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTitlesVisible(data.checked)}
                            defaultChecked={areTitlesVisible} />
                    </Field>

                    <Field label='Show music player'>
                        <Switch
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetMusicPlayerVisible(data.checked)}
                            defaultChecked={isMusicPlayerVisible}
                        />
                    </Field>

                    <Field label='Show typing controller'>
                        <Switch
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTypingControllerVisible(data.checked)}
                            defaultChecked={isTypingControllerVisible}
                        />
                    </Field>
                    <Field label="Show available construction">
                        <Switch
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAvailableConstructionVisible(data.checked)}
                            defaultChecked={isAvailableConstructionVisible}
                        />
                    </Field>

                    <Button onClick={() => {
                        onStatistics()

                        onClose()
                    }}
                    >Statistics</Button>
                    <Button onClick={() => {
                        onSetTransportPriority()

                        onClose()
                    }}
                    >Set transport priority</Button>
                    <Button onClick={() => {
                        onHelp()

                        onClose()
                    }}
                    >Help</Button>

                    <Field label="Sound effects volume">
                        <Slider
                            min={0.0}
                            max={1.0}
                            step={0.1}
                            defaultValue={DEFAULT_VOLUME}
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                sfx.setSoundEffectsVolume(data.value)
                            }} />
                    </Field>

                    <Field label="Music volume">
                        <Slider
                            min={0.0}
                            max={1.0}
                            step={0.1}
                            defaultValue={DEFAULT_VOLUME}
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                onSetMusicVolume(data.value)
                            }} />
                    </Field>

                    <Field label="Depth">
                        <Slider
                        min={0.0}
                        max={30}
                        step={0.5}
                        defaultValue={DEFAULT_HEIGHT_ADJUSTMENT}
                        onChange={(ev: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                            onSetHeightAdjust(data.value)
                        }}
                        />
                    </Field>

                    <Divider />

                    <Button onClick={() => onLeaveGame()} >Leave game</Button>
                </div>
            </DrawerBody>
        </Drawer>
    )
}

export default GameMenu
