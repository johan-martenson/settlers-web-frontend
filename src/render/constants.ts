import { BUILDABLE_MOUNTAIN, BUILDABLE_WATER, DESERT_1, DESERT_2, FLOWER_MEADOW, LAVA_1, LAVA_2, LAVA_3, LAVA_4, MAGENTA, MEADOW_1, MEADOW_2, MEADOW_3, MOUNTAIN_1, MOUNTAIN_2, MOUNTAIN_3, MOUNTAIN_4, MOUNTAIN_MEADOW, SAVANNAH, SNOW, STEPPE, SWAMP, VegetationIntegers, WATER_1, WATER_2 } from "../api/types"

export const DEFAULT_SCALE = 35.0
export const DEFAULT_HEIGHT_ADJUSTMENT = 10.0
export const STANDARD_HEIGHT = 10.0

interface BelowAndDownRight {
    below: number[]
    downRight: number[]
}

// Geometric constants
export const UNIT_SQUARE = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
]

// Road constants
const ALL_ROADS_LEFT = 192.0 / 255
const ALL_ROADS_RIGHT = 240.0 / 255
const NORMAL_ROAD_TOP = 1.0 / 255
const NORMAL_ROAD_BOTTOM = 15.0 / 255
const MAIN_ROAD_TOP = 16.0 / 255
const MAIN_ROAD_BOTTOM = 31.0 / 255

export const NORMAL_ROAD_TEXTURE_MAPPING = [
    ALL_ROADS_LEFT, NORMAL_ROAD_BOTTOM,
    ALL_ROADS_LEFT, NORMAL_ROAD_TOP,
    ALL_ROADS_RIGHT, NORMAL_ROAD_BOTTOM,

    ALL_ROADS_LEFT, NORMAL_ROAD_TOP,
    ALL_ROADS_RIGHT, NORMAL_ROAD_BOTTOM,
    ALL_ROADS_RIGHT, NORMAL_ROAD_TOP
]

export const MAIN_ROAD_TEXTURE_MAPPING = [
    ALL_ROADS_LEFT, MAIN_ROAD_BOTTOM,
    ALL_ROADS_LEFT, MAIN_ROAD_TOP,
    ALL_ROADS_RIGHT, MAIN_ROAD_BOTTOM,

    ALL_ROADS_LEFT, MAIN_ROAD_TOP,
    ALL_ROADS_RIGHT, MAIN_ROAD_BOTTOM,
    ALL_ROADS_RIGHT, MAIN_ROAD_TOP
]

const NORMAL_ROAD_WITH_FLAG_LEFT = 241.0 / 255
const NORMAL_ROAD_WITH_FLAG_RIGHT = 254.0 / 255
const NORMAL_ROAD_WITH_FLAG_UP = 1.0 / 255
const NORMAL_ROAD_WITH_FLAG_DOWN = 14.0 / 255

const MAIN_ROAD_WITH_FLAG_LEFT = 241.0 / 255
const MAIN_ROAD_WITH_FLAG_RIGHT = 254.0 / 255
const MAIN_ROAD_WITH_FLAG_UP = 16.0 / 255
const MAIN_ROAD_WITH_FLAG_DOWN = 31.0 / 255

export const NORMAL_ROAD_WITH_FLAG = [
    NORMAL_ROAD_WITH_FLAG_LEFT, NORMAL_ROAD_WITH_FLAG_DOWN,
    NORMAL_ROAD_WITH_FLAG_LEFT, NORMAL_ROAD_WITH_FLAG_UP,
    NORMAL_ROAD_WITH_FLAG_RIGHT, NORMAL_ROAD_WITH_FLAG_DOWN,

    NORMAL_ROAD_WITH_FLAG_LEFT, NORMAL_ROAD_WITH_FLAG_UP,
    NORMAL_ROAD_WITH_FLAG_RIGHT, NORMAL_ROAD_WITH_FLAG_DOWN,
    NORMAL_ROAD_WITH_FLAG_RIGHT, NORMAL_ROAD_WITH_FLAG_UP,
]

