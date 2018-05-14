/**
 * Server related methods
 */

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');

const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// @TODO: write TDD
/*
const _data = require('./lib/data');
_data.delete('test', 'new_file', (err, data) => {
  console.log(err);
  // console.log(data);
});
*/

// Instantiate server object
const server = {};

// Instantiate HTTP server
server.httpSserver = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Instantiate HTTPS server
server.httpsServerOpts = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem'), 'utf-8'),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'), 'utf-8')
};
server.httpsSserver = https.createServer(server.httpsServerOpts, (req, res) => {
  server.unifiedServer(req, res);
});

/**
 * Handle server logic - usable by http(s)
 * @param {*} req - request
 * @param {*} res - response
 */
server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  const queryObj = parsedUrl.query;

  const method = req.method.toLowerCase();
  const headers = req.headers;

  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // choose handler
    const chosenHandler = typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    // collate data
    const data = {
      path: trimmedPath,
      method: method,
      payload: helpers.parseJsonToObject(buffer),
      headers: headers,
      queryStringObject: queryObj
    };

    // route request
    chosenHandler(data, (status, load) => {
      const statusCode = typeof status == "number" ? status : 200;
      const payload = typeof load == "object" ? load : {};
      const payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log(`Request received on path: ${method} ${trimmedPath}`);
      console.log(`Query Object: ${JSON.stringify(queryObj)}`);
      console.log(`Headers: ${JSON.stringify(headers)}`);
      console.log(`Payload: ${buffer}`);
      console.log(`Response: ${statusCode} ${payloadString}`);
    });
  });
};

server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens
};

server.init = () => {
  // start HTTP server
  server.httpSserver.listen(config.httpPort, () => {
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} mode`);
  });

  // start HTTPS server
  server.httpsSserver.listen(config.httpsPort, () => {
    console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} mode`);
  });

};

module.exports = server;
