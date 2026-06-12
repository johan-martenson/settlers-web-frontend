import { useCallback, useMemo, useState } from 'react'
import { CommandMatch, GenericCommand, prettyPrintFuzzyMatch } from '../../utils/typing-commands'
import './typing.css'
import { KeyboardRegular } from '@fluentui/react-icons'

/// Types
type TypeMatchProps<T> = {
    match: CommandMatch<T>
    highlightOnHover?: boolean
    onClick?: (match: CommandMatch<T>) => void
    setHover?: React.Dispatch<React.SetStateAction<string | undefined>>
}

type PrintCommand<T> = {
    name: string
    command: GenericCommand<T>
    highlightOnHover?: boolean
}

type DialogTypingProps<T> = {
    inputValue: string | undefined
    matches: CommandMatch<T>[]
    available?: Map<string, GenericCommand<T>>
    setHover: React.Dispatch<React.SetStateAction<string | undefined>>
}

type NoMatchProps = {
    text: string
}

type ListSize = 'COMPACT' | 'NORMAL' | 'FULL'


/// Functions
function matchToPrettyString<T>(match: CommandMatch<T>): string {
    if (match.type === 'ENUM') {
        if (match.parameterMatchState === 'COMPLETE') {
            return `${match.commandName} ${match.parsedParam}`
        } else {
            return `${match.commandName} <${match.command.parameterName ?? 'enum'}>`
        }
    } else if (match.type === 'NUMBER') {
        if (match.parameterMatchState === 'COMPLETE') {
            return `${match.commandName} ${match.parsedParam}`
        } else {
            return `${match.commandName} <${match.command.parameterName ?? 'number'}>`
        }
    } else if (match.type === 'STRING') {
        if (match.parameterMatchState === 'COMPLETE') {
            return `${match.commandName} ${match.parsedParam}`
        } else {
            return `${match.commandName} <${match.command.parameterName ?? 'string'}>`
        }
    } else {
        return match.commandName
    }
}

function commandToString<T>(name: String, command: GenericCommand<T>): string {
    if (command.type === 'ENUM') {
        return `${name} <${command.parameterName ?? 'enum'}>`
    } else if (command.type === 'STRING') {
        return `${name} ${command.parameterName ?? 'string'}`
    } else if (command.type === 'NUMBER') {
        return `${name} <number>`
    } else {
        return `${name}`
    }
}


/// React components
function PrintCommand<T>({ name, command, highlightOnHover = false }: PrintCommand<T>) {
    return (
        <div className={`typing-match-and-icon ${highlightOnHover ? 'highlight-on-hover' : ''}`}>
            {commandToString(name, command)}
            {command.icon !== undefined && command.icon}
        </div>
    )
}

function TypeMatch<T>({ match, highlightOnHover = false, onClick, setHover }: TypeMatchProps<T>) {
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
            onMouseEnter={() => setHover && setHover(matchToPrettyString(match))}
            onMouseLeave={() => setHover && setHover(undefined)}
        >
            <div className='typing-match-text'>{prettyPrintFuzzyMatch(match)}</div>

            {match.command.icon}
        </div>
    )
}

function NoMatch({ text }: NoMatchProps) {
    return (
        <div className='typing-match typing-no-match'>
            No match for &quot;{text}&quot;
        </div>
    )
}

/// React components
function DialogTyping<T>({ inputValue, matches, available, setHover }: DialogTypingProps<T>) {

    // State
    const [listSize, setListSize] = useState<ListSize>('NORMAL')

    // Functions
    const toggleShowAlternativeMatches = useCallback(() => {
        setListSize(prev => prev === 'NORMAL' ? 'FULL' : (prev === 'FULL' ? 'COMPACT' : 'NORMAL'))
    }, [])

    // Memos
    const { matchesMap, topMatch } = useMemo(() => {
        const matchesMap = new Map(matches.map(match => [match.commandName, match]))
        const topMatch = matches.length > 0 ? matches[0] : undefined

        return { matchesMap, topMatch }
    }, [matches])

    // Rendering
    return (
        <>

            <KeyboardRegular
                fontSize={30}
                onClick={toggleShowAlternativeMatches}
                onMouseEnter={() => setHover('Toggle typing control views')}
                onMouseLeave={() => setHover(undefined)}
            />

            <div className='typing-list'>
                {inputValue && !topMatch &&
                    <NoMatch text={inputValue} />
                }

                {inputValue && topMatch &&
                    <>
                        <TypeMatch match={topMatch} setHover={setHover} />

                        {listSize !== 'COMPACT' && available !== undefined &&
                            Array.from(available.entries()).filter(([name, command]) => !command.hidden).map(([name, command]) => {
                                if (matchesMap.has(name) && name !== topMatch.commandName) {
                                    return (
                                        <TypeMatch key={name} match={matchesMap.get(name) as CommandMatch<T>} setHover={setHover} />
                                    )
                                } else if (listSize === 'FULL' && name !== topMatch.commandName) {
                                    return (
                                        <PrintCommand name={name} command={command} />
                                    )
                                }
                            })}
                    </>
                }

                {(inputValue === undefined || inputValue.trim().length === 0) && available !== undefined && listSize === 'FULL' &&
                    Array.from(available.entries()).filter(([name, command]) => !command.hidden).map(([name, command]) => {
                        return (<TypeMatch key={name} match={matchesMap.get(name) as CommandMatch<T>} setHover={setHover} />)
                    })
                }
            </div>
        </>
    )
}

/// Exports
export {
    TypeMatch,
    DialogTyping,
    commandToString,
    NoMatch
}