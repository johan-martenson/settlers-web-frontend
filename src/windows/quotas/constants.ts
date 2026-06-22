import { MaterialQuotaToManage, QuotaConfig } from './types'
import { PlayerInformation } from '../../api/types'
import { api } from '../../api/ws-api'

export const COAL_CONFIG: QuotaConfig[] = [
    {
        consumer: 'Mint',
        get: (p: PlayerInformation) => p.resourceQuotas.COAL.mint,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(v, p.resourceQuotas.COAL.armory, p.resourceQuotas.COAL.ironSmelter)
    },
    {
        consumer: 'Armory',
        get: (p: PlayerInformation) => p.resourceQuotas.COAL.armory,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(p.resourceQuotas.COAL.mint, v, p.resourceQuotas.COAL.ironSmelter)
    },
    {
        consumer: 'IronSmelter',
        get: (p: PlayerInformation) => p.resourceQuotas.COAL.ironSmelter,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(p.resourceQuotas.COAL.mint, p.resourceQuotas.COAL.armory, v)
    }
]

export const FOOD_CONFIG: QuotaConfig[] = [
    {
        consumer: 'IronMine',
        get: (p: PlayerInformation) => p.resourceQuotas.FOOD.ironMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(v, p.resourceQuotas.FOOD.coalMine, p.resourceQuotas.FOOD.goldMine, p.resourceQuotas.FOOD.graniteMine)
    },
    {
        consumer: 'CoalMine',
        get: (p: PlayerInformation) => p.resourceQuotas.FOOD.coalMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.resourceQuotas.FOOD.ironMine, v, p.resourceQuotas.FOOD.goldMine, p.resourceQuotas.FOOD.graniteMine)
    },
    {
        consumer: 'GoldMine',
        get: (p: PlayerInformation) => p.resourceQuotas.FOOD.goldMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.resourceQuotas.FOOD.ironMine, p.resourceQuotas.FOOD.coalMine, v, p.resourceQuotas.FOOD.graniteMine)
    },
    {
        consumer: 'GraniteMine',
        get: (p: PlayerInformation) => p.resourceQuotas.FOOD.graniteMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.resourceQuotas.FOOD.ironMine, p.resourceQuotas.FOOD.coalMine, p.resourceQuotas.FOOD.goldMine, v)
    }
]

export const WATER_CONFIG: QuotaConfig[] = [
    {
        consumer: 'Bakery',
        get: (p: PlayerInformation) => p.resourceQuotas.WATER.bakery,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(v, p.resourceQuotas.WATER.donkeyFarm, p.resourceQuotas.WATER.pigFarm, p.resourceQuotas.WATER.brewery)
    },
    {
        consumer: 'DonkeyFarm',
        get: (p: PlayerInformation) => p.resourceQuotas.WATER.donkeyFarm,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.resourceQuotas.WATER.bakery, v, p.resourceQuotas.WATER.pigFarm, p.resourceQuotas.WATER.brewery)
    },
    {
        consumer: 'PigFarm',
        get: (p: PlayerInformation) => p.resourceQuotas.WATER.pigFarm,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.resourceQuotas.WATER.bakery, p.resourceQuotas.WATER.donkeyFarm, v, p.resourceQuotas.WATER.brewery)
    },
    {
        consumer: 'Brewery',
        get: (p: PlayerInformation) => p.resourceQuotas.WATER.brewery,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.resourceQuotas.WATER.bakery, p.resourceQuotas.WATER.donkeyFarm, p.resourceQuotas.WATER.pigFarm, v)
    }
]

export const WHEAT_CONFIG: QuotaConfig[] = [
    {
        consumer: 'Mill',
        get: (p: PlayerInformation) => p.resourceQuotas.WHEAT.mill,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.resourceQuotas.WHEAT.donkeyFarm, p.resourceQuotas.WHEAT.pigFarm, v, p.resourceQuotas.WHEAT.brewery)
    },
    {
        consumer: 'DonkeyFarm',
        get: (p: PlayerInformation) => p.resourceQuotas.WHEAT.donkeyFarm,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(v, p.resourceQuotas.WHEAT.pigFarm, p.resourceQuotas.WHEAT.mill, p.resourceQuotas.WHEAT.brewery)
    },
    {
        consumer: 'PigFarm',
        get: (p: PlayerInformation) => p.resourceQuotas.WHEAT.pigFarm,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.resourceQuotas.WHEAT.donkeyFarm, v, p.resourceQuotas.WHEAT.mill, p.resourceQuotas.WHEAT.brewery)
    },
    {
        consumer: 'Brewery',
        get: (p: PlayerInformation) => p.resourceQuotas.WHEAT.brewery,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.resourceQuotas.WHEAT.donkeyFarm, p.resourceQuotas.WHEAT.pigFarm, p.resourceQuotas.WHEAT.mill, v)
    }
]

export const IRON_CONFIG: QuotaConfig[] = [
    {
        consumer: 'Armory',
        get: (p: PlayerInformation) => p.resourceQuotas.IRON.armory,
        set: (p: PlayerInformation, v: number) => api.setIronBarQuotas(v, p.resourceQuotas.IRON.metalworks)
    },
    {
        consumer: 'Metalworks',
        get: (p: PlayerInformation) => p.resourceQuotas.IRON.metalworks,
        set: (p: PlayerInformation, v: number) => api.setIronBarQuotas(p.resourceQuotas.IRON.armory, v)
    }
]

export const PLANKS_CONFIG: QuotaConfig[] = [
    {
        consumer: 'construction',
        get: (p: PlayerInformation) => p.resourceQuotas.PLANKS.construction,
        set: (p: PlayerInformation, v: number) => api.setPlankQuotas(v, p.resourceQuotas.PLANKS.shipyard, p.resourceQuotas.PLANKS.metalworks)
    },
    {
        consumer: 'Shipyard',
        get: (p: PlayerInformation) => p.resourceQuotas.PLANKS.shipyard,
        set: (p: PlayerInformation, v: number) => api.setPlankQuotas(p.resourceQuotas.PLANKS.construction, v, p.resourceQuotas.PLANKS.metalworks)
    },
    {
        consumer: 'Metalworks',
        get: (p: PlayerInformation) => p.resourceQuotas.PLANKS.metalworks,
        set: (p: PlayerInformation, v: number) => api.setPlankQuotas(p.resourceQuotas.PLANKS.construction, p.resourceQuotas.PLANKS.shipyard, v)
    }

]

export const QUOTA_CONFIGS: {
    material: MaterialQuotaToManage
    materialName: string
    configs: QuotaConfig[]
}[] = [
        {
            material: 'COAL',
            materialName: 'coal',
            configs: COAL_CONFIG
        },
        {
            material: 'WHEAT',
            materialName: 'wheat',
            configs: WHEAT_CONFIG
        },
        {
            material: 'WATER',
            materialName: 'water',
            configs: WATER_CONFIG
        },
        {
            material: 'FOOD',
            materialName: 'food',
            configs: FOOD_CONFIG
        },
        {
            material: 'IRON_BAR',
            materialName: 'iron bar',
            configs: IRON_CONFIG
        },
        {
            material: 'PLANK',
            materialName: 'planks',
            configs: PLANKS_CONFIG
        }
    ]