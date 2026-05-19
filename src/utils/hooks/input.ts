import { useCallback, useEffect, useRef, useState } from "react";
import { HooksConfig } from "./config";

// Types
type UseTypingInputResult = {
    inputValue: string
    inputValueRef: React.MutableRefObject<string>
    keyTyped: (event: React.KeyboardEvent) => void
    clear: () => void
}


// Hooks

/**
 * A hook that manages typing input, allowing for character input, backspace, and escape to clear.
 * 
 * @returns {Object} An object containing the current input value, a ref to the input value, and a keyTyped function to handle key events.
 */
function useTypingInput(): UseTypingInputResult {

    // State
    const [inputValue, setInputValue] = useState('')

    // Refs
    const inputValueRef = useRef(inputValue)

    // Effects
    // Effect: Keep ref updated with state, so that it can be used in event listener without needing to add it to dependencies
    useEffect(() => {
        inputValueRef.current = inputValue
    }, [inputValue])

    // Functions
    const keyTyped = useCallback((event: React.KeyboardEvent) => {
        if (HooksConfig.useTypingInput) {
            console.log(`Hooks (useTypingInput): Key typed: ${event.key}`)
        }

        // Ignore shortcuts
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return
        }

        if (event.key === 'Backspace') {
            setInputValue(prev => prev.slice(0, -1))
        } else if (event.key === 'Escape' || event.key === 'Enter') {
            if (HooksConfig.useTypingInput) {
                console.log(`Hooks (useTypingInput): Clear input on ${event.key} key`)
            }

            setInputValue('')
        } else if (event.key.length === 1) {
            setInputValue(prev => {

                // Avoid initial space
                if (event.key === ' ' && prev.length === 0) {
                    return prev
                }

                return prev + event.key
            })
        }
    }, [])

    function clear() {
        setInputValue('')
    }

    return { inputValue, inputValueRef, keyTyped, clear }
}

export {
    useTypingInput
}