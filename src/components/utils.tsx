import { Tooltip } from '@fluentui/react-components'
import React from 'react'
import { PlayerColor } from '../api/types'

// Types
type ColorBoxProps = {
    color: PlayerColor
    inline?: boolean
}

// React components
const ColorBox = ({ color, inline }: ColorBoxProps) => {
    return (<Tooltip content={color.toLocaleLowerCase()} relationship='label' withArrow key={color} >
        <div
            style={{
                width: "1em",
                height: "1em",
                margin: "2px",
                backgroundColor: color.toLowerCase(),
                border: "2px solid rgba(0, 0, 0, 0)",
                padding: "2px",
                display: inline ? 'inline' : 'inline-block'
            }}
        />
    </Tooltip>)
}

export { ColorBox }