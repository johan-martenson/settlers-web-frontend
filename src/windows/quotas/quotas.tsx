import React, { useMemo, useState } from 'react'
import { HouseIcon, UiIcon } from '../../icons/icon'
import './quotas.css'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { AnyBuilding, Nation, PlayerId, PlayerInformation } from '../../api/types'
import { api } from '../../api/ws-api'
import { WindowWithTyping } from '../../components/dialog'
import { ItemContainer } from '../../components/item_container'
import { usePlayer } from '../../utils/hooks/hooks'
import { clamp } from '../house/headquarter'
import { buildingPretty } from '../../pretty_strings'

// Types
type QuotasProps = {
    nation: Nation
    playerId: PlayerId

    onRaise: () => void
    onClose: () => void
}

type QuotaRowProps = {
    houseType: AnyBuilding
    nation: Nation
    value: number
    setHover: (text?: string) => void
    onDecrease: () => void
    onIncrease: () => void
}

type QuotaConfig = {
    houseType: AnyBuilding
    get: (p: PlayerInformation) => number
    set: (p: PlayerInformation, v: number) => void
}

type MaterialQuotaToManage = 'COAL' | 'WHEAT' | 'WATER' | 'PLANK' | 'FOOD' | 'IRON_BAR'


// Configuration
const coalConfig: QuotaConfig[] = [
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

const foodConfig: QuotaConfig[] = [
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

const waterConfig: QuotaConfig[] = [
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

const wheatConfig: QuotaConfig[] = [
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

const ironConfig: QuotaConfig[] = [
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


// React components
const QuotaRow = ({ houseType, nation, value, setHover, onDecrease, onIncrease }: QuotaRowProps) => {
    const label = buildingPretty(houseType)

    return <Field label={label} style={{ width: '100%' }}>
        <div className='quota-for-house'>
            <HouseIcon
                houseType={houseType}
                nation={nation}
                drawShadow
                onMouseEnter={() => setHover(label)}
                onMouseLeave={() => setHover(undefined)}
            />

            <div className='quota'>
                <UiIcon type='MINUS' scale={0.5}
                    onClick={onDecrease}
                    onMouseEnter={() => setHover(`Decrease ${label.toLowerCase()} quota`)}
                    onMouseLeave={() => setHover(undefined)}
                />
                <meter
                    value={value}
                    min={0}
                    max={10}
                    onMouseEnter={() => setHover(`${value} / 10`)}
                    onMouseLeave={() => setHover(undefined)}
                />
                <UiIcon type='PLUS' scale={0.5}
                    onClick={onIncrease}
                    onMouseEnter={() => setHover(`Increase ${label.toLowerCase()} quota`)}
                    onMouseLeave={() => setHover(undefined)}
                />
            </div>
        </div>
    </Field>
}

const Quotas = ({ nation, playerId, onClose, onRaise }: QuotasProps) => {

    // State
    const [hover, setHover] = useState<string>()
    const [materialToManage, setMaterialToManage] = useState<MaterialQuotaToManage>('COAL')

    // Monitoring hooks
    const player = usePlayer(playerId)

    // Functions

    // Memos
    const commands = useMemo(() => {
        const cmds = new Map()

        cmds.set('Manage coal quota', {
            action: () => setMaterialToManage('COAL')
        })

        cmds.set('Manage wheat quota', {
            action: () => setMaterialToManage('WHEAT')
        })

        cmds.set('Manage water quota', {
            action: () => setMaterialToManage('WATER')
        })

        cmds.set('Manage plank quota', {
            action: () => setMaterialToManage('PLANK')
        })

        cmds.set('Manage food quota', {
            action: () => setMaterialToManage('FOOD')
        })

        cmds.set('Manage iron bar quota', {
            action: () => setMaterialToManage('IRON_BAR')
        })

        cmds.set('Close window', {
            action: onClose
        })

        return cmds
    }, [])

    // Effects

    // Rendering
    if (player === undefined) {
        console.error('Quotas window: player is undefined')
        return null
    }

    return (
        <WindowWithTyping<MaterialQuotaToManage>
            commands={commands}
            param={materialToManage}
            className='quotas-window'
            heading='Quotas'
            onClose={onClose}
            onRaise={onRaise}
            hoverInfo={hover}
        >

            <TabList
                defaultSelectedValue={materialToManage}
                onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
                    setMaterialToManage(data.value as typeof materialToManage)
                }}
            >
                <Tab value={'COAL'}>Coal</Tab>
                <Tab value={'WHEAT'}>Wheat</Tab>
                <Tab value={'WATER'}>Water</Tab>
                <Tab value={'PLANK'}>Plank</Tab>
                <Tab value={'FOOD'}>Food</Tab>
                <Tab value={'IRON_BAR'}>Iron bars</Tab>
            </TabList>

            {materialToManage === 'COAL' &&
                <ItemContainer width='20em'>
                    {coalConfig.map(config => (
                        <QuotaRow
                            key={config.houseType}
                            {...config}
                            nation={nation}
                            setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'FOOD' &&
                <ItemContainer width='20em'>
                    {foodConfig.map(config => (
                        <QuotaRow
                            key={config.houseType}
                            {...config}
                            nation={nation}
                            setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'WATER' &&
                <ItemContainer width='20em'>
                    {waterConfig.map(config => (
                        <QuotaRow
                            key={config.houseType}
                            {...config}
                            nation={nation}
                            setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'WHEAT' &&
                <ItemContainer width='20em'>
                    {wheatConfig.map(config => (
                        <QuotaRow key={config.houseType} {...config} nation={nation} setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'IRON_BAR' &&
                <ItemContainer width='20em'>
                    {ironConfig.map(config => (
                        <QuotaRow key={config.houseType} {...config} nation={nation} setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

        </WindowWithTyping>
    )
}

export { Quotas }