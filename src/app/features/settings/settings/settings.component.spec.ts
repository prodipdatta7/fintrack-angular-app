import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SettingsComponent, SettingsTabId } from './settings.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ThemeService, AccentColor } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/auth.model';
import { UserSettings } from '../../../core/models/user-settings.model';

describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let themeServiceSpy: jasmine.SpyObj<ThemeService>;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockUser: User = {
        id: 'user-123-abc-456',
        email: 'alex.morgan@fintrack.app',
        firstName: 'Alex',
        lastName: 'Morgan',
        avatarUrl: 'https://example.com/avatar.jpg',
    };

    const mockSettings: UserSettings = {
        currency: 'USD',
        timeZone: 'America/New_York',
        dateFormat: 'MM/dd/yyyy',
        defaultPageSize: 20,
        emailNotifications: true,
        budgetAlerts: true,
        budgetAlertThreshold: 25,
    };

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj(
            'AuthService',
            [
                'hasPasswordProvider',
                'isAdmin',
                'hydrateProfile',
                'changePassword',
                'deleteAccount',
                'logout',
                'refreshAvatar',
            ],
            {
                currentUser: signal<User | null>(mockUser),
                avatarSrc: signal<string | null>(mockUser.avatarUrl || null),
                profileError: signal<string | null>(null),
            },
        );
        authServiceSpy.hasPasswordProvider.and.returnValue(true);
        authServiceSpy.isAdmin.and.returnValue(false);
        authServiceSpy.hydrateProfile.and.returnValue(Promise.resolve());
        authServiceSpy.changePassword.and.returnValue(Promise.resolve());
        authServiceSpy.deleteAccount.and.returnValue(Promise.resolve());
        authServiceSpy.logout.and.returnValue(Promise.resolve());
        authServiceSpy.refreshAvatar.and.returnValue(Promise.resolve());

        userServiceSpy = jasmine.createSpyObj('UserService', [
            'getProfile',
            'updateProfile',
            'getSettings',
            'updateSettings',
            'exportData',
            'deleteAccount',
            'logoutAll',
            'uploadAvatar',
        ]);
        userServiceSpy.getSettings.and.returnValue(of(mockSettings));
        userServiceSpy.updateProfile.and.returnValue(of(mockUser));
        userServiceSpy.updateSettings.and.returnValue(of({ message: 'Settings saved' }));
        userServiceSpy.uploadAvatar.and.returnValue(of({ avatarUrl: 'https://example.com/new.jpg' }));
        userServiceSpy.exportData.and.returnValue(of(new Blob(['col1,col2'], { type: 'text/csv' })));
        userServiceSpy.logoutAll.and.returnValue(of({ message: 'Logged out all' }));

        themeServiceSpy = jasmine.createSpyObj(
            'ThemeService',
            ['toggle', 'setAccent', 'setCustomAccent', 'effectiveAccent'],
            {
                theme: signal<'dark' | 'light'>('light'),
                accentColor: signal<AccentColor>('rose'),
                customHex: signal<string>('#8B5CF6'),
            },
        );
        themeServiceSpy.effectiveAccent.and.returnValue('rose');

        toastServiceSpy = jasmine.createSpyObj('ToastService', ['show', 'error']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        routerSpy.navigate.and.returnValue(Promise.resolve(true));

        await TestBed.configureTestingModule({
            imports: [SettingsComponent, NoopAnimationsModule],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: UserService, useValue: userServiceSpy },
                { provide: ThemeService, useValue: themeServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the SettingsComponent and load initial profile and settings', () => {
        expect(component).toBeTruthy();
        expect(component.profileForm.get('firstName')?.value).toBe('Alex');
        expect(component.profileForm.get('lastName')?.value).toBe('Morgan');
        expect(component.profileForm.get('email')?.value).toBe('alex.morgan@fintrack.app');
        expect(component.preferencesForm.get('currency')?.value).toBe('USD');
        expect(component.preferencesForm.get('timeZone')?.value).toBe('America/New_York');
    });

    it('should compute displayName, initials, and avatarUrl correctly', () => {
        expect(component.displayName).toBe('Alex Morgan');
        expect(component.initials).toBe('AM');
        expect(component.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should switch active tabs smoothly', () => {
        const tabs: SettingsTabId[] = ['profile', 'security', 'preferences', 'appearance', 'notifications', 'data', 'danger'];
        for (const tab of tabs) {
            component.setTab(tab);
            expect(component.activeTab()).toBe(tab);
        }
    });

    it('should provide 11 curated preset brand accent colors', () => {
        expect(component.accentColors.length).toBe(11);
        const labels = component.accentColors.map((a) => a.label);
        expect(labels).toContain('Indigo');
        expect(labels).toContain('Purple');
        expect(labels).toContain('Fuchsia');
        expect(labels).toContain('Sky');
        expect(labels).toContain('Lime');
        expect(labels).toContain('Coral');
    });

    it('should support selecting quick custom colors and applying hex input', () => {
        component.selectQuickCustom('#EC4899');
        expect(component.customHexInput()).toBe('#EC4899');
        expect(themeServiceSpy.setCustomAccent).toHaveBeenCalledWith('#EC4899');

        component.onCustomHexInputChange('06B6D4');
        expect(themeServiceSpy.setCustomAccent).toHaveBeenCalledWith('06B6D4');
    });

    it('should save profile changes when form is valid', () => {
        component.profileForm.patchValue({
            firstName: 'Alexander',
            lastName: 'Morgan-Smith',
        });

        component.saveProfile();

        expect(userServiceSpy.updateProfile).toHaveBeenCalledWith({
            firstName: 'Alexander',
            lastName: 'Morgan-Smith',
        });
        expect(toastServiceSpy.show).toHaveBeenCalledWith(jasmine.stringMatching(/saved/i), 'success');
    });

    it('should evaluate password policy in real time', () => {
        component.passwordForm.patchValue({
            newPassword: 'Weak',
        });
        expect(component.passwordEvaluation().isValid).toBeFalse();
        expect(component.passwordEvaluation().strengthLevel).toBe('low');

        // Strong password matching criteria: 8-24 chars, lower, upper, digit, special
        component.passwordForm.patchValue({
            newPassword: 'SuperP@ssword2026',
        });
        expect(component.passwordEvaluation().isValid).toBeTrue();
        expect(component.passwordEvaluation().strengthTag).toBe('HIGH');
    });

    it('should change password successfully when matching confirmation is provided', async () => {
        component.passwordForm.patchValue({
            currentPassword: 'OldP@ssword123',
            newPassword: 'NewP@ssword2026!',
            confirmPassword: 'NewP@ssword2026!',
        });

        await component.changePassword();

        expect(authServiceSpy.changePassword).toHaveBeenCalledWith('OldP@ssword123', 'NewP@ssword2026!');
        expect(toastServiceSpy.show).toHaveBeenCalledWith(jasmine.stringMatching(/updated/i), 'success');
    });

    it('should reject password change when confirm password mismatches', async () => {
        component.passwordForm.patchValue({
            currentPassword: 'OldP@ssword123',
            newPassword: 'NewP@ssword2026!',
            confirmPassword: 'DifferentP@ssword999!',
        });

        await component.changePassword();

        expect(authServiceSpy.changePassword).not.toHaveBeenCalled();
        expect(toastServiceSpy.error).toHaveBeenCalledWith('Passwords do not match');
    });

    it('should save application preferences and update settings', () => {
        component.preferencesForm.patchValue({
            currency: 'BDT',
            timeZone: 'Asia/Dhaka',
            dateFormat: 'dd MMMM, yyyy',
            defaultPageSize: 25,
        });

        component.savePreferences();

        expect(userServiceSpy.updateSettings).toHaveBeenCalledWith(
            jasmine.objectContaining({
                currency: 'BDT',
                timeZone: 'Asia/Dhaka',
                dateFormat: 'dd MMMM, yyyy',
                defaultPageSize: 25,
            }),
        );
        expect(toastServiceSpy.show).toHaveBeenCalledWith(jasmine.stringMatching(/Preferences/i), 'success');
    });

    it('should trigger CSV data export', () => {
        component.exportData();

        expect(userServiceSpy.exportData).toHaveBeenCalled();
        expect(toastServiceSpy.show).toHaveBeenCalledWith(jasmine.stringMatching(/CSV/i), 'success');
    });

    it('should support clipboard copy with visual feedback', async () => {
        spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

        await component.copyToClipboard('user-123-abc-456', 'uid');
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('user-123-abc-456');
        expect(component.copiedUid()).toBeTrue();

        await component.copyToClipboard('alex@example.com', 'email');
        expect(component.copiedEmail()).toBeTrue();
    });

    it('should terminate all active sessions and redirect to login', async () => {
        await component.logoutAllSessions();

        expect(userServiceSpy.logoutAll).toHaveBeenCalled();
        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
});
