const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const queryObj = parsedUrl.query;

    const method = req.method.toLowerCase();
    const headers = req.headers;

    res.end('Hello world\n');

    // curl "localhost:3000/foo/bar/?q=fizz" -H "foo: bar"
    console.log(`Request received on path: ${method} ${trimmedPath}`);
    console.log(`Query Object: ${JSON.stringify(queryObj)}`);
    console.log(`Headers: ${JSON.stringify(headers)}`);
});

server.listen(3000, () => {
    console.log('The server is listening on port 3000');
});