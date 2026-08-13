# Auth Refactor — Firebase Authentication

**Scope:** `fintrack-angular-app` (frontend) + `fintrack-dotnet-app` (backend). Both repos change.  
**Source note:** Original requirement — *"For signin and signup, have to move all the tasks to firebase and firebase will handle this."*

The goal is to delegate **identity** to Firebase Authentication: sign-in, sign-up, password
hashing/storage, session, password reset and email verification all move to Firebase. The FinTrack
API stops issuing, hashing and refreshing its own credentials and instead **trusts Firebase ID
tokens** as the bearer credential.

---

## 1. Architecture Decision

| | **Option B — Trust Firebase ID tokens directly (recommended)** | Option A — Backend exchange endpoint |
|---|---|---|
| Where credentials are checked | Firebase (Google-signed ID tokens validated by the API via Google JWKS) | Firebase on the client, then an `/auth/exchange` endpoint that issues FinTrack's own JWT |
| Backend auth code | Login/Register/Refresh/TokenService + local password auth **deleted** | Kept — backend still issues/refreshes its own JWT |
| Session in the browser | Firebase SDK manages the ID/refresh token | Backend JWT + refresh token in `localStorage` as today |
| Existing Mongo data | Intact — `UserId` stays the Mongo `_id`; a `FirebaseUid` field maps identity | Intact |
| Matches the intent | Yes — Firebase fully owns authentication | Partially — backend keeps a session layer |

**Decision: Option B.** Firebase ID token is the sole bearer credential. The backend keeps Mongo
`_id` as the internal `UserId` and resolves it from the token's Firebase `uid`, so **no data
migration across `transactions` / `categories` / `accounts` is required** — only a controlled
`FirebaseUid` link on the `users` collection.

### Identity model (critical)

Two IDs exist; do not conflate them:

| Layer | ID | Role |
|---|---|---|
| Firebase Auth | `uid` (`sub` claim) | Proves who signed in |
| Mongo `users` | `_id` | Owns all FinTrack data (`CurrentUser.UserId`) |

Frontend `User.id` remains the **Mongo `_id`**, hydrated from `GET /get-me` after Firebase session
is ready. Firebase `uid` is auth plumbing only (never used as `User.id` in UI/state).

---

## 2. Firebase Project Setup (one-time, manual)

1. Open the Firebase console → the project used by `firebase.json` (or create one).
2. **Authentication → Sign-in method** → enable **Email/Password**.
3. **Authentication → Settings → Authorized domains** → ensure `localhost` and the production
   hosting domain (e.g. `<project>.web.app` / custom domain) are listed.
4. **Project settings → Your apps → Add web app** (`</>`); copy the SDK config
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). These are
   public values — safe to commit to `environment.*.ts`.
5. Confirm the app's `authDomain` matches the configured one (e.g. `<project>.firebaseapp.com`).
6. (Backend revoke / optional Admin ops) Create a service account with Firebase Auth Admin access;
   store JSON via Secret Manager / env — **never** commit it. Needed for §4.4 revoke-all-sessions.

---

## 3. Frontend Changes — `fintrack-angular-app`

