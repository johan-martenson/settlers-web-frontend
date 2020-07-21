interface Point {
    x: number
    y: number
}

function pointToString(point: Point): string {
    return "" + point.x + "," + point.y
}

function stringToPoint(pointAsString: string): Point {
    const [x, y] = pointAsString.split(',')

    return { x: parseInt(x), y: parseInt(y) }
}

function pointToFastKey(point: Point): number {
    if (point.y > 1000 - 1) {
        throw new Error("Cannot handle y values larger than 999")
    }

    if (point.y < 0) {
        throw new Error("Cannot handle y values under 0")
    }

    return 1000 * point.x + point.y
}

function keyToFastPoint(key: number): Point {
    const y = key % 1000
    const x = (key - y) / 1000
    return { x, y }
}

class PointSetIterator implements IterableIterator<Point> {

    private pointIterator: IterableIterator<[string, string]>

    constructor(stringIterator: IterableIterator<[string, string]>) {
        this.pointIterator = stringIterator
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this
    }

    next(value?: any): IteratorResult<Point> {
        const iterationResult = this.pointIterator.next()

        if (iterationResult.value) {

            return {
                done: iterationResult.done,
                value: stringToPoint(iterationResult.value[0])
            }
        }

        return {
            done: iterationResult.done,
            value: { x: 3, y: 2 }
        }
    }
}


class PointFastIterator implements IterableIterator<Point> {

    private pointFastSetIterator: IterableIterator<number>

    constructor(pointFastSetIterator: IterableIterator<number>) {
        this.pointFastSetIterator = pointFastSetIterator
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this
    }

    next(value?: Point): IteratorResult<Point> {
        const result = this.pointFastSetIterator.next()

        if (result.value) {

            return {
                done: result.done,
                value: keyToFastPoint(result.value)
            }
        } else {
            return {
                done: true,
                value: {x: 2, y: 3}
            }
        }
    }
}


class PointSetFastIterator implements IterableIterator<Point> {

    private pointFastSetIterator: IterableIterator<[number, number]>

    constructor(pointFastSetIterator: IterableIterator<[number, number]>) {
        this.pointFastSetIterator = pointFastSetIterator
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this
    }

    next(value?: Point): IteratorResult<Point> {
        const result = this.pointFastSetIterator.next()

        if (result.value) {

            return {
                done: result.done,
                value: keyToFastPoint(result.value[0])
            }
        } else {
            return {
                done: true,
                value: {x: 2, y: 3}
            }
        }
    }
}

class PointEntryFastIterator<T> implements IterableIterator<[Point, T]> {

    private pointEntryFastIterator: IterableIterator<[number, T]>

    constructor(pointEntryFastIterator: IterableIterator<[number, T]>) {
        this.pointEntryFastIterator = pointEntryFastIterator
    }

    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this
    }

    next(inValue?: [Point, T]): IteratorResult<[Point, T]> {
        const result = this.pointEntryFastIterator.next()

        if (result.done) {
            return {
                done: true,
                value: 1
            }
        }

        const [pointNumber, value] = result.value

        return {
            done: result.done,
            value: [keyToFastPoint(pointNumber), value]
        }
    }
}

class PointSetFast implements IterableIterator<Point> {
    private pointSet: Set<number>

    constructor(points?: Set<Point> | Point[]) {
        this.pointSet = new Set<number>()

        if (points) {
            for (const point of points) {
                this.pointSet.add(pointToFastKey(point))
            }
        }
    }

    add(point: Point): void {
        this.pointSet.add(pointToFastKey(point))
    }

    delete(point: Point): void {
        this.pointSet.delete(pointToFastKey(point))
    }

    has(point: Point): boolean {
        return this.pointSet.has(pointToFastKey(point))
    }

    entries(): IterableIterator<Point> {
        return new PointSetFastIterator(this.pointSet.entries())
    }

    size(): number {
        return this.pointSet.size
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this.entries()
    }

    next(value?: any): IteratorResult<Point> {
        throw new Error("Method not implemented.")
    }
}

class PointSet implements IterableIterator<Point> {

    private pointAsStringSet: Set<string>

    constructor(pointSet?: Set<Point> | Point[]) {
        this.pointAsStringSet = new Set<string>()

        if (pointSet) {
            for (const point of pointSet) {
                this.pointAsStringSet.add(pointToString(point))
            }
        }
    }

    add(point: Point): void {
        this.pointAsStringSet.add(pointToString(point))
    }

    delete(point: Point): void {
        this.pointAsStringSet.delete(pointToString(point))
    }

    has(point: Point): boolean {
        return this.pointAsStringSet.has(pointToString(point))
    }

    entries(): IterableIterator<Point> {
        return new PointSetIterator(this.pointAsStringSet.entries())
    }

    size(): number {
        return this.pointAsStringSet.size
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return new PointSetIterator(this.pointAsStringSet.entries())
    }

