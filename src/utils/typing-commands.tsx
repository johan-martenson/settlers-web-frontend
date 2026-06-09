import React from 'react'


/// Types
type BaseCommand<CommandContext> = {
    hidden?: boolean
    icon?: React.ReactNode
    filter?: (context: CommandContext) => boolean | undefined
}

type FixedCommand<CommandContext> = BaseCommand<CommandContext> & {
    type?: 'FIXED'
    action: (context: CommandContext) => void
}

export type NumberCommand<CommandContext> = BaseCommand<CommandContext> & {
    type: 'NUMBER'
    parameterName?: string
    min?: number
    max?: number
    action: (context: CommandContext, value: number) => void
}

export type EnumCommand<CommandContext, TValue extends string> = BaseCommand<CommandContext> & {
    type: 'ENUM'
    parameterName?: string
    values: readonly TValue[]
    action: (context: CommandContext, value: TValue) => void
}

export type StringCommand<CommandContext> = BaseCommand<CommandContext> & {
    type: 'STRING'
    parameterName?: string
    allowEmpty?: boolean
    action: (context: CommandContext, value: string) => void
}

export type GenericCommand<CommandContext> =
    | FixedCommand<CommandContext>
    | NumberCommand<CommandContext>
    | EnumCommand<CommandContext, string>
    | StringCommand<CommandContext>

type HighlightedPart = {
    text: string
    highlighted: boolean
}

type FuzzyMatchResult = {
    matched: boolean
    score: number
    matchIndexes: number[]
}

type ParameterMatchState =
    | 'NONE'
    | 'COMMAND_ONLY'
    | 'COMPLETE'

type BaseCommandMatch = {
    commandName: string
    score: number
    matchIndexes: number[]
}

export type FixedCommandMatch<CommandContext> = BaseCommandMatch & {
    type: 'FIXED'
    command: FixedCommand<CommandContext>
    parsedParam: undefined
}

export type NumberCommandMatch<CommandContext> = BaseCommandMatch & {
    type: 'NUMBER'
    command: NumberCommand<CommandContext>
    parsedParam: number
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
}

export type EnumCommandMatch<CommandMatch, TValue extends string> = BaseCommandMatch & {
    type: 'ENUM'
    command: EnumCommand<CommandMatch, TValue>
    parsedParam: TValue
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
}

export type StringCommandMatch<CommandContext> = BaseCommandMatch & {
    type: 'STRING'
    command: StringCommand<CommandContext>
    parsedParam: string
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
}

export type CommandMatch<CommandContext> =
    | FixedCommandMatch<CommandContext>
    | NumberCommandMatch<CommandContext>
    | EnumCommandMatch<CommandContext, string>
    | StringCommandMatch<CommandContext>


/// Functions
function isFuzzyMatch(input: string, command: string): FuzzyMatchResult {
    const pattern = input.toLowerCase().replace(/\s+/g, '')
    const text = command

    let score = 0
    let patternIndex = 0
    let lastMatchIndex = -1

    const matchIndexes: number[] = []

    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
        const char = text[i]
        const lowerChar = char.toLowerCase()

        if (lowerChar === pattern[patternIndex]) {
            matchIndexes.push(i)

            // Base score
            score += 10

            // Bonus: match at start
            if (i === 0) {
                score += 25
            }

            // Bonus: word start
            const prevChar = text[i - 1]

            if (i > 0 && (prevChar === ' ' || prevChar === '-' || prevChar === '_')) {
                score += 15
            }

            // Bonus: camelCase
            if (i > 0 && char >= 'A' && char <= 'Z') {
                score += 12
            }

            // Bonus: consecutive match
            if (lastMatchIndex === i - 1) {
                score += 18
            }

            // Penalty: gaps
            if (lastMatchIndex !== -1) {
                score -= (i - lastMatchIndex - 1)
            }

            lastMatchIndex = i
            patternIndex++
        }
    }

    return {
        matched: patternIndex === pattern.length,
        score,
        matchIndexes
    }
}

