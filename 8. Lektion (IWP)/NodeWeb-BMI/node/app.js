const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const hostname = "127.0.0.1";
const port = 3000;

//const serverName="http://localhost:3000";

/* *****************************************************************
  DISCLAIMER: This code is developed to support education and demo 
  purposes and certain simplifications have been made to keep the code
  comphrensible.
  ****************************************************************** */

/* ******************************************************************  
  First a number of helper functions to serve basic files and documents 
 ****************************************************************** */

//https://blog.todotnet.com/2018/11/simple-static-file-webserver-in-node-js/
//https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http

const publicResources = "/PublicResources/";
//secture file system access as described on
//https://nodejs.org/en/knowledge/file-system/security/introduction/
const rootFileSystem = process.cwd();
function securePath(userPath) {
  if (userPath.indexOf("\0") !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;
  }
  userPath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, "");
  userPath = publicResources + userPath;

  let p = path.join(rootFileSystem, path.normalize(userPath));
  //console.log("The path is:"+p);
  return p;
}

/* generate and send a response with htmlString as body */
function htmlResponse(res, htmlString) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.write(HTMLHdr + htmlString + HTMLEnd);
  res.end("\n");
}

/* send a response with a given HTTP error code, and reason string */
function errorResponse(res, code, reason) {
  res.statusCode = code;
  res.setHeader("Content-Type", "text/txt");
  res.write(reason);
  res.end("\n");
}
/* send 'obj' object as JSON as response */
function jsonResponse(res, obj) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.write(JSON.stringify(obj));
  res.end("\n");
}

/* send contents as file as response */
function fileResponse(res, filename) {
  const sPath = securePath(filename);
  console.log("Reading:" + sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      errorResponse(res, 404, String(err));
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", guessMimeType(filename));
      res.write(data);
      res.end("\n");
    }
  });
}

//A helper function that converts filename suffix to the corresponding HTTP content type
//better alternative: use require('mmmagic') library
function guessMimeType(fileName) {
  const fileExtension = fileName.split(".").pop().toLowerCase();
  console.log(fileExtension);
  const ext2Mime = {
    //Aught to check with IANA spec
    txt: "text/txt",
    html: "text/html",
    ico: "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
    js: "text/javascript",
    json: "application/json",
    css: "text/css",
    png: "image/png",
    jpg: "image/jpeg",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/msword",
  };
  //incomplete
  return ext2Mime[fileExtension] || "text/plain";
}

/* As the body of a POST may be long the HTTP modules streams chunks of data
   that must first be collected and appended before the data can be operated on. 
   This function collects the body and returns a promise for the body data
*/

function collectPostBody(req) {
  //the "executor" function
  function collectPostBodyExecutor(resolve, reject) {
    let bodyData = [];
    req
      .on("data", (chunk) => {
        bodyData.push(chunk);
      })
      .on("end", () => {
        bodyData = Buffer.concat(bodyData).toString();
        console.log(bodyData);
        resolve(bodyData);
      });
    //Exceptions raised will reject the promise
  }
  return new Promise(collectPostBodyExecutor);
}

//interprets req body as JSON data and returns the parsed JS object
/*
async function extractJSON(req){
  let body=await collectPostBody(req);
  let bodyJSON=JSON.parse(body);
  console.log(bodyJSON);
  return bodyJSON
}
*/

function extractJSON(req) {
  return collectPostBody(req).then((body) => JSON.parse(body));
  //  let bodyJSON=JSON.parse(body);
  //  console.log(bodyJSON);
  //  return bodyJSON
}

/* ***************************************************
 * Application code for the BMI tracker application
 ***************************************************** */

//constants for validating input from the network client
const maxHeight = 300;
const minHeight = 1;
const maxWeight = 300;
const minWeight = 1;
const minNameLength = 1;
const maxNameLength = 30;

//function that validates the constraints of the BMIData object
//bmiData must contain valid name,height,weight attributes
function validateBMIData(bmiData) {
  console.log("Validating");
  console.log(bmiData);

  let nameLen = bmiData.name.length;
  let weight = parseInt(bmiData.weight);
  let height = parseInt(bmiData.height);
  if (
    nameLen >= minNameLength &&
    nameLen <= maxNameLength &&
    minHeight <= height &&
    height <= maxHeight &&
    minWeight <= weight &&
    weight <= maxWeight
  ) {
    let validBMIData = { name: bmiData.name, height: height, weight: weight };
    console.log("Validated: ");
    console.log(validBMIData);
    return validBMIData;
  } else throw new Error("Invalid Request Format");
}

function round2Decimals(floatNumber) {
  return Math.round(floatNumber * 100) / 100;
}
function calcBMI(height, weight) {
  let bmi = weight / (((height / 100) * height) / 100);
  bmi = round2Decimals(bmi);
  console.log(height, weight, bmi);
  return bmi;
}

