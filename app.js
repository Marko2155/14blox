const http = require("http")
const url = require("url")
const fs = require("fs")
const { wrap } = require("module")
const host = "0.0.0.0"
const port = 10000

function SendFile(res, file) {
    let filetext = fs.readFileSync(file);
    res.write(filetext)
}

function WriteNewline(res, text) {
    res.write(text + "\n")
}

function JSONToArray(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(json[key]);
    });
    return result;
}

function GetUserData(username, db) {
    let userdb = JSON.parse(fs.readFileSync("db/" + db + "/users.json"))
    return userdb.find(user => user.UserName == username)
}
http.createServer(function(req, res) {
    const urlpath = url.parse(req.url, true)
    const parsedpath = urlpath.path
    const path = parsedpath.split("?")[0]
    const query = parsedpath.split("?")[1].replace("?", "")
    if (req.method == "GET") {
        console.log("GET " + path)
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
    } else {
            res.writeHead(404);
            WriteNewline(res, "what are you doing here, this page doesn't exist.")
            res.end();
        }
    } else if (req.method == "POST") {
        console.log("POST " + path)
        var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        })

        req.on("end", function() {
            if (path == "/mobileapi/login") {
                console.log(body);
                res.writeHead(200);
                const userdata = body.split("&");
                const password = userdata[1].split("=")[1];
                const username = userdata[0].split("=")[1];
                const userData = GetUserData(username, "devl")
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
	    } else {
                res.write("what are you doing here, this API call doesn't exist.")
                res.writeHead(404);
            }
        })
    }
}).listen(port, host, function() {
    console.log(`Listening at port ${port}`)
})
