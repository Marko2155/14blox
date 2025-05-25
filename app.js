const http = require("http")
const url = require("url")
const fs = require("fs")
const CircularJSON = require("circular-json")
const crypto = require("crypto")
const process = require("process")
const { wrap } = require("module")
const {MongoClient, ServerApiVersion} = require("mongodb")
const uri = process.env.MONGO_URI
const host = "0.0.0.0"
const port = process.env.PORT
let key = "1122334455667788998877665544332211"
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
    let filetext = fs.readFileSync(__dirname + "/" + file);
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

function convertToRoblox(color) {
		if (color == "Bright yellow") {
			return 157;
		} else if (color == "Bright red") {
			return 1004;
		} else if (color == "Bright blue") {
			return 1010;
		} else if (color == "Bright green") {
			return 1020;
		} else if (color == "Yellow") {
			return 24;
		} else if (color == "Red") {
			return 21;
		} else if (color == "Blue") {
			return 23;
		} else if (color == "Green") {
			return 37;
		}
}

function xor(str, key) {     
        str = String(str).split('').map(letter => letter.charCodeAt());
        let res = "";
        for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
	return res; 
}


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

async function GetAvatar(avatarId) {
		let avatar = await client.db("14blox").collection("avatars").findOne({ uid: avatarId });
		return avatar
}

function confirmSessionExists(ip) {
	if (sessions[ip.replaceAll(".", "")] == undefined || sessions[ip.replaceAll(".", "")] == null) {
		return false
	} else {
		return true
	}
}

