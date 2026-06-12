import { MaterialQuotaToManage, QuotaConfig } from './types'
import { PlayerInformation } from '../../api/types'
import { api } from '../../api/ws-api'

export const COAL_CONFIG: QuotaConfig[] = [
    {
        houseType: 'Mint',
        get: (p: PlayerInformation) => p.coalQuota.mint,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(v, p.coalQuota.armory, p.coalQuota.ironSmelter)
    },
    {
        houseType: 'Armory',
        get: (p: PlayerInformation) => p.coalQuota.armory,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(p.coalQuota.mint, v, p.coalQuota.ironSmelter)
    },
    {
        houseType: 'IronSmelter',
        get: (p: PlayerInformation) => p.coalQuota.ironSmelter,
        set: (p: PlayerInformation, v: number) => api.setCoalQuotas(p.coalQuota.mint, p.coalQuota.armory, v)
    }
]

export const FOOD_CONFIG: QuotaConfig[] = [
    {
        houseType: 'IronMine',
        get: (p: PlayerInformation) => p.foodQuota.ironMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(v, p.foodQuota.coalMine, p.foodQuota.goldMine, p.foodQuota.graniteMine)
    },
    {
        houseType: 'CoalMine',
        get: (p: PlayerInformation) => p.foodQuota.coalMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.foodQuota.ironMine, v, p.foodQuota.goldMine, p.foodQuota.graniteMine)
    },
    {
        houseType: 'GoldMine',
        get: (p: PlayerInformation) => p.foodQuota.goldMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.foodQuota.ironMine, p.foodQuota.coalMine, v, p.foodQuota.graniteMine)
    },
    {
        houseType: 'GraniteMine',
        get: (p: PlayerInformation) => p.foodQuota.graniteMine,
        set: (p: PlayerInformation, v: number) => api.setFoodQuotas(p.foodQuota.ironMine, p.foodQuota.coalMine, p.foodQuota.goldMine, v)
    }
]

export const WATER_CONFIG: QuotaConfig[] = [
    {
        houseType: 'Bakery',
        get: (p: PlayerInformation) => p.waterQuota.bakery,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(v, p.waterQuota.donkeyFarm, p.waterQuota.pigFarm, p.waterQuota.brewery)
    },
    {
        houseType: 'DonkeyFarm',
        get: (p: PlayerInformation) => p.waterQuota.donkeyFarm,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.waterQuota.bakery, v, p.waterQuota.pigFarm, p.waterQuota.brewery)
    },
    {
        houseType: 'PigFarm',
        get: (p: PlayerInformation) => p.waterQuota.pigFarm,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.waterQuota.bakery, p.waterQuota.donkeyFarm, v, p.waterQuota.brewery)
    },
    {
        houseType: 'Brewery',
        get: (p: PlayerInformation) => p.waterQuota.brewery,
        set: (p: PlayerInformation, v: number) => api.setWaterQuotas(p.waterQuota.bakery, p.waterQuota.donkeyFarm, p.waterQuota.pigFarm, v)
    }
]

export const WHEAT_CONFIG: QuotaConfig[] = [
    {
        houseType: 'Mill',
        get: (p: PlayerInformation) => p.wheatQuota.mill,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.wheatQuota.donkeyFarm, p.wheatQuota.pigFarm, v, p.wheatQuota.brewery)
    },
    {
        houseType: 'DonkeyFarm',
        get: (p: PlayerInformation) => p.wheatQuota.donkeyFarm,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(v, p.wheatQuota.pigFarm, p.wheatQuota.mill, p.wheatQuota.brewery)
    },
    {
        houseType: 'PigFarm',
        get: (p: PlayerInformation) => p.wheatQuota.pigFarm,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.wheatQuota.donkeyFarm, v, p.wheatQuota.mill, p.wheatQuota.brewery)
    },
    {
        houseType: 'Brewery',
        get: (p: PlayerInformation) => p.wheatQuota.brewery,
        set: (p: PlayerInformation, v: number) => api.setWheatQuotas(p.wheatQuota.donkeyFarm, p.wheatQuota.pigFarm, p.wheatQuota.mill, v)
    }
]

export const IRON_CONFIG: QuotaConfig[] = [
    {
        houseType: 'Armory',
        get: (p: PlayerInformation) => p.ironQuota.armory,
        set: (p: PlayerInformation, v: number) => api.setIronBarQuotas(v, p.ironQuota.metalworks)
    },
    {
        houseType: 'Metalworks',
        get: (p: PlayerInformation) => p.ironQuota.metalworks,
        set: (p: PlayerInformation, v: number) => api.setIronBarQuotas(p.ironQuota.armory, v)
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
        }
    ]