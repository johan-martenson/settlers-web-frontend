import React, { ChangeEvent, useState } from 'react'
import { Text, CardHeader, Caption1, Card, Button, Input, InputOnChangeData, Field, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Tooltip } from "@fluentui/react-components"
import './player.css'
import { NATIONS, Nation, PLAYER_COLORS, PlayerColor, PlayerInformation } from './api/types'
import { MoreHorizontal20Regular } from "@fluentui/react-icons"
import { WorkerIcon } from './icons/icon'

interface PlayerProps {
    isSelf?: boolean
    player: PlayerInformation
    availableColors: Set<PlayerColor>
    onPlayerRemoved?: (() => void)
    onPlayerUpdated?: ((name: string, nation: Nation, color: PlayerColor) => void)
}

const Player = ({ player, isSelf, availableColors, onPlayerRemoved, onPlayerUpdated }: PlayerProps) => {
    const [editName, setEditName] = useState<string | undefined>()
    const [editNation, setEditNation] = useState<Nation>(player.nation)
    const [editColor, setEditColor] = useState<PlayerColor>(player.color)
    const [isEditing, setIsEditing] = useState<boolean>(false)

    const nationPrettyString = player.nation.charAt(0).toUpperCase() + player.nation.slice(1).toLowerCase()

    function updatePlayer(): void {
        if (!onPlayerUpdated) {
            console.log("No player updated callback provided")

            return
        }

        const updatedName = editName ?? player.name
        const updatedNation = editNation ?? player.nation
        const updatedColor = editColor ?? player.color

        onPlayerUpdated(updatedName, updatedNation, updatedColor)
    }

    console.log(player)

    return (
        <Card>
            <CardHeader
                header={(isEditing) ?
                    <div className='player-edit'>
                        <Field label="Name">
                            <Input
                                type="text"
                                placeholder={player.name}
                                onChange={(_event: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setEditName(data.value)}
                                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (event.key === 'Enter') {
                                        updatePlayer()

                                        setIsEditing(false)
                                    }
                                }} />
                        </Field>

                        <Field label="Nation">
                            <div style={{ display: "flex", flexDirection: "row" }}>
                                {Array.from(NATIONS)
                                    .map(nation => (
                                        <div
                                            style={{
                                                border: (nation === editNation) ? "2px solid lightgray" : "2px solid rgba(0, 0, 0, 0)",
                                                margin: "2px",
                                                padding: "2px"
                                            }}
                                            onClick={() => setEditNation(nation)} key={nation}
                                        >
                                            <Tooltip content={nation.toLocaleLowerCase()} relationship='label' withArrow key={"BLUE"} >
                                                <div>
                                                    <WorkerIcon worker='General' color="BLUE" nation={nation} scale={2} />
                                                </div>
                                            </Tooltip>
                                        </div>
                                    ))}
                            </div>
                        </Field>

                        <Field label="Color">
                            <div style={{ display: "flex", flexDirection: "row" }} >
                                {PLAYER_COLORS
                                    .filter(color => availableColors.has(color) || color === player.color)
                                    .map(color => (
                                        <Tooltip content={color.toLocaleLowerCase()} relationship='label' withArrow key={color} >
                                            <div
                                                style={{
                                                    width: "1em",
                                                    height: "1em",
                                                    margin: "2px",
                                                    backgroundColor: color.toLowerCase(),
                                                    border: (color === editColor) ? "2px solid lightgray" : "2px solid rgba(0, 0, 0, 0)",
                                                    padding: "2px"
                                                }}
                                                onClick={() => setEditColor(color)}
                                            />
                                        </Tooltip>
                                    ))}
                            </div>
                        </Field>

                        <Button onClick={() => {
                            updatePlayer()

                            setIsEditing(false)
                        }} >Ok</Button>

                    </div>
                    :
                    <Text weight="semibold">
                        {player.name} {player.type === "COMPUTER" && "(computer)"}
                        {isSelf && "(me)"}
                    </Text>}
                description={isEditing ? <></> :
                    <Caption1>
                        {nationPrettyString}, {player.type === "COMPUTER" && "computer player"}
                        {isSelf && "me"}, {player.color.toLocaleLowerCase()}
                    </Caption1>
                }
                action={<Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <Button
                            appearance="transparent"
                            icon={<MoreHorizontal20Regular />}
                            aria-label="More options"
                        />
                    </MenuTrigger>

                    <MenuPopover>
                        <MenuList>
                            <MenuItem onClick={() => setIsEditing(true)}>Edit</MenuItem>
                            <MenuItem onClick={() => onPlayerRemoved && onPlayerRemoved()}>Remove</MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
                }
            />
            <p>
            </p>
        </Card>
    )
}

export { Player }

