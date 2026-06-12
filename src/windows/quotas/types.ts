import { AnyBuilding, PlayerInformation } from '../../api/types'

export type QuotaConfig = {
    houseType: AnyBuilding
    get: (p: PlayerInformation) => number
    set: (p: PlayerInformation, v: number) => void
}

export type MaterialQuotaToManage = 'COAL' | 'WHEAT' | 'WATER' | 'PLANK' | 'FOOD' | 'IRON_BAR'