function parseStringCommand(input: string, commandName: string): {
    value: string
    score: number
    commandMatchIndexes: number[]
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
} | undefined {
    const trimmedInput = input.trimStart()

    let bestMatch:
        | {
            value: string
            score: number
            commandMatchIndexes: number[]
            parameterMatchIndexes: number[]
            parameterMatchState: ParameterMatchState
        }
        | undefined

    for (let splitIndex = 0; splitIndex <= trimmedInput.length; splitIndex++) {
        const commandPart = trimmedInput.slice(0, splitIndex)
        let parameterPart = trimmedInput.slice(splitIndex)

        if (parameterPart.startsWith(' ')) {
            parameterPart = parameterPart.trimStart()
        }

        const commandMatch = isFuzzyMatch(
            commandPart,
            commandName
        )

        if (!commandMatch.matched) {
            continue
        }

        const score =
            commandMatch.score +
            parameterPart.length

        if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
                value: parameterPart,
                score,
                commandMatchIndexes: commandMatch.matchIndexes,
                parameterMatchIndexes:
                    parameterPart.length > 0
                        ? [...parameterPart].map((_, index) => index)
                        : [],
                parameterMatchState: parameterPart.length > 0
                    ? 'COMPLETE'
                    : 'COMMAND_ONLY'
            }
        }
    }

    return bestMatch
}

function parseNumberCommand(input: string, commandName: string): {
    value: number
    score: number
    commandMatchIndexes: number[]
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
} | undefined {
    const trimmedInput = input.trimStart()

    let bestMatch:
        | {
            value: number
            score: number
            commandMatchIndexes: number[]
            parameterMatchIndexes: number[]
            parameterMatchState: ParameterMatchState
        }
        | undefined

    const minimumSplitIndex = Math.min(trimmedInput.length, Math.max(1, Math.floor(commandName.length / 2)))

    for (let splitIndex = minimumSplitIndex; splitIndex <= trimmedInput.length; splitIndex++) {
        let commandPart = trimmedInput.slice(0, splitIndex)
        let parameterPart = trimmedInput.slice(splitIndex)

        if (parameterPart.startsWith(' ')) {
            parameterPart = parameterPart.trimStart()
        } else {
            const trailingNumberMatch = commandPart.match(/(.*?)(-?\d+(?:\.\d+)?)$/)

            if (trailingNumberMatch) {
                commandPart = trailingNumberMatch[1]
                parameterPart = trailingNumberMatch[2]
            }
        }

        const commandMatch = isFuzzyMatch(commandPart, commandName)

        if (!commandMatch.matched) {
            continue
        }

        let value: number | undefined

        if (parameterPart.length > 0) {
            const parsedValue = Number(parameterPart)

            if (!Number.isNaN(parsedValue)) {
                value = parsedValue
            }
        }

        const score = commandMatch.score + (value !== undefined ? 50 : 0)

        if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
                value: value ?? 0,
                score,
                commandMatchIndexes: commandMatch.matchIndexes,
                parameterMatchIndexes:
                    [...parameterPart].map((_, index) => index),
                parameterMatchState: value !== undefined
                    ? 'COMPLETE'
                    : 'COMMAND_ONLY'
            }
        }
    }

    return bestMatch
}

function parseEnumCommand<T extends string>(input: string, commandName: string, values: readonly T[]): {
    value: T
    score: number
    commandMatchIndexes: number[]
    parameterMatchIndexes: number[]
    parameterMatchState: ParameterMatchState
} | undefined {
    const trimmedInput = input.trimStart()

    let bestMatch:
        | {
            value: T
            score: number
            commandMatchIndexes: number[]
            parameterMatchIndexes: number[]
            parameterMatchState: ParameterMatchState
        }
        | undefined

    for (let splitIndex = 0; splitIndex <= trimmedInput.length; splitIndex++) {
        const commandPart = trimmedInput.slice(0, splitIndex)

        let parameterPart = trimmedInput.slice(splitIndex)

        if (parameterPart.startsWith(' ')) {
            parameterPart = parameterPart.trimStart()
        }

        const commandMatch = isFuzzyMatch(
            commandPart,
            commandName
        )

        if (!commandMatch.matched) {
            continue
        }

        for (const value of values) {
            const valueMatch = isFuzzyMatch(
                parameterPart,
                value
            )

            if (!valueMatch.matched) {
                continue
            }

            const score =
                commandMatch.score +
                valueMatch.score

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                    value,
                    score,
                    commandMatchIndexes: commandMatch.matchIndexes,
                    parameterMatchIndexes: valueMatch.matchIndexes,
                    parameterMatchState: valueMatch.matched
                        ? 'COMPLETE'
                        : 'COMMAND_ONLY'
                }
            }
        }
    }

    return bestMatch
}

