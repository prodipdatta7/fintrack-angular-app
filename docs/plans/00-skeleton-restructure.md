# 00 — Skeleton Restructure

**Depends on:** nothing · **Blocks:** every other plan · [← Master plan](../../plan.md)

The current skeleton (`core` / `features` / `layout` / `shared`) is sound and stays. This plan makes the
four structural changes the port needs before any component work starts: a splittable stylesheet, three new
feature folders, the layout shell (sticky header + toast host + expanded sidebar), and the routing tree.

---

## 1. Stylesheet: `styles.css` → `src/styles/` partials

`src/styles.css` is 647 lines and will roughly double once the doc's utilities land (plan 01). A single flat
CSS file that large is unworkable, and it can't use SCSS nesting or `@use`.

### Target layout

```
src/
├── styles.scss                 # entry — @use's the partials below, nothing else
└── styles/
    ├── _tokens.scss            # :root + .app-light custom properties
    ├── _base.scss              # reset, body, orbs, grid-overlay, scrollbar, selection, typography
    ├── _material.scss          # all .mat-mdc-* overrides (both themes)
    ├── _utilities.scss         # .card-surface, .btn, .pill, .page-header + plan 01 additions
    └── _animations.scss        # @keyframes + animation utility classes
```

### Steps

1. `git mv src/styles.css src/styles.scss`, then split its contents into the five partials **verbatim** —
   no rule changes in this step, so any visual diff is a mistake.
2. `src/styles.scss` becomes only:
   ```scss
   @use 'styles/tokens';
   @use 'styles/base';
   @use 'styles/material';
   @use 'styles/utilities';
   @use 'styles/animations';
   ```
3. **[MODIFY] `angular.json`** — update `src/styles.css` → `src/styles.scss` in **two** places:
   `projects.fintrack-angular-app.architect.build.options.styles` and `...architect.test.options.styles`.
   Missing the second one silently breaks every spec's styling.
4. Keep the `@import url(...)` Google-Fonts line at the top of `_tokens.scss` — CSS `@import` must precede
   all other rules in the emitted file.
5. Set component style language so new components get `.scss` by default:
   ```json
   "schematics": { "@schematics/angular:component": { "style": "scss" } }
   ```
   (existing components already use `styleUrl: './*.scss'`, so nothing else changes).

**Verify:** `npm run build` and `npm test` both pass; the app looks byte-identical to before the split.

---

## 2. New feature folders

```
src/app/features/
├── dashboard/
│   └── dashboard/                      # DashboardComponent (route target)
│       ├── dashboard.component.{ts,html,scss,spec.ts}
│       └── components/                 # sections used only by the dashboard
│           ├── net-balance-hub/
│           ├── expense-allocation/
│           ├── savings-targets/
│           └── recent-activity/
├── accounts/
│   └── account-detail/                 # AccountDetailComponent (route target)
└── plans/
    └── plan-list/                      # PlanListComponent (route target)
```

**Rule:** a component used by exactly one feature lives under that feature's `components/`. It graduates to
`shared/components/` only on its second consumer. The cashflow chart is shared from day one (dashboard +
account detail); the stat card and toast host are shared by intent.

## 3. New shared / core folders

```
src/app/shared/
├── components/
│   ├── cashflow-chart/
│   ├── stat-card/
│   ├── toast-host/
│   ├── confirm-dialog/
│   └── filter-popover/
├── pipes/
│   └── signed-currency.pipe.ts         # "+$6,200.00" / "-$184.50" — used in ~8 templates
└── utils/
    └── chart-geometry.ts               # pure getX/getY/path builders, unit-testable without a fixture
```

`core/models/` and `core/services/` gain files only — no restructuring (see plan 02).

**No barrel `index.ts` files.** They defeat lazy-chunk splitting and the codebase does not use them today.

---

## 4. Layout shell

### 4.1 `layout/app-layout/` — **[MODIFY]**

The doc's shell is sidebar + sticky header + scrollable content (tsx:2476–2573). Today `app-layout.component.html`
is sidebar + bare `<router-outlet>`.

