import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from '../models/auth.model';
import { FIREBASE_AUTH } from '../firebase/firebase';
import { CurrencyStore } from './currency.store';
import { UserService } from './user.service';

/** Maps a Firebase Auth error to a friendly, human-readable message. */
export function authErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code;
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/user-not-found':
            return 'If an account exists for that email, a reset link will be sent.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Check your connection and try again.';
        case 'auth/requires-recent-login':
            return 'Please sign in again before continuing.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in popup was closed before completing.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked. Allow popups and try again.';
        case 'auth/account-exists-with-different-credential':
            return 'An account with this email already exists. Sign in with your existing method instead.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled for the app yet. Enable it in Firebase Console → Authentication → Sign-in method.';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized for sign-in. Add it under Firebase Console → Authentication → Authorized domains.';
        case 'auth/invalid-email':
            return 'A valid email is required to continue.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private fbAuth = inject(FIREBASE_AUTH);
    private userService = inject(UserService);
    private currencyStore = inject(CurrencyStore);

    /** True until the first Firebase auth state is known. */
    initializing = signal(true);
    /** Mongo-shaped profile hydrated from GET /get-me. */
    currentUser = signal<User | null>(null);
    /**
     * Blob URL for the current user's avatar. Google/Facebook photos are fetched as
     * blobs (Google 429s hotlinked cross-origin `<img>` requests from Chrome) and
     * rendered same-origin; relative upload paths are passed through as-is.
     */
    avatarSrc = signal<string | null>(null);
    /** Set when session restore / hydrate fails while Firebase session is still valid. */
    profileError = signal<string | null>(null);
    private avatarBlobs = new Map<string, string>();
    private hydrateInFlight: Promise<void> | null = null;
    private providerSyncInFlight: Promise<void> | null = null;

    private firebaseUid = signal<string | null>(null);
    isAuthenticated = computed(() => !!this.firebaseUid());

    /** Resolves once the initial auth state has been established — guards await this. */
    readonly authReady: Promise<void>;

    constructor() {
        this.authReady = new Promise<void>((resolve) => {
            this.fbAuth.onAuthStateChanged((user) => {
                const nextUid = user?.uid ?? null;
                const prevUid = this.firebaseUid();
                this.firebaseUid.set(nextUid);
                this.initializing.set(false);
                resolve();

                if (!user) {
                    this.currentUser.set(null);
                    this.profileError.set(null);
                    this.clearAvatarCache();
                    return;
                }

                // Only wipe the in-memory profile when the Firebase identity changes.
                if (prevUid !== nextUid) {
                    this.currentUser.set(null);
                }

                void this.ensureProviderAvatar().catch(() => {
                    // ensureProviderAvatar / hydrateProfile already set profileError.
                });
            });
        });
    }

    /** Whether the signed-in Firebase user can use email/password reauth flows. */
    hasPasswordProvider(): boolean {
        return this.fbAuth.hasPasswordProvider();
    }

    async login(email: string, password: string, rememberMe = true): Promise<void> {
        await this.fbAuth.setPersistence(rememberMe);
        await this.fbAuth.signIn(email, password);
        await this.hydrateProfile();
    }

    async loginWithGoogle(): Promise<void> {
        await this.fbAuth.signInWithGoogle();
        await this.ensureProviderAvatar();
    }

    async loginWithFacebook(): Promise<void> {
        await this.fbAuth.signInWithFacebook();
        await this.ensureProviderAvatar();
    }

    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<void> {
        await this.fbAuth.createUser(data.email, data.password);
        const displayName = `${data.firstName} ${data.lastName}`.trim();
        if (displayName) {
            await this.fbAuth.updateDisplayName(displayName);
        }
        await this.hydrateProfile();
        const user = this.currentUser();
        if (user && (!user.firstName || !user.lastName)) {
            const updated = await firstValueFrom(
                this.userService.updateProfile({ firstName: data.firstName, lastName: data.lastName }),
            );
            this.currentUser.set(updated);
        }
    }

    async forgotPassword(email: string): Promise<void> {
        await this.fbAuth.sendPasswordReset(email);
    }

    async logout(): Promise<void> {
        try {
            await this.fbAuth.signOut();
        } catch {
            // Always clear local auth state even if the SDK call fails.
        } finally {
            this.firebaseUid.set(null);
            this.currentUser.set(null);
            this.profileError.set(null);
            this.clearAvatarCache();
            this.currencyStore.reset();
        }
    }

    async getToken(forceRefresh = false): Promise<string | null> {
        return this.fbAuth.getToken(forceRefresh);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        if (!this.fbAuth.hasPasswordProvider()) {
            throw Object.assign(new Error('Password changes are only available for email/password accounts.'), {
                code: 'auth/operation-not-allowed',
            });
        }
        await this.fbAuth.reauthenticate(currentPassword);
        await this.fbAuth.updatePassword(newPassword);
    }

    /**
     * Reauthenticate (password or federated popup), delete the Mongo user,
     * then remove the Firebase user. Always clears local session afterward.
     */
    async deleteAccount(password?: string): Promise<void> {
        if (this.fbAuth.hasPasswordProvider()) {
            if (!password) {
                throw Object.assign(new Error('Password is required to delete this account.'), {
                    code: 'auth/wrong-password',
                });
            }
            await this.fbAuth.reauthenticate(password);
        } else {
            await this.fbAuth.reauthenticateWithPopup();
        }

        await firstValueFrom(this.userService.deleteAccount());

        try {
            await this.fbAuth.deleteFirebaseUser();
        } catch (err) {
            // Mongo user is already gone — force local sign-out so the orphaned
            // Firebase session cannot keep browsing authenticated UI.
            await this.logout();
            throw err;
        }

        await this.logout();
    }

    async hydrateProfile(): Promise<void> {
        if (this.hydrateInFlight) {
            return this.hydrateInFlight;
        }

        this.hydrateInFlight = (async () => {
            try {
                const user = await firstValueFrom(this.userService.getProfile());
                this.currentUser.set(user);
                this.profileError.set(null);
                await this.refreshAvatar();
            } catch {
                this.profileError.set('Failed to load your profile. Some features may be unavailable.');
                throw new Error('Failed to load profile');
            }
        })().finally(() => {
            this.hydrateInFlight = null;
        });

        return this.hydrateInFlight;
    }

    /** Re-resolves the current user's avatar src (external provider URLs → blob). */
    async refreshAvatar(): Promise<void> {
        const url = this.currentUser()?.avatarUrl ?? null;
        if (!url) {
            this.avatarSrc.set(null);
            return;
        }
        if (!/^https?:\/\//.test(url)) {
            this.avatarSrc.set(url);
            return;
        }
        try {
            this.avatarSrc.set(await this.resolveAvatarUrl(url));
        } catch {
            this.avatarSrc.set(null);
        }
    }

    private clearAvatarCache(): void {
        for (const objectUrl of this.avatarBlobs.values()) {
            URL.revokeObjectURL(objectUrl);
        }
        this.avatarBlobs.clear();
        this.avatarSrc.set(null);
    }

    private async resolveAvatarUrl(url: string): Promise<string> {
        const cached = this.avatarBlobs.get(url);
        if (cached) return cached;
        // No-referrer fetch: Google 429s cross-origin <img>/fetch requests that carry a Referer,
        // but serves them fine with CORS when the referer is suppressed.
        const res = await fetch(url, { referrerPolicy: 'no-referrer' });
        if (!res.ok) throw new Error(`Failed to load avatar: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        this.avatarBlobs.set(url, objectUrl);
        return objectUrl;
    }

    /**
     * Hydrates the Mongo profile and persists the provider (Google/Facebook) photo
     * and any missing name fields into the backend profile — run once per session,
     * and skipped if the user already has their own avatar.
     */
    private ensureProviderAvatar(): Promise<void> {
        if (this.providerSyncInFlight) {
            return this.providerSyncInFlight;
        }

        this.providerSyncInFlight = this.syncProviderProfile().finally(() => {
            this.providerSyncInFlight = null;
        });
        return this.providerSyncInFlight;
    }

    private async syncProviderProfile(): Promise<void> {
        await this.hydrateProfile();
        const user = this.currentUser();
        if (!user) return;

        const photoUrl = await this.fbAuth.getPhotoUrl();
        if (!photoUrl || user.avatarUrl) return;

        let firstName = user.firstName;
        let lastName = user.lastName;
        if (!firstName || !lastName) {
            const displayName = await this.fbAuth.getDisplayName();
            const parts = (displayName ?? '').split(/\s+/).filter(Boolean);
            firstName = firstName || (parts[0] ?? '');
            lastName = lastName || parts.slice(1).join(' ');
        }

        // Persist provider photo even when last name is missing (single-token display names).
        const updated = await firstValueFrom(
            this.userService.updateProfile({
                firstName: firstName || user.firstName || '',
                lastName: lastName || user.lastName || '',
                avatarUrl: photoUrl,
            }),
        );
        this.currentUser.set(updated);
        await this.refreshAvatar();
    }
}
