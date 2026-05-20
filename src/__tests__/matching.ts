

// NOTE:
// Export these functions from typing_command_utils.ts:
//
// export {
//     isFuzzyMatch,
//     parseStringCommand,
//     parseNumberCommand,
//     parseEnumCommand
// }
//
// so they can be tested.

import { CommandMatch, executeCommand, findMatchingCommands, GenericCommand, isFuzzyMatch, parseEnumCommand, parseNumberCommand, parseStringCommand } from "../utils/typing_command_utils"


describe('isFuzzyMatch', () => {

    test('matches exact command', () => {
        const result = isFuzzyMatch('set player', 'Set Player')

        expect(result.matched).toBe(true)
        expect(result.matchIndexes.length).toBeGreaterThan(0)
    })

    test('matches partial command', () => {
        const result = isFuzzyMatch('spl', 'Set Player Limit')

        expect(result.matched).toBe(true)
    })

    test('matches ignoring case', () => {
        const result = isFuzzyMatch('SET', 'set player')

        expect(result.matched).toBe(true)
    })

    test('matches ignoring spaces in input', () => {
        const result = isFuzzyMatch('sp l', 'Set Player Limit')

        expect(result.matched).toBe(true)
    })

    test('does not match incorrect sequence', () => {
        const result = isFuzzyMatch('xyz', 'Set Player')

        expect(result.matched).toBe(false)
    })

    test('scores consecutive matches higher', () => {
        const consecutive = isFuzzyMatch('set', 'Set Player')
        const scattered = isFuzzyMatch('spr', 'Set Player')

        expect(consecutive.score).toBeGreaterThan(scattered.score)
    })

    test('matches word boundaries strongly', () => {
        const wordBoundary = isFuzzyMatch('pl', 'Set Player')
        const nonBoundary = isFuzzyMatch('la', 'Set Player')

        expect(wordBoundary.score).toBeGreaterThan(nonBoundary.score)
    })

    test('returns match indexes', () => {
        const result = isFuzzyMatch('set', 'Set Player')

        expect(result.matchIndexes.length).toBe(3)
    })

    test('empty input matches', () => {
        const result = isFuzzyMatch('', 'Set Player')

        expect(result.matched).toBe(true)
    })

    test('empty input gives zero score', () => {
        const result = isFuzzyMatch('', 'Set Player')

        expect(result.score).toBe(0)
    })
})

describe('parseStringCommand', () => {

    test('parses full command with parameter', () => {
        const result = parseStringCommand(
            'set player Johan',
            'Set Player'
        )

        expect(result).toBeDefined()
        expect(result?.value).toBe('Johan')
    })

    test('matches command without parameter', () => {
        const result = parseStringCommand(
            'set player',
            'Set Player'
        )

        expect(result).toBeDefined()
        expect(result?.value).toBe('')
    })

    test('matches abbreviated command', () => {
        const result = parseStringCommand(
            'sp Johan',
            'Set Player'
        )

        expect(result).toBeDefined()
        expect(result?.value).toBe('Johan')
    })

    test('returns parameter match indexes', () => {
        const result = parseStringCommand(
            'set player Johan',
            'Set Player'
        )

        expect(result?.parameterMatchIndexes).toEqual([0, 1, 2, 3, 4])
    })

    test('returns command only state without parameter', () => {
        const result = parseStringCommand(
            'set player',
            'Set Player'
        )

        expect(result?.parameterMatchState).toBe('COMMAND_ONLY')
    })

    test('returns complete state with parameter', () => {
        const result = parseStringCommand(
            'set player Johan',
            'Set Player'
        )

        expect(result?.parameterMatchState).toBe('COMPLETE')
    })

    test('trims parameter spaces', () => {
        const result = parseStringCommand(
            'set player     Johan',
            'Set Player'
        )

        expect(result?.value).toBe('Johan')
    })

    test('fails invalid command', () => {
        const result = parseStringCommand(
            'xyz Johan',
            'Set Player'
        )

        expect(result).toBeUndefined()
    })
})

