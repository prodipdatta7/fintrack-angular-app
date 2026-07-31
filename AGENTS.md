# Comprehensive Implementation Plan — FinTrack Angular v20 Client & Event Sourcing

This document defines the complete, additive implementation plan for **FinTrack**. It combines the full initial **Angular v20 Client (`fintrack-angular-app`)** frontend scope with the **Event Sourcing for Transactions** feature across both backend (.NET 10) and frontend.

---

## Goal Description

1. **Frontend Angular v20 Client (`D:\Local-Projects\fintrack-angular-app`)**:
   - Create a standalone Angular v20 single-page application with Signals, PrimeNG, Angular Material, and Jasmine/Karma testing.
   - **Auth Feature**: Login, Register, JWT state management in `AuthService` with Signals, route `AuthGuard`, and functional `HttpInterceptorFn` for Bearer token & refresh handling.
   - **Categories Feature**: Category list view, Income/Expense badges, search/filter, and Create Category modal dialog.
   - **Transactions Feature**: Full CRUD transactions management (Paginated `p-table`, filter bar by category & date, Create/Edit/Delete dialogs).
   - **Event History Drawer**: Slide-over audit trail timeline (`p-timeline`) rendering the event-sourced history stream for any selected transaction.

2. **Backend Event Sourcing (`D:\Local-Projects\fintrack-dotnet-app`)**:
   - Implement event sourcing stream in `FinTrack.Modules.Transactions`.
   - Record immutable domain events (`TransactionCreated`, `TransactionUpdated`, `TransactionDeleted`) in MongoDB `transaction_events`.
   - Expose `GET /api/transactions/{id}/events` API endpoint.

---

## User Review Required

> [!IMPORTANT]
> **Additive Scope Confirmation**:
> All original Angular v20 frontend features (Auth, Categories, Transactions CRUD) are retained 100%. Event Sourcing is added as an enhancement to both the backend persistence layer and frontend transaction UI.

> [!NOTE]
> **Tech Stack & Standards**:
> - **Frontend**: Angular v20 (Signals, Standalone Components), PrimeNG (v19/v20), Angular Material (v20).
> - **Aesthetics**: Glassmorphic Dark Theme with Indigo/Cyan glowing accents.
> - **Testing**: Jasmine & Karma (`ng test --watch=false`).

---

## Complete Application Architecture

```mermaid
flowchart TD
    subgraph FrontendApp [D:\Local-Projects\fintrack-angular-app]
        Router[Angular v20 Router] --> AuthGuard[AuthGuard]
        
        subgraph Views [UI Pages & Views]
            AuthGuard --> LoginView[Login & Register Pages]
            AuthGuard --> CategoryView[Categories List & Modal Dialog]
            AuthGuard --> TxView[Transactions Table Component]
            TxView --> EventDrawer[Transaction Event Sourcing Timeline Drawer]
        end
        
        subgraph CoreState [Core State & HTTP Services]
            AuthService[AuthService - User Signal State]
            CategoryService[CategoryService]
            TransactionService[TransactionService]
            HttpInterceptor[authInterceptorFn - JWT Bearer]
        end
        
        LoginView --> AuthService
        CategoryView --> CategoryService
        TxView --> TransactionService
        EventDrawer --> TransactionService
        
        AuthService --> HttpInterceptor
        CategoryService --> HttpInterceptor
        TransactionService --> HttpInterceptor
    end

    subgraph BackendAPI [D:\Local-Projects\fintrack-dotnet-app - .NET 10]
        HttpInterceptor --> AuthAPI[POST /api/users/auth/*]
        HttpInterceptor --> CatAPI[GET/POST /api/categories]
        HttpInterceptor --> TxAPI[GET/POST/PUT/DELETE /api/transactions]
        HttpInterceptor --> EventAPI[GET /api/transactions/{id}/events]
        
        TxAPI --> MongoTx[(MongoDB transactions)]
        TxAPI --> EventStore[(MongoDB transaction_events)]
        EventAPI --> EventStore
    end
```

---

## Proposed Changes & File Manifest

### Component 1: Backend Event Sourcing (`fintrack-dotnet-app`)

#### [NEW] `src/FinTrack.Modules.Transactions/Domain/Events/TransactionEvent.cs`
- Base abstract domain event record (`Id`, `TransactionId`, `UserId`, `EventType`, `OccurredOnUtc`, `DataJson`).

#### [NEW] `src/FinTrack.Modules.Transactions/Features/GetTransactionEvents/GetTransactionEventsQuery.cs` & `Controller.cs`
- Endpoint `GET /api/transactions/{id}/events` returning chronological event history.

