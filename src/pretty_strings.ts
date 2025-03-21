import { AnyBuilding, Material, Nation, PlayerColor, SoldierType, TransportCategory } from "./api/types"

const MATERIAL_FIRST_UPPERCASE = new Map<Material, string>()

MATERIAL_FIRST_UPPERCASE.set("FLOUR", 'Flour')
MATERIAL_FIRST_UPPERCASE.set('PIG', 'Pig')
MATERIAL_FIRST_UPPERCASE.set('GOLD', 'Gold')
MATERIAL_FIRST_UPPERCASE.set('IRON', 'Iron')
MATERIAL_FIRST_UPPERCASE.set('COAL', 'Coal')
MATERIAL_FIRST_UPPERCASE.set('STONE', 'Stone')
MATERIAL_FIRST_UPPERCASE.set('WATER', 'Water')
MATERIAL_FIRST_UPPERCASE.set('WOOD', 'Wood')
MATERIAL_FIRST_UPPERCASE.set('PLANK', 'Plank')
MATERIAL_FIRST_UPPERCASE.set('BREAD', 'Bread')
MATERIAL_FIRST_UPPERCASE.set('FISH', 'Fish')
MATERIAL_FIRST_UPPERCASE.set('MEAT', 'Meat')
MATERIAL_FIRST_UPPERCASE.set('SHIELD', 'Shield')
MATERIAL_FIRST_UPPERCASE.set('SWORD', 'Sword')
MATERIAL_FIRST_UPPERCASE.set('BEER', 'Beer')
MATERIAL_FIRST_UPPERCASE.set('COIN', 'Coin')
MATERIAL_FIRST_UPPERCASE.set('METALWORKER', 'Metal worker')
MATERIAL_FIRST_UPPERCASE.set('WHEAT', 'Wheat')
MATERIAL_FIRST_UPPERCASE.set('SHIPWRIGHT', 'Shipwright')
MATERIAL_FIRST_UPPERCASE.set('AXE', 'Axe')
MATERIAL_FIRST_UPPERCASE.set('SHOVEL', 'Shovel')
MATERIAL_FIRST_UPPERCASE.set('PICK_AXE', 'Pick axe')
MATERIAL_FIRST_UPPERCASE.set('FISHING_ROD', 'Fishing rod')
MATERIAL_FIRST_UPPERCASE.set('BOW', 'Bow')
MATERIAL_FIRST_UPPERCASE.set('SAW', 'Saw')
MATERIAL_FIRST_UPPERCASE.set('CLEAVER', 'Cleaver')
MATERIAL_FIRST_UPPERCASE.set('ROLLING_PIN', 'Rolling pin')
MATERIAL_FIRST_UPPERCASE.set('CRUCIBLE', 'Crucible')
MATERIAL_FIRST_UPPERCASE.set('TONGS', 'Tongs')
MATERIAL_FIRST_UPPERCASE.set('SCYTHE', 'Scythe')
MATERIAL_FIRST_UPPERCASE.set('IRON_BAR', 'Iron bar')
MATERIAL_FIRST_UPPERCASE.set('ARMORER', 'Armorer')
MATERIAL_FIRST_UPPERCASE.set('BAKER', 'Baker')
MATERIAL_FIRST_UPPERCASE.set('BREWER', 'Brewer')
MATERIAL_FIRST_UPPERCASE.set('BUTCHER', 'Butcher')
MATERIAL_FIRST_UPPERCASE.set('COURIER', 'Courier')
MATERIAL_FIRST_UPPERCASE.set('DONKEY_BREEDER', 'Donkey breeder')
MATERIAL_FIRST_UPPERCASE.set('DONKEY', 'Donkey')
MATERIAL_FIRST_UPPERCASE.set('FARMER', 'Farmer')
MATERIAL_FIRST_UPPERCASE.set('FISHERMAN', 'Fisherman')
MATERIAL_FIRST_UPPERCASE.set('FORESTER', 'Forester')
MATERIAL_FIRST_UPPERCASE.set('GEOLOGIST', 'Geologist')
MATERIAL_FIRST_UPPERCASE.set('HUNTER', 'Hunter')
MATERIAL_FIRST_UPPERCASE.set('IRON_FOUNDER', 'Iron founder')
MATERIAL_FIRST_UPPERCASE.set('MILLER', 'Miller')
MATERIAL_FIRST_UPPERCASE.set('MINER', 'Miner')
MATERIAL_FIRST_UPPERCASE.set('MINTER', 'Minter')
MATERIAL_FIRST_UPPERCASE.set('PIG_BREEDER', 'Pig breeder')
MATERIAL_FIRST_UPPERCASE.set('SAWMILL_WORKER', 'Sawmill worker')
MATERIAL_FIRST_UPPERCASE.set('SCOUT', 'Scout')
MATERIAL_FIRST_UPPERCASE.set('STONEMASON', 'Stonemason')
MATERIAL_FIRST_UPPERCASE.set('STOREHOUSE_WORKER', 'Storehouse worker')
MATERIAL_FIRST_UPPERCASE.set('WELL_WORKER', 'Well worker')
MATERIAL_FIRST_UPPERCASE.set('WOODCUTTER_WORKER', 'Woodcutter worker')
MATERIAL_FIRST_UPPERCASE.set('PRIVATE', 'Private')
MATERIAL_FIRST_UPPERCASE.set('PRIVATE_FIRST_CLASS', 'Private first class')
MATERIAL_FIRST_UPPERCASE.set('SERGEANT', 'Sergeant')
MATERIAL_FIRST_UPPERCASE.set('OFFICER', 'Officer')
MATERIAL_FIRST_UPPERCASE.set('GENERAL', 'General')
MATERIAL_FIRST_UPPERCASE.set('BUILDER', 'Builder')
MATERIAL_FIRST_UPPERCASE.set('PLANER', 'Planer')

