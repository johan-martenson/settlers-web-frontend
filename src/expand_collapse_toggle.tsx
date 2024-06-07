import React, { useState } from 'react'
import './expand_collapse_toggle.css'
import { Button } from '@fluentui/react-components'
import { ChevronUp24Filled, ChevronDown24Filled } from '@fluentui/react-icons'

interface ExpandCollapseToggleProps {
    inverted?: boolean
    onExpand: (() => void)
    onCollapse: (() => void)
}

const ExpandCollapseToggle = ({ inverted, onCollapse, onExpand }: ExpandCollapseToggleProps) => {
    const [expanded, setExpanded] = useState<boolean>(false)

    function onClick(): void {
        if (expanded) {
            onCollapse()
        } else {
            onExpand()
        }

        setExpanded(!expanded)
    }

    if ((inverted && expanded) || (!inverted && !expanded)) {
        return (
            <span className="ExpandCollapseToggle">
                <Button icon={<ChevronUp24Filled onClick={onClick} />} appearance='transparent' />
            </span>
        )
    } else {
        return (
            <span className="ExpandCollapseToggle">
                <Button icon={<ChevronDown24Filled onClick={onClick} />} appearance='transparent' />
            </span>
        )

    }
}

export default ExpandCollapseToggle