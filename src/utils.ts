import { Point, TerrainInformation, TileInformation } from './api';
import { TerrainAtPoint } from './game_render';

const vegetationToInt = new Map<TileInformation, number>();

vegetationToInt.set("G", 0);
vegetationToInt.set("M", 1);
vegetationToInt.set("SW", 2);
vegetationToInt.set("W", 3);
vegetationToInt.set("DW", 4);
vegetationToInt.set("SN", 5);
vegetationToInt.set("L", 6);
vegetationToInt.set("MM", 7);
vegetationToInt.set("ST", 8);
vegetationToInt.set("DE", 9);

const intToVegetationColor = new Map<number, string>();

intToVegetationColor.set(0, "green");
intToVegetationColor.set(1, "gray");
intToVegetationColor.set(2, "brown");
intToVegetationColor.set(3, "lightblue");
intToVegetationColor.set(4, "blue");
intToVegetationColor.set(5, "white");
intToVegetationColor.set(6, "red");
intToVegetationColor.set(7, "lightgray");
intToVegetationColor.set(8, "darkorange");
intToVegetationColor.set(9, "orange");

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
        console.log(typeof (point));
    }

    return stringSet;
}

function terrainInformationToTerrainAtPointList(terrainInformation: TerrainInformation): Array<TerrainAtPoint> {
    let start = 1;
    let count = 0;

    const terrain = new Array(((terrainInformation.width * terrainInformation.height) / 2) + 1);

    for (let y = 1; y < terrainInformation.height; y++) {
        for (let x = start; x + 1 < terrainInformation.width; x += 2) {

            const point: Point = {
                x: Number(x),
                y: Number(y)
            };

            const tile = {
                point: point,
                straightBelow: vegetationToInt.get(terrainInformation.straightBelow[count]),
                belowToTheRight: vegetationToInt.get(terrainInformation.belowToTheRight[count]),
                height: terrainInformation.heights[count]
            };

            terrain[count] = tile;
            count++;
        }
        if (start === 1) {
            start = 2;
        }
        else {
            start = 1;
        }
    }

    return terrain;
}

export interface Point3D {
    x: number
    y: number
    z: number
}

export interface Vector {
    x: number
    y: number
    z: number
}

function vectorFromPoints(p1: Point3D, p2: Point3D): Vector {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
        z: p1.z - p2.z
    };
}

function crossProduct(vector1: Vector, vector2: Vector): Vector {
    return {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x
    }
}

function lengthOfVector(vector: Vector): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

function normalize(vector: Vector): Vector {
    const length = lengthOfVector(vector);

    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    }
}

function getNormalForTriangle(p1: Point3D | undefined, p2: Point3D | undefined, p3: Point3D | undefined) {

    if (!p1 || !p2 || !p3) {
        return { x: 0, y: 0, z: 1 };
    }

    const vector1 = vectorFromPoints(p1, p2);
    const vector2 = vectorFromPoints(p1, p3);

    const normal = crossProduct(vector1, vector2);

    const normalized = normalize(normal);

    return normalized;
}

