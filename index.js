"use strict";

const requestserverReq = require("./requestserver.js");
const dbhelperReq = require("./dynamohelper.js");
// const dbhelperReq = require("./acebasehelper.js");
const islandDataReq = require("./islandData.js");

let createResponse = requestserverReq.createResponse;
let createDb = dbhelperReq.createDb;
let cleanDb = dbhelperReq.cleanDb;
let initiateIslands = islandDataReq.initiateIslands;

const args = process.argv.slice(2);
let local = args[0] && args[0].toLowerCase() === "local";

let debug = false;
let requestcounter = 0;

// Starting the express server

createDb(local);
initiateIslands();

if (local) {
  const port = 3001;
  let app = null;

  const express = require("express");
  const cors = require("cors");

  app = express();
  app.use(cors());
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  try {
    app.get("/*", (req, res) => {
      let sessionId = Number.parseInt(req.query.sessionId, 10);
      let counter = Number.parseInt(req.query.counter, 10);

      if (debug) {
        console.log(
          " index.js : Processing " +
            req.path +
            " for session " +
            sessionId +
            " renew = " +
            req.query.renew +
            " counter = " +
            counter
        );
      }

      createResponse(req.path, req.query, sessionId).then((responseBody) => {
        // if (debug) console.dir(responseBody);
        return res.json(responseBody);
      });

      // return res.json(createResponse(req.path, req.query, sessionId));
    });

    app.listen(port, () => {
      console.log(`index.js : Little island listening at port: ${port}`);
    });

    app.on("error", (e) => {
      console.log("index.js : app error " + e.code);
    });

    process.on("error", (e) => {
      console.log("index.js : process error " + e.code);
    });
  } catch (error) {
    console.error("index.js : problem " + error);
  }
} else {
  console.log("index.js : Little island function listening on Lambda");
}

// Handler for the Lambda

exports.handler = async (event) => {
  let sessionId = "";
  let responseCode = 200;
  requestcounter += 1;

  console.log("request " + requestcounter + " : " + JSON.stringify(event));

  if (event.queryStringParameters && event.queryStringParameters.sessionId) {
    console.log(
      "index.js : Received sessionId: " + event.queryStringParameters.sessionId
    );
    sessionId = event.queryStringParameters.sessionId;
  }

  createResponse(event.path, event.queryStringParameters, sessionId).then(
    (responseBody) => {
      let response = {
        statusCode: responseCode,
        headers: {
          "x-custom-header": "little island",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(responseBody),
      };
      console.log("response: " + JSON.stringify(response));
      return response;
    }
  );
};