http.createServer(async function(req, res) {
    const urlpath = url.parse(req.url, true)
    const parsedpath = urlpath.path
    const query = urlpath.query
    const path = parsedpath.split("?")[0]
    if (path.charAt(path.length - 1) == "?") {
        query = parsedpath.split("?")[1].replace("?", "")
    }
    console.log("Unknown method requested: " + req.method + ", with endpoint " + path)
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
            res.write("<script>location.href = 'fourteenblox://?placeid=" + String(query.placeid) + "'</script>")
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
	     let sessionExists = confirmSessionExists(req.connection.remoteAddress)
		if (sessionExists) {
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
		console.log(place)
		let placeRequest = {
			jobId: 12,
			status: 2,
			joinScriptUrl: "https://14blox.strangled.net/Game/Join.ashx",
			authenticationUrl: "https://14blox.strangled.net/Game/Negotiate.ashx",
			authenticationTicket: placeId + Math.random() * 500
		}
		res.writeHead(200);
		res.write(JSON.stringify(placeRequest))
		console.log(placeRequest)
		res.end()
	} else if (path == "/Game/Join.ashx") {
		res.writeHead(200);
		let adjustedUserName = "";
		if (sessions[req.connection.remoteAddress.replaceAll(".", "")].UserName == undefined || sessions[req.connection.remoteAddress.replaceAll(".", "")].UserName == null) {
			adjustedUserName = "Guest " + Math.random * 9999
		} else {
			adjustedUserName = sessions[req.connection.remoteAddress.replaceAll(".", "")].UserName
		}
		res.write("game:GetService('GuiService'):SendNotification('Badge Awarded!', message, 'https://14blox.strangled.net/Asset?id=177200377', 5, noOptFunc)")
		res.end()
	} else if (path == "/Login/Negotiate.ashx") {
		let sessionExists = confirmSessionExists(req.connection.localAddress)
		if (sessionExists) {
		let userData = await GetUserData(userData.UserName)
		if (!userData.IsBanned) {
			const ROBLOSECURITY = xor("14BLOX-" + userData.UserName + String(userData.UserId))
			let unameCookie = `username=${userData.UserName}`
			let passCookie = `password=${userData.UserPassword}`
			let ROBLOSECcookie = `.ROBLOSECURITY=${ROBLOSECURITY}`
			res.writeHead(200, {'Set-Cookie': unameCookie, 'Set-Cookie': passCookie, 'Set-Cookie': ROBLOSECcookie, 'Content-Type': 'text/plain'})
		} else {
			res.writeHead(401)
		}
		} else {
			res.writeHead(401)	
		}
		res.end()
	} else if (path == "/Error") {
		res.writeHead(200);
		res.write(DMPerror);
		res.end()
	} else if (path == "/Game/Ping.ashx") {
		res.writeHead(200);
		res.write("")
		res.end()
	} else if (path == "/Asset") {
		if (query.id != undefined || query.id != null) {
			if (fs.existsSync("asset/" + query.id + ".png")) {
				res.writeHead(200)
				SendFile(res, "asset/" + query.id + ".png")
			} else {
				res.writeHead(404)
				res.write("Asset doesn't exist!")
			}
		} else {
			res.writeHead(401)
			res.write("Provide an ID!")
		}
		res.end()
	} else if (path == "/UserCheck/checkifinvalidusernameforsignup") {
		if (query.username != undefined || query.username != null || query.username != "") {
			res.writeHead(200);
			let checkForUserWithSameUsername = await client.db("14blox").collection("users").findOne({ UserName: query.username })
			console.log(checkForUserWithSameUsername)
			console.log(JSON.stringify(checkForUserWithSameUsername))
			if (checkForUserWithSameUsername != null) {
				res.write("{'data': 1}")
			} else {
				res.write("{'data': 0}")
			}
			res.end()
		}
	} else if (path == "/UserCheck/getrecommendedusername") {
		if (query.usernameToTry != null || query.usernameToTry != undefined) {
			res.writeHead(200);
			res.write(String(query.usernameToTry) + String(Math.floor(Math.random() * (1200 - 900 + 1)) + 900))
			res.end()
		}
	} else if (path == "/My/Character.aspx") {
		res.writeHead(200)
		SendFile(res, "my/character.html")
		res.end()
	} else if (path == "/notMobile") {
		res.writeHead(200)
		SendFile(res, "notMobile.html")
		res.end()
	} else if (path.startsWith("/static/")) {
		let str = path.split('')
		str.splice(0, 1)
		str = str.join('')
		if (fs.existsSync(path)) {
			res.writeHead(200)
			res.write(fs.readFileSync(__dirname + path))
			res.end()
		} else {
			res.writeHead(404)
			res.end()
		}
	} else if (path == "/Game/visit.ashx") {
		res.writeHead(200)
		res.write(fs.readFileSync(__dirname + "/joinscripts/visit.lua"))
		res.end()
	} else if (path == "/game-auth/getauthticket") {
		let authticket = ""
		if (sessions[req.connection.remoteAddress.replaceAll(".", "")] == null) {
			authticket = sessions[req.connection.remoteAddress.replaceAll(".", "")].UserName + String(sessions[req.connection.remoteAddress.replaceAll(".", "")].UserID) + String(Math.random() * 999)
		} else {
			authticket = "Guest " + String(Math.random() * 99) + "0"
		}
		res.writeHead(200)
		res.write(authticket)
		res.end()
	} else if (path == "/favicon.ico") {
		res.writeHead(200);
		res.write(fs.readFileSync(__dirname + "/favicon.ico"))
		res.end() 
	} else if (path == "/Asset/BodyColors.ashx") {
		if (query.userId != null) {
			let userAvatar = await GetAvatar(Number(query.userId))
			if (userAvatar == null) {
				res.writeHead(404)
				res.end()
			} else {
				console.log(userAvatar)
				userAvatar = userAvatar.BodyColors;
				if (query.rcc == null) {
				res.writeHead(200)
				res.write(`
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
	<External>null</External>
	<External>nil</External>
	<Item class="BodyColors">
		<Properties>
			<int name="HeadColor">${convertToRoblox(userAvatar.HeadColor)}</int>
      			<int name="LeftArmColor">${convertToRoblox(userAvatar.LeftArmColor)}</int>
      			<int name="LeftLegColor">${convertToRoblox(userAvatar.LeftLegColor)}</int>
      			<string name="Name">Body Colors</string>
      			<int name="RightArmColor">${convertToRoblox(userAvatar.RightArmColor)}</int>
      			<int name="RightLegColor">${convertToRoblox(userAvatar.RightLegColor)}</int>
      			<int name="TorsoColor">${convertToRoblox(userAvatar.TorsoColor)}</int>
			<bool name="archivable">true</bool>
		</Properties>
	</Item>
</roblox>`)
				} else {
					let bodyColors = {
						LeftArmColor: convertToRoblox(userAvatar.LeftArmColor),
						LeftLegColor: convertToRoblox(userAvatar.LeftLegColor),
						RightArmColor: convertToRoblox(userAvatar.RightArmColor),
						RightLegColor: convertToRoblox(userAvatar.RightLegColor),
						HeadColor: convertToRoblox(userAvatar.HeadColor),
						TorsoColor: convertToRoblox(userAvatar.TorsoColor)
					}
					res.writeHead(200, {'Cache-Control': 'no-store'})
					res.write(JSON.stringify(bodyColors))
				}
				res.end()
			}
		} else if (path == "/Asset/getUserAvatarImage") {
			if (query.userId != null) {
				let userExists = await db("14blox").collection("users").findOne({ UserID: query.userId })
				if (userExists != null || userExists != "") {
					let userAvatar = await db("14blox").collection("avatars").findOne({ uid: query.userId})
					thumbnailData = userAvatar.thumbnailData
					res.writeHead(200)
					res.end()
				} else {
					res.writeHead(404)
					res.end()
				}
			} else {
				res.writeHead(401)
				res.end()
			}
	} else if (path == "/Asset/CharacterFetch.ashx") {
		if (query.userId != null) {
			let doesUserExist = client.db("14blox").collection("avatars").findOne({ UserID: query.userId })
			if (doesUserExist != "" || doesUserExist != null) {
				res.writeHead(200)
				res.write("https://14blox.strangled.net/Asset/BodyColors.ashx?userId=" + String(query.userId) + ";")
				res.end()
			} else {
				res.writeHead(404)
				res.end()
			}
		} else {
			res.writeHead(401)
			res.end()
		}
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
			if (userData.IsBanned == false) {
                    finishedData.Status = "OK"
                    finishedData.UserInfo = userData;
                    console.log(JSON.stringify(finishedData))
                    res.write(JSON.stringify(finishedData))
		    sessions[req.connection.remoteAddress.replaceAll(".", "")] = { UserName: userData.UserName, UserID: userData.UserID };
                    res.end();
			} else {
				finishedData.Status = "InvalidPassword"
				finishedData.UserInfo = userData;
			res.end()
			}
                } else {
                    finishedData.Status = "InvalidPassword"
                    finishedData.UserInfo = userData;
                    res.write(JSON.stringify(finishedData));
                    res.end();
                }
            } else if (path == "/mobileapi/logout") {
		res.writeHead(200);
		res.write("{'Status': 'OK'}");
		sessions[req.connection.remoteAddress.replaceAll(".", "")] = undefined;
		res.end();	
            } else if (path == "/error/Dmp.ashx") {
		DMPerror = body;
		console.log("GOT DMP ERROR, LOOK AT /Error");
		if (!res.headersSent) {
			res.writeHead(200);
		}
		res.end()
	    } else if (path == "/mobileapi/securesignup") {
		const udata = body.split("&")
		const uname = udata[0].split("=")[1]
		const upass = udata[1].split("=")[1]
		let userList = await client.db("14blox").collection("users").find({}).toArray()
		let userData = {
			UserName: uname,
			UserPassword: upass,
			UserID: userList[userList.length - 1].UserID + 1,
			RobuxBalance: Math.floor(Math.random() * (1200 - 900 + 1)) + 900,
			TicketsBalance: Math.floor(Math.random() * (1200 - 900 + 1)) + 900,
			IsAnyBuildersClubMember: true,
			ThumbnailUrl: "https://14blox.strangled.net/Asset?id=1",
			IsBanned: false
		}
		let avatarData = {
			uid: userList[userList.length - 1].UserID + 1,
			BodyColors: {
				HeadColor: "Bright yellow",
				TorsoColor: "Blue",
				LeftArmColor: "Bright yellow",
				RightArmColor: "Bright yellow",
				LeftLegColor: "Bright yellow",
				RightLegColor: "Bright yellow"
			},
			thumbnailData: ""
		}
		client.db("14blox").collection("users").insertOne(userData)
		client.db("14blox").collection("avatars").insertOne(avatarData)
		res.writeHead(200);
		res.write("{'Status': 'OK', 'UserInfo': " + JSON.stringify(userData) + "}");
		sessions[req.connection.remoteAddress.replaceAll(".", "")] = { UserName: userData.UserName, UserID: userData.UserID };
		res.end()
	    } else if (path == "/UserCheck/validatepasswordforsignup") {
		res.writeHead(200);
		res.write("{'success': true}")
		res.end()
	    } else if (path == "/setBodyColors") {
		let bodyColors = req.body
		if (sessions[req.connection.remoteAddress.replaceAll(".", "")] == null) {
			res.writeHead(404)
			res.write("goobai :D")
			res.end()
		} else {
			let character = await client.db("14blox").collection("avatars").findOne({ uid: sessions[req.connection.remoteAddress.replaceAll(".", "")].UserID })
			if (character == null || character == {}) {
				res.writeHead(401)
				res.write("Character not found!")
				res.end()
			} else {
				res.writeHead(200)
				const updateDocument = {
					$set: {
						BodyColors: bodyColors
					}
				}
				await client.db("14blox").collection("avatars").updateOne({ uid: sessions[req.connection.remoteAddress.replaceAll(".", "")].UserID }, updateDocument)
				res.end()
			}

		}
	    } else if (path == "/Asset/uploadUserAvatar") {
		    if (query.userId != null) {
			res.writeHead(200)
			const buffer = Buffer.from(body, "base64")
			await client.db("14blox").collection("avatars").updateOne({ uid: query.userId}, {$set: { thumbnailData: buffer }})
		    	res.end()
		    } else {
			res.writeHead(404)
			res.end()
		    }
	    } else {
		res.writeHead(404);
                res.write("what are you doing here, this API call doesn't exist.") 
		res.end()
            }
        })
    }
}).listen(port, host, function() {
    console.log(`Listening at port ${port}`)
})
