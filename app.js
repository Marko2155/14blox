const http = require("http")
const url = require("url")
const fs = require("fs")
const host = "localhost"
const port = 3000

function SendFile(res, file) {
    let filetext = fs.readFileSync(file);
    res.write(filetext)
}

function WriteNewline(res, text) {
    res.write(text + "\n")
}

http.createServer(function(req, res) {
    const urlpath = url.parse(req.url, true)
    const path = urlpath.path
    if (req.method == "GET") {
        if (path == "/") {
            console.log("GET " + path)
            res.writeHead(200);
            SendFile(res, "index.html")
            res.end();
        } else if (path == "/games/list") {
            console.log("GET " + path)
            res.writeHead(200);
            SendFile(res, "games/list.html")
            res.end();
        } else if (path == "/games/123456789") {
            console.log("GET " + path)
            res.writeHead(200);
            SendFile(res, "games/123456789.rbxl")
            res.end();
        } else {
            res.writeHead(404);
            WriteNewline(res, "what are you doing here, this page doesn't exist.")
            res.end();
        }
    } else if (req.method == "POST") {

    }
}).listen(80, function() {
    console.log(`Listening at port ${port}`)
})