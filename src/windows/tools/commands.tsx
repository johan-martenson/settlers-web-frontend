import { Nation, TOOLS } from '../../api/types'
import { api } from '../../api/ws-api'
import { InventoryIcon, UiIcon } from '../../components/icons/icon'
import { materialPretty } from '../../utils/pretty-strings'
import { GenericCommand } from '../../utils/typing-commands'

/// Functions
function makeToolCommands(nation: Nation): Map<string, GenericCommand<object>> {
    const commands = new Map<string, GenericCommand<object>>()

    TOOLS.forEach(tool => {
        const name = materialPretty(tool).toLowerCase()

        commands.set(`Set ${name} priority`, {
            type: 'NUMBER',
            min: 0,
            max: 10,
            parameterName: 'priority',
            action: (_context: object, priority: number) => {
                api.setToolPriority(tool, priority)
            },
            icon: <InventoryIcon material={tool} scale={0.8} nation={nation} />
        })

        commands.set(`Max ${name} priority`, {
            action: () => api.setToolPriority(tool, 10),
            icon: <InventoryIcon material={tool} scale={0.8} nation={nation} />
        })

        commands.set(`Clear ${name} priority`, {
            action: () => api.setToolPriority(tool, 0),
            icon: <InventoryIcon material={tool} scale={0.8} nation={nation} missing />
        })
    })

    commands.set('Max all priorities', {
        action: () => TOOLS.forEach(tool => api.setToolPriority(tool, 10)),
        icon: <UiIcon type='PLUS' scale={0.5} />
    })

    commands.set('Clear all priorities', {
        action: () => TOOLS.forEach(tool => api.setToolPriority(tool, 0)),
        icon: <UiIcon type='MINUS' scale={0.5} />
    })

    return commands
}

function makeToolCommandsWithoutFilter(nation: Nation): Map<string, GenericCommand<object>> {
    return new Map(
        Array.from(makeToolCommands(nation).entries())
            .map(([name, command]) => [name, { ...command, filter: undefined }])
    )
}

/// Exports
export {
    makeToolCommands,
    makeToolCommandsWithoutFilter
}