| File | Change |
|---|---|
| `package.json` | **[MODIFY]** — add `firebase` dependency (plain SDK; avoids `@angular/fire` peer churn on Angular 20) |
| `src/environments/environment.ts`, `environment.prod.ts` | **[MODIFY]** — add `firebase: { … }`; drop obsolete “auth cookies / SameSite” comments |
| `src/app/core/firebase/firebase.ts` | **[NEW]** — `initializeApp(environment.firebase)`, export the `Auth` singleton |
| `src/app/core/services/auth.service.ts` | **[REWRITE]** — Firebase session + profile hydrate (see below) |
| `src/app/core/services/auth.service.spec.ts` | **[REWRITE]** — mock Firebase `Auth` + `get-me` hydrate |
| `src/app/core/models/auth.model.ts` | **[MODIFY]** — keep profile-shaped `User` (`id` = Mongo id); drop `AuthResponse` / `LoginRequest` / `RegisterRequest` |
| `src/app/core/interceptors/auth.interceptor.ts` | **[REWRITE]** — Firebase ID token; 401 → force refresh once; drop cookies / `withCredentials` / anonymous-auth URL list |
| `src/app/core/interceptors/auth.interceptor.spec.ts` | **[REWRITE]** — async token, single-flight retry, retry failure → logout |
| `src/app/core/guards/auth.guard.ts` | **[REWRITE]** — async wait for `authReady`; `redirectIfAuth` → `/dashboard` |
| `src/app/core/guards/auth.guard.spec.ts` | **[MODIFY]** — init wait + redirect targets |
| `src/app/features/auth/login/login.component.{ts,html}` | **[MODIFY]** — `signInWithEmailAndPassword`, friendly errors, “Forgot password?” |
| `src/app/features/auth/register/register.component.{ts,html}` | **[MODIFY]** — Firebase create + displayName; then hydrate / ensure profile names |
| `src/app/features/auth/*/*.spec.ts` | **[MODIFY]** — mock Firebase auth |
| `src/app/features/settings/settings/*` | **[MODIFY]** — change password, delete account, logout-all → Firebase-aware flows (see §3.4) |
| `src/app/core/services/user.service.ts` | **[MODIFY]** — remove `changePassword`; adjust `deleteAccount` / `logoutAll` contracts |
| `src/index.html` | **[MODIFY]** — CSP for Firebase Auth (see §3.5) |

### 3.1 `AuthService` shape

```ts
initializing   = signal(true)              // true until first onAuthStateChanged
currentUser    = signal<User | null>(null) // Mongo-shaped profile, or null
isAuthenticated = computed(() => !!this.firebaseUid())

// Internal: Firebase uid present while signed in (even before get-me finishes)
private firebaseUid = signal<string | null>(null)

/** Resolves once when initializing flips false — guards await this. */
readonly authReady: Promise<void>

login(email, password)       // signInWithEmailAndPassword → then hydrateProfile()
register({email, password, firstName, lastName})
  // createUserWithEmailAndPassword
  // + updateProfile({ displayName: `${firstName} ${lastName}`.trim() })
  // + hydrateProfile() then PATCH update-profile with first/last if get-me names blank
forgotPassword(email)        // sendPasswordResetEmail
logout()                     // signOut(auth); clear signals; CurrencyStore.reset()
                             // NO POST /logout (endpoint deleted)
getToken(forceRefresh = false): Promise<string | null>
  // auth.currentUser?.getIdToken(forceRefresh) ?? null

/** Merge Mongo profile into currentUser (id, email, firstName, lastName, avatarUrl). */
hydrateProfile(): Promise<void>  // GET /get-me via UserService
```

Session restore path:

1. `onAuthStateChanged` fires with a Firebase user → set `firebaseUid`, `initializing = false`.
2. Call `hydrateProfile()` (get-me). Until it returns, `isAuthenticated` is already true so the
   guard allows `/dashboard`; UI that needs names/avatar waits on `currentUser()`.
3. `onAuthStateChanged` fires `null` → clear all signals.

Do **not** persist `token` / `refresh_token` / `user_info` in `localStorage`. Settings avatar/profile
updates write through `currentUser.set(...)` in memory only (Firebase owns session persistence).

Friendly Firebase error map: `auth/invalid-credential`, `auth/email-already-in-use`,
`auth/weak-password`, `auth/too-many-requests`, `auth/network-request-failed`,
`auth/requires-recent-login` (settings reauth).

### 3.2 Guards (must be async)

```ts
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.authReady.then(() => {
    if (auth.isAuthenticated()) return true;
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  });
};

export const redirectIfAuth: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.authReady.then(() =>
    auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true,
  );
};
```

This is what makes “reload without flashing login” actually work.

### 3.3 `authInterceptor` shape

