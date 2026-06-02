import { FlagInformation, Point, RoadInformation, TerrainAtPoint, VEGETATION_INTEGERS } from '../api/types'
import { api, TileBelow, TileDownRight } from '../api/ws-api'
import { PointMap, PointSet } from '../utils/util_types_ng'
import { getPointDown, getPointDownLeft, getPointDownRight, getPointLeft, getPointRight, getPointUpRight, sumAndNormalizeVectors, surroundingPoints, Vector } from '../utils/utils'
import { MAIN_ROAD_TEXTURE_MAPPING, MAIN_ROAD_WITH_FLAG, NORMAL_ROAD_TEXTURE_MAPPING, NORMAL_ROAD_WITH_FLAG, NORMAL_STRAIGHT_UP_VECTOR, OVERLAP_FACTOR, OVERLAPS, TRANSITION_TEXTURE_MAPPINGS, UNIT_SQUARE, VEGETATION_TO_TEXTURE_MAPPING } from './constants'
import { RenderLogConfig } from './game-render'
import { MapRenderInformation, RenderInformation, ShadedPoint, TrianglesAtPoint } from './types'
import { DrawGroundAttributes, DrawImageAttributes, FogOfWarAttributes } from './webgl-program-definitions'
import { ProgramInstance, setBuffer } from './webgl-utils'


function isOnEdgeOfDiscovery(point: Point, discovered: PointSet): boolean {
    const surrounding = surroundingPoints(point)

    // TODO: filter points outside of the map
    const foundInside = surrounding.filter(neighbor => neighbor.x > 0 && discovered.has(neighbor)).length > 0
    const foundOutside = surrounding.filter(neighbor => neighbor.x > 0 && !discovered.has(neighbor)).length > 0

    return foundInside && foundOutside
}

function getTrianglesAffectedByFogOfWar(discovered: PointSet, tilesBelow: Set<TileBelow>, tilesDownRight: Set<TileDownRight>): ShadedPoint[][] {
    const triangles: ShadedPoint[][] = []

    tilesBelow.forEach(tileBelow => {
        const up = tileBelow.pointAbove
        const right = getPointDownRight(tileBelow.pointAbove)
        const left = getPointDownLeft(tileBelow.pointAbove)

        const isUpOnEdge = isOnEdgeOfDiscovery(up, discovered)
        const isRightOnEdge = isOnEdgeOfDiscovery(right, discovered)
        const isLeftOnEdge = isOnEdgeOfDiscovery(left, discovered)

        if (isUpOnEdge || isRightOnEdge || isLeftOnEdge) {
            triangles.push([
                { point: up, intensity: isUpOnEdge ? 0 : 1 },
                { point: right, intensity: isRightOnEdge ? 0 : 1 },
                { point: left, intensity: isLeftOnEdge ? 0 : 1 }
            ])
        }
    })

    tilesDownRight.forEach(tileDownRight => {
        const left = tileDownRight.pointLeft
        const right = getPointRight(tileDownRight.pointLeft)
        const down = getPointDownRight(tileDownRight.pointLeft)

        const isLeftOnEdge = isOnEdgeOfDiscovery(left, discovered)
        const isRightOnEdge = isOnEdgeOfDiscovery(right, discovered)
        const isDownOnEdge = isOnEdgeOfDiscovery(down, discovered)

        if (isLeftOnEdge || isRightOnEdge || isDownOnEdge) {
            triangles.push([
                { point: left, intensity: isLeftOnEdge ? 0 : 1 },
                { point: right, intensity: isRightOnEdge ? 0 : 1 },
                { point: down, intensity: isDownOnEdge ? 0 : 1 }
            ])
        }
    })

    return triangles
}

function setMapRenderingBuffers(drawGroundProgramInstance: ProgramInstance, tiles: PointMap<TerrainAtPoint>, allNormals: PointMap<Vector>): void {
    const {coordinates, normals, textureMapping} = calculateMapRenderingInformation(tiles, allNormals)

    setBuffer<DrawGroundAttributes>(drawGroundProgramInstance, 'a_coords', coordinates)
    setBuffer<DrawGroundAttributes>(drawGroundProgramInstance, 'a_normal', normals)
    setBuffer<DrawGroundAttributes>(drawGroundProgramInstance, 'a_texture_mapping', textureMapping)    
}

