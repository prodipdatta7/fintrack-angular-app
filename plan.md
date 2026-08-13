# FinTrack Design Port — Master Plan

Port `docs/fintrack_financial_expenses_planning_app.tsx` (2,687 lines, React + Tailwind) into the Angular v20
client, with supporting API work in `D:\Local-Projects\fintrack-dotnet-app`.

The `.tsx` file is the **visual and behavioural source of truth**. Every module, view, interaction and visual
treatment in it ships. Line references throughout (`tsx:NNN`) point at the exact source block to port.

This file is the index. Each module has its own plan under `docs/plans/`.

---

## Plan Index

| # | Plan | Scope | Depends on |
|---|---|---|---|
| 00 | [Skeleton Restructure](docs/plans/00-skeleton-restructure.md) | Folder layout, `styles.scss` split, `angular.json`, routing tree, layout shell, naming conventions | — |
| 01 | [Design System](docs/plans/01-design-system.md) | Tailwind→token translation, new CSS variables, global utilities, animations, typography | 00 |
| 02 | [Core Data Layer](docs/plans/02-core-data-layer.md) | Models + services for accounts, plans, dashboard, toast; model deltas | 00 |
| 03 | [Shared Components](docs/plans/03-shared-components.md) | Cashflow chart, stat card, toast host, confirm dialog, filter popover, table/chip/progress primitives | 01, 02 |
| 04 | [Dashboard](docs/plans/04-dashboard.md) | Net-balance hub, cashflow chart, stat cards, expense allocation, savings targets, recent activity | 03 |
| 05 | [Accounts](docs/plans/05-accounts.md) | Account detail page, per-account cashflow, source ledger table | 03 |
| 06 | [Transactions](docs/plans/06-transactions.md) | List + advanced filter popover, detail + audit timeline, editor restyle | 03 |
| 07 | [Categories](docs/plans/07-categories.md) | Budget caps, spend progress, over-budget state, form dialog | 03 |
| 08 | [Savings Plans](docs/plans/08-savings-plans.md) | Plans grid, deposit flow | 03 |
| 09 | [Auth](docs/plans/09-auth.md) | Glass auth portal, segmented Sign In / Create Account | 01 |
| 10 | [Account Management](docs/plans/10-account-management.md) | Accounts list, form dialog, close/reopen, sidebar entry | 02, 03 |
| — | **Backend:** `fintrack-dotnet-app/plan/feature-design-port-backend-1.md` | Accounts module, Savings Plans module, Dashboard aggregates, category budget caps, event enrichment | — |

---

## Decisions Locked In

| # | Decision | Consequence |
|---|---|---|
| 1 | **Styles are translated to SCSS + CSS custom properties**, not Tailwind. | No new build dependency. Every hard-coded Tailwind color in the doc routes through a token, so new screens work in the existing `.app-light` theme (the doc is dark-only). Costs more manual work per component — budget for it. |
| 2 | **Backend is in scope.** Accounts and Savings Plans get real .NET modules and endpoints. | `FinTrack.Modules.Accounts` has only a domain entity + validation handler today; `Budgets` and `Dashboard` are empty DI shells. All three get filled in. |
| 3 | **Existing transaction screens are restyled, not replaced.** | The doc's 6-field transaction modal is *narrower* than what exists (attachments, tags, receipt upload, clock time picker, timezone offset). Adopt the doc's chrome and visual language; keep every existing capability. |

---

## Gap Analysis — Doc vs. Codebase

| Doc module | tsx | Current state | Plan |
|---|---|---|---|
| Dashboard shell | 1225–1412 | **Missing** | 04 |
| Net portfolio / accounts hub | 495–634 | Missing | 04 |
| Income vs Expense chart | 218–493 | Missing | 03 |
| Stat cards (×3) | 1414–1425 | Missing | 03 |
| Expense allocation bars | 1266–1312 | Missing | 04 |
| Active savings targets | 1314–1344 | Missing | 04 |
| Recent ledger activity | 1347–1409 | Missing | 04 |
| Account detail page | 795–1040 | **Missing** | 05 |
| Account cashflow chart | 636–793 | Missing | 03, 05 |
| Transactions list + advanced filter | 1427–1809 | Exists (Material table, 3 basic filters) | 06 |
| Transaction detail + audit trail | 1042–1223 | Exists | 06 |
| Transaction form modal | 2012–2153 | Exists as a 484-line full-page editor | 06 |
| Categories grid + budget caps | 1811–1892 | Exists, no caps | 07 |
| Category form modal | 2155–2238 | Exists as dialog | 07 |
| Savings Plans page | 1894–1987 | **Missing** | 08 |
| Sidebar nav + badges | 2484–2544 | Exists, 2 items, no badges | 00 |
| Sticky header + Add Transaction | 2547–2571 | Missing | 00 |
| Toast notifications | 2477–2482 | Missing (`window.confirm`) | 02, 03 |
| Auth portal | 2387–2473 | Two separate routed pages | 09 |

