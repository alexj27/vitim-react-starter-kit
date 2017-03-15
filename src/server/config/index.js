const BASE_PATH = process.env.BASE_PATH || '';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'https://localhost/api';

const config = {
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 8080,
    basePath: BASE_PATH,
    backendBaseUrl: BACKEND_BASE_URL,
    serverRendering: process.env.SERVER_RENDERING === 'on'
};

if (process.env.PROXY_IP && process.env.PROXY_PORT) {
    config.bundleProxy = {
        proxyIp: process.env.PROXY_IP,
        proxyPort: process.env.PROXY_PORT,
        proxyPath: process.env.PROXY_PATH || '',
    };
}

export default config;
