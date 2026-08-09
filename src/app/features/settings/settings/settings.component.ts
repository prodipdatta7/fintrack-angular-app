import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ThemeService, AccentColor } from '../../../core/services/theme.service';
import { User } from '../../../core/models/auth.model';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormsModule,
        NgStyle,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSliderModule,
        MatDividerModule,
        MatSnackBarModule,
        MatDialogModule,
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private userService = inject(UserService);
    themeService = inject(ThemeService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    private destroyRef = inject(DestroyRef);

    currentUser = this.authService.currentUser;
    isSavingProfile = false;
    isSavingPassword = false;
    isSavingSettings = false;
    showDeleteConfirm = false;
    deletePassword = '';
    isDeleting = false;
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
    showPasswordRules = false;
    panelStyle: Record<string, string> = {};
    avatarPreview: string | null = null;
    isUploadingAvatar = false;

    passwordRules = {
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false,
        minLength: false,
        maxLength: false,
    };

    profileForm = this.fb.nonNullable.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
    });

    passwordForm = this.fb.nonNullable.group({
        currentPassword: ['', Validators.required],
        newPassword: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.maxLength(30),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).+$/),
            ],
        ],
        confirmPassword: ['', Validators.required],
    });

    preferencesForm = this.fb.nonNullable.group({
        currency: ['BDT'],
        timeZone: ['Asia/Dhaka'],
        dateFormat: ['dd/MM/yyyy'],
        defaultPageSize: [10],
    });

    notificationsForm = this.fb.nonNullable.group({
        emailNotifications: [true],
        budgetAlerts: [true],
        budgetAlertThreshold: [20],
    });

    currencyOptions = [
        { label: 'BDT (৳)', value: 'BDT' },
        { label: 'USD ($)', value: 'USD' },
        { label: 'INR (₹)', value: 'INR' },
        { label: 'PKR (₨)', value: 'PKR' },
        { label: 'LKR (Rs)', value: 'LKR' },
        { label: 'NPR (₨)', value: 'NPR' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
        { label: 'SAR (﷼)', value: 'SAR' },
        { label: 'AED (د.إ)', value: 'AED' },
        { label: 'SGD (S$)', value: 'SGD' },
        { label: 'MYR (RM)', value: 'MYR' },
        { label: 'JPY (¥)', value: 'JPY' },
        { label: 'CNY (¥)', value: 'CNY' },
    ];

    timezoneOptions = [
        'Asia/Dhaka',
        'Asia/Kolkata',
        'Asia/Karachi',
        'Asia/Colombo',
        'Asia/Kathmandu',
        'Asia/Thimphu',
        'Asia/Yangon',
        'Asia/Bangkok',
        'Asia/Singapore',
        'Asia/Kuala_Lumpur',
        'Asia/Dubai',
        'Asia/Riyadh',
        'Asia/Qatar',
        'UTC',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'America/New_York',
        'America/Los_Angeles',
        'Australia/Sydney',
    ];

    dateFormatOptions = [
        { label: 'dd/MM/yyyy', value: 'dd/MM/yyyy' },
        { label: 'dd-MM-yyyy', value: 'dd-MM-yyyy' },
        { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
        { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
        { label: 'dd MMM, yyyy', value: 'dd MMM, yyyy' },
        { label: 'dd MMMM, yyyy', value: 'dd MMMM, yyyy' },
    ];

    pageSizeOptions = [5, 10, 15, 20, 25, 50];

    accentColors: { label: string; value: AccentColor; color: string }[] = [
        { label: 'Indigo', value: 'indigo', color: '#6366f1' },
        { label: 'Cyan', value: 'cyan', color: '#06b6d4' },
        { label: 'Emerald', value: 'emerald', color: '#10b981' },
        { label: 'Rose', value: 'rose', color: '#f43f5e' },
        { label: 'Amber', value: 'amber', color: '#f59e0b' },
    ];

    passwordStrength: 'none' | 'weak' | 'fair' | 'strong' | 'very-strong' = 'none';

    get allRulesMet(): boolean {
        return Object.values(this.passwordRules).every((v) => v);
    }

    checkPasswordRules(): void {
        const val = this.passwordForm.get('newPassword')?.value || '';
        this.passwordRules.uppercase = /[A-Z]/.test(val);
        this.passwordRules.lowercase = /[a-z]/.test(val);
        this.passwordRules.digit = /\d/.test(val);
        this.passwordRules.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val);
        this.passwordRules.minLength = val.length >= 8;
        this.passwordRules.maxLength = val.length <= 30 && val.length > 0;

        let score = 0;
        if (this.passwordRules.uppercase) score++;
        if (this.passwordRules.lowercase) score++;
        if (this.passwordRules.digit) score++;
        if (this.passwordRules.special) score++;
        if (val.length >= 8) score++;
        if (val.length >= 12) score++;
        if (val.length >= 16) score++;

        if (val.length === 0) this.passwordStrength = 'none';
        else if (score <= 2) this.passwordStrength = 'weak';
        else if (score <= 4) this.passwordStrength = 'fair';
        else if (score <= 5) this.passwordStrength = 'strong';
        else this.passwordStrength = 'very-strong';
    }

    updatePanelPosition(event: Event): void {
        const input = event.target as HTMLInputElement;
        const fieldEl = input.closest('mat-form-field') || input.parentElement;
        const rect = (fieldEl as HTMLElement).getBoundingClientRect();
        this.panelStyle = {
            position: 'fixed',
            top: `${rect.bottom + 2}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
        };
    }

    ngOnInit(): void {
        this.loadProfile();
        this.loadSettings();
    }

    get initials(): string {
        const user = this.currentUser();
        const email = user?.email || '';
        const part = email.split('@')[0] || '?';
        const first = part[0]?.toUpperCase() || '?';
        const second = part.slice(1).includes('.') ? part.split('.').pop()?.[0]?.toUpperCase() || '' : '';
        return second ? first + second : first;
    }

    triggerAvatarUpload(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) this.uploadAvatar(file);
        };
        input.click();
    }

    uploadAvatar(file: File): void {
        this.isUploadingAvatar = true;
        const reader = new FileReader();
        reader.onload = () => {
            this.avatarPreview = reader.result as string;
        };
        reader.readAsDataURL(file);

        this.userService
            .uploadAvatar(file)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    const user = this.authService.currentUser();
                    if (user) {
                        const updated: User = { ...user, avatarUrl: res.avatarUrl };
                        localStorage.setItem('user_info', JSON.stringify(updated));
                        this.authService.currentUser.set(updated);
                    }
                    this.avatarPreview = null;
                    this.snackBar.open('Avatar updated', 'Close', { duration: 3000 });
                    this.isUploadingAvatar = false;
                },
                error: (err) => {
                    this.avatarPreview = null;
                    this.snackBar.open(err.error?.error || 'Failed to upload avatar', 'Close', {
                        duration: 4000,
                    });
                    this.isUploadingAvatar = false;
                },
            });
    }

    get avatarUrl(): string | null {
        return this.avatarPreview || this.currentUser()?.avatarUrl || null;
    }

    saveProfile(): void {
        if (this.profileForm.invalid) return;
        this.isSavingProfile = true;
        const val = this.profileForm.getRawValue();
        this.userService
            .updateProfile({
                email: val.email,
                firstName: val.firstName,
                lastName: val.lastName,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedUser) => {
                    const currentUser = this.authService.currentUser();
                    if (currentUser) {
                        const merged: User = { ...currentUser, ...updatedUser };
                        localStorage.setItem('user_info', JSON.stringify(merged));
                        this.authService.currentUser.set(merged);
                    }
                    this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
                    this.isSavingProfile = false;
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to update profile', 'Close', {
                        duration: 4000,
                    });
                    this.isSavingProfile = false;
                },
            });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) return;
        const val = this.passwordForm.getRawValue();
        if (val.newPassword !== val.confirmPassword) {
            this.passwordForm.setErrors({ mismatch: true });
            return;
        }
        this.isSavingPassword = true;
        this.userService
            .changePassword({
                currentPassword: val.currentPassword,
                newPassword: val.newPassword,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
                    this.passwordForm.reset();
                    this.isSavingPassword = false;
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to change password', 'Close', {
                        duration: 4000,
                    });
                    this.isSavingPassword = false;
                },
            });
    }

    savePreferences(): void {
        this.isSavingSettings = true;
        const prefVal = this.preferencesForm.getRawValue();
        const notifVal = this.notificationsForm.getRawValue();
        this.userService
            .updateSettings({
                ...prefVal,
                ...notifVal,
                budgetAlertThreshold: notifVal.budgetAlerts ? notifVal.budgetAlertThreshold : null,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBar.open('Preferences saved', 'Close', { duration: 3000 });
                    this.isSavingSettings = false;
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to save preferences', 'Close', {
                        duration: 4000,
                    });
                    this.isSavingSettings = false;
                },
            });
    }

    exportData(): void {
        this.userService
            .exportData()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fintrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    this.snackBar.open('Data exported successfully', 'Close', { duration: 3000 });
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to export data', 'Close', {
                        duration: 4000,
                    });
                },
            });
    }

    deleteAccount(): void {
        if (!this.deletePassword) return;
        this.isDeleting = true;
        this.userService
            .deleteAccount(this.deletePassword)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBar.open('Account deleted', 'Close', { duration: 3000 });
                    this.authService.logout();
                    this.router.navigate(['/login']);
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to delete account', 'Close', {
                        duration: 4000,
                    });
                    this.isDeleting = false;
                },
            });
    }

    logoutAllSessions(): void {
        this.userService
            .logoutAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.snackBar.open('All sessions logged out', 'Close', { duration: 3000 });
                    this.authService.logout();
                    this.router.navigate(['/login']);
                },
                error: (err) => {
                    this.snackBar.open(err.error?.error || 'Failed to logout sessions', 'Close', {
                        duration: 4000,
                    });
                },
            });
    }

    private loadProfile(): void {
        const user = this.authService.currentUser();
        if (user) {
            this.profileForm.patchValue({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
            });
        }
    }

    private loadSettings(): void {
        this.userService
            .getSettings()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (settings) => {
                    this.preferencesForm.patchValue({
                        currency: settings.currency,
                        timeZone: settings.timeZone,
                        dateFormat: settings.dateFormat,
                        defaultPageSize: settings.defaultPageSize,
                    });
                    this.notificationsForm.patchValue({
                        emailNotifications: settings.emailNotifications,
                        budgetAlerts: settings.budgetAlerts,
                        budgetAlertThreshold: settings.budgetAlertThreshold ?? 20,
                    });
                },
                error: () => {},
            });
    }
}
