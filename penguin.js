// logger stuff
const loggerReq = require("./logger.js");
let log = loggerReq.log;
const LOGINFO = loggerReq.LOGINFO;
const LOGVERB = loggerReq.LOGVERB;

const realm = "penguin";
const source = "penguin.js";

// imports
const nameserverReq = require("./nameserver.js");
const strategicMapReq = require("./strategicmap.js");

let StrategicMap = strategicMapReq.StrategicMap;

const moveTypes = [
  "init",
  "move",
  "grow",
  "eat",
  "love",
  "die",
  "still",
  "fish",
  "dig",
  "fill"
];

const debug = false;

// Class and constructor

class Penguin {
  constructor(
    num,
    h,
    l,
    islandId,
    fatherId = 0,
    motherId = 0,
    id = 0,
    age = 0,
    fat = 0,
    maxcnt = 5,
    vision = 2,
    wealth = 100,
    hungry = 0,
    alive = true,
    gender = "male",
    cat = "-y-",
    name = "titi",
    loving = 0,
    waiting = 0,
    fishTime = 0,
    fishDirection = 0,
    eating = 0,
    moving = 0,
    diging = 0,
    digTime = 0,
    digDirection = 0,
    filling = 0,
    fillTime = 0,
    fillDirection = 0,
    hasLoved = 0,
    partnerId = 0,
    moveDirection = 0,
    strategyShort = "",
    hasIce = false,
    building = false,
    buildingDirection = 0,
    targetHPos = 0,
    targetLPos = 0,
    targetAction = 0,
    knownWorld = {},
    targetDirections = [],
    path = []
  ) {
    this.id = id === 0 ? Math.floor(Math.random() * 999999) : id;
    this.islandId = islandId;
    // this.moveLog = moveLog;
    this.num = num;
    this.hpos = h;
    this.lpos = l;
    this.age = age === 0 ? Math.floor(Math.random() * 5) + 1 : age;
    this.fat = fat === 0 ? Math.floor(Math.random() * 4) + 1 : fat;

    // maxcnt = the maximum length of a traject
    this.maxcnt = maxcnt;
    // vision = how far the penguin can see
    this.vision = vision;

    this.wealth = wealth;
    this.hungry = hungry;
    this.alive = alive;
    this.gender = gender;
    this.cat = cat;
    this.name = name.length < 1 ? "titi" : name;

    this.loving = loving;
    this.waiting = waiting;
    this.fishTime = fishTime;
    this.fishDirection = fishDirection;
    this.eating = eating;
    this.moving = moving;
    
    this.diging = diging;
    this.digTime = digTime;
    this.digDirection = digDirection;
    
    this.filling = filling;
    this.fillTime = fillTime;
    this.fillDirection = fillDirection;

    this.hasLoved = hasLoved;
    this.fatherId = fatherId;
    this.motherId = motherId;
    this.partnerId = partnerId;
    this.moveDirection = moveDirection;

    this.strategicMap = null;
    this.strategyShort = strategyShort;
    this.knownWorld=knownWorld;
    this.targetHPos = targetHPos;
    this.targetLPos = targetLPos;
    this.targetAction = targetAction;
    this.targetDirections = targetDirections;
    this.path = path;

    this.hasIce = hasIce;
    this.building = building;
    this.buildingDirection = buildingDirection;
    

    if (this.name === "titi") {
      let aPenguinName =
        this.name === "titi" ? nameserverReq.getPenguinName() : this.name;
      this.name = aPenguinName.name;
      this.gender = aPenguinName.gender;
    }

    log(
      realm,
      source,
      "constructor",
      "new penguin " + this.id + " at " + this.hpos + "/" + this.lpos
    );
  }

  // returns teh category of the penguin - y,m,f,o (old man), e (eldery woman)

  setName(name) {
    this.name = name;
  }

  // Calculates the strategic map for the penguin

