import { addVariableIfAbsent, reportValueForVariable } from './stats'

interface Timestamp {
    time: number
    name: string
}

class Duration {
    name: string
    stamps: Timestamp[]
    timestampAtStart: number

    constructor(name: string) {
        this.name = name
        this.timestampAtStart = Date.now()

        this.stamps = []
    }

    after(name: string): void {
        const time = Date.now()

        this.stamps.push({ time, name })
    }

    reportStats(): void {

        let previous = null

        for (const stamp of this.stamps) {
            if (previous) {
                const variableName = this.name + "." + stamp.name

                addVariableIfAbsent(variableName)

                reportValueForVariable(variableName, stamp.time - previous.time)
            }

            previous = stamp
        }

        if (previous) {

            const totalName = this.name + ".total"

            addVariableIfAbsent(totalName)

            reportValueForVariable(totalName, previous.time - this.timestampAtStart)
        }
    }
}

class AggregatedDuration {
    name: string
    stamps: Map<string, number>
    timestampAtStart: number
    previousTimestamp: number

    constructor(name: string) {
        this.name = name
        this.timestampAtStart = Date.now()
        this.previousTimestamp = this.timestampAtStart

        this.stamps = new Map<string, number>()
    }

    after(name: string): void {
        const current = this.stamps.get(name)

        const timeNow = Date.now()
        const timePassed = timeNow - this.previousTimestamp

        if (current) {
            this.stamps.set(name, current + timePassed)
        } else {
            this.stamps.set(name, timePassed)
        }

        this.previousTimestamp = timeNow
    }

    reportStats(): void {
        for (const [name, value] of this.stamps.entries()) {
            addVariableIfAbsent(name + ".aggregated")

            reportValueForVariable(name + ".aggregated", value)
        }
    }
}

export { AggregatedDuration, Duration }