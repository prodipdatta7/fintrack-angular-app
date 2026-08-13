# 01 — Design System

**Depends on:** [00 Skeleton](00-skeleton-restructure.md) · **Blocks:** 03–09 · [← Master plan](../../plan.md)

Translate the doc's Tailwind vocabulary into tokens and global utilities in `src/styles/`. Nothing in the
port may carry a literal hex value or a Tailwind class name.

---

## 1. Token Map

The doc's palette already aligns closely with the existing variables:

| Tailwind (doc) | Hex | Existing token | Action |
|---|---|---|---|
| `slate-950` | `#020617` | — | **Add** `--surface-inset` — inner cards sit *darker* than their panel |
| `slate-900` | `#0f172a` | `--surface-1` `#0d1524` | Map |
| `slate-800` | `#1e293b` | `--surface-3` / `--border-subtle` | Map — fill vs. border by context |
| `slate-700` | `#334155` | `--border-strong` | Map |
| `slate-500` | `#64748b` | `--text-muted` | Map |
| `slate-400` | `#94a3b8` | `--text-secondary` | Map |
| `slate-100/200` | `#f1f5f9` | `--text-primary` | Map |
| `indigo-500` | `#6366f1` | `--primary` | Map |
| `indigo-600` | `#4f46e5` | `--primary-deep` | Map |
| `indigo-400/300` | `#818cf8` | `--primary-soft` | Map |
| `emerald-500` | `#10b981` | `--success` | Map |
| `emerald-400` | `#34d399` | — | **Add** `--success-strong` |
| `rose-500` | `#f43f5e` | `--danger` | Map |
| `rose-400` | `#fb7185` | — | **Add** `--danger-strong` |
| `red-500` (over budget) | `#ef4444` | — | **Add** `--over-budget` |
| `amber-400` (edit action) | `#fbbf24` | `--warning` | Map |

Radii: `rounded-xl` (12px) ≈ `--radius-sm` (10px) · `rounded-2xl` (16px) = `--radius-md` · `rounded-3xl`
(24px) → **add** `--radius-xl`.

## 2. New tokens — `src/styles/_tokens.scss`

Add to **both** `:root` and `.app-light`:

```scss
--surface-inset: #06090f;        /* light: #f8fafc */
--success-strong: #34d399;       /* light: #059669 — contrast on white */
--danger-strong:  #fb7185;       /* light: #e11d48 */
--over-budget:    #ef4444;
--radius-xl: 24px;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

/* chart */
--chart-grid:      rgba(30, 41, 59, 1);      /* light: rgba(15,23,42,.08) */
--chart-income:    var(--success);
--chart-expense:   var(--danger);
--chart-crosshair: var(--primary);
--chart-dot-ring:  var(--surface-inset);     /* the doc's stroke="#020617" ring */
```

`--surface-inset` in light theme must stay *lighter* than `--surface-1`, inverting the dark relationship —
otherwise every inset tile turns into a dark hole on the light theme.

## 3. Typography

`_tokens.scss` already names JetBrains Mono for `code, pre` but never loads it, and the doc uses `font-mono`
for **every** figure, timestamp, id and chart label. Extend the existing Google Fonts import:

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

`src/index.html`'s CSP already allows `fonts.googleapis.com` and `fonts.gstatic.com` — **no CSP change needed.**

