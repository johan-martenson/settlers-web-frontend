import React, { useState } from 'react'
import { setTransportPriorityForMaterial } from './api/rest-api'
import { Dialog } from './dialog'
import './transport_priority.css'
import { GameId, PlayerId, MaterialAllUpperCase, Nation, TransportCategoriesUpperCase, TRANSPORT_CATEGORIES_UPPER_CASE } from './api/types'
import { Tooltip } from '@fluentui/react-components'
import { InventoryIcon } from './icon'
import { ArrowSortUp24Filled, ArrowSortDown24Filled } from '@fluentui/react-icons'

interface SetTransportPriorityProps {
    gameId: GameId
    playerId: PlayerId
    nation: Nation

    onClose: (() => void)
}

const CATEGORY_MATERIALS_MAP = new Map<TransportCategoriesUpperCase, MaterialAllUpperCase[]>()

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

const SetTransportPriority = ({ playerId, gameId, nation, onClose }: SetTransportPriorityProps) => {
    const [selected, setSelected] = useState<TransportCategoriesUpperCase>('PLANK')
    const [priority, setPriority] = useState<TransportCategoriesUpperCase[]>(Array.from(TRANSPORT_CATEGORIES_UPPER_CASE))

    async function increasePriority(category: TransportCategoriesUpperCase): Promise<void> {
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

    async function decreasePriority(category: TransportCategoriesUpperCase): Promise<void> {
        const currentPriority = priority.findIndex(e => e === category)

        console.log("Current priority for " + category + ": " + currentPriority)

        if (currentPriority == TRANSPORT_CATEGORIES_UPPER_CASE.size) {
            return
        }

        const updatedPriority = Object.assign([], priority)

        await setTransportPriorityForMaterial(gameId, playerId, category, currentPriority + 1)

        delete updatedPriority[currentPriority]

        updatedPriority.splice(currentPriority + 2, 0, category)

        setPriority(updatedPriority)
    }

    return (
        <Dialog heading="Transport priority" floating onCloseDialog={() => onClose()}>
            <div className='transport-priority-list'>
                {priority.map(
                    (category, index) => {
                        const icon = <Tooltip content={category} relationship={'label'} withArrow>
                            <div style={{ display: 'inline' }} onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                if (e.code === 'ArrowUp') {
                                    increasePriority(selected)
                                } else if (e.code === 'ArrowDown') {
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
        </Dialog >)
}

export { SetTransportPriority }
