import express from 'express';

/**
 * Create node server based on config provided
 * @param  {Object} config - server config
 * @return {Object} Node server
 */
const createServer = (config) => {
    const server = express();

    // With development environment, proxy can be set to serve webpack-dev-server
    if (config.env === 'development') {
        const httpProxy = require('http-proxy');

        const proxy = httpProxy.createProxyServer({
            secure: false,
        });

        server.use('/static', (req, res) => {
            proxy.web(req, res, { target: 'http://localhost:8081/static/' });
        });
        server.use('/api', (req, res) => {
            proxy.web(req, res, { target: 'http://localhost:8181' });
        });
    } else {
        server.use('/static', express.static('../static'));
    }

    return server;
};

export default createServer;
