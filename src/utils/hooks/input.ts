import { useCallback, useMemo, useRef, useState } from 'react'
import { HooksConfig } from './config'

// Types
type UseTypingInputResult = {
    inputValue: string
    inputValueRef: React.MutableRefObject<string>
    keyTyped: (event: React.KeyboardEvent) => void
    clear: () => void
}

type UseTypingInputProps = {
    clearOnEscape?: boolean
    clearOnEnter?: boolean
    preventMultipleSpaces?: boolean
    preventInitialSpace?: boolean
}

// Hooks

/**
 * A hook that manages typing input, allowing for character input, backspace, and escape to clear.
 * 
 * @returns {Object} An object containing the current input value, a ref to the input value, and a keyTyped function to handle key events.
 */
function useTypingInput({ clearOnEscape = true, clearOnEnter = true, preventInitialSpace = true, preventMultipleSpaces = true }: UseTypingInputProps = {}): UseTypingInputResult {

    // State
    const [inputValue, setInputValue] = useState('')

    // Refs
    const inputValueRef = useRef(inputValue)

    // Keep the input ref in sync
    inputValueRef.current = inputValue

    // Effects
    // Functions
    const keyTyped = useCallback((event: React.KeyboardEvent) => {
        if (HooksConfig.useTypingInput) {
            console.log(`Hooks (useTypingInput): Key typed: ${event.key}`)
        }

        // Ignore shortcuts
        if (event.ctrlKey || event.metaKey || event.altKey) {
            if (HooksConfig.useTypingInput) {
                console.log('Hooks (useTypingInput): Ignoring shortcut key')
            }
            return
        }

        // Ignore key events from input fields
        const target = event.target as HTMLElement | null

        if (target?.tagName === 'INPUT' ||
            target?.tagName === 'TEXTAREA' ||
            target?.isContentEditable) {
            if (HooksConfig.useTypingInput) {
                console.log('Hooks (useTypingInput): Ignoring typing in editable element')
            }

            return
        }

        // Filter repeats
        if (event.repeat) {
            if (HooksConfig.useTypingInput) {
                console.log('Hooks (useTypingInput): Ignoring repeated key event')
            }

            return
        }

        if (event.key === 'Backspace') {
            if (HooksConfig.useTypingInput) {
                console.log('Hooks (useTypingInput): Removing last character')
            }

            setInputValue(prev => prev.slice(0, -1))

            event.preventDefault()
        } else if ((clearOnEscape && event.key === 'Escape') || (clearOnEnter && event.key === 'Enter')) {
            if (HooksConfig.useTypingInput) {
                console.log(`Hooks (useTypingInput): Clear input on ${event.key} key`)
            }

            setInputValue('')

            event.preventDefault()
        } else if (event.key.length === 1) {
            if (HooksConfig.useTypingInput) {
                console.log(`Hooks (useTypingInput): Appending character '${event.key}'`)
            }

            setInputValue(prev => {

                // Avoid initial space
                if (event.key === ' ' && ((preventInitialSpace && prev.length === 0) || (preventMultipleSpaces && prev.endsWith(' ')))) {
                    return prev
                }

                return prev + event.key
            })

            event.preventDefault()
        } else {
            if (HooksConfig.useTypingInput) {
                console.log(`Hooks (useTypingInput): Ignoring unsupported key '${event.key}'`)
            }
        }
    }, [])

    const clear = useCallback(() => {
        if (HooksConfig.useTypingInput) {
            console.log('Hooks (useTypingInput): Clearing input')
        }

        setInputValue('')
    }, [])

    // Memos
    return useMemo(() => ({
        inputValue,
        inputValueRef,
        keyTyped,
        clear
    }), [inputValue, keyTyped, clear])
}

export {
    useTypingInput
}