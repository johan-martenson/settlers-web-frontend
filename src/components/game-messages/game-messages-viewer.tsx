import { useEffect, useRef, useState } from 'react'
import { Button } from '@fluentui/react-components'
import ExpandCollapseToggle from '../expand_collapse_toggle/expand_collapse_toggle'
import './game-messages-viewer.css'
import { api } from '../../api/ws-api'
import { Point, GameMessage, Nation } from '../../api/types'
import { ItemContainer } from '../item_container'
import { useGameMessages } from '../../utils/hooks/hooks'
import { HouseIcon, InventoryIcon, UiIcon } from '../icons/icon'
import { ShipIcon } from '../icons/ship'

/// Types
type GameMessagesViewerProps = {
    nation: Nation

    onGoToPoint: (point: Point) => void
}

type DisplayedMessage = {
    message: GameMessage
    collapsedCount: number
}

type MessageFilterMode = 'SHOW' | 'COLLAPSE' | 'HIDE'

/// Constants
const MAX_RECENT_MESSAGE_TYPES = 3

const MESSAGE_TYPES: GameMessage['type'][] = [
    'MILITARY_BUILDING_OCCUPIED',
    'NO_MORE_RESOURCES',
    'MILITARY_BUILDING_READY',
    'UNDER_ATTACK',
    'GEOLOGIST_FIND',
    'BUILDING_LOST',
    'BUILDING_CAPTURED',
    'STORE_HOUSE_IS_READY',
    'MILITARY_BUILDING_CAUSED_LOST_LAND',
    'TREE_CONSERVATION_PROGRAM_ACTIVATED',
    'TREE_CONSERVATION_PROGRAM_DEACTIVATED',
    'BOMBARDED_BY_CATAPULT',
    'HARBOR_IS_FINISHED',
    'SHIP_READY_FOR_EXPEDITION',
    'SHIP_HAS_REACHED_DESTINATION',
    'GAME_ENDED',
]

/// Functions
function removeMessage(message: GameMessage): void {
    api.removeMessage(message.id)
}

function getMessageTypeName(type: GameMessage['type']): string {
    switch (type) {
        case 'MILITARY_BUILDING_OCCUPIED':
            return 'Military building occupied'

        case 'NO_MORE_RESOURCES':
            return 'No more resources'

        case 'MILITARY_BUILDING_READY':
            return 'Military building ready'

        case 'UNDER_ATTACK':
            return 'Under attack'

        case 'GEOLOGIST_FIND':
            return 'Geologist finds resource'

        case 'BUILDING_LOST':
            return 'Building lost'

        case 'BUILDING_CAPTURED':
            return 'Building captured'

        case 'STORE_HOUSE_IS_READY':
            return 'Store house ready'

        case 'MILITARY_BUILDING_CAUSED_LOST_LAND':
            return 'Military building caused lost land'

        case 'TREE_CONSERVATION_PROGRAM_ACTIVATED':
            return 'Tree conservation activated'

        case 'TREE_CONSERVATION_PROGRAM_DEACTIVATED':
            return 'Tree conservation deactivated'

        case 'BOMBARDED_BY_CATAPULT':
            return 'Bombarded by catapult'

        case 'HARBOR_IS_FINISHED':
            return 'Harbor finished'

        case 'SHIP_READY_FOR_EXPEDITION':
            return 'Ship ready for expedition'

        case 'SHIP_HAS_REACHED_DESTINATION':
            return 'Ship reached destination'

        case 'GAME_ENDED':
            return 'Game ended'
    }
}

