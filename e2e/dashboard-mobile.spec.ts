import { test, expect, Page } from '@playwright/test';

const mockMe = {
    id: 'u-test-1',
    email: 'test@fintrack.app',
    firstName: 'Test',
    lastName: 'User',
    currency: 'USD',
    createdAt: '2026-01-01',
};

const mockSummary = {
    totalIncome: 7500,
    totalExpense: 3200,
    netSavings: 4300,
    categorySpent: [
        { categoryId: 'cat-1', spent: 1800 },
        { categoryId: 'cat-2', spent: 950 },
        { categoryId: 'cat-3', spent: 450 },
    ],
    recentTransactions: [],
    transactionCount: 8,
};

const mockAccounts = {
    items: [
        {
            id: 'acc-1',
            name: 'Checking Account',
            accountType: 'Bank',
            balance: 14500,
            currency: 'USD',
            icon: '🏦',
            provider: 'Chase',
            color: '#6366f1',
            isClosed: false,
            createdAt: '2026-01-01',
        },
    ],
    totalBalance: 14500,
};

const mockCategories = [
    {
        id: 'cat-1',
        name: 'Dining & Food',
        type: 2, // Expense
        icon: '🍔',
        color: '#f59e0b',
        budgetLimit: 2000,
        userId: 'u-test-1',
    },
    {
        id: 'cat-2',
        name: 'Groceries',
        type: 2, // Expense
        icon: '🛒',
        color: '#10b981',
        budgetLimit: 1200,
        userId: 'u-test-1',
    },
    {
        id: 'cat-3',
        name: 'Transport',
        type: 2, // Expense
        icon: '🚗',
        color: '#3b82f6',
        budgetLimit: 600,
        userId: 'u-test-1',
    },
    {
        id: 'cat-4',
        name: 'Salary',
        type: 1, // Income
        icon: '💰',
        color: '#22c55e',
        budgetLimit: 0,
        userId: 'u-test-1',
    },
];

const mockTransactions = {
    items: [
        {
            id: 'tx-1',
            title: 'Fine Steakhouse',
            amount: 320,
            type: 2,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            timeZoneOffsetInMinutes: 0,
            userId: 'u-test-1',
        },
        {
            id: 'tx-2',
            title: 'Supermarket Weekly',
            amount: 215,
            type: 2,
            categoryId: 'cat-2',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            timeZoneOffsetInMinutes: 0,
            userId: 'u-test-1',
        },
        {
            id: 'tx-3',
            title: 'Salary Inflow',
            amount: 4500,
            type: 1, // Income (should be excluded from top expenses)
            categoryId: 'cat-4',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            timeZoneOffsetInMinutes: 0,
            userId: 'u-test-1',
        },
        {
            id: 'tx-4',
            title: 'Ride Service',
            amount: 45,
            type: 2,
            categoryId: 'cat-3',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            timeZoneOffsetInMinutes: 0,
            userId: 'u-test-1',
        },
        {
            id: 'tx-5',
            title: 'Coffee & Snacks',
            amount: 28,
            type: 2,
            categoryId: 'cat-1',
            accountId: 'acc-1',
            date: new Date().toISOString(),
            timeZoneOffsetInMinutes: 0,
            userId: 'u-test-1',
        },
    ],
    totalCount: 5,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
};

