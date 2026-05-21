import React, { ChangeEvent, useState } from 'react'
import { isSpeed } from '../../api/types'
import { Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components/unstable'
import { Button, Divider, Dropdown, Field, Slider, SliderOnChangeData, Switch, SwitchOnChangeData, Option, SelectionEvents, OptionOnSelectData } from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import './game-menu.css'
import { DEFAULT_HEIGHT_ADJUSTMENT } from '../../render/constants'
import { DEFAULT_VOLUME } from '../../screens/play/play'
import { api } from '../../api/ws-api'
import { useGame } from '../../utils/hooks/hooks'

// Types
type GameMenuProps = {
    maxZoom: number
    minZoom: number
    defaultZoom: number

    areTitlesVisible: boolean
    isOpen: boolean
    isMusicPlayerVisible: boolean
    isTypingControllerVisible: boolean
    isAvailableConstructionVisible: boolean
    isAnimateMapScrollingSet: boolean
    isAnimateZoomingSet: boolean

    onChangedZoom: (scale: number) => void
    onSetTitlesVisible: (showTitles: boolean) => void
    onLeaveGame: () => void
    onStatistics: () => void
    onHelp: () => void
    onSetTransportPriority: () => void
    onClose: () => void
    onSetMusicPlayerVisible: (visible: boolean) => void
    onSetTypingControllerVisible: (visible: boolean) => void
    onSetAvailableConstructionVisible: (visible: boolean) => void
    onSetMusicVolume: (volume: number) => void
    onSetSoundEffectsVolume: (volume: number) => void
    onSetHeightAdjust: (heightAdjust: number) => void
    onSetAnimateMapScrolling: (shouldAnimate: boolean) => void
    onSetAnimateZooming: (shouldAnimate: boolean) => void
    onQuota: () => void
    onManageToolPriorities: () => void
    onViewMap: () => void
}


// Configuration
export const GameMenuLogConfig = {
    all: false
}


// React components
const GameMenu = ({
    minZoom,
    maxZoom,
    defaultZoom,
    isOpen,
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
    onManageToolPriorities,
    onQuota,
    onViewMap
}: GameMenuProps
) => {
    // State
    const [zoom, setZoom] = useState<number>(defaultZoom)

    // Monitoring hooks
    const gameInformation = useGame()

    // Rendering
    return (
        <Drawer
            type='overlay'
            separator
            open={isOpen}
            onOpenChange={onClose}
            onWheel={(event: React.WheelEvent) => event.stopPropagation()}
        >
            <DrawerHeader>
                <DrawerHeaderTitle
                    action={
                        <Button
                            appearance='subtle'
                            aria-label='Close'
                            icon={<Dismiss24Regular />}
                            onClick={onClose}
                        />
                    }
                >
                    Menu
                </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody>
                {gameInformation === undefined ?
                    <div>Loading...</div>
                    :
                    <div className='menu'>
                        <Field label='Zoom'>
                            <Slider
                                max={maxZoom}
                                min={minZoom}
                                value={zoom}
                                step={1}
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                    if (GameMenuLogConfig.all) {
                                        console.log(`Zoom to ${data.value}`)
                                    }

                                    onChangedZoom(data.value)
                                    setZoom(data.value)
                                }}
                            />
                            <Button onClick={() => {
                                if (GameMenuLogConfig.all) {
                                    console.log(`Reset zoom to ${defaultZoom}`)
                                }

                                onChangedZoom(defaultZoom)
                                setZoom(defaultZoom)
                            }}
                            >
                                Reset
                            </Button>
                        </Field>
                        <Field label='Set game speed'>
                            <Dropdown
                                value={gameInformation.gameSpeed ?? ''}
                                onOptionSelect={(_event: SelectionEvents, data: OptionOnSelectData) => {
                                    const speed = data.optionValue?.toUpperCase()
                                    if (speed !== undefined && isSpeed(speed)) {
                                        api.setGameSpeed(speed)
                                    }
                                }}
                            >
                                <Option value='VERY_FAST'>Very fast</Option>
                                <Option value='FAST'>Fast</Option>
                                <Option value='NORMAL'>Normal</Option>
                                <Option value='SLOW'>Slow</Option>
                            </Dropdown>
                        </Field>
                        <Field label='Show house titles'>
                            <Switch
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTitlesVisible(data.checked)}
                                checked={areTitlesVisible} />
                        </Field>

                        <Field label='Show music player'>
                            <Switch
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetMusicPlayerVisible(data.checked)}
                                checked={isMusicPlayerVisible}
                            />
                        </Field>

                        <Field label='Show typing controller'>
                            <Switch
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetTypingControllerVisible(data.checked)}
                                checked={isTypingControllerVisible}
                            />
                        </Field>
                        <Field label='Show available construction'>
                            <Switch
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAvailableConstructionVisible(data.checked)}
                                checked={isAvailableConstructionVisible}
                            />
                        </Field>

                        <Field label='Animate scrolling in map'>
                            <Switch
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAnimateMapScrolling(data.checked)}
                                checked={isAnimateMapScrollingSet}
                            />
                        </Field>
                        <Field label='Animate zooming'>
                            <Switch
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => onSetAnimateZooming(data.checked)}
                                checked={isAnimateZoomingSet}
                            />
                        </Field>

                        <Button onClick={() => {
                            onStatistics()
                            onClose()
                        }}
                        >
                            Statistics
                        </Button>
                        <Button onClick={() => {
                            onSetTransportPriority()
                            onClose()
                        }}
                        >
                            Set transport priority
                        </Button>
                        <Button onClick={() => {
                            onQuota()
                            onClose()
                        }}>
                            Set quota
                        </Button>
                        <Button onClick={() => {
                            onManageToolPriorities()
                            onClose()
                        }}>
                            Manage tool priorities
                        </Button>

                        <Button
                            onClick={() => {
                                onViewMap()
                                onClose()
                            }}
                        >
                            View map
                        </Button>

                        <Button onClick={() => {
                            onHelp()
                            onClose()
                        }}
                        >
                            Help
                        </Button>

                        <Field label='Sound effects volume'>
                            <Slider
                                min={0.0}
                                max={1.0}
                                step={0.1}
                                defaultValue={DEFAULT_VOLUME}
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                    onSetSoundEffectsVolume(data.value)
                                }} />
                        </Field>

                        <Field label='Music volume'>
                            <Slider
                                min={0.0}
                                max={1.0}
                                step={0.1}
                                defaultValue={DEFAULT_VOLUME}
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                    onSetMusicVolume(data.value)
                                }} />
                        </Field>

                        <Field label='Depth'>
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

                        {gameInformation.status === 'STARTED' &&
                            <Button onClick={() => api.gameId && api.pauseGame(api.gameId)} >Pause</Button>
                        }

                        {gameInformation.status === 'PAUSED' &&
                            <Button onClick={() => api.gameId && api.resumeGame(api.gameId)} >Resume</Button>
                        }

                        <Divider />

                        <Button onClick={onLeaveGame} >Leave game</Button>
                    </div>
                }
            </DrawerBody>
        </Drawer>
    )
}

export default GameMenu