function setFogOfWarRenderingBuffers(
    allPointsVisibilityTracking: PointMap<TrianglesAtPoint>,
    fogOfWarProgramInstance: ProgramInstance,
    discoveredPoints: PointSet,
    discoveredBelowTiles: Set<TileBelow>,
    discoveredDownRightTiles: Set<TileDownRight>
): void {
    const { coordinates, intensities } = calculateFogOfWarRenderingInformation(allPointsVisibilityTracking, discoveredPoints, discoveredBelowTiles, discoveredDownRightTiles)

    setBuffer<FogOfWarAttributes>(fogOfWarProgramInstance, 'a_coordinates', coordinates)
    setBuffer<FogOfWarAttributes>(fogOfWarProgramInstance, 'a_intensity', intensities)
}

function setRoadRenderingBuffers(roadProgramInstance: ProgramInstance, roads: RoadInformation[], flags: FlagInformation[], normals: PointMap<Vector>): void {
    const roadRenderInformation = calculateRoadRenderingInformation(roads, flags, normals)

    setBuffer<DrawGroundAttributes>(roadProgramInstance, 'a_coords', roadRenderInformation?.coordinates)
    setBuffer<DrawGroundAttributes>(roadProgramInstance, 'a_normal', roadRenderInformation.normals)
    setBuffer<DrawGroundAttributes>(roadProgramInstance, 'a_texture_mapping', roadRenderInformation.textureMapping)
}

function calculateFogOfWarRenderingInformation(
    allPointsVisibilityTracking: PointMap<TrianglesAtPoint>,
    discoveredPoints: PointSet,
    discoveredBelowTiles: Set<TileBelow>,
    discoveredDownRightTiles: Set<TileDownRight>
): { coordinates: number[], intensities: number[] } {

    // TODO: get discoveredPoints, discoveredBelowTiles, and discoveredDownRightTiles as parameters instead
    const triangles = getTrianglesAffectedByFogOfWar(discoveredPoints, discoveredBelowTiles, discoveredDownRightTiles)

    const fogOfWarCoordinates: number[] = []
    const fogOfWarIntensities: number[] = []

    triangles.forEach(triangle => {
        Array.prototype.push.apply(fogOfWarCoordinates,
            [
                triangle[0].point.x, triangle[0].point.y,
                triangle[1].point.x, triangle[1].point.y,
                triangle[2].point.x, triangle[2].point.y
            ]
        )

        Array.prototype.push.apply(fogOfWarIntensities,
            [
                triangle[0].intensity,
                triangle[1].intensity,
                triangle[2].intensity
            ]
        )
    })

    // Add triangles to draw black
    discoveredBelowTiles.forEach(discoveredBelow => {
        const below = allPointsVisibilityTracking.get(discoveredBelow.pointAbove)

        if (below) {
            below.belowVisible = true
        }
    })

    discoveredDownRightTiles.forEach(discoveredDownRight => {
        const downRight = allPointsVisibilityTracking.get(discoveredDownRight.pointLeft)

        if (downRight) {
            downRight.downRightVisible = true
        }
    })

    allPointsVisibilityTracking.forEach((trianglesAtPoint, point) => {
        const downLeft = getPointDownLeft(point)
        const downRight = getPointDownRight(point)
        const right = getPointRight(point)

        if (!trianglesAtPoint.belowVisible) {
            Array.prototype.push.apply(fogOfWarCoordinates,
                [
                    point.x, point.y,
                    downLeft.x, downLeft.y,
                    downRight.x, downRight.y
                ]
            )

            Array.prototype.push.apply(fogOfWarIntensities, [0, 0, 0])
        }

        if (!trianglesAtPoint.downRightVisible) {
            Array.prototype.push.apply(fogOfWarCoordinates,
                [
                    point.x, point.y,
                    right.x, right.y,
                    downRight.x, downRight.y
                ]
            )

            Array.prototype.push.apply(fogOfWarIntensities, [0, 0, 0])
        }
    })

    return { coordinates: fogOfWarCoordinates, intensities: fogOfWarIntensities }
}


