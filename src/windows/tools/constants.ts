import { Tool } from '../../api/types'
import { UiIconType } from '../../components/icons/icon'

export const TOOLS_UI: Record<Tool, { PLUS: UiIconType, MINUS: UiIconType }> = {
    'SAW': { 'PLUS': 'SAW_AND_PLUS', 'MINUS': 'SAW_AND_MINUS' },
    'HAMMER': { 'PLUS': 'HAMMER_AND_PLUS', 'MINUS': 'HAMMER_AND_MINUS' },
    'AXE': { 'PLUS': 'AXE_AND_PLUS', 'MINUS': 'AXE_AND_MINUS' },
    'SHOVEL': { 'PLUS': 'SHOVEL_AND_PLUS', 'MINUS': 'SHOVEL_AND_MINUS' },
    'PICK_AXE': { 'PLUS': 'PICK_AXE_AND_PLUS', 'MINUS': 'PICK_AXE_AND_MINUS' },
    'BOW': { 'PLUS': 'BOW_AND_PLUS', 'MINUS': 'BOW_AND_MINUS' },
    'CLEAVER': { 'PLUS': 'CLEAVER_AND_PLUS', 'MINUS': 'CLEAVER_AND_MINUS' },
    'ROLLING_PIN': { 'PLUS': 'ROLLING_PIN_AND_PLUS', 'MINUS': 'ROLLING_PIN_AND_MINUS' },
    'CRUCIBLE': { 'PLUS': 'CRUCIBLE_AND_PLUS', 'MINUS': 'CRUCIBLE_AND_MINUS' },
    'TONGS': { 'PLUS': 'TONGS_AND_PLUS', 'MINUS': 'TONGS_AND_MINUS' },
    'SCYTHE': { 'PLUS': 'SCYTHE_AND_PLUS', 'MINUS': 'SCYTHE_AND_MINUS' },
    'FISHING_ROD': { 'PLUS': 'LINE_AND_HOOK_AND_PLUS', 'MINUS': 'LINE_AND_HOOK_AND_MINUS' }
}
