# FinTrack → Mobile Responsive: Plan + Gemini 3.7 Flash Prompt

Stack assumed: Angular v20 (standalone components), .NET v10 API, MongoDB Atlas, plus a voice assistant + chatbot for natural-language transaction entry.

I haven't seen the actual codebase, so Part 1 is a set of **assumptions about likely failure points**, not confirmed facts — the Gemini prompt in Part 4 starts by asking the agent to verify or correct these before touching any code.

---

## Part 1 — Likely mobile failure points (to verify first)

- No/incorrect `<meta name="viewport">`, or layout built with fixed `px` widths (sidebar + content grid) instead of fluid units.
- Desktop-only nav pattern (persistent sidebar) with no collapsed/off-canvas or bottom-nav equivalent.
- Data tables (transaction lists, budget breakdowns) that just overflow-scroll instead of reflowing into cards.
- Charts (ngx-charts/Chart.js/etc.) rendered into a fixed-width canvas that doesn't resize with the container.
- Dialogs/modals sized for desktop (`matDialogConfig` width in px) instead of full-screen sheets on small viewports.
- Inputs with font-size < 16px, which triggers iOS Safari's auto-zoom on focus — a common "feels broken" complaint.
- Touch targets (icon buttons, table row actions) under the ~44×44px comfortable tap size.
- Hover-only interactions (tooltips, hover menus) with no touch equivalent.
- `100vh` used for full-height layouts — breaks on iOS Safari when the address bar shows/hides; needs `100dvh` or a JS fallback.
- Voice input: the Web Speech API isn't supported on iOS Safari at all, and permission/mic UX differs from Android Chrome — needs a detection + graceful fallback to text.
- Chatbot widget: fixed-position panel that gets covered by the on-screen keyboard, since mobile keyboards resize the visual viewport rather than the layout viewport.
- No web app manifest / install prompt — relevant since the goal is *daily* use, and "add to home screen" would remove browser chrome and behave like a real app.

---

## Part 2 — Phased plan

Each phase has a goal and a concrete "done" check, so progress can be verified rather than eyeballed.

