import { useMemo, useState } from 'react'
import './quotas.css'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { AnyBuilding, isBuilding, Nation, PlayerId, } from '../../api/types'
import { WindowWithTyping } from '../../components/dialog'
import { ItemContainer } from '../../components/item_container'
import { usePlayer } from '../../utils/hooks/hooks'
import { clamp } from '../house/headquarter'
import { GenericCommand } from '../../utils/typing-commands'
import { buildingPretty } from '../../utils/pretty-strings'
import { HouseIcon, InventoryIcon, UiIcon } from '../../components/icons/icon'
import { Dismiss16Filled } from '@fluentui/react-icons'
import { MaterialQuotaToManage } from './types'
import { COAL_CONFIG, WHEAT_CONFIG, FOOD_CONFIG, WATER_CONFIG, IRON_CONFIG, PLANKS_CONFIG } from './constants'
import { makeQuotaCommands } from './commands'

// Types
type QuotasProps = {
    nation: Nation
    playerId: PlayerId

    onRaise: () => void
    onClose: () => void
}

type QuotaRowProps = {
    consumer: AnyBuilding | 'construction'
    nation: Nation
    value: number
    setHover: (text?: string) => void
    onDecrease: () => void
    onIncrease: () => void
}


// React components
const QuotaRow = ({ consumer, nation, value, setHover, onDecrease, onIncrease }: QuotaRowProps) => {
    const isHouse = isBuilding(consumer)
    const label = isHouse ? buildingPretty(consumer) : 'construction'

    return <Field label={label} style={{ width: '100%' }}>
        <div className='quota-for-house'>
            {isHouse
                ? <HouseIcon
                    houseType={consumer}
                    nation={nation}
                    drawShadow
                    onMouseEnter={() => setHover(label)}
                    onMouseLeave={() => setHover(undefined)}
                />
                : <div
                    onMouseEnter={() => setHover(label)}
                    onMouseLeave={() => setHover(undefined)}
                >Construction</div>
            }

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

    console.log('Player is now', player)

    // Memos
    const commands = useMemo(() => {
        const generalCommands = player !== undefined ? makeQuotaCommands(player) : new Map()
        const cmds = new Map<string, GenericCommand<MaterialQuotaToManage>>(generalCommands)

        cmds.set('Manage coal quota', {
            action: () => setMaterialToManage('COAL'),
            filter: material => material !== 'COAL',
            icon: <InventoryIcon nation={nation} material='COAL' scale={0.8} />
        })

        cmds.set('Manage wheat quota', {
            action: () => setMaterialToManage('WHEAT'),
            filter: material => material !== 'WHEAT',
            icon: <InventoryIcon nation={nation} material='WHEAT' scale={0.8} />
        })

        cmds.set('Manage water quota', {
            action: () => setMaterialToManage('WATER'),
            filter: material => material !== 'WATER',
            icon: <InventoryIcon nation={nation} material='WATER' scale={0.8} />
        })

        cmds.set('Manage plank quota', {
            action: () => setMaterialToManage('PLANK'),
            filter: material => material !== 'PLANK',
            icon: <InventoryIcon nation={nation} material='PLANK' scale={0.8} />
        })

        cmds.set('Manage food quota', {
            action: () => setMaterialToManage('FOOD'),
            filter: material => material !== 'FOOD',
            icon: <span>
                <InventoryIcon nation={nation} material='MEAT' scale={0.8} inline />
                <InventoryIcon nation={nation} material='BREAD' scale={0.8} inline />
                <InventoryIcon nation={nation} material='FISH' scale={0.8} inline />
            </span>
        })

        cmds.set('Manage iron bar quota', {
            action: () => setMaterialToManage('IRON_BAR'),
            filter: material => material !== 'IRON_BAR',
            icon: <InventoryIcon nation={nation} material='IRON_BAR' scale={0.8} />
        })

        cmds.set('Close window', {
            action: onClose,
            icon: <Dismiss16Filled />
        })

        return cmds
    }, [player, onClose, materialToManage])

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
                selectedValue={materialToManage}
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
                    {COAL_CONFIG.map(config => (
                        <QuotaRow
                            key={config.consumer}
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
                    {FOOD_CONFIG.map(config => (
                        <QuotaRow
                            key={config.consumer}
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
                    {WATER_CONFIG.map(config => (
                        <QuotaRow
                            key={config.consumer}
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
                    {WHEAT_CONFIG.map(config => (
                        <QuotaRow key={config.consumer} {...config} nation={nation} setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'IRON_BAR' &&
                <ItemContainer width='20em'>
                    {IRON_CONFIG.map(config => (
                        <QuotaRow key={config.consumer} {...config} nation={nation} setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>
            }

            {materialToManage === 'PLANK' &&
                <ItemContainer width='20em'>
                    {PLANKS_CONFIG.map(config => (
                        <QuotaRow key={config.consumer} {...config} nation={nation} setHover={setHover}
                            value={config.get(player)}
                            onDecrease={() => config.set(player, clamp(config.get(player) - 1, 0, 10))}
                            onIncrease={() => config.set(player, clamp(config.get(player) + 1, 0, 10))}
                        />
                    ))}
                </ItemContainer>}

        </WindowWithTyping>
    )
}

export { Quotas }