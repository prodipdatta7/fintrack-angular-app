import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <i class="pi pi-wallet glow-text-cyan" style="font-size: 2.5rem;"></i>
          <h2>Welcome to <span class="glow-text-indigo">FinTrack</span></h2>
          <p>Sign in to manage your financial accounts & transactions</p>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="user@example.com" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading" class="btn-primary">
            @if (isLoading) {
              <i class="pi pi-spin pi-spinner"></i> Authenticating...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register" class="glow-text-cyan">Register here</a>
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
      max-width: 420px;
      padding: 2.5rem 2rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-header h2 {
      font-size: 1.6rem;
      margin-top: 0.75rem;
    }
    .auth-header p {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.9rem;
      color: #94a3b8;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.getRawValue();
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Invalid credentials or login failed.';
      }
    });
  }
}
