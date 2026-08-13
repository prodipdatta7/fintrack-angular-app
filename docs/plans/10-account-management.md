# 10 — Account Management

**Depends on:** [02 Core Data Layer](02-core-data-layer.md) · [03 Shared Components](03-shared-components.md) ·
**Backend:** `/api/accounts` endpoints (`fintrack-dotnet-app/plan/feature-design-port-backend-1.md`) ·
[← Master plan](../../plan.md)

The `Account` model, `AccountService` and the `/accounts/:id` detail page (plan 05) already exist, but there is
no way to *manage* payment & income sources: no list page, no create/edit dialog, no sidebar entry, and the
service's `createAccount` / `updateAccount` / `deleteAccount` have zero UI callers. The backend module is a
stub — every `/api/accounts` route 404s today. This plan adds the management surface on both sides.

---

## A. Account List — **[NEW]** `features/accounts/account-list/`

Route `/accounts`, title `Payment & Income Sources`, lazy `loadComponent`, registered **before** `accounts/:id`.

### A1. Header
`Payment & Income Sources` + subtitle, total-balance stat (non-closed accounts only), primary **New Account**
button on the right. Keep the categories-style search field.

### A2. Card grid — `1 / 2 / 3` columns

```
┌──────────────────────────────────────────┐
│ [icon]  Name                  [edit] [x] │
│         {Bank|MFS|Cash|Credit} chip      │
│ Provider                                 │
│ $1,234.56                    18% share   │
│ [=====·····]  ← share bar, account color │
└──────────────────────────────────────────┘
```

| Element | Detail |
|---|---|
| Icon | `.icon-tile`, emoji from `account.icon` |
| Type | `.chip-outline` badge (`Bank` / `MFS` / `Cash` / `Credit`) |
| Share | `AccountService.portfolioShare()`, bar tinted by `account.color` |
| Closed | `Closed` chip; card renders muted; **Reopen** action replaces edit/close |
| Card click | → `/accounts/:id` (existing detail page) |

### A3. Close / reopen — no hard delete

Transactions soft-reference `accountId`, so accounts are **never hard-deleted** (backend plan ALT-003).

- **Close** (active cards): `ConfirmDialogService.confirmDelete(...)` → `setAccountStatus(id, true)` → toast + refetch.
- **Reopen** (closed cards): `setAccountStatus(id, false)` → toast + refetch.
- List fetches `getAccounts(includeClosed: true)`; closed cards hidden behind a **Show closed** toggle (default off).
- Closed accounts stay out of the dashboard hub, transaction-editor picker and `totalBalance`.

---

## B. Account Form Dialog — **[NEW]** `features/accounts/account-form-dialog/`

Custom `.modal-overlay` / `.modal-content card-glass` overlay (category-form-dialog pattern) with the plans
variant's `(saved)` output — the parent refetches.

| Field | Control | Notes |
|---|---|---|
| Name | text, required, ≤ 60 | |
| Type | select: `Bank` / `MFS` / `Cash` / `Credit` | string values — no `Number()` coercion |
| Provider | text | e.g. `City Bank`, `bKash` |
| Icon | emoji text, default `🏦` | |
| Color | color picker + hex text | drives share bar |
| Currency | select: `USD` / `BDT` / `EUR` / `GBP`, default `USD` | |
| Opening Balance | number ≥ 0 | **create mode only** — edits go through the inline `PATCH /balance` flow; `PUT` never carries balance |

Dual create/edit mode via `@Input() account`; `isSubmitting` flag; `.error-banner` reads `err.error?.error`;
toast on success.

---

## C. API Contract (backend: `FinTrack.Modules.Accounts`)

| Endpoint | Notes |
|---|---|
| `GET /api/accounts?includeClosed=false` | `{ items: AccountDto[], totalBalance }`, sorted by `createdAt`; `totalBalance` always sums non-closed only |
| `GET /api/accounts/{id}` | returns closed accounts too (detail page renders them read-only) |
| `POST /api/accounts` | 201, `{ accountId }` envelope |
| `PUT /api/accounts/{id}` | name/type/provider/icon/color/currency — **no balance** |
| `PATCH /api/accounts/{id}/balance` | `{ balance ≥ 0 }`; rejected when closed |
| `PATCH /api/accounts/{id}/status` | `{ isClosed }` — close **and** reopen |
| `DELETE /api/accounts/{id}` | alias for close (soft delete) |

`AccountDto`: `id, name, accountType, balance, currency, icon, provider, color, isClosed, createdAt`.
Registering a user seeds 4 zero-balance defaults (`Bank Account`, `bKash Wallet`, `Nagad Wallet`, `Cash in Hand`).

---

## D. Shell changes

- **Sidebar** — new nav item after Dashboard: `account_balance` ligature, label `Accounts`, badge = count of
  non-closed accounts. ⚠️ **Documented deviation:** [00-skeleton-restructure.md](00-skeleton-restructure.md)
  pins the sidebar at 4 items; this makes it 5.
- **Dashboard hub** — the empty state (`No payment sources yet`) gains a **Manage accounts** button → `/accounts`.
- **`AccountService`** — `getAccounts(includeClosed)`, `setAccountStatus(id, isClosed)` (replaces
  `deleteAccount`), `createAccount` unwraps the `{ accountId }` envelope, `totalBalance` filters `!isClosed`.

---

## Acceptance Criteria

- [ ] `/accounts` lists cards with type chip, provider, balance, tinted share bar; search filters.
- [ ] New Account dialog creates; card appears; sidebar badge increments.
- [ ] Edit pre-fills, has no balance field, and persists without touching balance.
- [ ] Close (with confirm) hides the account from the dashboard hub, transaction-editor picker and totals;
      it appears under Show closed with a `Closed` chip and can be reopened.
- [ ] Closed account detail page stays read-only (existing plan-05 behaviour); balance PATCH on closed → error.
- [ ] Fresh registration seeds 4 zero-balance accounts.
- [ ] Both themes, all breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `account-list.component.spec.ts` | **NEW** — renders cards, search filters, Show closed toggle, close gated on confirm, reopen calls service |
| `account-form-dialog.component.spec.ts` | **NEW** — create vs edit mode, balance field only on create, validation, toast + saved on success |
| `account.service.spec.ts` | **MODIFY** — `includeClosed` param, `{ accountId }` envelope, `setAccountStatus` patches signal, `totalBalance` excludes closed |
| Backend validator tests | **NEW** — Create/Update/UpdateBalance validators (name, type whitelist, balance ≥ 0, hex color) |

## Follow-ups (out of scope)

- Wire `ValidateAccountExistsQuery` into transaction creation so closed accounts reject new transactions server-side.
- Edit affordance on the account detail page.
