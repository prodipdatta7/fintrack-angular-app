import { InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
    Auth,
    EmailAuthProvider,
    FacebookAuthProvider,
    GoogleAuthProvider,
    User,
    browserLocalPersistence,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    deleteUser,
    getAuth,
    getIdToken,
    onAuthStateChanged,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updatePassword,
    updateProfile,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

/**
 * Thin Firebase Auth facade so AuthService (and tests) never depend on the SDK directly.
 * Lazy: the app is only initialized on first use, so importing this module is side-effect free.
 */
export interface FirebaseAuthClient {
    onAuthStateChanged(listener: (user: User | null) => void): () => void;
    getToken(forceRefresh?: boolean): Promise<string | null>;
    setPersistence(rememberMe: boolean): Promise<void>;
    signIn(email: string, password: string): Promise<void>;
    signInWithGoogle(): Promise<void>;
    signInWithFacebook(): Promise<void>;
    createUser(email: string, password: string): Promise<void>;
    updateDisplayName(displayName: string): Promise<void>;
    getPhotoUrl(): Promise<string | null>;
    getDisplayName(): Promise<string | null>;
    sendPasswordReset(email: string): Promise<void>;
    /** True when the signed-in user has an email/password provider linked. */
    hasPasswordProvider(): boolean;
    reauthenticate(password: string): Promise<void>;
    /** Reauth via Google/Facebook popup for federated accounts. */
    reauthenticateWithPopup(): Promise<void>;
    updatePassword(newPassword: string): Promise<void>;
    deleteFirebaseUser(): Promise<void>;
    signOut(): Promise<void>;
}

export const FIREBASE_AUTH = new InjectionToken<FirebaseAuthClient>('FIREBASE_AUTH');

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function authInstance(): Auth {
    if (!auth) {
        app ??= initializeApp(environment.firebase);
        auth = getAuth(app);
    }
    return auth;
}

function currentUser(): User {
    const user = authInstance().currentUser;
    if (!user) throw new Error('No authenticated Firebase user.');
    return user;
}

function federatedProviderFor(user: User): GoogleAuthProvider | FacebookAuthProvider {
    const ids = user.providerData.map((p) => p.providerId);
    if (ids.includes(GoogleAuthProvider.PROVIDER_ID)) {
        return new GoogleAuthProvider();
    }
    if (ids.includes(FacebookAuthProvider.PROVIDER_ID)) {
        return new FacebookAuthProvider();
    }
    throw Object.assign(new Error('Reauthentication requires Google or Facebook sign-in.'), {
        code: 'auth/operation-not-allowed',
    });
}

export const firebaseAuthClient: FirebaseAuthClient = {
    onAuthStateChanged(listener) {
        return onAuthStateChanged(authInstance(), listener);
    },
    async getToken(forceRefresh = false) {
        const user = authInstance().currentUser;
        return user ? await getIdToken(user, forceRefresh) : null;
    },
    async setPersistence(rememberMe) {
        await setPersistence(
            authInstance(),
            rememberMe ? browserLocalPersistence : browserSessionPersistence,
        );
    },
    async signIn(email, password) {
        await signInWithEmailAndPassword(authInstance(), email, password);
    },
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(authInstance(), provider);
    },
    async signInWithFacebook() {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(authInstance(), provider);
    },
    async createUser(email, password) {
        await createUserWithEmailAndPassword(authInstance(), email, password);
    },
    async updateDisplayName(displayName) {
        await updateProfile(currentUser(), { displayName });
    },
    async getPhotoUrl() {
        return authInstance().currentUser?.photoURL ?? null;
    },
    async getDisplayName() {
        return authInstance().currentUser?.displayName ?? null;
    },
    async sendPasswordReset(email) {
        await sendPasswordResetEmail(authInstance(), email);
    },
    hasPasswordProvider() {
        const user = authInstance().currentUser;
        return !!user?.providerData.some((p) => p.providerId === EmailAuthProvider.PROVIDER_ID);
    },
    async reauthenticate(password) {
        const user = currentUser();
        if (!user.email) {
            throw Object.assign(new Error('Account has no email for password reauthentication.'), {
                code: 'auth/invalid-email',
            });
        }
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
    },
    async reauthenticateWithPopup() {
        const user = currentUser();
        await reauthenticateWithPopup(user, federatedProviderFor(user));
    },
    async updatePassword(newPassword) {
        await updatePassword(currentUser(), newPassword);
    },
    async deleteFirebaseUser() {
        await deleteUser(currentUser());
    },
    async signOut() {
        await signOut(authInstance());
    },
};
