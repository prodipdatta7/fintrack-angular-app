# 03 — Shared Components

**Depends on:** [01 Design System](01-design-system.md), [02 Core Data](02-core-data-layer.md) ·
**Blocks:** 04–08 · [← Master plan](../../plan.md)

Five reusable components plus one pipe. The cashflow chart is the highest-fidelity-risk piece in the whole
port — its geometry is ported verbatim.

---

## 1. `shared/components/cashflow-chart/` — **[NEW]**

Source: tsx:218–493 (dashboard variant) and tsx:636–793 (account variant). They are the same chart with
different titles, timeframe sets, tooltip labels and floor value — **one component, parameterised**.

### API

```ts
@Input({ required: true }) points!: CashflowPoint[];
@Input() title = 'Cashflow Dynamics (Income vs Expense)';
@Input() subtitle = 'Real-time revenue inflows compared against expenditure';
@Input() timeframes: Timeframe[] = ['7D','15D','30D','60D','6M','1Y','Custom'];
@Input() activeTimeframe: Timeframe = '6M';
@Input() showLegend = true;
@Input() showNetRow = true;                 // dashboard shows Net Surplus, account variant does not
@Input() labels = { income: 'Income', expense: 'Expenses' };   // account: 'Inflow' / 'Outflow'
@Input() floor = 1000;                      // account variant uses 500 (tsx:666)
@Input() isLoading = false;

@Output() timeframeChange = new EventEmitter<Timeframe>();
@Output() customRangeChange = new EventEmitter<{ from: string; to: string }>();
```

### Geometry — port verbatim from tsx:326–351

Put the pure math in `shared/utils/chart-geometry.ts` so it is unit-testable without a fixture:

```
width = 800, height = 220, padding = 35
maxVal = max(all income, all expense, floor) * 1.15
getX(i)  = padding + i * (width - 2*padding) / max(n - 1, 1)
getY(v)  = height - padding - (v / maxVal) * (height - 2*padding)

smoothPath(key):  reduce over points
  i === 0 -> `M x,y`
  else    -> `C cp1x,prevY cp2x,y x,y`  where cp1x = cp2x = prevX + (x - prevX) / 2

areaPath(path) = `${path} L ${getX(n-1)},${height-padding} L ${getX(0)},${height-padding} Z`
gridlines at [0, .33*maxVal, .66*maxVal, maxVal], stroke --chart-grid, stroke-dasharray "4 4"
```

### Rendering

- `<svg [attr.viewBox]="'0 0 800 220'">`, responsive width, `overflow: visible`.
- Two `<linearGradient>` fills — **ids must be unique per component instance**. The doc gets away with
  `incomeGlow` vs `accIncomeGlow` (tsx:419, 723) because only one chart renders at a time; in Angular both
  can coexist. Generate a suffix in the constructor (`chart-${++CashflowChartComponent.nextId}`) and bind
  `fill="url(#income-{{uid}})"`.
- Income: `--chart-income`, 0.35→0 gradient, 3px stroke. Expense: `--chart-expense`, 0.25→0, 3px.
- Per-point `<g>` with `(mouseenter)`/`(mouseleave)` setting a `hoveredIndex` signal:
  crosshair line (`--chart-crosshair`, dash `2 2`) + dots `r` 4→6 with a 2px `--chart-dot-ring` stroke
  (tsx:453–458), plus the mono x-axis label at `y = height - 8`.
- Tooltip: absolutely positioned div, `.card-glass`, `pointer-events: none`, rows Income / Expense /
  Net Surplus; `left` clamped to `5%–75%` exactly as tsx:471.
- Timeframe segmented control: `--surface-inset` track, active pill `--primary-deep` (tsx:376–388).
- `Custom` reveals the From/To date row (tsx:392–414) and emits `customRangeChange`.
- Loading: skeleton shimmer over the plot area, controls still interactive.
- Empty (`points.length === 0`): centered "No activity in this period" — the doc never handles this because
  it fabricates data.

### Accessibility (not in the doc — add it)

`role="img"` + `aria-label` summarising the series; a visually-hidden `<table>` of the same points so the
data is reachable without hover; timeframe buttons are real `<button>`s with `aria-pressed`.

