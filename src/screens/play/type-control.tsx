import { useCallback, useState } from 'react'
import './type-control.css'
import { PointInformationWithoutPossibleRoadConnections } from '../../api/types'

import { CommandMatch, GenericCommand } from '../../utils/typing-commands'
import { NoMatch, TypeMatch } from '../../components/typing/typing'
import { KeyboardRegular } from '@fluentui/react-icons'

// Types
type TypeControlProps = {
    input: string
    commands: Map<string, GenericCommand<PointInformationWithoutPossibleRoadConnections>>
    available: Set<string>
    matches: CommandMatch<PointInformationWithoutPossibleRoadConnections>[]
    onCommand: (match: CommandMatch<PointInformationWithoutPossibleRoadConnections>) => void
}

// Log configuration
export const TypeControlLogConfig = {
    lifecycle: false,
    input: false,
    commands: false,
    selection: false,
}

// React components
const TypeControl = ({ commands, input, available, matches, onCommand }: TypeControlProps) => {

    // State
    const [expanded, setExpanded] = useState<boolean>(false)

    // Functions
    const toggleExpanded = useCallback(() => setExpanded(prev => !prev), [])

    // Rendering
    let className = 'no-input'

    if (input.length > 0) {
        className = matches.length > 0
            ? 'input-with-matches'
            : 'input-with-no-matches'
    }

    className += expanded ? ' typing-expanded' : ' typing-closed'

    const matchesMap = new Map(matches.map(match => [match.commandName, match]))
    const topMatch = (matches !== undefined && matches.length > 0) ? matches[0] : undefined

    return (
        <div
            className='type-control'
            onWheel={event => event.stopPropagation()}
        >

            <div>
                <KeyboardRegular
                    fontSize={30}
                    onClick={() => setExpanded(prev => !prev)}
                />
            </div>
            <div className={className}>
                {topMatch !== undefined &&
                    <TypeMatch match={topMatch} />
                }
                {topMatch === undefined && input !== undefined && input.trim().length > 0 &&
                    <NoMatch text={input} />}
            </div>

            <div className='type-commands-container'>
                {[...available].map(commandName => {
                    const match = matchesMap.get(commandName)

                    if (input.trim().length > 0 && match && !match.command.hidden) {
                        return (
                            <div
                                key={commandName}
                                className='type-control-command'
                                onClick={() => onCommand(match)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        onCommand(match)
                                    }
                                }}
                                role='button'
                                tabIndex={0}
                            >
                                <div className='type-control-command-label'>
                                    <TypeMatch match={match} />
                                </div>
                            </div>
                        )
                    } else if (expanded) {
                        const command = commands.get(commandName)

                        if (command && !command.hidden) {
                            return (
                                <div key={commandName} className={'type-control-command not-matching'} >
                                    <div className={input && input.trim().length > 0
                                        ? 'type-control-command-label not-matching'
                                        : 'type-control-command-label'}>
                                        {commandName}
                                    </div>
                                    <div className='type-control-command-icon'>
                                        {command.icon}
                                    </div>
                                </div>
                            )
                        }
                    }

                    return null
                })}
            </div>
        </div>
    )
}

export {
    TypeControl
}
