interface Point {
    x: number
    y: number
}

function stringToPoint(pointAsString: string): Point {
    const [x, y] = pointAsString.split(',')

    return { x: parseInt(x), y: parseInt(y) }
}

function pointToKey(point: Point): number {
    if (point.y > 1000 || point.y < -1000) {
        throw new Error(`Cannot handle y values outside of the range -1000 <= n <= 1000. Value is: ${point.y}`)
    }

    if (point.x > 1000 || point.x < -1000) {
        throw new Error(`Cannot handle x values outside of the range -1000 <= n <= 1000. Value is: ${point.x}`)
    }

    const shiftedX = point.x + 1000
    const shiftedY = point.y + 1000

    // Pack the two values into a single 32-bit integer
    return (shiftedX << 11) | shiftedY
}

function keyToPoint(key: number): Point {
    const shiftedX = (key >> 11) & 0x7FF // Mask with 0x7FF to keep only 11 bits
    const shiftedY = key & 0x7FF

    // Shift the range back to [-1000, 1000]
    const x = shiftedX - 1000
    const y = shiftedY - 1000

    return { x, y }
}

class PointSetIterator implements IterableIterator<Point> {
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
                value: keyToPoint(result.value[0])
            }
        } else {
            return {
                done: true,
                value: { x: 2, y: 3 }
            }
        }
    }
}

class PointSet implements IterableIterator<Point> {
    private pointSet: Set<number>

    constructor(points?: Set<Point> | Point[]) {
        this.pointSet = new Set<number>()

        if (points) {
            for (const point of points) {
                this.pointSet.add(pointToKey(point))
            }
        }
    }

    clear(): void {
        this.pointSet.clear()
    }

    add(point: Point): void {
        this.pointSet.add(pointToKey(point))
    }

    delete(point: Point): void {
        this.pointSet.delete(pointToKey(point))
    }

    has(point: Point): boolean {
        return this.pointSet.has(pointToKey(point))
    }

    entries(): IterableIterator<Point> {
        return new PointSetIterator(this.pointSet.entries())
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

    forEach(callback: (v: Point, i: number) => void): void {
        this.pointSet.forEach((value, index) => {
            const point = keyToPoint(value)
            callback(point, index)
        })
    }

    filter(predicate: (point: Point) => boolean): PointSet {
        const filtered = new PointSet()
        this.forEach(point => {
            if (predicate(point)) {
                filtered.add(point)
            }
        })
        return filtered
    }

    map(transform: (point: Point) => Point): PointSet {
        const mapped = new PointSet()
        this.forEach(point => mapped.add(transform(point)))
        return mapped
    }
}

class PointMap<T> implements Map<Point, T> {
    private numberToPointMap: Map<number, T>

    constructor(pointAsStringDict?: { [pointAsString: string]: T }) {
        this.numberToPointMap = new Map<number, T>()

        if (pointAsStringDict) {
            for (const pointAsString in pointAsStringDict) {
                const point = stringToPoint(pointAsString)

                this.numberToPointMap.set(pointToKey(point), pointAsStringDict[pointAsString])
            }

        }
    }

    clear(): void {
        this.numberToPointMap.clear()
    }

    delete(point: Point): boolean {
        return this.numberToPointMap.delete(pointToKey(point))
    }

    // eslint-disable-next-line
    forEach(callbackfn: (value: T, key: Point, map: Map<Point, T>) => void, thisArg?: unknown): void {
        this.numberToPointMap.forEach(
            (value, key) => callbackfn(value, keyToPoint(key), this)
        )
    }

    get(point: Point): T | undefined {
        return this.numberToPointMap.get(pointToKey(point))
    }

    has(point: Point): boolean {
        return this.numberToPointMap.has(pointToKey(point))
    }

    set(point: Point, value: T): this {
        this.numberToPointMap.set(pointToKey(point), value)

        return this
    }

    get size(): number {
        return this.numberToPointMap.size
    }

    [Symbol.iterator](): MapIterator<[Point, T]> {
        return this.entries()
    }

    entries(): MapIterator<[Point, T]> {
        return this.transformIterator(this.numberToPointMap.entries())
    }

    keys(): MapIterator<Point> {
        return this.transformIterator(this.numberToPointMap.keys())
    }

    values(): MapIterator<T> {
        return this.numberToPointMap.values()
    }

    [Symbol.toStringTag]: string

    private *transformIterator<K>(
        iterator: IterableIterator<K>

        // eslint-disable-next-line
    ): MapIterator<any> {
        for (const item of iterator) {
            if (typeof item === "number") {
                yield keyToPoint(item)
            } else if (Array.isArray(item)) {
                yield [keyToPoint(item[0]), item[1]]
            } else {
                yield item
            }
        }
    }
}

export {
    PointSet,
    PointMap,
    pointToKey,
    keyToPoint
} 