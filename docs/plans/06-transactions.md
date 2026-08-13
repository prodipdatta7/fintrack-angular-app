# 06 — Transactions

**Depends on:** [03 Shared Components](03-shared-components.md) · **Backend:** extended query params, event
enrichment · [← Master plan](../../plan.md)

Source: tsx:1427–1809 (list + advanced filter), 1042–1223 (detail + audit trail), 2012–2153 (form).

Per **Decision 3**, existing screens are restyled and extended — never narrowed. The current editor
(484 lines: attachments, tags, receipt upload, clock time picker, timezone offset) keeps every capability.

---

## A. Transaction List — **[MODIFY]** `features/transactions/transaction-list/`

### A1. Filter bar (tsx:1520–1725)

Replace the three inline Material selects with the doc's layout: a search field on the left, and on the
right `Clear Filters (n)` (only when `n > 0`) plus the **Advance Filter** trigger from
`<app-filter-popover>` (plan 03).

Popover body — a 1/2-column grid (tsx:1592–1710):

| Control | Values | State |
|---|---|---|
| Category | All + each category (emoji + name) | `categoryFilter` |
| Account Source | All + each account (emoji + name + type) | `accountFilter` **(new)** |
| Transaction Type | All / Expenses Only / Income Only | `typeFilter` |
| Sort Ledger By | Date ↓ (default), Date ↑, Amount ↓, Amount ↑, Title A–Z | `sortBy` **(new)** |
| Start Date / End Date | date inputs | **(new)** |
| Min / Max Amount ($) | number inputs | **(new)** |

```ts
activeFiltersCount = computed(() => …);   // counts every non-default filter (tsx:1446–1457)
resetAllFilters();                        // clears search too (tsx:1459–1469)
```

**All filtering and sorting is server-side.** The doc does it in memory (tsx:1471–1516), which silently
lies once results span pages. Extend `TransactionService.getTransactions()` and the backend
`GetTransactionsQuery` with `accountId`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy`
(see the backend plan). Any filter change resets to page 1. Search debounced 300 ms.

### A2. Table (tsx:1727–1806)

Keep the Material table and paginator; restyle with `.data-table` and add the **Account Source** column.

| Column | Change |
|---|---|
| Title & Note | Add the `note` line beneath the title (truncated) + external-link icon on hover |
| Category | `.chip` with emoji |
| **Account Source** | **NEW** — `.chip-mono` with emoji + account name |
| Date | mono |
| Amount | `signedCurrency`, right-aligned, income in `--success-strong` |
| Actions | Keep the existing `mat-menu` (Audit History / Edit / Delete) — it is richer than the doc's two icon buttons and already themed |

Row click → `/transactions/details/:id` (already wired). Empty state uses the shared `.empty-state`.

Replace `window.confirm` (`transaction-list.component.ts:104`) with `<app-confirm-dialog>` + a toast on success.

---

## B. Transaction Detail — **[MODIFY]** `features/transactions/transaction-detail/`

Restructure to the doc's layout (tsx:1042–1223):

### B1. Action row (tsx:1058–1088)
`← Back to Ledgers` (returns to the previous route, falling back to `/transactions`), `Edit Record`
(amber-tinted), `Delete Record` (rose-tinted) → confirm dialog → toast → navigate back.

### B2. Hero card (tsx:1090–1125) — `.card-hero`

Left: directional icon tile (emerald up-right for income / rose down-left for expense) + three chips
(`type`, status, `Ref: {id}`) + title at 1.875rem/900 + `Recorded on {date}`.
Right: `.card-inset` with `Transaction Value` label, the signed amount at 2.25rem `.num`, and the currency line.

### B3. Info cards (tsx:1127–1181) — three-column grid

1. **Category Information** — icon tile, name, `{type} Budget Category`, and `Monthly Limit Cap: $N` when `budgetLimit > 0`.
2. **Account Storage Source** — icon tile, name, `{provider} ({type})`, `Current Source Balance`. Links to `/accounts/:id`.
3. **Record Details** — *renamed from the doc's "Verification & Hash"*. The doc hard-codes
   `Status: Verified` and `Verification Hash: 0x8f3a...b921` (tsx:1106, 1173); shipping fake verification data
   is misleading. Show real values instead: transaction id, created by, created at, last modified at.

### B4. Notes memorandum (tsx:1183–1190)
Rendered only when `note` is present: `Notes & Context Memorandum` heading + quoted note in a `.card-inset`.

### B5. Audit timeline — inline (tsx:1192–1220)

`.card-glass` with header (history icon + `Comprehensive Audit & Revision History` + `N Recorded Events`),
then a vertical rail (`::before` 2px line) with one node per event: `--primary` dot with a 4px ring, event
type in mono `--primary-soft`, timestamp right-aligned, detail line, `Operator: {performedBy}`.

Requires `performedBy` + `detail` on `TransactionEvent` (plans 02 + backend). Empty: `No event log entries
found for this transaction.`

### B6. Existing drawer — **[MODIFY]** `transaction-history-drawer/`
Keep it (it serves the list-row shortcut) and reskin its timeline with the same node styling so the two
surfaces match. Extract the timeline into `features/transactions/components/audit-timeline/` and use it in
both — that keeps each component's SCSS well under the 8 kB budget.

---

## C. Transaction Editor — **[MODIFY]** `features/transactions/transaction-editor/`

Restyle only; **no field is removed**. Apply the doc's form treatment (tsx:2042–2149): uppercase 0.6875rem
labels, `--surface-inset` inputs with `--primary` focus border, `--radius-sm`, two-column pairs
(Amount + Type, Category + Account), footer with ghost Cancel and primary submit
(`Create Record` / `Save Changes`).

**Additions from the doc:**
- **Account Source** select (tsx:2096–2109) — currently absent from the editor even though `accountId` is
  required by the API. Default to `?accountId=` from the query string (used by plan 05's Record Entry button),
  else the first account.
- **Notes / Invoice Tag** textarea (tsx:2123–2132) → `note`.

**Kept as-is:** attachments, tags, receipt upload, clock time picker, timezone offset, existing validation.

On save: toast (`New transaction recorded` / `Transaction updated successfully`, tsx:2342, 2359) and navigate
back to the list.

---

## Acceptance Criteria

- [ ] Advance Filter popover exposes all eight controls; the badge count matches the number of non-default filters.
- [ ] `Clear Filters (n)` resets everything including search, and refetches.
- [ ] Every filter and the sort are sent to the API; results stay correct across pages.
- [ ] Account Source column renders for every row.
- [ ] Delete goes through the confirm dialog and reports via toast; no `window.confirm` remains.
- [ ] Detail page matches the doc's layout, with real record data in place of the fake hash.
- [ ] Audit timeline shows type, timestamp, detail and operator; the drawer matches it visually.
- [ ] Editor keeps attachments, tags, receipt, time picker; gains Account Source and Note.
- [ ] Both themes, all breakpoints.

## Tests

| Spec | Covers |
|---|---|
| `transaction-list.component.spec.ts` | **MODIFY** — filter count, reset, params sent per filter, page reset, account column, delete via dialog |
| `transaction-detail.component.spec.ts` | **MODIFY** — hero, three info cards, note block conditional, timeline nodes, delete + back navigation |
| `transaction-editor.component.spec.ts` | **MODIFY** — account select prefill from query param, note round-trip, existing fields still submitted |
| `transaction-history-drawer.component.spec.ts` | **MODIFY** — shared timeline component renders |
| `audit-timeline.component.spec.ts` | **NEW** — node ordering, empty state, operator line |
