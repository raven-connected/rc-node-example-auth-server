require("dotenv").config();
const http = require("http");
const request = require("request");
const fs = require("fs");

const port = process.env.PORT || 9000;

http.createServer((req, res) => {

    if (req.url.includes("favicon.ico")) {
        res.statusCode = 204; // no content
        res.end();
        return;
    }

    const url = new URL(req.protocol + "://" + req.host + req.url);

    if (req.url.startsWith("/nodeExampleAuthServer.html")) {
        serveExample(req, res);
        return;
    }

    const accessToken = url.searchParams.get("accesstoken");

    if (accessToken) {
        sessionTokenRoute(req, res, accessToken); // use accessToken to get sessionToken
        return;
    }
    accessTokenRoute(req, res); // get accessToken

}).listen(port, () => {
    console.log("Server running");
});

serveExample = (req, res) => {
    fs.readFile(__dirname + "/nodeExampleAuthServer.html", function (err,data) {
        if (err) {
          res.writeHead(404);
          res.end(JSON.stringify(err));
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
}

sessionTokenRoute = (req, res, accessToken) => {

    // https://curl.trillworks.com/#node-request (convert cURL to node"s request format)
    // curl --silent -H "Authorization: Bearer $token" "https://${API_DOMAIN}/v1/auth/sessions" -H "Content-Type: application/json" -d "$usertoken_requestbody"

    const url = new URL(req.protocol + "://" + req.host + req.url);
    const deviceType = process.env.DEVICE_TYPE
    let idForDeviceType = url.searchParams.get(deviceType + "id");
    if (!idForDeviceType) {
        res.write(new Error(deviceType + "id parameter not found."))
        res.end();
        return;
    }

    const headers = {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json",
        "User-Agent": "rc-node-example-auth-server" // at time of writing, the User-Agent can be any string but it can't be blank, so using the repo name for now
    };

    const sessionName = new Date().getTime() + "-localhost";

    const requestBody = '{"account":"' + process.env.FLEET_ID + '","sessionName":"' + sessionName + '","policyDocument":{"statements":[{"actions":["' + deviceType + ':*"],"resources":["' + deviceType + '::'+ idForDeviceType + '"]}]}}';

    const options = {
        url: "https://" + process.env.API_DOMAIN + "/v1" + "/auth/sessions",
        method: "POST",
        headers: headers,
        body: requestBody
    };

    function callback(error, response, body) {

        if (response && response.statusCode) {
            res.statusCode = response.statusCode;
        } else {
            res.statusCode = 500;
        }
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (error) {
            res.write(error);
        } else {
            res.setHeader("Content-Type", "application/json");
            res.write(body);
        }
        console.log("sessionTokenRoute res: ", body + "\n\n\n\n");
        res.end();
    }

    request(options, callback);

}


accessTokenRoute = (req, res) => {

    // https://curl.trillworks.com/#node-request (convert cURL to node"s request format)
    // curl --silent --user ${APP_CLIENT_ID}:${APP_CLIENT_SECRET} -d grant_type=client_credentials -d client_id=${APP_CLIENT_ID} ${TOKEN_ENDPOINT}

    const requestBody = "grant_type=client_credentials&client_id=" + process.env.APP_CLIENT_ID;

    const options = {
        url: process.env.TOKEN_ENDPOINT,
        method: "POST",
        body: requestBody,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded", // https://kigiri.github.io/fetch/
            "User-Agent": "rc-node-example-auth-server" // at time of writing, the User-Agent can be any string but it can't be blank, so using the repo name for now
        },
        auth: {
            "user": process.env.APP_CLIENT_ID,
            "pass": process.env.APP_CLIENT_SECRET
        }
    };
    
    function callback(error, response, body) {

        if (response && response.statusCode) {
            res.statusCode = response.statusCode;
        } else {
            res.statusCode = 500;
        }
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (error) {
            res.write(error);
        } else {
            res.setHeader("Content-Type", "application/json");
            res.write(body);
        }
        console.log("accessTokenRoute res: ", body + "\n\n");
        res.end();
    }
    
    request(options, callback);
    
}