/* "Database" emulated by maintained an in-memory array of BMIData objects 
   Higher index means newer data record: you can insert by simply 
  'push'ing new data records */

let sampleBMIData = { name: "Mickey", height: 180, weight: 90 };
let bmiDB = [sampleBMIData]; //

//compare the latest two entries for 'name' and compute difference of bmi numbers
//return 0 if only one or no record is found

function calcDelta(name) {
  console.log("looking up " + name);
  console.log(bmiDB);
  let newBMIIndex = -1;
  let previousBMIIndex = -1;
  let i = 0;

  for (i = bmiDB.length - 1; i >= 0; i--)
    if (bmiDB[i].name == name) {
      newBMIIndex = i;
      console.log("NEW " + i);
      break;
    }

  for (--i; i >= 0; i--)
    if (bmiDB[i].name == name) {
      previousBMIIndex = i;
      console.log("PREV " + i);
      break;
    }
  if (newBMIIndex >= 0 && previousBMIIndex >= 0)
    return round2Decimals(
      calcBMI(bmiDB[newBMIIndex].height, bmiDB[newBMIIndex].weight) -
        calcBMI(bmiDB[previousBMIIndex].height, bmiDB[previousBMIIndex].weight)
    );
  else return 0;
}

function bmiLookup(name) {
  console.log("looking up " + name);
  let i = 0;

  for (i = bmiDB.length - 1; i >= 0; i--)
    if (bmiDB[i].name == name) {
      return bmiDB[i];
    }
  //none found: return an "empty" object
  return { name: "", height: 0, weight: 0 };
}

//Process the POST request that adds a new BMI reading to the DB
//It is to return the change in BMI back to the client as a bmiStatus
//object containing the new BMI and delta to the previously store reading (0 if none)
function recordBMI(bmiData) {
  console.log(bmiData);
  bmiDB.push(bmiData);
  let bmiStatus = {};
  bmiStatus.name = bmiData.name;
  bmiStatus.bmi = calcBMI(bmiData.height, bmiData.weight);
  bmiStatus.delta = calcDelta(bmiData.name);
  console.log(bmiStatus);
  return bmiStatus;
}

//const server = http.createServer( (req, res) => {HR(req,res);});

const server = http.createServer(requestHandler);
function requestHandler(req, res) {
  try {
    processReq(req, res);
  } catch (e) {
    console.log("Internal Error: " + e);
    errorResponse(res, 500, "");
  }
}

function processReq(req, res) {
  let date = new Date();
  console.log("GOT: " + req.method + " " + req.url);
  //https://www.w3schools.com/nodejs/nodejs_url.asp
  switch (req.method) {
    case "POST":
      switch (req.url) {
        case "/bmi-records":
        case "bmi-records": //just to be nice
          let validBMIData = {};
          extractJSON(req)
            .then((bmiData) => validateBMIData(bmiData))
            .catch((error) => {
              //We assume that an exception until here is caused by a validation error!
              throw new Error("Validation Error"); //bad client request
            })
            .then((validBMIData) => recordBMI(validBMIData))
            .then((bmiStatus) => jsonResponse(res, bmiStatus))
            .catch((error) => {
              if (error.message == "Validation Error") {
                return errorResponse(res, 400, error.message);
              } else {
                console.log("Internal Error: " + error);
                return errorResponse(res, 500, "");
              }
            });
          break; //https://stackoverflow.com/questions/40175657/stop-promise-chain-with-multiple-catches
        default:
          console.error("Resource doesn't exist");
          errorResponse(res, 404, "No such resource");
      }
      break; //POST URL
    case "GET": {
      let query = url.parse(req.url);
      let queryPath = decodeURI(query.path); // Conert uri encoded special letters (eg æøå that is escaped by "%number") to JS string
      let pathElements = queryPath.split("/");
      console.log(pathElements);
      switch (
        pathElements[1] //index 0 contains string before first "/" (which is empty)
      ) {
        case "": //
          fileResponse(res, "bmi.html");
          break;
        case "date": //
          date = new Date();
          console.log(date);
          jsonResponse(res, date);
          break;
        case "bmi-records":
          if (pathElements.length <= 2)
            // "/bmi-records"
            jsonResponse(res, bmiDB);
          //"/bmi-records/name"
          else jsonResponse(res, bmiLookup(pathElements[2]));
          break;
          break;
        default:
          //for anything else we assume it is a file to be served
          fileResponse(res, req.url);
          break;
      }
    } //switch GET URL
  }
}

/* start the server */
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  fs.writeFileSync(
    "message.txt",
    `Server running at http://${hostname}:${port}/`
  );
});
