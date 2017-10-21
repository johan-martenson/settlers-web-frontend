async function attackBuilding(house, numberOfAttackers, player, url) {
    let response = await fetch(url + "/houses/" + house.houseId,
                               {method: 'put',
                                body: JSON.stringify({
                                    attacked:
                                    {
                                        by: player,
                                        attackers: numberOfAttackers
                                    }
                                }
                                                    )
                               });
    return await response.json();
}

async function getGameInformation(url) {

    // tickLength: 273

    let response = await fetch(url + "/game");

    return await response.json();
}

async function setSpeed(tickLength, url) {

    console.info("Updating speed " + tickLength);

    let response = await fetch(url + "/game",
                               {
                                   method: 'put',
                                   body: JSON.stringify({
                                       tickLength: tickLength
                                   })
                               });

    return await response.json();
}

async function removeHouse(houseId, url) {

    console.info("Removing house " + houseId);

    let response = await fetch(url + "/houses/" + houseId, {method: 'delete'});
    return await response.json();
}

async function removeFlag(flagId, url) {

    console.info("Removing flag " + flagId);

    let response = await fetch(url + "/flags/" + flagId, {method: 'delete'});
    return await response.json();
}

async function createBuilding(houseType, point, player, url) {

    console.info("Creating house " + houseType + " at " + point);

    let response = await fetch(url + "/houses",
                               {method: 'POST',
                                body: JSON.stringify({type: houseType, x: point.x, y: point.y, playerId: player})
                               });
    return await response.json();
}

async function createRoad(points, player, url) {

    console.info("Creating road " + JSON.stringify(points));

    let response = await fetch(url + "/roads",
                               {method: 'POST',
                                body: JSON.stringify({points: points, playerId: player})});
    return await response.json();
}

async function createFlag(point, player, url) {

    console.info("Creating flag at " + point);

    let response = await fetch(url + "/flags",
                               {
                                   method: 'POST',
                                   body: JSON.stringify({x: point.x, y: point.y, playerId: player})
                               });
    return await response.json();
}

async function getViewForPlayer(url, player) {

    /*
      border: [{ color: '#333333', playerId: 2, points: [x: 2, y: 3, ...]}, ...]
      signs: [{type: 'gold', x: 3, y: 5, amount: 'small'}]
      animals: [{x: 4, y: 6}, ...]
      houses: [{x: 5, y: 3, type: foresterhut, playerId: 3, houseId: 19, state: "unfinished"}]
     */

    let response = await fetch(url + "/viewForPlayer?player=" + player);

    if (response.ok) {
        return await response.json();
    }

    throw new Error("Invalid request");
}

async function getPlayers(url) {

    console.info("Get players");

    let response = await fetch(url + "/players");
    return await response.json();
}

async function getHouseInformation(houseId, playerId, url) {
    // x:
    // y:
    // inventory: {'gold': 3}
    // type: 'headquarter'
    // maxAttackers: 23


    let response = await fetch(url + "/houses/" + houseId + "?playerId=" + playerId);
    return await response.json();
}

async function getInformationOnPoint(point, url, player) {
    // x, y
    // canBuild: ['small', 'medium', 'large', 'flag', 'mine', 'harbor']
    // isType: ('flag' | 'building' | 'stone' | 'tree')
    // (building: {type: ..., } |
    // possibleRoadConnections: [{x: 2, y:4}, ...]

    console.info("Get information on point");

    let response = await fetch(url + "/points?x=" + point.x+"&y=" + point.y + "&playerId=" + player);
    return await response.json();
}

async function callGeologist(point, player, url) {

    let response = await fetch(url + "/points?x=" + point.x+"&y=" + point.y + "&playerId=" + player,
                               {method: 'put',
                                body: JSON.stringify(
                                    {geologistNeeded: true}
                                )
                               });

    return await response.json();
}

async function getTerrain(url) {
    let response = await fetch(url + '/terrain');
    return await response.json();
}

async function sendScout(point, player, url) {
    let response = await fetch(url + "/points?x=" + point.x+"&y=" + point.y + "&playerId=" + player,
                               {method: 'put',
                                body: JSON.stringify(
                                    {scoutNeeded: true}
                                )
                               });

    return await response.json();
}

var SMALL_HOUSES = ["ForesterHut",
                    "Woodcutter",
                    "Well",
                    "Quarry",
                    "Barracks",
                    "GuardHouse",
                    "HunterHut",
                    "Fishery",
                    "GoldMine",
                    "IronMine",
                    "CoalMine",
                    "GraniteMine",
                  ];

var MEDIUM_HOUSES = ["Sawmill",
                     "WatchTower",
                     "Mill",
                     "Bakery",
                     "Mint",
                     "SlaughterHouse",
                     "Catapult",
                     "Mint"
                    ];

var LARGE_HOUSES = ["Headquarter",
                    "Farm",
                    "PigFarm",
                    "DonkeyFarm",
                    "Fortress"
                   ];

var materialToColor = {
    gold: 'yellow',
    iron: 'red',
    coal: 'black',
    stone: 'gray',
    water: 'blue'
};

export {
    getGameInformation,
    removeHouse,
    setSpeed,
    sendScout,
    callGeologist,
    getTerrain,
    getHouseInformation,
    getPlayers,
    getInformationOnPoint,
    getViewForPlayer,
    createBuilding,
    createFlag,
    createRoad,
    SMALL_HOUSES,
    MEDIUM_HOUSES,
    LARGE_HOUSES,
    removeFlag,
    materialToColor,
    attackBuilding
};
