import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecentActivityComponent } from './recent-activity.component';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { Transaction } from '../../../../../core/models/transaction.model';
import { Account } from '../../../../../core/models/account.model';

const transaction = (id: string, type: CategoryType, amount: number): Transaction => ({
    id,
    title: `Transaction ${id}`,
    amount,
    type,
    categoryId: 'cat-1',
    accountId: 'acc-1',
    date: '2026-08-04T00:00:00Z',
    timeZoneOffsetInMinutes: 0,
    userId: 'u-1',
});

const categories: Category[] = [
    {
        id: 'cat-1',
        name: 'Groceries & Dining',
        icon: '🍔',
        color: '#10b981',
        type: CategoryType.Expense,
        budgetLimit: 850,
        userId: 'u-1',
    },
];

const accounts: Account[] = [
    {
        id: 'acc-1',
        name: 'bKash Wallet',
        accountType: 'MFS',
        balance: 1450,
        currency: 'USD',
        icon: '📱',
        provider: 'bKash Direct',
        color: '#e11d48',
        isClosed: false,
        createdAt: '2026-03-22T00:00:00Z',
    },
];

describe('RecentActivityComponent', () => {
    let fixture: ComponentFixture<RecentActivityComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecentActivityComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(RecentActivityComponent);
        fixture.componentRef.setInput('transactions', [
            transaction('tx-1', CategoryType.Expense, 184.5),
            transaction('tx-2', CategoryType.Income, 6200),
        ]);
        fixture.componentRef.setInput('categories', categories);
        fixture.componentRef.setInput('accounts', accounts);
        fixture.detectChanges();
    });

    it('should render a row per transaction with category and account chips', () => {
        const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
        expect(rows.length).toBe(2);
        expect(rows[0].querySelector('.chip')?.textContent).toContain('Groceries & Dining');
        expect(rows[0].querySelector('.chip-mono')?.textContent).toContain('bKash Wallet');
    });

    it('should sign amounts by transaction type', () => {
        const cells = Array.from(fixture.nativeElement.querySelectorAll('tbody tr td:last-child')) as HTMLElement[];
        expect(cells[0].textContent?.trim()).toMatch(/^-.*184\.50$/);
        expect(cells[1].textContent?.trim()).toMatch(/^\+.*6,200\.00$/);
        expect(cells[0].textContent).not.toContain('$');
    });

    it('should fall back gracefully for unknown category and account ids', () => {
        fixture.componentRef.setInput('categories', []);
        fixture.componentRef.setInput('accounts', []);
        fixture.detectChanges();

        const firstRow = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
        expect(firstRow.querySelector('.chip')?.textContent).toContain('Uncategorized');
        expect(firstRow.querySelector('.chip-mono')?.textContent).toContain('Account');
    });

    it('should open the transaction detail page on row click', () => {
        const navigateSpy = spyOn(router, 'navigate');
        (fixture.nativeElement.querySelector('tbody tr') as HTMLElement).click();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/details', 'tx-1']);
    });

    it('should show an empty state without transactions', () => {
        fixture.componentRef.setInput('transactions', []);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('table')).toBeNull();
    });

    it('should emit timeframeChange when timeframe is selected', () => {
        let emitted: any = null;
        fixture.componentInstance.timeframeChange.subscribe((tf) => (emitted = tf));
        fixture.componentInstance.onTimeframeChange('7D');
        expect(emitted).toBe('7D');
    });

    it('should limit display to 5 items and show View More button when more exist', () => {
        const manyTxs = [
            transaction('tx-1', CategoryType.Expense, 100),
            transaction('tx-2', CategoryType.Expense, 200),
            transaction('tx-3', CategoryType.Expense, 300),
            transaction('tx-4', CategoryType.Expense, 400),
            transaction('tx-5', CategoryType.Expense, 500),
            transaction('tx-6', CategoryType.Expense, 600),
            transaction('tx-7', CategoryType.Expense, 700),
        ];
        fixture.componentRef.setInput('transactions', manyTxs);
        fixture.detectChanges();

        expect(fixture.componentInstance.hasMore()).toBeTrue();
        expect(fixture.componentInstance.visibleRows().length).toBe(5);
        expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(5);

        const moreBtn = fixture.nativeElement.querySelector('.btn-recent-more') as HTMLElement;
        expect(moreBtn).toBeTruthy();
        expect(moreBtn.textContent).toContain('View More Transactions (+2)');
        expect(moreBtn.getAttribute('routerlink') || moreBtn.getAttribute('href')).toBeTruthy();
    });
});
