# Design Specification: Admin & Dummy Data Generator Module

- **Date:** 2026-08-15
- **Status:** Approved / Draft
- **Target Application:** FinTrack Angular v20 Client (`fintrack-angular-app`)

---

## 1. Overview & Objective

Provide an administrative data management studio (`/admin`) accessible only to whitelisted administrator emails. This module allows an authorized user to populate realistic, interrelated dummy data across:
1. **Accounts** (Bank, MFS, Cash, Credit Card)
2. **Categories** (Income & Expense with icons, colors, budget limits)
3. **Transactions** (Multi-month distributed realistic transactions linked to generated accounts and categories)
4. **Savings Plans** (Emergency fund, Vacation, Gadget goals)

---

## 2. Authorization & Security

### 2.1 Whitelist Configuration
In `src/environments/environment.ts` and `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  // ... existing configs
  adminEmails: [
    'admin@fintrack.app',
    'prodipdatta7@gmail.com',
    'prodippradhan@gmail.com',
  ],
};
```

### 2.2 AuthService Integration
Add `isAdmin` computed signal on `AuthService`:
```typescript
readonly isAdmin = computed(() => {
  const email = this.currentUser()?.email?.toLowerCase().trim();
  if (!email) return false;
  const whitelist = (environment.adminEmails || []).map((e) => e.toLowerCase().trim());
  return whitelist.includes(email);
});
```

### 2.3 Route Protection (`adminGuard`)
Located at `src/app/core/guards/admin.guard.ts`:
- Awaits `authService.authReady`.
- Checks `authService.isAuthenticated()` and `authService.isAdmin()`.
- If unauthorized, redirects to `/dashboard`.

### 2.4 Sidebar Visibility
The `SidebarComponent` renders the "Admin Studio" navigation item only when `authService.isAdmin()` is `true`.

---

## 3. Data Generator Engine (`AdminDataGeneratorService`)

Located at `src/app/core/services/admin-data-generator.service.ts`.

### 3.1 Dataset Specification
- **Accounts**:
  - *Checking Account*: "City Bank Priority", ৳85,000, Bank, Icon: 🏦, Color: `#4F46E5`
  - *Mobile Financial Service*: "bKash Personal", ৳14,500, MFS, Icon: 📱, Color: `#E11D48`
  - *Cash Wallet*: "Cash / Physical Wallet", ৳5,200, Cash, Icon: 💵, Color: `#10B981`
  - *Credit Card*: "Amex Platinum Card", ৳-18,500, Credit, Icon: 💳, Color: `#8B5CF6`
  
- **Categories**:
  - *Income*: Monthly Salary (💼, `#10B981`), Freelance & Consulting (💻, `#06B6D4`), Investment Dividends (📈, `#3B82F6`)
  - *Expense*: Housing & Rent (🏠, `#F59E0B`), Groceries & Food (🛒, `#EC4899`), Dining & Cafes (☕, `#F97316`), Utilities & Internet (⚡, `#6366F1`), Healthcare (💊, `#EF4444`), Entertainment & Subs (🎬, `#8B5CF6`), Transportation & Fuel (🚗, `#14B8A6`), Shopping & Gadgets (🛍️, `#A855F7`)

- **Transactions**:
  - 40+ chronological transactions distributed evenly across the last 90 days.
  - Linked directly to the real IDs returned by the created accounts and categories.
  - Mix of recurring monthly income (Salary), fixed expenses (Rent, Internet), daily living expenses (Groceries, Dining, Uber/Fuel, Coffee), and periodic shopping.
  - Includes tags (e.g., `#groceries`, `#dining`, `#tech`, `#utility`, `#salary`, `#freelance`) and notes.

- **Savings Plans**:
  - "Emergency Fund": Target ৳150,000, Current ৳75,000, Deadline +6 months.
  - "MacBook Pro Upgrade": Target ৳220,000, Current ৳90,000, Deadline +4 months.
  - "Annual Vacation": Target ৳80,000, Current ৳45,000, Deadline +8 months.

### 3.2 Live Execution State
- `isGenerating`: `Signal<boolean>`
- `progressPercentage`: `Signal<number>` (0 to 100)
- `currentStepMessage`: `Signal<string>`
- `executionLogs`: `Signal<string[]>` (detailed timestamped log output)
- Supports one-click **"Seed Full Financial Profile"** or individual **"Seed Accounts Only"**, **"Seed Categories Only"**, **"Seed Transactions Only"**, **"Seed Savings Plans Only"**.
- Automatically triggers `.getAccounts()`, `.getCategories()`, `.getTransactions()`, `.getPlans()` across core services on completion.

---

## 4. UI Architecture & View (`AdminComponent`)

Located at `src/app/features/admin/admin-dashboard/admin-dashboard.component.ts`.

### Layout:
1. **Header Banner**: Admin identity, glowing admin shield badge, quick explanation.
2. **Current System State Stats**: Live count cards for existing Accounts, Categories, Transactions, and Plans.
3. **Hero 1-Click Seeder**: Large gradient card with "Seed Full Financial Ecosystem" (Creates complete set with 1 click).
4. **Modular Generator Cards Grid**:
   - Accounts Card (Seed 4 Pre-configured Bank/MFS/Cash accounts)
   - Categories Card (Seed 11 Income & Expense categories)
   - Transactions Card (Seed 40+ multi-month distributed transactions)
   - Savings Plans Card (Seed 3 financial goals)
5. **Live Console / Activity Terminal**: Dark glassmorphic log streamer with auto-scroll and status indicators.

---

## 5. Verification Plan

1. **Unit Tests**:
   - `admin.guard.spec.ts`: Test authorized email allows access, unauthorized email redirects to `/dashboard`, unauthenticated user redirects to `/login`.
   - `admin-data-generator.service.spec.ts`: Test step execution, dependency chaining, and signal progress updates.
   - `admin-dashboard.component.spec.ts`: Test button triggers, log rendering, and state binding.
2. **Manual & E2E Validation**:
   - Test navigating to `/admin` as authorized user (Access granted).
   - Test navigating to `/admin` as unauthorized user (Redirects to `/dashboard`).
   - Click "Seed Full Financial Ecosystem" and verify that all accounts, categories, and transactions show up instantly on Dashboard, Accounts, and Transactions pages.
