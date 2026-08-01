# FinTrack Angular App — Code Review

- **Reviewed:** `D:\Local-Projects\fintrack-angular-app`
- **Date:** 2026-08-01
- **Branch:** `main` (`3b44bfd project scaffolded.`)
- **Scope:** Full review of the Angular v20 standalone client — auth, categories, transactions, event-sourcing drawer, shared components, services, tests, and build configuration.

---

## 1. Executive Summary

The codebase is a solid, functional single-page application built with Angular standalone components and Signals. The architecture is clean: feature-folder structure, `core/` for services/models/guards/interceptors, `shared/` for reusable components, and lazy-loaded routes. The **entire test suite (30 specs) passes**, and the **production build succeeds**.

However, there are meaningful gaps between the plan in `AGENTS.md` and the delivered code, several real bugs (a token-refresh deadlock, loading states that never reset on error, a stale audit-trail drawer), one XSS risk in the DOCX viewer, ~2MB of unused UI dependencies, and a large amount of duplication/dead code.

| Severity | Count |
|----------|-------|
| High     | 5     |
| Medium   | 8     |
| Low      | 7     |

---

## 2. What Works Well

- **Standalone + Signals**: Clean use of `signal`/`computed`, `inject()`, `takeUntilDestroyed`, and functional `CanActivateFn`/`HttpInterceptorFn`.
- **Routing**: Lazy-loaded feature routes with a guarded layout shell (`app.routes.ts`).
- **Event sourcing UI**: `TransactionService.getTransactionEvents()` + the `transaction-history-drawer` timeline are a faithful realization of the audit-trail feature.
- **Testing**: Services, guard, interceptor (basic), and most components have Jasmine specs; all 30 pass.
- **Aesthetic consistency**: Glassmorphic dark theme is applied consistently via `styles.css` CSS variables.
- **Build hygiene**: Lazy chunks keep the initial bundle small (~109 kB transferred); `mammoth` is the only notable outlier (see High-5).

---

## 3. High Severity Findings

### H1. Token-refresh failure leaves concurrent requests hanging forever
`src/app/core/interceptors/auth.interceptor.ts:45-67`

When one request triggers a refresh (`isRefreshing = true`, `refreshTokenSubject.next(null)`) and the refresh **fails**, the initiating request's `catchError` calls `logout()` and throws, but **nothing is ever emitted on `refreshTokenSubject`**. Any requests that were queued in the `else` branch (`refreshTokenSubject.pipe(filter(t => t !== null), take(1))`) wait indefinitely — they never resolve or reject.

**Fix:** Emit `null` (or `complete`) on the subject when refresh fails, and have the queued branch convert a `null` emission into a rejection + logout. Also guard against re-entrancy by checking `isRefreshing` after the async refresh completes.

### H2. `isLoading` never resets on HTTP error → permanent spinner
`src/app/core/services/category.service.ts:18-24`, `src/app/core/services/transaction.service.ts:20-33`

Both services set `isLoading.set(true)` and only reset it inside the success `tap`. On any error the flag stays `true`, so `category-list` and `transaction-list` render a spinner forever.

**Fix:** Reset in a `finalize()` instead of `tap`, or handle `error` explicitly.

### H3. XSS risk in DOCX viewer
`src/app/shared/components/file-viewer/file-viewer.component.ts:48,563`

`mammoth.convertToHtml()` output is injected via `bypassSecurityTrustHtml()` and rendered with `[innerHTML]`. `mammoth` does **not** sanitize output — a crafted `.docx` can carry `<script>`/event-handler markup and execute in the app's origin. Combined with H4 (below), this is a real stored-XSS vector.

**Fix:** Sanitize the generated HTML (e.g. DOMPurify) before `bypassSecurityTrustHtml`, or render with a sanitizer-friendly pipeline.

### H4. Secrets & PII kept in `localStorage` (token, refresh token, user profile)
`src/app/core/services/auth.service.ts:16-17,55-61,83`

`token`, `refresh_token`, and `user_info` are persisted in `localStorage`. Any XSS (see H3) trivially exfiltrates them. The app already sends `withCredentials: true` on every request, so a stronger option is available.

**Recommendation:** Prefer httpOnly SameSite cookies for the JWT (backend-driven), keep only a non-sensitive user profile in `localStorage`, and rework `refreshTokens()` to use a cookie-based refresh flow. If tokens must stay in JS storage, at minimum sanitize DOCX (H3) and add CSP headers.

### H5. ~2 MB of unused UI dependencies + mammoth bloat in a lazy chunk
`package.json:14-22`

