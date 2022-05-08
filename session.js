const islandReq = require("./island.js");

let Island = islandReq.Island;
let debug = false;

class Session {
  constructor(island) {
    // console.log(x + " " + y);
    this.id = Math.floor(Math.random() * 99999999999);
    this.tiles = 5;
    this.fishes = 5;
    this.moveLog = [];
    this.island = island;
    this.moveCounter = 0;
    this.turn = 0;
    this.points = 0;

    console.log("New session with id " + this.id);

  }

  reset() {

    console.log("Session reset with id " + this.id);

    this.tiles = 5;
    this.fishes = 5;
    this.turn = 0;
    this.moveCounter = 0;
    this.points = 0;
  }

  getTurn() {
    return this.turn++;
  }

  getTurnNoUpd() {
    return this.turn;
 }

  getIsland() {
    return this.island;
  }

  setIsland(island) {
    this.island = island;
  }

  getId() {
    return this.id;
  }

  getTiles() {
    return this.tiles;
  }

  addTile() {
    this.tiles += 1;
  }

  addFish() {
    this.fishes += 1;
  }

  decreaseTiles() {
    this.tiles -= this.tiles > 0 ? 1 : 0;
  }

  decreaseFishes() {
    this.fishes -= this.fishes > 0 ? 1 : 0;
  }

  getFishes() {
     return this.fishes;
  }

  isAlive() {
    return true;
  }

  addPoints(points) {
    this.points += points;
  }

  getPoints() {
    return this.points;
  }

  resetPoints() {
    this.points = 0;
  }

  // Add a move log record
  // move objects are made of :
  // -- move type 1
  // ---- movement 1
  // ---- movement 2
  // -- move type 2
  // -- move type 1
  // ---- movement 1
  // If it is a move, it then checks if there is already a move 1 for
  // that penguin, and if so, append the movement

  addMoveLog(turn, id, num, moveType, moveDir, origH, origL, newH, newL, cat, state) {

    this.addPoints(10);

    let moveTypes = ["init","move","grow","eat","love","die"];
    let moveid = this.moveCounter++;
    if (debug) {
      console.log(turn + " " + moveid + " : Penguin " + id + " " + moveTypes[moveType] + " (" + moveType + ":" + moveDir +") " + origH + "/" + origL + " -> " + newH + "/" + newL + " points:" + this.getPoints());
    }
    if (moveType !== 1) {
     this.moveLog.push({
        moveid : moveid,
        id : id,
        num : num,
        moveType : moveType, // 1 = move
        movements : [],
        cat : cat,
        state : state
      });
    } else {
      let amove = this.moveLog.find(move => { return (move.id === id && move.moveType === 1)} );
      if (amove) {
       let newMove = {movmtid : moveid, moveDir : moveDir, origH : origH, origL : origL, newH : newH, newL : newL };
        amove.movements.push(newMove);
      } else {

       this.moveLog.push({
          moveid : moveid,
          id : id,
          num : num,
          moveType : moveType, // 1 = move
          movements : [{movmtid : moveid, moveDir : moveDir, origH : origH, origL : origL, newH : newH, newL : newL }],
          cat : cat,
          state : state
        });
      }
    }
  }
  
  // Reinitiate the move log and ask the island to fill it with penguins
  // initial states
  
  getInitMoveLog() {
    
    this.moveLog = [];
    this.island.resetPenguins(this);
    let lastMoves = [...this.moveLog];
    this.moveLog = [];
    return lastMoves;
  }

  // returns the last version of the move log and reset the move log

  getMoveLog () {

    let lastMoves = [...this.moveLog];
    this.moveLog = [];
    return lastMoves;
  }

  getPenguinsStates() {
    
    console.log("---> getPeguinsStates");
    
    let lastMoves = [...this.moveLog];
    let states = [];
    this.moveLog = [];
    lastMoves.forEach(aMove => {
      states.filter(aState =>aState.id !== aMove.id);
      states.push(aMove);
    });
  }

  getLover(gender, hpos, lpos) {

    let lover = this.island.penguins.find(penguin => {
      return penguin.hpos === hpos && penguin.lpos === lpos && penguin.gender !== gender && penguin.alive
    });
   return lover;
 }


}

// now we export the class, so other modules can create Penguin objects
module.exports = {
    Session : Session
}