  getStrategicMap(island, islandSize,islandPopulation, alivePenguins) {
    if (this.strategicMap === null) {
      this.strategicMap = new StrategicMap(island.sizeH, island.sizeL);
    }
    
    
    let target = this.strategicMap.look(
      island,
      this.hpos,
      this.lpos,
      this,
      (!this.loving && this.age > 5 && this.age < 22),
      this.maxcnt,
      islandSize,
      islandPopulation,
      alivePenguins,
      this.id === island.followId && this.alive,
    );

    this.strategyShort = target.strategyShort;
    this.targetHPos = target.targetH;
    this.targetLPos = target.targetL;
    this.targetAction = target.action;
    this.targetDirections = target.directions;
    this.path = target.path;
    this.knownWorld = this.strategicMap.getKnownWorld();
    
    //console.log("%%%%%%==================");
    //console.dir(this.knownWorld);
    //console.log("%%%%%%==================");
    
    return target;
    
  }

  // Wealth will decrease if the penguin is not surrended by other penguins - unless the sun is shinning
  // If the penguin is fat it will go slower than is h3e is meaget

  calculateWealth(island) {
    if (this.strategicMap) {
      let weatherFactor = island.weather === 0 ? 1 : 0;
      let warmth = this.strategicMap.calculateWarm(
        island,
        this.hpos,
        this.lpos,
        this.id
      );
      this.wealth += warmth * weatherFactor * 0.25;
      if (this.wealth > 99) this.wealth = 100;
      if (this.wealth < 1) this.wealth = 0;
    }
  }

  hasTarget() {
    if (this.strategicMap) {
      return this.strategicMap.hasTarget;
    }
    return false;
  }

  wantsSearch() {
    if (this.strategicMap) {
      return this.strategicMap.wantsSearch;
    }
    return false;
  }

  getDirections() {
    if (this.strategicMap) {
      return this.strategicMap.targetDirections;
    }
    return [0, 0, 0, 0];
  }

  getStrategy() {
    if (this.strategicMap) {
      return this.strategicMap.strategyShort;
    }
    return "";
  }

  // Check if love is possible (not recently in love and age < 20)

  canLove(partnerId,gender="") {

    if (gender === this.gender) {
      log(
        realm,
        source,
        "canLove",
        `${this.id}-${this.name} love not possible with ${this.partnerId} - same gender`
      );
      return false;
    }
    
    if (this.hasLoved > 0) {
      log(
        realm,
        source,
        "canLove",
        `${this.id}-${this.name} love not possible since hasLoved =  ${this.hasLoved}`
      );
      return false;
    }

    if (partnerId === this.fatherId) {
      log(
        realm,
        source,
        "canLove",
        `${this.id}-${this.name} love not possible with father ${this.fatherId}`
      );
      return false;
    }
    if (partnerId === this.motherId) {
      log(
        realm,
        source,
        "canLove",
        `${this.id}-${this.name} love not possible with mother ${this.motherId}`
      );
      return false;
    }
    if (this.age < 6 || this.age > 21) {
      log(
        realm,
        source,
        "canLove",
        `${this.id}-${this.name} too yong or old for all this (i am ${this.age})`
      );
      return false;
    }

    return this.eating === 0 && this.fishTime === 0 && this.fillTime === 0;
  }

  // let moveType = moves[i].moveType, // 1=move,2=age,3=eat,4=love,5=die
  // let moveDir = moves[i].moveDir, // 1=left,2=right,3=up,4=down

  setPos(moveDir, hpos, lpos) {
    // if (this.hpos !== hpos || this.lpos !== lpos) {
    //   this.addMoveLog(
    //     1,
    //     this.cat,
    //     "move",
    //     moveDir,
    //     this.hpos,
    //     this.lpos,
    //     hpos,
    //     lpos
    //   );
    // }
    this.hpos = hpos;
    this.lpos = lpos;
    this.waiting = 0;
  }
  
  // tells te peguin to make love with a partner

  love(partnerId) {

    console.log("#### # " + partnerId)

    this.loving = 4;
    this.hasLoved = 20;
    this.partnerId = partnerId;
    this.waiting = 0;
    // this.addMoveLog(4, this.cat, "love");

  }

  // return true is the penguin is makning love

  isLoving() {
    return this.loving > 0;
  }

  // tell the penhuin to eat

  eat() {
    this.eating = 5;
    this.waiting = 0;
    this.hungry = this.hungry < 25 ? 0 : this.hungry - 25;
    this.wealth = this.wealth > 80 ? 100 : this.wealth + 20;
    // this.addMoveLog(3, this.cat, "eat");
  }