```ts
// Module-level single-flight (preserve today’s refreshInProgress idea)
let refreshInFlight: Promise<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  // No withCredentials — cookie auth is gone; same-origin /api is enough.
  return from(auth.getToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !auth.isAuthenticated()) return throwError(() => error);
      if (!refreshInFlight) {
        refreshInFlight = auth.getToken(true).finally(() => { refreshInFlight = null; });
      }
      return from(refreshInFlight).pipe(
        switchMap((fresh) => {
          if (!fresh) {
            auth.logout();
            return throwError(() => error);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${fresh}` } }));
        }),
        catchError((e) => {
          auth.logout();
          return throwError(() => e);
        }),
      );
    }),
  );
};
```

### 3.4 Settings — in scope for cutover (not follow-on)

These UIs call endpoints that disappear with local auth; they must change in the same PR set.

| UI | New behaviour |
|---|---|
| **Change password** | Firebase: `reauthenticateWithCredential` + `updatePassword`, **or** “Email me a reset link” via `sendPasswordResetEmail`. Remove `POST /change-password` client call. |
| **Delete account** | 1) Firebase `reauthenticateWithCredential` (password). 2) `POST /delete-user-account` with **no password body** (Bearer proves identity + recent auth is client-enforced). 3) On success, `deleteUser(firebaseUser)` then local `logout()` + navigate `/login`. Backend deletes Mongo user/settings/avatar only — no `PasswordHasher`. |
| **Logout all sessions** | Keep the button. Call rewritten `POST /logout-all-sessions` which uses **Firebase Admin** `RevokeRefreshTokensAsync(uid)`. Then local `signOut` + navigate `/login`. User must sign in again on every device. |

### 3.5 CSP (`src/index.html`)

Extend beyond today’s `connect-src 'self'`:

- `connect-src`: `'self'` `https://identitytoolkit.googleapis.com` `https://securetoken.googleapis.com` `https://www.googleapis.com`
- `frame-src`: `'self'` `data:` `https://*.firebaseapp.com` `https://*.google.com` (Auth iframes / reCAPTCHA-related frames)

If a prod build still blocks Auth, check the console for CSP violations and add the reported host — do not ship with `connect-src 'self'` only.

---

## 4. Backend Changes — `fintrack-dotnet-app`

| File | Change |
|---|---|
| `src/FinTrack.Api/Program.cs` | **[MODIFY]** — Firebase JWKS JwtBearer; `OnTokenValidated` → resolve Mongo id; remove `access_token` cookie fallback |
| `src/FinTrack.Modules.Users/Domain/User.cs` | **[MODIFY]** — add `FirebaseUid`; make `PasswordHash` obsolete/unused (empty / remove after cutover) |
| `…/Services/IFirebaseUserResolver.cs` + `FirebaseUserResolver.cs` | **[NEW]** — resolve / provision (see §4.2) |
| `…/Features/Login/*` | **[DELETE]** — includes cookie `logout` |
| `…/Features/Register/*` | **[DELETE]** — replaced by lazy provision |
| `…/Features/RefreshToken/*` | **[DELETE]** |
| `…/Features/ChangePassword/*` | **[DELETE]** |
| `…/Features/LogoutAllSessions/*` | **[REWRITE]** — Firebase Admin revoke refresh tokens for `FirebaseUid` (not Mongo `refresh_tokens`) |
| `…/Features/DeleteAccount/*` | **[REWRITE]** — authz via Bearer only; drop password verify; still delete user, settings, avatar; drop `refresh_tokens` cleanup (collection retired) |
| `…/Features/UpdateProfile/*` | **[MODIFY]** — **email is read-only** (must match Firebase); allow first/last/avatar only. Changing email later = Firebase `updateEmail` + sync (out of cutover unless needed) |
| `…/Services/TokenService*`, `PasswordHasher*`, `IPasswordHasher` | **[DELETE]** |
| `…/Domain/RefreshToken.cs` + `refresh_tokens` usage | **[DELETE]** / stop writing |
| `DependencyInjection.cs` | **[MODIFY]** — register resolver + Firebase Admin; remove hasher/token service |
| `appsettings*.json` | **[MODIFY]** — remove `Jwt:*`; add `Firebase:ProjectId`; Admin credential via env/secret |
| `tests/FinTrack.Modules.Users.Tests` | **[MODIFY]** — resolver, delete-account, revoke-sessions, JwtBearer mapping |

Also seed a **unique index** on `users.FirebaseUid` (sparse/partial so pre-migration docs without uid are fine until linked).

