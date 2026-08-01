# FinTrack Angular — Issue Solver Plan

> Companion to `docs/code_review.md`. This plan defines concrete, ordered work items to resolve every finding (H1–H5, M1–M8, L1–L7) plus the test-coverage gaps identified in the review.

- **Repo:** `D:\Local-Projects\fintrack-angular-app`
- **Baseline:** commit `3b44bfd`, build OK (4 warnings), tests 30/30 pass.
- **Mandatory constraint:** the project was originally planned as an **Angular v20** application and that target is **imposed**. The repo currently runs Angular **v19.1.0**; bringing it to **Angular 20** is a hard requirement (see **Phase 1** below), not an option. All later fixes in this plan are written against Angular 20 APIs.
- **Definition of done:** project upgraded to Angular 20 (`ng version` reports v20), all work items completed, `ng build --configuration production` succeeds with only intentional warnings, `ng test --watch=false --browsers=ChromeHeadless` green.

---

## 0. Baseline & Safety Net (do first, ~0.5h)

| Task | Details |
|------|---------|
| B1 | Create a working branch: `git checkout -b chore/fix-review-issues`. |
| B2 | Run the test suite to confirm the 30/30 baseline before touching anything. |
| B3 | Run a production build and save the current warning list (3 style-budget + mammoth CommonJS) so regressions are easy to spot. |
| B4 | Install test-only/dev tooling needed later (none required for H/M items; ESLint optional in L7). |

---

## 1. Angular v20 Upgrade (Mandatory) — do first, ~2–4h

The original plan in `AGENTS.md` specified **Angular v20**; the scaffold landed on Angular 19.1.0. This phase makes the actual codebase match the imposed v20 target **before** any other fix is implemented, so every subsequent change is written and verified against the final framework version.

### U1 — Preflight & snapshot
1. Verify Node version: Angular 20 requires **Node ≥ 20.19 or ≥ 22.12** (`node -v`). Upgrade Node first if needed.
2. Confirm the working tree is committed (branch from `chore/fix-review-issues`, per B1).
3. Decide the UI-library fate **before** upgrading (see U4); this determines the exact `ng update` package list.

### U2 — Remove unused deps (front-load H5 decision)
Run this **before** the framework update so `ng update` does not attempt to migrate packages that will be deleted:
1. If the decision is "remove" (recommended — nothing imports them today): `npm uninstall primeng @angular/material @angular/cdk`.
2. If the original tech-stack intent is honored instead ("keep"), keep them and upgrade to their **v20** majors in U3, then actually adopt them (p-table/p-timeline/p-tag, Material components) as feature work tracked after this phase. (Recommended: **remove now**, re-add deliberately later if the v20 component set is required by the product.)

### U3 — Run the framework upgrade
```bash
npx ng update @angular/cli@20 @angular/core@20 --allow-dirty --force
```
Let the CLI apply automatic migrations, then resolve the manual items below. (If PrimeNG/Material were kept in U2, also run `ng update @angular/material@20` and update `primeng` to `^20.0.0`.)

### U4 — Target dependency matrix (after upgrade)
| Package | From | To |
|---------|------|----|
| `@angular/{animations,common,compiler,core,forms,platform-browser,platform-browser-dynamic,router}` | `^19.1.0` | `^20.0.0` |
| `@angular-devkit/build-angular`, `@angular/cli`, `@angular/compiler-cli` | `^19.1.0` | `^20.0.0` |
| `typescript` | `~5.7.0` | `~5.8.0` (v20 requires 5.8.x) |
| `zone.js` | `~0.15.0` | `~0.16.0` (only if keeping zone-based CD) |
| `rxjs` | `~7.8.0` | `~7.8.0` (unchanged) |
| `tslib` | `^2.3.0` | keep (or `^2.8.0`) |
| `@angular/cdk`, `@angular/material`, `primeng` | — | only if kept (U2), at `^20.0.0` |

