import React, { ChangeEvent, useState } from 'react'
import { Text, CardHeader, Caption1, Card, Button, Input, InputOnChangeData, Field, Dropdown, Option, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components"
import './player.css'
import { NATIONS, Nation, PlayerInformation } from './api/types'
import { MoreHorizontal20Regular } from "@fluentui/react-icons"

interface PlayerProps {
    isSelf?: boolean
    player: PlayerInformation
    onPlayerRemoved?: (() => void)
    onPlayerUpdated?: ((name: string, nation: Nation) => void)
}

const Player = ({ player, isSelf, onPlayerRemoved, onPlayerUpdated }: PlayerProps) => {

    const [editName, setEditName] = useState<string | undefined>()
    const [editNation, setEditNation] = useState<Nation | undefined>()
    const [isEditing, setIsEditing] = useState<boolean>(false)

    const nationPrettyString = player.nation.charAt(0).toUpperCase() + player.nation.slice(1).toLowerCase()

    function updatePlayer(): void {
        if (!onPlayerUpdated) {
            console.log("No player updated callback provided")

            return
        }

        const updatedName = editName ?? player.name
        const updatedNation = editNation ?? player.nation

        onPlayerUpdated(updatedName, updatedNation)
    }

    return (
        <Card>
            <CardHeader
                header={(isEditing) ?
                    <div>
                        <Field label="Set name">
                            <Input
                                type="text"
                                className="SetNameField"
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

                        <Field label="Set nation">
                            <Dropdown defaultValue={'ROMANS'} onOptionSelect={(a: any, b: any) => setEditNation(b.optionValue)}>
                                {Array.from(NATIONS).map(nation => { return <Option key={nation}>{nation}</Option> })}
                            </Dropdown>
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
                description={
                    <Caption1>
                        {nationPrettyString}, {player.type === "COMPUTER" && "computer player"}
                        {isSelf && "me"}
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

