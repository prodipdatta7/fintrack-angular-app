# 04 — Dashboard

**Depends on:** [03 Shared Components](03-shared-components.md) · **Backend:** accounts, plans, dashboard
aggregate endpoints · [← Master plan](../../plan.md)

Source: tsx:1225–1412 (shell), 495–634 (accounts hub), 1266–1344 (allocation + targets), 1347–1409 (recent
activity). Entirely new — there is no dashboard in the app today.

Route `/dashboard`, title `Financial Overview`, and the post-login landing page.

---

## Files

```
features/dashboard/dashboard/
├── dashboard.component.{ts,html,scss,spec.ts}          [NEW]
└── components/
    ├── net-balance-hub/                                [NEW]
    ├── expense-allocation/                             [NEW]
    ├── savings-targets/                                [NEW]
    └── recent-activity/                                [NEW]
```

## Composition (top to bottom, tsx:1230–1409)

1. `<app-net-balance-hub>`
2. `<app-cashflow-chart>` (plan 03)
3. Three `<app-stat-card>` in a `1 / 2 / 3`-column responsive grid
4. Two-column row: `<app-expense-allocation>` (spans 2) + `<app-savings-targets>` (spans 1)
5. `<app-recent-activity>`

Container: `.animate-fade-in`, `gap: 1.5rem`, `max-width: 80rem`, centered (tsx:2573).

## `DashboardComponent`

```ts
private readonly dashboardService = inject(DashboardService);
private readonly accountService  = inject(AccountService);
private readonly categoryService = inject(CategoryService);
private readonly planService     = inject(PlanService);

timeframe = signal<Timeframe>('6M');

ngOnInit(): // load summary, accounts, categories, plans, cashflow('6M') — all takeUntilDestroyed
onTimeframeChange(tf) / onCustomRange({from,to}) => dashboardService.getCashflow(...)
```

Stat cards bind to `summary()` (tsx:1240–1263):

| Card | Value | Variant |
|---|---|---|
| Total Net Surplus | `netSavings` | `success` |
| Monthly Income | `+totalIncome` | `primary` |
| Monthly Expenses | `-totalExpense` | `danger` |

---

## 1. `net-balance-hub` (tsx:495–634)

`.card-hero` with the blurred orb. Header row:

- **Live Liquidity Hub** badge — emerald pill, `.animate-pulse-dot` (tsx:517–520).
- `Overall Net Portfolio Balance` label + `accountService.totalBalance()` at 2.25rem `.num`.
- Right: `Verified Sources: N Accounts` in a `.card-inset` (tsx:529–531).

Sub-header: `Balance by Payment & Storage Source` + the hint `Click any card for source analytics →` (tsx:537).

Account grid — `1 / 2 / 4` columns, one card per account (tsx:545–627):

| Element | Detail |
|---|---|
| Icon + name + provider | Emoji `.icon-tile`, name hovers to `--primary` |
| Type badge | `.chip-outline` — `Bank` / `MFS` / `Cash` |
| Balance | `.num` 1.125rem, with a pencil button that appears on hover (`opacity 0 → 1`) |
| Inline edit | Number input + ✓/✕ (tsx:567–592) → `accountService.updateBalance()`, toast `Account balance adjusted`, `$event.stopPropagation()` so the card doesn't navigate |
| Portfolio share | `Portfolio Share` / `N%` + `.progress-track` filled with the account's own `color` |
| Card click | `router.navigate(['/accounts', acc.id])` |

Hover: `border-color: --primary`, `scale(1.02)`, indigo-tinted shadow.

**Keyboard:** the doc's card is a `<div (click)>`. Make it a `<button>`/`role="button"` with `tabindex="0"`
and Enter/Space handling — the inline edit controls stop propagation, so nesting stays valid if the outer
element is a `div[role=button]` rather than a real `<button>`.

## 2. `expense-allocation` (tsx:1266–1312)

`.card-glass`, spans 2 columns. Header: pie ligature + `Expense Allocation Visualizer` + subtitle + a
`Live Tracker` chip. One row per **expense** category:

```
emoji + name                        $spent          (N%)
[========== progress ==========]
```

- `percent = min(round(spent / totalExpense * 100), 100)` — share of total spend, **not** of the cap (tsx:1284).
- Fill color: category color, or `--over-budget` when `budgetLimit > 0 && spent > budgetLimit` (tsx:1304).
- `spent` from `summary().categorySpent`; join on `categoryId`; missing → 0.
- Empty state when there are no expense categories.

## 3. `savings-targets` (tsx:1314–1344)

`.card-glass`. Header: target ligature + `Active Savings Targets`. One `.card-inset` per plan: title,
percent chip, `.progress-fill--gradient`, `$current` / `Goal: $target`. Read-only here — deposits live in
plan 08. Empty state links to `/plans`.

## 4. `recent-activity` (tsx:1347–1409)

`.card-glass` + `.data-table`, `summary().recentTransactions` (5 rows, server-provided).

| Column | Content |
|---|---|
| Transaction | Directional icon tile (up/emerald, down/rose) + title + external-link icon on hover |
| Category | `.chip` with emoji + name |
| Account Source | `.chip-mono` with emoji + name |
| Date | mono |
| Amount | `signedCurrency`, right-aligned |

Row click → `/transactions/details/:id`. Header links to `/transactions`. Horizontal scroll container on
narrow screens.

---

## Responsive

| Breakpoint | Behaviour |
|---|---|
| < 640 px | Everything single column; account cards stack; tables scroll horizontally |
| 640–1024 px | Account grid 2-up; stat cards 2-up; allocation and targets stack |
| ≥ 1024 px | Account grid 4-up; stat cards 3-up; allocation 2/3 + targets 1/3 |

## Loading & Error

- Skeletons for the hub, stat cards and allocation rows while `isLoading`.
- On a failed load: an inline error card with Retry — not a toast (the page has nothing else to show).
- The doc handles neither.

---

## Acceptance Criteria

- [ ] `/dashboard` is the post-login landing route and renders all five sections.
- [ ] Totals come from `/api/dashboard/summary`, never computed client-side.
- [ ] Inline balance edit persists, fires a toast, updates the total **and** every portfolio-share bar.
- [ ] Clicking an account card navigates to its detail page; clicking inside the edit controls does not.
- [ ] Over-budget categories render `--over-budget`.
- [ ] Chart timeframe switches refetch and redraw; `Custom` sends the chosen range.
- [ ] Correct in both themes at all three breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `dashboard.component.spec.ts` | **NEW** — section composition, stat-card binding, timeframe refetch, error state |
| `net-balance-hub.component.spec.ts` | **NEW** — total, share math incl. zero-total guard, inline edit save/cancel, navigation vs. stopPropagation |
| `expense-allocation.component.spec.ts` | **NEW** — percent math, over-budget class, missing-spend fallback |
| `savings-targets.component.spec.ts` | **NEW** — progress %, empty state |
| `recent-activity.component.spec.ts` | **NEW** — 5 rows, row navigation, signed amounts |