function getDotProduct(v1: Vector, v2: Vector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export interface Line {
    k: number
    m: number
}

function getLineBetweenPoints(p1: Point, p2: Point): Line {
    const k = (p1.y - p2.y) / (p1.x - p2.x);
    const m = p1.y - (k * p1.x);

    return {
        k: k,
        m: m
    }
}

function getOrthogonalLine(line: Line, point: Point): Line {
    const k = -1 / line.k;
    const m = point.y - k * point.x;

    return {
        k: k,
        m: m
    }
}

function getIntersection(line1: Line, line2: Line): Point {
    const x = (line2.m - line1.m) / (line1.k - line2.k);
    const y = line1.k * x + line1.m;

    return {
        x: x,
        y: y
    }
}

function getGradientLineForTriangle(p1: Point, intensity1: number, p2: Point, intensity2: number, p3: Point, intensity3: number): Point[] {

    const intensityMax = Math.max(intensity1, intensity2, intensity3);
    const intensityMin = Math.min(intensity1, intensity2, intensity3);
    const intensityFullRange = intensityMax - intensityMin;

    let partialIntensity;

    let pointHigh = p1;
    let pointLow = p1;
    let pointMedium = p1;

    /* Find the highest point */
    if (intensity1 === intensityMax) {
        pointHigh = p1;
    } else if (intensity2 === intensityMax) {
        pointHigh = p2;
    } else {
        pointHigh = p3;
    }

    /* Find the lowest point */
    if (intensity1 === intensityMin) {
        pointLow = p1;
    } else if (intensity2 === intensityMin) {
        pointLow = p2;
    } else {
        pointLow = p3;
    }

    /* Find the mid point */
    if (p1 !== pointHigh && p1 !== pointLow) {
        pointMedium = p1;
        partialIntensity = intensity1;
    } else if (p2 !== pointHigh && p2 !== pointLow) {
        pointMedium = p2;
        partialIntensity = intensity2
    } else {
        pointMedium = p3;
        partialIntensity = intensity3
    }

    const intensityPartialRange = intensityMax - partialIntensity;
    const midIntensityProportion = intensityPartialRange / intensityFullRange;

    /* Handle the special case where partial and full intensity are the same -- p4 and pointHigh are on the same line */
    if (intensityMax === partialIntensity) {

        /* Handle the special case where pointHigh and pointMedium are on the same vertical line */
        if (pointHigh.x === pointMedium.x) {
            const result = [
                {
                    x: pointHigh.x,
                    y: pointLow.y
                },
                pointLow
            ];

            if (Number.isNaN(result[0].x) || result[0].x === Infinity || Number.isNaN(result[0].y) || result[0].y === Infinity ||
                Number.isNaN(result[1].x) || result[1].x === Infinity || Number.isNaN(result[1].y) || result[1].y === Infinity) {
                console.log("NAN or INF at 0");
            }

            if (result[0].x === result[1].x && result[0].y === result[1].y) {
                console.log(" -- SAME AT EXIT 0");

                
                console.log(pointHigh);
                console.log(intensity1);

                console.log(pointMedium);
                console.log(intensity2);

                console.log(pointLow);
                console.log(intensity3);
            }

            return result;
        } else {

            /* Get L1 */
            const line1 = getLineBetweenPoints(pointHigh, pointMedium);

            /* Handle the special case where L1 is parallel with the X axis. */
            if (line1.k === 0) {

                /* Get the point at L1 where x = pointLow.x */
                const p5 = getPointAtLineGivenX(line1, pointLow.x);

                const result = [p5, pointLow];

                if (Number.isNaN(result[0].x) || result[0].x === Infinity || Number.isNaN(result[0].y) || result[0].y === Infinity ||
                    Number.isNaN(result[1].x) || result[1].x === Infinity || Number.isNaN(result[1].y) || result[1].y === Infinity) {
                    console.log("NAN or INF at 1");
                }

                if (result[0].x === result[1].x && result[0].y === result[1].y) {
                    console.log(" -- SAME AT EXIT 1");
    
                    
                    console.log(pointHigh);
                    console.log(intensity1);
    
                    console.log(pointMedium);
                    console.log(intensity2);
    
                    console.log(pointLow);
                    console.log(intensity3);
                }
    
                return result;
            } else {

                /* Get L2 */
                const line2 = getOrthogonalLine(line1, pointLow);

                /* Find intersection */
                const p5 = getIntersection(line1, line2);

                const result = [p5, pointLow];

                if (Number.isNaN(result[0].x) || result[0].x === Infinity || Number.isNaN(result[0].y) || result[0].y === Infinity ||
                    Number.isNaN(result[1].x) || result[1].x === Infinity || Number.isNaN(result[1].y) || result[1].y === Infinity) {
                    console.log("NAN or INF at 2");
                }

                if (result[0].x === result[1].x && result[0].y === result[1].y) {
                    console.log(" -- SAME AT EXIT 2");
    
                    console.log(pointHigh);
                    console.log(intensityMax);
    
                    console.log(pointMedium);
                    console.log(partialIntensity);
    
                    console.log(pointLow);
                    console.log(intensityMin);

                    console.log("Line 1");
                    console.log(line1);

                    console.log("Line 2");
                    console.log(line2);
                }
    

                return result;
            }
        }
    } else {

        /*  Get p4 */
        const dx = pointMedium.x - pointHigh.x;
        const dy = pointMedium.y - pointHigh.y;

        const p4 = {
            x: (intensityFullRange * dx) / intensityPartialRange + pointHigh.x,
            y: (intensityFullRange * dy) / intensityPartialRange + pointHigh.y
        }

        /* Get L1 */
        const line1 = getLineBetweenPoints(p4, pointLow);

        /* Handle the case where the line is parallel with the X axis */
        if (line1.k === 0) {
            const result = [
                pointHigh,
                {
                    x: pointHigh.x,
                    y: pointMedium.y
                }
            ];

            if (result[0].x === result[1].x && result[0].y === result[1].y) {
                console.log(" -- SAME AT EXIT 3");

                
                console.log(pointHigh);
                console.log(intensity1);

                console.log(pointMedium);
                console.log(intensity2);

                console.log(pointLow);
                console.log(intensity3);
            }

            return result;
        } else {

            /* Get L2 */
            const line2 = getOrthogonalLine(line1, p4);

            /* Get point where L1 & L2 intersect */
            const p5 = getIntersection(line1, line2);

            const result = [pointHigh, p5];

            if (Number.isNaN(result[0].x) || result[0].x === Infinity || Number.isNaN(result[0].y) || result[0].y === Infinity ||
                Number.isNaN(result[1].x) || result[1].x === Infinity || Number.isNaN(result[1].y) || result[1].y === Infinity) {
                console.log("NAN or INF at 4");

                console.log(pointHigh);
                console.log(intensity1);

                console.log(pointMedium);
                console.log(intensity2);

                console.log(pointLow);
                console.log(intensity3);

                console.log("P4 (should be same as medium)");
                console.log(p4);
            }

            if (result[0].x === result[1].x && result[0].y === result[1].y) {
                console.log(" -- SAME AT EXIT 4");

                
                console.log(pointHigh);
                console.log(intensity1);

                console.log(pointMedium);
                console.log(intensity2);

                console.log(pointLow);
                console.log(intensity3);
            }

            return result;
        }
    }
}

function sumVectors(v1: Vector | undefined, v2: Vector | undefined): Vector {

    let vector1: Vector
    let vector2: Vector

    if (v1) {
        vector1 = v1;
    } else {
        vector1 = {
            x: 0,
            y: 0,
            z: 0
        }
    }

    if (v2) {
        vector2 = v2
    } else {
        vector2 = {
            x: 0,
            y: 0,
            z: 0
        }
    }

    return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y,
        z: vector1.z + vector2.z
    }
}