Type scale used by the port (map to rem, don't invent new sizes):

| Doc | rem | Usage |
|---|---|---|
| `text-[10px]` / `text-[11px]` | 0.625 / 0.6875 | Meta labels, operator lines, portfolio share |
| `text-xs` | 0.75 | Body default in tables, forms, cards |
| `text-sm` | 0.875 | Card titles |
| `text-base` | 1 | Section headings |
| `text-lg` | 1.125 | Modal titles |
| `text-2xl` → `text-4xl` | 1.5 / 1.875 / 2.25 | Hero figures |

---

## 4. Global Utilities — `src/styles/_utilities.scss`

Each recurs 5–30× in the doc. Keeping them global is also what holds component SCSS under the **8 kB budget**.

| Utility | Doc source | Definition |
|---|---|---|
| `.card-glass` | ~30× (tsx:354, 693, 936, 1128, …) | `background: color-mix(in srgb, var(--surface-1) 80%, transparent); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); backdrop-filter: blur(12px);` |
| `.card-hero` | tsx:510, 858, 1090 | Gradient `--surface-1 → indigo-tinted`, `border-color: color-mix(in srgb, var(--primary) 30%, transparent)`, `box-shadow: var(--shadow-lift)`, `position: relative; overflow: hidden` |
| `.card-hero::after` | tsx:511 | The blurred orb: 20rem circle, `--primary` at 10%, `filter: blur(48px)`, top-right, `pointer-events: none` |
| `.card-inset` | tsx:913, 1327, 1913 | `background: color-mix(in srgb, var(--surface-inset) 60%, transparent); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm)` |
| `.num` | every figure | `font-family: var(--font-mono); letter-spacing: -0.01em; font-variant-numeric: tabular-nums` |
| `.num-income` / `.num-expense` | tsx:1009, 1119 | `color: var(--success-strong)` / `var(--danger-strong)` |
| `.chip` | tsx:1003, 1766 | Pill, `--surface-3` fill, `--border-subtle`, 0.75rem, icon+label flex |
| `.chip-mono` | tsx:1394, 1772 | Chip on `--surface-inset` with `--primary-soft` text and mono font (account source) |
| `.chip-outline` | tsx:561, 867 | Bordered type badge (`Bank`, `MFS`, `Cash`) |
| `.data-table` | tsx:974, 1356, 1735 | `width:100%`, uppercase 0.72rem header on `--surface-inset`, `--border-subtle` divider rows, row hover `color-mix(--primary 5%)`, `.clickable-row { cursor: pointer }` |
| `.progress-track` / `.progress-fill` | tsx:619, 1299, 1332, 1868, 1935 | Track: `--surface-inset`, `border-radius: var(--radius-pill)`, `overflow: hidden`. Fill: `height:100%`, `transition: width .5s ease`; color set inline via `[style.background-color]` |
| `.progress-fill--gradient` | tsx:1333, 1937 | `background: linear-gradient(90deg, var(--primary), var(--success-strong))` — savings plans |
| `.progress-fill--over` | tsx:1304, 1873 | `background: var(--over-budget)` |
| `.empty-state` | tsx:967, 1728 | Centered icon at 30% opacity + title + hint. Unify with the near-duplicates already in `transaction-list` / `category-list` SCSS and **delete those local copies**. |
| `.icon-tile` | tsx:861, 1131, 1843 | Square `--surface-inset` tile with border, centered emoji/ligature; `--sm` 3rem / `--md` 3.5rem / `--lg` 4rem |
| `.section-heading` | tsx:1270, 1350, 1914 | `h3` 1rem/700 + optional icon + `.section-subheading` 0.75rem muted |
| `.stat-tile` | tsx:913–930 | Label + mono figure; used 4× in the account hero |

## 5. Animations — `src/styles/_animations.scss`

| Class | Doc | Keyframes |
|---|---|---|
| `.animate-fade-in` | `animate-fadeIn` (tsx:837, 1230, 1519, 1813, 1911) | `opacity 0→1`, `translateY(6px)→0`, 0.3s `cubic-bezier(.16,1,.3,1)` |
| `.animate-scale-up` | modal entry (tsx:2034, 2175) | `opacity 0→1`, `scale(.96)→1`, 0.2s ease-out |
| `.animate-toast-in` | tsx:2478 (`animate-bounce` — a literal bounce loop is wrong for a toast) | Slide from `translateX(24px)` + fade, 0.25s |
| `.animate-pulse-dot` | tsx:518 live badge | `opacity 1→.4→1`, 2s infinite |

Existing `.fade-in-up` stays for already-shipped screens; new screens use `.animate-fade-in`.

**Respect `prefers-reduced-motion`** — wrap all four in a media query that disables transform/opacity
animation. The doc has no such handling; add it.

---

## 6. Material Bridge — `src/styles/_material.scss`

The port keeps Material for form fields, menus, table, paginator, dialogs, snackbar. Two additions:

1. **Paginator + table** already themed; verify they still read correctly on `--surface-inset` header rows.
2. **Overlay panels** (`.cdk-overlay-pane`) get the `.card-glass` treatment so the new filter popover
   (plan 03) matches Material menus already in use.

---

## Acceptance Criteria

- [ ] No component SCSS in the port declares a raw hex value; every color is `var(--…)`.
- [ ] Toggling theme in `/settings` restyles every new utility correctly — no dark tiles on light, no washed-out text on dark.
- [ ] JetBrains Mono actually loads (Network tab) and `.num` renders tabular figures.
- [ ] `prefers-reduced-motion: reduce` suppresses all four animations.
- [ ] `.empty-state` duplicates removed from `transaction-list.component.scss` and `category-list.component.scss`.

## Tests

Visual/manual — no unit spec. Guard rail: a `grep -rnE '#[0-9a-fA-F]{3,6}' src/app --include=*.scss` review
before merge; the only legitimate hits are inline `[style.background-color]` bindings from user data
(category/account/plan colors).
