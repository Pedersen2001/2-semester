/* *****************************************************************
  DISCLAIMER: This code is developed to support education and demo 
  purposes and certain simplifications have been made to keep the code
  short and comprehensible.
  ****************************************************************** */

//THIS APP USES ES6 MODULES  
import http from 'http';
import fs from "fs";
import path  from "path";
import process from "process";

//import contentType from "content-type";
//import url from "url";
//import qs from "querystring";
/* ****************************************************************************
 * Application code for the yatzy application 
 ***************************************************************************** */
import {yatzyHomePage,newYatzyGamePage,newYatzyRoundPage,validateYatzyConfigData,
  validateYatzyRoundData,validateYatzyHighScoreData, yatzyHighScorePage, ValidationError} from "./yatzy-site.js";


const hostname = '127.0.0.1';
const port = 3000;
//const serverName="http://localhost:3000";


/* ***************************************************************************  
  First a number of generic helper functions to serve basic files and documents 
 ***************************************************************************** */ 


/* ***                 Setup Serving of files ***                  */ 

const publicResources="node/PublicResources/";
//secture file system access as described on 
//https://nodejs.org/en/knowledge/file-system/security/introduction/
const rootFileSystem=process.cwd();
function securePath(userPath){
  if (userPath.indexOf('\0') !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;

  }
  userPath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  userPath= publicResources+userPath;

  let p= path.join(rootFileSystem,path.normalize(userPath)); 
  //console.log("The path is:"+p);
  return p;
}


/* send contents as file as response */
function fileResponse(res, filename){
  const sPath=securePath(filename);
  console.log("Reading:"+sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      errorResponse(res,404,String(err));
    }else {
      res.statusCode = 200;
      res.setHeader('Content-Type', guessMimeType(filename));
      res.write(data);
      res.end('\n');
    }
  })
}

//A helper function that converts filename suffix to the corresponding HTTP content type
//shown here to illustrate how the mapping can be done in simple code
//better alternative: use 'mime-type' or 'mmmagic' library
function guessMimeType(fileName){
  const fileExtension=fileName.split('.').pop().toLowerCase();
  //console.log(fileExtension);
  const ext2Mime ={ //Aught to check with IANA spec
    "txt": "text/txt",
    "html": "text/html",
    "ico": "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
    "js": "text/javascript",
    "json": "application/json", 
    "css": 'text/css',
    "png": 'image/png',
    "jpg": 'image/jpeg',
    "wav": 'audio/wav',
    "mp3": 'audio/mpeg',
    "svg": 'image/svg+xml',
    "pdf": 'application/pdf',
    "doc": 'application/msword',
    "docx": 'application/msword'
   };
    //incomplete, otherwise plain text
  return (ext2Mime[fileExtension]||"text/plain"); 
}

/* Helper functions to retrieve request objects and send response objects    */  
const InternalError ="Internal Error";

/* send a response with htmlString as html page */
function htmlResponse(res, htmlString){
  res.statusCode = 200;
  res.setHeader('Content-Type', "text/html");
  res.write(htmlString);
  res.end('\n');
}

/* send a response with a given HTTP error code, and reason string */ 
function errorResponse(res, code, reason){
  res.statusCode=code;
  res.setHeader('Content-Type', 'text/txt');
  res.write(reason);
  res.end("\n");
}
/* send 'obj' object as JSON as response */
function jsonResponse(res,obj){
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(obj));
  res.end('\n');
}

/* As the body of a POST may be long the HTTP modules streams chunks of data
   that must first be collected and appended before the data can be operated on. 
   This function collects the body and returns a promise for the body data
*/

/* ToDO:protect againts DOS/Flood attack (or faulty client) from malicious user sending an very very large post body.
if (body.length > 1e6) { 
  request.connection.destroy();
}
*/
function collectPostBody(req){
  //the "executor" function
 function collectPostBodyExecutor(resolve,reject){
    let bodyData = [];
    req.on('data', (chunk) => {
      bodyData.push(chunk);
    }).on('end', () => {
    bodyData = Buffer.concat(bodyData).toString();
    console.log(bodyData);
    resolve(bodyData); 
    });
    //Exceptions raised will reject the promise
  }
  return new Promise(collectPostBodyExecutor);
}