function calculateRoadRenderingInformation(roads: Iterable<RoadInformation>, flags: Iterable<FlagInformation>, allNormals: PointMap<Vector>): RenderInformation {
    if (RenderLogConfig.roads) {
        console.log('Render (roads): Prepare to render roads')
    }

    const coordinates: number[] = []
    const normals: number[] = []
    const textureMapping: number[] = []

    const mainRoadFlagPoints = new PointSet()
    const normalRoadFlagPoints = new PointSet()

    // Iterate through each segment of the road
    for (const road of roads) {
        let previous: Point | undefined = undefined

        if (road.type === 'MAIN') {
            mainRoadFlagPoints.add(road.points[0])
            mainRoadFlagPoints.add(road.points[road.points.length - 1])
        } else {
            normalRoadFlagPoints.add(road.points[0])
            normalRoadFlagPoints.add(road.points[road.points.length - 1])
        }

        for (const point of road.points) {
            if (previous === undefined) {
                previous = point

                continue
            }

            let left
            let right

            if (previous.x < point.x) {
                left = previous
                right = point
            } else {
                left = point
                right = previous
            }

            const normalLeft = allNormals?.get(left)
            const normalRight = allNormals?.get(right)

            if (normalLeft === undefined || normalRight === undefined) {
                console.error('Render (normals): Missing normals')

                if (RenderLogConfig.normals) {
                    console.log(normalLeft, normalRight)
                }

                continue
            }

            // Handle horizontal roads
            if (left.y === right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x, left.y - 0.15, heightLeft,
                        left.x, left.y + 0.15, heightLeft,
                        right.x, right.y - 0.15, heightRight,
                        left.x, left.y + 0.15, heightLeft,
                        right.x, right.y - 0.15, heightRight,
                        right.x, right.y + 0.15, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)

                // Handle road up-right
            } else if (left.y < right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x + 0.1, left.y - 0.1, heightLeft,
                        left.x - 0.1, left.y + 0.1, heightLeft,
                        right.x + 0.1, right.y - 0.1, heightRight,
                        left.x - 0.1, left.y + 0.1, heightLeft,
                        right.x + 0.1, right.y - 0.1, heightRight,
                        right.x - 0.1, right.y + 0.1, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)

                // Handle road down-right
            } else if (left.y > right.y) {
                const heightLeft = api.getHeight(left)
                const heightRight = api.getHeight(right)

                Array.prototype.push.apply(
                    coordinates,
                    [
                        left.x - 0.1, left.y - 0.1, heightLeft,
                        left.x + 0.1, left.y + 0.1, heightLeft,
                        right.x - 0.1, right.y - 0.1, heightRight,
                        left.x + 0.1, left.y + 0.1, heightLeft,
                        right.x - 0.1, right.y - 0.1, heightRight,
                        right.x + 0.1, right.y + 0.1, heightRight
                    ])

                Array.prototype.push.apply(normals,
                    [
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalLeft.x, normalLeft.y, normalLeft.z,
                        normalRight.x, normalRight.y, normalRight.z,
                        normalRight.x, normalRight.y, normalRight.z
                    ])

                Array.prototype.push.apply(textureMapping, road.type === 'NORMAL' ? NORMAL_ROAD_TEXTURE_MAPPING : MAIN_ROAD_TEXTURE_MAPPING)
            }

            previous = point
        }
    }

    // Add a circle of 'road' for each flag
    for (const flag of flags) {
        const isNormal = normalRoadFlagPoints.has(flag)
        const isMain = mainRoadFlagPoints.has(flag)

        if (!isNormal && !isMain) {
            continue
        }

        const height = api.allTiles.get(flag)?.height ?? 0
        const normal = allNormals.get(flag) ?? { x: 0, y: 0, z: 1 }

        // TODO: read out height and normals surrounding and then interpolate

        Array.prototype.push.apply(
            coordinates,
            [
                flag.x - 0.15, flag.y - 0.15, height,
                flag.x - 0.15, flag.y + 0.15, height,
                flag.x + 0.15, flag.y - 0.15, height,
                flag.x - 0.15, flag.y + 0.15, height,
                flag.x + 0.15, flag.y - 0.15, height,
                flag.x + 0.15, flag.y + 0.15, height
            ]
        )

        Array.prototype.push.apply(normals,
            [
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z,
                normal.x, normal.y, normal.z
            ])

        Array.prototype.push.apply(textureMapping, isMain ? MAIN_ROAD_WITH_FLAG : NORMAL_ROAD_WITH_FLAG)
    }

    return {
        coordinates,
        normals,
        textureMapping
    }
}


