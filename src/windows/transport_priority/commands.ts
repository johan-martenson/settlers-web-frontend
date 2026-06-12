import { TRANSPORT_CATEGORIES, TransportCategory } from '../../api/types'
import { api } from '../../api/ws-api'
import { transportCategoryPretty } from '../../utils/pretty-strings'
import { GenericCommand } from '../../utils/typing-commands'

/// Functions
function makeTransportCommands(): Map<string, GenericCommand<TransportCategory>> {
    const commands = new Map<string, GenericCommand<TransportCategory>>()

    TRANSPORT_CATEGORIES.forEach(category => {
        const categoryName = transportCategoryPretty(category).toLowerCase()

        commands.set(`Set ${categoryName} priority`, {
            type: 'NUMBER',
            parameterName: 'priority',
            min: 0,
            max: TRANSPORT_CATEGORIES.size - 1,
            action: (_current: TransportCategory, priority: number) => {
                api.setTransportPriorityForMaterial(category, priority)
            }
        })

        commands.set('Set max priority', {
            type: 'ENUM',
            values: Array.from(TRANSPORT_CATEGORIES),
            action: (category: TransportCategory) => api.setTransportPriorityForMaterial(category, TRANSPORT_CATEGORIES.size - 1)
        })
        commands.set('Set min priority', {
            type: 'ENUM',
            values: Array.from(TRANSPORT_CATEGORIES),
            action: (category: TransportCategory) => api.setTransportPriorityForMaterial(category, 0)
        })
    })

    return commands
}

function makeTransportCommandsWithoutFilter(): Map<string, GenericCommand<TransportCategory>> {
    return new Map(
        Array.from(makeTransportCommands().entries())
            .map(([name, command]) => [name, { ...command, filter: undefined }])
    )
}

/// Exports
export {
    makeTransportCommands,
    makeTransportCommandsWithoutFilter
}