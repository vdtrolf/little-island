const penguinReq = require("./penguin.js");
const islandReq = require("./island.js");
const landReq = require("./land.js");
const sessionReq = require("./session.js");
const nameserverReq = require("./nameserver.js");

let Penguin = penguinReq.Penguin;
let Island = islandReq.Island;
let Land = landReq.Land;
let Session = sessionReq.Session;
let NameServer = nameserverReq.NameServer;



const port = 3001;
const intervalTime = 864; // 864; // 648;  // 1728; //864
let islands = [];
let sessions = [];
const baseTime = new Date().getTime();

const args = process.argv.slice(2);

// console.log(process.env);

args.forEach((arg) => {
  console.log(arg);
});

let islandL = Number.parseInt(args[0], 10);
if (!islandL) islandL = 12;
let islandH = islandL;

let mode = Number.parseInt(args[1], 10);
if (!mode) mode = 1;

let debug = Number.parseInt(args[2], 10);

debug = false;
procesdebug = false;

let nameserver = new NameServer(30,10,false);




const createInitData = (session, island, moves) => {

  let theMoves = moves ? moves : [];

  return {session : session.getId(),
          island : island.getImg(mode,islandH,islandL),
          penguins : island.getPenguins(),
          weather : island.getWeather(),
          artifacts: island.getArtifacts(),
          tiles: island.getTiles(),
          fishes: island.getFishes(),
          points: island.getPoints(),
          islandName: island.getName(),
          islandId: island.getId(),
          islandSize : island.getLandSize(),
          moves : theMoves};
}

const createIslandData = (session, island) => {

  return {session : session.getId(),
          island : island.getImg(mode,islandH,islandL),
          penguins : island.getPenguins(),
          weather : island.getWeather(),
          artifacts: island.getArtifacts(),
          tiles: island.getTiles(),
          fishes: island.getFishes(),
          islandName: island.getName(),
          islandId: island.getId(),
          islandSize : island.getLandSize()};
}

// the parameter followId indicates that penguin must be followed in the console

const createMovesData = (session, island, moves, followId) => {

  let theMoves = moves ? moves : [];

  island.setFollowId(followId);

  return {session : session.getId(),
          points: island.getPoints(),
          islandSize : island.getLandSize(),
          moves : theMoves};
}

const createResponse = (url,params,session,island) => {

  switch(url) {

    case "/island" : {
      if (! session) {

        session = new Session();
        island = new Island(islandH,islandL, session, debug);
        islands.push(island);

        if (debug ) {
          timeTag = new Date().getTime() - baseTime;
          console.log(timeTag + "index.js - createResponse/island : Building an island of size " + islandH + " * " + islandL);
        }
        sessions.push(session);

      }

      return createInitData(session, island, session.getInitMoveLog(island));
    }

    case "/new-island" : {
      if (session) {


        if (island) {
          island.unregisterSession(session);
        }

        island = new Island(islandH,islandL,session,debug);
        islands.push(island);
        session.reset();

        if (debug ) {
          timeTag = new Date().getTime() - baseTime;
          console.log(timeTag + "index.js - createResponse/new-island : Renewing an island of size " + islandH + " * " + islandL);
        }

        return createInitData(session, island, session.getInitMoveLog(island));

      } else {
        if (debug) {
          console.log("index.js - createResponse : No island found");
        }
      }
    }

    case "/connect-island" : {
      if (session) {
        // island = new Island(islandH,islandL);

        if (island) {
          island.unregisterSession(session);
        }

        let islandId  = Number.parseInt(params.islandId,10);
        island = islands.find(island => island.getId() === islandId);
        session.reset();
        island.registerSession(session);

        if (debug ) {
          timeTag = new Date().getTime() - baseTime;
          console.log(timeTag + "index.js - createResponse/connect-island : Connecting to island  " + island.getName());
        }

        return createInitData(session, island,session.getInitMoveLog(island));

      } else {
        console.log("index.js - createResponse :No island found");
      }
    }

    case "/penguins" : {
      if (session && island) {
        return createData(false);
      }
    }

    // return the moves - is the renew parameter is on 1, then returns an initial move log
    // the parameter renew indicates the movement log must reinitiated withe 'placeament' moves (moveDir =0)
    // the parameter followId indicates that penguin must be followed in the console

    case "/moves" : {
      if (session && island) {
        let renew = Number.parseInt(params.renew,10);
        let followId = Number.parseInt(params.followId,10);

        let moves = renew === 0? session.getMoveLog(): session.getInitMoveLog(island);

        return createMovesData(session, island, moves, followId);

      }
    }

    case "/islandmoves" : {
      if (session && island) {
        let renew = Number.parseInt(params.renew,10);
        return createIslandData(session, island);
      }
    }


    case "/islands" : {
      if (session) {
        return {islands : islands, session : session.getId()};
      } else {
        return {islands : islands};
      }
    }

    case "/setTile" : {
      if (session && island) {
        let hpos = Number.parseInt(params.hpos,10);
        let lpos = Number.parseInt(params.lpos,10);

        if (island.setTile(lpos,hpos,session)) {
          return createIslandData(session, island, false);
        } else {
          return {result : "false"};
        }
      }
    }

    default : {
      return {};
    }

  }
};

// Starting the express server

let app = null;

const express = require('express');
const cors = require('cors');

app = express();
app.use(cors())
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

try {
  app.get('/*', (req, res) => {

    let sessionId = Number.parseInt(req.query.sessionId,10);

    let session = null;
    let island = null;
    let sId = 0;
    let iId = 0;

    if (sessionId > 0) {
      session = sessions.find(session => session.getId() === sessionId);
      if (session != null) {
        sId = session.getId();
        island = islands.find(island => island.hasSession(session.getId()));
        if (island != null) {iId = island.getId()};
      }
    }

    if (procesdebug ) {
      timeTag = new Date().getTime() - baseTime;
      console.log(timeTag + " index.js : Processing " + req.path + " for session " + sId + " and island " + iId + ", renew = "+ req.query.renew)
    };

    return res.json(createResponse(req.path,req.query, session, island));
  });

  app.listen(port, () => {
    console.log(`index.js : Little island listening at port: ${port}`);
  });

  app.on('error', (e) => {
    console.log("index.js : app error " + e.code);
  });

  process.on('error', (e) => {
    console.log("index.js : process error " + e.code);
  });

} catch(error) {
   console.error("index.js : problem " + error);
}


// for debug purpose - we start one island and follow one penguin

//session = new Session();
//island = new Island(islandH,islandL,session,debug);
//islands.push(island);

// Main interval loop - for each session triggers the penguin events

setInterval(() => {
  islands.forEach(island => {
    if (island.running) {
      island.calculateNeighbours();
      island.movePenguins();
    }
  });
}, intervalTime);

setInterval(() => {
  islands.forEach(island => {
    if (island.running) {
      island.addSwims();
      island.makePenguinsOlder();
      island.smelt();
      island.setWeather();
    }
  });
}, intervalTime * 2);