- `primeng`, `@angular/material`, `@angular/cdk` are declared but **never imported** anywhere in `src/`. The plan (`AGENTS.md`) called for `p-table`, `p-timeline`, `p-tag`, Material, etc., but the implementation uses hand-rolled HTML tables and a custom timeline. These deps should be removed (or the components actually used).
- `mammoth` is CommonJS (build warns: "optimization bailout") and is bundled into the `transaction-detail-component` lazy chunk, which is **539.7 kB** — by far the largest chunk in the app.

**Fix:** `npm uninstall primeng @angular/material @angular/cdk`. For mammoth, `await import('mammoth')` lazily inside `renderDocxInline()` so it only loads when viewing a DOCX, or replace with a lighter parser.

---

## 4. Medium Severity Findings

### M1. CRUD services trigger hidden page-1 reloads via nested subscribes
`src/app/core/services/transaction.service.ts:41-57`, `src/app/core/services/category.service.ts:31-40`

`create/update/delete` call `this.getTransactions().subscribe()` inside a `tap`. Consequences:
- The inner subscription is unmanaged (not tied to `DestroyRef`/component lifecycle).
- Reloads always hit **page 1 with default pageSize**, discarding any future pagination/filter state.
- Every mutation fires an extra request.

**Recommendation:** Return the mutation observable and let the component trigger a refresh (e.g. after navigating back, or with the current page params).

### M2. Event-history drawer shows stale data on reopen
`src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.ts:222-226`

`ngOnChanges` only reloads when `transactionId` changes. Closing and reopening the drawer for the **same** transaction (e.g. after editing it) toggles only `visible`, so `loadEvents()` is never called again and the timeline is stale. `isLoading` is also not reset on reopen.

**Fix:** Reload when `visible` transitions to `true` (in addition to `transactionId` change), and set `isLoading = true` at the start of `loadEvents()`.

### M3. Register flow is contradictory and contains dead code
`src/app/features/auth/register/register.component.ts:154-169`

- `if (typeof this.authService.login === 'function')` is always `true` (dead branch).
- After a successful register, it calls `login()` again even though `AuthResponse` (returned by register) already carries tokens.
- On **login failure** it still navigates to `/transactions` — a guarded route — so the user bounces back to `/login` with no message.

**Fix:** Use the register response tokens directly (via `handleAuthSuccess`) and navigate to `/transactions` only on success; show the error otherwise.

### M4. Logout does not redirect
`src/app/core/services/auth.service.ts:47-52`

`logout()` clears state and fire-and-forgets the logout POST, but nothing navigates. The sidebar's logout button leaves the user on the (now unauthorized) page until they manually navigate; the guard only triggers on the *next* navigation.

**Fix:** Have the sidebar (or a guard) navigate to `/login` after logout.

### M5. Auth flow has no `returnUrl` and no login-route guard
`src/app/core/guards/auth.guard.ts:13`, `src/app/app.routes.ts:7-13`

- `createUrlTree(['/login'])` drops the originally requested URL; after login the user always lands on `/transactions`.
- An already-authenticated user hitting `/login` or `/register` is not redirected away.

**Fix:** Preserve `state.url` as a query param and redirect authenticated users off `/login`.

### M6. Timezone handling is inconsistent
`src/app/features/transactions/transaction-editor/transaction-editor.component.ts:1036,1047`, `transaction-list.component.ts:66`

Dates are sent as `new Date('YYYY-MM-DD').toISOString()` (UTC midnight) while a `timeZoneOffsetInMinutes` is captured but never used on read. The list renders `tx.date | date:'shortDate'` in the browser's local zone, so a transaction created in a negative-offset timezone can display on the previous day. Pick one canonical approach (store local date components + offset, or normalize to UTC consistently on both read and write).

### M7. No error/loading handling for mutations
`transaction-editor.component.ts:1055-1060`, `transaction-form-dialog.component.ts:956-961`, `category-form-dialog.component.ts:156-159`

`create/update/delete` failures are swallowed (`error: () => { this.isSubmitting = false; }`) — no toast, no inline message, no log. Users get silent failure.

### M8. Plan-vs-code drift in `AGENTS.md`
The manifest lists files that don't exist or have no spec, and omits files that do exist:
- Missing: `navbar.component`, `category-form-dialog.component.spec.ts`, `transaction-form-dialog.component.spec.ts`.
- Extra/unlisted: `tag.service`, `transaction-detail`, `transaction-editor`, `file-viewer`.
- Version alignment: `package.json` upgraded to Angular **v20.0.0** matching project requirements.
- Plan says `p-table` + filter bar + `ConfirmationService`; implementation uses plain `<table>`/`confirm()`.

Either update `AGENTS.md` to reflect reality or treat it as the source of truth and close the gaps (H5).

