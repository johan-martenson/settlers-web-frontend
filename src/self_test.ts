import { PointSetFast, PointMapFast } from './util_types';
import { Point } from './api';

function do_self_test() {
    testPointSet()
    testPointMap()
}

function testPointSet() {

    const pointSet = new PointSetFast();

    /* Test that the set is empty initially */
    if (pointSet.size() === 0) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test that a point does not exist in the set before being added */
    const point0 = { x: 2, y: 3 }

    if (!pointSet.has(point0)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

    /* Test addding a point */
    pointSet.add(point0)

    if (pointSet.has(point0)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the set is not empty now */
    if (pointSet.size() === 1) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test adding the point again as another object */
    const point0Synonym = { x: 2, y: 3 }
    pointSet.add(point0Synonym)

    if (pointSet.has(point0)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the size is still 1 */
    if (pointSet.size() === 1) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test adding a second point */
    const point1 = { x: 3, y: 3 }

    if (!pointSet.has(point1)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

    pointSet.add(point1)

    if (pointSet.has(point1)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the first point is still in the set */
    if (pointSet.has(point0)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the size is 2 */
    if (pointSet.size() === 2) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test iteration through the set */
    let seen: Array<Point> = []
    for (const key of pointSet) {
        seen.push(key)
    }

    if (seen.find(p => p.x === point0.x && p.y === point0.y) && seen.find(p => p.x === point1.x && p.y === point1.y)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (seen.length === 2) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test deleting the first point */
    pointSet.delete(point0)

    if (!pointSet.has(point0)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

    /* Verify that the set is not empty */
    if (pointSet.size() === 1) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test deleting the second point with another object */
    const point1Synonym = { x: 3, y: 3 }
    pointSet.delete(point1Synonym)

    if (!pointSet.has(point1)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

    /* Verify that the set is not empty now */
    if (pointSet.size() === 0) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test creating a set from a regular set of points */
    const regularPointSet = new Set<Point>()

    regularPointSet.add(point0)
    regularPointSet.add(point1)

    const pointSetFromRegularSet = new PointSetFast(regularPointSet)

    /* Verify that the new point set contains both points */
    if (pointSetFromRegularSet.has(point0)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

    if (pointSetFromRegularSet.has(point1)) {
        console.log("OK");
    } else {
        console.log("NOT OK")
    }

}


function testPointMap() {

    /* Test creating a map from points to strings */
    const pointMap = new PointMapFast<string>();

    /* Test that the map is empty before any items are added */
    if (pointMap.size === 0) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test adding two points */
    const point0 = { x: 2, y: 3 }
    const point1 = { x: 2, y: 5 }

    /* Verify that the points are not in the map before they are added */
    if (!pointMap.has(point0)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (!pointMap.has(point1)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    pointMap.set(point0, "my string")
    pointMap.set(point1, "another string")

    /* Test that the points have the correct values */
    if (pointMap.get(point0) === "my string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (pointMap.get(point1) === "another string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test that the values can be reached by other objects with the same attributes */
    const point0Synonym = { x: 2, y: 3 }
    const point1Synonym = { x: 2, y: 5 }

    if (pointMap.get(point0Synonym) === "my string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (pointMap.get(point1Synonym) === "another string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the size of the map is 2 */
    if (pointMap.size === 2) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test iteration through the keys */
    let seenKeys: Array<Point> = []
    for (const key of pointMap.keys()) {
        seenKeys.push(key)
    }

    if (seenKeys.find(p => p.x === point0.x && p.y === point0.y) && seenKeys.find(p => p.x === point1.x && p.y === point1.y)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (seenKeys.length === 2) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test iteration through the values */
    let seenValues: Array<string> = []
    for (const value of pointMap.values()) {
        seenValues.push(value)
    }

    if (seenValues.find(v => v === "my string" ) && seenValues.find(v => v === "another string")) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (seenKeys.length === 2) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Test that a value can be updated */
    pointMap.set(point0Synonym, "my third string")

    if (pointMap.get(point0) === "my third string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Delete the first point */
    pointMap.delete(point0)

    /* Verify that the point is removed */
    if (pointMap.get(point0) === undefined) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (!pointMap.has(point0)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the size of the map is 1 */
    if (pointMap.size === 1) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    /* Verify that the second point is still in the map */
    if (pointMap.get(point1) === "another string") {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }

    if (pointMap.has(point1)) {
        console.log("OK")
    } else {
        console.log("NOT OK")
    }
}

export { do_self_test };
