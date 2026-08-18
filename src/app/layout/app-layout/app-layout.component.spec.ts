import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, Routes, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppLayoutComponent } from './app-layout.component';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { of } from 'rxjs';

@Component({ selector: 'app-route-stub', standalone: true, template: '' })
class RouteStubComponent {}

const userServiceStub = {
    getSettings: () => of({ currency: 'BDT' }),
    currencyCode: () => 'BDT',
    settings: signal(null),
};

const testRoutes: Routes = [
    { path: 'dashboard', component: RouteStubComponent, data: { title: 'Financial Overview' } },
    { path: 'transactions/new', component: RouteStubComponent, data: { title: 'Record Transaction' } },
    { path: 'plans', component: RouteStubComponent, data: { title: 'Savings Goals & Planning' } },
    { path: 'untitled', component: RouteStubComponent },
];

describe('AppLayoutComponent', () => {
    let component: AppLayoutComponent;
    let fixture: ComponentFixture<AppLayoutComponent>;
    let router: Router;
    let themeServiceSpy: { theme: ReturnType<typeof signal<Theme>>; toggle: jasmine.Spy };

    beforeEach(async () => {
        themeServiceSpy = {
            theme: signal<Theme>('dark'),
            toggle: jasmine.createSpy('toggle'),
        };

        await TestBed.configureTestingModule({
            imports: [AppLayoutComponent],
            providers: [
                provideRouter(testRoutes),
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: signal(null),
                        avatarSrc: signal(null),
                        isAdmin: signal(false),
                        logout: jasmine.createSpy('logout'),
                    },
                },
                { provide: ThemeService, useValue: themeServiceSpy },
                { provide: AccountService, useValue: { accounts: signal([]) } },
                { provide: CategoryService, useValue: { categories: signal([]) } },
                {
                    provide: TransactionService,
                    useValue: { totalCount: signal(0), refreshTotalCount: () => of(0) },
                },
                { provide: UserService, useValue: userServiceStub },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(AppLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should resolve the page title from the activated route data', async () => {
        await router.navigate(['/dashboard']);
        fixture.detectChanges();
        expect(component.pageTitle()).toBe('Financial Overview');

        await router.navigate(['/plans']);
        fixture.detectChanges();
        expect(component.pageTitle()).toBe('Savings Goals & Planning');
    });

    it('should fall back to the app name when a route declares no title', async () => {
        await router.navigate(['/untitled']);
        fixture.detectChanges();
        expect(component.pageTitle()).toBe('FinTrack');
    });

    it('should update the resolved title after navigation', async () => {
        await router.navigate(['/dashboard']);
        fixture.detectChanges();
        expect(component.pageTitle()).toBe('Financial Overview');

        await router.navigate(['/untitled']);
        fixture.detectChanges();
        expect(component.pageTitle()).toBe('FinTrack');
    });

    it('should not throw when a child route exists before its snapshot is assigned', () => {
        // Reproduces construction during router activation: the child ActivatedRoute
        // is in the tree, but `snapshot` is not populated yet.
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [AppLayoutComponent],
            providers: [
                provideRouter(testRoutes),
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { data: {} }, firstChild: { snapshot: undefined, firstChild: null } },
                },
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: signal(null),
                        avatarSrc: signal(null),
                        isAdmin: signal(false),
                        logout: jasmine.createSpy('logout'),
                    },
                },
                { provide: ThemeService, useValue: themeServiceSpy },
                { provide: AccountService, useValue: { accounts: signal([]) } },
                { provide: CategoryService, useValue: { categories: signal([]) } },
                {
                    provide: TransactionService,
                    useValue: { totalCount: signal(0), refreshTotalCount: () => of(0) },
                },
                { provide: UserService, useValue: userServiceStub },
            ],
        });

        const partial = TestBed.createComponent(AppLayoutComponent);
        expect(partial.componentInstance.pageTitle()).toBe('FinTrack');
    });

    it('should toggle and close mobile drawer', () => {
        expect(component.mobileDrawerOpen()).toBeFalse();

        component.toggleMobileDrawer();
        expect(component.mobileDrawerOpen()).toBeTrue();

        component.closeMobileDrawer();
        expect(component.mobileDrawerOpen()).toBeFalse();
    });

    it('should close mobile drawer when router navigation completes', async () => {
        component.toggleMobileDrawer();
        expect(component.mobileDrawerOpen()).toBeTrue();

        await router.navigate(['/dashboard']);
        fixture.detectChanges();
        expect(component.mobileDrawerOpen()).toBeFalse();
    });

    it('should navigate to the transaction editor from the header action', () => {
        const navigateSpy = spyOn(router, 'navigate');
        component.newTransaction();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/new']);
    });
});
