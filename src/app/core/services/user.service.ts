import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import { UserSettings, UpdateProfileRequest, ExportDataRequest } from '../models/user-settings.model';
import { CurrencyStore, DEFAULT_CURRENCY } from './currency.store';

export { DEFAULT_CURRENCY };

/** Raw shape returned by the API (camelCase wire contract). */
interface ProfileResponse {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

function toUser(r: ProfileResponse): User {
    return {
        id: r.userId,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        avatarUrl: r.avatarUrl,
    };
}

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
        return this.http
            .get<ProfileResponse>(`${this.apiUrl}/get-me`)
            .pipe(map(toUser), finalize(() => this.isLoading.set(false)));
    }

    updateProfile(req: UpdateProfileRequest): Observable<User> {
        return this.http
            .put<ProfileResponse>(`${this.apiUrl}/update-profile`, req)
            .pipe(map(toUser));
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

    deleteAccount(): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/delete-user-account`, {});
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