### U5 — Code/config changes for v20
1. **Change detection:** `src/app/app.config.ts` currently uses `provideZoneChangeDetection({ eventCoalescing: true })`. Angular 20's **zoneless change detection is stable and the v20 default**. Switch to `provideZonelessChangeDetection()` from `@angular/core` and remove `zone.js`/`zone.js/testing` from the `polyfills` arrays in `angular.json` (build + test). Confirm signals-based state (already used throughout) drives UI updates correctly; `ngOnChanges`/`OnChanges` components (drawer, dialogs, file-viewer) keep working under zoneless — no signature changes needed.
   - If the team prefers to stay on zone.js for now, keep `provideZoneChangeDetection` and `zone.js@0.16`; either way must be consistent across `app.config.ts` and `angular.json`.
2. **Animations:** switch to `provideAnimationsAsync()` from `@angular/platform-browser/animations/async` (v20-recommended) if animation is required; otherwise remove `provideAnimations()`.
3. **Standalone/API drift:** audit for v19-deprecated APIs now removed in v20 (e.g. any `Renderer2` usage — none present; `Component` input/output function APIs are the standard). Grep for `@deprecated` compiler diagnostics after upgrade and fix.
4. **Budgets:** re-check `angular.json` budgets after upgrade (v20 may adjust defaults); keep the L2 work items in mind.

### U6 — Verify the upgrade
1. `npx ng version` → Angular / Angular CLI / TypeScript report **20.x / ~5.8**.
2. `npm run build` (production) → succeeds; no new warnings beyond the known style-budget/mammoth items (which are fixed later).
3. `npm test` → existing 30/30 specs still pass under v20; fix any CD/timing flakes (zoneless may surface order-sensitive tests).

**Acceptance:** `ng version` reports Angular 20; production build + full test suite green; `app.config.ts` uses v20-recommended providers; `AGENTS.md`'s "Angular v20" claim is now literally true.

---

## 2. High Severity

### H1 — Fix token-refresh deadlock
**Files:** `src/app/core/interceptors/auth.interceptor.ts`

**Problem:** On refresh failure, queued requests waiting on `refreshTokenSubject` never get a value and hang forever.

**Actions:**
1. In the `catchError` of the refresh pipeline, after `authService.logout()`, emit `null` on `refreshTokenSubject` (before `isRefreshing = false`) so waiting subscribers unblock.
2. Update the queued branch (`refreshTokenSubject.pipe(filter(t => t !== null), take(1))`) to handle `null`:
   - `filter` type-guard keeps `null` out, so instead subscribe and map: if the emitted value is `null` → `throwError` (or call `logout()` and throw) so the request rejects instead of hanging.
   - A clean pattern: `switchMap(token => token ? next(retryReq) : throwError(...))`.
3. Reset `isRefreshing` inside a `finalize()` so the flag can never be left `true` if the refresh errors after setting it.
4. Consider a per-request guard: if the request is itself `/auth/refresh-token`, do not enter the refresh branch (currently only `req.url.includes('/auth/')` is checked at the 401 gate — verify refresh-token is included).

**Acceptance:** Unit test: two concurrent requests return 401 → refresh succeeds → both retried with the new token. Second test: refresh fails → both requests reject (not hang) and `logout` called.

---

### H2 — `isLoading` stuck `true` on HTTP error
**Files:** `src/app/core/services/category.service.ts`, `src/app/core/services/transaction.service.ts`

**Actions:**
1. Replace the `tap(...)` that resets `isLoading` with `finalize(() => this.isLoading.set(false))`.
2. Keep the success-state updates (`categories.set`, `transactions.set`, `totalCount.set`) inside `tap`.
3. Apply to `getCategories()` and `getTransactions()`. Audit any other place setting loading flags (none currently).

**Acceptance:** Spec: `getTransactions()` emits an error → `isLoading()` is `false`; spinner clears. Same for categories.

---

### H3 — Sanitize DOCX HTML before rendering
**Files:** `src/app/shared/components/file-viewer/file-viewer.component.ts`, `package.json`

**Actions:**
1. Add `dompurify` (+ `@types/dompurify` if needed) to dependencies.
2. In `renderDocxInline()`, run `mammoth` output through `DOMPurify.sanitize()` **before** `bypassSecurityTrustHtml()`.
3. Optionally restrict allowed tags (e.g. keep the `h1–h6/p/ul/ol/li/table/blockquote/strong/em/u/mark` set used by the current styles) by passing a `USE_PROFILES: { html: true }` config with a custom allow-list.
4. Keep `bypassSecurityTrustHtml` as-is (Angular has no safe `[innerHTML]`); the sanitization now makes it safe.

