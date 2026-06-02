import React, { useEffect, useRef } from 'react'
import './item_container.css'

// Types
type ItemContainerProps = {
    children?: React.ReactNode
    inline?: boolean
    rows?: boolean
    height?: string
    padding?: string
    width?: string
    style?: React.CSSProperties
    center?: boolean
    autoScroll?: boolean
}

// React components
const ItemContainer = ({ children, height, padding, inline, width, rows = false, autoScroll = false, center, style }: ItemContainerProps) => {

    // References
    const containerRef = useRef<HTMLDivElement>(null)    

    // Effects
    // Effect: Scroll to latest message
    useEffect(() => {
        if (!autoScroll) {
            return
        }

        const element = containerRef.current

        if (element) {
            const isNearBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight < 50

            if (isNearBottom) {
                element.scrollTop = element.scrollHeight
            }
        }
    }, [children])

    // Rendering
    return (<div
        className='item-container'
        ref={containerRef}
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
