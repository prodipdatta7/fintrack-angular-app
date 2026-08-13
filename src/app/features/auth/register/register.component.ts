import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

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
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    isLoading = false;
    errorMessage = '';

    onSubmit(): void {
        if (this.registerForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const val = this.registerForm.getRawValue();
        this.authService
            .register({
                firstName: val.firstName!,
                lastName: val.lastName!,
                email: val.email!,
                password: val.password!,
            })
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = err.error?.error || 'Registration failed.';
                },
            });
    }
}
