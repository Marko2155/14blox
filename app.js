const http = require("http")
const url = require("url")
const fs = require("fs")
const host = "localhost"
const port = 80

function SendFile(res, file) {
    let filetext = fs.readFileSync(file);
    res.write(filetext)
}

http.createServer(function(req, res) {
    const urlpath = url.parse(req.url, true)
    const path = urlpath.path
    if (req.method == "GET" && path == "/") {
        res.writeHead(200);
        SendFile(res, "index.html")
    }
})