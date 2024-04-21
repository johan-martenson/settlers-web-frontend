import React, { ChangeEvent, useState } from 'react'
import { Text, CardHeader, Caption1, Card, Button, Input, InputOnChangeData, Field, Dropdown, Option, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, SelectionEvents, OptionOnSelectData } from "@fluentui/react-components"
import './player.css'
import { NATIONS, Nation, PLAYER_COLORS, PlayerColor, PlayerInformation, isNation } from './api/types'
import { MoreHorizontal20Regular } from "@fluentui/react-icons"

interface PlayerProps {
    isSelf?: boolean
    player: PlayerInformation
    availableColors: Set<PlayerColor>
    onPlayerRemoved?: (() => void)
    onPlayerUpdated?: ((name: string, nation: Nation, color: PlayerColor) => void)
}

const Player = ({ player, isSelf, availableColors, onPlayerRemoved, onPlayerUpdated }: PlayerProps) => {

    const [editName, setEditName] = useState<string | undefined>()
    const [editNation, setEditNation] = useState<Nation | undefined>()
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

    return (
        <Card>
            <CardHeader
                header={(isEditing) ?
                    <div className='player-edit'>
                        <Field label="Name">
                            <Input
                                type="text"
                                placeholder={player.name}
                                onChange={(ev: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setEditName(data.value)}
                                onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (ev.key === 'Enter') {
                                        updatePlayer()

                                        setEditName(undefined)
                                        setEditNation(undefined)

                                        setIsEditing(false)
                                    }
                                }} />
                        </Field>

                        <Field label="Nation">
                            <Dropdown defaultValue={player.nation} onOptionSelect={(a: SelectionEvents, b: OptionOnSelectData) => isNation(b.optionValue) && setEditNation(b.optionValue)}>
                                {Array.from(NATIONS).map(nation => { return <Option key={nation}>{nation}</Option> })}
                            </Dropdown>
                        </Field>

                        <Field label="Color">
                            <div style={{ display: "flex", flexDirection: "row" }} >
                                {PLAYER_COLORS
                                    .filter(color => availableColors.has(color) || color === player.color)
                                    .map(color => (
                                        <div
                                            key={color}
                                            style={{
                                                width: "1em",
                                                height: "1em",
                                                margin: "0.5em",
                                                backgroundColor: color.toLowerCase()
                                            }}
                                            onClick={() => setEditColor(color)}
                                        />
                                    ))}
                            </div>
                        </Field>

                        <Button onClick={() => {
                            updatePlayer()

                            setEditName(undefined)
                            setEditNation(undefined)

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

