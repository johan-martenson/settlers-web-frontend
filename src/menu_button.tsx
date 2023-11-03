import React from 'react'
import { CalendarAgenda28Filled } from "@fluentui/react-icons"

interface MenuButtonProps {
    onMenuButtonClicked: (() => void)
}

const MenuButton = ({ onMenuButtonClicked }: MenuButtonProps) => {
    return (
        <div className="MenuButton"
            onClick={
                (event) => {
                    onMenuButtonClicked()
                    event.stopPropagation()
                }
            }
            onTouchStart={
                (event) => {
                    onMenuButtonClicked()
                    event.stopPropagation()
                }
            }
        >
            <CalendarAgenda28Filled />
        </div>
    )
}

export default MenuButton
