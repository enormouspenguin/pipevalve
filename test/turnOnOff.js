#!/usr/bin/env node
var http = require("http")
    , url = require("url")
    , PipeValve = require("../pipevalve");

var download = null;

var server = http.createServer(function(req, res){

    if(/\/delay.*/.test(req.url)) {
        if (download) {
            var urlObj = url.parse(req.url, true);
            var num = 2000;
            try {
                num = parseInt(urlObj.query.ms);
            } catch(e) {
                num = 2000;
            }
            download.delay(num);
            res.end("Stream delayed for " + num + " ms!");
        } else {
            res404(res);
        }
        return;
    }
    switch (req.url) {
        case "/start": {
            if (!download) {
                var cliReq = http.get("http://download.videolan.org/pub/videolan/vlc/2.0.7/vlc-2.0.7.tar.xz", function(cliRes){
                        console.dir(cliRes.headers);
                        download = new PipeValve();
                        res.writeHead(cliRes.statusCode, {
                            "content-length": cliRes.headers["content-length"],
                            "content-disposition": cliRes.headers["content-disposition"] || "attachment; filename=vlc - 2.0.7.tar.xz"
                        });
                        //res.setHeader("content-length", cliRes.headers["content-length"]);
                        //res.setHeader("content-disposition", cliRes.headers["content-disposition"] || "attachment; filename=vlc-2.0.8-win32.exe")
                        cliRes.pipe(download).pipe(res).once("close", function() {
                            download = null;
                            cliReq.abort();
                            cliReq = null;
                            cliRes = null;
                        });
                    }).on("error", function(err){
                        console.dir(err);
                        res404(res);
                    });
            } else {
                res404(res);
            }
            break;
        }
        case "/off": {
            if (download) {
                download.turnOff();
                res.end("Stream turned off!");
            } else {
                res404(res);
            }
            break;
        }
        case "/on": {
            if (download) {
                download.turnOn();
                res.end("Stream turned on!");
            } else {
                res404(res);
            }
            break;
        }
        default: {
            //res404(res);
            res.end("Lalalaheo");
        }
    }
});
var port = 1234;
server.listen(port, function(){
        console.log("Listening on " + port + "!");
    });

function res404(res, mess) {
    res.writeHead(404, mess);
    res.end();
}