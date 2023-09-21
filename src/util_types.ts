interface Point {
    x: number
    y: number
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

class PointFastIterator implements IterableIterator<Point> {

    private pointFastSetIterator: IterableIterator<number>

    constructor(pointFastSetIterator: IterableIterator<number>) {
        this.pointFastSetIterator = pointFastSetIterator
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this
    }

    next(): IteratorResult<Point> {
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

    next(): IteratorResult<Point> {
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

    next(): IteratorResult<[Point, T]> {
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

    next(): IteratorResult<Point> {
        throw new Error("Method not implemented.")
    }

    forEach(arg0: (v: Point, i: number) => void): void {
        this.pointSet.forEach((value, index) => {
            const point = keyToFastPoint(value)
            arg0(point, index)
        })
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

    // eslint-disable-next-line
    forEach(callbackfn: (value: T, key: Point, map: Map<Point, T>) => void, thisArg?: unknown): void {
        this.numberToPointMap.forEach(
            (value, key) => {
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

export { PointSetFast, PointMapFast } 