const MATERIAL_LABELS: Map<string, string> = new Map(Object.entries(
    {
        PLANK: 'Plank',
        WOOD: 'Wood',
        STONE: 'Stone',
        PIG: 'Pig',
        FLOUR: 'Flour',
        GOLD: 'Gold',
        IRON: 'Iron',
        COAL: 'Coal',
        WATER: 'Water',
        BREAD: 'Bread',
        FISH: 'Fish',
        MEAT: 'Meat',
        SHIELD: 'Shield',
        SWORD: 'Sword',
        BEER: 'Beer',
        COIN: 'Coin',
        METALWORKER: 'Metal worker',
        WHEAT: 'Wheat',
        SHIPWRIGHT: 'Shipwright',
        AXE: 'Axe',
        SHOVEL: 'Shovel',
        PICK_AXE: 'Pick axe',
        FISHING_ROD: 'Fishing rod',
        BOW: 'Bow',
        SAW: 'Saw',
        CLEAVER: 'Cleaver',
        ROLLING_PIN: 'Rolling pin',
        CRUCIBLE: 'Crucible',
        TONGS: 'Tongs',
        SCYTHE: 'Scythe',
        IRON_BAR: 'Iron bar',
        ARMORER: 'Armorer',
        BAKER: 'Baker',
        BREWER: 'Brewer',
        BUTCHER: 'Butcher',
        COURIER: 'Courier',
        DONKEY_BREEDER: 'Donkey breeder',
        DONKEY: 'Donkey',
        FARMER: 'Farmer',
        FISHERMAN: 'Fisherman',
        FORESTER: 'Forester',
        GEOLOGIST: 'Geologist',
        HUNTER: 'Hunter',
        IRON_FOUNDER: 'Iron founder',
        MILLER: 'Miller',
        MINER: 'Miner',
        MINTER: 'Minter',
        PIG_BREEDER: 'Pig breeder',
        SAWMILL_WORKER: 'Sawmill worker',
        SCOUT: 'Scout',
        STONEMASON: 'Stonemason',
        WOODCUTTER_WORKER: 'Woodcutter',
        PRIVATE: 'Private',
        PRIVATE_FIRST_CLASS: 'Private first class',
        SERGEANT: 'Sergeant',
        OFFICER: 'Officer',
        GENERAL: 'General',
        BUILDER: 'Builder',
        PLANER: 'Planer'
    }
))

