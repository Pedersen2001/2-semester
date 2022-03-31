// This is server-side JavaScript, intended to be run with NodeJS.

const http = require('http');
const fs=require("fs");
const path=require("path");
const util = require('util')
const hostname = '127.0.0.1';
const port = 3000;
const WebSocket = require('websocket');
let webSocketServer = WebSocket.server;
const url = require("url");



const publicResources="PublicResources/";
//secure file system access as described on 
//https://nodejs.org/en/knowledge/file-system/security/introduction/
const rootFileSystem=process.cwd();
function securePath(userPath){
  if (userPath.indexOf('\0') !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;

  }
  userPath= publicResources+userPath;

  let p= path.join(rootFileSystem,path.normalize(userPath)); 
  //console.log("The path is:"+p);
  return p;
}

/* more accurate error codes should be sent to client */

function fileResponse(filename,res){
  const sPath=securePath(filename);
  console.log("Reading:"+sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      res.statusCode=404;
      res.setHeader('Content-Type', 'text/txt');
      res.write("File Error:"+String(err));
      res.end("\n");
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', guessMimeType(filename));
      res.write(data);
      res.end('\n');
    }
  })
}
const server = http.createServer((req, res) => {
  let date=new Date();
  console.log("GOT: " + req.method + " " +req.url);
  if(req.method=="GET"){
    switch(req.url){
      case "/":    
       fileResponse("chatClient.html", res);
      break;
    default:
      fileResponse(req.url,res);
      break;
    }//switch
  } else {
    console.log("received a ", req.method)
    console.log("more ", req.statusMessage)
//    console.log("inspect ", util.inspect(req))
    date=new Date();
    console.log(JSON.stringify(date));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    let newobj = {};
    newobj['the_url'] = req.url;
    newobj.date = date;
    res.write(JSON.stringify(newobj));
    res.end('\n');
  }
});

//better alternative: use require('mmmagic') library
function guessMimeType(fileName){
  const fileExtension=fileName.split('.').pop().toLowerCase();
  console.log(fileExtension);
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
    //incomplete
  return (ext2Mime[fileExtension]||"text/plain");
}

server.listen(port, hostname, () => {
  console.log((new Date()) + `Server running at http://${hostname}:${port}/`);
});




// An array of ServerResponse objects that we're going to send events to
let clients = [];

let wsServer = new webSocketServer({
    httpServer: server
});


wsServer.on('request', (request) => {
    console.log((new Date()) + ' Connection from ' + request.origin + '.');
    let connection = request.accept(null, request.origin);
    clients.push(connection);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
		console.log((new Date()) + ' message: ' + JSON.stringify(message.utf8Data));

		broadcastNewMessage(message.utf8Data);
    });
});

function broadcastNewMessage(message) {
	for (client of clients) {
		if (client.readyState == WebSocket.OPEN) {
			client.sendUTF(message);
		}
	}
}
