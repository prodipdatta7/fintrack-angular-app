# 08 — Savings Plans

**Depends on:** [03 Shared Components](03-shared-components.md) · **Backend:** plans endpoints ·
[← Master plan](../../plan.md)

Source: tsx:1894–1987 (page), 212–216 (seed shape), 1314–1344 (the dashboard's read-only mirror).

Entirely new — no plans concept exists in the app or the API today.

---

## Files

```
features/plans/plan-list/
└── plan-list.component.{ts,html,scss,spec.ts}      [NEW]
```

Route `plans`, title `Savings Goals & Planning`, lazy-loaded, linked from the sidebar (plan 00).

## Layout (tsx:1910–1985)

Header: `Savings Targets & Future Goals` + `Plan and track long-term financial commitments`.
Grid: `1 / 2 / 3` columns of `.card-glass` cards, `.animate-fade-in`.

```
┌────────────────────────────────────┐
│ Emergency Fund               75%   │
│ Target Date: 2026-12-31            │
│                                    │
│ [====================······]       │
│ $11,250              Goal: $15,000 │
│ ─────────────────────────────────  │
│        [ + Deposit Savings ]       │
└────────────────────────────────────┘
```

| Element | Detail |
|---|---|
| Title | 1rem/700 |
| Percent chip | `min(round(current / target * 100), 100)`, emerald pill (tsx:1921, 1928) |
| Target date | mono, `--text-muted` |
| Progress | `.progress-track` + `.progress-fill--gradient` (indigo → emerald) |
| Figures | `$current` bold / `Goal: $target` muted, both `.num` |
| Footer | Divider + full-width **Deposit Savings** button (tsx:1972–1978) |

### Deposit flow (tsx:1898–1908, 1949–1970)

Clicking **Deposit Savings** swaps the footer for an inline row: amount input + `Save` + `✕`.

- Reject empty, non-numeric, zero and negative values (`if (!val || val <= 0) return`, tsx:1900) — show a
  field-level error rather than failing silently as the doc does.
- On success: `PlanService.deposit(id, amount)`, patch `currentAmount` in the signal, toast
  `Added $N contribution to plan!` (tsx:1905), collapse the row, clear the input.
- Only one card may be in deposit mode at a time — track `editingPlanId = signal<string | null>(null)`.
- Enter submits; Escape cancels.

### Beyond the doc

The doc has no way to create, edit or delete a plan — plans are hard-coded at tsx:212–216. That makes the
page unusable on a real account with zero plans. Add:

- A **New Plan** button in the header opening a dialog (title, target, color, deadline), styled like the
  category dialog from plan 07.
- Edit (pencil) and delete (confirm dialog) on each card.
- Empty state: target icon + `No savings goals yet` + a Create button.

These use the `createPlan` / `updatePlan` / `deletePlan` methods already specified in plan 02 and the
backend plan, so nothing extra is needed downstream.

### Derived states worth handling (the doc handles none)

- `current >= target` → percent clamps at 100, chip reads `Completed`, gradient fills fully.
- Deadline in the past and not complete → amber `Overdue` chip next to the date.
- `target <= 0` → guard the division; show `—` instead of `Infinity%`.

---

## Acceptance Criteria

- [ ] `/plans` renders one card per plan with correct percent, figures and gradient fill.
- [ ] Deposit adds to the total, fires a toast, and collapses the row; invalid amounts are rejected with a visible message.
- [ ] Only one card can be in deposit mode at a time; Enter submits, Escape cancels.
- [ ] Create / edit / delete all work, with delete behind the confirm dialog.
- [ ] Completed, overdue and zero-target states render sensibly.
- [ ] Empty state shows on a fresh account.
- [ ] The dashboard's savings-targets section reflects a deposit made here after navigation.
- [ ] Both themes, all breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `plan-list.component.spec.ts` | **NEW** — percent math incl. clamp and zero-target guard, deposit success + validation, single-open deposit mode, create/edit/delete, empty state, completed & overdue chips |
| `plan-form-dialog.component.spec.ts` | **NEW** — create vs. edit, required fields, deadline validation |
