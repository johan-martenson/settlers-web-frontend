import { Point } from "../api/types"
import { keyToPoint, PointMap, PointSet, pointToKey } from "../utils/point-value-collections"

describe('Point encoding and decoding', () => {
    it('should encode and decode points within the valid range', () => {
        const points = [
            { x: 0, y: 0 },
            { x: -1000, y: -1000 },
            { x: 1000, y: 1000 },
            { x: -500, y: 500 },
            { x: 123, y: -456 }
        ]

        points.forEach(point => {
            const key = pointToKey(point)
            const decodedPoint = keyToPoint(key)
            expect(decodedPoint).toEqual(point)
        })
    })

    it('should throw an error when encoding points outside the valid range', () => {
        const invalidPoints = [
            { x: -1001, y: 0 },
            { x: 1001, y: 0 },
            { x: 0, y: -1001 },
            { x: 0, y: 1001 },
            { x: -1001, y: 1001 }
        ]

        invalidPoints.forEach(point => {
            expect(() => pointToKey(point)).toThrow()
        })
    })
})

describe('PointSetFast', () => {
    let set: PointSet

    beforeEach(() => {
        set = new PointSet()
    })

    test('should add points correctly', () => {
        set.add({ x: 1, y: 2 })
        expect(set.size).toBe(1)
        set.add({ x: 3, y: 4 })
        expect(set.size).toBe(2)

        expect(set.has({ x: 1, y: 2 }))
        expect(set.has({ x: 3, y: 4 }))
    })

    test('should handle duplicate points based on x and y values', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 1, y: 2 })

        expect(set.size).toBe(1)
        expect(set.has({ x: 1, y: 2 }))
    })

    test('should correctly check the existence of a point', () => {
        set.add({ x: 1, y: 2 })

        expect(set.has({ x: 1, y: 2 })).toBeTruthy()
        expect(set.has({ x: 2, y: 3 })).toBeFalsy()
    })

    test('should remove a point correctly', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 2, y: 3 })
        set.delete({ x: 1, y: 2 })

        expect(set.size).toBe(1)
        expect(set.has({ x: 1, y: 2 })).toBeFalsy()
    })

    test('should clear all points', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 2, y: 3 })
        set.clear()

        expect(set.size).toBe(0)
        expect(!set.has({ x: 1, y: 2 }))
        expect(!set.has({ x: 2, y: 3 }))
    })

    test('should be iterable directly over the values', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
        points.forEach(point => set.add(point))

        const collectedPoints = []
        for (const point of set) {
            collectedPoints.push(point)
        }

        expect(collectedPoints).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }])
    })

    test('forEach should execute a callback for each point', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]
        points.forEach(point => set.add(point))

        const collectedPoints: Point[] = []
        
        set.forEach(point => {
            collectedPoints.push(point)
        })

        expect(collectedPoints).toEqual(points)
    })

    test('filter should return a new PointSet with only points that satisfy the predicate', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]
        points.forEach(point => set.add(point))
        const filteredSet = set.filter(point => point.x > 2)

        expect(filteredSet.size).toBe(2)
        expect(filteredSet.has({ x: 3, y: 4 })).toBeTruthy()
        expect(filteredSet.has({ x: 5, y: 6 })).toBeTruthy()
        expect(filteredSet.has({ x: 1, y: 2 })).toBeFalsy()
    })

    test('map should return a new PointSet with each point transformed by the function', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]
        points.forEach(point => set.add(point))
        const mappedSet = set.map(point => ({ x: point.x * 2, y: point.y * 2 }))

        expect(mappedSet.size).toBe(3)
        expect(mappedSet.has({ x: 2, y: 4 })).toBeTruthy()
        expect(mappedSet.has({ x: 6, y: 8 })).toBeTruthy()
        expect(mappedSet.has({ x: 10, y: 12 })).toBeTruthy()
    })
})

describe('PointMapFast', () => {
    let pointMap: PointMap<string>

    beforeEach(() => {
        pointMap = new PointMap()
    })

    test('should set and get values by point keys', () => {
        const point = { x: 5, y: 10 }
        pointMap.set(point, 'Test Value')
        expect(pointMap.get(point)).toBe('Test Value')
        expect(pointMap.get({ x: 5, y: 10 })).toBe('Test Value')  // Testing equality by value
    })

    test('should return correct boolean for has method', () => {
        const point = { x: 7, y: 14 }
        pointMap.set(point, 'Another Test')
        expect(pointMap.has(point)).toBeTruthy()
        expect(pointMap.has({ x: 7, y: 14 })).toBeTruthy()
        expect(pointMap.has({ x: 1, y: 1 })).toBeFalsy()
    })

    test('should handle deletion correctly', () => {
        const point = { x: 3, y: 6 }
        pointMap.set(point, 'Something')
        expect(pointMap.delete(point)).toBeTruthy()
        expect(pointMap.has(point)).toBeFalsy()
    })

    test('should clear all entries', () => {
        pointMap.set({ x: 1, y: 2 }, 'Value1')
        pointMap.set({ x: 3, y: 4 }, 'Value2')
        pointMap.clear()
        expect(pointMap.size).toBe(0)
    })

    test('should iterate over keys, values, and entries correctly', () => {
        const point1 = { x: 10, y: 20 }
        const point2 = { x: 30, y: 40 }
        pointMap.set(point1, 'Value10')
        pointMap.set(point2, 'Value30')

        const keys = Array.from(pointMap.keys())
        expect(keys).toContainEqual(point1)
        expect(keys).toContainEqual(point2)

        const values = Array.from(pointMap.values())
        expect(values).toContain('Value10')
        expect(values).toContain('Value30')

        const entries = Array.from(pointMap.entries())
        expect(entries).toContainEqual([point1, 'Value10'])
        expect(entries).toContainEqual([point2, 'Value30'])
    })

    test('forEach should call a callback for each entry', () => {
        const mockCallback = jest.fn()
        pointMap.set({ x: 5, y: 10 }, 'Value50')
        pointMap.set({ x: 15, y: 20 }, 'Value150')
        pointMap.forEach(mockCallback)

        expect(mockCallback.mock.calls.length).toBe(2)
    })
})