```html
<div class="app-layout">
    <app-sidebar />
    <main class="main-content">
        <header class="app-header">           <!-- h-16, sticky, backdrop blur (tsx:2547) -->
            <h2 class="app-header-title">{{ pageTitle() }}</h2>
            <button class="btn btn-primary" (click)="newTransaction()">
                <span class="material-icons">add</span> Add Transaction
            </button>
        </header>
        <div class="page-wrap"><router-outlet /></div>
    </main>
</div>
<app-toast-host />
```

- `pageTitle` is a signal derived from the router: subscribe to `NavigationEnd`, walk to the deepest
  activated route, read `data.title`. This replaces the doc's `currentRoute === …` ladder (tsx:2549–2556).
- The **Add Transaction** button navigates to `/transactions/new` (keeps the existing editor route; see plan 06).
- `<app-toast-host>` mounts once here, not per feature.

### 4.2 `layout/sidebar/` — **[MODIFY]**

Per tsx:2484–2544:

| Item | Route | Icon | Badge |
|---|---|---|---|
| Dashboard | `/dashboard` | `dashboard` | — |
| Transactions | `/transactions` | `list_alt` | `transactionService.totalCount()` |
| Categories | `/categories` | `label` | `categoryService.categories().length` |
| Savings Plans | `/plans` | `savings` | — |

- Badge = `.nav-badge` pill, mono, `--surface-inset` background (tsx:2003–2007).
- Brand mark gets the gradient tile treatment (tsx:2487–2493); keep the existing wallet ligature.
- Keep the existing user footer, avatar/initials fallback and logout button as-is.
- Counts come from the already-`providedIn: 'root'` services — no new state.

---

## 5. Routing tree — **[MODIFY] `app.routes.ts`**

| Path | Change | Component | `data.title` |
|---|---|---|---|
| `''` (child) | redirect `transactions` → **`dashboard`** | — | — |
| `dashboard` | **NEW** lazy | `DashboardComponent` | `Financial Overview` |
| `accounts/:id` | **NEW** lazy | `AccountDetailComponent` | `Account Details` |
| `plans` | **NEW** lazy | `PlanListComponent` | `Savings Goals & Planning` |
| `transactions` | add title | — | `Ledger & Transactions` |
| `transactions/new` \| `edit/:id` | add title | — | `Record Transaction` |
| `transactions/details/:id` | add title | — | `Transaction Details` |
| `categories` | add title | — | `Budget Categories` |
| `settings` | add title | — | `Profile & Settings` |

Titles match tsx:2549–2556. `**` → `login` and both guards stay untouched.

> The account-detail title is dynamic in the doc (`${account.name} Details`, tsx:2551). Let the component
> override it by pushing to a `pageTitle` signal on the layout via a small `PageTitleService`, or keep the
> static string — **recommend the static string**; the account name is already the `<h2>` inside the page.

---

## 6. Build config notes

- **`anyComponentStyle` budget is 8 kB (error, not warning).** `settings.component.scss` (424 lines) is
  already near it. Shared visual treatments must land in `_utilities.scss` (plan 01), not per-component.
  If a ported component still exceeds it, split the component. Do not raise the budget without a note here.
- `initial` budget is 1 MB warn / 2 MB error — the port adds no dependencies, so headroom is fine.
- No change needed to `.prettierrc.json`, `.editorconfig`, `.prettierignore`, or `karma.conf.js`.

---

## Acceptance Criteria

- [ ] `npm run build` and `npm test` pass after the stylesheet split, with no visual diff.
- [ ] `angular.json` references `src/styles.scss` in **both** `build` and `test`.
- [ ] Sidebar shows four nav items with live counts on Transactions and Categories.
- [ ] Sticky header renders the correct title on every route and its button reaches the editor.
- [ ] Logging in lands on `/dashboard`.
- [ ] Empty `dashboard`, `accounts/:id` and `plans` route targets resolve without console errors.

## Tests

| Spec | Covers |
|---|---|
| `app-layout.component.spec.ts` | **NEW** — title resolution per route, Add Transaction navigation |
| `sidebar.component.spec.ts` | **NEW** — four links, badge counts render from service signals |
| existing specs | Must stay green through the stylesheet move |
