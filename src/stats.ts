interface Variable {
    average: number
    latestValue: number
    isLatestValueHighest: boolean
    isLatestValueLowest: boolean
    numberOfMeasurements: number
    currentHighestValue: number
    currentLowestValue: number
}

const variables = new Map<string, Variable>()

function addVariableIfAbsent(name: string): void {
    if (!variables.has(name)) {
        variables.set(name,
            {
                average: 0,
                latestValue: 0,
                isLatestValueHighest: false,
                isLatestValueLowest: false,
                numberOfMeasurements: 0,
                currentHighestValue: 0,
                currentLowestValue: 0
            }
        )
    }
}

function reportValueForVariable(name: string, value: number): void {
    const variable = variables.get(name)

    if (!variable) {
        return
    }

    variable.latestValue = value;

    if (variable.numberOfMeasurements == 0) {
        variable.average = value;
        variable.isLatestValueHighest = true;
        variable.isLatestValueLowest = true;
    } else {
        variable.average = (variable.average * variable.numberOfMeasurements + value) / (variable.numberOfMeasurements + 1);
    }

    variable.isLatestValueHighest = value > variable.currentHighestValue;
    variable.isLatestValueLowest = value < variable.currentLowestValue;

    if (variable.isLatestValueHighest) {
        variable.currentHighestValue = value;
    }

    if (variable.isLatestValueLowest) {
        variable.currentLowestValue = value;
    }

    variable.numberOfMeasurements = variable.numberOfMeasurements + 1;
}

function getAverageValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.average
}

function getHighestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.currentHighestValue
}

function getLowestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.currentLowestValue
}

function getLatestValueForVariable(name: string): number {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.latestValue
}

function isLatestValueHighestForVariable(name: string): boolean {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.isLatestValueHighest
}

function isLatestValueLowestForVariable(name: string): boolean {
    const variable = variables.get(name)

    if (!variable) {
        throw new Error("Unknown variable " + name)
    }

    return variable.isLatestValueLowest
}

function getVariableNames(): IterableIterator<string> {
    return variables.keys()
}

export { getHighestValueForVariable, getVariableNames, isLatestValueLowestForVariable, isLatestValueHighestForVariable, getLatestValueForVariable, getAverageValueForVariable, reportValueForVariable, addVariableIfAbsent }