#### [MODIFY] `CreateTransactionHandler.cs`, `UpdateTransactionHandler.cs`, `DeleteTransactionHandler.cs`
- Write `TransactionCreatedEvent`, `TransactionUpdatedEvent`, `TransactionDeletedEvent` to `transaction_events` collection.

---

### Component 2: Frontend Angular v20 Client (`fintrack-angular-app`)

```
D:\Local-Projects\fintrack-angular-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── auth.guard.spec.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── auth.interceptor.spec.ts
│   │   │   ├── models/
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── category.model.ts
│   │   │   │   ├── transaction.model.ts
│   │   │   │   └── transaction-event.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── category.service.ts
│   │   │       ├── category.service.spec.ts
│   │   │       ├── transaction.service.ts (CRUD + getTransactionEvents)
│   │   │       └── transaction.service.spec.ts
│   │   ├── layout/
│   │   │   ├── app-layout.component.ts
│   │   │   ├── sidebar.component.ts
│   │   │   └── navbar.component.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   └── login.component.spec.ts
│   │   │   │   └── register/
│   │   │   │       ├── register.component.ts
│   │   │   │       └── register.component.spec.ts
│   │   │   ├── categories/
│   │   │   │   ├── category-list/
│   │   │   │   │   ├── category-list.component.ts
│   │   │   │   │   └── category-list.component.spec.ts
│   │   │   │   └── category-form-dialog/
│   │   │   │       ├── category-form-dialog.component.ts
│   │   │   │       └── category-form-dialog.component.spec.ts
│   │   │   └── transactions/
│   │   │       ├── transaction-list/
│   │   │       │   ├── transaction-list.component.ts
│   │   │       │   └── transaction-list.component.spec.ts
│   │   │       ├── transaction-form-dialog/
│   │   │       │   ├── transaction-form-dialog.component.ts
│   │   │       │   └── transaction-form-dialog.component.spec.ts
│   │   │       └── transaction-history-drawer/
│   │   │           ├── transaction-history-drawer.component.ts
│   │   │           └── transaction-history-drawer.component.spec.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.component.ts
│   ├── styles.css
│   └── environments/
```

#### Key Feature Detail

1. **Auth Feature (`features/auth`)**:
   - Login & Register reactive forms with validation messages, PrimeNG Card & Button components, glassmorphism dark theme.
   - `AuthService` maintains `currentUser` Signal and persists JWT tokens in `localStorage`.

2. **Categories Feature (`features/categories`)**:
   - List view with search filtering, PrimeNG Tag badges for Income/Expense types, color indicators, and modal form dialog for category creation.

3. **Transactions Feature (`features/transactions`)**:
   - PrimeNG `p-table` displaying amount (Green/Red formatting), type, category, date, and actions column.
   - Global search bar, category dropdown filter, and pagination.
   - Add/Edit transaction modal dialogs.
   - Delete confirmation popup (`ConfirmationService`).

4. **Event History Timeline Drawer (`transaction-history-drawer`)**:
   - Slide-over drawer panel activated by clicking "History / Audit Trail" on any transaction row.
   - PrimeNG `p-timeline` rendering event stream (`TransactionCreated`, `TransactionUpdated`, `TransactionDeleted`) with timestamps and changed properties.

---

## Verification Plan

### Automated Tests (Jasmine & Karma)
```bash
# 1. Run Backend Unit Tests
dotnet test D:\Local-Projects\fintrack-dotnet-app\tests\FinTrack.Modules.Transactions.Tests

# 2. Run Frontend Angular Specs
cd D:\Local-Projects\fintrack-angular-app
npx ng test --watch=false --browsers=ChromeHeadless
```

#### Test Specs Covered:
- `auth.guard.spec.ts` & `auth.interceptor.spec.ts`
- `auth.service.spec.ts`, `category.service.spec.ts`, `transaction.service.spec.ts`
- `login.component.spec.ts` & `register.component.spec.ts`
- `category-list.component.spec.ts` & `category-form-dialog.component.spec.ts`
- `transaction-list.component.spec.ts` & `transaction-form-dialog.component.spec.ts`
- `transaction-history-drawer.component.spec.ts` (Event sourcing timeline spec)

### Manual Verification
1. Start backend `FinTrack.Host` API.
2. Launch Angular client (`ng serve`).
3. Register/Login user via `/login`.
4. Create a Category & Create a Transaction.
5. Edit transaction amount and open **Audit Trail Drawer** to observe the event history timeline!
