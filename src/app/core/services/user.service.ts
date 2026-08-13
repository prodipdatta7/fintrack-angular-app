import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import {
    UserSettings,
    UpdateProfileRequest,
    ChangePasswordRequest,
    ExportDataRequest,
} from '../models/user-settings.model';
import { CurrencyStore, DEFAULT_CURRENCY } from './currency.store';

export { DEFAULT_CURRENCY };

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    private currencyStore = inject(CurrencyStore);

    settings = signal<UserSettings | null>(null);
    isLoading = signal<boolean>(false);

    /** Active display/create currency from preferences (falls back to BDT). */
    currencyCode = this.currencyStore.currencyCode;

    getProfile(): Observable<User> {
        this.isLoading.set(true);
        return this.http.get<User>(`${this.apiUrl}/get-me`).pipe(finalize(() => this.isLoading.set(false)));
    }

    updateProfile(req: UpdateProfileRequest): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/update-profile`, req);
    }

    changePassword(req: ChangePasswordRequest): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, req);
    }

    getSettings(): Observable<UserSettings> {
        this.isLoading.set(true);
        return this.http.get<UserSettings>(`${this.apiUrl}/get-settings`).pipe(
            tap((settings: UserSettings) => {
                this.settings.set(settings);
                this.currencyStore.setCurrency(settings.currency);
            }),
            finalize(() => this.isLoading.set(false)),
        );
    }

    updateSettings(req: UserSettings): Observable<{ message: string }> {
        return this.http
            .put<{ message: string }>(`${this.apiUrl}/update-settings`, req)
            .pipe(
                tap(() => {
                    this.settings.set(req);
                    this.currencyStore.setCurrency(req.currency);
                }),
            );
    }

    exportData(req?: ExportDataRequest): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/export-data`, req || {}, {
            responseType: 'blob',
        });
    }

    deleteAccount(confirmPassword: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/delete-user-account`, {
            confirmPassword,
        });
    }

    logoutAll(): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/logout-all-sessions`, {});
    }

    uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/upload-avatar`, formData);
    }
}
