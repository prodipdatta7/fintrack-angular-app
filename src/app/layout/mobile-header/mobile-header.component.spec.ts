import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MobileHeaderComponent } from './mobile-header.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, Theme } from '../../core/services/theme.service';

describe('MobileHeaderComponent', () => {
    let component: MobileHeaderComponent;
    let fixture: ComponentFixture<MobileHeaderComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let themeServiceSpy: { theme: ReturnType<typeof signal<Theme>>; toggle: jasmine.Spy };

    beforeEach(async () => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
            currentUser: signal({ id: 'u-1', email: 'jordan.lee@fintrack.io' }),
            avatarSrc: signal(null),
            isAdmin: signal(false),
        });

        themeServiceSpy = {
            theme: signal<Theme>('dark'),
            toggle: jasmine.createSpy('toggle'),
        };

        await TestBed.configureTestingModule({
            imports: [MobileHeaderComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ThemeService, useValue: themeServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MobileHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should derive user initials correctly', () => {
        expect(component.initials).toBe('JL');
    });

    it('should emit menuClick when hamburger button is clicked', () => {
        const emitSpy = spyOn(component.menuClick, 'emit');
        const menuBtn = fixture.nativeElement.querySelector('.menu-btn') as HTMLButtonElement;
        expect(menuBtn).toBeTruthy();

        menuBtn.click();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('should toggle theme when theme button is clicked', () => {
        const themeBtn = fixture.nativeElement.querySelector('.theme-btn') as HTMLButtonElement;
        expect(themeBtn).toBeTruthy();

        themeBtn.click();
        expect(themeServiceSpy.toggle).toHaveBeenCalled();
    });
});