// Matcher
function findMatchingCommands<CommandContext>(
    commands: Map<string, GenericCommand<CommandContext>>,
    input: string,
    context: CommandContext | undefined
): CommandMatch<CommandContext>[] {
    const matches: CommandMatch<CommandContext>[] = []

    for (const [commandName, command] of commands) {
        if (command.filter && (!context || !command.filter(context))) {
            continue
        }

        switch (command.type) {
            case 'NUMBER': {
                const parsed = parseNumberCommand(input, commandName)

                if (parsed !== undefined) {
                    const withinMin =
                        command.min === undefined ||
                        parsed.value >= command.min

                    const withinMax =
                        command.max === undefined ||
                        parsed.value <= command.max

                    if (withinMin && withinMax) {
                        matches.push({
                            type: 'NUMBER',
                            commandName,
                            command,
                            score: parsed.score,
                            parsedParam: parsed.value,
                            matchIndexes: parsed.commandMatchIndexes,
                            parameterMatchIndexes: parsed.parameterMatchIndexes,
                            parameterMatchState: parsed.parameterMatchState
                        })
                    }
                }

                break
            }

            case 'ENUM': {
                const parsed = parseEnumCommand(
                    input,
                    commandName,
                    command.values
                )

                if (parsed) {
                    matches.push({
                        type: 'ENUM',
                        commandName,
                        command,
                        score: parsed.score,
                        parsedParam: parsed.value,
                        matchIndexes: parsed.commandMatchIndexes,
                        parameterMatchIndexes: parsed.parameterMatchIndexes,
                        parameterMatchState: parsed.parameterMatchState
                    })
                }

                break
            }

            case 'STRING': {
                const parsed = parseStringCommand(
                    input,
                    commandName
                )

                if (parsed !== undefined) {
                    matches.push({
                        type: 'STRING',
                        commandName,
                        command,
                        score: parsed.score,
                        parsedParam: parsed.value,
                        matchIndexes: parsed.commandMatchIndexes,
                        parameterMatchIndexes: parsed.parameterMatchIndexes,
                        parameterMatchState: parsed.parameterMatchState
                    })
                }

                break
            }

            case 'FIXED':
            case undefined: {
                const fuzzyMatch = isFuzzyMatch(
                    input,
                    commandName
                )

                if (fuzzyMatch.matched) {
                    matches.push({
                        type: 'FIXED',
                        commandName,
                        command,
                        score: fuzzyMatch.score,
                        parsedParam: undefined,
                        matchIndexes: fuzzyMatch.matchIndexes
                    })
                }

                break
            }
        }
    }

    // Stable sorting, then return
    return matches.sort((a, b) => {
        const scoreDifference = b.score - a.score

        if (scoreDifference !== 0) {
            return scoreDifference
        }

        return a.commandName.localeCompare(b.commandName)
    })
}

export function executeCommand<TContext>(match: CommandMatch<TContext>, context: TContext): void {
    try {
        switch (match.type) {
            case 'FIXED': {
                match.command.action(context)
                break
            }

            case 'NUMBER': {
                if (match.parameterMatchState !== 'COMPLETE') {
                    break
                }

                match.command.action(context, match.parsedParam)
                break
            }

            case 'ENUM': {
                if (match.parameterMatchState !== 'COMPLETE') {
                    break
                }

                match.command.action(context, match.parsedParam)
                break
            }

            case 'STRING': {
                if (match.parameterMatchState !== 'COMPLETE') {
                    break
                }

                match.command.action(context, match.parsedParam)
                break
            }
        }
    } catch (error) {
        console.error('Error occurred while running command', error)
    }
}

