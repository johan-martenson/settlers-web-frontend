import { Point } from './api'

// FIXME: make a proper implementation
let camelCaseToWords = function (camelCaseStr: string): string {
    return camelCaseStr;
}

function pointToString(point: Point): string {
    return "" + point.x + "," + point.y;
}

function pointSetToStringSet(pointSet: Set<Point>): Set<string> {
    let stringSet = new Set<string>();

    for (let point in pointSet) {
        console.log(typeof(point));
    }

    return stringSet;
}

export {
    camelCaseToWords,
    pointToString,
    pointSetToStringSet
};

