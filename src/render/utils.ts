import { Point } from "../api/types"
import { Dimension } from "../utils"

function calcTranslation(prevScale: number, newScale: number, prevTranslate: Point, dimension: Dimension) {
    const centerGamePoint = {
        x: (dimension.width / 2 - prevTranslate.x) / prevScale,
        y: (dimension.height / 2 + prevTranslate.y) / (prevScale)
    }

    const newTranslate = {
        x: dimension.width / 2 - centerGamePoint.x * newScale,
        y: dimension.height / 2 - dimension.height + centerGamePoint.y * newScale
    }

    return newTranslate
}

export { calcTranslation }