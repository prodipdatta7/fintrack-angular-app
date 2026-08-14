import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
        authServiceSpy.register.and.resolveTo();

        await TestBed.configureTestingModule({
            imports: [RegisterComponent],
            providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and initialize register form', () => {
        expect(component).toBeTruthy();
        expect(component.registerForm.valid).toBeFalse();
    });

    it('should register successfully and navigate to dashboard', async () => {
        component.registerForm.setValue({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'P@ssword123',
        });

        await component.onSubmit();
        expect(authServiceSpy.register).toHaveBeenCalledWith({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'P@ssword123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not submit when the form is invalid', async () => {
        component.registerForm.setValue({
            firstName: '',
            lastName: 'Doe',
            email: 'not-an-email',
            password: '123',
        });

        await component.onSubmit();
        expect(authServiceSpy.register).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should display a friendly error message on registration failure', async () => {
        component.registerForm.setValue({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'P@ssword123',
        });
        authServiceSpy.register.and.rejectWith({ code: 'auth/email-already-in-use' });

        await component.onSubmit();
        expect(component.errorMessage).toBe('An account with this email already exists.');
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should report a weak strength for a short password', () => {
        component.registerForm.patchValue({ password: 'abc123' });
        expect(component.strength).toBeLessThan(3);
        expect(component.strengthLabel).toBe('Weak');
    });

    it('should report a strong strength for a complex password', () => {
        component.registerForm.patchValue({ password: 'Tr0ub4dor&3' });
        expect(component.strength).toBeGreaterThanOrEqual(3);
        expect(component.strengthLabel).toBe('Strong');
    });

    it('should hide the requirements panel when the password is empty', () => {
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.password-req-panel'))).toBeNull();
    });

    it('should show the requirements panel once a password is entered', () => {
        component.registerForm.patchValue({ password: 'abc123' });
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.password-req-panel'))).not.toBeNull();
    });

    it('should toggle the password visibility', () => {
        const input = fixture.debugElement.query(By.css('input[formControlName="password"]')).nativeElement as HTMLInputElement;
        expect(input.type).toBe('password');

        fixture.debugElement.query(By.css('.pwd-toggle')).triggerEventHandler('click', null);
        fixture.detectChanges();

        expect(component.showPassword).toBeTrue();
        expect(input.type).toBe('text');
    });
});
