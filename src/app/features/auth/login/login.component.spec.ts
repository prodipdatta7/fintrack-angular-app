import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { AuthResponse } from '../../../core/models/auth.model';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;
    let route: ActivatedRoute;

    const authResponse: AuthResponse = {
        userId: 'user-1',
        email: 'user@example.com',
        token: 'tok',
        refreshToken: 'ref',
    };

    /** Fill the form with credentials that satisfy every validator. */
    function fillValidCredentials(): void {
        component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    }

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

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

    it('should validate form and call login service on submit', () => {
        fillValidCredentials();
        expect(component.loginForm.valid).toBeTrue();

        authServiceSpy.login.and.returnValue(of(authResponse));

        component.onSubmit();
        expect(authServiceSpy.login).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
    });

    it('should display error message on authentication failure', () => {
        fillValidCredentials();

        authServiceSpy.login.and.returnValue(throwError(() => ({ error: { error: 'Invalid credentials' } })));

        component.onSubmit();
        expect(component.errorMessage).toBe('Invalid credentials');
    });

    describe('form validation', () => {
        it('should mark email as required when empty', () => {
            const email = component.loginForm.controls.email;
            email.setValue('');
            expect(email.hasError('required')).toBeTrue();
        });

        it('should reject a malformed email address', () => {
            // Password is set to a valid value so the form can only be invalid
            // because of the email — otherwise `required` on password masks it.
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

        it('should reject a password shorter than 6 characters', () => {
            const password = component.loginForm.controls.password;
            password.setValue('12345');
            expect(password.hasError('minlength')).toBeTrue();
        });

        it('should accept a password of exactly 6 characters', () => {
            const password = component.loginForm.controls.password;
            password.setValue('123456');
            expect(password.valid).toBeTrue();
        });
    });

    describe('submit guard', () => {
        it('should not call the auth service when the form is invalid', () => {
            component.loginForm.setValue({ email: 'not-an-email', password: '123' });

            component.onSubmit();

            expect(authServiceSpy.login).not.toHaveBeenCalled();
            expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should leave isLoading untouched when the form is invalid', () => {
            component.loginForm.setValue({ email: '', password: '' });

            component.onSubmit();

            expect(component.isLoading).toBeFalse();
        });
    });

    describe('loading state', () => {
        it('should set isLoading while the request is in flight', () => {
            const pending = new Subject<AuthResponse>();
            authServiceSpy.login.and.returnValue(pending.asObservable());
            fillValidCredentials();

            component.onSubmit();
            expect(component.isLoading).toBeTrue();

            pending.next(authResponse);
            pending.complete();
            expect(component.isLoading).toBeFalse();
        });

        it('should clear isLoading when the request fails', () => {
            authServiceSpy.login.and.returnValue(throwError(() => ({ error: { error: 'nope' } })));
            fillValidCredentials();

            component.onSubmit();

            expect(component.isLoading).toBeFalse();
        });
    });

    describe('post-login navigation', () => {
        it('should navigate to returnUrl when one is present in the query params', () => {
            route.snapshot.queryParams = { returnUrl: '/settings' };
            authServiceSpy.login.and.returnValue(of(authResponse));
            fillValidCredentials();

            component.onSubmit();

            expect(router.navigate).toHaveBeenCalledWith(['/settings']);
        });

        it('should fall back to /transactions when returnUrl is absent', () => {
            route.snapshot.queryParams = {};
            authServiceSpy.login.and.returnValue(of(authResponse));
            fillValidCredentials();

            component.onSubmit();

            expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
        });
    });

    describe('error handling', () => {
        it('should fall back to a generic message when the server sends no error text', () => {
            authServiceSpy.login.and.returnValue(throwError(() => ({ error: {} })));
            fillValidCredentials();

            component.onSubmit();

            expect(component.errorMessage).toBe('Invalid credentials or login failed.');
        });

        it('should fall back to a generic message when the error has no error body', () => {
            authServiceSpy.login.and.returnValue(throwError(() => ({ status: 0 })));
            fillValidCredentials();

            component.onSubmit();

            expect(component.errorMessage).toBe('Invalid credentials or login failed.');
        });

        it('should clear a previous error when a new submit succeeds', () => {
            fillValidCredentials();
            authServiceSpy.login.and.returnValue(throwError(() => ({ error: { error: 'Invalid credentials' } })));
            component.onSubmit();
            expect(component.errorMessage).toBe('Invalid credentials');

            authServiceSpy.login.and.returnValue(of(authResponse));
            component.onSubmit();

            expect(component.errorMessage).toBe('');
        });

        it('should not navigate when login fails', () => {
            authServiceSpy.login.and.returnValue(throwError(() => ({ error: { error: 'nope' } })));
            fillValidCredentials();

            component.onSubmit();

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

        it('should disable the submit button while a request is in flight', () => {
            authServiceSpy.login.and.returnValue(new Subject<AuthResponse>().asObservable());
            fillValidCredentials();
            component.onSubmit();
            fixture.detectChanges();

            expect(submitButton().disabled).toBeTrue();
        });

        it('should render the error banner only when there is an error message', () => {
            expect(fixture.debugElement.query(By.css('.error-banner'))).toBeNull();

            component.errorMessage = 'Invalid credentials';
            fixture.detectChanges();

            const banner = fixture.debugElement.query(By.css('.error-banner'));
            expect(banner).not.toBeNull();
            expect(banner.nativeElement.textContent).toContain('Invalid credentials');
        });

        it('should submit the form when the form element is submitted', () => {
            authServiceSpy.login.and.returnValue(of(authResponse));
            fillValidCredentials();
            fixture.detectChanges();

            fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', null);

            expect(authServiceSpy.login).toHaveBeenCalled();
        });
    });
});
