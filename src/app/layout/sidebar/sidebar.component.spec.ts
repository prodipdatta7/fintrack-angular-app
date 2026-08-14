import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Account } from '../../core/models/account.model';
import { Category, CategoryType } from '../../core/models/category.model';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let accounts: ReturnType<typeof signal<Account[]>>;
    let categories: ReturnType<typeof signal<Category[]>>;
    let totalCount: ReturnType<typeof signal<number>>;

    const category = (id: string): Category => ({
        id,
        name: `Category ${id}`,
        icon: 'label',
        color: '#6366f1',
        type: CategoryType.Expense,
        budgetLimit: 0,
        userId: 'u-1',
    });

    const account = (id: string, isClosed = false): Account => ({
        id,
        name: `Account ${id}`,
        accountType: 'Bank',
        balance: 100,
        currency: 'USD',
        icon: '🏦',
        provider: '',
        color: '#6366f1',
        isClosed,
        createdAt: '2026-01-10T00:00:00Z',
    });

    beforeEach(async () => {
        accounts = signal<Account[]>([]);
        categories = signal<Category[]>([]);
        totalCount = signal(0);

        authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
            currentUser: signal({ id: 'u-1', email: 'alex.morgan@fintrack.io' }),
            avatarSrc: signal(null),
            isAdmin: signal(false),
        });

        await TestBed.configureTestingModule({
            imports: [SidebarComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: AccountService, useValue: { accounts } },
                { provide: CategoryService, useValue: { categories } },
                { provide: TransactionService, useValue: { totalCount } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should render the five primary navigation links when not admin', () => {
        const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-item')) as HTMLElement[];
        expect(links.length).toBe(5);
        const labels = links.map((link) => link.querySelector('span:not(.material-icons)')?.textContent?.trim());
        expect(labels).toEqual(['Dashboard', 'Accounts', 'Transactions', 'Categories', 'Savings Plans']);
    });

    it('should render the Admin Studio link when user is admin', () => {
        (authServiceSpy.isAdmin as unknown as ReturnType<typeof signal<boolean>>).set(true);
        fixture.detectChanges();

        const links = Array.from(fixture.nativeElement.querySelectorAll('.nav-item')) as HTMLElement[];
        expect(links.length).toBe(6);
        const labels = links.map((link) => link.querySelector('span:not(.material-icons)')?.textContent?.trim());
        expect(labels).toContain('Admin Studio');
    });

    it('should hide count badges while the counts are zero', () => {
        expect(fixture.nativeElement.querySelectorAll('.nav-badge').length).toBe(0);
    });

    it('should render count badges from the service signals', () => {
        totalCount.set(42);
        categories.set([category('c-1'), category('c-2')]);
        accounts.set([account('a-1'), account('a-2'), account('a-3')]);
        fixture.detectChanges();

        const badges = Array.from(fixture.nativeElement.querySelectorAll('.nav-badge')) as HTMLElement[];
        expect(badges.map((b) => b.textContent?.trim())).toEqual(['3', '42', '2']);
    });

    it('should exclude closed accounts from the accounts badge', () => {
        accounts.set([account('a-1'), account('a-2', true)]);
        fixture.detectChanges();

        const badges = Array.from(fixture.nativeElement.querySelectorAll('.nav-badge')) as HTMLElement[];
        expect(badges.map((b) => b.textContent?.trim())).toEqual(['1']);
    });

    it('should derive initials from the current user email', () => {
        expect(component.initials).toBe('AM');
    });

    it('should log out and navigate to login', async () => {
        authServiceSpy.logout.and.resolveTo();
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.logout();
        expect(authServiceSpy.logout).toHaveBeenCalled();

        await Promise.resolve();
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
});
