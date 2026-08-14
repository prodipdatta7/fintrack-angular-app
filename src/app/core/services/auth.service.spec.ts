import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService, authErrorMessage } from './auth.service';
import { FIREBASE_AUTH, FirebaseAuthClient } from '../firebase/firebase';
import { UserService } from './user.service';
import { CurrencyStore } from './currency.store';
import { User } from '../models/auth.model';

describe('AuthService', () => {
    let service: AuthService;
    let fbAuthSpy: jasmine.SpyObj<FirebaseAuthClient>;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let currencyStoreSpy: jasmine.SpyObj<CurrencyStore>;
    let authListener: ((user: { uid: string } | null) => void) | undefined;

    const firebaseUser = { uid: 'fb-1' };
    const mongoUser: User = { id: 'u-1', email: 'user@example.com', firstName: 'Jane', lastName: 'Doe' };

    beforeEach(() => {
        authListener = undefined;

        fbAuthSpy = jasmine.createSpyObj<FirebaseAuthClient>(
            'FirebaseAuthClient',
            [
                'onAuthStateChanged',
                'getToken',
                'setPersistence',
                'signIn',
                'signInWithGoogle',
                'signInWithFacebook',
                'createUser',
                'updateDisplayName',
                'getPhotoUrl',
                'getDisplayName',
                'sendPasswordReset',
                'hasPasswordProvider',
                'reauthenticate',
                'reauthenticateWithPopup',
                'updatePassword',
                'deleteFirebaseUser',
                'signOut',
            ],
        );
        fbAuthSpy.onAuthStateChanged.and.callFake((listener) => {
            authListener = listener;
            return () => undefined;
        });
        fbAuthSpy.getToken.and.resolveTo('firebase-id-token');
        fbAuthSpy.setPersistence.and.resolveTo();
        fbAuthSpy.signIn.and.resolveTo();
        fbAuthSpy.signInWithGoogle.and.resolveTo();
        fbAuthSpy.signInWithFacebook.and.resolveTo();
        fbAuthSpy.createUser.and.resolveTo();
        fbAuthSpy.updateDisplayName.and.resolveTo();
        fbAuthSpy.getPhotoUrl.and.resolveTo(null);
        fbAuthSpy.getDisplayName.and.resolveTo(null);
        fbAuthSpy.sendPasswordReset.and.resolveTo();
        fbAuthSpy.hasPasswordProvider.and.returnValue(true);
        fbAuthSpy.reauthenticate.and.resolveTo();
        fbAuthSpy.reauthenticateWithPopup.and.resolveTo();
        fbAuthSpy.updatePassword.and.resolveTo();
        fbAuthSpy.deleteFirebaseUser.and.resolveTo();
        fbAuthSpy.signOut.and.resolveTo();

        userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile', 'deleteAccount']);
        userServiceSpy.getProfile.and.returnValue(of(mongoUser));
        userServiceSpy.updateProfile.and.returnValue(of(mongoUser));
        userServiceSpy.deleteAccount.and.returnValue(of({ message: 'deleted' }));

        currencyStoreSpy = jasmine.createSpyObj('CurrencyStore', ['reset']);

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                { provide: FIREBASE_AUTH, useValue: fbAuthSpy },
                { provide: UserService, useValue: userServiceSpy },
                { provide: CurrencyStore, useValue: currencyStoreSpy },
            ],
        });
        service = TestBed.inject(AuthService);
    });

    function emitAuthState(user: { uid: string } | null): void {
        authListener?.(user);
    }

    async function flushMicrotasks(): Promise<void> {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    }

    it('starts unauthenticated and resolves authReady on the first auth state', async () => {
        let ready = false;
        void service.authReady.then(() => (ready = true));

        expect(service.initializing()).toBeTrue();
        expect(service.isAuthenticated()).toBeFalse();

        emitAuthState(null);
        await service.authReady;

        expect(ready).toBeTrue();
        expect(service.initializing()).toBeFalse();
        expect(service.isAuthenticated()).toBeFalse();
    });

    it('marks the user authenticated and hydrates the profile from Firebase', async () => {
        emitAuthState(firebaseUser);
        await service.authReady;
        await flushMicrotasks();

        expect(service.isAuthenticated()).toBeTrue();
        expect(service.currentUser()).toEqual(mongoUser);
        expect(userServiceSpy.getProfile).toHaveBeenCalled();
    });

    it('sets profileError when session restore hydrate fails', async () => {
        userServiceSpy.getProfile.and.returnValue(throwError(() => ({ status: 500 })));

        emitAuthState(firebaseUser);
        await service.authReady;
        await flushMicrotasks();
        await flushMicrotasks();

        expect(service.isAuthenticated()).toBeTrue();
        expect(service.currentUser()).toBeNull();
        expect(service.profileError()).toContain('Failed to load your profile');
    });

    it('clears the profile when the Firebase user signs out', async () => {
        emitAuthState(firebaseUser);
        await flushMicrotasks();
        expect(service.isAuthenticated()).toBeTrue();

        emitAuthState(null);
        await flushMicrotasks();

        expect(service.isAuthenticated()).toBeFalse();
        expect(service.currentUser()).toBeNull();
    });

    it('login signs in through Firebase, sets persistence, and hydrates the profile', async () => {
        await service.login('user@example.com', 'password123', false);

        expect(fbAuthSpy.setPersistence).toHaveBeenCalledWith(false);
        expect(fbAuthSpy.signIn).toHaveBeenCalledWith('user@example.com', 'password123');
        expect(userServiceSpy.getProfile).toHaveBeenCalled();
        expect(service.currentUser()).toEqual(mongoUser);
    });

    it('loginWithGoogle signs in with a popup and hydrates the profile', async () => {
        await service.loginWithGoogle();

        expect(fbAuthSpy.signInWithGoogle).toHaveBeenCalled();
        expect(userServiceSpy.getProfile).toHaveBeenCalled();
        expect(service.currentUser()).toEqual(mongoUser);
    });

    it('loginWithFacebook signs in with a popup and hydrates the profile', async () => {
        await service.loginWithFacebook();

        expect(fbAuthSpy.signInWithFacebook).toHaveBeenCalled();
        expect(userServiceSpy.getProfile).toHaveBeenCalled();
        expect(service.currentUser()).toEqual(mongoUser);
    });

    it('loginWithGoogle persists the provider photo and patches blank names', async () => {
        const blank = { id: 'u-1', email: 'user@example.com', firstName: '', lastName: '' };
        const enriched: User = { ...blank, firstName: 'Jane', lastName: 'Doe', avatarUrl: 'https://lh3.googleusercontent.com/abc' };
        userServiceSpy.getProfile.and.returnValue(of(blank));
        fbAuthSpy.getPhotoUrl.and.resolveTo('https://lh3.googleusercontent.com/abc');
        fbAuthSpy.getDisplayName.and.resolveTo('Jane Doe');
        userServiceSpy.updateProfile.and.returnValue(of(enriched));

        await service.loginWithGoogle();

        expect(fbAuthSpy.signInWithGoogle).toHaveBeenCalled();
        expect(userServiceSpy.updateProfile).toHaveBeenCalledWith({
            firstName: 'Jane',
            lastName: 'Doe',
            avatarUrl: 'https://lh3.googleusercontent.com/abc',
        });
        expect(service.currentUser()).toEqual(enriched);
    });

    it('persists provider photo for single-token display names', async () => {
        const blank = { id: 'u-1', email: 'user@example.com', firstName: '', lastName: '' };
        const enriched: User = { ...blank, firstName: 'Madonna', lastName: '', avatarUrl: 'https://lh3.googleusercontent.com/abc' };
        userServiceSpy.getProfile.and.returnValue(of(blank));
        fbAuthSpy.getPhotoUrl.and.resolveTo('https://lh3.googleusercontent.com/abc');
        fbAuthSpy.getDisplayName.and.resolveTo('Madonna');
        userServiceSpy.updateProfile.and.returnValue(of(enriched));

        await service.loginWithGoogle();

        expect(userServiceSpy.updateProfile).toHaveBeenCalledWith({
            firstName: 'Madonna',
            lastName: '',
            avatarUrl: 'https://lh3.googleusercontent.com/abc',
        });
        expect(service.currentUser()).toEqual(enriched);
    });

    it('does not overwrite an existing avatar with the provider photo', async () => {
        const withAvatar = { ...mongoUser, avatarUrl: 'uploads/avatars/me.jpg' };
        userServiceSpy.getProfile.and.returnValue(of(withAvatar));
        fbAuthSpy.getPhotoUrl.and.resolveTo('https://lh3.googleusercontent.com/abc');

        await service.loginWithGoogle();

        expect(userServiceSpy.updateProfile).not.toHaveBeenCalled();
        expect(service.currentUser()).toEqual(withAvatar);
    });

    it('hydrateProfile fetches an external avatar as a no-referrer blob', async () => {
        const withExternal = { ...mongoUser, avatarUrl: 'https://lh3.googleusercontent.com/abc=s96-c' };
        userServiceSpy.getProfile.and.returnValue(of(withExternal));
        const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo({
            ok: true,
            blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
        } as Response);
        spyOn(URL, 'createObjectURL').and.returnValue('blob:avatar-1');

        await service.login('user@example.com', 'password123');

        expect(fetchSpy).toHaveBeenCalledWith('https://lh3.googleusercontent.com/abc=s96-c', {
            referrerPolicy: 'no-referrer',
        });
        expect(service.avatarSrc()).toBe('blob:avatar-1');
    });

    it('passes relative avatar paths through without fetching', async () => {
        const withRelative = { ...mongoUser, avatarUrl: 'uploads/avatars/me.jpg' };
        userServiceSpy.getProfile.and.returnValue(of(withRelative));
        const fetchSpy = spyOn(globalThis, 'fetch');

        await service.login('user@example.com', 'password123');

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(service.avatarSrc()).toBe('uploads/avatars/me.jpg');
    });

    it('clears the avatar src on logout', async () => {
        const withRelative = { ...mongoUser, avatarUrl: 'uploads/avatars/me.jpg' };
        userServiceSpy.getProfile.and.returnValue(of(withRelative));

        await service.login('user@example.com', 'password123');
        expect(service.avatarSrc()).toBe('uploads/avatars/me.jpg');

        await service.logout();
        expect(service.avatarSrc()).toBeNull();
    });

    it('register creates the user, sets the display name, hydrates and applies patched names', async () => {
        const blank = { id: 'u-1', email: 'user@example.com', firstName: '', lastName: '' };
        const patched: User = { id: 'u-1', email: 'user@example.com', firstName: 'Jane', lastName: 'Doe' };
        userServiceSpy.getProfile.and.returnValue(of(blank));
        userServiceSpy.updateProfile.and.returnValue(of(patched));

        await service.register({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'user@example.com',
            password: 'password123',
        });

        expect(fbAuthSpy.createUser).toHaveBeenCalledWith('user@example.com', 'password123');
        expect(fbAuthSpy.updateDisplayName).toHaveBeenCalledWith('Jane Doe');
        expect(userServiceSpy.updateProfile).toHaveBeenCalledWith({ firstName: 'Jane', lastName: 'Doe' });
        expect(service.currentUser()).toEqual(patched);
    });

    it('getToken delegates to the Firebase client', async () => {
        const token = await service.getToken();
        expect(token).toBe('firebase-id-token');
        expect(fbAuthSpy.getToken).toHaveBeenCalledWith(false);
    });

    it('forgotPassword sends the password reset email', async () => {
        await service.forgotPassword('user@example.com');
        expect(fbAuthSpy.sendPasswordReset).toHaveBeenCalledWith('user@example.com');
    });

    it('changePassword reauthenticates then updates the password', async () => {
        await service.changePassword('old-pass', 'new-pass');
        expect(fbAuthSpy.reauthenticate).toHaveBeenCalledWith('old-pass');
        expect(fbAuthSpy.updatePassword).toHaveBeenCalledWith('new-pass');
    });

    it('changePassword rejects federated accounts', async () => {
        fbAuthSpy.hasPasswordProvider.and.returnValue(false);

        await expectAsync(service.changePassword('old', 'new')).toBeRejected();
        expect(fbAuthSpy.reauthenticate).not.toHaveBeenCalled();
    });

    it('logout signs out of Firebase and clears authenticated state', async () => {
        emitAuthState(firebaseUser);
        await service.authReady;

        await service.logout();

        expect(fbAuthSpy.signOut).toHaveBeenCalled();
        expect(currencyStoreSpy.reset).toHaveBeenCalled();
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
    });

    it('logout clears local auth state when signOut fails', async () => {
        emitAuthState(firebaseUser);
        await service.authReady;
        fbAuthSpy.signOut.and.rejectWith(new Error('network'));

        await service.logout();

        expect(service.isAuthenticated()).toBeFalse();
        expect(service.currentUser()).toBeNull();
        expect(currencyStoreSpy.reset).toHaveBeenCalled();
    });

    it('deleteAccount reauthenticates with password, deletes the user and logs out', async () => {
        await service.deleteAccount('password123');

        expect(fbAuthSpy.reauthenticate).toHaveBeenCalledWith('password123');
        expect(userServiceSpy.deleteAccount).toHaveBeenCalled();
        expect(fbAuthSpy.deleteFirebaseUser).toHaveBeenCalled();
        expect(fbAuthSpy.signOut).toHaveBeenCalled();
        expect(service.isAuthenticated()).toBeFalse();
    });

    it('deleteAccount uses popup reauth for federated accounts', async () => {
        fbAuthSpy.hasPasswordProvider.and.returnValue(false);

        await service.deleteAccount();

        expect(fbAuthSpy.reauthenticateWithPopup).toHaveBeenCalled();
        expect(fbAuthSpy.reauthenticate).not.toHaveBeenCalled();
        expect(userServiceSpy.deleteAccount).toHaveBeenCalled();
        expect(fbAuthSpy.deleteFirebaseUser).toHaveBeenCalled();
    });

    it('deleteAccount forces local logout when Firebase delete fails after Mongo delete', async () => {
        emitAuthState(firebaseUser);
        await service.authReady;
        fbAuthSpy.deleteFirebaseUser.and.rejectWith({ code: 'auth/requires-recent-login' });

        await expectAsync(service.deleteAccount('password123')).toBeRejected();

        expect(userServiceSpy.deleteAccount).toHaveBeenCalled();
        expect(service.isAuthenticated()).toBeFalse();
    });

    describe('isAdmin', () => {
        it('returns true when currentUser email is in admin whitelist', () => {
            service.currentUser.set({ id: 'u-admin', email: 'admin@fintrack.app' });
            expect(service.isAdmin()).toBeTrue();

            // Case insensitive check
            service.currentUser.set({ id: 'u-admin-case', email: 'ADMIN@fintrack.app ' });
            expect(service.isAdmin()).toBeTrue();
        });

        it('returns false when currentUser email is not in whitelist', () => {
            service.currentUser.set({ id: 'u-normal', email: 'regular-user@example.com' });
            expect(service.isAdmin()).toBeFalse();
        });

        it('returns false when currentUser is null', () => {
            service.currentUser.set(null);
            expect(service.isAdmin()).toBeFalse();
        });
    });

    describe('authErrorMessage', () => {
        it('maps known Firebase error codes to friendly messages', () => {
            expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe('Invalid email or password.');
            expect(authErrorMessage({ code: 'auth/user-not-found' })).toBe(
                'If an account exists for that email, a reset link will be sent.',
            );
            expect(authErrorMessage({ code: 'auth/wrong-password' })).toBe('Invalid email or password.');
            expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
                'An account with this email already exists.',
            );
            expect(authErrorMessage({ code: 'auth/weak-password' })).toBe('Password is too weak. Use at least 6 characters.');
            expect(authErrorMessage({ code: 'auth/too-many-requests' })).toBe(
                'Too many attempts. Please wait a moment and try again.',
            );
            expect(authErrorMessage({ code: 'auth/network-request-failed' })).toBe(
                'Network error. Check your connection and try again.',
            );
            expect(authErrorMessage({ code: 'auth/requires-recent-login' })).toBe('Please sign in again before continuing.');
            expect(authErrorMessage({ code: 'auth/popup-closed-by-user' })).toBe(
                'Sign-in popup was closed before completing.',
            );
            expect(authErrorMessage({ code: 'auth/cancelled-popup-request' })).toBe(
                'Sign-in popup was closed before completing.',
            );
            expect(authErrorMessage({ code: 'auth/popup-blocked' })).toBe(
                'Sign-in popup was blocked. Allow popups and try again.',
            );
            expect(authErrorMessage({ code: 'auth/account-exists-with-different-credential' })).toBe(
                'An account with this email already exists. Sign in with your existing method instead.',
            );
            expect(authErrorMessage({ code: 'auth/operation-not-allowed' })).toBe(
                'This sign-in method is not enabled for the app yet. Enable it in Firebase Console → Authentication → Sign-in method.',
            );
            expect(authErrorMessage({ code: 'auth/unauthorized-domain' })).toBe(
                'This domain is not authorized for sign-in. Add it under Firebase Console → Authentication → Authorized domains.',
            );
        });

        it('falls back to a generic message for unknown errors', () => {
            expect(authErrorMessage({ code: 'auth/unknown' })).toBe('Something went wrong. Please try again.');
            expect(authErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
        });
    });
});
