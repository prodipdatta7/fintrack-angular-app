# 09 — Auth

**Depends on:** [01 Design System](01-design-system.md) only — no backend work · [← Master plan](../../plan.md)

Source: tsx:2387–2473.

Login and register already work (reactive forms, validation, submit guard, `login.component.spec.ts` is
264 lines and passing). This plan is **presentation only** — no change to `AuthService`, the guards, the
interceptor, or the form logic.

---

## Files

| File | Change |
|---|---|
| `features/auth/login/login.component.{html,scss}` | **[MODIFY]** |
| `features/auth/register/register.component.{html,scss}` | **[MODIFY]** |
| `features/auth/auth-shell/` | **[NEW]** — the shared frame both pages sit in |

`login.component.scss` (126 lines) and `register.component.scss` (133 lines) largely duplicate each other
today. Extracting `auth-shell` removes that duplication and keeps both under the 8 kB budget.

## `auth-shell` (tsx:2389–2401, 2467–2470)

```html
<div class="auth-page">
    <span class="auth-orb auth-orb--indigo"></span>     <!-- tsx:2390 -->
    <span class="auth-orb auth-orb--emerald"></span>    <!-- tsx:2391 -->

    <div class="auth-card">                             <!-- max-w 28rem, radius-xl, blur, shadow -->
        <div class="auth-brand">                        <!-- gradient tile + wordmark -->
            <div class="auth-brand-mark"><span class="material-icons">account_balance_wallet</span></div>
            <span class="auth-brand-text">FinTrack Engine</span>
        </div>

        <nav class="auth-switch">                       <!-- segmented control, tsx:2403–2420 -->
            <a routerLink="/login"    routerLinkActive="active">Sign In</a>
            <a routerLink="/register" routerLinkActive="active">Create Account</a>
        </nav>

        <ng-content />                                  <!-- the form -->

        <p class="auth-footnote">Protected by FinTrack 256-bit encryption &amp; real-time sync engine</p>
    </div>
</div>
```

- Orbs: 24rem circles, `--primary` / `--success` at ~20%, `filter: blur(48px)`, `pointer-events: none`,
  positioned top-left and bottom-right. Suppressed under `prefers-reduced-motion` only if animated — they
  are static, so no handling needed.
- Brand text uses the existing `.text-gradient`.
- The doc toggles views with local state (tsx:2405, 2413); here the segmented control is two `routerLink`s,
  so `/login` and `/register` stay real routes and the guards keep working unchanged.
- Wordmark: the doc says `FinTrack Engine`; the sidebar says `FinTrack`. Use `FinTrack` in both for
  consistency, or accept the doc's string — **recommend `FinTrack`**.

## Form styling (tsx:2422–2465)

Applies to both pages, no field changes:

| Element | Treatment |
|---|---|
| Labels | 0.6875rem, uppercase, `letter-spacing: .05em`, `--text-secondary` |
| Inputs | `--surface-inset` fill, `--border-subtle`, `--radius-sm`, 0.75rem padding, `--primary` focus border |
| Submit | Full width, `linear-gradient(90deg, var(--primary), var(--success))`, `--radius-sm`, glow shadow, `active:scale(.99)`, trailing arrow icon; label `Access Portal` / `Register Account` (tsx:2462) |
| Errors | Keep the existing Material error rendering — the doc has none, and losing validation messages would be a regression |
| Loading | Keep the existing disabled/spinner submit state |

The register page keeps its First/Last name fields (the doc collapses them into one `Full Name`, tsx:2425 —
that would break `RegisterRequest`, which takes `firstName` + `lastName`).

---

## Acceptance Criteria

- [ ] Both pages share `auth-shell`; the duplicated SCSS is gone.
- [ ] The segmented control routes between `/login` and `/register` and marks the active one.
- [ ] All existing validation, error messages and submit-guard behaviour still work.
- [ ] `login.component.spec.ts` and `register.component.spec.ts` pass unchanged (or with selector-only edits).
- [ ] Successful login lands on `/dashboard`.
- [ ] Both themes; the card and orbs remain legible on light.
- [ ] Usable at 375 px — the card is full-width with padding, not clipped.

## Tests

| Spec | Covers |
|---|---|
| `login.component.spec.ts` | **MODIFY** — selector updates only; assertions unchanged |
| `register.component.spec.ts` | **MODIFY** — same |
| `auth-shell.component.spec.ts` | **NEW** — renders projected content, active link state |