  // return true is the penguin is eating a lot

  isEating() {
    return this.eating > 0;
  }

  // makes the penguin fish

  fish(direction) {
    // this.addMoveLog(7, this.cat, "fish", direction);
    this.fishDirection = direction;
    this.fishTime = 6;
  }

  // return true is the penguin is eating

  isFishing() {
    return this.fishTime > 0;
  }

  // makes the penguin dig

  dig(direction) {
    // this.addMoveLog(8, this.cat, "dig", direction);
    this.digDirection = direction;
    this.digTime = 6;
  }

  // return true is the penguin is eating

  isDiging() {
    return this.digTime > 0;
  }

// makes the penguin dig

  fill(direction) {
    // this.addMoveLog(9, this.cat, "fill", direction);
    this.fillDirection = direction;
    this.fillTime = 3;
  }

  // return true is the penguin is eating

  isFilling() {
    return this.fillTime > 0;
  }

  // makes the penguin more hungry

  wait() {
    this.hungry += Math.floor((this.fat - 1) / 2) + 1;
    this.moveDirection = 0;
  }

  // return true is the penguin is eating

  isWaiting() {
    return this.waiting > 0;
  }

  // Penguins die - all counters are reset

  letDie() {
    this.alive = false;
    this.eating = 0;
    this.fishTime = 0;
    this.loving = 0;
    this.hasLoved = 0;
    this.hungry = 0;

    // this.addMoveLog(5, "", "dead");
  }

  // Makes the penguin one year older and check status
  // Return 1 if dead and 2 if end of loving periond (in which case a baby will born)
  // Otherwise returns 0
  // If the penguin becomes adult (above 4) it's vision passes from 2 to 3
  // If the penguin gets old (above 20), it's max planfiable traject passes from 5 to 7

  makeOlder() {
    
    let hasChild = false;
    let returncode = 0;
    let fillHPos = 0;
    let fillLPos = 0;

    if (this.eating > 0) {
      this.eating -= 1;
    }

    if (this.fishTime > 0) {
      this.fishTime -= 1;
      if (this.fishTime === 0) {
        this.fishDirection = 0;
        this.eat();
      }
    }

    if (this.digTime > 0) {
      this.digTime -= 1;
      if (this.digTime === 0) {
        this.digDirection = 0;
        this.hasIce=true;
      }
    }

    if (this.fillTime > 0) {
      this.fillTime -= 1;
      if (this.fillTime === 0) {
        returncode = 3;
        fillLPos = this.fillDirection === 1? this.lpos - 1: this.lpos;
        fillLPos = this.fillDirection === 2? this.lpos + 1: this.lpos;
        fillHPos = this.fillDirection === 3? this.hpos - 1: this.hpos;
        fillHPos = this.fillDirection === 4? this.hpos + 1: this.hpos;
        this.fillDirection = 0;
      }
    }

    if (this.hasLoved > 0) {
      this.hasLoved -= 1;
    }

    if (this.loving > 0) {
      this.loving -= 1;
      if (this.loving === 0) {
        hasChild = true;
      }
    }

    this.hungry += Math.floor(this.fat / 3) + 1;

    this.age += this.alive ? 0.25 : 0;
    
    if (this.age > 5 && this.cat === "-y-") {
      this.cat = this.gender === "male" ? "-m-" : "-f-";
      this.vision = 3;
      // this.addMoveLog(2, this.cat, "age");
    }

    if (this.age > 20) {
      this.maxcnt = 7;
    }

    if (this.age > 30 || this.hungry > 99 || this.wealth < 1) {
      if (this.alive) {
        log(realm, source, "makeOlder", this.name + " just died !");
      }
      this.alive = false;
      // this.addMoveLog(5, "", "dead");
      returncode = 1;
    } else if (hasChild) {
      returncode = 2;
    }

    return { returncode: returncode, fillHPos: fillHPos, fillLPos: fillLPos};
  }

  setGender(gender) {
    this.gender = gender;
  }

}

// now we export the class, so other modules can create Penguin objects
module.exports = {
  Penguin: Penguin,
};