function addTerrainRenderInformationForTileDownRight(
    point: Point,
    height: number,
    tileDownRight: TileDownRight,
    allTiles: PointMap<TerrainAtPoint>,
    allNormals: PointMap<Vector>,
    coordinates: number[],
    normals: number[],
    textureMappings: number[],
    transitionCoordinates: number[],
    transitionNormals: number[],
    transitionTextureMappings: number[]
): void {
    const pointUpRight = getPointUpRight(point)
    const pointRight = getPointRight(point)
    const pointDownRight = getPointDownRight(point)
    const pointDownLeft = getPointDownLeft(point)
    const pointRightDownRight = getPointDownRight(getPointRight(point))

    const terrainDownRight = tileDownRight.vegetation
    const terrainBelow = allTiles.get(point)
    const terrainUpRight = allTiles.get(pointUpRight)
    const terrainRight = allTiles.get(pointRight)

    if (VEGETATION_INTEGERS.indexOf(terrainDownRight) === -1) {
        console.log(`Render (terrain): UNKNOWN TERRAIN: ${terrainDownRight}`)
    }


    // Add the terrain tile to the buffers
    Array.prototype.push.apply(coordinates, [
        point.x, point.y, height,
        pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
        pointRight.x, pointRight.y, tileDownRight.heightRight
    ])

    const normalLeft = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR

    Array.prototype.push.apply(normals, [
        normalLeft.x, normalLeft.y, normalLeft.z,
        normalDownRight.x, normalDownRight.y, normalDownRight.z,
        normalRight.x, normalRight.y, normalRight.z
    ])

    Array.prototype.push.apply(textureMappings, VEGETATION_TO_TEXTURE_MAPPING.get(terrainDownRight)?.downRight ?? [0, 1, 0.5, 0, 1, 1])

    const overlap = OVERLAPS.get(terrainDownRight)
    const transitionTextureMapping = TRANSITION_TEXTURE_MAPPINGS.get(terrainDownRight)


    // Add the transition triangles on all three sides

    // Triangle below on the left
    if (overlap && terrainBelow && overlap.has(terrainBelow.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightLeft + tileDownRight.heightDown) / 2
        const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }

        Array.prototype.push.apply(transitionCoordinates, [
            pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
            point.x, point.y, tileDownRight.heightLeft,
            base.x + (pointDownLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointDownLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (allTiles.get(pointDownLeft)?.height ?? 0 - baseHeight) * OVERLAP_FACTOR
        ])

        const normalPoint = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalPoint, normalDownRight, normalDownLeft])

        Array.prototype.push.apply(transitionNormals, [
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            normalPoint.x, normalPoint.y, normalPoint.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Triangle above
    if (overlap && terrainUpRight && overlap.has(terrainUpRight.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightLeft + tileDownRight.heightRight) / 2
        const heightUp = allTiles.get(pointUpRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, tileDownRight.heightLeft,
            pointRight.x, pointRight.y, tileDownRight.heightRight,
            point.x + 1, point.y + OVERLAP_FACTOR, baseHeight + (heightUp - baseHeight) * OVERLAP_FACTOR
        ])

        const normalPoint = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalUpRight = allNormals.get(pointUpRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalPoint, normalRight, normalUpRight])

        Array.prototype.push.apply(transitionNormals, [
            normalPoint.x, normalPoint.y, normalPoint.z,
            normalRight.x, normalRight.y, normalRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Triangle below on the right
    if (overlap && terrainRight && overlap.has(terrainRight.below) && transitionTextureMapping) {
        const baseHeight = (tileDownRight.heightRight + tileDownRight.heightDown) / 2
        const base = { x: (pointRight.x + pointDownRight.x) / 2, y: (pointRight.y + pointDownRight.y) / 2 }
        const heightRightDownRight = allTiles.get(pointRightDownRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            pointRight.x, pointRight.y, tileDownRight.heightRight,
            pointDownRight.x, pointDownRight.y, tileDownRight.heightDown,
            base.x + (pointRightDownRight.x - base.x) * OVERLAP_FACTOR, base.y + (pointRightDownRight.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightRightDownRight - baseHeight) * OVERLAP_FACTOR
        ])

        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRightDownRight = allNormals.get(pointRightDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalRight, normalDownRight, normalRightDownRight])

        Array.prototype.push.apply(transitionNormals, [
            normalRight.x, normalRight.y, normalRight.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }
}

function addTerrainRenderInformationForTileBelow(
    point: Point,
    height: number,
    tileBelow: TileBelow,
    allTiles: PointMap<TerrainAtPoint>,
    allNormals: PointMap<Vector>,
    coordinates: number[],
    normals: number[],
    textureMappings: number[],
    transitionCoordinates: number[],
    transitionNormals: number[],
    transitionTextureMappings: number[]
): void {
    const pointRight = getPointRight(point)
    const pointLeft = getPointLeft(point)
    const pointDownLeft = getPointDownLeft(point)
    const pointDownRight = getPointDownRight(point)
    const pointDown = getPointDown(point)

    const terrainBelow = tileBelow.vegetation

    if (VEGETATION_INTEGERS.indexOf(terrainBelow) === -1) {
        console.error(`Render (terrain): UNKNOWN TERRAIN: ${terrainBelow}`)
    }

    // Add each terrain tile to the buffers (coordinates, normals, texture mapping)
    Array.prototype.push.apply(coordinates, [
        point.x, point.y, height,
        pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
        pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight
    ])

    const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
    const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR

    Array.prototype.push.apply(normals, [
        normal0.x, normal0.y, normal0.z,
        normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
        normalDownRight.x, normalDownRight.y, normalDownRight.z
    ])

    Array.prototype.push.apply(textureMappings,
        VEGETATION_TO_TEXTURE_MAPPING.get(terrainBelow)?.below ?? [0, 0, 0.5, 1, 1, 0] // TODO: is this default the wrong order?
    )

    // Add transition triangles
    const terrainAtDownLeft = allTiles.get(pointDownLeft)
    const terrainAtDown = allTiles.get(pointDown)
    const terrain = allTiles.get(point)
    const terrainLeft = allTiles.get(pointLeft)

    const overlap = OVERLAPS.get(terrainBelow)
    const transitionTextureMapping = TRANSITION_TEXTURE_MAPPINGS.get(terrainBelow)

    // Transition below
    if (overlap && terrainAtDownLeft && overlap.has(terrainAtDownLeft.downRight) && transitionTextureMapping && terrainAtDown) {
        const baseHeight = (tileBelow.heightDownLeft + tileBelow.heightDownRight) / 2
        const downHeight = terrainAtDown.height

        Array.prototype.push.apply(transitionCoordinates, [
            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
            pointDown.x, pointDownLeft.y - OVERLAP_FACTOR, baseHeight + (downHeight - baseHeight) * OVERLAP_FACTOR
        ])

        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDown = allNormals.get(pointDown) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normalDownLeft, normalDownRight, normalDown])

        Array.prototype.push.apply(transitionNormals, [
            normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Transition up-right
    if (overlap && terrain && overlap.has(terrain.downRight) && transitionTextureMapping) {
        const baseHeight = (height + tileBelow.heightDownRight) / 2
        const base = { x: (point.x + pointDownRight.x) / 2, y: (point.y + pointDownRight.y) / 2 }
        const heightRight = allTiles.get(pointRight)?.height ?? 0

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, height,
            pointDownRight.x, pointDownRight.y, tileBelow.heightDownRight,
            base.x + (pointRight.x - base.x) * OVERLAP_FACTOR, base.y + (pointRight.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightRight - baseHeight) * OVERLAP_FACTOR
        ])

        const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownRight = allNormals.get(pointDownRight) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalRight = allNormals.get(pointRight) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normal0, normalDownRight, normalRight])

        Array.prototype.push.apply(transitionNormals, [
            normal0.x, normal0.y, normal0.z,
            normalDownRight.x, normalDownRight.y, normalDownRight.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }

    // Transition up-left
    if (overlap && terrainLeft && overlap.has(terrainLeft?.downRight) && transitionTextureMapping) {
        const baseHeight = (tileBelow.heightDownLeft + height) / 2
        const base = { x: (point.x + pointDownLeft.x) / 2, y: (point.y + pointDownLeft.y) / 2 }
        const heightLeft = terrainLeft.height

        Array.prototype.push.apply(transitionCoordinates, [
            point.x, point.y, height,
            pointDownLeft.x, pointDownLeft.y, tileBelow.heightDownLeft,
            base.x + (pointLeft.x - base.x) * OVERLAP_FACTOR, base.y + (pointLeft.y - base.y) * OVERLAP_FACTOR, baseHeight + (heightLeft - baseHeight) * OVERLAP_FACTOR
        ])

        const normal0 = allNormals.get(point) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalDownLeft = allNormals.get(pointDownLeft) ?? NORMAL_STRAIGHT_UP_VECTOR
        const normalLeft = allNormals.get(pointLeft) ?? NORMAL_STRAIGHT_UP_VECTOR

        // Interpolate the normal for the transition triangle as the average of the normals of the three points
        const interpolatedNormal = sumAndNormalizeVectors([normal0, normalDownLeft, normalLeft])

        Array.prototype.push.apply(transitionNormals, [
            normal0.x, normal0.y, normal0.z,
            normalDownLeft.x, normalDownLeft.y, normalDownLeft.z,
            interpolatedNormal.x, interpolatedNormal.y, interpolatedNormal.z,
        ])

        Array.prototype.push.apply(transitionTextureMappings, transitionTextureMapping)
    }
}

function calculateMapRenderingInformation(allTiles: PointMap<TerrainAtPoint>, allNormals: PointMap<Vector>): MapRenderInformation {
    const coordinates: number[] = []
    const normals: number[] = []
    const textureMappings: number[] = []

    const transitionCoordinates: number[] = []
    const transitionNormals: number[] = []
    const transitionTextureMappings: number[] = []

    // For all tiles, add the corresponding terrain tile to the buffers (coordinates, normals, texture mapping)
    allTiles.forEach(({ height, below, downRight }, point) => {
        const pointRight = getPointRight(point)
        const pointDownLeft = getPointDownLeft(point)
        const pointDownRight = getPointDownRight(point)

        addTerrainRenderInformationForTileBelow(
            point,
            height,
            {
                pointAbove: point,
                heightAbove: height,
                heightDownLeft: allTiles.get(pointDownLeft)?.height ?? 0,
                heightDownRight: allTiles.get(pointDownRight)?.height ?? 0,
                vegetation: below
            },
            allTiles,
            allNormals,
            coordinates,
            normals,
            textureMappings,
            transitionCoordinates,
            transitionNormals,
            transitionTextureMappings
        )

        addTerrainRenderInformationForTileDownRight(
            point,
            height,
            {
                pointLeft: point,
                heightLeft: height,
                heightDown: allTiles.get(pointDownRight)?.height ?? 0,
                heightRight: allTiles.get(pointRight)?.height ?? 0,
                vegetation: downRight
            },
            allTiles,
            allNormals,
            coordinates,
            normals,
            textureMappings,
            transitionCoordinates,
            transitionNormals,
            transitionTextureMappings
        )
    })

    return {
        coordinates: coordinates.concat(transitionCoordinates),
        normals: normals.concat(transitionNormals),
        textureMapping: textureMappings.concat(transitionTextureMappings)
    }
}

function setDrawImageRenderingBuffers(drawImageProgramInstance: ProgramInstance): void {
        setBuffer<DrawImageAttributes>(drawImageProgramInstance, 'a_position', UNIT_SQUARE)
        setBuffer<DrawImageAttributes>(drawImageProgramInstance, 'a_texcoord', UNIT_SQUARE)
}

function setDrawShadowRenderingBuffers(drawShadowProgramInstance: ProgramInstance): void {
    setBuffer<DrawImageAttributes>(drawShadowProgramInstance, 'a_position', UNIT_SQUARE)
    setBuffer<DrawImageAttributes>(drawShadowProgramInstance, 'a_texcoord', UNIT_SQUARE)
}

export {
    setFogOfWarRenderingBuffers,
    setRoadRenderingBuffers,
    setMapRenderingBuffers,
    setDrawImageRenderingBuffers,
    setDrawShadowRenderingBuffers
}