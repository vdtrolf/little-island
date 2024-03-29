// DB stuff
// const dbhelperReq = require("./dynamohelper.js"); 
const dbhelperReq = require("./acebasehelper.js");

// logger stuff
const loggerReq = require("./logger.js");
let log = loggerReq.log;
const LOGVERB = loggerReq.LOGVERB;
const LOGINFO = loggerReq.LOGINFO;
const LOGERR = loggerReq.LOGERR;
const LOGDATA = loggerReq.LOGDATA;

const realm = "data";
const source = "islandData.js";

const penguinReq = require("./penguin.js");
const landReq = require("./land.js");
const islandReq = require("./island.js");

let Island = islandReq.Island;
let Penguin = penguinReq.Penguin;
let Land = landReq.Land;

let putItem = dbhelperReq.putItem;
let deleteItem = dbhelperReq.deleteItem;
let getAsyncItems = dbhelperReq.getAsyncItems;
let cleanIslands = islandReq.cleanIslands;
let addIsland = islandReq.addIsland;

const maxAge = 3600000; // one hour

const persistIsland = (island) => {
  island.counter += 1;

  log(
    realm,
    source,
    "persistIsland",
    "persisting island " + island.id + " counter: " + island.counter
  );

  let lands = [];

  for (let i = 0; i < island.sizeH; i++) {
    for (let j = 0; j < island.sizeL; j++) {
      let land = island.territory[i][j];

      const aLand={id: land.id,
        islandId: land.islandId,
        hpos: land.hpos,
        lpos: land.lpos,
        type: land.type,
        conf: land.conf,
        var: land.var,
        hasCross: land.hasCross,
        crossAge: land.crossAge,
        hasFish: land.hasFish,
        hasSwim: land.hasSwim,
        swimAge: land.swimAge,
        hasIce: land.hasIce,
        iceAge: land.iceAge
      };
      
      lands.push(aLand);
    }
  }
  
  let penguins = [];
  
  island.penguins.forEach((penguin) => {
    
    const aPenguin = {
      id: penguin.id,
      islandId: penguin.islandId,
      // moveLog: penguin.moveLog,
      num: penguin.num,
      hpos: penguin.hpos,
      lpos: penguin.lpos,
      age: penguin.age,
      fat: penguin.fat,
      maxcnt: penguin.maxcnt,
      vision: penguin.vision,
      wealth: penguin.wealth,
      hungry: penguin.hungry,
      alive: penguin.alive,
      gender: penguin.gender,
      cat: penguin.cat,
      name: penguin.name,
      loving: penguin.loving,
      waiting: penguin.waiting,
      fishTime: penguin.fishTime,
      fishDirection: penguin.fishDirection,
      eating: penguin.eating,
      moving: penguin.moving,
      diging: penguin.diging,
      digTime: penguin.digTime,
      digDirection: penguin.digDirection,
      filling: penguin.filling,
      fillTime: penguin.fillTime,
      fillDirection: penguin.fillDirection,
      hasLoved: penguin.hasLoved,
      fatherId: penguin.fatherId,
      motherId: penguin.motherId,
      partnerId: penguin.partnerId,
      moveDirection: penguin.moveDirection,
      strategyShort: penguin.strategyShort,
      knownWorld: penguin.knownWorld,
      hasIce: penguin.hasIce,
      building: penguin.building,
      buildingDirection: penguin.buildingDirection,
      targetHPos: penguin.targetHPos,
      targetLPos: penguin.targetLPos,
      targetAction: penguin.targetAction,
      knownWorld: penguin.knownWorld,
      targetDirections: penguin.targetDirections,
      path: penguin.path
    };
    penguins.push(aPenguin);
  });
  
  putItem("island", {
    id: island.id,
    name: island.name,
    sizeH: island.sizeH,
    sizeL: island.sizeL,
    weather: island.weather,
    weatherCount: island.weatherCount,
    numPeng: island.numPeng,
    tiles: island.tiles,
    landSize: island.landSize,
    fishes: island.fishes,
    points: island.points,
    running: island.running,
    runonce: island.runonce,
    lastInvocation: island.lastInvocation,
    followId: island.followId ? island.followId : 0,
    lands: lands,
    penguins: penguins,
    counter: island.counter,
  }, island.id);
  
  //console.dir(penguins);
  
};

const persistIslandData = async (island) => {
  island.counter += 1;

  log(
    realm,
    source,
    "persistIslandData",
    "persisting island " +
      island.id +
      " followId " +
      island.followId +
      " counter: " +
      island.counter
  );

  await putItem("island", {
    id: island.id,
    name: island.name,
    sizeH: island.sizeH,
    sizeL: island.sizeL,
    weather: island.weather,
    weatherCount: island.weatherCount,
    numPeng: island.numPeng,
    tiles: island.tiles,
    landSize: island.landSize,
    fishes: island.fishes,
    points: island.points,
    running: island.running,
    runonce: island.runonce,
    lastInvocation: island.lastInvocation,
    followId: island.followId ? island.followId : 0,
    lands: island.lands,
    penguins: island.penguins,
    counter: island.counter,
  },island.id);
};