export const MAIN_ROAD_WITH_FLAG = [
    MAIN_ROAD_WITH_FLAG_LEFT, MAIN_ROAD_WITH_FLAG_DOWN,
    MAIN_ROAD_WITH_FLAG_LEFT, MAIN_ROAD_WITH_FLAG_UP,
    MAIN_ROAD_WITH_FLAG_RIGHT, MAIN_ROAD_WITH_FLAG_DOWN,

    MAIN_ROAD_WITH_FLAG_LEFT, MAIN_ROAD_WITH_FLAG_UP,
    MAIN_ROAD_WITH_FLAG_RIGHT, MAIN_ROAD_WITH_FLAG_DOWN,
    MAIN_ROAD_WITH_FLAG_RIGHT, MAIN_ROAD_WITH_FLAG_UP,
]

// Vegetation constants
export const OVERLAPS: Map<VegetationIntegers, Set<VegetationIntegers>> = new Map()
export const TRANSITION_TEXTURE_MAPPINGS: Map<VegetationIntegers, number[]> = new Map()

OVERLAPS.set(SNOW, new Set([SAVANNAH, MOUNTAIN_1, SWAMP, DESERT_1, WATER_1, BUILDABLE_WATER, DESERT_2, MEADOW_1, MEADOW_2, MEADOW_3,
    MOUNTAIN_2, MOUNTAIN_3, MOUNTAIN_4, STEPPE, FLOWER_MEADOW, LAVA_1, MAGENTA, MOUNTAIN_MEADOW, WATER_2, LAVA_2, LAVA_3, LAVA_4, BUILDABLE_MOUNTAIN]))

