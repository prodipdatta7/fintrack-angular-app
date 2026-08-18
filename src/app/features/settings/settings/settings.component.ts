import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, authErrorMessage } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ThemeService, AccentColor, Theme } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/auth.model';
import { evaluatePassword, PasswordEvaluation } from '../../../core/validators/password-policy.validator';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

export type SettingsTabId =
    | 'profile'
    | 'security'
    | 'preferences'
    | 'appearance'
    | 'notifications'
    | 'data'
    | 'danger';

export interface SettingsTab {
    id: SettingsTabId;
    label: string;
    subtitle: string;
    icon: string;
    category: 'account' | 'preferences' | 'system';
}

export interface CurrencyOption {
    label: string;
    code: string;
    symbol: string;
    name: string;
}

export interface TimezoneOption {
    value: string;
    label: string;
    region: string;
}

export interface DateFormatOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSliderModule,
        MatDividerModule,
        MatSnackBarModule,
        MatTooltipModule,
        AppCurrencyPipe,
    ],
    providers: [DatePipe],
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
    private toast = inject(ToastService);
    private destroyRef = inject(DestroyRef);
    private datePipe = inject(DatePipe);

    readonly currentUser = this.authService.currentUser;
    readonly activeTab = signal<SettingsTabId>('profile');

    isSavingProfile = false;
    isSavingPassword = false;
    isSavingSettings = false;
    isExportingData = false;
    showDeleteConfirm = false;
    deletePassword = '';
    isDeleting = false;
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
    avatarPreview: string | null = null;
    isUploadingAvatar = false;
    copiedUid = signal(false);
    copiedEmail = signal(false);

    readonly tabs: SettingsTab[] = [
        {
            id: 'profile',
            label: 'Profile & Identity',
            subtitle: 'Name, email & avatar',
            icon: 'person',
            category: 'account',
        },
        {
            id: 'security',
            label: 'Security & Access',
            subtitle: 'Password & active sessions',
            icon: 'lock',
            category: 'account',
        },
        {
            id: 'preferences',
            label: 'Regional & Preferences',
            subtitle: 'Currency, timezone & formatting',
            icon: 'tune',
            category: 'preferences',
        },
        {
            id: 'appearance',
            label: 'Appearance & Theme',
            subtitle: 'Color mode & accent glow',
            icon: 'palette',
            category: 'preferences',
        },
        {
            id: 'notifications',
            label: 'Notifications & Alerts',
            subtitle: 'Email & budget threshold limits',
            icon: 'notifications',
            category: 'preferences',
        },
        {
            id: 'data',
            label: 'Data & Privacy',
            subtitle: 'Export records & session controls',
            icon: 'shield',
            category: 'system',
        },
        {
            id: 'danger',
            label: 'Danger Zone',
            subtitle: 'Irreversible account deletion',
            icon: 'warning',
            category: 'system',
        },
    ];

    readonly profileForm = this.fb.nonNullable.group({
        firstName: ['', [Validators.required, Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
    });

    readonly passwordForm = this.fb.nonNullable.group({
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

    readonly preferencesForm = this.fb.nonNullable.group({
        currency: ['BDT'],
        timeZone: ['Asia/Dhaka'],
        dateFormat: ['dd/MM/yyyy'],
        defaultPageSize: [10],
    });

    readonly notificationsForm = this.fb.nonNullable.group({
        emailNotifications: [true],
        budgetAlerts: [true],
        budgetAlertThreshold: [20],
    });

    readonly currencyOptions: CurrencyOption[] = [
        { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', label: 'BDT (৳) — Bangladeshi Taka' },
        { code: 'USD', symbol: '$', name: 'US Dollar', label: 'USD ($) — US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro', label: 'EUR (€) — Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound', label: 'GBP (£) — British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee', label: 'INR (₹) — Indian Rupee' },
        { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', label: 'SAR (﷼) — Saudi Riyal' },
        { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', label: 'AED (د.إ) — UAE Dirham' },
        { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', label: 'SGD (S$) — Singapore Dollar' },
        { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', label: 'MYR (RM) — Malaysian Ringgit' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen', label: 'JPY (¥) — Japanese Yen' },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', label: 'CNY (¥) — Chinese Yuan' },
        { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', label: 'PKR (₨) — Pakistani Rupee' },
        { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', label: 'LKR (Rs) — Sri Lankan Rupee' },
        { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', label: 'NPR (₨) — Nepalese Rupee' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', label: 'CAD (C$) — Canadian Dollar' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', label: 'AUD (A$) — Australian Dollar' },
    ];

    readonly timezoneOptions: TimezoneOption[] = [
        { value: 'Asia/Dhaka', label: 'Asia/Dhaka (UTC+6)', region: 'South Asia' },
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)', region: 'South Asia' },
        { value: 'Asia/Karachi', label: 'Asia/Karachi (UTC+5)', region: 'South Asia' },
        { value: 'Asia/Colombo', label: 'Asia/Colombo (UTC+5:30)', region: 'South Asia' },
        { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (UTC+5:45)', region: 'South Asia' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)', region: 'Middle East' },
        { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)', region: 'Middle East' },
        { value: 'Asia/Qatar', label: 'Asia/Qatar (UTC+3)', region: 'Middle East' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)', region: 'Southeast Asia' },
        { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur (UTC+8)', region: 'Southeast Asia' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+7)', region: 'Southeast Asia' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)', region: 'East Asia' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Global' },
        { value: 'Europe/London', label: 'Europe/London (UTC+0 / BST)', region: 'Europe' },
        { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1 / CEST)', region: 'Europe' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1 / CEST)', region: 'Europe' },
        { value: 'America/New_York', label: 'America/New York (UTC-5 / EDT)', region: 'Americas' },
        { value: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-8 / PDT)', region: 'Americas' },
        { value: 'America/Chicago', label: 'America/Chicago (UTC-6 / CDT)', region: 'Americas' },
        { value: 'America/Toronto', label: 'America/Toronto (UTC-5 / EDT)', region: 'Americas' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10)', region: 'Oceania' },
    ];

    readonly dateFormatOptions: DateFormatOption[] = [
        { label: 'dd/MM/yyyy', value: 'dd/MM/yyyy' },
        { label: 'dd-MM-yyyy', value: 'dd-MM-yyyy' },
        { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
        { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
        { label: 'dd MMM, yyyy', value: 'dd MMM, yyyy' },
        { label: 'dd MMMM, yyyy', value: 'dd MMMM, yyyy' },
    ];

    readonly pageSizeOptions = [5, 10, 15, 20, 25, 50];

    readonly today = new Date();

    /** Live evaluation of new password entered in security form */
    readonly passwordEvaluation = computed<PasswordEvaluation>(() => {
        const val = this.passwordForm.get('newPassword')?.value || '';
        return evaluatePassword(val);
    });

    /** Current active currency code selected in preferences */
    readonly selectedCurrency = computed(() => {
        const code = this.preferencesForm.get('currency')?.value || 'BDT';
        return this.currencyOptions.find((c) => c.code === code) || this.currencyOptions[0];
    });

    readonly customHexInput = signal<string>(this.themeService.customHex());

    readonly quickCustomColors = [
        '#8B5CF6',
        '#EC4899',
        '#06B6D4',
        '#10B981',
        '#F59E0B',
        '#F43F5E',
        '#14B8A6',
        '#6366F1',
        '#3B82F6',
        '#E11D48',
    ];

    /** Swatches follow the active theme (cyan on dark, violet on light). */
    get accentColors(): { label: string; value: AccentColor; color: string; desc: string }[] {
        const light = this.themeService.theme() === 'light';
        return [
            { label: 'Indigo', value: 'indigo', color: '#6366f1', desc: 'Electric Indigo (Default)' },
            {
                label: light ? 'Violet' : 'Cyan',
                value: 'cyan',
                color: light ? '#7c3aed' : '#06b6d4',
                desc: light ? 'Royal Violet' : 'Neon Cyan',
            },
            { label: 'Emerald', value: 'emerald', color: '#10b981', desc: 'Vibrant Emerald' },
            { label: 'Rose', value: 'rose', color: '#ef4444', desc: 'Vivid Crimson' },
            { label: 'Amber', value: 'amber', color: '#f59e0b', desc: 'Warm Amber Gold' },
            { label: 'Purple', value: 'purple', color: '#8b5cf6', desc: 'Ultra Violet' },
            { label: 'Fuchsia', value: 'fuchsia', color: '#d946ef', desc: 'Cyber Fuchsia' },
            { label: 'Sky', value: 'sky', color: '#0ea5e9', desc: 'Electric Sky Blue' },
            { label: 'Lime', value: 'lime', color: '#84cc16', desc: 'Neon Lime' },
            { label: 'Coral', value: 'coral', color: '#f97316', desc: 'Vivid Coral' },
            { label: 'Teal', value: 'teal', color: '#1b6b8a', desc: 'Cosmic Teal' },
        ];
    }

    onCustomColorPickerChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.value) {
            this.customHexInput.set(input.value.toUpperCase());
            this.themeService.setCustomAccent(input.value);
        }
    }

    onCustomHexInputChange(hex: string): void {
        const formatted = hex.trim();
        this.customHexInput.set(formatted);
        if (/^#?[0-9A-Fa-f]{6}$/.test(formatted)) {
            this.themeService.setCustomAccent(formatted);
        }
    }

    selectQuickCustom(hex: string): void {
        this.customHexInput.set(hex.toUpperCase());
        this.themeService.setCustomAccent(hex);
    }

    get hasPasswordProvider(): boolean {
        return this.authService.hasPasswordProvider();
    }

    get isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    get initials(): string {
        const user = this.currentUser();
        const first = user?.firstName?.trim() || '';
        const last = user?.lastName?.trim() || '';
        if (first && last) {
            return (first[0] + last[0]).toUpperCase();
        }
        if (first) {
            return first.slice(0, 2).toUpperCase();
        }
        const email = user?.email || '';
        const part = email.split('@')[0] || '?';
        return part.slice(0, 2).toUpperCase();
    }

    get displayName(): string {
        const user = this.currentUser();
        if (user?.firstName || user?.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return user?.email?.split('@')[0] || 'User Profile';
    }

    get avatarUrl(): string | null {
        return this.avatarPreview || this.authService.avatarSrc() || null;
    }

    get selectedDateFormatLabel(): string {
        const format = this.preferencesForm.get('dateFormat')?.value || 'dd/MM/yyyy';
        return this.getFormattedDatePreview(format);
    }

    ngOnInit(): void {
        void this.bootstrapProfile();
        this.loadSettings();
    }

    setTab(tabId: SettingsTabId): void {
        this.activeTab.set(tabId);
    }

    setTheme(theme: Theme): void {
        if (this.themeService.theme() !== theme) {
            this.themeService.theme.set(theme);
        }
    }

    getFormattedDatePreview(format: string): string {
        try {
            return this.datePipe.transform(this.today, format) || format;
        } catch {
            return format;
        }
    }

    getFormattedTimezoneTime(timeZone: string): string {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }).format(this.today);
        } catch {
            return '';
        }
    }

    async copyToClipboard(text: string, type: 'uid' | 'email'): Promise<void> {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'uid') {
                this.copiedUid.set(true);
                setTimeout(() => this.copiedUid.set(false), 2000);
            } else {
                this.copiedEmail.set(true);
                setTimeout(() => this.copiedEmail.set(false), 2000);
            }
            this.toast.show(`${type === 'uid' ? 'User ID' : 'Email'} copied to clipboard!`, 'info');
        } catch {
            this.toast.show('Failed to copy to clipboard', 'error');
        }
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
                        this.authService.currentUser.set(updated);
                    }
                    this.avatarPreview = null;
                    void this.authService.refreshAvatar();
                    this.toast.show('Profile photo updated successfully', 'success');
                    this.isUploadingAvatar = false;
                },
                error: (err) => {
                    this.avatarPreview = null;
                    this.toast.error(err.error?.error || 'Failed to upload photo');
                    this.isUploadingAvatar = false;
                },
            });
    }

    saveProfile(): void {
        if (this.profileForm.invalid) return;
        this.isSavingProfile = true;
        const val = this.profileForm.getRawValue();
        this.userService
            .updateProfile({
                firstName: val.firstName.trim(),
                lastName: val.lastName.trim(),
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (updatedUser) => {
                    const currentUser = this.authService.currentUser();
                    if (currentUser) {
                        const merged: User = { ...currentUser, ...updatedUser };
                        this.authService.currentUser.set(merged);
                    }
                    this.toast.show('Profile changes saved successfully', 'success');
                    this.isSavingProfile = false;
                },
                error: (err) => {
                    this.toast.error(err.error?.error || 'Failed to update profile');
                    this.isSavingProfile = false;
                },
            });
    }

    async changePassword(): Promise<void> {
        if (this.passwordForm.invalid) return;
        const val = this.passwordForm.getRawValue();
        if (val.newPassword !== val.confirmPassword) {
            this.passwordForm.setErrors({ mismatch: true });
            this.toast.error('Passwords do not match');
            return;
        }
        this.isSavingPassword = true;
        try {
            await this.authService.changePassword(val.currentPassword, val.newPassword);
            this.toast.show('Security password updated successfully', 'success');
            this.passwordForm.reset();
        } catch (err) {
            this.toast.error(authErrorMessage(err));
        } finally {
            this.isSavingPassword = false;
        }
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
                    this.toast.show('Preferences updated successfully', 'success');
                    this.isSavingSettings = false;
                },
                error: (err) => {
                    this.toast.error(err.error?.error || 'Failed to save preferences');
                    this.isSavingSettings = false;
                },
            });
    }

    exportData(): void {
        this.isExportingData = true;
        this.userService
            .exportData()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fintrack-ledger-export-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    this.toast.show('Transactions ledger exported (CSV)', 'success');
                    this.isExportingData = false;
                },
                error: (err) => {
                    this.toast.error(err.error?.error || 'Failed to export ledger data');
                    this.isExportingData = false;
                },
            });
    }

    async deleteAccount(): Promise<void> {
        if (this.hasPasswordProvider && !this.deletePassword) return;
        this.isDeleting = true;
        try {
            await this.authService.deleteAccount(
                this.hasPasswordProvider ? this.deletePassword : undefined,
            );
            this.toast.show('Account permanently deleted', 'info');
            await this.router.navigate(['/login']);
        } catch (err) {
            this.toast.error(authErrorMessage(err));
            this.isDeleting = false;
        }
    }

    async logoutAllSessions(): Promise<void> {
        try {
            await firstValueFrom(this.userService.logoutAll());
            await this.authService.logout();
            this.toast.show('Logged out from all active sessions', 'info');
            await this.router.navigate(['/login']);
        } catch (err) {
            this.toast.error(
                (err as { error?: { error?: string } }).error?.error || 'Failed to terminate all sessions',
            );
        }
    }

    private async bootstrapProfile(): Promise<void> {
        try {
            if (!this.authService.currentUser()) {
                await this.authService.hydrateProfile();
            }
            this.patchProfileForm(this.authService.currentUser());
        } catch {
            const message =
                this.authService.profileError() || 'Failed to load profile. Please refresh.';
            this.toast.error(message);
        }
    }

    private patchProfileForm(user: User | null): void {
        if (!user) return;
        this.profileForm.patchValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
        });
        // Email is managed via Auth credentials — display only
        this.profileForm.get('email')?.disable();
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
