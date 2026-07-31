import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <i class="pi pi-user-plus glow-text-cyan" style="font-size: 2.5rem;"></i>
          <h2>Create Your <span class="glow-text-indigo">FinTrack</span> Account</h2>
          <p>Start tracking income, expenses, and transaction event history</p>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input id="firstName" type="text" formControlName="firstName" placeholder="John" />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input id="lastName" type="text" formControlName="lastName" placeholder="Doe" />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="user@example.com" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <button type="submit" [disabled]="registerForm.invalid || isLoading" class="btn-primary">
            @if (isLoading) {
              <i class="pi pi-spin pi-spinner"></i> Creating Account...
            } @else {
              Register
            }
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login" class="glow-text-cyan">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 2.5rem 2rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-header h2 {
      font-size: 1.5rem;
      margin-top: 0.75rem;
    }
    .auth-header p {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .form-row .form-group {
      flex: 1;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-group label {
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .error-banner {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #f43f5e;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.9rem;
      color: #94a3b8;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const val = this.registerForm.getRawValue();
    this.authService.register({
      firstName: val.firstName!,
      lastName: val.lastName!,
      email: val.email!,
      password: val.password!
    }).subscribe({
      next: () => {
        if (typeof this.authService.login === 'function') {
          this.authService.login({ email: val.email!, password: val.password! }).subscribe({
            next: () => {
              this.isLoading = false;
              this.router.navigate(['/transactions']);
            },
            error: () => {
              this.isLoading = false;
              this.router.navigate(['/transactions']);
            }
          });
        } else {
          this.isLoading = false;
          this.router.navigate(['/transactions']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Registration failed.';
      }
    });
  }
}