OVERLAPS.set(MOUNTAIN_1, new Set([FLOWER_MEADOW, MEADOW_1, MEADOW_2, MEADOW_3, SAVANNAH, LAVA_1, LAVA_2, LAVA_3, LAVA_4]))
OVERLAPS.set(MOUNTAIN_2, new Set([FLOWER_MEADOW, MEADOW_1, MEADOW_2, MEADOW_3, SAVANNAH, LAVA_1, LAVA_2, LAVA_3, LAVA_4]))
OVERLAPS.set(MOUNTAIN_3, new Set([FLOWER_MEADOW, MEADOW_1, MEADOW_2, MEADOW_3, SAVANNAH, LAVA_1, LAVA_2, LAVA_3, LAVA_4]))
OVERLAPS.set(MOUNTAIN_4, new Set([FLOWER_MEADOW, MEADOW_1, MEADOW_2, MEADOW_3, SAVANNAH, LAVA_1, LAVA_2, LAVA_3, LAVA_4]))
OVERLAPS.set(BUILDABLE_MOUNTAIN, new Set([FLOWER_MEADOW, MEADOW_1, MEADOW_2, MEADOW_3, SAVANNAH, LAVA_1, LAVA_2, LAVA_3, LAVA_4]))
OVERLAPS.set(SWAMP, new Set([WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(SAVANNAH, new Set([WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(STEPPE, new Set([MEADOW_1, MEADOW_2, MEADOW_3, FLOWER_MEADOW, SAVANNAH]))
OVERLAPS.set(MEADOW_1, new Set([SAVANNAH, SWAMP, WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(MEADOW_2, new Set([SAVANNAH, SWAMP, WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(MEADOW_3, new Set([SAVANNAH, SWAMP, WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(FLOWER_MEADOW, new Set([SAVANNAH, SWAMP, WATER_1, WATER_2, BUILDABLE_WATER]))
OVERLAPS.set(MOUNTAIN_MEADOW, new Set([MEADOW_1, MEADOW_2, MEADOW_3, FLOWER_MEADOW, DESERT_1, DESERT_2]))
OVERLAPS.set(DESERT_1, new Set([SAVANNAH, WATER_1, WATER_2, BUILDABLE_WATER, MEADOW_1, MEADOW_2, MEADOW_3, FLOWER_MEADOW, MOUNTAIN_1, MOUNTAIN_2, MOUNTAIN_3, MOUNTAIN_4, BUILDABLE_MOUNTAIN]))
OVERLAPS.set(DESERT_2, new Set([SAVANNAH, WATER_1, WATER_2, BUILDABLE_WATER, MEADOW_1, MEADOW_2, MEADOW_3, FLOWER_MEADOW, MOUNTAIN_1, MOUNTAIN_2, MOUNTAIN_3, MOUNTAIN_4, BUILDABLE_MOUNTAIN]))


const MOUNTAIN_TRANSITION = ([192, 192, 255, 192, 225, 207]).map(v => v / 255.0)
const DESERT_TRANSITION = ([192, 208, 255, 208, 225, 223]).map(v => v / 255.0)
const GRASS_TRANSITION = ([192, 224, 255, 224, 225, 239]).map(v => v / 255.0)
const SNOW_TRANSITION = ([192, 176, 255, 176, 225, 191]).map(v => v / 255.0)

TRANSITION_TEXTURE_MAPPINGS.set(SNOW, SNOW_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MOUNTAIN_1, MOUNTAIN_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MOUNTAIN_2, MOUNTAIN_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MOUNTAIN_3, MOUNTAIN_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MOUNTAIN_4, MOUNTAIN_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(BUILDABLE_MOUNTAIN, DESERT_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(SWAMP, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(SAVANNAH, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MEADOW_1, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MEADOW_2, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MEADOW_3, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(FLOWER_MEADOW, GRASS_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(MOUNTAIN_MEADOW, MOUNTAIN_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(DESERT_1, DESERT_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(DESERT_2, DESERT_TRANSITION)
TRANSITION_TEXTURE_MAPPINGS.set(STEPPE, DESERT_TRANSITION)

export const vegetationToTextureMapping: Map<VegetationIntegers, BelowAndDownRight> = new Map()

vegetationToTextureMapping.set(SAVANNAH, {
    below: [
        1, 143,
        24, 96,
        47, 143
    ].map(v => v / 256.0),
    downRight: [
        1, 96,
        24, 143,
        47, 96
    ].map(v => v / 256.0)
}
)

vegetationToTextureMapping.set(MOUNTAIN_1, {
    below: [
        1, 95,
        24, 48,
        47, 95].map(v => v / 256),
    downRight: [
        1, 48,
        24, 95,
        47, 48].map(v => v / 256)
})

vegetationToTextureMapping.set(SNOW, {
    below: [
        1, 47,
        24, 1,
        47, 47
    ].map(v => v / 255.0),
    downRight: [
        1, 1,
        24, 47,
        47, 1
    ].map(v => v / 255.0)
})

vegetationToTextureMapping.set(SWAMP, {
    below: [
        96, 47,
        120, 1,
        143, 47].map(v => v / 256),
    downRight: [
        96, 1,
        120, 47,
        143, 1].map(v => v / 256)
})

vegetationToTextureMapping.set(DESERT_1, {
    below: [
        48, 47,
        72, 1,
        95, 47
    ].map(v => v / 255.0),
    downRight: [
        48, 1,
        72, 47,
        95, 1
    ].map(v => v / 255.0)
})

vegetationToTextureMapping.set(WATER_1, {
    below: [
        194, 76,
        219, 50,
        245, 76].map(v => v / 256),
    downRight: [
        194, 77,
        219, 101,
        245, 77].map(v => v / 256)
})

vegetationToTextureMapping.set(BUILDABLE_WATER, {
    below: [
        194, 76,
        219, 50,
        245, 76].map(v => v / 256),
    downRight: [
        194, 77,
        219, 101,
        245, 77].map(v => v / 256)
})

vegetationToTextureMapping.set(DESERT_2, {
    below: [
        48, 47,
        72, 1,
        95, 47
    ].map(v => v / 256),
    downRight: [
        48, 1,
        72, 47,
        95, 1].map(v => v / 256)
})

vegetationToTextureMapping.set(MEADOW_1, {
    below: [
        48, 143,
        72, 96,
        95, 143].map(v => v / 256),
    downRight: [
        48, 96,
        120, 143,
        95, 96].map(v => v / 256)
})

vegetationToTextureMapping.set(MEADOW_2,
    {
        below: [
            96, 143,
            129, 96,
            143, 143
        ].map(v => v / 256),
        downRight: [
            96, 96,
            120, 143,
            143, 96
        ].map(v => v / 256)
    })

vegetationToTextureMapping.set(MEADOW_3, {
    below: [
        144, 143,
        168, 96,
        191, 143].map(v => v / 256),
    downRight: [
        144, 96,
        168, 143,
        191, 96].map(v => v / 256)
})

vegetationToTextureMapping.set(MOUNTAIN_2, {
    below: [
        48, 95,
        72, 48,
        95, 95].map(v => v / 256),
    downRight: [
        48, 48,
        72, 95,
        95, 48].map(v => v / 256)
})

vegetationToTextureMapping.set(MOUNTAIN_3, {
    below: [
        96, 95,
        120, 48,
        143, 95].map(v => v / 256),
    downRight: [
        96, 48,
        120, 95,
        143, 48].map(v => v / 256)
})

vegetationToTextureMapping.set(MOUNTAIN_4, {
    below: [
        144, 95,
        168, 48,
        191, 95].map(v => v / 256),
    downRight: [
        144, 48,
        168, 95,
        191, 48].map(v => v / 256)
})

vegetationToTextureMapping.set(STEPPE, {
    below: [
        1, 191,
        24, 144,
        47, 191].map(v => v / 256),
    downRight: [
        1, 191,
        24, 144,
        47, 191].map(v => v / 256)
})

vegetationToTextureMapping.set(FLOWER_MEADOW, {
    below: [
        144, 47,
        168, 1,
        191, 47].map(v => v / 256),
    downRight: [
        144, 1,
        168, 47,
        191, 1].map(v => v / 256)
})

vegetationToTextureMapping.set(LAVA_1, {
    below: [
        192, 132,
        219, 104,
        247, 132].map(v => v / 256),
    downRight: [
        192, 133,
        220, 160,
        246, 132].map(v => v / 256)
})

vegetationToTextureMapping.set(MAGENTA, {
    below: [
        96, 191,
        120, 144,
        143, 191].map(v => v / 256),
    downRight: [
        96, 144,
        120, 191,
        143, 144].map(v => v / 256)
})

vegetationToTextureMapping.set(MOUNTAIN_MEADOW, {
    below: [
        48, 191,
        72, 144,
        95, 191].map(v => v / 256),
    downRight: [
        48, 144,
        72, 191,
        95, 144].map(v => v / 256)
})

vegetationToTextureMapping.set(WATER_2, {
    below: [
        194, 76,
        219, 50,
        245, 76].map(v => v / 256),
    downRight: [
        194, 77,
        219, 101,
        245, 77].map(v => v / 256)
})

vegetationToTextureMapping.set(LAVA_2, {
    below: [
        192, 132,
        219, 104,
        247, 132].map(v => v / 256),
    downRight: [
        192, 133,
        220, 160,
        246, 132].map(v => v / 256)
})

vegetationToTextureMapping.set(LAVA_3, {
    below: [
        192, 132,
        219, 104,
        247, 132].map(v => v / 256),
    downRight: [
        192, 133,
        220, 160,
        246, 132].map(v => v / 256)
})

vegetationToTextureMapping.set(LAVA_4, {
    below: [
        192, 132,
        219, 104,
        247, 132].map(v => v / 256),
    downRight: [
        192, 133,
        220, 160,
        246, 132].map(v => v / 256)
})

vegetationToTextureMapping.set(BUILDABLE_MOUNTAIN, {
    below: [
        48, 95,
        72, 48,
        95, 95].map(v => v / 256),
    downRight: [
        48, 48,
        72, 95,
        95, 48].map(v => v / 256)
})
