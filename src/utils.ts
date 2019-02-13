import { Point, TerrainInformation, TileInformation } from './api'

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

export {
    camelCaseToWords,
    pointToString,
    pointSetToStringSet,
    terrainInformationToTerrainList,
    vegetationToInt,
    intToVegetationColor
};
