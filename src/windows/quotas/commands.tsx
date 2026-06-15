import { isMaterial, PlayerInformation } from '../../api/types'
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
            const building = buildingPretty(config.houseType)

            cmds.set(`Set ${building.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                type: 'NUMBER',
                min: 0,
                max: 10,
                parameterName: 'quota',
                action: (_material: MaterialQuotaToManage, quota: number) => config.set(player, quota),
                filter: currentMaterial => currentMaterial === material,
                icon: <HouseIcon houseType={config.houseType} nation={player.nation} scale={0.5} />
            })

            cmds.set(`Max ${building.toLowerCase()} ${materialName.toLowerCase()} quota`, {
                action: () => config.set(player, 10),
                filter: currentMaterial => currentMaterial === material,
                icon: <InventoryIcon nation={player.nation} material={isMaterial(material) ? material : 'COAL'} scale={0.8} />
            })

            cmds.set(`Clear ${building.toLowerCase()} ${materialName.toLowerCase()} quota`, {
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

function makeQuotaCommandsWithoutFilter(player: PlayerInformation) {
    return new Map(
        Array.from(makeQuotaCommands(player), ([key, command]) => [
            key,
            {
                ...command,
                filter: undefined
            }
        ])
    )
}

/// Exports
export {
    makeQuotaCommands,
    makeQuotaCommandsWithoutFilter
}