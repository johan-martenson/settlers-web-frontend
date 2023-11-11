import React, { useState } from 'react'
import './expand_collapse_toggle.css'
import { Button } from '@fluentui/react-components'
import { ChevronUp24Filled, ChevronDown24Filled } from '@fluentui/react-icons'

interface ExpandCollapseToggleProps {
    expanded?: boolean
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

    if (inverted) {
        if (expanded) {
            return (<Button icon={<ChevronUp24Filled onClick={onClick} />} appearance='transparent' />)
        } else {
            return (<Button icon={<ChevronDown24Filled onClick={onClick} />} appearance='transparent' />)
        }
    }

    if (expanded) {
        return (<Button icon={<ChevronDown24Filled onClick={onClick} />} appearance='transparent' />)
    } else {
        return (<Button icon={<ChevronUp24Filled onClick={onClick} />} appearance='transparent' />)
    }
}

export default ExpandCollapseToggle