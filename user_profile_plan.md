# Profile & Settings Page — Implementation Plan

## Overview

Build a full-stack profile/settings page with 6 tabbed sections: Profile, Preferences, Appearance, Notifications, Data Management, and Danger Zone. The page is accessible by clicking the user avatar/email in the sidebar footer, navigates to `/settings`, and follows all existing codebase patterns.

---

## Part A: Backend (`fintrack-dotnet-app`)

### A1. New Entity: `UserSettings`

**File:** `src/FinTrack.Modules.Users/Domain/UserSettings.cs`

```csharp
public sealed class UserSettings
{
    [BsonId] public string Id { get; set; }
    public string UserId { get; set; }
    public string Currency { get; set; } = "BDT";
    public string TimeZone { get; set; } = "Asia/Dhaka";
    public string DateFormat { get; set; } = "dd/MM/yyyy";
    public int DefaultPageSize { get; set; } = 10;
    public bool EmailNotifications { get; set; } = true;
    public bool BudgetAlerts { get; set; } = true;
    public decimal? BudgetAlertThreshold { get; set; }
}
```

MongoDB collection: `user_settings` (unique index on `UserId`).

### A2. Modify `User` Entity

Add `AvatarUrl` property to `src/FinTrack.Modules.Users/Domain/User.cs`:

```csharp
public string AvatarUrl { get; set; } = string.Empty;
```

### A3. New Features (8 endpoints)

| # | Feature | Method | Route | Request | Response |
|---|---|---|---|---|---|
| 1 | **UpdateProfile** | `PUT` | `/api/users/me` | `{ Email, FirstName, LastName }` | `{ UserId, Email, FirstName, LastName, AvatarUrl }` |
| 2 | **UploadAvatar** | `POST` | `/api/users/me/avatar` | `multipart/form-data` (file) | `{ AvatarUrl }` |
| 3 | **ChangePassword** | `POST` | `/api/users/me/change-password` | `{ CurrentPassword, NewPassword }` | `{ message }` |
| 4 | **GetSettings** | `GET` | `/api/users/me/settings` | — | `{ Currency, TimeZone, DateFormat, DefaultPageSize, EmailNotifications, BudgetAlerts, BudgetAlertThreshold }` |
| 5 | **UpdateSettings** | `PUT` | `/api/users/me/settings` | `{ Currency, TimeZone, DateFormat, DefaultPageSize, EmailNotifications, BudgetAlerts, BudgetAlertThreshold }` | `{ message }` |
| 6 | **ExportData** | `POST` | `/api/users/data/export` | `{ FromDate?, ToDate? }` | `{ file stream (CSV) }` |
| 7 | **DeleteAccount** | `POST` | `/api/users/me/delete-account` | `{ ConfirmPassword }` | `{ message }` |
| 8 | **LogoutAllSessions** | `POST` | `/api/users/me/logout-all` | — | `{ message }` |

Each feature follows the existing vertical slice pattern: `{Feature}Command.cs`, `{Feature}Handler.cs`, `{Feature}Controller.cs`, `{Feature}Validator.cs`.

### A4. Password Validation Rules

All password endpoints must enforce:
- Minimum 8 characters, maximum 30 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (`!@#$%^&*()_+-=[]{}|;':",./<>?~`)

### A5. File Manifest (Backend)

