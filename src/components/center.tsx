import React from 'react'
import './center.css'

type CenterProps = {
    children: React.ReactNode
}

function Center({children}: CenterProps) {
    return (
        <div className='center'>
            {children}
        </div>
    )
}

export { Center }