### 4.1 JwtBearer wiring

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = $"https://securetoken.google.com/{projectId}";
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{projectId}",
            ValidateAudience = true,
            ValidAudience = projectId,
            ValidateLifetime = true,
            // Signing keys come from OIDC metadata / JWKS — do not set a symmetric key
        };
        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var firebaseUid = ctx.Principal!.FindFirst("user_id")?.Value
                    ?? ctx.Principal.FindFirst("sub")?.Value
                    ?? throw new SecurityTokenException("Missing Firebase uid.");
                var email = ctx.Principal.FindFirst("email")?.Value;
                var name = ctx.Principal.FindFirst("name")?.Value;

                var resolver = ctx.HttpContext.RequestServices.GetRequiredService<IFirebaseUserResolver>();
                var mongoId = await resolver.ResolveUserIdAsync(
                    firebaseUid, email, name, ctx.HttpContext.RequestAborted);

                var identity = (ClaimsIdentity)ctx.Principal.Identity!;
                // Replace any prior NameIdentifier (Firebase sub) with Mongo id for ICurrentUser
                var existing = identity.FindFirst(ClaimTypes.NameIdentifier);
                if (existing is not null) identity.RemoveClaim(existing);
                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, mongoId));
            }
        };
    });
```

`ICurrentUser.UserId` keeps reading `ClaimTypes.NameIdentifier` → Mongo `_id`. No changes in
Transactions / Categories / Accounts handlers.

### 4.2 `FirebaseUserResolver` (safe rules)

```
ResolveUserIdAsync(firebaseUid, email, name):
  1. Find by FirebaseUid == uid
       → return Id
  2. Else create User:
       Email = email (normalized),
       FirebaseUid = uid,
       FirstName/LastName = split name if present else empty,
       PasswordHash = "" (unused)
       Insert; on duplicate-key (unique FirebaseUid) → re-find by uid and return
       Publish UserRegistered ONCE (create path only)
       return Id