async function setupMockRoutesAndLogin(page: Page) {
    // Intercept Firebase Auth APIs
    await page.route('https://identitytoolkit.googleapis.com/**/accounts:signInWithPassword*', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                kind: 'identitytoolkit#VerifyPasswordResponse',
                localId: 'u-test-1',
                email: 'test@fintrack.app',
                displayName: 'Test User',
                idToken: 'mock-id-token',
                registered: true,
                refreshToken: 'mock-refresh-token',
                expiresIn: '3600',
            }),
        });
    });

    await page.route('https://identitytoolkit.googleapis.com/**/accounts:lookup*', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                kind: 'identitytoolkit#GetAccountInfoResponse',
                users: [
                    {
                        localId: 'u-test-1',
                        email: 'test@fintrack.app',
                        displayName: 'Test User',
                        emailVerified: true,
                        providerUserInfo: [
                            {
                                providerId: 'password',
                                displayName: 'Test User',
                                email: 'test@fintrack.app',
                                federatedId: 'test@fintrack.app',
                            },
                        ],
                    },
                ],
            }),
        });
    });

    await page.route('https://securetoken.googleapis.com/**/token*', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-id-token',
                expires_in: '3600',
                token_type: 'Bearer',
                refresh_token: 'mock-refresh-token',
                id_token: 'mock-id-token',
                user_id: 'u-test-1',
                project_id: 'fintrack-729df',
            }),
        });
    });

    // Intercept Backend FinTrack APIs
    await page.route('**/api/get-me', (route) => route.fulfill({ json: mockMe }));
    await page.route('**/api/get-dashboard-summary**', (route) => route.fulfill({ json: mockSummary }));
    await page.route('**/api/get-accounts**', (route) => route.fulfill({ json: mockAccounts }));
    await page.route('**/api/get-categories**', (route) => route.fulfill({ json: mockCategories }));
    await page.route('**/api/get-plans**', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/get-cashflow**', (route) =>
        route.fulfill({
            json: [
                { label: 'Week 1', income: 4500, expense: 1200 },
                { label: 'Week 2', income: 3000, expense: 2000 },
            ],
        }),
    );
    await page.route('**/api/get-transactions**', (route) => route.fulfill({ json: mockTransactions }));

    // Navigate to /login, sign in, and reach /dashboard
    await page.goto('/login');
    await page.locator('input[formControlName="email"]').fill('test@fintrack.app');
    await page.locator('input[formControlName="password"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // Wait until navigated to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Dashboard Mobile View (Issue #15)', () => {
    test('renders 3-section mobile layout in mobile viewport (390x844)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setupMockRoutesAndLogin(page);

        // Mobile container should be visible, desktop hidden
        const mobileView = page.locator('.dashboard-mobile-view');
        await expect(mobileView).toBeVisible();

        const desktopView = page.locator('.dashboard-desktop-view');
        await expect(desktopView).toBeHidden();

        // 1. Mobile Balance & Expense Card
        const balanceCard = mobileView.locator('app-mobile-balance-card');
        await expect(balanceCard).toBeVisible();
        await expect(balanceCard.locator('.metric-balance')).toContainText('14,500');
        await expect(balanceCard.locator('.metric-expense')).toContainText('3,200');

        // 2. Self-explanatory Donut Chart (Chart Only)
        const donutCard = mobileView.locator('app-mobile-expense-donut');
        await expect(donutCard).toBeVisible();
        await expect(donutCard.locator('svg.mobile-donut-svg')).toBeVisible();
        await expect(donutCard.locator('.donut-segment')).toHaveCount(3);
        await expect(donutCard.locator('.donut-center-hud .hud-amount')).toContainText('3,200');

        // 3. Top Expense Transactions List (4-5 only)
        const topExpenses = mobileView.locator('app-mobile-top-expenses');
        await expect(topExpenses).toBeVisible();
        const expenseCards = topExpenses.locator('.expense-row-card');
        // 4 expenses in mock (income excluded)
        await expect(expenseCards).toHaveCount(4);
        await expect(expenseCards.first()).toContainText('Fine Steakhouse');
        await expect(expenseCards.first().locator('.amount-val')).toContainText('320');
    });

    test('toggles timeframe popover and selects timeframe preset', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setupMockRoutesAndLogin(page);

        const balanceCard = page.locator('app-mobile-balance-card');
        const triggerBtn = balanceCard.locator('.timeframe-toggle-btn');
        const popover = balanceCard.locator('.timeframe-popover');

        // Initially popover is closed
        await expect(popover).toBeHidden();

        // Open popover with force click to avoid mobile header interference
        await triggerBtn.click({ force: true });
        await expect(popover).toBeVisible();

        // Select '7D' preset
        const sevenDaysBtn = popover.locator('.tf-btn', { hasText: '7D' });
        await sevenDaysBtn.click({ force: true });

        // Popover closes and active label updates
        await expect(popover).toBeHidden();
        await expect(balanceCard.locator('.timeframe-tag')).toContainText('7 Days');
    });

    test('interacts with minimal donut chart slices to inspect category in center HUD', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setupMockRoutesAndLogin(page);

        const donutCard = page.locator('app-mobile-expense-donut');
        const centerHud = donutCard.locator('.donut-center-hud');

        // Default HUD shows total
        await expect(centerHud.locator('.hud-label')).toContainText('TOTAL SPENT');
        await expect(centerHud.locator('.hud-amount')).toContainText('3,200');

        // Dispatch pointerdown/click on the first slice (Dining & Food: 1800 / 3200 = 56%)
        const firstSlice = donutCard.locator('.donut-segment').first();
        await firstSlice.dispatchEvent('pointerdown');

        // HUD updates to show category details
        await expect(centerHud.locator('.hud-category-name')).toContainText('Dining & Food');
        await expect(centerHud.locator('.hud-amount')).toContainText('1,800');
        await expect(centerHud.locator('.hud-percent-pill')).toContainText('56% of total');
    });

    test('navigates to transaction detail when tapping top expense card', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setupMockRoutesAndLogin(page);

        const topExpenses = page.locator('app-mobile-top-expenses');
        const firstCard = topExpenses.locator('.expense-row-card').first();
        await firstCard.click({ force: true });

        // Should navigate to transaction detail route
        await expect(page).toHaveURL(/\/transactions\/details\/tx-1/);
    });

    test('dynamically switches layouts between desktop (1280px) and mobile (390px)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await setupMockRoutesAndLogin(page);

        // On desktop viewport
        await expect(page.locator('.dashboard-desktop-view')).toBeVisible();
        await expect(page.locator('.dashboard-mobile-view')).toBeHidden();

        // Switch to mobile viewport
        await page.setViewportSize({ width: 390, height: 844 });

        await expect(page.locator('.dashboard-mobile-view')).toBeVisible();
        await expect(page.locator('.dashboard-desktop-view')).toBeHidden();
    });
});
