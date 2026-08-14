# Admin & Dummy Data Generator Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a secure, standalone Admin Studio module (`/admin`) accessible only to whitelisted users that populates rich, realistic dummy data for Accounts, Categories, Transactions, and Savings Plans with real-time feedback.

**Architecture:** An `adminEmails` configuration whitelist in environments + `AuthService.isAdmin` computed signal + functional `adminGuard` provides route-level security. An `AdminDataGeneratorService` orchestrates dependent entity creation across REST endpoints with reactive progress tracking, displayed in an interactive glassmorphic `AdminDashboardComponent` and exposed in the sidebar when authorized.

**Tech Stack:** Angular v20 (Signals, Standalone Components), PrimeNG & Angular Material, RxJS / firstValueFrom, Jasmine / Karma.

## Global Constraints

- **No backend changes required**: Relies on existing API contracts (`/create-account`, `/create-category`, `/create-transaction`, `/create-plan`, `/get-accounts`, etc.).
- **Theme**: Glassmorphic dark theme with vibrant indigo/cyan accents matching the FinTrack design system.
- **Dependency chain**: Accounts & Categories must be created first before generating Transactions to guarantee valid foreign keys (`accountId`, `categoryId`).
- **All tests passing**: Every task ends with verifiable Jasmine/Karma test execution.

---

### Task 1: Environment Whitelist & AuthService `isAdmin` Signal

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.prod.ts`
- Modify: `src/app/core/services/auth.service.ts`
- Modify: `src/app/core/services/auth.service.spec.ts`

**Interfaces:**
- Produces:
  - `environment.adminEmails: string[]`
  - `AuthService.isAdmin: Signal<boolean>`

- [ ] **Step 1: Update environment files with `adminEmails`**

Update `src/environments/environment.ts` and `src/environments/environment.prod.ts` to include:
```typescript
adminEmails: [
    'admin@fintrack.app',
    'prodipdatta7@gmail.com',
    'prodippradhan@gmail.com',
],
```

- [ ] **Step 2: Add `isAdmin` computed signal to `AuthService`**

In `src/app/core/services/auth.service.ts`:
```typescript
import { environment } from '../../../environments/environment';

// Inside AuthService:
readonly isAdmin = computed(() => {
    const email = this.currentUser()?.email?.toLowerCase().trim();
    if (!email) return false;
    const list = (environment.adminEmails || []).map((e) => e.toLowerCase().trim());
    return list.includes(email);
});
```

- [ ] **Step 3: Add unit tests for `isAdmin` in `auth.service.spec.ts`**

Add tests:
- returns `true` when `currentUser().email` is in `adminEmails`
- returns `false` when `currentUser().email` is not in `adminEmails`
- returns `false` when `currentUser()` is `null`

- [ ] **Step 4: Run unit tests**

Run: `npx ng test --include="**/auth.service.spec.ts" --watch=false --browsers=ChromeHeadless`
Expected: PASS

---

### Task 2: Create `adminGuard`

**Files:**
- Create: `src/app/core/guards/admin.guard.ts`
- Create: `src/app/core/guards/admin.guard.spec.ts`

**Interfaces:**
- Produces: `adminGuard: CanActivateFn`
- Consumes: `AuthService.authReady`, `AuthService.isAuthenticated()`, `AuthService.isAdmin()`

- [ ] **Step 1: Write `admin.guard.spec.ts`**

Create `src/app/core/guards/admin.guard.spec.ts` testing:
- allows activation when authenticated and `isAdmin()` is true
- returns UrlTree to `/dashboard` when authenticated but `isAdmin()` is false
- returns UrlTree to `/login` when not authenticated

- [ ] **Step 2: Implement `adminGuard` in `admin.guard.ts`**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authReady.then(() => {
        if (!authService.isAuthenticated()) {
            return router.createUrlTree(['/login'], {
                queryParams: { returnUrl: state.url },
            });
        }

        if (authService.isAdmin()) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    });
};
```

- [ ] **Step 3: Run guard unit tests**

Run: `npx ng test --include="**/admin.guard.spec.ts" --watch=false --browsers=ChromeHeadless`
Expected: PASS

---

### Task 3: Build `AdminDataGeneratorService`

**Files:**
- Create: `src/app/core/services/admin-data-generator.service.ts`
- Create: `src/app/core/services/admin-data-generator.service.spec.ts`

**Interfaces:**
- Consumes: `AccountService`, `CategoryService`, `TransactionService`, `PlanService`, `ToastService`
- Produces:
  - `isGenerating: Signal<boolean>`
  - `progressPercentage: Signal<number>`
  - `currentStep: Signal<string>`
  - `logs: Signal<string[]>`
  - `seedAll(): Promise<void>`
  - `seedAccountsOnly(): Promise<void>`
  - `seedCategoriesOnly(): Promise<void>`
  - `seedTransactionsOnly(): Promise<void>`
  - `seedPlansOnly(): Promise<void>`
  - `clearLogs(): void`

- [ ] **Step 1: Define dummy datasets and generator logic**

Implement `AdminDataGeneratorService` with:
- Predefined Accounts:
  1. City Bank Priority Checking (`Bank`, ৳85,000, `#4F46E5`, 🏦)
  2. bKash Personal (`MFS`, ৳14,500, `#E11D48`, 📱)
  3. Cash / Wallet (`Cash`, ৳5,200, `#10B981`, 💵)
  4. Amex Platinum Card (`Credit`, ৳-18,500, `#8B5CF6`, 💳)
