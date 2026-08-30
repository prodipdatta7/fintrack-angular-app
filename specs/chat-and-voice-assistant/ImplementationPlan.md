# FinTrack Chat & Voice Assistant — Detailed Implementation Plan

## 1. Executive Summary & Architecture Overview

FinTrack is extending its capabilities with a production-grade conversational and voice assistant powered by the **Gemini Live API** (for bidirectional audio + VAD + streaming STT/TTS) and structured tool-calling, designed with strict security, privacy, user consent, responsive UX, theme-agnostic styling, PascalCase API naming, and PascalCase MongoDB document fields.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                 Angular Client (v20)                   │
                    │   - Responsive Chat Interface (Desktop panel / Mobile) │
                    │   - Theme-Agnostic Tokens (Light / Dark / Custom)      │
                    │   - Privacy & Consent: Explicit Mic/Camera Dialogs     │
                    │   - Push-to-Talk Voice (Audio capture -> WebSocket)    │
                    │   - Interim Transcript & Active Stream Visualizer      │
                    │   - Receipt File Attach & OCR Extraction Flow         │
                    │   - Proposed Action Confirmation Cards (User Consent)  │
                    │   - Conversation History Drawer (Reopen/Rename/Delete) │
                    └───────────┬────────────────────────────────┬───────────┘
                                │ HTTP / REST (JWT Auth)         │ WebSocket (JWT Auth)
                                ▼                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                 .NET 10 Web API Backend                │
                    │   - CurrentUser (Firebase JWT validation & scoping)    │
                    │   - Assistant Tool Registry (Read & Proposed Write)    │
                    │   - PascalCase Self-Explanatory API Endpoints          │
                    │   - Rate Limiting & Bounded Session Timeouts (10m max) │
                    │   - Conversation & Message Persistence (MongoDB)       │
                    │   - PascalCase Document Properties in Mongo            │
                    │   - Gemini Live API Proxy (Keeps API keys secure)      │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                                ▼                                ▼
                    ┌──────────────────────┐         ┌───────────────────────┐
                    │   MongoDB Storage    │         │    Gemini Live API    │
                    │ - accounts           │         │ - STT + VAD           │
                    │ - categories, tags   │         │ - Natural Language    │
                    │ - transactions       │         │ - Function Calling    │
                    │ - savings_plans      │         │ - TTS / Audio Stream  │
                    │ - assistant_convs    │         │ - Vision / OCR        │
                    │ - assistant_messages │         │ - TTS / Audio Stream  │
                    └──────────────────────┘         └───────────────────────┘
