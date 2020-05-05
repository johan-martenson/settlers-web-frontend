interface Point {
    x: number
    y: number
}

function pointToString(point: Point): string {
    return "" + point.x + "," + point.y;
}

function stringToPoint(pointAsString: string): Point {
    const [x, y] = pointAsString.split(',')

    return { x: parseInt(x), y: parseInt(y) }
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
        return new PointSetIterator(this.pointAsStringSet.entries());
    }

    size(): number {
        return this.pointAsStringSet.size
    }

    [Symbol.iterator](): IterableIterator<Point> {
        return new PointSetIterator(this.pointAsStringSet.entries())
    }

    next(value?: any): IteratorResult<Point> {
        const s = new Set()
        s
        throw new Error("Method not implemented.");
    }
}

class ArrayTIterator<T> implements IterableIterator<T> {

    private arrayTIterator: IterableIterator<T>;

    constructor(arrayTIterator: IterableIterator<T>) {
        this.arrayTIterator = arrayTIterator
    }

    [Symbol
        .
        iterator](): IterableIterator<T> {
        return this
    }

    next(value?: any): IteratorResult<T> {
        const result = this.arrayTIterator.next()

        return {
            done: result.done,
            value: value
        }
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
    private entryIterator: IterableIterator<[string, T]>;

    constructor(pointAsStringMap: IterableIterator<[string, T]>) {
        this.entryIterator = pointAsStringMap
    }

    [Symbol
        .
        iterator](): IterableIterator<[Point, T]> {
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
        //return this.pointAsStringMap.forEach(callbackfn, thisArg) -- need to do own wrapper function that translates the key
        throw new Error("Method not implemented.");
    }

    [Symbol.iterator](): IterableIterator<[Point, T]> {
        return this.entries()
    }

    entries(): IterableIterator<[Point, T]> {
        const entryIterator = this.pointAsStringMap.entries()
        const pointMapEntryIterator = new PointMapEntryIterator<T>(entryIterator)

        return pointMapEntryIterator
    }

    [Symbol.toStringTag]: string;

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

export { PointMap, PointSet } 