/// React components
// eslint-disable-next-line
const GameMessagesViewer = ({ nation, onGoToPoint }: GameMessagesViewerProps) => {

    // State
    const [expanded, setExpanded] = useState<boolean>(false)
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [messageFilterModes, setMessageFilterModes] = useState<Map<GameMessage['type'], MessageFilterMode>>(new Map())

    // References
    const bottomRef = useRef<HTMLDivElement>(null)
    const previousCountRef = useRef(0)
    const listRef = useRef<HTMLDivElement>(null)

    // Monitoring hooks
    const messages = useGameMessages()

    // Effects
    useEffect(() => {
        const unread = messages.filter(m => !m.isRead)

        if (expanded && unread.length > 0) {
            api.markGameMessagesRead(unread.map(m => m.id))
        }
    }, [messages, expanded])

    useEffect(() => {
        if (!expanded) {
            previousCountRef.current = messages.length

            return
        }

        const hasNewMessages = messages.length > previousCountRef.current

        if (hasNewMessages) {
            const list = listRef.current

            if (list) {
                const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight

                const isCloseToBottom = distanceFromBottom < 80

                if (isCloseToBottom) {
                    bottomRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end'
                    })
                }
            }
        }

        previousCountRef.current = messages.length
    }, [messages, expanded])

    // Filtering
    const getMessageFilterMode = (type: GameMessage['type']): MessageFilterMode => {
        return messageFilterModes.get(type) ?? 'SHOW'
    }

    const setMessageFilterMode = (type: GameMessage['type'], mode: MessageFilterMode) => {
        setMessageFilterModes(previous => {
            const next = new Map(previous)

            if (mode === 'SHOW') {
                next.delete(type)
            } else {
                next.set(type, mode)
            }

            return next
        })
    }

    const getFilterKey = (message: GameMessage): string => {
        if (message.type === 'GEOLOGIST_FIND') {
            return `${message.type}:${message.material}`
        }

        return message.type
    }

    const displayedMessages = (() => {
        const recentMessageTypes: string[] = []
        const displayedMessages: DisplayedMessage[] = []
        const collapsedMessages = new Map<string, DisplayedMessage>()

        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i]
            const mode = getMessageFilterMode(message.type)

            // Handle hiding the message
            if (mode === 'HIDE') {
                continue
            }

            // Handle showing the message
            if (mode === 'SHOW') {
                displayedMessages.push({
                    message,
                    collapsedCount: 1
                })

                continue
            }

            // Handle collapsing the message
            const filterKey = getFilterKey(message)

            if (recentMessageTypes.includes(filterKey)) {
                const displayedMessage = collapsedMessages.get(filterKey)

                if (displayedMessage) {
                    displayedMessage.collapsedCount++
                }

                continue
            }

            const displayedMessage = {
                message,
                collapsedCount: 1
            }

            recentMessageTypes.push(filterKey)
            collapsedMessages.set(filterKey, displayedMessage)
            displayedMessages.push(displayedMessage)

            if (recentMessageTypes.length > MAX_RECENT_MESSAGE_TYPES) {
                const removedType = recentMessageTypes.shift()

                if (removedType !== undefined) {
                    collapsedMessages.delete(removedType)
                }
            }
        }

        const result = displayedMessages.reverse()

        return result
    })()

    const getMessageFilterIcon = (type: GameMessage['type']) => {
        switch (type) {
            case 'STORE_HOUSE_IS_READY':
                return <HouseIcon houseType='Storehouse' nation={nation} scale={0.5} />

            case 'MILITARY_BUILDING_OCCUPIED':
            case 'NO_MORE_RESOURCES':
            case 'MILITARY_BUILDING_READY':
            case 'UNDER_ATTACK':
            case 'BUILDING_LOST':
            case 'BUILDING_CAPTURED':
            case 'MILITARY_BUILDING_CAUSED_LOST_LAND':
                return <HouseIcon houseType='GuardHouse' nation={nation} scale={0.5} />

            case 'GEOLOGIST_FIND':
                return <InventoryIcon material={'GEOLOGIST'} scale={1} nation={'ROMANS'} />

            case 'TREE_CONSERVATION_PROGRAM_ACTIVATED':
                return <UiIcon type='RED_EXCLAMATION_SIGN' scale={0.5} />
            case 'TREE_CONSERVATION_PROGRAM_DEACTIVATED':
                return <UiIcon type='GREEN_EXCLAMATION_SIGN' scale={0.5} />

            case 'BOMBARDED_BY_CATAPULT':
                return <HouseIcon houseType='Catapult' nation={nation} scale={0.5} />

            case 'HARBOR_IS_FINISHED':
                return <HouseIcon houseType='Harbor' nation={nation} scale={0.5} />

            case 'SHIP_READY_FOR_EXPEDITION':
            case 'SHIP_HAS_REACHED_DESTINATION':
                return <ShipIcon scale={0.5} />

            case 'GAME_ENDED':
                return null
        }
    }

    const cycleMessageFilterMode = (type: GameMessage['type']) => {
        const currentMode = getMessageFilterMode(type)

        const nextMode: MessageFilterMode = currentMode === 'SHOW'
            ? 'COLLAPSE'
            : currentMode === 'COLLAPSE'
                ? 'HIDE'
                : 'SHOW'

        setMessageFilterMode(type, nextMode)
    }

    const hasActiveFilters = [...messageFilterModes.values()].some(mode => mode !== 'SHOW')

    // Rendering
    const unreadMessages = messages.filter(message => !message.isRead)

    return (
        <div className='game-messages' onWheel={event => event.stopPropagation()}>

            <ExpandCollapseToggle
                onExpand={() => setExpanded(true)}
                onCollapse={() => setExpanded(false)}
            />

            <div className='game-messages-header'>
                <b>Messages</b>

                {expanded &&
                    <Button
                        size='small'
                        className={hasActiveFilters ? 'game-messages-filter-active' : undefined}
                        onClick={() => setShowFilters(value => !value)}
                    >
                        Filter
                        {hasActiveFilters &&
                            <span className='game-messages-filter-indicator' />
                        }
                    </Button>
                }

                {unreadMessages.length > 0
                    ? <div className='info-overlay'>{unreadMessages.length}</div>
                    : <div></div>}
            </div>

            {expanded && showFilters &&
                <div className='game-message-filters'>
                    {MESSAGE_TYPES.map(type => {
                        const mode = getMessageFilterMode(type)

                        return (
                            <button
                                key={type}
                                className={`game-message-filter game-message-filter-${mode.toLowerCase()}`}
                                title={`${getMessageTypeName(type)}: ${mode.toLowerCase()}`}
                                onClick={() => cycleMessageFilterMode(type)}
                            >
                                {getMessageFilterIcon(type)}

                                <span className='game-message-filter-label'>
                                    {getMessageTypeName(type)}
                                </span>
                            </button>
                        )
                    })}
                </div>
            }

            {expanded &&
                <div className='game-message-list' ref={listRef}>
                    {displayedMessages.length > 0 && (
                        <ItemContainer className='game-message-list-container'>
                            {displayedMessages.map(({ message, collapsedCount }, index) => (
                                <div
                                    className='game-message'
                                    key={message.id}
                                    ref={index === displayedMessages.length - 1 ? bottomRef : null}
                                >
                                    {message.type === 'MILITARY_BUILDING_OCCUPIED' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                Military building occupied
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'NO_MORE_RESOURCES' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                No more resources
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'MILITARY_BUILDING_READY' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                Military building is ready
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'UNDER_ATTACK' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                We&apos;re under attack!
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'GEOLOGIST_FIND' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <InventoryIcon material={'GEOLOGIST'} scale={1} nation={'ROMANS'} />
                                            </div>
                                            <div className='game-message-text'>
                                                Geologist has found {message.material.toLowerCase()}!
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'BUILDING_LOST' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                Building lost to enemy
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'BUILDING_CAPTURED' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                Building captured
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'STORE_HOUSE_IS_READY' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                A store house is ready
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'MILITARY_BUILDING_CAUSED_LOST_LAND' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType={message.houseType} nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                This building has caused you to lose land
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'TREE_CONSERVATION_PROGRAM_ACTIVATED' && (
                                        <>
                                            <div className='game-message-icon' />
                                            <div className='game-message-text'>
                                                The tree conservation program has been activated.<br />
                                                Only Woodcutters, Sawmills, and Forester huts will get planks.
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'TREE_CONSERVATION_PROGRAM_DEACTIVATED' && (
                                        <>
                                            <div className='game-message-icon' />
                                            <div className='game-message-text'>
                                                The tree conservation program has been deactivated.
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'BOMBARDED_BY_CATAPULT' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType='Catapult' nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                We&apos;re being bombarded by a catapult
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'HARBOR_IS_FINISHED' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <HouseIcon houseType='Harbor' nation={nation} scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                A harbor is finished
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'SHIP_READY_FOR_EXPEDITION' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <ShipIcon scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                A ship is ready to start an expedition
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'SHIP_HAS_REACHED_DESTINATION' && (
                                        <>
                                            <div className='game-message-icon'>
                                                <ShipIcon scale={0.5} />
                                            </div>
                                            <div className='game-message-text'>
                                                A ship has reached its destination
                                            </div>
                                            <div className='game-message-go-to-point'>
                                                <UiIcon type='GO_TO_POINT' scale={0.5} onClick={() => onGoToPoint(message.point)} />
                                            </div>
                                        </>
                                    )}

                                    {message.type === 'GAME_ENDED' && (
                                        <>
                                            <div className='game-message-icon' />
                                            <div className='game-message-text'>
                                                Player {message.winnerPlayerId} is the winner!
                                            </div>
                                        </>
                                    )}

                                    <div className='game-message-count'>
                                        {collapsedCount > 1 && <>x {collapsedCount}</>}
                                    </div>

                                    <div className='game-message-trash'>
                                        <UiIcon type='TRASHCAN' scale={0.5} onClick={() => removeMessage(message)} />
                                    </div>
                                </div>
                            ))}
                        </ItemContainer>
                    )}

                    {messages && messages.length > 0 &&
                        <Button onClick={() => api.removeMessages(messages.map(m => m.id))} >Clear all</Button>
                    }
                </div>
            }
        </div>
    )
}

export default GameMessagesViewer