---

## Order of Work

```
00 skeleton ──► 01 design system ──┐
      └────────► 02 core data ─────┴──► 03 shared components
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                  04 dashboard          06 transactions        07 categories
                        ▼                                            
                  05 accounts           08 savings plans        09 auth (needs 01 only)
```

Backend gating: Accounts + Plans endpoints must land before 04/05/08 show real data; dashboard aggregates
before 03's live series; event enrichment before 06's operator column.

---

## Cross-Cutting Conventions

Per `AGENTS.md` and existing code — every plan assumes these:

- Standalone components, `inject()`, signals + `computed()`, `@if`/`@for` control flow.
- `templateUrl` + `styleUrl` always — never inline templates or styles.
- `takeUntilDestroyed(destroyRef)` on every subscription.
- Prettier: 4-space indent, 120 columns, single quotes.
- `CategoryType.Income = 0 / Expense = 1` stays — the doc's `'income' | 'expense'` strings do not come across.
- No new runtime dependencies.

---

## Verification

```bash
# Frontend
npm test                 # ng test --watch=false --browsers=ChromeHeadless
npm run build            # production build — watch the 8kB component-style budget
npx prettier --check .

# Backend
dotnet test D:\Local-Projects\fintrack-dotnet-app\FinTrack.slnx
```

Manual pass, **both themes** (toggle in `/settings`) at 375 px / 768 px / 1440 px:

1. Log in → land on **Dashboard**; totals, allocation bars and savings targets populate.
2. Every chart timeframe (`7D 15D 30D 60D 6M 1Y Custom`); hover shows the three-row tooltip.
3. Inline-edit an account balance from the hub → toast fires, figure persists after reload.
4. Click an account card → detail page, chart, filtered ledger.
5. Transactions → Advance Filter: set 4 filters, confirm badge count, Clear Filters resets.
6. Open a transaction → hero card + audit timeline with operator names.
7. Categories → set a budget cap, overspend it, confirm the red over-budget bar.
8. Plans → deposit, watch the progress bar and toast.
9. Sign out → restyled auth portal; toggle Sign In ⇄ Create Account.

---

## Cross-Cutting Risks

1. **8 kB component-style budget.** `angular.json` sets `anyComponentStyle` `maximumError: 8kB`, and
   `settings.component.scss` is already 424 lines. Shared treatments live in global utilities (plan 01); if a
   component still exceeds it, split the component rather than raising the budget.
2. **Light theme.** The doc is dark-only. Every new surface must be re-checked under `.app-light` — the main
   extra cost of the SCSS approach, and its main payoff.
3. **No fabricated chart data.** The doc synthesises values for empty buckets (`inc || (150 + Math.sin(i) * 50)`,
   tsx:243, 260, 271, 284, 291, 308, 660). That is demo scaffolding, not a feature. Real buckets, real zeros.
4. **Client-side aggregation.** The doc sums all transactions in memory (tsx:2288–2312). With a paginated API
   those totals are wrong — aggregates come from the backend.
5. **Hard-coded "today".** The doc pins `new Date('2026-08-10')` (tsx:227). Use the real current date.
6. **Fake verification data.** `Status: Verified` and `Verification Hash: 0x8f3a...b921` (tsx:1106, 1173) are
   mock strings. Ported literally they mislead — plan 06 replaces them with real id/timestamps.
7. **Emoji vs Material icons.** The doc uses emoji (`🏠`, `🏦`); the app uses `material-icons` ligatures.
   Forms accept a free-text emoji field per the doc; render emoji when present, fall back to the ligature.
