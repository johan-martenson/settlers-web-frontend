// Types
type Point = {
    x: number
    y: number
}

// Constants
const OFFSET = 1000
const WIDTH = 2048 // must be > 2 * OFFSET

// Functions
function assertValidPoint(point: Point): void {

    // Validate numbers early
    if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) {
        throw new Error(`Invalid point (non-integer): ${JSON.stringify(point)}`)
    }

    if (point.x < -OFFSET || point.x > OFFSET) {
        throw new Error(`x out of bounds [-${OFFSET}, ${OFFSET}]: ${point.x}`)
    }

    if (point.y < -OFFSET || point.y > OFFSET) {
        throw new Error(`y out of bounds [-${OFFSET}, ${OFFSET}]: ${point.y}`)
    }
}

function pointToKey(point: Point): number {
    assertValidPoint(point)

    const shiftedX = point.x + OFFSET
    const shiftedY = point.y + OFFSET

    return shiftedX * WIDTH + shiftedY
}

function keyToPoint(key: number): Point {
    const shiftedX = Math.floor(key / WIDTH)
    const shiftedY = key % WIDTH

    return {
        x: shiftedX - OFFSET,
        y: shiftedY - OFFSET
    }
}

// Classes
class PointSet implements Iterable<Point> {
    private readonly set = new Set<number>()

    constructor(points?: Iterable<Point>) {
        if (points) {
            for (const p of points) {
                this.add(p)
            }
        }
    }

    add(point: Point): void {
        this.set.add(pointToKey(point))
    }

    delete(point: Point): boolean {
        return this.set.delete(pointToKey(point))
    }

    has(point: Point): boolean {
        return this.set.has(pointToKey(point))
    }

    clear(): void {
        this.set.clear()
    }

    get size(): number {
        return this.set.size
    }

    *values(): IterableIterator<Point> {
        for (const key of this.set) {
            yield keyToPoint(key)
        }
    }

    *entries(): IterableIterator<[Point, Point]> {
        for (const key of this.set) {
            const p = keyToPoint(key)
            yield [p, p]
        }
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return this.values()
    }

    forEach(callback: (value: Point, value2: Point, set: PointSet) => void): void {
        for (const key of this.set) {
            const p = keyToPoint(key)
            callback(p, p, this)
        }
    }

    filter(predicate: (point: Point) => boolean): PointSet {
        const result = new PointSet()

        for (const p of this) {
            if (predicate(p)) {
                result.add(p)
            }
        }

        return result
    }

    map(transform: (point: Point) => Point): PointSet {
        const result = new PointSet()

        for (const p of this) {
            result.add(transform(p))
        }

        return result
    }
}

class PointMap<T> implements Iterable<[Point, T]> {
    private readonly map = new Map<number, T>()

    constructor(initial?: Iterable<[Point, T]>) {
        if (initial) {
            for (const [p, v] of initial) {
                this.set(p, v)
            }
        }
    }

    set(point: Point, value: T): this {
        this.map.set(pointToKey(point), value)
        return this
    }

    get(point: Point): T | undefined {
        return this.map.get(pointToKey(point))
    }

    has(point: Point): boolean {
        return this.map.has(pointToKey(point))
    }

    delete(point: Point): boolean {
        return this.map.delete(pointToKey(point))
    }

    clear(): void {
        this.map.clear()
    }

    get size(): number {
        return this.map.size
    }

    *keys(): IterableIterator<Point> {
        for (const key of this.map.keys()) {
            yield keyToPoint(key)
        }
    }

    *values(): IterableIterator<T> {
        yield* this.map.values()
    }

    *entries(): IterableIterator<[Point, T]> {
        for (const [key, value] of this.map.entries()) {
            yield [keyToPoint(key), value]
        }
    }

    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this.entries()
    }

    forEach(callback: (value: T, key: Point, map: PointMap<T>) => void): void {
        for (const [key, value] of this.map.entries()) {
            callback(value, keyToPoint(key), this)
        }
    }

    getOrInsert(point: Point, defaultValue: T): T {
        const existing = this.get(point)

        if (existing !== undefined) {
            return existing
        }

        this.set(point, defaultValue)

        return defaultValue
    }

    getOrInsertComputed(point: Point, compute: (key: Point) => T): T {
        const existing = this.get(point)

        if (existing !== undefined) {
            return existing
        }

        const value = compute(point)

        this.set(point, value)

        return value
    }
}

export { PointSet, PointMap, pointToKey, keyToPoint }
