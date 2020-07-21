import { AnyBuilding } from './api'

export type Filename = string

const houseImageMap: Map<AnyBuilding, Filename> = new Map()

houseImageMap.set("Armory","test/armory.png")
houseImageMap.set("Bakery","test/bakery.png")
houseImageMap.set("Barracks","test/barracks.png")
houseImageMap.set("Brewery","test/brewery.png")
houseImageMap.set("Catapult","test/catapult.png")
houseImageMap.set("CoalMine","test/coalmine.png")
houseImageMap.set("DonkeyFarm","test/donkeybreeder.png")
houseImageMap.set("Farm","test/farm.png")
houseImageMap.set("Fishery","test/fisher.png")
houseImageMap.set("ForesterHut","test/forester.png")
houseImageMap.set("Fortress","test/fortress.png")
houseImageMap.set("GoldMine","test/goldmine.png")
houseImageMap.set("GraniteMine","test/granitemine.png")
houseImageMap.set("GuardHouse","test/guardhouse.png")
houseImageMap.set("Headquarter","house.png")
houseImageMap.set("HunterHut","test/hunter.png")
houseImageMap.set("IronMine","test/ironmine.png")
houseImageMap.set("Mill","test/mill.png")
houseImageMap.set("Mint","test/mint.png")
houseImageMap.set("PigFarm","test/pigfarm.png")
houseImageMap.set("Quarry","test/stonemason.png")
houseImageMap.set("Sawmill","test/sawmill.png")
houseImageMap.set("SlaughterHouse","test/slaughterhouse.png")
houseImageMap.set("WatchTower","test/watchtower.png")
houseImageMap.set("Well","test/well.png")
houseImageMap.set("Woodcutter","test/woodcutter.png")
houseImageMap.set("Harbor","test/harbor.png")
houseImageMap.set("IronSmelter","test/ironsmelter.png")
houseImageMap.set("LookoutTower","test/lookouttower.png")
houseImageMap.set("Metalworks","test/metalworks.png")
houseImageMap.set("Shipyard","test/shipyard.png")
houseImageMap.set("Storehouse","test/storehouse.png")


export default houseImageMap