```
src/FinTrack.Modules.Users/
├── Domain/
│   ├── User.cs                                   (MODIFY - add AvatarUrl)
│   └── UserSettings.cs                           (NEW)
├── Features/
│   ├── UpdateProfile/
│   │   ├── UpdateProfileCommand.cs               (NEW)
│   │   ├── UpdateProfileHandler.cs               (NEW)
│   │   ├── UpdateProfileController.cs            (NEW)
│   │   └── UpdateProfileValidator.cs             (NEW)
│   ├── UploadAvatar/
│   │   ├── UploadAvatarCommand.cs                (NEW)
│   │   ├── UploadAvatarHandler.cs                (NEW)
│   │   └── UploadAvatarController.cs             (NEW)
│   ├── ChangePassword/
│   │   ├── ChangePasswordCommand.cs              (NEW)
│   │   ├── ChangePasswordHandler.cs              (NEW)
│   │   ├── ChangePasswordController.cs           (NEW)
│   │   └── ChangePasswordValidator.cs            (NEW)
│   ├── GetSettings/
│   │   ├── GetSettingsQuery.cs                   (NEW)
│   │   ├── GetSettingsHandler.cs                 (NEW)
│   │   └── GetSettingsController.cs              (NEW)
│   ├── UpdateSettings/
│   │   ├── UpdateSettingsCommand.cs              (NEW)
│   │   ├── UpdateSettingsHandler.cs              (NEW)
│   │   ├── UpdateSettingsController.cs           (NEW)
│   │   └── UpdateSettingsValidator.cs            (NEW)
│   ├── ExportData/
│   │   ├── ExportDataCommand.cs                  (NEW)
│   │   ├── ExportDataHandler.cs                  (NEW)
│   │   └── ExportDataController.cs               (NEW)
│   ├── DeleteAccount/
│   │   ├── DeleteAccountCommand.cs               (NEW)
│   │   ├── DeleteAccountHandler.cs               (NEW)
│   │   ├── DeleteAccountController.cs            (NEW)
│   │   └── DeleteAccountValidator.cs             (NEW)
│   └── LogoutAllSessions/
│       ├── LogoutAllSessionsCommand.cs           (NEW)
│       ├── LogoutAllSessionsHandler.cs           (NEW)
│       └── LogoutAllSessionsController.cs        (NEW)
```

No changes needed to `DependencyInjection.cs` — MediatR + FluentValidation assembly scanning handles auto-registration.

---

## Part B: Frontend (`fintrack-angular-app`)

### B1. New Models

**`src/app/core/models/auth.model.ts`** (MODIFY)

Add `avatarUrl` to `User` interface:

```typescript
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}
```

**`src/app/core/models/user-settings.model.ts`** (NEW)

```typescript
export interface UserSettings {
  currency: string;
  timeZone: string;
  dateFormat: string;
  defaultPageSize: number;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  budgetAlertThreshold: number | null;
}

export interface UpdateProfileRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### B2. New Services

**`src/app/core/services/user.service.ts`** (NEW)

- `getProfile()` → `GET /api/users/me`
- `updateProfile(req)` → `PUT /api/users/me`
- `uploadAvatar(file)` → `POST /api/users/me/avatar` (multipart FormData)
- `changePassword(req)` → `POST /api/users/me/change-password`
- `getSettings()` → `GET /api/users/me/settings`
- `updateSettings(req)` → `PUT /api/users/me/settings`
- `exportData(from?, to?)` → `POST /api/users/data/export` (returns Blob)
- `deleteAccount(confirmPassword)` → `POST /api/users/me/delete-account`
- `logoutAll()` → `POST /api/users/me/logout-all`
- Signals: `settings`, `isLoading`

**`src/app/core/services/theme.service.ts`** (NEW)

- Manages dark/light theme toggle (localStorage + CSS class on `<html>`)
- `theme` signal (`'dark' | 'light'`)
- `accentColor` signal (`'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber'`)
- `toggle()` method
- Applies `app-dark` / `app-light` class to `<html>`
- Accent color CSS custom property overrides

### B3. New Component: `SettingsComponent`

**Location:** `src/app/features/settings/settings/`

```
src/app/features/settings/
├── settings/
│   ├── settings.component.ts
│   ├── settings.component.html
│   └── settings.component.scss
```

**Tabbed layout** using Angular Material `mat-tab-group` with 6 tabs:

| Tab | Content | Controls |
|---|---|---|
| **Profile** | Avatar (upload), name, email | Clickable avatar with hover overlay + camera icon; `mat-form-field` inputs for firstName, lastName, email; Save button |
| **Security** | Password change | Current/new/confirm password fields with visibility toggle; floating password rules panel (strength meter + 6 validation rules); Change Password button |
| **Preferences** | Currency, timezone, date format, page size | Bangladesh-focused defaults (BDT, Asia/Dhaka, dd/MM/yyyy); dropdowns for currency, timezone, date format; numeric stepper for page size |
| **Appearance** | Theme toggle, accent color | Material slide toggle for dark/light; 5 color swatches (indigo, cyan, emerald, rose, amber) |
| **Notifications** | Email & budget alerts | Toggle switches for email notifications, budget alerts; threshold input when budget alerts enabled |
| **Data & Privacy** | Export, delete account | Export button (CSV download); Danger zone card with red "Delete Account" button + password confirmation; "Logout All Sessions" button |

**Password Rules Panel:**
- Fixed-positioned popup matching input width
- Strength meter (Low/Medium/High) with 4-segment progress bar
- 6 validation rules: uppercase, lowercase, special char, digit, length 8-30, all valid
- Each rule shows red/green based on criteria
- Solid opaque background (`#111a2e`)