/* extract the enclosed JSON object in body of a POST to JavaScript Object */ 
/* Aught also to check that Content-Type is application/json before parsing*/
function extractJSON(req){
  return collectPostBody(req).then(body=> {
    let x= JSON.parse(body);
    //console.log(x);
    return x;
  });
}

/* extract the enclosed forms data in the pody of POST */
/* Aught also chgeck that Content-Type is application/x-www-form-urlencoded before parsing*/
function extractForm(req){
  if(isFormEncoded(req.headers['content-type']))
    return collectPostBody(req).then(body=> {
      //const data = qs.parse(body);//LEGACY
       //console.log(data);
       let data=new URLSearchParams(body);
      return data;
      });
  else
    return Promise.reject(new Error(ValidationError)); 
}

function isFormEncoded(contentType){
  //Format 
  //Content-Type: text/html; charset=UTF-8
  let ctType=contentType.split(";")[0];
  ctType=ctType.trim();
  return (ctType==="application/x-www-form-urlencoded"); 
//would be more robust to use the content-type module and  contentType.parse(..)
}

function reportError(res,error){
  if(error.message===ValidationError){
    return errorResponse(res,400,error.message);
  }
  else {
    console.log(InternalError + ": " +error);
    return errorResponse(res,500,"");
  }
}


/* *********************************************************************
   Setup HTTP server and route handling 
   ******************************************************************** */

const server = http.createServer(requestHandler);
function requestHandler(req,res){
  try{
   processReq(req,res);
  }catch(e){
    console.log(InternalError +"!!: " +e);
   errorResponse(res,500,"");
  }
}

function processReq(req,res){
 
  console.log("GOT: " + req.method + " " +req.url);
  //https://www.w3schools.com/nodejs/nodejs_url.asp

  ////Use recommended WHATWG API to handle URIs
  let baseURL = 'http://' + req.headers.host + '/';    //https://github.com/nodejs/node/issues/12682
  let theURL=new URL(req.url,baseURL); 
  let searchParams=new URLSearchParams(theURL.search);
  let queryPath=decodeURIComponent(theURL.pathname); //Convert uri encoded special letters (eg æøå that are escaped by "%number") to JS string

  switch(req.method){
    case "POST": { //route pathname to resource handler function
      let pathElements=queryPath.split("/"); 
      console.log(pathElements[1]);
      switch(pathElements[1]){
        case "newgame":
          extractForm(req)
          .then(gameData => validateYatzyConfigData(gameData))
          .then(gameData => htmlResponse(res,newYatzyGamePage(gameData)))
          .catch(err=>reportError(res,err));
          break;
        case "nextround":
          extractForm(req)
          .then(roundData => validateYatzyRoundData(roundData))
          .then(roundData => htmlResponse(res,newYatzyRoundPage(roundData)))
          .catch(err=>reportError(res,err));
          break; 
      default: 
         console.error("Resource doesn't exist");
         errorResponse(res, 404, "No such resource");
      }
    } break; //END POST URL
    
    case "GET":{
    let pathElements=queryPath.split("/"); 
    //console.log(pathElements);
    switch(pathElements[1]){  //index 0 contains string before first "/" (which is empty) 
      case "":                // for the root document return the main yatzy page  
           return htmlResponse(res,yatzyHomePage());
      break;
        case "highscores":
          try {
           let validatedData= validateYatzyHighScoreData(searchParams);
           return htmlResponse(res,yatzyHighScorePage(validatedData));
          }catch(err){
            reportError(res,err);
          }
          break;
        default: //for anything else we assume it is a file to be served
          return fileResponse(res, queryPath);
        break;
       }
     }
     break;//END switch GET URL
    default:
      errorResponse(res, 404, "No such resource"); 
  } //end switch method
}



/* start the server */
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  fs.writeFileSync('message.txt', `Server running at http://${hostname}:${port}/`);
});


