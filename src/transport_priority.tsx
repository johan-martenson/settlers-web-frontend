import React, { useCallback, useEffect, useState } from 'react'
import { Window } from './components/dialog'
import './transport_priority.css'
import { Material, Nation, TransportCategory, TRANSPORT_CATEGORIES } from './api/types'
import { Tooltip } from '@fluentui/react-components'
import { InventoryIcon } from './icons/icon'
import { ArrowSortUp24Filled, ArrowSortDown24Filled } from '@fluentui/react-icons'
import { api } from './api/ws-api'

// Types
type SetTransportPriorityProps = {
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

// Constants
const CATEGORY_MATERIALS_MAP = new Map<TransportCategory, Material[]>()

CATEGORY_MATERIALS_MAP.set('FOOD', ['BREAD', 'MEAT', 'FISH'])
CATEGORY_MATERIALS_MAP.set('WEAPONS', ['SWORD', 'SHIELD'])
CATEGORY_MATERIALS_MAP.set('TOOLS', ['METALWORKER'])
CATEGORY_MATERIALS_MAP.set('IRON', ['IRON'])
CATEGORY_MATERIALS_MAP.set('IRON_BAR', ['IRON_BAR'])
CATEGORY_MATERIALS_MAP.set('COAL', ['COAL'])
CATEGORY_MATERIALS_MAP.set('GOLD', ['GOLD'])
CATEGORY_MATERIALS_MAP.set('PLANK', ['PLANK'])
CATEGORY_MATERIALS_MAP.set('WOOD', ['WOOD'])
CATEGORY_MATERIALS_MAP.set('STONE', ['STONE'])
CATEGORY_MATERIALS_MAP.set('COIN', ['COIN'])
CATEGORY_MATERIALS_MAP.set('WHEAT', ['WHEAT'])
CATEGORY_MATERIALS_MAP.set('WATER', ['WATER'])
CATEGORY_MATERIALS_MAP.set('PIG', ['PIG'])
CATEGORY_MATERIALS_MAP.set('FLOUR', ['FLOUR'])
CATEGORY_MATERIALS_MAP.set('BOAT', ['BOAT'])

// React components
const SetTransportPriority = ({ nation, onClose, onRaise }: SetTransportPriorityProps) => {
    const [selected, setSelected] = useState<TransportCategory>('PLANK')
    const [priority, setPriority] = useState<TransportCategory[]>(api.transportPriority ?? Array.from(TRANSPORT_CATEGORIES))
    const [hoverInfo, setHoverInfo] = useState<string>()

    useEffect(
        () => {
            const listener = (priority: TransportCategory[]) => {
                console.log('Updating transport priority')
                setPriority(priority)
            }

            async function readCurrentPriorities(): Promise<void> {
                api.addTransportPriorityListener(listener)
            }

            readCurrentPriorities()

            return () => api.removeTransportPriorityListener(listener)
        }, []
    )

    const increasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        console.log(`Current priority for ${category}: ${currentPriority}`)

        if (currentPriority <= 0) {
            return
        }

        api.setTransportPriorityForMaterial(category, currentPriority - 1)
    }, [priority])

    const decreasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        console.log(`Current priority for ${category}: ${currentPriority}`)

        if (currentPriority === TRANSPORT_CATEGORIES.size) {
            return
        }

        api.setTransportPriorityForMaterial(category, currentPriority + 1)
    }, [priority])

    return (
        <Window heading="Transport priority" onClose={onClose} onRaise={onRaise} hoverInfo={hoverInfo}>
            <div className='transport-priority-list'>
                {priority.map(
                    category => {
                        const className = selected === category ? 'chosen-material' : 'material'
                    
                        const icon = <Tooltip content={category} relationship={'label'} withArrow>
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
                                onMouseEnter={() => setHoverInfo(`Set priority for ${category.toLocaleLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}

                                tabIndex={-1}
                            >{CATEGORY_MATERIALS_MAP.get(category)?.map(material =>
                                <InventoryIcon material={material} nation={nation} inline key={material} />
                            )}
                            </div>
                        </Tooltip>

                        if (selected === category) {
                            return (
                                <div key={category}>
                                    {icon}
                                    <ArrowSortUp24Filled
                                        onClick={async () => increasePriority(selected)}
                                        onMouseEnter={() => setHoverInfo(`Raise priority`)}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    />
                                    <ArrowSortDown24Filled
                                        onClick={async () => decreasePriority(selected)}
                                        onMouseEnter={() => setHoverInfo(`Lower priority`)}
                                        onMouseLeave={() => setHoverInfo(undefined)}
                                    />

                                </div>)
                        }

                        return <div onClick={() => setSelected(category)} key={category}>{icon}</div>
                    }
                )
                }
            </div>
        </Window >)
}

export { SetTransportPriority }
