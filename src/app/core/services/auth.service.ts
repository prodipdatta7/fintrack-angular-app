import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // Angular Signals for state management
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('token'));
  refreshToken = signal<string | null>(localStorage.getItem('refresh_token'));
  isAuthenticated = computed(() => !!this.token() || !!this.currentUser());

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials, { withCredentials: true }).pipe(
      tap((res: AuthResponse) => this.handleAuthSuccess(res, credentials.email))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data, { withCredentials: true }).pipe(
      tap((res: AuthResponse) => this.handleAuthSuccess(res, data.email))
    );
  }

  refreshTokens(): Observable<AuthResponse> {
    const currentToken = this.token();
    const currentRefresh = this.refreshToken();
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, {
      token: currentToken,
      refreshToken: currentRefresh
    }, { withCredentials: true }).pipe(
      tap((res: AuthResponse) => this.handleAuthSuccess(res)),
      catchError(err => {
        this.clearLocalState();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.clearLocalState();
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      error: () => {}
    });
  }

  private clearLocalState(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    this.token.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
  }

  private handleAuthSuccess(res: AuthResponse, emailFallback?: string): void {
    const token = res.accessToken || res.token || '';
    const refreshToken = res.refreshToken || '';

    if (token) {
      localStorage.setItem('token', token);
      this.token.set(token);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
      this.refreshToken.set(refreshToken);
    }

    const decodedUser = this.getUserFromToken(token, emailFallback);
    const user: User = {
      id: res.userId || decodedUser?.id || '',
      email: res.email || decodedUser?.email || emailFallback || '',
      firstName: decodedUser?.firstName
    };

    localStorage.setItem('user_info', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getUserFromToken(token: string, fallbackEmail?: string): User | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(base64);
      const payload = JSON.parse(jsonStr);

      const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload['nameid'] || payload['sub'] || '';
      const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload['email'] || fallbackEmail || '';
      const name = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['name'] || '';

      return { id, email, firstName: name };
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    const json = localStorage.getItem('user_info');
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
