# FinTrack Chat/Voice Assistant — Extensive Plan

Your four requirements, restated as concrete goals:

1. Production-grade chat UI — voice icon, file-attach icon, conversation history with rewind, live text while speaking.
2. Read access to your own financial data (balance, account count, top expenses, etc.) via natural language.
3. Write access — trigger creation of transactions/accounts/categories/tags/savings plans via natural language.
4. Reliable speech recognition **with reliable end-of-turn detection** — knowing when you've stopped talking, not just what you said.

I don't know your current implementation beyond "voice + chat can create a transaction from natural language," so a few architecture decisions below are things I'm choosing on your behalf with reasoning given — flag anything you want to override before Phase 0 starts.

---

## Decisions I'm making explicit

**Voice architecture — Gemini Live API, not Web Speech API + separate LLM.**
This is the one that most affects your requirement #4. I checked current docs rather than relying on stale knowledge: Gemini's Live API is a bidirectional WebSocket that does native speech-to-speech with **built-in voice activity detection** — configurable start/end-of-speech sensitivity and silence duration — plus live transcription of both your speech and the assistant's reply, and function/tool calling, all in one connection. That's requirements #1 (live transcript), #2/#3 (tool calling), and #4 (endpointing) covered by one piece of infrastructure instead of stitching together STT + VAD + LLM + TTS yourself. Tradeoffs worth knowing:
- Sessions cap at 10 minutes by default (session resumption exists but adds complexity) — a bounded chat turn is fine for "add a transaction," less fine for a long back-and-forth.
- A session is audio-out *or* text-out, not seamlessly both — so voice replies come back as audio+transcript, not as a live-typed chat bubble mid-sentence.
- It must be called server-to-server — your .NET backend proxies the WebSocket, the browser never holds the API key.
- It's usage-priced per audio token (cheap, but not free) — push-to-talk (tap to start, VAD auto-ends the turn) is the right default over always-listening, for cost and for privacy.

If you'd rather keep this simpler/free and accept weaker mobile support, the fallback is: Web Speech API (or a client VAD library) for STT → send transcript as text → existing LLM function-calling flow. I'm planning around the Live API below since it directly solves your stated pain point, but this is worth confirming before Phase 5.

**"Rewind to a previous conversation" = reopen a past conversation, not message-level branching.**
The simpler, ChatGPT-sidebar-style interpretation: a list of past conversations, click one, it reopens and you keep going. The more complex interpretation — rewind to a specific earlier message, discard what came after, regenerate from there — is a real feature but meaningfully more work (message versioning, branch storage). I'm planning for the simple version as the default scope and calling out the branching version as a later phase, not baked into Phase 2's data model by default.

**File attach = receipt photo, not arbitrary file upload.**
For an expense tracker, the obviously useful case is: attach a photo of a receipt, the assistant extracts vendor/amount/date via a vision-capable step, and prefills an add-transaction confirmation. Planning around that specifically rather than generic file handling, since "attach a file" with no defined purpose isn't a buildable spec.

---

## Architecture overview

```
Angular chat UI
   │  (text, or mic-captured audio)
   ▼
.NET backend
   ├─ Conversation/message store (MongoDB)
   ├─ Tool registry (the actions below), scoped to the authenticated user
   └─ Proxies audio ⇄ Gemini Live API (WebSocket), keeps API key server-side
   ▼
Gemini Live API — STT+VAD+LLM+TTS in one stream, calls tools, returns
   transcript + audio + tool-call results back through the backend
```

The same tool registry backs both typed chat and voice — one set of functions, two entry points. Don't build separate logic paths for "voice add transaction" and "typed add transaction."

---

## Tool registry (the actual capability surface)