All forms use `ReactiveFormsModule` + Material form fields, following the existing editor patterns.

### B4. Routing

Add to `app.routes.ts` children:

```typescript
{
  path: 'settings',
  loadComponent: () => import('./features/settings/settings/settings.component')
    .then(m => m.SettingsComponent)
}
```

### B5. Sidebar Navigation Update

Update `sidebar.component.html` — make the user footer clickable + show avatar:

```html
<div class="user-footer" routerLink="/settings">
  <div class="user-avatar">
    @if (authService.currentUser()?.avatarUrl) {
      <img [src]="authService.currentUser()?.avatarUrl" class="user-avatar-img" alt="avatar" />
    } @else {
      {{ initials }}
    }
  </div>
  <div class="user-info">
    <span class="user-email">{{ authService.currentUser()?.email }}</span>
    <span class="user-role">Profile & Settings</span>
  </div>
  <button (click)="logout(); $event.stopPropagation()" class="logout-btn" title="Logout">
    <span class="material-icons">logout</span>
  </button>
</div>
```

### B6. Theme Integration

- Add `app-light` CSS variables to `styles.css` (light theme palette)
- Body class toggling via `ThemeService`
- Accent color CSS custom property overrides
- Inject `ThemeService` in `AppComponent` for startup initialization

### B7. Frontend File Manifest

```
src/app/
├── core/
│   ├── models/
│   │   ├── auth.model.ts                         (MODIFY - add avatarUrl)
│   │   └── user-settings.model.ts                (NEW)
│   └── services/
│       ├── user.service.ts                        (NEW)
│       ├── user.service.spec.ts                   (NEW)
│       ├── theme.service.ts                       (NEW)
│       └── theme.service.spec.ts                  (NEW)
├── features/
│   └── settings/
│       └── settings/
│           ├── settings.component.ts              (NEW)
│           ├── settings.component.html            (NEW)
│           └── settings.component.scss            (NEW)
├── layout/
│   └── sidebar/
│       ├── sidebar.component.html                 (MODIFY - clickable footer + avatar)
│       └── sidebar.component.scss                 (MODIFY - avatar image styles)
├── app.component.ts                               (MODIFY - inject ThemeService)
├── app.routes.ts                                  (MODIFY - add /settings route)
└── styles.css                                     (MODIFY - add light theme + accent variables)
```

---

## Implementation Order

| Step | Scope | Description |
|---|---|---|
| 1 | Backend | Create `UserSettings` entity + modify `User` entity (add `AvatarUrl`) |
| 2 | Backend | Build UpdateProfile feature (command/handler/controller/validator) |
| 3 | Backend | Build UploadAvatar feature (command/handler/controller — multipart file upload) |
| 4 | Backend | Build ChangePassword feature |
| 5 | Backend | Build GetSettings + UpdateSettings features |
| 6 | Backend | Build ExportData feature (CSV generation) |
| 7 | Backend | Build DeleteAccount + LogoutAllSessions features |
| 8 | Backend | Run `dotnet build` + `dotnet test` to verify |
| 9 | Frontend | Create `user-settings.model.ts` + modify `auth.model.ts` (add `avatarUrl`) |
| 10 | Frontend | Create `UserService` with all API methods + `uploadAvatar` |
| 11 | Frontend | Create `ThemeService` |
| 12 | Frontend | Build `SettingsComponent` (all 6 tabs + avatar upload + password rules panel) |
| 13 | Frontend | Add `/settings` route + update sidebar footer (clickable + avatar display) |
| 14 | Frontend | Add light theme CSS variables + accent color support |
| 15 | Frontend | Run `ng build` + `ng test` to verify |
