const http = require("http")
const url = require("url")
const fs = require("fs")
const process = require("process")
const { wrap } = require("module")
const {MongoClient, ServerApiVersion} = require("mongodb")
const uri = "mongodb+srv://14bloxJS:TLxUFjSLJXd1ebIo@14bloxdb.4yuwdsg.mongodb.net/?retryWrites=true&w=majority&appName=14bloxDB"
const host = "0.0.0.0"
const port = 10000
let DMPerror = "";
let sessions = []

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false,
  }
});

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}


function SendFile(res, file) {
    let filetext = fs.readFileSync(file);
    res.write(filetext)
}

(async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
})();


function WriteNewline(res, text) {
    res.write(text + "\n")
}

process.on("SIGINT", async function() {
	await client.close()
	console.log("\nClosing MongoDB connection!")
	process.exit();
})



async function GetUserData(username) {
    let user = await client.db("14blox").collection("users").findOne({UserName: username})
    return user
}

async function GetGame(placeId) {
	let place = await client.db("14blox").collection("games").findOne({ gameId: placeId })
	return place
}

http.createServer(async function(req, res) {
    const urlpath = url.parse(req.url, true)
    const parsedpath = urlpath.path
    const query = urlpath.query
    const path = parsedpath.split("?")[0]
    if (path.charAt(path.length - 1) == "?") {
        query = parsedpath.split("?")[1].replace("?", "")
    }
    if (req.method == "GET") {
        console.log("GET " + path)
        console.log(query)
	console.log("Headers: " + JSON.stringify(req.headers))
        if (path == "/") {
            res.writeHead(200);
            SendFile(res, "index.html")
            res.end();
        } else if (path == "/games/list") {
            res.writeHead(200);
            SendFile(res, "games/list.html")
            res.end();
        } else if (path == "/games/id/1") {
            res.writeHead(200);
            SendFile(res, "games/123456789.rbxl")
            res.end();
        } else if (path == "/userlogo") {
	        res.write(fs.readFileSync("img/userlogo.png"));
        } else if (path == "/games/start") {
            res.writeHead(200);
            res.write("Game should be starting!")
            res.end();
        } else if (path == "/status") {
            res.writeHead(200);
            res.write("perfectly healthy :D");
            res.end();
        } else if (path == "/games/query" && query != {}) {
            res.writeHead(200);
            if (query.gameName == undefined) {
                res.write("<h1>Nothing searched.</h1>")
                res.end()
            } else {
                res.write("<h1>Games named or close to '" + query.gameName + "':");
                res.end()
            }
        } else if (path == "/mobileapi/userinfo") {
	    res.writeHead(200);
	    if (sessions[req.connection.remoteAddress.replaceAll(".", "")] != undefined || sessions[req.connection.remoteAddress.replaceAll(".", "")] != null) {
		    console.log(req.connection.remoteAddress)
	        let userData = await GetUserData(sessions[req.connection.remoteAddress.replaceAll(".", "")].UserName)
		res.write(JSON.stringify(userData));
		console.log(userData)
	    } else {
		res.writeHead(200);
		res.write("Server restart occured. You need to login again.")
	    }
	    res.end();
	} else if (path == "/Game/PlaceLauncher.ashx") {
		const placeId = query.placeId
		const place = GetGame(placeId)
		let placeRequest = {
			jobId: 12,
			status: place.gameStatus,
			joinScriptUrl: "https://14blox.strangled.net/Game/Join.ashx",
			authenticationUrl: "https://14blox.strangled.net/Game/Negotiate.ashx",
			authenticationTicket: placeId + Math.random() * 500
		}
		res.writeHead(200);
		res.write(JSON.stringify(placeRequest))
		res.end()
	} else if (path == "/Game/Join.ashx") {

		res.end()
	} else if (path == "/loader/Negotiate.ashx") {
		res.writeHead(200);
		
	} else if (path == "/Error") {
		res.writeHead(200);
		res.write(DMPerror);
		res.end()
	} else {
            res.writeHead(404);
            WriteNewline(res, "what are you doing here, this page doesn't exist.")
            res.end();
        }
    } else if (req.method == "POST") {
        console.log("POST " + path)
        console.log("Headers: " + JSON.stringify(req.headers))
        var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        })

        req.on("end", async function() {
            if (path == "/mobileapi/login") {
                console.log(body);
                res.writeHead(200);
                const userdata = body.split("&");
                const password = userdata[1].split("=")[1];
                const username = userdata[0].split("=")[1];
                const userData = await GetUserData(username)
                let finishedData = {
                    Status: "",
                    UserInfo: ""
                }
                console.log(userData);
                if (userData != null && userData.UserPassword != null && userData.UserPassword == password) {
                    finishedData.Status = "OK"
                    finishedData.UserInfo = userData;
                    console.log(JSON.stringify(finishedData))
                    res.write(JSON.stringify(finishedData))
		    sessions[req.connection.remoteAddress.replaceAll(".", "")] = { UserName: userData.UserName, UserID: userData.UserID };
                    res.end();
                } else {
                    finishedData.Status = "InvalidPassword"
                    finishedData.UserInfo = "";
                    res.write(JSON.stringify(finishedData));
                    res.end();
                }
            } else if (path == "/mobileapi/logout") {
		        res.writeHead(200);
		        res.write("{'Status': 'OK'}");
		        res.end();
		    sessions[req.connection.remoteAddress.replaceAll(".", "")] = undefined;
	        } else if (path == "/Error/DMP.ashx") {
                res.end()
            } else if (path == "/Error/DMP.ashx") {
		res.writeHead(200);
		DMPerror = req.body;
		console.log("GOT DMP ERROR, LOOK AT /Error");
		res.end()
	    } else {
                res.write("what are you doing here, this API call doesn't exist.")
                res.writeHead(404);
            }
        })
    }
}).listen(port, host, function() {
    console.log(`Listening at port ${port}`)
})