const initiateIslands = async (islandParam=null) => {
  let running = false;

  log(realm, source, "initiateIslands", "getting islands out of DB");

  let theIslands = islandParam?[islandParam]:await getAsyncItems("island", "id", ">", 0);

  if (theIslands && theIslands.length > 0) {
    cleanIslands();

    log(
      realm,
      source,
      "initiatieIslands",
      "found " + theIslands.length + " islands"
    );
    log(realm, source, "initiateIslands", theIslands, LOGVERB, LOGDATA);

    let currentTime = new Date().getTime();

    try {
      theIslands.forEach((anIsland) => {
        
        let age = currentTime - Number.parseInt(anIsland.lastInvocation);

        if (anIsland.lastInvocation > 0 && (age < maxAge || anIsland.running)) {
          running = true;

          let island = new Island(
            anIsland.sizeH,
            anIsland.sizeL,
            anIsland.id,
            anIsland.name,
            anIsland.weather,
            anIsland.weatherCount,
            anIsland.numPeng,
            anIsland.tiles,
            anIsland.landSize,
            anIsland.fishes,
            anIsland.points,
            anIsland.running,
            anIsland.runonce,
            anIsland.lastInvocation,
            anIsland.followId,
            anIsland.counter
          );

          for (let i = 0; i < island.sizeH; i++) {
            let line = [];
            for (let j = 0; j < island.sizeL; j++) {
              line.push([]);
            }
            island.territory.push(line);
          }

          if (anIsland.lands) {
            anIsland.lands.forEach((aLand) => {
              let land = new Land(
                aLand.hpos,
                aLand.lpos,
                island.id,
                aLand.id,
                aLand.type,
                aLand.conf,
                aLand.var,
                aLand.hasCross,
                aLand.crossAge,
                aLand.hasFish,
                aLand.hasSwim,
                aLand.swimAge,
                aLand.hasIce,
                aLand.iceAge
              );
              island.territory[aLand.hpos][aLand.lpos] = land;
            });
          }

          let penguins = [];

          if (anIsland.penguins) {
            anIsland.penguins.forEach((aPenguin) => {
              let penguin = new Penguin(
                aPenguin.num,
                aPenguin.hpos,
                aPenguin.lpos,
                island.id,
                // aPenguin.moveLog,
                aPenguin.fatherId,
                aPenguin.motherId,
                aPenguin.id,
                aPenguin.age,
                aPenguin.fat,
                aPenguin.maxcnt,
                aPenguin.vision,
                aPenguin.wealth,
                aPenguin.hungry,
                aPenguin.alive,
                aPenguin.gender,
                aPenguin.cat,
                aPenguin.name,
                aPenguin.loving,
                aPenguin.waiting,
                aPenguin.fishTime,
                aPenguin.fishDirection,
                aPenguin.eating,
                aPenguin.moving,
                aPenguin.diging,
                aPenguin.digTime,
                aPenguin.digDirection,
                aPenguin.filling,
                aPenguin.fillTime,
                aPenguin.fillDirection,
                aPenguin.hasLoved,
                aPenguin.partnerId,
                aPenguin.moveDirection,
                aPenguin.strategyShort,
                aPenguin.hasIce,
                aPenguin.building,
                aPenguin.buildingDirection,
                aPenguin.targetHPos,
                aPenguin.targetLPos,
                aPenguin.targetAction,
                aPenguin.knownWorld,
                aPenguin.targetDirections,
                aPenguin.path
              );
              penguins.push(penguin);
              
            });
          }
          island.penguins = penguins;

          addIsland(island);

          log(
            realm,
            source,
            "initiateIslands",
            "Loaded island " +
              anIsland.name +
              "-" +
              anIsland.id +
              " age " +
              age +
              " runnning " +
              anIsland.running
          );
        } else {
          log(
            realm,
            source,
            "initiateIslands",
            "Could not load island " +
              anIsland.id +
              " age " +
              age +
              " runnning " +
              anIsland.running
          );

          deleteItem("island", anIsland.id);
        }
      });
    } catch (error) {
      log(realm, source, "initiateIslands", error, LOGERR);
    }
  }

  return running;
};

// now we export the class, so other modules can create Penguin objects
module.exports = {
  persistIsland: persistIsland,
  persistIslandData: persistIslandData,
  initiateIslands: initiateIslands,
};
