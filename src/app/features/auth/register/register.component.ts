import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, authErrorMessage } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { passwordPolicyValidator } from '../../../core/validators/password-policy.validator';
import { PasswordRequirementsComponent } from '../../../shared/components/password-requirements/password-requirements.component';

type StrengthLevel = 'none' | 'weak' | 'medium' | 'strong';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        AuthShellComponent,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PasswordRequirementsComponent,
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    registerForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordPolicyValidator()]],
    });

    showPassword = false;
    isLoading = false;
    errorMessage = '';

    get firstName() {
        return this.registerForm.get('firstName');
    }

    get lastName() {
        return this.registerForm.get('lastName');
    }

    get email() {
        return this.registerForm.get('email');
    }

    get password() {
        return this.registerForm.get('password');
    }

    /** 0..4 strength score derived from the current password. */
    get strength(): number {
        const value = this.password?.value ?? '';
        if (!value) return 0;
        let score = 0;
        if (value.length >= 6) score++;
        if (value.length >= 10) score++;
        if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        return score;
    }

    get strengthLabel(): string {
        const level = this.strengthLevel;
        return { none: '', weak: 'Weak', medium: 'Fair', strong: 'Strong' }[level];
    }

    get strengthLevel(): StrengthLevel {
        const score = this.strength;
        if (score === 0) return 'none';
        if (score <= 2) return 'weak';
        if (score === 3) return 'medium';
        return 'strong';
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    async onSubmit(): Promise<void> {
        if (this.registerForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const val = this.registerForm.getRawValue();
        try {
            await this.authService.register({
                firstName: val.firstName!,
                lastName: val.lastName!,
                email: val.email!,
                password: val.password!,
            });
            await this.router.navigate(['/dashboard']);
        } catch (err) {
            this.errorMessage = authErrorMessage(err);
        } finally {
            this.isLoading = false;
        }
    }
}