Read tools (requirement #2):
- `GetBalance(accountId?)`
- `GetAccounts()` — list + count of active accounts
- `GetTopExpenses(period, limit)`
- `GetCategorySpend(category, period)`
- `GetSavingsPlanStatus(planId?)`

Write tools (requirement #3):
- `AddTransaction(amount, category, account, note?, date?)`
- `AddAccount(name, type)`
- `AddCategory(name)`
- `AddTag(name)`
- `CreateSavingsPlan(name, targetAmount, targetDate?)`

Rules for every tool, not just the interesting ones:
- Server-side, every tool call is scoped to the authenticated user's own `userId` — never trust an ID the model or client supplies.
- Every write tool returns a **proposed** action, not a committed one. The UI shows a confirmation card ("Add ৳300 expense under Food, from Cash account — Confirm / Edit / Cancel") before anything hits MongoDB. This matters more for a finance app than almost anywhere else — a misheard "3000" instead of "300" should never write silently.
- Read tools are unrestricted (no confirmation needed) — they're safe to call freely.

---

## Data model additions (MongoDB)

- `Conversation { id, userId, title, createdAt, updatedAt }`
- `Message { id, conversationId, role: user|assistant|tool, content, toolCall?, toolResult?, createdAt }`
- Title: auto-generate from the first user message (cheap LLM call or simple truncation), editable.

---

## Phased plan

**Phase 0 — Confirm scope**
Goal: You confirm or correct the three decisions above (voice architecture, rewind semantics, attach-file purpose) before anything is built.
Done when: all three are explicitly signed off, in writing, not assumed.

**Phase 1 — Tool registry (backend only, no UI)**
Goal: Implement and unit-test every read/write tool above against your existing MongoDB collections, independent of chat or voice.
Done when: each tool can be called directly (e.g. via a test harness or Postman) and returns correct, user-scoped data/actions.

**Phase 2 — Conversation persistence**
Goal: `Conversation`/`Message` collections, CRUD endpoints, auto-titling.
Done when: a conversation and its messages survive a page refresh and can be listed.

**Phase 3 — Chat UI (text-first)**
Goal: Rebuild the chat surface — message bubbles, streaming assistant text, input bar with send + attach icon, receipt-photo flow (attach → vision extraction → prefilled confirmation card) wired to the write tools with confirmation UX.
Done when: you can hold a full text conversation that reads data and creates a transaction via receipt photo, no voice involved yet.

**Phase 4 — History management**
Goal: Sidebar/drawer listing past conversations, reopen-to-continue, rename/delete.
Done when: you can leave and return to any past conversation and keep chatting in it.

**Phase 5 — Voice pipeline**
Goal: Mic button (push-to-talk) → backend WebSocket proxy → Gemini Live API → VAD-based end-of-turn detection → live interim transcript rendered in the input area → final transcript posted as a user message through the *same* tool registry from Phase 1.
Done when: speaking "add a transaction of 300 taka for food" reliably produces the same confirmation card as typing it, and the assistant correctly detects when you've stopped talking without you tapping again.

**Phase 6 — Guardrails & polish**
Goal: Rate limiting, session-length handling (graceful reconnect past the 10-minute cap), error states (mic permission denied, network drop mid-stream), cost sanity check (push-to-talk only, no idle streaming).
Done when: killing the network mid-voice-turn and denying mic permission both fail gracefully instead of hanging or silently retrying forever.

**Phase 7 — Test**
Goal: Functional pass per tool (every read and write intent, phrased three different natural ways each), plus a voice-accuracy pass specifically checking end-of-turn behavior on sentences with natural mid-thought pauses.
Done when: no tool call requires a specific exact phrasing to trigger — reasonable paraphrases all resolve correctly.

---

## Gemini 3.7 Flash CLI prompt

Same working agreement as before — think before coding, simplicity first, surgical changes, one phase at a time, stop and report between phases.

```
We're building out FinTrack's chat/voice assistant. Current state: it already handles basic natural-language transaction creation via chat. We're extending it to (1) a proper chat UI with voice input, file attach, and conversation history, (2) read access to my financial data, (3) write access for transactions/accounts/categories/tags/savings plans, and (4) reliable voice input with correct end-of-speech detection.

WORKING AGREEMENT — same as our mobile-responsiveness work:
1. Think before coding — state assumptions about my existing code before changing it, ask if unsure.
2. Simplicity first — minimum change for the current phase only.
3. Surgical changes — don't touch code outside this phase's scope, match my existing style.
4. Goal-driven — each phase has a "done when" check below; don't call a phase finished until you can point to how it's satisfied.

Work through the phases below ONE AT A TIME. Stop and report after each phase (what changed, what you assumed, what you verified) and wait for my confirmation before starting the next. You must write the progress you have done so far in a file in the same folder named PROGRESS.md, this is a must have things as it might the case that any other agnet can take over this in future from where you stop. Also before starting, make an ImplementationPlan.md as well. 

Decisions already made, don't relitigate these:
- Voice: Gemini Live API (WebSocket, server-to-server via the .NET backend, built-in VAD for end-of-turn detection). Push-to-talk, not always-listening.
- "Rewind" means reopening a past conversation from a history list, not message-level branching.
- File attach means: receipt photo → vision extraction → prefilled add-transaction confirmation.
- Every write action (add transaction/account/category/tag/savings plan) must show a confirmation card and get explicit user confirmation before committing to MongoDB. Read actions don't need confirmation.
- Tool calls are always scoped server-side to the authenticated user — never trust a client-supplied user/account ID.

[PHASE 1 — TOOL REGISTRY]
Goal: Implement these as backend functions, independent of chat/voice UI: GetBalance, GetAccounts, GetTopExpenses, GetCategorySpend, GetSavingsPlanStatus (read, no confirmation needed), and AddTransaction, AddAccount, AddCategory, AddTag, CreateSavingsPlan (write — return a proposed action object, don't commit yet).
Explore my existing codebase first to find how transactions/accounts are currently modeled and queried — don't assume a schema.
Done when: each tool is independently testable and returns correct, user-scoped results.
Stop here and wait for me.

[PHASE 2 — CONVERSATION PERSISTENCE]
Goal: Conversation/Message collections and CRUD endpoints, auto-generated conversation titles.
Done when: a conversation survives a refresh and can be listed.

[PHASE 3 — CHAT UI]
Goal: Rebuild the chat surface: message bubbles, streaming text, input bar with send + attach icon. Wire the attach icon to a receipt-photo → vision extraction → prefilled confirmation flow. Wire write-tool results to a confirmation card (confirm/edit/cancel) before committing.
Done when: a full text conversation can read data and create a transaction via receipt photo.

[PHASE 4 — HISTORY MANAGEMENT]
Goal: A history drawer/sidebar listing past conversations, reopen-to-continue, rename, delete.
Done when: any past conversation can be reopened and continued.

[PHASE 5 — VOICE]
Goal: Push-to-talk mic button, backend WebSocket proxy to Gemini Live API, live interim transcript shown in the input area while speaking, VAD-based end-of-turn detection, final transcript routed through the same Phase 1 tool registry.
Done when: speaking a request produces the same result as typing it, and the app correctly detects when I've stopped talking without needing a second tap.

[PHASE 6 — GUARDRAILS]
Goal: Handle the 10-minute Live API session cap gracefully, mic-permission-denied and network-drop error states, and confirm there's no idle/always-on audio streaming (cost control).
Done when: both failure cases (permission denied, connection drop mid-turn) fail visibly and gracefully instead of hanging.

Start with PHASE 1 only. Explore the existing codebase and report your findings and assumptions before writing any code.
```
