import { AnyBuilding } from './buildings'

type PictureType = AnyBuilding | string

export interface PageType {
    page: string
    title: string
    pictures: PictureType[]
    description: string[]
}

let HELP_PAGES: PageType[] = [
    {
        page: 'construction',
        title: 'Getting started with construction',
        pictures: ['ForesterHut', 'Woodcutter', 'Sawmill'],
        description: ["To build houses for your city, you need plancks and stones. Stones are collected by a quarry. A sawmill produces plancks from wood. To get started collecting plancks and stones, build a woodcutter hut, a quarry, and a sawmill", "Be careful to not run out of wood! Build a forester hut to get a forester to plant new trees."],
    },

    {
        page: 'lookingForResources',
        title: 'Looking for resources',
        pictures: ['pickaxe2.png', 'flag.png'],
        description: ["To create tools and weapons you need an industry, and to have an industry you need resources. Resources are things like minerals to mine, forest for getting wood, water for fishing, and grass planes for farming.", "You should start by using the resources available in your city but soon you'll need to expand your land to discover new resources. To do so, build military buildings close to the border to expand it. Military buildings are Barracks, Guard House, Watch Tower, and Fortress.", "Minerals are located in the mountains, but there are different types of minerals and not all mountains have minerals. To search for minerals, raise a flag close to a potential mineral-rich area, connect it with a road to your city, and call for a geologist."]
    },

    {
        page: 'mining',
        title: 'Mining',
        pictures: ['GoldMine'],
        description: ["When you have found minerals it's time to mine the mountain to get them. There are four types of minerals that can be mined: coal, iron, gold, and granite. Build the right type of mine where the mineral has been found to extract it. After a while, mines will exhaust the minerals where they are located.", "The miners working the mines need food to work so now it's time get started with food production! "]
    },

    {
        page: 'food',
        title: 'Producing food',
        pictures: ['HunterHut', 'Fishery', 'Well', 'Mill', 'Farm', 'Bakery', 'PigFarm', 'SlaughterHouse'],
        description: ["Food is needed to support the miners. There are three types of food: meat, bread, and fish.", "Meat can be produced in two ways. A hunter in a hunter hut can hunt for wild animals, and a pig farm can breed pigs that are then sent to the slaughter house to produce meat.", "You get fish by placing fisheries close to water. The fisherman in the fishery will go out and fish. After a while all the fish in the area close to the fishery will be gone.", "Bread is produced by a bakery. To make bread, the bakery needs water and flour. Water is produced by a well and flour is produced by a mill. For the mill to make flour it needs wheat which it gets from farms."]
    },

    {
        page: 'military',
        title: 'Recruting',
        pictures: ['Brewery', 'Armory'],
        description: ["To recruit new military you need equipment. The armory produces swords and shields but it needs coal and steel to do so. Coal comes from coal mines and steel comes from the Iron Smelter. The Iron Smelter needs iron and coal to melt the iron.", "Equipment is not enough - a recruit also needs to drink beer to become a military. Beer is produced by a brewery. The brewery needs water and wheat to brew beer. Water is produced by a well and wheat is produced by farms.", "To successfully recruit new military, a sword, a shield, and a beer need to be available in the same headquarter or storage."]
    },

    {
        page: 'ranksAndPromotion',
        title: 'Ranks and promotion',
        pictures: [],
        description: ["Militaries can have different ranks: private, private first class, sergeant, officer, general. All militaries start out as privates and can then be promoted to higher classes. A higher rank means that the military can survive more fights and cause more damage to opponents. Militaries in a building are promoted when a coin is delivered to the building.", "A mint produces coins and it needs coal and gold."]
    },

    {
        page: 'war',
        title: 'Going to war',
        pictures: ['Barracks', 'GuardHouse', 'WatchTower', 'Fortress'],
        description: ["To win the game only one player can remain. To vanquish the other players you will need to defeat them in war. First you need to find your opponents by expanding your land and assembling resources to prepare for the war. When you have found your opponent and have enough resources you are ready to attack.", "Attack an opponent's military building by selecting it, choosing attack, selecting the number of attackers, and select to start the attack. Militaries in buildings close to the attacked building can join in the attack. To be able to attack with more militaries you can upgrade your military buildings close to the opponent's building so they can host more militaries."]
    }
]

export { HELP_PAGES };
