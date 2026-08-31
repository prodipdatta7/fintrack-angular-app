import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    reporter: 'list',
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:4200',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 13'] },
        },
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
