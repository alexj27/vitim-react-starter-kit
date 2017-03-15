import assert from 'assert';
import httpProxy from 'http-proxy';
import http from 'http';
import cookieParser from 'cookie-parser';
import createServer from './createServer';
import config from './config';
import reactMiddleware from './middleware/react';

const server = createServer(config);

const proxy = httpProxy.createProxyServer({
    secure: false,
});
proxy.on('error', (err) => {
    return console.log('Proxy error', err); //eslint-disable-line no-console
});

// proxy all API request to API server
server.use('/users', (req, res) => {
    proxy.web(req, res, { target: config.backendBaseUrl });
});


server.use(cookieParser());
server.use(reactMiddleware);

// Start server
const { host, port } = config;
assert(host && port, 'At least one of \'IP\' and \'PORT\' not defined in environment variables.');

http.createServer(server).listen(port, host, () => {
    console.log(`Server is running at ${host}:${port}`); //eslint-disable-line no-console
});
