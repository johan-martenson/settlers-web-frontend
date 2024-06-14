import { Point } from "../api/types"
import { Dimension } from "../utils"

function calcTranslation(prevScale: number, newScale: number, prevTranslate: Point, dimension: Dimension) {
    const centerGamePoint = findCenterGamePoint(dimension, prevScale, prevTranslate)

    const newTranslate = {
        x: dimension.width / 2 - centerGamePoint.x * newScale,
        y: dimension.height / 2 - dimension.height + centerGamePoint.y * newScale
    }

    return newTranslate
}

function findCenterGamePoint(dimension: Dimension, scale: number, translate: Point) {
    return {
        x: (dimension.width / 2 - translate.x) / scale,
        y: (dimension.height / 2 + translate.y) / (scale)
    }
}

export {
    calcTranslation,
    findCenterGamePoint
}