---

## 2. `shared/components/stat-card/` — **[NEW]**

Source: tsx:1414–1425.

```ts
@Input({ required: true }) title!: string;
@Input({ required: true }) amount!: string;
@Input() subtitle = '';
@Input() icon = '';                                    // material ligature
@Input() variant: 'success' | 'primary' | 'danger' = 'primary';
```

Gradient background + border tint driven by `variant` (`.stat-card--success|--primary|--danger`), icon in a
`.icon-tile`, `.num` figure at 1.5rem/800. Three instances on the dashboard (tsx:1240–1263).

---

## 3. `shared/components/toast-host/` — **[NEW]**

Source: tsx:2477–2482. Reads `ToastService.toasts()`; fixed top-right stack, `z-index` above the sticky
header, `.animate-toast-in`, check/error/info ligature, colored left border by type, click to dismiss.
Mounted once in `AppLayoutComponent` (plan 00).

**Do not** use the doc's `animate-bounce` — a continuously bouncing toast is a distraction; use the slide+fade
defined in plan 01.

---

## 4. `shared/components/confirm-dialog/` — **[NEW]**

The doc has no confirm dialog (it deletes immediately, tsx:1078), but the codebase currently uses
`window.confirm` (`transaction-list.component.ts:104`). Replace both with one styled dialog.

`MatDialog`-based, `.animate-scale-up`, inputs `{ title, message, confirmLabel, danger }`, returns boolean.
Used by transaction delete (plan 06) and any future destructive action.

---

## 5. `shared/components/filter-popover/` — **[NEW]**

Source: tsx:1543–1722. A CDK-overlay anchored panel — `@angular/cdk` is already a dependency, so no new package.

```ts
@Input() activeCount = 0;
@Input() label = 'Advance Filter';
@Output() reset = new EventEmitter<void>();
// panel body is projected: <ng-content>
```

- Trigger button switches to the active treatment when `activeCount > 0` or the panel is open (tsx:1549–1553),
  with a count bubble.
- Panel: `.card-glass`, `--primary` 40% border, header (icon + title + Reset + close), projected grid body,
  full-width **Apply & Close** footer button.
- `cdkConnectedOverlay` with `hasBackdrop`, backdrop click + `Escape` close it, focus trapped via
  `cdkTrapFocus`. The doc hand-rolls outside-click with `stopPropagation` (tsx:1546, 1566) — don't port that.

---

## 6. `shared/pipes/signed-currency.pipe.ts` — **[NEW]**

`{{ tx.amount | signedCurrency: tx.type }}` → `+$6,200.00` / `-$184.50`. Appears in ~8 templates
(tsx:1010, 1120, 1401, 1779). Wraps `CurrencyPipe`; prefix from `CategoryType`. Standalone, `pure: true`.

---

## Acceptance Criteria

- [ ] Two cashflow charts rendered on one page keep their own gradients (no id collision).
- [ ] Chart paths for a known 6-point dataset match the doc's output to within a rounding tolerance.
- [ ] Hovering index *i* shows the correct three rows and clamps position at both extremes.
- [ ] `Custom` timeframe reveals the date row and emits on change.
- [ ] Filter popover closes on backdrop click and `Escape`, returns focus to its trigger.
- [ ] No `window.confirm` remains in `src/app`.
- [ ] All five components render correctly in both themes.

## Tests

| Spec | Covers |
|---|---|
| `chart-geometry.spec.ts` | **NEW** — `getX`/`getY`/`smoothPath`/`areaPath` against hand-computed values; `n === 1` guard |
| `cashflow-chart.component.spec.ts` | **NEW** — path emission, unique gradient ids, hover tooltip content, timeframe + custom-range outputs, empty & loading states |
| `stat-card.component.spec.ts` | **NEW** — variant class, content projection |
| `toast-host.component.spec.ts` | **NEW** — renders queue, dismiss on click |
| `confirm-dialog.component.spec.ts` | **NEW** — resolves true/false |
| `filter-popover.component.spec.ts` | **NEW** — open/close, Escape, reset emit, active-count badge |
| `signed-currency.pipe.spec.ts` | **NEW** — income/expense prefixes, zero, decimals |
