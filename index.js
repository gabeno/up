const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const queryObj = parsedUrl.query;

    const method = req.method.toLowerCase();
    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        res.end('Hello world\n');

        // curl "localhost:3000/foo/bar/?q=fizz" -H "foo: bar"
        // curl -XPOST "localhost:3000/foo/bar/?q=name" -H "foo: bar" --data-raw "This is a sample body content"
        console.log(`Request received on path: ${method} ${trimmedPath}`);
        console.log(`Query Object: ${JSON.stringify(queryObj)}`);
        console.log(`Headers: ${JSON.stringify(headers)}`);
        console.log(`Payload: ${buffer}`);
    });
});

server.listen(3000, () => {
    console.log('The server is listening on port 3000');
});