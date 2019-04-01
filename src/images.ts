import { AnyBuilding } from './buildings';

export type Filename = string;

const houseImageMap: Map<AnyBuilding, Filename> = new Map();

houseImageMap.set("Bakery", "bakery-small.jpg");
houseImageMap.set("ForesterHut", "house.png");
houseImageMap.set("Woodcutter", "house.png");
houseImageMap.set("Well", "well-with-tree-small.jpg");
houseImageMap.set("Quarry", "house.png");
houseImageMap.set("Barracks", "barracks-small.jpg");
houseImageMap.set("GuardHouse", "house.png");
houseImageMap.set("HunterHut", "house.png");
houseImageMap.set("Fishery", "house.png");
houseImageMap.set("GoldMine", "house.png");
houseImageMap.set("IronMine", "house.png");
houseImageMap.set("CoalMine", "house.png");
houseImageMap.set("GraniteMine", "house.png");
houseImageMap.set("Sawmill", "sawmill-small.png");
houseImageMap.set("WatchTower", "house.png");
houseImageMap.set("Mill", "house.png");
houseImageMap.set("Mint", "house.png");
houseImageMap.set("SlaughterHouse", "house.png");
houseImageMap.set("Catapult", "house.png");
houseImageMap.set("Headquarter", "headquarter-small.jpg");
houseImageMap.set("Farm", "house.png");
houseImageMap.set("PigFarm", "house.png");
houseImageMap.set("DonkeyFarm", "house.png");
houseImageMap.set("Fortress", "fortress-small.jpg");
houseImageMap.set("Brewery", "house.png");
houseImageMap.set("Armory", "house.png");

export default houseImageMap;