---

## 5. Low Severity Findings

### L1. `TransactionFormDialogComponent` is dead code
`src/app/features/transactions/transaction-form-dialog/transaction-form-dialog.component.ts:672`

~987 lines (with a duplicate of the entire calculator + tag + attachment logic from `transaction-editor`) are **never referenced** — no parent imports the `app-transaction-form-dialog` selector. Remove it or wire it into the list view.

### L2. Massive inline templates/styles hurt maintainability & budgets
`transaction-editor.component.ts` (1086 lines), `transaction-form-dialog.component.ts` (987 lines), `transaction-detail.component.ts` (566 lines). The production build warns that three component styles exceed the 4 kB `anyComponentStyle` budget (file-viewer 5.6 kB, transaction-editor 7.4 kB, transaction-form-dialog 6.2 kB).

**Fix:** Split templates/styles into `.html`/`.css` files and extract shared CSS. Raise or remove the per-component budget if large sheets are intentional.

### L3. Duplicated feature logic
The calculator, tag-chip input, and file-attachment logic are copy-pasted between `transaction-editor` and `transaction-form-dialog` (~80+ lines each). Extract a shared calculator service/component and a tag-input component.

### L4. Magic numbers for `CategoryType`
Templates compare `category.type === 0` / `=== 1` (`transaction-list.component.ts:59-63`, `category-list.component.ts:34-35`, `category-form-dialog.component.ts:28-29`) instead of the `CategoryType.Income/Expense` enum. The enum is defined but only used in TS logic.

### L5. Invalid CSS property
`src/app/features/categories/category-list.component.ts:110` uses `text-color: #94a3b8;` — invalid; should be `color:`. (Harmless, but dead.)

### L6. `accountId` is hardcoded to `'default-account'`
`transaction-editor.component.ts:1046,1069`; the dialog preserves the existing value only in edit mode (`transaction-form-dialog.component.ts:947`). No account management exists anywhere — the field is effectively ignored.

### L7. Config inconsistencies
- `angular.json:24-27` references a `public/` assets folder that does **not exist** (build still passes, but the config is wrong).
- `environment.ts` and `environment.development.ts` are identical and `production: false`; `angular.json` has no `fileReplacements`, so production builds run with the dev flag.
- `src/proxy.conf.json` is dead config: services call the absolute `http://localhost:5000/api` URL, so the `/api` proxy is never hit. Prefer relative `/api` paths + proxy (avoids CORS) or remove the proxy file.
- `tsconfig.json:10-11` has `strict: false` / `noImplicitAny: false`; specs lean on `as any` liberally. Recommend enabling strict mode and adding ESLint (there is no lint script or config at all).

---

## 6. Test Review

**Result: 30/30 passing** (`npx ng test --watch=false --browsers=ChromeHeadless`).

Good coverage exists for: `AuthService` (login/logout), `CategoryService`, `TransactionService` (list + event sourcing), `TagService`, `authGuard`, `authInterceptor` (happy path only), `LoginComponent`, `RegisterComponent`, `CategoryListComponent`, `TransactionListComponent`, `TransactionDetailComponent`, `TransactionEditorComponent` (calculator), `TransactionHistoryDrawerComponent`, `FileViewerComponent`.

**Gaps:**
- No specs for `category-form-dialog` or `transaction-form-dialog` (the plan lists both).
- `auth.interceptor.spec.ts` only verifies header attachment — no tests for the 401/refresh/concurrent-queue paths (where H1 lives), nor the refresh-failure → logout path.
- No test asserting `isLoading` resets on error (H2) or that `getTransactions` is called with preserved pagination.
- No test for the register-component's confusing branches (M3).
- `transaction-history-drawer` spec doesn't cover the reopen-stale case (M2).

---

## 7. Verification Performed

| Command | Result |
|---------|--------|
| `npx ng build --configuration production` | Success. Warnings: 3 component-style budget overages; `mammoth` CommonJS bailout. |
| `npx ng test --watch=false --browsers=ChromeHeadless` | Success. 30/30 passing. |

---

## 8. Recommended Prioritization

1. **Fix H1** (refresh deadlock) — correctness under real 401 storms.
2. **Fix H2** (stuck spinners) — very visible UX bug.
3. **Fix H3/H4** (XSS + token storage) — security before shipping.
4. **Fix M2, M3, M4** (stale drawer, register flow, logout redirect) — small, high-impact.
5. **Trim H5/M8/L1** (remove unused deps, reconcile plan, delete dead component).
6. **Then** tackle M1/M6/M7 and the config/quality items (L2, L3, L7, strict mode, lint).
