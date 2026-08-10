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

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;

    settings = signal<UserSettings | null>(null);
    isLoading = signal<boolean>(false);

    getProfile(): Observable<User> {
        this.isLoading.set(true);
        return this.http.get<User>(`${this.apiUrl}/me`).pipe(finalize(() => this.isLoading.set(false)));
    }

    updateProfile(req: UpdateProfileRequest): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/me`, req);
    }

    changePassword(req: ChangePasswordRequest): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/me/change-password`, req);
    }

    getSettings(): Observable<UserSettings> {
        this.isLoading.set(true);
        return this.http.get<UserSettings>(`${this.apiUrl}/me/settings`).pipe(
            tap((settings: UserSettings) => this.settings.set(settings)),
            finalize(() => this.isLoading.set(false)),
        );
    }

    updateSettings(req: UserSettings): Observable<{ message: string }> {
        return this.http
            .put<{ message: string }>(`${this.apiUrl}/me/settings`, req)
            .pipe(tap(() => this.settings.set(req)));
    }

    exportData(req?: ExportDataRequest): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/data/export`, req || {}, {
            responseType: 'blob',
        });
    }

    deleteAccount(confirmPassword: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/me/delete-account`, {
            confirmPassword,
        });
    }

    logoutAll(): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/me/logout-all`, {});
    }

    uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/me/avatar`, formData);
    }
}
