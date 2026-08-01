---
goal: Comprehensive Resolution Plan for FinTrack Angular Client Issues
version: 1.0
date_created: 2026-08-01
owner: Antigravity AI Engineering Team
status: 'Planned'
tags: [refactor, bugfix, security, performance, cleanup, angular, architecture]
---

# Comprehensive Implementation Plan: FinTrack Angular App Issues Resolution

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This document provides a deterministic, machine-parseable, and fully actionable implementation plan to systematically resolve all 20 verified issues reported in [`docs/code_review.md`](file:///D:/Local-Projects/fintrack-angular-app/docs/code_review.md) and verified in [`docs/code_review_verification.md`](file:///D:/Local-Projects/fintrack-angular-app/docs/code_review_verification.md) for the **FinTrack Angular Client** (`D:\Local-Projects\fintrack-angular-app`).

---

## 1. Requirements & Constraints

- **REQ-001**: 100% resolution of all 20 verified findings (5 High, 8 Medium, 7 Low/Config).
- **SEC-001**: Eliminate XSS vulnerability in [`file-viewer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/shared/components/file-viewer/file-viewer.component.ts) by sanitizing converted DOCX HTML before bypassing Angular trust.
- **SEC-002**: Secure token handling in [`auth.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/auth.service.ts) and ensure failure in refresh flow clears all stored session state safely.
- **PER-001**: Remove unused dependencies (`primeng`, `@angular/material`, `@angular/cdk`) from `package.json` to eliminate ~2 MB of dead package overhead.
- **PER-002**: Dynamically import `mammoth` in `FileViewerComponent` to reduce lazy chunk `transaction-detail-component` size from 539.7 kB to ~35 kB.
- **TST-001**: Preserve 100% passing status of existing 30 Jasmine test specs, and add new targeted unit tests for refresh failure, error loading resets, and drawer reopening.
- **CON-001**: Maintain Angular v20 standalone component standards, Signals state management (`signal`, `computed`), and reactive RxJS pipelines.
- **CON-002**: Preserve existing UI aesthetics (Glassmorphic dark theme, Indigo/Cyan glowing accents, responsive CSS).

---

## 2. Implementation Phases

### Phase 1: Critical Security & Core Infrastructure Fixes (High Severity)

- GOAL-PH1: Eliminate security vulnerabilities, refresh interceptor deadlocks, stuck loading spinners, and dependency bloat.

| Task ID | Component / File | Description | Actionable Implementation Details | Target Completion Criteria |
|---|---|---|---|---|
| **TASK-101** | [`auth.interceptor.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/interceptors/auth.interceptor.ts) | Fix token-refresh failure deadlock (**H1**) | In `catchError((refreshErr))` handler (lines 45-50): emit `null` to `refreshTokenSubject.next(null)`, set `isRefreshing = false`, call `authService.logout()`, and throw `refreshErr`. In queued `else` branch (lines 52-66): update filter to check for token emission, or handle `null` by returning `throwError(() => refreshErr)`. | Concurrent requests during failed refresh reject cleanly instead of hanging indefinitely. |
| **TASK-102** | [`category.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/category.service.ts), [`transaction.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/transaction.service.ts) | Fix permanent loading state on HTTP error (**H2**) | Replace `isLoading.set(false)` in success `tap(...)` with RxJS `finalize(() => this.isLoading.set(false))` in both `getCategories()` and `getTransactions()`. | `isLoading` signal strictly resets to `false` on both HTTP success and error responses. |
| **TASK-103** | [`file-viewer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/shared/components/file-viewer/file-viewer.component.ts) | Sanitize DOCX HTML conversion output (**H3**) | Install/import DOMPurify or implement explicit Angular `DomSanitizer` HTML sanitization on `result.value` prior to calling `bypassSecurityTrustHtml()`. | Prevent script injection from crafted `.docx` files. |
| **TASK-104** | [`auth.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/auth.service.ts) | Harden token storage and session cleanup (**H4**) | Refactor `clearLocalState()` to reset signals and purge storage atomically; ensure invalid token parse cleanly resets user signal without crashing. | Session state is securely invalidated and cleared. |
| **TASK-105** | [`package.json`](file:///D:/Local-Projects/fintrack-angular-app/package.json), [`file-viewer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/shared/components/file-viewer/file-viewer.component.ts) | Remove unused UI packages & dynamic mammoth import (**H5**) | 1. Run `npm uninstall primeng @angular/material @angular/cdk`.<br>2. Replace top-level `import * as mammoth from 'mammoth'` with `const mammoth = await import('mammoth')` inside `renderDocxInline()`. | 1. Package dependencies cleaned.<br>2. `transaction-detail-component` bundle size reduced by >450 kB. |

---

### Phase 2: Feature Behavior & UX Refinements (Medium Severity)

- GOAL-PH2: Resolve workflow bugs in state management, event history drawer, authentication, dates, and error reporting.

| Task ID | Component / File | Description | Actionable Implementation Details | Target Completion Criteria |
|---|---|---|---|---|
| **TASK-201** | [`category.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/category.service.ts), [`transaction.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/transaction.service.ts) | Remove unmanaged nested `.subscribe()` in service mutations (**M1**) | Remove `tap(() => this.getTransactions().subscribe())` from `createTransaction`, `updateTransaction`, `deleteTransaction`, `createCategory`, and `updateCategory`. Let calling components trigger reload with current pagination/filter params. | No unmanaged background subscriptions; pagination & filters preserved post-mutation. |
| **TASK-202** | [`transaction-history-drawer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.ts) | Fix stale event stream on drawer reopen (**M2**) | Update `ngOnChanges` to check `changes['visible']` transitioning to `true` as well as `changes['transactionId']`. Always call `this.loadEvents()` when opened. | Drawer displays refreshed event timeline every time it is opened. |
| **TASK-203** | [`register.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/auth/register/register.component.ts) | Fix registration submission flow & dead code (**M3**) | Remove dead `typeof this.authService.login === 'function'` check. Since `register()` already handles auth success tokens, navigate directly to `/transactions` on success, or show error message on failure. | Registration navigates on success and displays inline error on failure. |
| **TASK-204** | [`auth.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/auth.service.ts), [`sidebar.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/layout/sidebar.component.ts) | Add explicit router navigation on logout (**M4**) | Inject `Router` in `AuthService` (or call `router.navigate(['/login'])` in `logout()`). Update `SidebarComponent` logout handler. | User is redirected to `/login` immediately upon logout. |
| **TASK-205** | [`auth.guard.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/guards/auth.guard.ts), [`app.routes.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/app.routes.ts) | Support `returnUrl` and add guest guard for auth pages (**M5**) | 1. In `authGuard`, pass `queryParams: { returnUrl: state.url }` to `createUrlTree(['/login'])`.<br>2. In `LoginComponent`, navigate to `returnUrl` if present.<br>3. Create `guestGuard` to redirect authenticated users visiting `/login` or `/register` to `/transactions`. | Target deep links preserved after login; authenticated users kept out of login page. |
| **TASK-206** | [`transaction-editor.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-editor/transaction-editor.component.ts), [`transaction-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-list/transaction-list.component.ts) | Fix date timezone shift bug (**M6**) | Format date inputs consistently using local date string `YYYY-MM-DD` or normalize UTC date components without local offset drift. | Transaction dates render on the exact selected calendar day across all timezones. |
| **TASK-207** | [`transaction-editor.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-editor/transaction-editor.component.ts), [`category-form-dialog.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/categories/category-form-dialog/category-form-dialog.component.ts) | Add explicit error notification on mutation failure (**M7**) | Implement error handling in `create/update/delete` subscriptions to display user-facing error banners or toasts when server requests fail. | Users receive immediate feedback if a mutation request fails. |
| **TASK-208** | [`AGENTS.md`](file:///D:/Local-Projects/fintrack-angular-app/AGENTS.md) | Synchronize plan manifest with implemented codebase (**M8**) | Update `AGENTS.md` file manifest and tech stack details to accurately list Angular 20, custom timeline drawer, and file viewer components. | Plan documentation mirrors actual codebase structure. |

---

### Phase 3: Code Cleanup, Quality & Configuration Alignment (Low Severity)

- GOAL-PH3: Clean dead code, eliminate style warnings, remove magic numbers, and fix config discrepancies.

| Task ID | Component / File | Description | Actionable Implementation Details | Target Completion Criteria |
|---|---|---|---|---|
| **TASK-301** | [`transaction-form-dialog.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-form-dialog/transaction-form-dialog.component.ts) | Delete dead component file (**L1**) | Delete unused `transaction-form-dialog.component.ts` (~987 lines) and remove any unused import references. | Dead code removed from project. |
| **TASK-302** | [`angular.json`](file:///D:/Local-Projects/fintrack-angular-app/angular.json), component styles | Fix component style budget warnings (**L2**) | Move long inline styles from `transaction-editor.component.ts` and `file-viewer.component.ts` into external `.css` files, or adjust `anyComponentStyle` budget in `angular.json` to 10 kB. | Production build executes with 0 component style budget warnings. |
| **TASK-303** | [`shared/utils/`](file:///D:/Local-Projects/fintrack-angular-app/src/app/shared) | Refactor calculator and file attachment helpers (**L3**) | Extract duplicate math parser and base64 helper functions into a shared utility file (`calculator.util.ts`). | Code duplication removed across editor components. |
| **TASK-304** | [`category-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/categories/category-list/category-list.component.ts), [`transaction-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-list/transaction-list.component.ts) | Replace magic enum numbers in templates (**L4**) | Import `CategoryType` enum into component TS files and reference `CategoryType.Income` / `CategoryType.Expense` in template condition checks. | Zero magic numbers (`=== 0` / `=== 1`) in HTML templates. |
| **TASK-305** | [`category-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/categories/category-list/category-list.component.ts) | Fix invalid CSS property `text-color:` (**L5**) | Replace `text-color: #94a3b8;` with `color: #94a3b8;` on line 110 of `category-list.component.ts`. | Valid standard CSS properties across all components. |
| **TASK-306** | [`transaction-editor.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-editor/transaction-editor.component.ts) | Make `accountId` dynamic or optional (**L6**) | Replace static `'default-account'` string with configurable account parameter or omit if unused. | Hardcoded account string removed. |
| **TASK-307** | [`angular.json`](file:///D:/Local-Projects/fintrack-angular-app/angular.json), [`environment.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/environments/environment.ts), [`environment.development.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/environments/environment.development.ts) | Align environment and asset configurations (**L7**) | 1. Create `public/` assets directory or update `angular.json` assets input.<br>2. Add `fileReplacements` in `angular.json` production config to substitute `environment.ts` with `environment.prod.ts` (`production: true`). | Build configuration adheres to standard Angular production environment setups. |

---

### Phase 4: Unit Testing & Verification

- GOAL-PH4: Expand unit test suite to cover bug fix scenarios and verify overall build health.

| Task ID | Component / File | Description | Target Completion Criteria |
|---|---|---|---|
| **TASK-401** | [`auth.interceptor.spec.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/interceptors/auth.interceptor.spec.ts) | Add unit tests for 401 refresh failure & request queue rejection | Karma spec verifies queued requests fail cleanly without hanging when refresh fails. |
| **TASK-402** | [`category.service.spec.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/category.service.spec.ts), [`transaction.service.spec.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/transaction.service.spec.ts) | Add tests for `isLoading` reset on HTTP error | Karma specs confirm `isLoading()` returns `false` after HTTP error. |
| **TASK-403** | [`transaction-history-drawer.component.spec.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.spec.ts) | Add test for reopening drawer with same `transactionId` | Karma spec verifies `loadEvents()` is called when `visible` changes from `false` to `true`. |
| **TASK-404** | Full Test & Build Check | Run Karma test suite & Angular production build | `npx ng test --watch=false --browsers=ChromeHeadless` (All specs pass)<br>`npx ng build --configuration production` (Build succeeds clean). |

---

## 3. Alternatives Considered

- **ALT-001 (Retain PrimeNG / Material packages):** Considered refactoring custom tables and timelines to use PrimeNG (`p-table`, `p-timeline`). Declined because custom glassmorphic HTML/CSS is already fully implemented, lightweight, and passing specs; keeping unused 2 MB packages introduces unnecessary bloat.
- **ALT-002 (Cookie-based JWT conversion):** Considered switching JWT storage to httpOnly cookies immediately. Deferred to backend overhaul phase as it requires synchronous C# backend ASP.NET Core API auth policy changes.

---

## 4. Dependencies

- **DEP-001**: `@angular/core`, `@angular/common`, `@angular/router` v19.1.0
- **DEP-002**: `rxjs` ~7.8.0
- **DEP-003**: `primeicons` ^7.0.0 (UI icon fonts)
- **DEP-004**: `mammoth` ^1.12.0 (Dynamic lazy import for DOCX parsing)

---

## 5. Files Affected

- [`src/app/core/interceptors/auth.interceptor.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/interceptors/auth.interceptor.ts)
- [`src/app/core/services/category.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/category.service.ts)
- [`src/app/core/services/transaction.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/transaction.service.ts)
- [`src/app/core/services/auth.service.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/services/auth.service.ts)
- [`src/app/core/guards/auth.guard.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/core/guards/auth.guard.ts)
- [`src/app/shared/components/file-viewer/file-viewer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/shared/components/file-viewer/file-viewer.component.ts)
- [`src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-history-drawer/transaction-history-drawer.component.ts)
- [`src/app/features/auth/register/register.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/auth/register/register.component.ts)
- [`src/app/features/auth/login/login.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/auth/login/login.component.ts)
- [`src/app/features/transactions/transaction-editor/transaction-editor.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-editor/transaction-editor.component.ts)
- [`src/app/features/transactions/transaction-list/transaction-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-list/transaction-list.component.ts)
- [`src/app/features/categories/category-list/category-list.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/categories/category-list/category-list.component.ts)
- [`src/app/features/transactions/transaction-form-dialog/transaction-form-dialog.component.ts`](file:///D:/Local-Projects/fintrack-angular-app/src/app/features/transactions/transaction-form-dialog/transaction-form-dialog.component.ts) *(Delete)*
- [`package.json`](file:///D:/Local-Projects/fintrack-angular-app/package.json)
- [`angular.json`](file:///D:/Local-Projects/fintrack-angular-app/angular.json)
- [`AGENTS.md`](file:///D:/Local-Projects/fintrack-angular-app/AGENTS.md)

---

## 6. Verification & Testing Steps

1. **Unit Test Suite:**
   ```powershell
   cd D:\Local-Projects\fintrack-angular-app
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected Output:* All existing and new specs (34+ specs total) pass cleanly.

2. **Production Bundle Build:**
   ```powershell
   npx ng build --configuration production
   ```
   *Expected Output:* Build succeeds with 0 budget warnings, `transaction-detail-component` lazy chunk size reduced to ~35 kB.

---

## 7. Risks & Assumptions

- **RISK-001**: Removing `primeng` or `@angular/material` could break hidden indirect CSS imports if any exist in `styles.css`. *Mitigation:* Verified via grep that only `primeicons` CSS is imported.
- **ASSUMPTION-001**: Backend .NET API is available at `http://localhost:5000/api` during manual E2E integration testing.

---

## 8. Related Documentation

- [`docs/code_review.md`](file:///D:/Local-Projects/fintrack-angular-app/docs/code_review.md) — Source code review document.
- [`docs/code_review_verification.md`](file:///D:/Local-Projects/fintrack-angular-app/docs/code_review_verification.md) — Code review verification matrix.
