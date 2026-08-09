import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let router: Router;

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and initialize form', () => {
        expect(component).toBeTruthy();
        expect(component.loginForm.valid).toBeFalse();
    });

    it('should validate form and call login service on submit', () => {
        component.loginForm.setValue({
            email: 'user@example.com',
            password: 'password123',
        });
        expect(component.loginForm.valid).toBeTrue();

        authServiceSpy.login.and.returnValue(
            of({
                userId: 'user-1',
                email: 'user@example.com',
                token: 'tok',
                refreshToken: 'ref',
            }),
        );

        component.onSubmit();
        expect(authServiceSpy.login).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
    });

    it('should display error message on authentication failure', () => {
        component.loginForm.setValue({
            email: 'user@example.com',
            password: 'wrongpassword',
        });

        authServiceSpy.login.and.returnValue(throwError(() => ({ error: { error: 'Invalid credentials' } })));

        component.onSubmit();
        expect(component.errorMessage).toBe('Invalid credentials');
    });
});