    next(value?: any): IteratorResult<Point> {
        throw new Error("Method not implemented.")
    }
}

class PointMapIterator implements IterableIterator<Point> {

    private pointAsStringIterator: IterableIterator<string>

    constructor(pointAsStringIterator: IterableIterator<string>) {
        this.pointAsStringIterator = pointAsStringIterator
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this
    }

    next(value?: any): IteratorResult<Point> {
        const result = this.pointAsStringIterator.next()

        if (!result.value) {
            return {
                done: result.done,
                value: { x: 3, y: 4 }
            }
        }

        return {
            done: result.done,
            value: stringToPoint(result.value)
        }
    }
}

class PointMapEntryIterator<T> implements IterableIterator<[Point, T]> {
    private entryIterator: IterableIterator<[string, T]>

    constructor(pointAsStringMap: IterableIterator<[string, T]>) {
        this.entryIterator = pointAsStringMap
    }

    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this
    }

    next(inValue?: any): IteratorResult<[Point, T]> {
        const result = this.entryIterator.next()

        if (result.done) {
            return {
                done: true,
                value: 1
            }
        }

        const [pointString, value] = result.value

        return {
            done: result.done,
            value: [stringToPoint(pointString), value]
        }
    }
}

class PointMapFast<T> implements Map<Point, T> {

    private numberToPointMap: Map<number, T>

    constructor(pointAsStringDict?: { [pointAsString: string]: T }) {
        this.numberToPointMap = new Map<number, T>()

        if (pointAsStringDict) {
            for (const pointAsString in pointAsStringDict) {
                const point = stringToPoint(pointAsString)

                this.numberToPointMap.set(pointToFastKey(point), pointAsStringDict[pointAsString])
            }

        }
    }

    clear(): void {
        this.numberToPointMap.clear()
    }

    delete(point: Point): boolean {
        return this.numberToPointMap.delete(pointToFastKey(point))
    }

    forEach(callbackfn: (value: T, key: Point, map: Map<Point, T>) => void, thisArg?: any): void {
        this.numberToPointMap.forEach(
            (value, key, map) => {
                callbackfn(value, keyToFastPoint(key), this)
            }
        )
    }

    get(point: Point): T | undefined {
        return this.numberToPointMap.get(pointToFastKey(point))
    }

    has(point: Point): boolean {
        return this.numberToPointMap.has(pointToFastKey(point))
    }

    set(point: Point, value: T): this {
        this.numberToPointMap.set(pointToFastKey(point), value)

        return this
    }

    get size(): number {
        return this.numberToPointMap.size
    }
    
    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this.entries()
    }
    entries(): IterableIterator<[Point, T]> {
        return new PointEntryFastIterator(this.numberToPointMap.entries())
    }
    keys(): IterableIterator<Point> {
        return new PointFastIterator(this.numberToPointMap.keys())
    }

    values(): IterableIterator<T> {
        return this.numberToPointMap.values()
    }

    [Symbol.toStringTag]: string
}

class PointMap<T> implements Map<Point, T> {

    private pointAsStringMap: Map<string, T>

    constructor(pointAsStringDict?: { [pointAsString: string]: T }) {

        if (pointAsStringDict) {
            this.pointAsStringMap = new Map<string, T>()

            for (const key in pointAsStringDict) {
                this.pointAsStringMap.set(key, pointAsStringDict[key])
            }

        } else {
            this.pointAsStringMap = new Map<string, T>()
        }
    }

    clear(): void {
        this.pointAsStringMap.clear()
    }

    forEach(callbackfn: (value: T, key: Point, map: Map<Point, T>) => void, thisArg?: any): void {

        this.pointAsStringMap.forEach(
            (value, key, map) => callbackfn(value, stringToPoint(key), this)
        )
    }

    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this.entries()
    }

    entries(): IterableIterator<[Point, T]> {
        const entryIterator = this.pointAsStringMap.entries()
        const pointMapEntryIterator = new PointMapEntryIterator<T>(entryIterator)

        return pointMapEntryIterator
    }

    [Symbol.toStringTag]: string

    get size(): number {
        return this.pointAsStringMap.size
    }

    set(point0: Point, arg1: T): this {
        this.pointAsStringMap.set(pointToString(point0), arg1)

        return this
    }

    get(point0: Point): T | undefined {
        return this.pointAsStringMap.get(pointToString(point0))
    }

    delete(point0: Point): boolean {
        const key = pointToString(point0)
        const found = this.pointAsStringMap.has(key)

        this.pointAsStringMap.delete(key)

        return found
    }

    has(point1: Point): boolean {
        return this.pointAsStringMap.has(pointToString(point1))
    }

    keys(): IterableIterator<Point> {
        this.pointAsStringMap.keys()
        return new PointMapIterator(this.pointAsStringMap.keys())
    }

    values(): IterableIterator<T> {
        return this.pointAsStringMap.values()
    }
}

export { PointSetFast, PointMapFast } 