**Acceptance:** A spec (or manual check) that a crafted DOCX containing `<script>`/`onerror` markup renders inert (script not executed). Unit-test the sanitizer path with a mock `mammoth` result.

---

### H4 — Harden token storage
**Files:** `src/app/core/services/auth.service.ts`, `src/app/app.config.ts` (if needed), `docs` (note backend changes are out of scope here)

**Actions:**
1. **Recommended (requires backend):** Migrate to httpOnly cookies for `access`/`refresh` tokens; remove `token`/`refresh_token` from `localStorage`; read the user profile from the `/auth/me`-style endpoint or from a server-set profile claim. Keep `withCredentials: true`.
2. **Interim (frontend-only):** keep current flow but:
   - Move the token to `sessionStorage` if a non-persistent session is acceptable, or keep `localStorage` but acknowledge the trade-off.
   - Never store `user_info` separately — derive the display user from the decoded JWT claims at bootstrap (already partially done via `getUserFromToken`).
   - Add a Content-Security-Policy meta header / response header and a `Referrer-Policy` header to limit XSS impact (complement to H3).
3. Do NOT commit any secrets; ensure no tokens are logged.

**Acceptance:** After login, refresh, logout, and hard reload, state matches expectations; no PII duplicated in storage keys beyond the single profile entry (or none if cookie-based). CSP present in served `index.html`.

---

### H5 — Remove unused UI deps & lazy-load mammoth
**Files:** `package.json`, `package-lock.json`, `src/app/shared/components/file-viewer/file-viewer.component.ts`

> **Ordering note:** the dependency-removal half of this item is **front-loaded into U2** (Phase 1) so the Angular 20 upgrade skips unused packages. This section covers the mammoth change and the post-upgrade state of `package.json`.

**Actions:**
1. **Already done in U2 (if "remove" decision):** `primeng`, `@angular/material`, `@angular/cdk` are gone from `package.json`. Verify post-upgrade with `npm ls primeng @angular/material @angular/cdk` → empty. If "keep" was chosen, verify they are at `^20.0.0`.
2. Convert `import * as mammoth from 'mammoth'` into a dynamic import inside `renderDocxInline()`:
   ```ts
   const mammoth = await import('mammoth');
   const result = await mammoth.convertToHtml({ arrayBuffer }, { ... });
   ```
3. Rebuild and confirm the `transaction-detail-component` lazy chunk drops from ~540 kB to ~tens of kB, and the CommonJS "optimization bailout" warning disappears.

**Acceptance:** Production build has no `mammoth`/CommonJS warning; `transaction-detail` chunk < ~150 kB. DOCX viewing still works (dynamic import loads on demand).

---

## 3. Medium Severity

### M1 — Remove hidden page-1 reloads in services
**Files:** `src/app/core/services/transaction.service.ts`, `src/app/core/services/category.service.ts`, plus callers: `transaction-list.component.ts`, `category-list.component.ts`, `transaction-editor.component.ts`, `transaction-form-dialog.component.ts`, `category-form-dialog.component.ts`

**Actions:**
1. Remove the `tap(() => this.getTransactions().subscribe())` from `createTransaction`, `updateTransaction`, `deleteTransaction` and the equivalent in `createCategory`, `updateCategory`.
2. Have mutations just return the HTTP observable.
3. Update callers to explicitly reload with current state:
   - `category-form-dialog` after create → call `categoryService.getCategories()`.
   - `transaction-editor` after create/update → navigate to `/transactions`; the list's `ngOnInit` reloads.
   - `transaction-list` after delete → re-call `getTransactions()` with the page/filters the list would have (currently page 1 — acceptable today since there is no pagination UI yet; centralize this once M8/L pagination is added).
4. Ensure no `subscribe()` inside `tap` remains anywhere in services.

**Acceptance:** Mutations trigger exactly one mutation request; reload is explicit and carries current page/filter params. Specs updated to assert no unexpected second GET.

---

