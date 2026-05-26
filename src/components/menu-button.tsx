import React from 'react'
import { CalendarAgenda28Filled } from '@fluentui/react-icons'

// Types
type MenuButtonProps = {
    onMenuButtonClicked: (() => void)
}

// React components
const MenuButton = ({ onMenuButtonClicked }: MenuButtonProps) => {
    return (
        <div className='MenuButton'
            onClick={event => {
                onMenuButtonClicked()
                event.stopPropagation()
            }}
            onTouchStart={event => {
                onMenuButtonClicked()
                event.stopPropagation()
            }}
        >
            <CalendarAgenda28Filled />
        </div>
    )
}

export default MenuButton
