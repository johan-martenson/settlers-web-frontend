import { TOOLS } from '../../api/types'
import { api } from '../../api/ws-api'
import { materialPretty } from '../../utils/pretty-strings'
import { GenericCommand } from '../../utils/typing-commands'

/// Functions
function makeToolCommands(): Map<string, GenericCommand<object>> {
    const commands = new Map<string, GenericCommand<object>>()

    TOOLS.forEach(tool => {
        const name = materialPretty(tool)

        commands.set(`Set ${name} priority`, {
            type: 'NUMBER',
            min: 0,
            max: 10,
            parameterName: 'priority',
            action: (_context: object, priority: number) => {
                api.setToolPriority(tool, priority)
            }
        })

        commands.set(`Max ${name} priority`, {
            action: () => {
                api.setToolPriority(tool, 10)
            }
        })

        commands.set(`Clear ${name} priority`, {
            action: () => {
                api.setToolPriority(tool, 0)
            }
        })
    })

    commands.set('Max all priorities', {
        action: () => {
            TOOLS.forEach(tool => api.setToolPriority(tool, 10))
        }
    })

    commands.set('Clear all priorities', {
        action: () => {
            TOOLS.forEach(tool => api.setToolPriority(tool, 0))
        }
    })

    return commands
}

function makeToolCommandsWithoutFilter(): Map<string, GenericCommand<object>> {
    return new Map(
        Array.from(makeToolCommands().entries())
            .map(([name, command]) => [name, { ...command, filter: undefined }])
    )
}

/// Exports
export {
    makeToolCommands,
    makeToolCommandsWithoutFilter
}