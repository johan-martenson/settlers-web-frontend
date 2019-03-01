import { Point, TerrainInformation, TileInformation } from './api';

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

function terrainInformationToTerrainList(view: TerrainInformation) {
    let start = 1;
    let count = 0;

    const terrain = new Array(((view.width * view.height) / 2) + 1);

    for (let y = 1; y < view.height; y++) {
        for (let x = start; x + 1 < view.width; x += 2) {
            const point: Point = {
                x: Number(x),
                y: Number(y)
            };
            const tile = {
                point: point,
                straightBelow: vegetationToInt.get(view.straightBelow[count]),
                belowToTheRight: vegetationToInt.get(view.belowToTheRight[count])
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

interface Vector {
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

function getNormalForTriangle(p1: Point3D, p2: Point3D, p3: Point3D) {

    const vector1 = vectorFromPoints(p1, p2);
    const vector2 = vectorFromPoints(p1, p3);

    const normal = crossProduct(vector1, vector2);

    const normalized = normalize(normal);

    return normalized;
}

function getDotProduct(v1: Vector, v2: Vector): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export { getDotProduct, getNormalForTriangle, camelCaseToWords, pointToString, pointSetToStringSet, terrainInformationToTerrainList, vegetationToInt, intToVegetationColor };