describe('parseNumberCommand', () => {

    test('parses number parameter', () => {
        const result = parseNumberCommand(
            'set age 8',
            'Set Age'
        )

        expect(result?.value).toBe(8)
    })

    test('parses negative numbers', () => {
        const result = parseNumberCommand(
            'set offset -15',
            'Set Offset'
        )

        expect(result?.value).toBe(-15)
    })

    test('parses decimal numbers', () => {
        const result = parseNumberCommand(
            'set scale 1.5',
            'Set Scale'
        )

        expect(result?.value).toBe(1.5)
    })

    test('matches command without parameter', () => {
        const result = parseNumberCommand(
            'set age',
            'Set Age'
        )

        expect(result).toBeDefined()
        expect(result?.parameterMatchState).toBe('COMMAND_ONLY')
    })

    test('returns complete state with parameter', () => {
        const result = parseNumberCommand(
            'set age 8',
            'Set Age'
        )

        expect(result?.parameterMatchState).toBe('COMPLETE')
    })

    test('supports attached number', () => {
        const result = parseNumberCommand(
            'setage8',
            'Set Age'
        )

        expect(result?.value).toBe(8)
    })

    test('fails invalid number', () => {
        const result = parseNumberCommand(
            'set age abc',
            'Set Age'
        )

        expect(result?.parameterMatchState).toBe('COMMAND_ONLY')
    })

    test('returns parameter indexes', () => {
        const result = parseNumberCommand(
            'set age 123',
            'Set Age'
        )

        expect(result?.parameterMatchIndexes).toEqual([0, 1, 2])
    })

    test('fails invalid command', () => {
        const result = parseNumberCommand(
            'xyz 123',
            'Set Age'
        )

        expect(result).toBeUndefined()
    })
})

describe('parseEnumCommand', () => {

    test('matches enum value', () => {
        const result = parseEnumCommand(
            'set mode easy',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.value).toBe('easy')
    })

    test('matches partial enum command', () => {
        const result = parseEnumCommand(
            'sm easy',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.value).toBe('easy')
    })

    test('matches abbreviated enum value', () => {
        const result = parseEnumCommand(
            'set mode ea',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.value).toBe('easy')
    })

    test('returns complete state with parameter', () => {
        const result = parseEnumCommand(
            'set mode easy',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.parameterMatchState).toBe('COMPLETE')
    })

    test('returns command only state without parameter', () => {
        const result = parseEnumCommand(
            'set mode',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.parameterMatchState).toBe('COMMAND_ONLY')
    })

    test('returns parameter indexes', () => {
        const result = parseEnumCommand(
            'set mode easy',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result?.parameterMatchIndexes.length).toBeGreaterThan(0)
    })

    test('fails invalid enum value', () => {
        const result = parseEnumCommand(
            'set mode impossible',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result).toBeUndefined()
    })

    test('fails invalid command', () => {
        const result = parseEnumCommand(
            'xyz easy',
            'Set Mode',
            ['easy', 'hard'] as const
        )

        expect(result).toBeUndefined()
    })
})

