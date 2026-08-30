const http = require('http');

const LOCAL_TARGET = 'http://127.0.0.1:5000';
const CLOUD_TARGET = 'https://fintrack-api-557447503156.us-central1.run.app';

let isLocalAvailable = false;

function probeLocalServer() {
    const req = http.request(
        {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/health',
            method: 'GET',
            timeout: 800,
        },
        (res) => {
            isLocalAvailable = res.statusCode >= 200 && res.statusCode < 500;
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

// Initial probe and background heartbeat
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
        router: () => {
            return isLocalAvailable ? LOCAL_TARGET : CLOUD_TARGET;
        },
    },
};

module.exports = PROXY_CONFIG;
