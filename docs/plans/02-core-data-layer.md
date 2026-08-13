# 02 — Core Data Layer

**Depends on:** [00 Skeleton](00-skeleton-restructure.md) · **Blocks:** 03–08 · [← Master plan](../../plan.md)

Models and services for the three concepts the doc introduces (accounts, savings plans, dashboard
aggregates) plus toasts, and the deltas to existing models. Every new service mirrors `CategoryService`:
`providedIn: 'root'`, signal state, `Observable` returns, `finalize` on the loading flag.

---

## 1. New Models

### `core/models/account.model.ts` — **[NEW]**
Source: tsx:116–121, 545–627. Backend: `FinTrack.Modules.Accounts.Domain.Account` (+ fields added by the backend plan).

```ts
export type AccountType = 'Bank' | 'MFS' | 'Cash' | 'Credit';

export interface Account {
    id: string;
    name: string;
    accountType: AccountType;
    balance: number;
    currency: string;       // backend default 'USD'
    icon: string;           // emoji, e.g. '🏦'
    provider: string;       // 'City Bank / Chase'
    color: string;          // '#6366f1' — portfolio-share bar
    isClosed: boolean;
    createdAt: string;      // "Date Added" (tsx:874)
}

export interface CreateAccountRequest { name; accountType; balance; currency; icon; provider; color }
export interface UpdateAccountRequest extends CreateAccountRequest { id: string }
export interface UpdateBalanceRequest { balance: number }
```

> Doc field `type` → `accountType` (matches the C# entity and avoids colliding with `CategoryType`).
> Doc field `addedDate` → `createdAt` from `AuditableEntity` — no duplicate field.

### `core/models/plan.model.ts` — **[NEW]**
Source: tsx:212–216, 1894–1987.

```ts
export interface SavingsPlan {
    id: string;
    title: string;
    targetAmount: number;   // doc: target
    currentAmount: number;  // doc: current
    color: string;
    deadline: string;       // ISO date
}
export interface CreatePlanRequest { title; targetAmount; currentAmount; color; deadline }
export interface UpdatePlanRequest extends CreatePlanRequest { id: string }
export interface DepositRequest { amount: number }
```

### `core/models/dashboard.model.ts` — **[NEW]**
Source: tsx:2288–2312 (summary), 226–324 (series).

```ts
export type Timeframe = '7D' | '15D' | '30D' | '60D' | '6M' | '1Y' | 'Custom';

export interface CategorySpend { categoryId: string; spent: number }

export interface DashboardSummary {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categorySpent: CategorySpend[];
    recentTransactions: Transaction[];   // 5
}

export interface CashflowPoint { label: string; income: number; expense: number }
```

## 2. Model Deltas

| File | Change | Why |
|---|---|---|
| `core/models/category.model.ts` | `budgetLimit: number` on `Category`, `CreateCategoryRequest`, `UpdateCategoryRequest` | Budget caps (tsx:108–113, 1857–1882) |
| `core/models/transaction.model.ts` | `note?: string` on `Transaction` + both request types | Doc's Notes / Invoice Tag field (tsx:2124) and the notes memorandum (tsx:1183) |
| `core/models/transaction-event.model.ts` | `performedBy: string`, `detail: string` | Audit timeline shows Operator + detail (tsx:1211–1212) |

`0` means "no limit" for `budgetLimit`, matching tsx:1862.

---

## 3. New Services

### `core/services/account.service.ts` — **[NEW]**

```ts
accounts = signal<Account[]>([]);
isLoading = signal(false);
totalBalance = computed(() => this.accounts().reduce((s, a) => s + a.balance, 0));   // tsx:499
```

| Method | HTTP |
|---|---|
| `getAccounts()` | `GET /accounts` → sets `accounts` |
| `getAccountById(id)` | `GET /accounts/{id}` |
| `createAccount(req)` | `POST /accounts` |
| `updateAccount(req)` | `PUT /accounts/{id}` |
| `updateBalance(id, balance)` | `PATCH /accounts/{id}/balance` → patches the signal in place on success (inline edit, tsx:503, 831) |
| `deleteAccount(id)` | `DELETE /accounts/{id}` |

`portfolioShare(accountId)` helper — `Math.round(balance / totalBalance * 100)`, guarded against a zero
total (tsx:541).

### `core/services/plan.service.ts` — **[NEW]**

`plans` + `isLoading` signals; `getPlans`, `createPlan`, `updatePlan`, `deposit(id, amount)`, `deletePlan`.
`deposit` patches `currentAmount` in the signal on success rather than refetching (tsx:1902).

### `core/services/dashboard.service.ts` — **[NEW]**

```ts
summary = signal<DashboardSummary | null>(null);
cashflow = signal<CashflowPoint[]>([]);
isLoadingSummary = signal(false);
isLoadingCashflow = signal(false);

getSummary(from?, to?)                                  // GET /dashboard/summary
getCashflow(timeframe, opts?: { from?, to?, accountId? })  // GET /dashboard/cashflow
```

The account-detail chart calls `getCashflow` with `accountId` — same endpoint, no second service.

> **Do not** reimplement the doc's client-side `metrics` memo (tsx:2288–2312) or its synthetic fallbacks
> (tsx:243, 260, 271, 284, 291, 308, 660). The API is paginated; totals computed over one page are wrong.

### `core/services/toast.service.ts` — **[NEW]**

Replaces the doc's `showToast` (tsx:2262) and the current `window.confirm` side-channel.

```ts
export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: number; message: string; type: ToastType }

toasts = signal<Toast[]>([]);
show(message: string, type: ToastType = 'success'): void   // auto-dismiss after 3000ms
dismiss(id: number): void
```

Use an incrementing counter for ids, not `Date.now()` (two toasts in the same millisecond would collide).
Clear pending timers on dismiss.

## 4. Service Deltas

| File | Change |
|---|---|
| `core/services/transaction.service.ts` | Extend `getTransactions()` with `accountId`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy` params (plan 06 needs server-side filtering — the doc filters in memory, tsx:1471–1516) |
| `core/services/category.service.ts` | No signature change; `budgetLimit` flows through the existing DTOs. Add `deleteCategory(id)` only if the backend exposes it — the doc has no delete affordance, so **skip** |

---

## Acceptance Criteria

- [ ] Every new service is `providedIn: 'root'` with signal state and mirrors `CategoryService`'s shape.
- [ ] `totalBalance` recomputes when a single account balance is patched, without a refetch.
- [ ] `ToastService.show` auto-dismisses at 3 s and survives rapid successive calls.
- [ ] `TransactionService.getTransactions` omits undefined params entirely (no `&minAmount=` in the URL).
- [ ] No client-side aggregation of totals anywhere.

## Tests

| Spec | Covers |
|---|---|
| `account.service.spec.ts` | **NEW** — `HttpTestingController`: list/get/create/update/delete, `totalBalance` computed, in-place balance patch |
| `plan.service.spec.ts` | **NEW** — CRUD + deposit patching `currentAmount` |
| `dashboard.service.spec.ts` | **NEW** — summary + cashflow param serialisation incl. `accountId` and custom range |
| `toast.service.spec.ts` | **NEW** — `fakeAsync` + `tick(3000)` auto-dismiss, unique ids, manual dismiss cancels the timer |
| `transaction.service.spec.ts` | **MODIFY** — new query params present/absent |
