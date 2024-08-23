// Types
type Variable = {
    average: number
    latestValue: number
    isLatestValueHighest: boolean
    isLatestValueLowest: boolean
    numberOfMeasurements: number
    currentHighestValue: number
    currentLowestValue: number
}

// State
const variables = new Map<string, Variable>()

// Functions
/**
 * Adds a variable to the map if it is not already present.
 *
 * @param name - The name of the variable
 */
function addVariableIfAbsent(name: string): void {
    if (!variables.has(name)) {
        variables.set(name, {
            average: 0,
            latestValue: 0,
            isLatestValueHighest: false,
            isLatestValueLowest: false,
            numberOfMeasurements: 0,
            currentHighestValue: 0,
            currentLowestValue: 0
        })
    }
}

/**
 * Updates the variable with a new value, recalculating averages, highs, and lows.
 *
 * @param name - The name of the variable
 * @param value - The new value to report
 */
function reportValueForVariable(name: string, value: number): void {
    const variable = variables.get(name)

    if (!variable) {
        return
    }

    variable.latestValue = value

    if (variable.numberOfMeasurements === 0) {
        variable.average = value
        variable.isLatestValueHighest = true
        variable.isLatestValueLowest = true
        variable.currentHighestValue = value
        variable.currentLowestValue = value
    } else {
        variable.average = (variable.average * variable.numberOfMeasurements + value) / (variable.numberOfMeasurements + 1)
        variable.isLatestValueHighest = value > variable.currentHighestValue
        variable.isLatestValueLowest = value < variable.currentLowestValue

        if (variable.isLatestValueHighest) {
            variable.currentHighestValue = value
        }

        if (variable.isLatestValueLowest) {
            variable.currentLowestValue = value
        }
    }

    variable.numberOfMeasurements = variable.numberOfMeasurements + 1
}

/**
 * Retrieves the average value of a variable.
 *
 * @param name - The name of the variable
 * @returns The average value
 * @throws Error if the variable is not found
 */
function getAverageValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable ${name}`)
    }

    return variable.average
}

/**
 * Retrieves the highest recorded value of a variable.
 *
 * @param name - The name of the variable
 * @returns The highest value
 * @throws Error if the variable is not found
 */
function getHighestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable: ${name}`)
    }

    return variable.currentHighestValue
}

/**
 * Retrieves the lowest recorded value of a variable.
 *
 * @param name - The name of the variable
 * @returns The lowest value
 * @throws Error if the variable is not found
 */
function getLowestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable: ${name}`)
    }

    return variable.currentLowestValue
}

/**
 * Retrieves the latest recorded value of a variable.
 *
 * @param name - The name of the variable
 * @returns The latest value
 * @throws Error if the variable is not found
 */
function getLatestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable: ${name}`)
    }

    return variable.latestValue
}

/**
 * Checks if the latest value is the highest recorded for a variable.
 *
 * @param name - The name of the variable
 * @returns True if the latest value is the highest, false otherwise
 * @throws Error if the variable is not found
 */
function isLatestValueHighestForVariable(name: string): boolean {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable: ${name}`)
    }

    return variable.isLatestValueHighest
}

/**
 * Checks if the latest value is the lowest recorded for a variable.
 *
 * @param name - The name of the variable
 * @returns True if the latest value is the lowest, false otherwise
 * @throws Error if the variable is not found
 */
function isLatestValueLowestForVariable(name: string): boolean {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error(`Unknown variable: ${name}`)
    }

    return variable.isLatestValueLowest
}

/**
 * Retrieves an iterator for the names of all stored variables.
 *
 * @returns An iterator for the variable names
 */
function getVariableNames(): IterableIterator<string> {
    return variables.keys()
}

/**
 * Logs the statistics for all variables.
 */
function printVariables(): void {
    const output: Record<string, Record<string, number>> = {}

    for (const name of getVariableNames()) {
        output[name] = {
            latest: getLatestValueForVariable(name),
            average: getAverageValueForVariable(name),
            highest: getHighestValueForVariable(name),
            lowest: getLowestValueForVariable(name)
        }

    }

    console.log(output)
}

export { printVariables, getHighestValueForVariable, getVariableNames, isLatestValueLowestForVariable, isLatestValueHighestForVariable, getLatestValueForVariable, getAverageValueForVariable, reportValueForVariable, addVariableIfAbsent }
