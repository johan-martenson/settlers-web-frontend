import React from 'react'
import './item_container.css'

type ItemContainerProps = {
    children?: React.ReactNode
    inline?: boolean
    rows?: boolean
    height?: string
    padding?: string
    width?: string
    style?: React.CSSProperties
    center?: boolean
}

const ItemContainer = ({ children, height, padding, inline, width, rows = false, center, style }: ItemContainerProps) => {
    return (<div
        className='item-container'
        style={{
            ...style,
            flexDirection: rows ? 'row' : 'column',
            alignContent: center ? 'center' : undefined,
            height,
            padding,
            width,
            display: inline ? 'inline-flex' : 'flex' }}>
        {children}
    </div>)
}

export { ItemContainer }