**Phase 0 — Audit**
- Inventory current breakpoint/CSS strategy (or confirm there isn't one), nav implementation, table/chart components, dialog usage, and how the voice/chat features attach to the DOM.
- Done when: a short written map exists of every screen/component that breaks below ~768px, with no code changed yet.

**Phase 1 — Foundation**
- Add/fix the viewport meta tag. Define breakpoints (e.g. mobile <640px, tablet 640–1024px, desktop >1024px) as SCSS variables or an Angular CDK `BreakpointObserver` service, used consistently instead of ad hoc `@media` queries.
- Done when: one shared breakpoint source of truth exists and is imported wherever layout decisions are made.

**Phase 2 — Shell & navigation**
- Convert the desktop sidebar into a mobile pattern: hamburger + off-canvas drawer, or a bottom tab bar for the 4–5 most-used sections (Dashboard, Transactions, Budgets, Chat/Voice, Settings).
- Handle safe-area insets (`env(safe-area-inset-*)`) for notch/home-indicator devices.
- Done when: the app shell is navigable one-handed on a 375px-wide viewport with no horizontal scroll.

**Phase 3 — Component-level responsiveness**
- Transaction/budget tables: reflow into stacked cards below the tablet breakpoint instead of horizontal-scrolling a table.
- Forms: 16px+ input font size, adequate spacing, native input types (`type="number"`, `inputmode`) for the numeric keypad.
- Buttons/icon actions: enforce a minimum 44×44px tap target.
- Dialogs: full-screen on mobile via `matDialogConfig` breakpoints (or equivalent), not a shrunk desktop modal.
- Charts: make the container responsive (resize observer or the charting library's built-in responsive mode) instead of a fixed canvas size.
- Done when: every primary screen (dashboard, transaction list, add/edit transaction, budgets) is usable and visually correct at 375px, 390px, and 428px widths.

**Phase 4 — Voice & chatbot mobile UX**
- Feature-detect Web Speech API support; fall back to a text-entry affordance where it's unsupported (notably iOS Safari), rather than a broken mic button.
- Fix the chatbot panel so it repositions above the keyboard instead of being covered — using the `visualViewport` resize event, or CSS `dvh` sizing with a listener as fallback.
- Confirm mic permission prompts behave sanely on both Android Chrome and iOS Safari.
- Done when: adding a transaction by voice and by chat both work end-to-end on a real Android phone and a real iPhone.

**Phase 5 — Installable / daily-use polish**
- Add a web app manifest (icons, name, `display: standalone`, theme color) so the app can be added to the home screen and opens without browser chrome.
- Optional: a minimal service worker for app-shell caching so it opens fast and doesn't feel like "just a website" — full offline transaction support is a stretch goal, not required for this pass.
- Done when: "Add to Home Screen" produces an icon that launches full-screen.

**Phase 6 — Test matrix**
- Manual pass on: iPhone (Safari), a mid-range Android phone (Chrome), plus Chrome DevTools responsive mode at 375/390/414/428/768px as a first-pass check before real devices.
- Lighthouse mobile run (target: no layout-shift/tap-target failures).
- Done when: the checklist above is confirmed on at least one real iOS and one real Android device, not just emulation.

**Phase 7 — Rollout order**
Do the phases in order and screen-by-screen within Phase 3, rather than one giant refactor — easier to verify, easier to revert if something regresses on desktop.

---

## Part 3 — Notes on using this with Gemini 3.7 Flash

A couple of things worth knowing about the model itself before you paste the prompt in:

- It has tunable **thinking levels** (`low` / `medium` / `high`) if you're driving it via the API or AI Studio rather than the consumer app. Worth setting `high` for Phase 0 (the audit/inventory work, where getting the plan right matters more than speed) and leaving it at the default for the mechanical Phase 3 component work.
- It has a 1M-token context window, so for the audit phase you can paste in the actual layout/shell components, routing config, and global styles directly rather than describing them from memory — better than making Gemini guess at your structure.
- Feed it one phase at a time. Its coding benchmarks are strong, but a single "make the whole app responsive" prompt invites exactly the kind of unrequested refactor/over-engineering your own guidelines are trying to avoid.

---

## Part 4 — The prompt

Copy everything in the code block below into Gemini 3.7 Flash. Paste in relevant source files (app shell, routing, global styles, package.json) where indicated.

```
You are helping me make my Angular v20 + .NET v10 + MongoDB app ("FinTrack") mobile-responsive. It currently only works well on desktop, which means I can't use it daily on my phone — that's the actual problem to solve.

WORKING AGREEMENT — follow this on every phase:
1. Think before coding. State your assumptions about my code explicitly before changing anything. If something is ambiguous or you're not sure how a piece of the app works, stop and ask me rather than guessing.
2. Simplicity first. Minimum change that solves the problem for this phase. No new abstractions, no "flexibility" I didn't ask for, no touching things that aren't part of this phase.
3. Surgical changes. Only touch what this phase requires. Match my existing code style even if you'd personally do it differently. If you spot unrelated dead code or bugs, mention them — don't fix them unless I ask.
4. Goal-driven. Each phase below has a "done when" condition. Don't consider a phase finished until you can point to how it satisfies that condition. If a phase's goal is ambiguous, say so before starting.

We are going to work through the phases below ONE AT A TIME. After each phase, stop and report back (what changed, what you assumed, what you verified) and wait for me to confirm before starting the next one. Do not jump ahead.

[PHASE 0 — AUDIT]
Goal: Map every screen/component that breaks on mobile, and confirm or correct my assumptions below about the current implementation. Do not change any code in this phase.
My assumptions (verify these against the real code, which I'll paste below):
- No consistent breakpoint strategy / possibly fixed-px layout
- Desktop-only sidebar nav, no mobile pattern
- Transaction/budget tables just overflow-scroll
- Charts are fixed-width
- Dialogs are sized for desktop
- Voice input uses the Web Speech API with no fallback for browsers that don't support it (e.g. iOS Safari)
- Chatbot panel may get covered by the on-screen keyboard on mobile
- No web app manifest / not installable

You have direct filesystem access to this repo. Explore it yourself: find the app shell/layout component, the routing config, global styles/theme file, package.json, and the transaction-list, add-transaction, and chat/voice components. Don't assume file names or structure — locate them first.
[optional: if you already know the exact paths, list them here to save the agent some searching, e.g. "shell is in src/app/layout/, voice input is in src/app/features/assistant/". Not required — it can find them on its own.]

Output: a short written map of what's actually broken and where, plus corrections to any wrong assumptions above. Stop here and wait for me.

[PHASE 1 — FOUNDATION]
Goal: Establish one shared breakpoint source of truth (SCSS variables or an Angular CDK BreakpointObserver service — pick whichever fits my existing code better and tell me why), and fix the viewport meta tag if needed.
Done when: layout decisions elsewhere in the app can reference this single source instead of ad hoc media queries.

[PHASE 2 — SHELL & NAVIGATION]
Goal: Replace the desktop sidebar with a mobile-appropriate pattern (off-canvas drawer or bottom tab bar — recommend one for a personal finance app and explain the tradeoff), handle safe-area insets for notch devices.
Done when: the app shell is navigable one-handed at 375px width with no horizontal scroll.

[PHASE 3 — COMPONENTS]
Goal, one screen at a time (dashboard, transaction list, add/edit transaction, budgets):
- Tables reflow into cards below tablet width instead of scrolling
- Form inputs are 16px+ font, use correct input types/inputmode for numeric entry
- Tap targets are at least 44x44px
- Dialogs go full-screen on mobile
- Charts resize with their container
Done when: each screen is correct and usable at 375px, 390px, and 428px widths.

[PHASE 4 — VOICE & CHATBOT MOBILE UX]
Goal: Feature-detect Web Speech API support and fall back to text entry where unsupported (iOS Safari in particular). Fix the chatbot panel so it repositions above the on-screen keyboard using visualViewport resize handling (or dvh units + listener fallback).
Done when: adding a transaction by voice and by chat both work on Android Chrome and iOS Safari.

[PHASE 5 — INSTALLABLE]
Goal: Add a web app manifest (icons, name, standalone display, theme color) so the app can be added to the home screen and launches without browser chrome.
Done when: "Add to Home Screen" produces a working full-screen launch.

[PHASE 6 — TEST]
Goal: Give me a manual test checklist covering iOS Safari, Android Chrome, and the 375/390/414/428/768px breakpoints, plus what to check for in a Lighthouse mobile run.

Start with PHASE 0 only. Do not write or modify any code yet — audit and confirm assumptions first, then wait for me.
```
