import { isBuilding, isMaterial, PlayerInformation } from '../../api/types'
import { commandRequiresPlayer, removeFilterFromCommand } from '../../commands/common'
import { GameContext } from '../../commands/types'
import { HouseIcon, InventoryIcon } from '../../components/icons/icon'
import { buildingPretty } from '../../utils/pretty-strings'
import { GenericCommand } from '../../utils/typing-commands'
import { QUOTA_CONFIGS } from './constants'
import { MaterialQuotaToManage } from './types'

/// Functions
function makeQuotaCommands(player: PlayerInformation): Map<string, GenericCommand<MaterialQuotaToManage>> {
    const cmds = new Map<string, GenericCommand<MaterialQuotaToManage>>()

    QUOTA_CONFIGS.forEach(({ material, materialName, configs }) => {
        configs.forEach(config => {
            let consumerLabel
            let icon

            if (isBuilding(config.consumer)) {
                consumerLabel = buildingPretty(config.consumer)
                icon = <HouseIcon houseType={config.consumer} nation={player.nation} scale={0.5} />
            } else {
                consumerLabel = 'Construction'
                icon = <div>Construction</div>
            }

            cmds.set(`Set ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                type: 'NUMBER',
                min: 0,
                max: 10,
                parameterName: 'quota',
                action: (_material: MaterialQuotaToManage, quota: number) => config.set(player, quota),
                filter: currentMaterial => currentMaterial === material,
                icon
            })

            cmds.set(`Max ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: () => config.set(player, 10),
                filter: currentMaterial => currentMaterial === material,
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} />
            })

            cmds.set(`Clear ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: () => config.set(player, 0),
                filter: currentMaterial => currentMaterial === material,
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} missing />
            })

            cmds.set(`Clear all ${materialName.toLowerCase()} quotas`, {
                action: () => configs.forEach(config => config.set(player, 0)),
                filter: currentMaterial => currentMaterial === material,
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} missing />
            })
        })
    })

    return cmds
}

function makeQuotaCommandsForGameContext<TValue extends string>(player: PlayerInformation): Map<string, GenericCommand<GameContext, TValue>> {
    const commands = new Map<string, GenericCommand<PlayerInformation, TValue>>()

    QUOTA_CONFIGS.forEach(({ material, materialName, configs }) => {
        configs.forEach(config => {
            let consumerLabel
            let icon

            if (isBuilding(config.consumer)) {
                consumerLabel = buildingPretty(config.consumer)
                icon = <HouseIcon houseType={config.consumer} nation={player.nation} scale={0.5} />
            } else {
                consumerLabel = 'Construction'
                icon = <div>Construction</div>
            }

            commands.set(`Set ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                type: 'NUMBER',
                min: 0,
                max: 10,
                parameterName: 'quota',
                action: (player: PlayerInformation, quota: number) => config.set(player, quota),
                icon
            })

            commands.set(`Max ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: () => config.set(player, 10),
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} />
            })

            commands.set(`Clear ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: () => config.set(player, 0),
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} missing />
            })

            commands.set(`Clear all ${materialName.toLowerCase()} quotas`, {
                action: () => configs.forEach(config => config.set(player, 0)),
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} missing />
            })

            commands.set(`Increase ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: (player: PlayerInformation) => config.set(player, config.get(player) + 1),
                filter: (player: PlayerInformation) => config.get(player) < 10
            })

            commands.set(`Decrease ${consumerLabel.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: (player: PlayerInformation) => config.set(player, config.get(player) + 1),
                filter: (player: PlayerInformation) => config.get(player) > 0
            })
        })
    })

    return new Map(
        [...commands].map(
            ([name, command]) => [
                name,
                commandRequiresPlayer(command)
            ]
        )
    )
}

/// Exports
export {
    makeQuotaCommands,
    makeQuotaCommandsForGameContext
}