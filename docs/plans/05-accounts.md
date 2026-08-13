# 05 — Accounts

**Depends on:** [03 Shared Components](03-shared-components.md), [04 Dashboard](04-dashboard.md) (entry point)
· **Backend:** accounts endpoints · [← Master plan](../../plan.md)

Source: tsx:795–1040 (detail view), 636–793 (per-account chart — satisfied by the shared chart from plan 03).

The app has no accounts UI at all today; `accountId` exists on `Transaction` but is never surfaced.

---

## Files

```
features/accounts/account-detail/
└── account-detail.component.{ts,html,scss,spec.ts}      [NEW]
```

Route `accounts/:id`, title `Account Details`, lazy-loaded.

## Component

```ts
private readonly accountService     = inject(AccountService);
private readonly transactionService = inject(TransactionService);
private readonly categoryService    = inject(CategoryService);
private readonly dashboardService   = inject(DashboardService);
private readonly toast              = inject(ToastService);

accountId = input.required<string>();          // withComponentInputBinding, or route param
account   = signal<Account | null>(null);
search    = signal('');
typeFilter = signal<CategoryType | undefined>(undefined);
isEditingBalance = signal(false);
```

Load on init: `getAccountById`, transactions filtered by `accountId` (**server-side** — pass `accountId` to
`getTransactions`; the doc filters in memory at tsx:811), categories, and `getCashflow('6M', { accountId })`.

---

## Layout (tsx:836–1038)

### 1. Action row (tsx:838–856)
`← Back to Dashboard` ghost button, and `Record {account.name} Entry` primary button →
`/transactions/new?accountId=:id` (the editor pre-selects the account).

### 2. Hero card (tsx:858–932) — `.card-hero`

| Element | Detail |
|---|---|
| Icon tile | 4rem `.icon-tile--lg`, emoji |
| Name | 1.5rem/800 + `.chip-outline` `{type} Source` |
| Meta | `Provider: X` · `Date Added: {createdAt \| date}` |
| Balance panel | `.card-inset`, `Current Balance` label, 1.5rem `.num`, pencil → inline edit with ✓/✕ → `updateBalance()` + toast |

Four `.stat-tile`s below a divider (tsx:912–931):

| Tile | Value | Color |
|---|---|---|
| Total Source Inflows | `+sum(income)` | `--success-strong` |
| Total Source Outflows | `-sum(expense)` | `--danger-strong` |
| Net Source Movement | `inflow - outflow` | `--primary-soft` |
| Processed Ledgers | `N Entries` | `--text-primary` |

> The doc computes these from the in-memory list (tsx:823–829). With pagination that is wrong — take them
> from `/api/dashboard/summary?accountId=…`. If the backend lands the summary endpoint without an
> `accountId` filter, add it there rather than summing on the client.

### 3. `<app-cashflow-chart>` (tsx:934)

Title `Source Cashflow Dynamics`, subtitle `Historical inflow vs outflow processed through this specific
method`, labels `Inflow` / `Outflow`, `showNetRow=false`, `floor=500`, timeframes without `Custom`
(tsx:640) — matching the doc's account variant exactly.

### 4. Source ledger (tsx:936–1037) — `.card-glass`

Header: `Source Ledgers & Activity` + `Click any transaction to open its dedicated page`; right side a
search input (`Search description...`, 12rem) and a type `<select>` (All / Expenses Only / Income Only).

`.data-table` columns: Transaction Title (+ note line, + external-link icon on hover) · Category `.chip` ·
Date (mono) · Amount (`signedCurrency`, right) · Actions (edit → `/transactions/edit/:id`, delete → confirm
dialog + toast; both `$event.stopPropagation()`).

Row click → `/transactions/details/:id`. Empty state: receipt icon + `No matching transactions found for
this account`.

Search debounced 300 ms and sent as `searchTerm` to the API; the doc filters in memory (tsx:815–821).

---

## Deletion & Navigation Edge Cases (not handled by the doc)

- Unknown or foreign `:id` → error card with `Back to Dashboard`, not a blank page.
- Deleting the last transaction leaves the ledger empty but keeps the hero card.
- `isClosed` accounts render read-only with a `Closed` chip; balance edit is hidden.

---

## Acceptance Criteria

- [ ] `/accounts/:id` reachable from every account card on the dashboard.
- [ ] Inflow/outflow/net/count come from the API, not client sums.
- [ ] Chart shows only this account's flow and matches the doc's account variant (no Custom, `Inflow`/`Outflow` labels, no Net row).
- [ ] Search + type filter hit the API and reset paging.
- [ ] Edit and delete work from the row without triggering row navigation; delete goes through the confirm dialog.
- [ ] Balance edit persists and updates the dashboard total on return.
- [ ] Unknown id shows the error card.
- [ ] Correct in both themes at all breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `account-detail.component.spec.ts` | **NEW** — load by id, stat tiles from summary, search debounce + type filter params, row navigation, delete confirm flow, balance edit, unknown-id error state |