### M2 — Event drawer must refresh on reopen
**Files:** `src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.ts`

**Actions:**
1. In `ngOnChanges`, trigger `loadEvents()` when `changes['visible']` transitions to `true` **and** a `transactionId` is present (in addition to the existing `transactionId`-change check).
2. Start `loadEvents()` with `this.isLoading = true` and `this.events = []` (clear stale data while fetching).

**Acceptance:** Spec: open drawer, close, reopen with same id → `getTransactionEvents` called again (assert call count 2). Loading state shows while fetching.

---

### M3 — Clean up register flow
**Files:** `src/app/features/auth/register/register.component.ts`, `src/app/core/services/auth.service.ts`

**Actions:**
1. Remove the dead `if (typeof this.authService.login === 'function')` branch.
2. If the backend `register` endpoint returns an `AuthResponse` with tokens (per the contract), rely on `register()`'s `handleAuthSuccess` and navigate directly to `/transactions` on success — do **not** call `login()` again.
3. If the backend register returns no tokens, keep the explicit `login()` call but only on success path, and on login failure show an error and stay on `/register` (do not navigate).
4. Decide the behavior with the backend contract and encode it in the component.

**Acceptance:** Register spec updated: register success → single register call, navigate on success; register-then-login-failure → error shown, no navigation.

---

### M4 — Redirect after logout
**Files:** `src/app/core/services/auth.service.ts` (or sidebar)

**Actions:**
1. Option A (service): `logout()` returns nothing but the sidebar handler navigates: in `sidebar.component.ts` add `router.navigate(['/login'])` after `logout()`.
2. Option B (global): in the interceptor refresh-failure path (H1) and anywhere `logout()` is called, follow with a navigation to `/login` if the current route is guarded.

**Acceptance:** Clicking logout immediately lands on `/login` and guarded pages are no longer accessible without auth.

---

### M5 — Preserve return URL & guard the auth routes
**Files:** `src/app/core/guards/auth.guard.ts`, `src/app/app.routes.ts`, `login.component.ts`

**Actions:**
1. In `authGuard`, capture `state.url` and pass it to `/login` as a query param (`queryParams: { returnUrl: state.url }`).
2. In `LoginComponent.onSubmit` success, read `returnUrl` from `ActivatedRoute.snapshot.queryParams` and navigate there, falling back to `/transactions`.
3. Add a small `canActivate` guard for `login`/`register` that redirects authenticated users to `/transactions`.

**Acceptance:** Deep-link to `/transactions/details/:id` while logged out → login → returns to the deep link. Logged-in user visiting `/login` is redirected away.

---

### M6 — Consistent timezone handling
**Files:** `src/app/features/transactions/transaction-editor/transaction-editor.component.ts`, `transaction-form-dialog.component.ts`, `transaction-list.component.ts`, `transaction-detail.component.ts`

**Actions:**
1. Pick the canonical approach: store the local wall-clock components (`date` as `YYYY-MM-DD`, `time` as `HH:mm`) plus `timeZoneOffsetInMinutes` (already sent), and **do not** run the date through `toISOString()` on write.
2. On read, format using the stored offset rather than the browser's local zone for the list/detail displays (add a small `dateUtils` helper; replace `date:'shortDate'` usage accordingly or add a transform).
3. Keep one implementation shared between editor and dialog (avoid the current duplicated logic — ties into L3).

**Acceptance:** A transaction saved at 23:30 UTC+2 displays with the same local date/time it was entered, regardless of the viewer's timezone. Update the editor/dialog specs to assert the payload uses `YYYY-MM-DD`/`HH:mm` + offset.

---

### M7 — Surface mutation errors
**Files:** `transaction-editor.component.ts`, `transaction-form-dialog.component.ts`, `category-form-dialog.component.ts`, `transaction-list.component.ts` (delete)

