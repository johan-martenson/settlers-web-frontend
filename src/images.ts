import { AnyBuilding } from './api'

export type Filename = string

const prefix = "assets/roman-buildings/"

const houseImageMap: Map<AnyBuilding, Filename> = new Map()

houseImageMap.set("Armory", prefix + "armory.png")
houseImageMap.set("Bakery", prefix + "bakery.png")
houseImageMap.set("Barracks", prefix + "barracks.png")
houseImageMap.set("Brewery", prefix + "brewery.png")
houseImageMap.set("Catapult", prefix + "catapult.png")
houseImageMap.set("CoalMine", prefix + "coal-mine.png")
houseImageMap.set("DonkeyFarm", prefix + "donkey-breeder.png")
houseImageMap.set("Farm", prefix + "farm.png")
houseImageMap.set("Fishery", prefix + "fishery.png")
houseImageMap.set("ForesterHut", prefix + "forester-hut.png")
houseImageMap.set("Fortress", prefix + "fortress.png")
houseImageMap.set("GoldMine", prefix + "gold-mine.png")
houseImageMap.set("GraniteMine", prefix + "granite-mine.png")
houseImageMap.set("GuardHouse", prefix + "guardhouse.png")
houseImageMap.set("Headquarter", prefix + "headquarter.png")
houseImageMap.set("HunterHut", prefix + "hunter-hut.png")
houseImageMap.set("IronMine", prefix + "iron-mine.png")
houseImageMap.set("IronSmelter", prefix + "iron-smelter.png")
houseImageMap.set("Mill", prefix + "mill-no-fan.png")
houseImageMap.set("Mint", prefix + "mint.png")
houseImageMap.set("PigFarm", prefix + "pig-farm.png")
houseImageMap.set("Quarry", prefix + "quarry.png")
houseImageMap.set("Sawmill", prefix + "sawmill.png")
houseImageMap.set("SlaughterHouse", prefix + "slaughter-house.png")
houseImageMap.set("WatchTower", prefix + "watchtower.png")
houseImageMap.set("Well", prefix + "well.png")
houseImageMap.set("Woodcutter", prefix + "woodcutter.png")
houseImageMap.set("Harbor", prefix + "harbor.png")
houseImageMap.set("LookoutTower", prefix + "lookout-tower.png")
houseImageMap.set("Metalworks", prefix + "metalworks.png")
houseImageMap.set("Shipyard", prefix + "shipyard.png")
houseImageMap.set("Storehouse", prefix + "storehouse.png")


export default houseImageMap
