import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;
    let route: ActivatedRoute;

    /** Fill the form with credentials that satisfy every validator. */
    function fillValidCredentials(): void {
        component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    }

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj('AuthService', [
            'login',
            'loginWithGoogle',
            'loginWithFacebook',
            'forgotPassword',
        ]);
        authServiceSpy.login.and.resolveTo();
        authServiceSpy.loginWithGoogle.and.resolveTo();
        authServiceSpy.loginWithFacebook.and.resolveTo();
        authServiceSpy.forgotPassword.and.resolveTo();

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        route = TestBed.inject(ActivatedRoute);

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and initialize form', () => {
        expect(component).toBeTruthy();
        expect(component.loginForm.valid).toBeFalse();
    });

    it('should validate form and call login service on submit', async () => {
        fillValidCredentials();
        expect(component.loginForm.valid).toBeTrue();

        await component.onSubmit();
        expect(authServiceSpy.login).toHaveBeenCalledWith('user@example.com', 'password123', true);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should display a friendly error message on authentication failure', async () => {
        fillValidCredentials();

        authServiceSpy.login.and.rejectWith({ code: 'auth/invalid-credential' });

        await component.onSubmit();
        expect(component.errorMessage).toBe('Invalid email or password.');
    });

    describe('form validation', () => {
        it('should mark email as required when empty', () => {
            const email = component.loginForm.controls.email;
            email.setValue('');
            expect(email.hasError('required')).toBeTrue();
        });

        it('should reject a malformed email address', () => {
            fillValidCredentials();
            const email = component.loginForm.controls.email;
            email.setValue('not-an-email');

            expect(email.hasError('email')).toBeTrue();
            expect(component.loginForm.valid).toBeFalse();
        });

        it('should mark password as required when empty', () => {
            const password = component.loginForm.controls.password;
            password.setValue('');
            expect(password.hasError('required')).toBeTrue();
        });

        it('should reject a password shorter than 8 characters', () => {
            const password = component.loginForm.controls.password;
            password.setValue('1234567');
            expect(password.hasError('minlength')).toBeTrue();
        });

        it('should accept a password of exactly 8 characters', () => {
            const password = component.loginForm.controls.password;
            password.setValue('12345678');
            expect(password.valid).toBeTrue();
        });

        it('should reject a password longer than 24 characters', () => {
            const password = component.loginForm.controls.password;
            password.setValue('1234567890123456789012345');
            expect(password.hasError('maxlength')).toBeTrue();
        });
    });

    describe('submit guard', () => {
        it('should not call the auth service when the form is invalid', async () => {
            component.loginForm.setValue({ email: 'not-an-email', password: '123' });

            await component.onSubmit();

            expect(authServiceSpy.login).not.toHaveBeenCalled();
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should leave isLoading untouched when the form is invalid', async () => {
            component.loginForm.setValue({ email: '', password: '' });

            await component.onSubmit();

            expect(component.isLoading).toBeFalse();
        });
    });

    describe('loading state', () => {
        it('should set isLoading while the request is in flight', async () => {
            let resolveLogin: (() => void) | undefined;
            authServiceSpy.login.and.returnValue(
                new Promise<void>((resolve) => (resolveLogin = resolve)),
            );
            fillValidCredentials();

            const pending = component.onSubmit();
            expect(component.isLoading).toBeTrue();

            resolveLogin?.();
            await pending;
            expect(component.isLoading).toBeFalse();
        });

        it('should clear isLoading when the request fails', async () => {
            authServiceSpy.login.and.rejectWith({ code: 'auth/too-many-requests' });
            fillValidCredentials();

            await component.onSubmit();

            expect(component.isLoading).toBeFalse();
        });
    });

    describe('post-login navigation', () => {
        it('should navigate to returnUrl when one is present in the query params', async () => {
            Object.defineProperty(route.snapshot.queryParams, 'returnUrl', { value: '/settings', configurable: true });
            fillValidCredentials();

            await component.onSubmit();

            expect(router.navigate).toHaveBeenCalledWith(['/settings']);
        });

        it('should fall back to /dashboard when returnUrl is absent', async () => {
            Object.defineProperty(route.snapshot.queryParams, 'returnUrl', { value: undefined, configurable: true });
            fillValidCredentials();

            await component.onSubmit();

            expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        });
    });

    describe('google sign-in', () => {
        it('should call loginWithGoogle and navigate to the dashboard', async () => {
            await component.loginWithGoogle();

            expect(authServiceSpy.loginWithGoogle).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        });

        it('should navigate to the returnUrl when one is present', async () => {
            Object.defineProperty(route.snapshot.queryParams, 'returnUrl', { value: '/accounts', configurable: true });

            await component.loginWithGoogle();

            expect(router.navigate).toHaveBeenCalledWith(['/accounts']);
        });

        it('should show a friendly error when Google sign-in fails', async () => {
            authServiceSpy.loginWithGoogle.and.rejectWith({ code: 'auth/popup-blocked' });

            await component.loginWithGoogle();

            expect(component.errorMessage).toBe('Sign-in popup was blocked. Allow popups and try again.');
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should silently ignore a closed popup', async () => {
            authServiceSpy.loginWithGoogle.and.rejectWith({ code: 'auth/popup-closed-by-user' });

            await component.loginWithGoogle();

            expect(component.errorMessage).toBe('');
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('facebook sign-in', () => {
        it('should call loginWithFacebook and navigate to the dashboard', async () => {
            await component.loginWithFacebook();

            expect(authServiceSpy.loginWithFacebook).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        });

        it('should navigate to the returnUrl when one is present', async () => {
            Object.defineProperty(route.snapshot.queryParams, 'returnUrl', { value: '/categories', configurable: true });

            await component.loginWithFacebook();

            expect(router.navigate).toHaveBeenCalledWith(['/categories']);
        });

        it('should show a friendly error when Facebook sign-in fails', async () => {
            authServiceSpy.loginWithFacebook.and.rejectWith({ code: 'auth/account-exists-with-different-credential' });

            await component.loginWithFacebook();

            expect(component.errorMessage).toBe(
                'An account with this email already exists. Sign in with your existing method instead.',
            );
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should silently ignore a closed popup', async () => {
            authServiceSpy.loginWithFacebook.and.rejectWith({ code: 'auth/cancelled-popup-request' });

            await component.loginWithFacebook();

            expect(component.errorMessage).toBe('');
            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('forgot password', () => {
        it('should send a password reset link for the entered email', async () => {
            component.loginForm.setValue({ email: 'user@example.com', password: '' });

            await component.forgotPassword();

            expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith('user@example.com');
            expect(component.infoMessage).toContain('If an account exists');
        });

        it('should not call the service when no email is present', async () => {
            component.loginForm.setValue({ email: '', password: '' });

            await component.forgotPassword();

            expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
            expect(component.errorMessage).toBe('Enter your email address first.');
        });

        it('should not reveal whether an account exists when reset fails with user-not-found', async () => {
            authServiceSpy.forgotPassword.and.rejectWith({ code: 'auth/user-not-found' });
            component.loginForm.setValue({ email: 'ghost@example.com', password: '' });

            await component.forgotPassword();

            expect(component.errorMessage).toBe('');
            expect(component.infoMessage).toContain('If an account exists');
        });
    });

    describe('error handling', () => {
        it('should clear a previous error when a new submit succeeds', async () => {
            fillValidCredentials();
            authServiceSpy.login.and.rejectWith({ code: 'auth/wrong-password' });
            await component.onSubmit();
            expect(component.errorMessage).toBe('Invalid email or password.');

            authServiceSpy.login.and.resolveTo();
            await component.onSubmit();

            expect(component.errorMessage).toBe('');
        });

        it('should not navigate when login fails', async () => {
            authServiceSpy.login.and.rejectWith({ code: 'auth/network-request-failed' });
            fillValidCredentials();

            await component.onSubmit();

            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('template', () => {
        function submitButton(): HTMLButtonElement {
            return fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        }

        it('should disable the submit button while the form is invalid', () => {
            fixture.detectChanges();
            expect(submitButton().disabled).toBeTrue();
        });

        it('should enable the submit button once the form is valid', () => {
            fillValidCredentials();
            fixture.detectChanges();

            expect(submitButton().disabled).toBeFalse();
        });

        it('should render the error banner only when there is an error message', () => {
            expect(fixture.debugElement.query(By.css('.error-banner'))).toBeNull();

            component.errorMessage = 'Invalid email or password.';
            fixture.detectChanges();

            const banner = fixture.debugElement.query(By.css('.error-banner'));
            expect(banner).not.toBeNull();
            expect(banner.nativeElement.textContent).toContain('Invalid email or password.');
        });

        it('should submit the form when the form element is submitted', () => {
            fillValidCredentials();
            fixture.detectChanges();

            fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', null);

            expect(authServiceSpy.login).toHaveBeenCalled();
        });
    });

    describe('password visibility', () => {
        function passwordInput(): HTMLInputElement {
            return fixture.debugElement.query(By.css('input[formControlName="password"]')).nativeElement;
        }

        it('should hide the password by default', () => {
            expect(passwordInput().type).toBe('password');
        });

        it('should reveal the password when the toggle is clicked', () => {
            fixture.debugElement.query(By.css('.pwd-toggle')).triggerEventHandler('click', null);
            fixture.detectChanges();

            expect(component.showPassword).toBeTrue();
            expect(passwordInput().type).toBe('text');
        });

        it('should hide the password again when toggled twice', () => {
            component.togglePassword();
            component.togglePassword();
            fixture.detectChanges();

            expect(component.showPassword).toBeFalse();
            expect(passwordInput().type).toBe('password');
        });
    });

    describe('remember me', () => {
        it('should default to checked', () => {
            expect(component.rememberMe).toBeTrue();
        });

        it('should update when toggled', () => {
            component.onRememberMeChange(false);
            expect(component.rememberMe).toBeFalse();
        });

        it('should pass rememberMe into login', async () => {
            fillValidCredentials();
            component.onRememberMeChange(false);

            await component.onSubmit();

            expect(authServiceSpy.login).toHaveBeenCalledWith('user@example.com', 'password123', false);
        });
    });
});
