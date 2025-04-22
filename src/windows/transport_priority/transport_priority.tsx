import React, { useCallback, useEffect, useState } from 'react'
import { Window } from '../../components/dialog'
import './transport_priority.css'
import { Material, Nation, TransportCategory, TRANSPORT_CATEGORIES } from '../../api/types'
import { InventoryIcon } from '../../icons/icon'
import { ArrowSortUp24Filled, ArrowSortDown24Filled } from '@fluentui/react-icons'
import { api } from '../../api/ws-api'
import { transportCategoryPretty } from '../../pretty_strings'
import { ItemContainer } from '../../components/item_container'

// Types
type SetTransportPriorityProps = {
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

// Constants
const CATEGORY_MATERIALS_MAP = new Map<TransportCategory, Material[]>([
    ['FOOD', ['BREAD', 'MEAT', 'FISH']],
    ['WEAPONS', ['SWORD', 'SHIELD']],
    ['TOOLS', ['METALWORKER']],
    ['IRON', ['IRON']],
    ['IRON_BAR', ['IRON_BAR']],
    ['COAL', ['COAL']],
    ['GOLD', ['GOLD']],
    ['PLANK', ['PLANK']],
    ['WOOD', ['WOOD']],
    ['STONE', ['STONE']],
    ['COIN', ['COIN']],
    ['WHEAT', ['WHEAT']],
    ['WATER', ['WATER']],
    ['PIG', ['PIG']],
    ['FLOUR', ['FLOUR']],
    ['BOAT', ['BOAT']],
])

// React components
const SetTransportPriority = ({ nation, onClose, onRaise }: SetTransportPriorityProps) => {
    const [selected, setSelected] = useState<TransportCategory>('PLANK')
    const [priority, setPriority] = useState<TransportCategory[]>(api.transportPriority ?? Array.from(TRANSPORT_CATEGORIES))
    const [hoverInfo, setHoverInfo] = useState<string>()

    useEffect(() => {
        const listener = (priority: TransportCategory[]) => {
            console.log('Updating transport priority')
            setPriority(priority)
        }

        async function readCurrentPriorities(): Promise<void> {
            api.addTransportPriorityListener(listener)
        }

        readCurrentPriorities()

        return () => api.removeTransportPriorityListener(listener)
    }, [])

    const increasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        console.log(`Current priority for ${category}: ${currentPriority}`)

        if (currentPriority > 0) {
            api.setTransportPriorityForMaterial(category, currentPriority - 1)
        }
    }, [priority])

    const decreasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        console.log(`Current priority for ${category}: ${currentPriority}`)

        if (currentPriority < TRANSPORT_CATEGORIES.size - 1) {
            api.setTransportPriorityForMaterial(category, currentPriority + 1)
        }
    }, [priority])

    return (
        <Window heading='Transport priority' onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <ItemContainer>
                {priority.map(category => {
                    const className = selected === category ? 'chosen-material' : 'material'
                    const categoryDisplayName = transportCategoryPretty(category)

                    return (
                        <div key={category}>
                            <div
                                className={className}
                                style={{ display: 'inline' }}
                                onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                    if (event.code === 'ArrowUp') {
                                        increasePriority(selected)
                                    } else if (event.code === 'ArrowDown') {
                                        decreasePriority(selected)
                                    }
                                }}
                                onMouseEnter={() => setHoverInfo(`Set priority for ${categoryDisplayName.toLocaleLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                                onClick={() => setSelected(category)}

                                tabIndex={-1}
                            >{CATEGORY_MATERIALS_MAP.get(category)?.map(material =>
                                <InventoryIcon material={material} nation={nation} inline key={material} scale={selected === category ? 2 : 1} />
                            )}
                            </div>
                            {selected === category && (
                                <>
                                    <ArrowSortUp24Filled
                                        onClick={() => increasePriority(selected)}
                                        onMouseEnter={() => setHoverInfo('Raise priority')}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    />
                                    <ArrowSortDown24Filled
                                        onClick={() => decreasePriority(selected)}
                                        onMouseEnter={() => setHoverInfo('Lower priority')}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    />
                                </>
                            )}
                        </div>
                    )
                })}
            </ItemContainer>
        </Window >)
}

export { SetTransportPriority }