// =====================
// Additional robustness tests
// =====================

describe('Point encoding robustness', () => {

    test('should throw on non-integer coordinates', () => {
        expect(() => pointToKey({ x: 1.5, y: 2 })).toThrow()
        expect(() => pointToKey({ x: NaN, y: 2 })).toThrow()
        expect(() => pointToKey({ x: Infinity, y: 2 })).toThrow()
    })

    test('should roundtrip random points', () => {
        for (let i = 0; i < 1000; i++) {
            const point = {
                x: Math.floor(Math.random() * 2001) - 1000,
                y: Math.floor(Math.random() * 2001) - 1000
            }

            expect(keyToPoint(pointToKey(point))).toEqual(point)
        }
    })

    test('different points should produce different keys', () => {
        const a = pointToKey({ x: 1, y: 2 })
        const b = pointToKey({ x: 2, y: 1 })

        expect(a).not.toBe(b)
    })
})

describe('PointSet additional behavior', () => {
    let set: PointSet

    beforeEach(() => {
        set = new PointSet()
    })

    test('should preserve insertion order', () => {
        const points = [{ x: 3, y: 4 }, { x: 1, y: 2 }, { x: 5, y: 6 }]
        points.forEach(p => set.add(p))

        expect(Array.from(set)).toEqual(points)
    })

    test('re-adding a deleted point should move it to the end', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 3, y: 4 })
        set.delete({ x: 1, y: 2 })
        set.add({ x: 1, y: 2 })

        expect(Array.from(set)).toEqual([
            { x: 3, y: 4 },
            { x: 1, y: 2 }
        ])
    })

    test('should iterate over empty set correctly', () => {
        expect(Array.from(set)).toEqual([])
    })

    test('filter + map chain should behave correctly', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]
        points.forEach(p => set.add(p))

        const result = set
            .filter(p => p.x > 1)
            .map(p => ({ x: p.x + 1, y: p.y + 1 }))

        expect(Array.from(result)).toEqual([
            { x: 4, y: 5 },
            { x: 6, y: 7 }
        ])
    })
})

describe('PointMap additional behavior', () => {
    let pointMap: PointMap<string>

    beforeEach(() => {
        pointMap = new PointMap()
    })

    test('should overwrite existing value for same point', () => {
        const point = { x: 1, y: 2 }

        pointMap.set(point, 'A')
        pointMap.set(point, 'B')

        expect(pointMap.get(point)).toBe('B')
    })

    test('size should not increase when overwriting same key', () => {
        const point = { x: 1, y: 2 }

        pointMap.set(point, 'A')
        pointMap.set({ x: 1, y: 2 }, 'B')

        expect(pointMap.size).toBe(1)
    })

    test('should preserve insertion order in entries', () => {
        pointMap.set({ x: 1, y: 2 }, 'A')
        pointMap.set({ x: 3, y: 4 }, 'B')

        expect(Array.from(pointMap.entries())).toEqual([
            [{ x: 1, y: 2 }, 'A'],
            [{ x: 3, y: 4 }, 'B']
        ])
    })

    test('delete should return false for non-existing key', () => {
        expect(pointMap.delete({ x: 99, y: 99 })).toBe(false)
    })

    test('forEach should pass correct arguments', () => {
        const entries: any[] = []

        pointMap.set({ x: 1, y: 2 }, 'A')

        pointMap.forEach((value, key, map) => {
            entries.push([key, value, map])
        })

        expect(entries[0][0]).toEqual({ x: 1, y: 2 })
        expect(entries[0][1]).toBe('A')
        expect(entries[0][2]).toBe(pointMap)
    })

    test('should use value-based equality, not reference equality', () => {
        const p1 = { x: 1, y: 2 }
        const p2 = { x: 1, y: 2 }

        pointMap.set(p1, 'A')

        expect(pointMap.get(p2)).toBe('A')
    })

    test('mutating a point after insertion should not affect stored key', () => {
        const p = { x: 1, y: 2 }
        pointMap.set(p, 'A')

        p.x = 999

        expect(pointMap.get({ x: 1, y: 2 })).toBe('A')
    })

    test('should handle many points efficiently', () => {
        for (let i = 0; i < 10000; i++) {
            pointMap.set(
                { x: i % 1000, y: Math.floor(i / 1000) },
                `v${i}`
            )
        }

        expect(pointMap.size).toBe(10000)
    })
})