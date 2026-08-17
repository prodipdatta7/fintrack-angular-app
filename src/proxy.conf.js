const http = require('http');

const LOCAL_TARGET = 'http://127.0.0.1:5000';
const CLOUD_TARGET = 'https://fintrack-api-557447503156.us-central1.run.app';

let isLocalAvailable = false;

function probeLocalServer() {
    const req = http.request(
        {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/',
            method: 'HEAD',
            timeout: 800,
        },
        () => {
            isLocalAvailable = true;
        },
    );

    req.on('error', () => {
        isLocalAvailable = false;
    });

    req.on('timeout', () => {
        req.destroy();
        isLocalAvailable = false;
    });

    req.end();
}

// Initial probe and background heartbeat (runs without keeping process alive)
probeLocalServer();
if (typeof setInterval !== 'undefined') {
    const timer = setInterval(probeLocalServer, 2000);
    if (timer && timer.unref) {
        timer.unref();
    }
}

/**
 * Target is set to CLOUD_TARGET (HTTPS) so Vite's http-proxy establishes
 * a proper TLS socket. When local server is running (HTTP), the bypass hook
 * streams requests to localhost:5000 directly.
 */
const PROXY_CONFIG = {
    '/api': {
        target: CLOUD_TARGET,
        secure: true,
        changeOrigin: true,
        bypass: (req, res) => {
            if (isLocalAvailable) {
                const proxyReq = http.request(
                    {
                        hostname: '127.0.0.1',
                        port: 5000,
                        path: req.url,
                        method: req.method,
                        headers: {
                            ...req.headers,
                            host: 'localhost:5000',
                        },
                    },
                    (proxyRes) => {
                        res.writeHead(proxyRes.statusCode, proxyRes.headers);
                        proxyRes.pipe(res, { end: true });
                    },
                );

                proxyReq.on('error', (err) => {
                    console.warn('[Proxy Fallback] Local request error:', err.message);
                });

                req.pipe(proxyReq, { end: true });
                return true;
            }
            return undefined;
        },
    },
};

module.exports = PROXY_CONFIG;