const NATION_PRETTY = new Map<Nation, string>([
    ['ROMANS', 'Romans'],
    ['JAPANESE', 'Japanese'],
    ['AFRICANS', 'Africans'],
    ['VIKINGS', 'Vikings']
])

const COLOR_PRETTY = new Map<PlayerColor, string>([
    ['BLUE', 'Blue'],
    ['BROWN', 'Brown'],
    ['GRAY', 'Gray'],
    ['GREEN', 'Green'],
    ['PURPLE', 'Purple'],
    ['RED', 'Red'],
    ['WHITE', 'White'],
    ['YELLOW', 'Yellow']
])

const BUILDINGS_PRETTY = new Map<AnyBuilding, string>([
    ['ForesterHut', 'Forester hut'],
    ['Woodcutter', 'Woodcutter'],
    ['Well', 'Well'],
    ['Quarry', 'Quarry'],
    ['Barracks', 'Barracks'],
    ['GuardHouse', 'Guard house'],
    ['HunterHut', 'Hunter hut'],
    ['Fishery', 'Fishery'],
    ['GoldMine', 'Gold mine'],
    ['IronMine', 'Iron mine'],
    ['CoalMine', 'Coal mine'],
    ['GraniteMine', 'Granite mine'],
    ['LookoutTower', 'Lookout tower'],

    ['Sawmill', 'Sawmill'],
    ['Bakery', 'Bakery'],
    ['WatchTower', 'Watch tower'],
    ['Armory', 'Armory'],
    ['Mill', 'Mill'],
    ['SlaughterHouse', 'Slaughter house'],
    ['Catapult', 'Catapult'],
    ['Mint', 'Mint'],
    ['Brewery', 'Brewery'],
    ['Armory', 'Armory'],
    ['IronSmelter', 'Iron smelter'],
    ['Metalworks', 'Metalworks'],
    ['Shipyard', 'Shipyard'],
    ['Storehouse', 'Storehouse'],

    ['Farm', 'Farm'],
    ['PigFarm', 'Pig farm'],
    ['DonkeyFarm', 'Donkey farm'],
    ['Fortress', 'Fortress'],
])

const CATEGORY_PRETTY = new Map<TransportCategory, string>([
    ['PLANK', 'Plank'],
    ['WOOD', 'Wood'],
    ['STONE', 'Stone'],
    ['PIG', 'Pig'],
    ['FLOUR', 'Flour'],
    ['GOLD', 'Gold'],
    ['IRON', 'Iron'],
    ['COAL', 'Coal'],
    ['WATER', 'Water'],
    ['COIN', 'Coin'],
    ['WHEAT', 'Wheat'],
    ['IRON_BAR', 'Iron bar'],
    ['FOOD', 'Food'],
    ['WEAPONS', 'Weapons'],
    ['TOOLS', 'Tools'],
    ['BOAT', 'Boat'],
])


function nationPretty(nation: Nation): string {
    return NATION_PRETTY.get(nation) ?? ''
}

function colorPretty(color: PlayerColor): string {
    return COLOR_PRETTY.get(color) ?? ''
}

function soldierPretty(soldierType: SoldierType): string {
    if (soldierType === 'PRIVATE_RANK') {
        return 'Private'
    } else if (soldierType === 'PRIVATE_FIRST_CLASS_RANK') {
        return 'Private first class'
    } else if (soldierType === 'SERGEANT_RANK') {
        return 'Sergeant'
    } else if (soldierType === 'OFFICER_RANK') {
        return 'Officer'
    } else {
        return 'General'
    }
}

function buildingPretty(building: AnyBuilding): string {
    return BUILDINGS_PRETTY.get(building) ?? building
}

function categoryPretty(category: TransportCategory): string {
    return CATEGORY_PRETTY.get(category) ?? category
}

function materialPretty(material: Material): string {
    return MATERIAL_FIRST_UPPERCASE.get(material) ?? material
}

export {
    MATERIAL_FIRST_UPPERCASE,
    MATERIAL_LABELS,
    nationPretty,
    colorPretty,
    soldierPretty,
    buildingPretty,
    categoryPretty,
    materialPretty
}