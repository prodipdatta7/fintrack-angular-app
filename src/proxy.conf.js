const http = require('http');

const LOCAL_TARGET = 'http://localhost:5000';
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

const PROXY_CONFIG = {
    '/api': {
        target: LOCAL_TARGET,
        secure: false,
        changeOrigin: true,
        router: (req) => {
            if (isLocalAvailable) {
                return LOCAL_TARGET;
            }
            return CLOUD_TARGET;
        },
        onError: (err, req, res) => {
            console.warn('[Proxy Fallback] Local backend error, routing fallback to cloud:', CLOUD_TARGET);
        },
    },
};

module.exports = PROXY_CONFIG;
