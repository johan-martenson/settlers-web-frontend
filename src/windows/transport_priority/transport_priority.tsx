import React, { useCallback, useMemo, useState } from 'react'
import { WindowWithTyping } from '../../components/dialog'
import './transport_priority.css'
import { Material, Nation, TransportCategory, TRANSPORT_CATEGORIES } from '../../api/types'
import { api } from '../../api/ws-api'
import { ItemContainer } from '../../components/item_container'
import { useTransportPriority } from '../../utils/hooks/hooks'
import { GenericCommand } from '../../utils/typing-commands'
import { transportCategoryPretty } from '../../utils/pretty_strings'
import { InventoryIcon, UiIcon } from '../../components/icons/icon'

// Types
type SetTransportPriorityProps = {
    nation: Nation

    onRaise: () => void
    onClose: () => void
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

    // State
    const [selected, setSelected] = useState<TransportCategory>('PLANK')
    const [hoverInfo, setHoverInfo] = useState<string | undefined>()

    // Monitoring hooks
    const priority = useTransportPriority()

    // Functions
    const setMaxPriority = useCallback((category: TransportCategory) => {
        api.setTransportPriorityForMaterial(category, 0)
    }, [])

    const setMinPriority = useCallback((category: TransportCategory) => {
        api.setTransportPriorityForMaterial(category, TRANSPORT_CATEGORIES.size)
    }, [])

    const increasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        if (currentPriority > 0) {
            api.setTransportPriorityForMaterial(category, currentPriority - 1)
        }
    }, [priority])

    const decreasePriority = useCallback((category: TransportCategory) => {
        const currentPriority = priority.findIndex(e => e === category)

        if (currentPriority < TRANSPORT_CATEGORIES.size - 1) {
            api.setTransportPriorityForMaterial(category, currentPriority + 1)
        }
    }, [priority])

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map<string, GenericCommand<TransportCategory>>()

        priority.forEach(category => {
            const categoryName = transportCategoryPretty(category).toLowerCase()

            cmds.set(`Select ${categoryName}`, {
                action: () => setSelected(category),
                filter: current => current !== category
            })

            cmds.set(`Set ${categoryName} priority`, {
                type: 'NUMBER',
                parameterName: 'priority',
                min: 0,
                max: TRANSPORT_CATEGORIES.size - 1,
                action: (_current: TransportCategory, priority: number) => {
                    api.setTransportPriorityForMaterial(category, priority)
                }
            })
        })

        cmds.set('Raise priority', {
            action: (category: TransportCategory) => increasePriority(category)
        })

        cmds.set('Lower priority', {
            action: (category: TransportCategory) => decreasePriority(category)
        })

        cmds.set('Set priority', {
            type: 'NUMBER',
            parameterName: 'priority',
            min: 0,
            max: TRANSPORT_CATEGORIES.size - 1,
            action: (category: TransportCategory, priority: number) => {
                api.setTransportPriorityForMaterial(category, priority)
            }
        })

        cmds.set('Set max priority', {
            action: (category: TransportCategory) => setMaxPriority(category)
        })

        cmds.set('Set min priority', {
            action: (category: TransportCategory) => setMinPriority(category)
        })

        cmds.set('Close window', {
            action: onClose
        })

        cmds.set('Debug', {
            action: () => console.log(priority),
            hidden: true
        })

        cmds.set('Copy priorities JSON', {
            action: async () => {
                await navigator.clipboard.writeText(
                    JSON.stringify(priority, null, 2)
                )
            },
            hidden: true
        })

        return cmds
    }, [
        priority,
        increasePriority,
        decreasePriority,
        setMaxPriority,
        setMinPriority,
        onClose
    ])

    // Rendering
    return (
        <WindowWithTyping<TransportCategory>
            heading='Transport priority'
            onClose={onClose}
            onRaise={onRaise}
            commands={commands}
            param={selected}
            hoverInfo={hoverInfo}
        >
            <ItemContainer>
                {priority.map(category => {
                    const className = selected === category ? 'chosen-material' : 'material'
                    const categoryDisplayName = transportCategoryPretty(category)

                    return (
                        <div key={category}>
                            <div
                                className={className}
                                style={{ display: 'inline-block' }}
                                onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                    if (event.code === 'ArrowUp') {
                                        increasePriority(selected)
                                    } else if (event.code === 'ArrowDown') {
                                        decreasePriority(selected)
                                    }
                                }}
                                onMouseEnter={() => setHoverInfo(`Set priority for ${categoryDisplayName.toLowerCase()}`)}
                                onMouseLeave={() => setHoverInfo(undefined)}
                                onClick={() => setSelected(category)}
                                tabIndex={0}
                            >{CATEGORY_MATERIALS_MAP.get(category)?.map(material =>
                                <InventoryIcon material={material} nation={nation} inline key={material} scale={selected === category ? 2 : 1} />
                            )}
                            </div>
                        </div>
                    )
                })}
            </ItemContainer>
            <div>
                <UiIcon
                    type='ARROW_TO_TOP'
                    onClick={() => setMaxPriority(selected)}
                    onMouseEnter={() => setHoverInfo('Set max priority')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                />
                <UiIcon
                    type='UP_ARROW'
                    onClick={() => increasePriority(selected)}
                    onMouseEnter={() => setHoverInfo('Raise priority')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                />
                <UiIcon
                    type='DOWN_ARROW'
                    onClick={() => decreasePriority(selected)}
                    onMouseEnter={() => setHoverInfo('Lower priority')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                />
                <UiIcon
                    type='ARROW_TO_BOTTOM'
                    onClick={() => setMinPriority(selected)}
                    onMouseEnter={() => setHoverInfo('Set min priority')}
                    onMouseLeave={() => setHoverInfo(undefined)}
                />
            </div>

        </WindowWithTyping>)
}

export { SetTransportPriority }