function buildHighlightedParts(text: string, matchIndexes: number[]): HighlightedPart[] {
    const highlightedIndexes = new Set(matchIndexes)
    const parts: HighlightedPart[] = []

    let currentText = ''
    let currentHighlighted: boolean | undefined

    for (let i = 0; i < text.length; i++) {
        const highlighted = highlightedIndexes.has(i)

        if (currentHighlighted === undefined || currentHighlighted !== highlighted) {
            if (currentText.length > 0 && currentHighlighted !== undefined) {
                parts.push({
                    text: currentText,
                    highlighted: currentHighlighted
                })
            }

            currentText = text[i]
            currentHighlighted = highlighted
        } else {
            currentText += text[i]
        }
    }

    if (currentText.length > 0 && currentHighlighted !== undefined) {
        parts.push({
            text: currentText,
            highlighted: currentHighlighted
        })
    }

    return parts
}

function renderParameterPlaceholder(text: string): React.ReactNode {
    return (
        <span className='type-match-parameter-placeholder'>
            {`<${text}>`}
        </span>
    )
}

function prettyPrintFuzzyMatch<T>(match: CommandMatch<T>): React.ReactNode {
    switch (match.type) {
        case 'FIXED': {
            return renderHighlightedText(
                match.commandName,
                match.matchIndexes
            )
        }

        case 'NUMBER': {
            return (
                <>
                    {renderHighlightedText(match.commandName, match.matchIndexes)}

                    <span>&nbsp;</span>

                    {match.parameterMatchState === 'COMMAND_ONLY'
                        ? renderParameterPlaceholder(match.command.parameterName ?? 'number')
                        : (
                            <span className='type-match-parameter'>
                                {renderHighlightedText(
                                    String(match.parsedParam),
                                    match.parameterMatchIndexes,
                                    'parameter-match-highlight'
                                )}
                            </span>
                        )}
                </>
            )
        }

        case 'STRING': {
            return (
                <>
                    {renderHighlightedText(match.commandName, match.matchIndexes)}

                    <span>&nbsp;</span>

                    {match.parameterMatchState === 'COMMAND_ONLY'
                        ? renderParameterPlaceholder(match.command.parameterName ?? 'text')
                        : (
                            <span className='type-match-parameter'>
                                {renderHighlightedText(
                                    match.parsedParam,
                                    match.parameterMatchIndexes,
                                    'parameter-match-highlight'
                                )}
                            </span>
                        )}
                </>
            )
        }

        case 'ENUM': {
            return (
                <>
                    {renderHighlightedText(match.commandName, match.matchIndexes)}

                    <span>&nbsp;</span>

                    {match.parameterMatchState === 'COMMAND_ONLY'
                        ? renderParameterPlaceholder(
                            match.command.parameterName ?? 'value'
                        )
                        : (
                            <span className='type-match-parameter'>
                                {renderHighlightedText(
                                    match.parsedParam,
                                    match.parameterMatchIndexes,
                                    'parameter-match-highlight'
                                )}
                            </span>
                        )}
                </>
            )
        }
    }
}

function renderHighlightedText(
    text: string,
    matchIndexes: number[],
    highlightClass = 'match-highlight'
): React.ReactNode {
    const parts = buildHighlightedParts(text, matchIndexes)

    return (
        <>
            {parts.map((part, index) => (
                <span
                    key={index}
                    className={
                        part.highlighted
                            ? `match ${highlightClass}`
                            : undefined
                    }
                >
                    {part.text}
                </span>
            ))}
        </>
    )
}

// Exports
export {
    findMatchingCommands,
    isFuzzyMatch,
    parseEnumCommand,
    parseNumberCommand,
    parseStringCommand,
    prettyPrintFuzzyMatch

}