```

**Do not auto-link by email alone.** Blind `Email == token.email → backfill FirebaseUid` is an
account-takeover vector during migration (whoever registers that email in Firebase first wins the
Mongo row). Linking existing Mongo users is an explicit migration step (§4.3), not a hot-path
side effect.

Caching: after resolve, optionally stash `firebaseUid → mongoId` in a short-lived memory cache so
`OnTokenValidated` is not a Mongo round-trip on every request. Always handle unique-index races.

### 4.3 Existing-user migration (no BCrypt console import)

Current passwords are **BCrypt**. Firebase Auth import expects its own hash format — the Firebase
console “Import users” path **cannot** reuse existing FinTrack password hashes as-is.

Pick one cutover strategy (document the choice in the PR):

| Strategy | Behaviour |
|---|---|
| **A — Forced reset (recommended for small user bases)** | Before cutover, export Mongo emails. Create Firebase users via Admin SDK **without** password (or with random password), email each user a Firebase password-reset link. After they reset, set `users.FirebaseUid` via Admin script keyed by email (offline, trusted). |
| **B — Dual-run window** | Keep old `/login` temporarily; on successful old login, create/link Firebase user with the plaintext password just verified, write `FirebaseUid`, then issue… *not used under Option B.* Prefer A. |
| **C — Greenfield** | If prod has no real users yet, skip migration; delete or ignore orphan Mongo users. |

Never: “let first Firebase sign-up with same email claim the Mongo user” in the live resolver.

### 4.4 Logout all sessions (rewrite)

```
POST /api/logout-all-sessions  [Authorize]
→ load User by CurrentUser.UserId
→ FirebaseAdmin Auth.RevokeRefreshTokensAsync(user.FirebaseUid)
→ return 200
```

Client then `signOut` locally. Existing Firebase ID tokens may remain valid until expiry (~1h);
document that limitation or add a server-side `auth_time` / revocation-check later (follow-on).

### 4.5 Delete account (rewrite)

```
POST /api/delete-user-account  [Authorize]
body: { }   // no ConfirmPassword
→ delete avatar file if any
→ delete users + user_settings for CurrentUser.UserId
→ return 200
```

Client order: reauth → API delete → `deleteUser` in Firebase → local logout. If API succeeds but
Firebase delete fails, surface error and ask user to retry Firebase delete / contact support (log
`FirebaseUid` for Admin cleanup).

---

## 5. Explicitly out of cutover / follow-on

- Enforce `email_verified` claim with an authorization policy.
- Sync email changes Firebase ↔ Mongo (`updateEmail`).
- Strict server-side rejection of revoked tokens before ID-token natural expiry.
- Optional `@angular/fire` later if desired; plain SDK is enough for cutover.

---

## 6. Acceptance Criteria

- [ ] Sign-in uses Firebase; wrong credentials show a friendly message, never a raw Firebase dump.
- [ ] Sign-up creates the Firebase user, persists first/last name on Mongo (via update-profile after
      provision if needed), seeds default accounts/categories (`UserRegistered`), lands on `/dashboard`.
- [ ] App reload restores session without flashing `/login` (async guards + `authReady`).
- [ ] “Forgot password?” sends a Firebase reset email.
- [ ] API calls send `Authorization: Bearer <Firebase ID token>`; 401 triggers one forced refresh
      (single-flight); refresh failure logs out.
- [ ] Logout is Firebase `signOut` only (no `/logout` cookie call); guarded routes deny.
- [ ] Settings → change password works via Firebase (reauth + update, or reset email).
- [ ] Settings → delete account works without Mongo password hash; Firebase user removed.
- [ ] Settings → logout all sessions revokes Firebase refresh tokens (Admin) then local sign-out.
- [ ] `User.id` in the client is Mongo `_id` (from get-me), not Firebase uid.
- [ ] Existing linked users keep the same Mongo id (transactions/categories/accounts unchanged).
- [ ] Resolver never links by email on the hot path; migration is explicit (§4.3).
- [ ] CSP allows Auth network + frames; login works in prod build.
- [ ] Profile email cannot drift from Firebase via `update-profile`.

## 7. Test Matrix

| Spec | Covers |
|---|---|
| `auth.service.spec.ts` | login/register/logout/forgot, hydrateProfile, error mapping, no localStorage tokens |
| `auth.interceptor.spec.ts` | token attach, 401 → single-flight retry, failure → logout, no `withCredentials` |
| `auth.guard.spec.ts` | waits for `authReady`, anon → `/login`, authed → allow; `redirectIfAuth` → `/dashboard` |
| `login` / `register` component specs | form → Firebase calls, friendly errors, navigate `/dashboard` |
| `settings.component.spec.ts` | change password / delete / logout-all use new flows |
| `FinTrack.Modules.Users.Tests` | resolver create + duplicate-key race; **no** email auto-link; delete without password; revoke sessions; NameIdentifier = Mongo id |

## 8. Verification

```bash
# Backend
dotnet test D:\Local-Projects\fintrack-dotnet-app\tests\FinTrack.Modules.Users.Tests

# Frontend
cd D:\Local-Projects\fintrack-angular-app
npx ng test --watch=false --browsers=ChromeHeadless

# Manual
# 1. Set Firebase:ProjectId (+ Admin creds for revoke). Start API. ng serve.
# 2. Register → Firebase console shows user; Mongo user has FirebaseUid; defaults seeded.
# 3. Reload → stay on app (no login flash). Sign out → /login.
# 4. Forgot password → email arrives.
# 5. Settings: change password, logout-all (other browser must reauth), delete account.
# 6. Linked existing user (after §4.3 script) keeps same transactions under same Mongo id.
```

## 9. Implementation order

1. Firebase project setup + env config + CSP.  
2. Backend JwtBearer + resolver + delete `Login`/`Register`/`Refresh`/`ChangePassword`/`PasswordHasher`/`TokenService`.  
3. Rewrite DeleteAccount + LogoutAllSessions; lock UpdateProfile email.  
4. Frontend AuthService / interceptor / async guards / login / register.  
5. Settings password / delete / logout-all.  
6. Migration script for existing users (§4.3 A) if needed.  
7. Tests + manual verification checklist.
```