```

---

## 2. Core Architectural Principles & Guardrails

### 2.1 PascalCase API & MongoDB Field Naming Conventions
- **PascalCase REST Endpoints**:
  - `GET api/Assistant/GetConversations`
  - `POST api/Assistant/CreateConversation`
  - `GET api/Assistant/GetConversation/{conversationId}`
  - `PATCH api/Assistant/UpdateConversationTitle/{conversationId}`
  - `DELETE api/Assistant/DeleteConversation/{conversationId}`
  - `GET api/Assistant/GetMessages/{conversationId}`
  - `POST api/Assistant/SendMessage`
  - `POST api/Assistant/ExtractTransactionFromReceipt`
  - `GET api/Assistant/GetToolSchemas`
  - `POST api/Assistant/ExecuteTool`
- **PascalCase MongoDB Document Fields**: All fields in `assistant_conversations` (`Id`, `UserId`, `Title`, `IsPinned`, `LastMessageAt`, `CreatedAt`, `ModifiedAt`) and `assistant_messages` (`Id`, `UserId`, `ConversationId`, `Role`, `Content`, `ActionType`, `ActionStatus`, `ActionSummary`, `ActionPayloadJson`, `ToolCallJson`, `ToolResultJson`, `CreatedAt`, `ModifiedAt`) are mapped in PascalCase.

### 2.2 Security & Strict Multi-Tenancy
- **Server-Side User Scoping**: Every query, aggregation, and proposed action is strictly filtered and validated against `_currentUser.UserId` obtained from verified Firebase JWT claims. Never trust a client-supplied or LLM-generated `userId` or `accountId`.
- **API Key Protection**: The browser NEVER receives or holds the Gemini API key. All Gemini Live WebSocket and Vision API communication is securely proxied server-to-server by the .NET backend.
- **WebSocket Authentication**: The WebSocket connection (`ws/Assistant/LiveSession`) requires a valid JWT Bearer token on handshake and terminates immediately if unauthorized or expired.

### 2.3 User Consent & Device Permissions UX
- **Explicit Permission Modal**: Before requesting browser `navigator.mediaDevices.getUserMedia` for microphone or camera access, display an in-app permission/consent modal explaining *why* audio/camera is needed, how it is used, and that it is active only on push-to-talk.
- **Active Streaming Indicator**: A prominent visual recording badge and live audio waveform display whenever the microphone is actively capturing audio.
- **Push-to-Talk (No Always-On Listening)**: Microphone stream is only opened when the user explicitly holds or taps the push-to-talk button and stops immediately upon turn endpointing (VAD) or release.

### 2.4 Proposed Action Confirmation UX (Write Consent)
- **Zero Silent Mutations**: AI write tools NEVER write directly to MongoDB.
- They return structured `ProposedAction` objects. The UI presents an interactive confirmation card (**Confirm / Edit / Cancel**). Database writes only execute after explicit user confirmation.

### 2.5 Theme-Agnostic UI Design
- Strictly consume semantic CSS tokens from `_tokens.scss` (`var(--surface-1)`, `var(--text-primary)`, `var(--border-subtle)`, `var(--primary)`, `var(--success)`, `var(--danger)`, etc.). Zero hardcoded colors.
- Full automatic support for Light (`[data-theme='light']`) and Dark (`[data-theme='dark']`) modes.

### 2.6 Responsive Mobile-First Design
- Compliant with `_breakpoints.scss` mixins (`mobile-only`, `desktop-up`, `touch-target(44px)`).
- Mobile (`< 768px`): Bottom-sheet drawer, dynamic viewport height (`100dvh`), and safe-area inset handling (`--sab`, `--sat`).
- Desktop (`>= 768px`): Docked side panel or floating glassmorphic assistant widget.

---

## 3. Data Models & MongoDB Schema (PascalCase)

### 3.1 Existing Collections Leveraged
- `accounts`: `Account` (`Name`, `AccountType`, `Balance`, `Currency`, `Color`, `IsClosed`, `UserId`)
- `categories`: `Category` (`Name`, `NormalizedName`, `Type`, `Color`, `Icon`, `BudgetLimit`, `UserId`)
- `tags`: `UserTag` (`Name`, `NormalizedName`, `UserId`)
- `transactions`: `Transaction` (`Title`, `Amount`, `Type`, `CategoryId`, `AccountId`, `Date`, `Note`, `UserId`)
- `savings_plans`: `SavingsPlan` (`Title`, `TargetAmount`, `CurrentAmount`, `Color`, `Deadline`, `UserId`)

### 3.2 Assistant Collections
- `assistant_conversations`: `Id`, `UserId`, `Title`, `IsPinned`, `LastMessageAt`, `CreatedAt`, `ModifiedAt`
- `assistant_messages`: `Id`, `UserId`, `ConversationId`, `Role`, `Content`, `ActionType`, `ActionStatus`, `ActionSummary`, `ActionPayloadJson`, `ToolCallJson`, `ToolResultJson`, `CreatedAt`, `ModifiedAt`

---

## 4. Phased Implementation Breakdown

### Phase 1: Tool Registry (Backend Only) — COMPLETED
- 10 tools implemented (5 Read + 5 Proposed Write) + dynamic dispatching & schemas.

### Phase 2: Conversation Persistence — COMPLETED
- MongoDB collections with PascalCase properties, CRUD endpoints, auto-titling, cascading deletes.

### Phase 3: Chat UI (Text-First + Receipt Attachment + Consent & Responsive) — NEXT UP
- Angular client standalone chat component with responsive mobile drawer / desktop panel.
- Theme-agnostic design with `_tokens.scss`.
- Interactive Proposed Action Confirmation cards.
- Receipt photo OCR vision pipeline with user consent.

### Phase 4: History Management
- History drawer with search, pinned items, and reopen/rename/delete.

### Phase 5: Voice Pipeline (Gemini Live API + Mic Consent)
- Push-to-talk mic button, WebSocket proxy, VAD endpointing, live transcript.

### Phase 6: Guardrails & Polish
- 10-minute session handling, network drop and permission denial graceful recovery.

### Phase 7: Verification & Testing
- Full unit and integration test coverage.
