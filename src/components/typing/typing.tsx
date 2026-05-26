import React, { useCallback, useMemo, useState } from 'react'
import { CommandMatch, GenericCommand, prettyPrintFuzzyMatch } from '../../utils/typing-commands'
import { ItemContainer } from '../item_container'
import { Button } from '@fluentui/react-components'
import { UiIcon } from '../icons/icon'
import './typing.css'


/// Types
type TypeMatchListProps<T> = {
    matches: CommandMatch<T>[]
    highlightOnHover?: boolean
    onClick?: (match: CommandMatch<T>) => void
}

type TypeMatchProps<T> = {
    match: CommandMatch<T>
    highlightOnHover?: boolean
    onClick?: (match: CommandMatch<T>) => void
}


/// React components
function TypeMatch<T>({ match, highlightOnHover = false, onClick }: TypeMatchProps<T>) {
    return (
        <div
            className={`typing-match-and-icon ${highlightOnHover ? 'highlight-on-hover' : ''}`}
            onClick={() => onClick?.(match)}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    onClick?.(match)
                }
            }}
            role='button'
            tabIndex={0}
        >
            <div className='typing-match-text'>{prettyPrintFuzzyMatch(match)}</div>

            {match.command.icon}
        </div>
    )
}

function TypeMatchList<T>({ matches, highlightOnHover = false, onClick }: TypeMatchListProps<T>) {
    return (
        <div className='type-match-list'>
            {matches.map(match => (
                <TypeMatch
                    key={`${match.type}-${match.commandName}`}
                    match={match}
                    highlightOnHover={highlightOnHover}
                    onClick={onClick}
                />
            ))}
        </div>
    )
}

type DialogTypingProps<T> = {
    inputValue: string | undefined
    matches: CommandMatch<T>[]
    available?: Map<string, GenericCommand<T>>

}

function DialogTyping<T>({ inputValue, matches, available }: DialogTypingProps<T>) {

    // State
    const [showAlternativeMatches, setShowAlternativeMatches] = useState<boolean>(false)

    // Functions
    const toggleShowAlternativeMatches = useCallback(() => {
        setShowAlternativeMatches(prev => !prev)
    }, [])

    // Memos
    const matchesMap = useMemo(() => new Map(matches.map(match => [match.commandName, match])), [matches])

    // Rendering
    const topMatch = matches.length > 0 ? matches[0] : undefined

    return (<ItemContainer>
        {inputValue && topMatch &&
            <div className='typing-match-and-list-toggle'>

                <Button
                    appearance='subtle'
                    size='small'
                    onClick={toggleShowAlternativeMatches}
                >
                    {showAlternativeMatches &&
                        <UiIcon type='DOWN_ARROW' />
                    }

                    {!showAlternativeMatches &&
                        <UiIcon type='RIGHT_ARROW' />
                    }
                </Button>

                <TypeMatch match={topMatch} />
            </div>
        }

        {inputValue && !topMatch &&
            <div className='typing-match typing-no-match'>
                No match for &quot;{inputValue}&quot;
            </div>
        }

        {inputValue && matches.length > 1 && showAlternativeMatches &&
            <div className='typing-alternative-matches'>

                {matches.slice(1).map(match => (
                    <TypeMatch
                        key={`${match.type}-${match.commandName}`}
                        match={match}
                        highlightOnHover
                    />
                ))}
            </div>
        }

        {(inputValue === undefined || inputValue.trim().length === 0) && available !== undefined &&
            [...available.keys()].map(name => {
                if (matchesMap.has(name)) {
                    return (
                        <TypeMatch
                            key={name}
                            match={matchesMap.get(name) as CommandMatch<T>}
                        />)
                } else {
                    return (<div key={name}>
                        {name}
                    </div>)
                }
            })
        }
    </ItemContainer>)
}

export {
    TypeMatch,
    TypeMatchList,
    DialogTyping
}