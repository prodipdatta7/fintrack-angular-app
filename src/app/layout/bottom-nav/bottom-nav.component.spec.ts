import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Account } from '../../core/models/account.model';
import { Category, CategoryType } from '../../core/models/category.model';

describe('BottomNavComponent', () => {
    let component: BottomNavComponent;
    let fixture: ComponentFixture<BottomNavComponent>;
    let accounts: ReturnType<typeof signal<Account[]>>;
    let categories: ReturnType<typeof signal<Category[]>>;
    let totalCount: ReturnType<typeof signal<number>>;

    const mockCategory = (id: string): Category => ({
        id,
        name: `Cat ${id}`,
        icon: 'label',
        color: '#6366f1',
        type: CategoryType.Expense,
        budgetLimit: 0,
        userId: 'u-1',
    });

    const mockAccount = (id: string, isClosed = false): Account => ({
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

        await TestBed.configureTestingModule({
            imports: [BottomNavComponent],
            providers: [
                provideRouter([]),
                { provide: AccountService, useValue: { accounts } },
                { provide: CategoryService, useValue: { categories } },
                { provide: TransactionService, useValue: { totalCount } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BottomNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display navigation links and the center record FAB', () => {
        const items = fixture.nativeElement.querySelectorAll('.bottom-nav-item');
        expect(items.length).toBe(4);

        const fab = fixture.nativeElement.querySelector('.bottom-nav-fab');
        expect(fab).toBeTruthy();
        expect(fab.getAttribute('href')).toBe('/transactions/new');
    });

    it('should display badge numbers when counts are greater than 0', () => {
        accounts.set([mockAccount('a-1'), mockAccount('a-2')]);
        categories.set([mockCategory('c-1')]);
        totalCount.set(15);
        fixture.detectChanges();

        const badges = Array.from(fixture.nativeElement.querySelectorAll('.bottom-nav-badge')) as HTMLElement[];
        expect(badges.map((b) => b.textContent?.trim())).toEqual(['2', '15', '1']);
    });
});
