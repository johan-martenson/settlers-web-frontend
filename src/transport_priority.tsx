import React, { useState } from 'react'
import { setTransportPriorityForMaterial } from './api/rest-api'
import { Window } from './components/dialog'
import './transport_priority.css'
import { GameId, PlayerId, Material, Nation, TransportCategories, TRANSPORT_CATEGORIES } from './api/types'
import { Tooltip } from '@fluentui/react-components'
import { InventoryIcon } from './icons/icon'
import { ArrowSortUp24Filled, ArrowSortDown24Filled } from '@fluentui/react-icons'

interface SetTransportPriorityProps {
    gameId: GameId
    playerId: PlayerId
    nation: Nation

    onRaise: (() => void)
    onClose: (() => void)
}

const CATEGORY_MATERIALS_MAP = new Map<TransportCategories, Material[]>()

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

const SetTransportPriority = ({ playerId, gameId, nation, onClose, onRaise }: SetTransportPriorityProps) => {
    const [selected, setSelected] = useState<TransportCategories>('PLANK')
    const [priority, setPriority] = useState<TransportCategories[]>(Array.from(TRANSPORT_CATEGORIES))

    async function increasePriority(category: TransportCategories): Promise<void> {
        const currentPriority = priority.findIndex(e => e === category)

        console.log("Current priority for " + category + ": " + currentPriority)

        if (currentPriority <= 0) {
            return
        }

        const updatedPriority = Object.assign([], priority)

        await setTransportPriorityForMaterial(gameId, playerId, category, currentPriority - 1)

        delete updatedPriority[currentPriority]

        updatedPriority.splice(currentPriority - 1, 0, category)

        setPriority(updatedPriority)
    }

    async function decreasePriority(category: TransportCategories): Promise<void> {
        const currentPriority = priority.findIndex(e => e === category)

        console.log("Current priority for " + category + ": " + currentPriority)

        if (currentPriority == TRANSPORT_CATEGORIES.size) {
            return
        }

        const updatedPriority = Object.assign([], priority)

        await setTransportPriorityForMaterial(gameId, playerId, category, currentPriority + 1)

        delete updatedPriority[currentPriority]

        updatedPriority.splice(currentPriority + 2, 0, category)

        setPriority(updatedPriority)
    }

    return (
        <Window heading="Transport priority" onClose={onClose} onRaise={onRaise}>
            <div className='transport-priority-list'>
                {priority.map(
                    (category, index) => {
                        const icon = <Tooltip content={category} relationship={'label'} withArrow>
                            <div style={{ display: 'inline' }} onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                if (event.code === 'ArrowUp') {
                                    increasePriority(selected)
                                } else if (event.code === 'ArrowDown') {
                                    decreasePriority(selected)
                                }
                            }}
                                tabIndex={-1}
                            >{CATEGORY_MATERIALS_MAP.get(category)?.map(material =>
                                <InventoryIcon material={material} nation={nation} inline key={material} />
                            )}
                            </div>
                        </Tooltip>

                        if (selected === category) {
                            return <div key={category}>{icon}<ArrowSortUp24Filled
                                onClick={async () => increasePriority(selected)} />
                                <ArrowSortDown24Filled onClick={async () => decreasePriority(selected)} /></div>
                        }

                        return <div onClick={() => setSelected(category)} key={index}>{icon}</div>
                    }
                )
                }
            </div>
        </Window >)
}

export { SetTransportPriority }