- Predefined Categories:
  - Income (Salary 💼, Freelance 💻, Dividends 📈)
  - Expense (Rent 🏠, Groceries 🛒, Dining ☕, Utilities ⚡, Healthcare 💊, Entertainment 🎬, Transport 🚗, Shopping 🛍️)
- Multi-Month Transactions:
  - 40+ chronological transactions spread across past 90 days.
  - Correctly mapped to created accounts and categories.
  - Realistic amounts, payment methods, tags (`#groceries`, `#dining`, `#tech`, `#bills`), and notes.
- Predefined Savings Plans:
  1. Emergency Fund (৳150,000 target, ৳75,000 current)
  2. MacBook Pro M3 Upgrade (৳220,000 target, ৳90,000 current)
  3. Annual Vacation (৳80,000 target, ৳45,000 current)

- [ ] **Step 2: Write unit tests in `admin-data-generator.service.spec.ts`**

Test:
- `seedAll()` calls `createAccount`, `createCategory`, `createTransaction`, `createPlan` in sequence
- Progress and logs signals update during and after generation
- Handles error gracefully and logs failure

- [ ] **Step 3: Run service unit tests**

Run: `npx ng test --include="**/admin-data-generator.service.spec.ts" --watch=false --browsers=ChromeHeadless`
Expected: PASS

---

### Task 4: Build `AdminDashboardComponent`

**Files:**
- Create: `src/app/features/admin/admin-dashboard/admin-dashboard.component.ts`
- Create: `src/app/features/admin/admin-dashboard/admin-dashboard.component.html`
- Create: `src/app/features/admin/admin-dashboard/admin-dashboard.component.scss`
- Create: `src/app/features/admin/admin-dashboard/admin-dashboard.component.spec.ts`

**Interfaces:**
- Standalone component utilizing `AdminDataGeneratorService`, `AccountService`, `CategoryService`, `TransactionService`, `PlanService`, `AuthService`.

- [ ] **Step 1: Create Component TypeScript logic**

Inject `AdminDataGeneratorService`, `AuthService`, and entity stores. Expose computed counts for current counts and generator actions (`seedAll`, `seedAccounts`, `seedCategories`, `seedTransactions`, `seedPlans`, `clearLogs`).

- [ ] **Step 2: Create Component HTML template**

Include:
- Admin Hero Banner with Shield Icon, admin email tag, and status badge
- Quick Stat Badges: Accounts count, Categories count, Transactions count, Plans count
- Large Featured Action: "Generate Full Financial Profile" (One-Click)
- 4 Modular Action Cards:
  - Accounts Seeder Card
  - Categories Seeder Card
  - Transactions Seeder Card
  - Savings Plans Seeder Card
- Live Execution Console / Terminal with auto-scroll, step progress bar, and "Clear Console" action

- [ ] **Step 3: Create Component SCSS styles**

Glassmorphic dark card styling, terminal window styling (dark backdrop, monospaced font, glow indicators, neon green/cyan step logs), responsive layout grid.

- [ ] **Step 4: Create Component unit tests**

Test:
- Component renders admin info and stat cards
- Triggers generator service methods on button clicks
- Displays execution logs from generator service

- [ ] **Step 5: Run component unit tests**

Run: `npx ng test --include="**/admin-dashboard.component.spec.ts" --watch=false --browsers=ChromeHeadless`
Expected: PASS

---

### Task 5: Routing & Sidebar Navigation Integration

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/layout/sidebar/sidebar.component.html`
- Modify: `src/app/layout/sidebar/sidebar.component.scss`
- Modify: `src/app/layout/sidebar/sidebar.component.spec.ts`

- [ ] **Step 1: Add `/admin` route in `app.routes.ts`**

```typescript
{
    path: 'admin',
    data: { title: 'Admin & Data Studio' },
    canActivate: [adminGuard],
    loadComponent: () =>
        import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
        ),
},
```

- [ ] **Step 2: Update `sidebar.component.html`**

Add conditional "Admin Studio" menu item under `nav-links`:
```html
@if (authService.isAdmin()) {
    <p class="nav-section">Administration</p>
    <a routerLink="/admin" routerLinkActive="active" class="nav-item admin-nav-item">
        <span class="material-icons nav-icon admin-icon">admin_panel_settings</span>
        <span>Admin Studio</span>
        <span class="nav-badge admin-badge">DEV</span>
    </a>
}
```

- [ ] **Step 3: Update `sidebar.component.scss`**

Add accent styling for `admin-nav-item`, `admin-icon`, and `admin-badge` (amber/violet glowing badge).

- [ ] **Step 4: Update `sidebar.component.spec.ts`**

Add tests checking that the Admin Studio nav link appears when `isAdmin()` is true and is hidden when `isAdmin()` is false.

- [ ] **Step 5: Run sidebar tests**

Run: `npx ng test --include="**/sidebar.component.spec.ts" --watch=false --browsers=ChromeHeadless`
Expected: PASS

---

### Task 6: Full Integration Verification & Live Browser Validation

**Files:**
- Run full test suite: `npx ng test --watch=false --browsers=ChromeHeadless`

- [ ] **Step 1: Run all unit tests across the entire application**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`
Expected: All tests pass (0 failures).

- [ ] **Step 2: Verify in the running browser session**

Check `/admin` route, test 1-click seeding, and inspect data propagation into Dashboard, Accounts, and Transactions.

- [ ] **Step 3: Create Walkthrough summary**
