# 07 — Categories

**Depends on:** [03 Shared Components](03-shared-components.md) · **Backend:** `Category.BudgetLimit` ·
[← Master plan](../../plan.md)

Source: tsx:1811–1892 (grid + budget caps), 2155–2238 (form modal), 107–114 (seed shape).

The category screens exist; they lack budget caps, spend progress and the over-budget state, and the form
lacks the emoji and limit fields.

---

## A. Category List — **[MODIFY]** `features/categories/category-list/`

### A1. Header (tsx:1814–1826)
`Budget Categories & Caps` + subtitle `Manage budget allocations and custom spending thresholds`, with a
primary **New Category** button on the right. (Current header says "Categories" / "Organize your income &
expense categories" — adopt the doc's copy.)

Keep the existing search field; it is not in the doc but is already shipped and useful.

### A2. Card grid (tsx:1828–1889) — `1 / 2 / 3` columns

```
┌──────────────────────────────────────────┐
│ [icon]  Name                      [edit] │
│         {type} Category                  │
│                                          │
│ Spent: $412.30              Cap: $850    │   ← expense only
│ [=============·············]             │
│ 48% utilized                             │
└──────────────────────────────────────────┘
```

| Element | Detail |
|---|---|
| Icon | `.icon-tile` — emoji when set, else the Material ligature (existing categories seed ligature names like `utensils`, so the fallback matters) |
| Edit | Pencil button → form dialog in edit mode (**new** — the list is currently read-only) |
| Spend row | Expense categories only (tsx:1857) |
| `percent` | `min(round(spent / budgetLimit * 100), 100)`; `0` when no cap |
| Cap label | `$N`, or `No Limit` when `budgetLimit === 0` (tsx:1862) |
| Over budget | `spent > budgetLimit && budgetLimit > 0` → cap label and `Over Budget!` in `--danger-strong`, fill `--over-budget` |
| Footer | `{percent}% utilized` in mono |

> **Note the difference from the dashboard.** Here `percent` is spend against *this category's cap*; on the
> dashboard (plan 04) it is spend against *total expenses*. Both come straight from the doc (tsx:1832 vs
> tsx:1284) — don't unify them.

`spent` comes from `DashboardService.summary().categorySpent`. The category list must therefore load the
summary too; call `getSummary()` in `ngOnInit` alongside `getCategories()`.

Income categories show no progress block — just icon, name and type (tsx:1857).

---

## B. Category Form Dialog — **[MODIFY]** `features/categories/category-form-dialog/`

Restyle to the doc's modal (tsx:2155–2238): `.animate-scale-up`, header with title + close button,
`--surface-inset` fields, ghost Cancel + primary submit.

### Fields

| Field | Control | Source |
|---|---|---|
| Category Name | text, required | tsx:2185–2193 |
| Emoji Icon | text, default `📁` | tsx:2197–2205 **(new)** |
| Budget Limit ($) | number, placeholder `0 = Unlimited` | tsx:2207–2216 **(new)** |
| Type | Income / Expense toggle | Existing — the doc's modal drops it (tsx:2161 defaults to `expense`), which would make income categories uncreatable. **Keep it.** |
| Color | color picker | Existing — keep; the grid and dashboard bars need it |

### Behaviour
- Dual mode: `create` (`initialData` null) and **`edit`** (new — wire the pencil from A2).
  Title `Create Category` / `Edit Category`; submit `Create` / `Update` (tsx:2177, 2231).
- Validation: name required; `budgetLimit >= 0`, blank → `0`.
- Emit a toast on success (`New category created` / `Category updated`, tsx:2374, 2381) and refresh the list.

---

## Acceptance Criteria

- [ ] Expense cards show spent, cap, progress and `N% utilized`; income cards show none of it.
- [ ] `budgetLimit === 0` renders `No Limit` and no bar.
- [ ] Overspending flips the bar to `--over-budget` and shows `Over Budget!`.
- [ ] The pencil opens the dialog pre-filled and updates persist.
- [ ] Emoji icons render; ligature-named icons still render via the fallback.
- [ ] Creating an income category is still possible.
- [ ] Toasts fire on create and update.
- [ ] Both themes, all breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `category-list.component.spec.ts` | **MODIFY** — percent math, `No Limit`, over-budget class, income cards without a bar, edit opens dialog, search still filters |
| `category-form-dialog.component.spec.ts` | **NEW** — create vs. edit mode, `budgetLimit` blank → 0, validation, emoji field, toast on success |
