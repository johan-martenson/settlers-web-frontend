import React from 'react'
import './item_container.css'

type ItemContainerProps = {
    children?: React.ReactNode
    inline?: boolean
    rows?: boolean
    height?: string
    padding?: string
    width?: string
}

const ItemContainer = ({ children, height, padding, inline, width, rows = false }: ItemContainerProps) => {
    return (<div
        className='item-container'
        style={{
            flexDirection: rows ? 'row' : 'column',
            height,
            padding,
            width,
            display: inline ? 'inline-flex' : 'flex' }}>
        {children}
    </div>)
}

export { ItemContainer }
