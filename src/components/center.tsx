import React from 'react'
import './center.css'

// Types
type CenterProps = {
    children: React.ReactNode
}

// React components
function Center({children}: CenterProps) {
    return (
        <div className='center'>
            {children}
        </div>
    )
}

export { Center }