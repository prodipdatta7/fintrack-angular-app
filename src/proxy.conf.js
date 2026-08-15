const http = require('http');

const LOCAL_TARGET = 'http://localhost:5000';
const CLOUD_TARGET = 'https://fintrack-api-557447503156.us-central1.run.app';

let isLocalAvailable = false;
let lastCheckTime = 0;
const CACHE_TTL_MS = 2500;

function checkLocalServer() {
    const now = Date.now();
    if (now - lastCheckTime < CACHE_TTL_MS) {
        return Promise.resolve(isLocalAvailable);
    }
    lastCheckTime = now;

    return new Promise((resolve) => {
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port: 5000,
                path: '/',
                method: 'HEAD',
                timeout: 600,
            },
            (res) => {
                isLocalAvailable = true;
                resolve(true);
            },
        );

        req.on('error', () => {
            isLocalAvailable = false;
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            isLocalAvailable = false;
            resolve(false);
        });

        req.end();
    });
}

const PROXY_CONFIG = {
    '/api': {
        target: CLOUD_TARGET,
        secure: true,
        changeOrigin: true,
        router: async (req) => {
            const localUp = await checkLocalServer();
            if (localUp) {
                return LOCAL_TARGET;
            }
            return CLOUD_TARGET;
        },
        onError: (err, req, res) => {
            console.warn('[Proxy Fallback] Local server unavailable, request routed to cloud:', CLOUD_TARGET);
        },
    },
};

module.exports = PROXY_CONFIG;
