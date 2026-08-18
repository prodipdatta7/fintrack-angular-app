import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, authErrorMessage } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        AuthShellComponent,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(24)]],
    });

    rememberMe = true;
    showPassword = false;
    isLoading = false;
    errorMessage = '';
    infoMessage = '';

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onRememberMeChange(checkedOrEvent: boolean | Event): void {
        if (typeof checkedOrEvent === 'boolean') {
            this.rememberMe = checkedOrEvent;
        } else {
            const target = checkedOrEvent.target as HTMLInputElement;
            this.rememberMe = target ? target.checked : !this.rememberMe;
        }
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';
        this.infoMessage = '';

        const { email, password } = this.loginForm.getRawValue();
        try {
            await this.authService.login(email!, password!, this.rememberMe);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];
            await this.router.navigate([returnUrl || '/dashboard']);
        } catch (err) {
            this.errorMessage = authErrorMessage(err);
        } finally {
            this.isLoading = false;
        }
    }

    async loginWithGoogle(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.infoMessage = '';
        try {
            await this.authService.loginWithGoogle();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];
            await this.router.navigate([returnUrl || '/dashboard']);
        } catch (err) {
            const message = authErrorMessage(err);
            if (message !== 'Sign-in popup was closed before completing.') {
                this.errorMessage = message;
            }
        } finally {
            this.isLoading = false;
        }
    }

    async loginWithFacebook(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.infoMessage = '';
        try {
            await this.authService.loginWithFacebook();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];
            await this.router.navigate([returnUrl || '/dashboard']);
        } catch (err) {
            const message = authErrorMessage(err);
            if (message !== 'Sign-in popup was closed before completing.') {
                this.errorMessage = message;
            }
        } finally {
            this.isLoading = false;
        }
    }

    async forgotPassword(): Promise<void> {
        const email = this.loginForm.get('email')?.value;
        if (!email) {
            this.errorMessage = 'Enter your email address first.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.infoMessage = '';
        try {
            await this.authService.forgotPassword(email);
            // Same copy on success and user-not-found — avoid account enumeration.
            this.infoMessage = 'If an account exists for that email, we sent a reset link.';
        } catch (err) {
            const code = (err as { code?: string })?.code;
            if (code === 'auth/user-not-found') {
                this.infoMessage = 'If an account exists for that email, we sent a reset link.';
            } else {
                this.errorMessage = authErrorMessage(err);
            }
        } finally {
            this.isLoading = false;
        }
    }
}