**Actions:**
1. Add a lightweight toast/alert mechanism (no new heavy dependency — a small `NotificationService` with an inline toast component, or PrimeNG/Material toasts if a UI lib is reintroduced in H5 decision).
2. In each mutation's `error` handler, display the backend message (`err.error?.error ?? 'Operation failed'`) and reset `isSubmitting`.
3. For delete, replace native `confirm()` with an inline confirmation (keeps the plan's UX intent without requiring `ConfirmationService`).

**Acceptance:** Inducing a failure (e.g. network blocked) shows a visible error toast and the form re-enables.

---

### M8 — Reconcile `AGENTS.md` with reality
**Files:** `AGENTS.md`

**Actions:**
1. The **Angular v20** claim is now the imposed target and is satisfied by Phase 1 — keep it. Update only what is still inaccurate:
   - Dependency lines for PrimeNG/Material: either "removed (unused)" or "v20" depending on the U2/U4 decision.
   - Remove the "Angular v20 vs v19" mismatch note entirely once the upgrade lands.
2. Update the file manifest: add `tag.service`, `transaction-detail`, `transaction-editor`, `file-viewer`; mark `navbar` as not built; note dialog spec files as planned.
3. Align feature descriptions with the implemented plain-table/confirm UI, or document the intent to add `p-table`/filters as backlog (if the plan is kept, fold pagination/filters into the roadmap below).

**Acceptance:** `AGENTS.md` accurately describes the codebase on Angular 20 (or explicitly lists planned deltas), with no remaining v19/v20 contradiction.

---

## 4. Low Severity

### L1 — Remove or wire up `TransactionFormDialogComponent`
**Files:** `src/app/features/transactions/transaction-form-dialog/transaction-form-dialog.component.ts`

**Actions:**
1. Check if any parent references `app-transaction-form-dialog` — none do today.
2. If unused: delete the component folder and its styles (and any spec).
3. If it should exist: wire it into `transaction-list` as the create/edit entry point and keep only one implementation (merge with `transaction-editor` logic — see L3).

**Decision needed:** keep editor-as-page (recommended, fewer moving parts) → **delete** the dialog.

**Acceptance:** No references to `TransactionFormDialogComponent` remain in the codebase after the chosen path.

---

### L2 — Split oversized components & fix style budgets
**Files:** `transaction-editor.component.ts`, `transaction-form-dialog.component.ts`, `transaction-detail.component.ts`, `file-viewer.component.ts`, `angular.json`

**Actions:**
1. Move inline templates to `*.component.html` and styles to `*.component.css` for the four oversized components.
2. Extract shared form/chip/attachment CSS into `styles.css` (e.g. `.tag-chip`, `.form-group`, `.upload-*`).
3. After extraction, if sheets still exceed 4 kB, raise `anyComponentStyle` budget in `angular.json` to a justified value (e.g. 8 kB) or move large sheets global.

**Acceptance:** Production build has no style-budget warnings (either within budget or explicitly raised).

---

### L3 — De-duplicate calculator / tags / attachments logic
**Files:** new `src/app/features/transactions/` shared pieces

**Actions:**
1. Extract the calculator engine (expression string → evaluated amount + history) into `src/app/core/utils/calculator.util.ts` or a `CalculatorService`.
2. Extract the tag-chip input and file-attachment handlers into shared components (`tag-input.component.ts`, `attachment-upload.component.ts`) or composable functions.
3. Reuse in both editor and (if kept) dialog.

**Acceptance:** No duplicated `evaluateExpression`/`onFilesSelected`/`addCustomTagsFromInput` implementations remain; tests move with the extracted code.

---

### L4 — Replace magic numbers with the enum
**Files:** `transaction-list.component.ts:59-63`, `category-list.component.ts:34-35`, `category-form-dialog.component.ts:28-29`, `transaction-editor.component.ts` & `transaction-form-dialog.component.ts` templates

**Actions:**
1. Use `CategoryType.Income` / `CategoryType.Expense` in templates (Angular supports enum member access if exposed on the component instance) or bind a small helper `typeLabel(type)`/`isIncome(type)`.
2. Remove hardcoded `=== 0` / `=== 1` comparisons.

**Acceptance:** No `=== 0`/`=== 1` type comparisons remain; enum is the single source of truth.

---

### L5 — Fix invalid CSS property
**Files:** `src/app/features/categories/category-list.component.ts:110`

**Action:** Change `text-color: #94a3b8;` → `color: #94a3b8;`.

**Acceptance:** No invalid CSS declarations (linted).

---

### L6 — Handle `accountId` explicitly
**Files:** `transaction-editor.component.ts`, `transaction-form-dialog.component.ts`, `transaction.model.ts`

**Actions:**
1. Either drop `accountId` from the create/update payloads (if the backend can default it) or derive it from a real accounts endpoint once one exists.
2. If kept, centralize the default in one constant (`ACCOUNT_ID_DEFAULT`) instead of duplicating `'default-account'` in two files.

**Acceptance:** `'default-account'` appears exactly once (or zero) in `src/`.

---

### L7 — Config & tooling cleanup
**Files:** `angular.json`, `environment.ts`, `environment.development.ts`, `src/proxy.conf.json`, `tsconfig.json`, `package.json`

**Actions:**
1. Create `public/` with a `.gitkeep` (or remove the assets entry from `angular.json` build/test options).
2. Add `environment.prod.ts` with `production: true` and wire `fileReplacements` in the production build config; make `environment.ts` the dev/prod placeholder correctly.
3. Switch services to relative `/api` paths and rely on `proxy.conf.json` (removes CORS dependency) — or delete the proxy file if keeping absolute URLs. Recommended: use relative paths + proxy.
4. Enable `strict: true`, `noImplicitAny: true` in `tsconfig.json`; fix resulting type errors (mostly the `as any` casts in specs/models).
5. Add ESLint + Prettier config and a `lint` script (`ng lint` or `eslint .`); wire it into the test command (`npm test` chain).

**Acceptance:** Production build uses `environment.prod.ts`; dev server proxies `/api`; `tsc --noEmit` passes strict; `npm run lint` passes.

---

## 5. Test Coverage Additions

| Area | New/Updated specs |
|------|-------------------|
| Interceptor (H1) | Concurrent 401 retry success; refresh-failure rejects & logs out; no retry on `/auth/*` URLs. |
| Services (H2, M1) | `isLoading` resets on error; mutations do not fire extra GETs; reload honors page params. |
| Drawer (M2) | Reopen with same id refetches; loading state toggles. |
| Register (M3) | Register-only path; register-then-login failure shows error & no navigation. |
| File viewer (H3) | Sanitizer applied (script stripped) for docx HTML. |
| Dialogs (missing) | `category-form-dialog` submit success/error; (if kept) `transaction-form-dialog`. |
| Utilities (L3/L4) | Calculator util edge cases; type-label helper. |
| Guard (M5) | Return-URL preservation; auth-route redirect for logged-in users. |

---

## 6. Execution Order & Verification Gates

```
Phase 0   Baseline & branch                 → tests 30/30, build OK (on v19)
Phase 1   Angular v20 upgrade (U1–U6)       → `ng version` = 20.x, build + tests green
Phase 2   H1 → H2 → H3 → H4 → H5            → run tests + build after each
Phase 3   M1 → M2 → M3 → M4 → M5            → run tests + build after each
Phase 4   M6 → M7 → M8                       → run tests + build after each
Phase 5   L1 → L2 → L3 → L4 → L5             → run tests + build
Phase 6   L6 → L7 + lint/strict fix          → full verification gate
Phase 7   Test coverage additions            → coverage + 100% green
Final     Manual QA (below)
```

**Manual QA checklist (final):**
1. `npx ng version` → Angular **20.x**; `ng serve` → register, login (return-URL honored), logout redirect.
2. Create category → create transaction via calculator → verify no double GET, amount/time correct in list & detail.
3. Edit transaction → open Audit Trail twice → timeline is fresh both times.
4. Trigger a 401 (expire token server-side) → app silently refreshes; kill refresh endpoint → requests fail gracefully, user logged out to `/login`.
5. Attach image/PDF/DOCX → viewer works; a DOCX with embedded script does not execute.
6. Delete transaction (inline confirm) → list refreshes on same page.

---

## 7. Out of Scope (backend / follow-up)

- Cookie-based auth migration (H4 Option 1) requires changes in `fintrack-dotnet-app`.
- Real account management (L6) depends on a backend accounts API.
- Pagination/filter UI (referenced in `AGENTS.md`) is a feature addition, not a defect fix — track separately once H5/M1 free up the list to support it cleanly.
