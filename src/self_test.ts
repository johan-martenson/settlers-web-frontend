import { PointSetFast, PointMapFast } from './util_types'
import { Point } from './api/types'

function do_self_test(): void {
    testPointSet()
    testPointMap()
}

function testPointSet(): void {

    const pointSet = new PointSetFast()

    /* Test that the set is empty initially */
    if (pointSet.size() === 0) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test that a point does not exist in the set before being added */
    const point0 = { x: 2, y: 3 }

    if (!pointSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test adding a point */
    pointSet.add(point0)

    if (pointSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the set is not empty now */
    if (pointSet.size() === 1) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test adding the point again as another object */
    const point0Synonym = { x: 2, y: 3 }
    pointSet.add(point0Synonym)

    if (pointSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the size is still 1 */
    if (pointSet.size() === 1) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test adding a second point */
    const point1 = { x: 3, y: 3 }

    if (!pointSet.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    pointSet.add(point1)

    if (pointSet.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the first point is still in the set */
    if (pointSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the size is 2 */
    if (pointSet.size() === 2) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test iteration through the set */
    let seen: Array<Point> = []
    for (const key of pointSet) {
        seen.push(key)
    }

    if (seen.find(p => p.x === point0.x && p.y === point0.y) && seen.find(p => p.x === point1.x && p.y === point1.y)) {
        //console.info("OK")
    } else {
        console.log("error OK")
    }

    if (seen.length === 2) {
        //console.info("OK")
    } else {
        console.log("error OK")
    }

    /* Test iteration with forEach */
    seen = []
    pointSet.forEach((v) => {
        seen.push(v)
    })

    if (seen.find(p => p.x === point0.x && p.y === point0.y) && seen.find(p => p.x === point1.x && p.y === point1.y)) {
        //console.info("OK")
    } else {
        console.log("error OK")
    }

    if (seen.length === 2) {
        //console.info("OK")
    } else {
        console.log("error OK")
    }

    /* Test deleting the first point */
    pointSet.delete(point0)

    if (!pointSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the set is not empty */
    if (pointSet.size() === 1) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test deleting the second point with another object */
    const point1Synonym = { x: 3, y: 3 }
    pointSet.delete(point1Synonym)

    if (!pointSet.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the set is not empty now */
    if (pointSet.size() === 0) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test creating a set from a regular set of points */
    const regularPointSet = new Set<Point>()

    regularPointSet.add(point0)
    regularPointSet.add(point1)

    const pointSetFromRegularSet = new PointSetFast(regularPointSet)

    /* Verify that the new point set contains both points */
    if (pointSetFromRegularSet.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (pointSetFromRegularSet.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the set can be cleared */
    pointSetFromRegularSet.clear()

    if (pointSetFromRegularSet.size() === 0 &&
        !pointSetFromRegularSet.has(point0) &&
        !pointSetFromRegularSet.has(point1)) {
            //console.info("OK")
    } else {
        console.error("NOT OK")
    }
}


function testPointMap(): void {

    /* Test creating a map from points to strings */
    const pointMap = new PointMapFast<string>()

    /* Test that the map is empty before any items are added */
    if (pointMap.size === 0) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test adding two points */
    const point0 = { x: 2, y: 3 }
    const point1 = { x: 2, y: 5 }

    /* Verify that the points are not in the map before they are added */
    if (!pointMap.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (!pointMap.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    pointMap.set(point0, "my string")
    pointMap.set(point1, "another string")

    /* Test that the points have the correct values */
    if (pointMap.get(point0) === "my string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (pointMap.get(point1) === "another string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test that the values can be reached by other objects with the same attributes */
    const point0Synonym = { x: 2, y: 3 }
    const point1Synonym = { x: 2, y: 5 }

    if (pointMap.get(point0Synonym) === "my string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (pointMap.get(point1Synonym) === "another string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the size of the map is 2 */
    if (pointMap.size === 2) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test iteration through the keys */
    const seenKeys: Array<Point> = []
    for (const key of pointMap.keys()) {
        seenKeys.push(key)
    }

    if (seenKeys.find(p => p.x === point0.x && p.y === point0.y) && seenKeys.find(p => p.x === point1.x && p.y === point1.y)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (seenKeys.length === 2) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test iteration through the values */
    const seenValues: Array<string> = []
    for (const value of pointMap.values()) {
        seenValues.push(value)
    }

    if (seenValues.find(v => v === "my string" ) && seenValues.find(v => v === "another string")) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (seenKeys.length === 2) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test entries */
    let foundPoint0 = 0
    let foundPoint1 = 0
    let other = 0

    for (const entry of pointMap.entries()) {
        if (entry[0].x === point0.x && entry[0].y === point0.y && entry[1] === "my string") {
            foundPoint0 = foundPoint0 + 1
        } else if (entry[0].x === point1.x && entry[0].y === point1.y && entry[1] === "another string") {
            foundPoint1 = foundPoint1 + 1
        } else {
            other = other + 1
        }
    }

    if (foundPoint0 === 1 && foundPoint1 === 1 && other === 0) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test keys */
    foundPoint0 = 0
    foundPoint1 = 0
    other = 0

    for (const entry of pointMap.keys()) {
        if (entry.x === point0.x && entry.y === point0.y) {
            foundPoint0 = foundPoint0 + 1
        } else if (entry.x === point1.x && entry.y === point1.y) {
            foundPoint1 = foundPoint1 + 1
        } else {
            other = other + 1
        }
    }

    if (foundPoint0 === 1 && foundPoint1 === 1 && other === 0) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Test that a value can be updated */
    pointMap.set(point0Synonym, "my third string")

    if (pointMap.get(point0) === "my third string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Delete the first point */
    pointMap.delete(point0)

    /* Verify that the point is removed */
    if (pointMap.get(point0) === undefined) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (!pointMap.has(point0)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the size of the map is 1 */
    if (pointMap.size === 1) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    /* Verify that the second point is still in the map */
    if (pointMap.get(point1) === "another string") {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    if (pointMap.has(point1)) {
        //console.info("OK")
    } else {
        console.error("NOT OK")
    }

    // Test clearing the map
    pointMap.clear()

    if (pointMap.size !== 0 || pointMap.has(point1) || pointMap.get(point1) !== undefined) {
        console.error("NOT OK")
    }
}

export { do_self_test }
