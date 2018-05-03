const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require('./config');

const server = http.createServer((req, res) => {
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
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // collate data
    const data = {
      path: trimmedPath,
      method: method,
      payload: buffer,
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
});

// start server
server.listen(config.port, () => {
  console.log(`The server is listening on port ${config.port} in ${config.envName} mode.`);
});

// Routing
const handlers = {};

handlers.sample = (data, callback) => {
  // callback a http status code and a payload object
  callback(406, { name: "Sample handler" });
};

handlers.notFound = (data, callback) => {
  callback(404);
};

const router = {
  sample: handlers.sample
};

// curl "localhost:3000/foo/bar/?q=fizz" -H "foo: bar"
// curl -XPOST "localhost:3000/foo/bar/?q=name" -H "foo: bar" --data-raw "This is a sample body content"
