import { Tooltip } from '@fluentui/react-components'
import React, { useMemo } from 'react'
import { PlayerColor } from '../api/types'

// Types
type ColorBoxProps = {
    color: PlayerColor
    inline?: boolean
}

// React components
const ColorBox = ({ color, inline }: ColorBoxProps) => {

    // Memos
    const style = useMemo(() => {
        return {
            width: '1em',
            height: '1em',
            margin: '2px',
            backgroundColor: color.toLowerCase(),
            border: '2px solid rgba(0, 0, 0, 0)',
            padding: '2px',
            display: inline ? 'inline-block' : 'block'
        }
    }, [])

    // Rendering
    return (<Tooltip content={color.toLowerCase()} relationship='description' withArrow key={color} >
        <div style={style} />
    </Tooltip>)
}

export { ColorBox }