import React, { ChangeEvent, useEffect, useState } from 'react'
import { GameSpeed } from './api/types'
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable'
import { Button, Divider, Dropdown, Field, Slider, SliderOnChangeData, Switch, SwitchOnChangeData, Option, SelectionEvents, OptionOnSelectData } from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import './game_menu.css'
import { DEFAULT_HEIGHT_ADJUSTMENT, DEFAULT_SCALE } from './render/constants'
import { DEFAULT_VOLUME } from './play'
import { monitor } from './api/ws-api'

interface GameMenuProps {
    maxZoom: number
    minZoom: number
    areTitlesVisible: boolean
    isOpen: boolean
    isMusicPlayerVisible: boolean
    isTypingControllerVisible: boolean
    isAvailableConstructionVisible: boolean
    isAnimateMapScrollingSet: boolean
    isAnimateZoomingSet: boolean
    defaultZoom: number

    onChangedZoom: ((scale: number) => void)
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
    onSetSoundEffectsVolume: (volume: number) => void
    onSetHeightAdjust: ((heightAdjust: number) => void)
    onSetAnimateMapScrolling: ((shouldAnimate: boolean) => void)
    onSetAnimateZooming: ((shouldAnimate: boolean) => void)
    onQuota: (() => void)
}

const GameMenu = (
    { minZoom,
        maxZoom,
        isOpen,
        defaultZoom,
        areTitlesVisible,
        isMusicPlayerVisible,
        isTypingControllerVisible,
        isAvailableConstructionVisible,
        isAnimateMapScrollingSet,
        isAnimateZoomingSet,
        onClose,
        onChangedZoom,
        onSetTitlesVisible,
        onSetMusicPlayerVisible,
        onSetTypingControllerVisible,
        onSetAvailableConstructionVisible,
        onLeaveGame,
        onStatistics,
        onHelp,
        onSetTransportPriority,
        onSetMusicVolume,
        onSetSoundEffectsVolume,
        onSetHeightAdjust,
        onSetAnimateMapScrolling,
        onSetAnimateZooming,
        onQuota }: GameMenuProps
) => {
    const [zoom, setZoom] = useState<number>(DEFAULT_SCALE)
    const [gameSpeed, setGameSpeed] = useState<GameSpeed>('NORMAL')

    useEffect(
        () => {
            setGameSpeed(monitor.gameSpeed)

            const callback = {
                onGameSpeedChanged: (gameSpeed: GameSpeed) => setGameSpeed(gameSpeed)
            }

            monitor.listenToGameState(callback)

            return () => monitor.stopListeningToGameState(callback)
        },
        []
    )

    return (
        <Drawer type='overlay' separator open={isOpen} onOpenChange={() => onClose()} onWheel={(event) => event.stopPropagation()}>
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
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
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
                        <Dropdown value={gameSpeed.charAt(0).toUpperCase() + gameSpeed.substring(1).toLocaleLowerCase()} onOptionSelect={(_event: SelectionEvents, data: OptionOnSelectData) => {
                            if (data.optionValue === 'Fast') {
                                monitor.setGameSpeed('FAST')
                            } else if (data.optionValue === 'Normal') {
                                monitor.setGameSpeed('NORMAL')
                            } else {
                                monitor.setGameSpeed('SLOW')
                            }
                        }}>
                            <Option>Fast</Option>
                            <Option>Normal</Option>
                            <Option>Slow</Option>
                        </Dropdown>
                    </Field>
                    <Field label='Show house titles'>
                        <Switch
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTitlesVisible(data.checked)}
                            defaultChecked={areTitlesVisible} />
                    </Field>

                    <Field label='Show music player'>
                        <Switch
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetMusicPlayerVisible(data.checked)}
                            defaultChecked={isMusicPlayerVisible}
                        />
                    </Field>

                    <Field label='Show typing controller'>
                        <Switch
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTypingControllerVisible(data.checked)}
                            defaultChecked={isTypingControllerVisible}
                        />
                    </Field>
                    <Field label="Show available construction">
                        <Switch
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAvailableConstructionVisible(data.checked)}
                            defaultChecked={isAvailableConstructionVisible}
                        />
                    </Field>

                    <Field label="Animate scrolling in map">
                        <Switch
                            onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAnimateMapScrolling(data.checked)}
                            defaultChecked={isAnimateMapScrollingSet}
                        />
                    </Field>
                    <Field label="Animate zooming">
                        <Switch
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAnimateZooming(data.checked)}
                            defaultChecked={isAnimateZoomingSet}
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
                        onQuota()

                        onClose()
                    }}>Set quota</Button>
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
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                onSetSoundEffectsVolume(data.value)
                            }} />
                    </Field>

                    <Field label="Music volume">
                        <Slider
                            min={0.0}
                            max={1.0}
                            step={0.1}
                            defaultValue={DEFAULT_VOLUME}
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                onSetMusicVolume(data.value)
                            }} />
                    </Field>

                    <Field label="Depth">
                        <Slider
                            min={0.0}
                            max={30}
                            step={0.5}
                            defaultValue={DEFAULT_HEIGHT_ADJUSTMENT}
                            onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                onSetHeightAdjust(data.value)
                            }}
                        />
                    </Field>

                    {monitor.gameState === 'STARTED' &&
                        <Button onClick={() => monitor.pauseGame()} >Pause</Button>
                    }

                    {monitor.gameState === 'PAUSED' &&
                        <Button onClick={() => monitor.resumeGame()} >Resume</Button>
                    }

                    <Divider />

                    <Button onClick={() => onLeaveGame()} >Leave game</Button>
                </div>
            </DrawerBody>
        </Drawer>
    )
}

export default GameMenu