describe('findMatchingCommands', () => {

    type Context = {
        enabled: boolean
    }

    const commands = new Map<string, GenericCommand<Context>>([
        [
            'Set Player',
            {
                type: 'STRING',
                action: jest.fn()
            }
        ],

        [
            'Set Age',
            {
                type: 'NUMBER',
                min: 1,
                max: 10,
                action: jest.fn()
            }
        ],

        [
            'Set Mode',
            {
                type: 'ENUM',
                values: ['easy', 'hard'] as const,
                action: jest.fn()
            }
        ],

        [
            'Reset',
            {
                type: 'FIXED',
                action: jest.fn()
            }
        ],

        [
            'Hidden',
            {
                type: 'FIXED',
                hidden: true,
                action: jest.fn()
            }
        ],

        [
            'Filtered',
            {
                type: 'FIXED',
                filter: (context: Context) => context.enabled,
                action: jest.fn()
            }
        ]
    ])

    test('matches fixed command', () => {
        const matches = findMatchingCommands(
            commands,
            'reset',
            { enabled: true }
        )

        expect(matches.length).toBeGreaterThan(0)
        expect(matches[0].commandName).toBe('Reset')
    })

    test('matches string command', () => {
        const matches = findMatchingCommands(
            commands,
            'set player Johan',
            { enabled: true }
        )

        expect(matches[0].type).toBe('STRING')
    })

    test('matches number command', () => {
        const matches = findMatchingCommands(
            commands,
            'set age 5',
            { enabled: true }
        )

        expect(matches[0].type).toBe('NUMBER')
    })

    test('matches enum command', () => {
        const matches = findMatchingCommands(
            commands,
            'set mode easy',
            { enabled: true }
        )

        expect(matches[0].type).toBe('ENUM')
    })

    test('filters hidden commands only in caller logic', () => {
        const matches = findMatchingCommands(
            commands,
            'hidden',
            { enabled: true }
        )

        expect(matches.length).toBeGreaterThan(0)
    })

    test('respects filter', () => {
        const matches = findMatchingCommands(
            commands,
            'filtered',
            { enabled: false }
        )

        expect(matches.length).toBe(0)
    })

    test('allows filtered command', () => {
        const matches = findMatchingCommands(
            commands,
            'filtered',
            { enabled: true }
        )

        expect(matches.length).toBeGreaterThan(0)
    })

    test('rejects number below min', () => {
        const matches = findMatchingCommands(
            commands,
            'set age 0',
            { enabled: true }
        )

        expect(matches.length).toBe(0)
    })

    test('rejects number above max', () => {
        const matches = findMatchingCommands(
            commands,
            'set age 99',
            { enabled: true }
        )

        expect(matches.length).toBe(0)
    })

    test('allows number inside range', () => {
        const matches = findMatchingCommands(
            commands,
            'set age 5',
            { enabled: true }
        )

        expect(matches.length).toBeGreaterThan(0)
    })

    test('sorts highest score first', () => {
        const matches = findMatchingCommands(
            commands,
            'set',
            { enabled: true }
        )

        expect(matches.length).toBeGreaterThan(1)

        for (let i = 1; i < matches.length; i++) {
            expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score)
        }
    })

    test('returns stable alphabetical ordering for equal scores', () => {
        const equalMatches: CommandMatch<Context>[] =
            findMatchingCommands(
                new Map([
                    [
                        'Alpha',
                        {
                            action: jest.fn()
                        }
                    ],
                    [
                        'Beta',
                        {
                            action: jest.fn()
                        }
                    ]
                ]),
                '',
                { enabled: true }
            )

        expect(equalMatches[0].commandName).toBe('Alpha')
        expect(equalMatches[1].commandName).toBe('Beta')
    })

    test('returns command only match state for incomplete parameter', () => {
        const matches = findMatchingCommands(
            commands,
            'set age',
            { enabled: true }
        )

        const match = matches[0]

        if (match.type !== 'NUMBER') {
            fail('Expected NUMBER match')
        }

        expect(match.parameterMatchState).toBe('COMMAND_ONLY')
    })

    test('returns complete match state for full parameter', () => {
        const matches = findMatchingCommands(
            commands,
            'set age 5',
            { enabled: true }
        )

        const match = matches[0]

        if (match.type !== 'NUMBER') {
            fail('Expected NUMBER match')
        }

        expect(match.parameterMatchState).toBe('COMPLETE')
    })
})

describe('executeCommand', () => {

    test('executes fixed command', () => {
        const action = jest.fn()

        executeCommand(
            {
                type: 'FIXED',
                commandName: 'Reset',
                command: {
                    action
                },
                score: 1,
                parsedParam: undefined,
                matchIndexes: []
            },
            {}
        )

        expect(action).toHaveBeenCalled()
    })

    test('executes number command', () => {
        const action = jest.fn()

        executeCommand(
            {
                type: 'NUMBER',
                commandName: 'Set Age',
                command: {
                    type: 'NUMBER',
                    action
                },
                score: 1,
                parsedParam: 5,
                matchIndexes: [],
                parameterMatchIndexes: [],
                parameterMatchState: 'COMPLETE'
            },
            {}
        )

        expect(action).toHaveBeenCalledWith({}, 5)
    })

    test('does not execute incomplete number command', () => {
        const action = jest.fn()

        executeCommand(
            {
                type: 'NUMBER',
                commandName: 'Set Age',
                command: {
                    type: 'NUMBER',
                    action
                },
                score: 1,
                parsedParam: 0,
                matchIndexes: [],
                parameterMatchIndexes: [],
                parameterMatchState: 'COMMAND_ONLY'
            },
            {}
        )

        expect(action).not.toHaveBeenCalled()
    })

    test('executes string command', () => {
        const action = jest.fn()

        executeCommand(
            {
                type: 'STRING',
                commandName: 'Set Player',
                command: {
                    type: 'STRING',
                    action
                },
                score: 1,
                parsedParam: 'Johan',
                matchIndexes: [],
                parameterMatchIndexes: [],
                parameterMatchState: 'COMPLETE'
            },
            {}
        )

        expect(action).toHaveBeenCalledWith({}, 'Johan')
    })

    test('executes enum command', () => {
        const action = jest.fn()

        executeCommand(
            {
                type: 'ENUM',
                commandName: 'Set Mode',
                command: {
                    type: 'ENUM',
                    values: ['easy', 'hard'],
                    action
                },
                score: 1,
                parsedParam: 'easy',
                matchIndexes: [],
                parameterMatchIndexes: [],
                parameterMatchState: 'COMPLETE'
            },
            {}
        )

        expect(action).toHaveBeenCalledWith({}, 'easy')
    })
})