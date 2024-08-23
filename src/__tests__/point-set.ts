import { Point } from "../api/types"
import { keyToFastPoint, PointMapFast, PointSetFast, pointToFastKey } from "../util_types"

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
            const key = pointToFastKey(point)
            const decodedPoint = keyToFastPoint(key)
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
            expect(() => pointToFastKey(point)).toThrow()
        })
    })
})

describe('PointSetFast', () => {
    let set: PointSetFast

    beforeEach(() => {
        set = new PointSetFast()
    })

    test('should add points correctly', () => {
        set.add({ x: 1, y: 2 })
        expect(set.size()).toBe(1)
        set.add({ x: 3, y: 4 })
        expect(set.size()).toBe(2)

        expect(set.has({ x: 1, y: 2 }))
        expect(set.has({ x: 3, y: 4 }))
    })

    test('should handle duplicate points based on x and y values', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 1, y: 2 })

        expect(set.size()).toBe(1)
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

        expect(set.size()).toBe(1)
        expect(set.has({ x: 1, y: 2 })).toBeFalsy()
    })

    test('should clear all points', () => {
        set.add({ x: 1, y: 2 })
        set.add({ x: 2, y: 3 })
        set.clear()

        expect(set.size()).toBe(0)
        expect(!set.has({ x: 1, y: 2 }))
        expect(!set.has({ x: 2, y: 3 }))
    })

    test('should be iterable directly over the values', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
        points.forEach(point => set.add(point))

        const collectedPoints = []
        for (let point of set) {
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

        expect(filteredSet.size()).toBe(2)
        expect(filteredSet.has({ x: 3, y: 4 })).toBeTruthy()
        expect(filteredSet.has({ x: 5, y: 6 })).toBeTruthy()
        expect(filteredSet.has({ x: 1, y: 2 })).toBeFalsy()
    })

    test('map should return a new PointSet with each point transformed by the function', () => {
        const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]
        points.forEach(point => set.add(point))
        const mappedSet = set.map(point => ({ x: point.x * 2, y: point.y * 2 }))

        expect(mappedSet.size()).toBe(3)
        expect(mappedSet.has({ x: 2, y: 4 })).toBeTruthy()
        expect(mappedSet.has({ x: 6, y: 8 })).toBeTruthy()
        expect(mappedSet.has({ x: 10, y: 12 })).toBeTruthy()
    })
})

describe('PointMapFast', () => {
    let pointMap: PointMapFast<string>

    beforeEach(() => {
        pointMap = new PointMapFast()
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