function getAverageVectorNormalized(...vectors: Vector[]): Vector {
    const combinedVector = vectors.reduce(sumVectors);

    const normalized = normalize(combinedVector);

    return normalized;
}

function getPointDownLeft(point: Point) {
    return {
        x: point.x - 1,
        y: point.y - 1
    }
}

function getPointDownRight(point: Point) {
    return {
        x: point.x + 1,
        y: point.y - 1
    }
}

function getPointUpLeft(point: Point) {
    return {
        x: point.x - 1,
        y: point.y + 1
    }
}

function getPointUpRight(point: Point) {
    return {
        x: point.x + 1,
        y: point.y + 1
    }
}

function getPointRight(point: Point) {
    return {
        x: point.x + 2,
        y: point.y
    }
}

function getPointLeft(point: Point) {
    return {
        x: point.x - 2,
        y: point.y
    }
}

function getBrightnessForNormals(normals: (Vector | undefined)[], lightVector: Vector): number {

    let vectors: Vector[] = [];

    for (let normal of normals) {
        if (normal) {
            vectors.push(normal)
        }
    }

    const combinedVector = vectors.reduce(sumVectors);

    const normalized = normalize(combinedVector);

    return getDotProduct(normalized, lightVector);
}

function arrayToRgbStyle(rgb: number[]): string {
    return 'rgb(' + Math.floor(rgb[0]) + ', ' + Math.floor(rgb[1]) + ', ' + Math.floor(rgb[2]) + ')';
}

function getPointAtLineGivenX(line: Line, x: number): Point {
    return {
        x: x,
        y: x * line.k + line.m
    }
}

export { terrainInformationToTerrainAtPointList, arrayToRgbStyle, getGradientLineForTriangle, getBrightnessForNormals, getPointLeft, getPointRight, getPointDownLeft, getPointDownRight, getPointUpLeft, getPointUpRight, getLineBetweenPoints, getDotProduct, getNormalForTriangle, camelCaseToWords, pointToString, pointSetToStringSet, vegetationToInt, intToVegetationColor };
