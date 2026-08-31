import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MobileTopExpensesComponent } from './mobile-top-expenses.component';
import { Transaction } from '../../../../../core/models/transaction.model';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { Account } from '../../../../../core/models/account.model';
import { CurrencyStore } from '../../../../../core/services/currency.store';

const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Food', type: CategoryType.Expense, color: '#f59e0b', icon: '🍔', budgetLimit: 1000, userId: 'u1' },
    { id: 'cat-2', name: 'Transport', type: CategoryType.Expense, color: '#3b82f6', icon: '🚗', budgetLimit: 500, userId: 'u1' },
    { id: 'cat-3', name: 'Income', type: CategoryType.Income, color: '#10b981', icon: '💰', budgetLimit: 0, userId: 'u1' },
];

const mockAccounts: Account[] = [
    {
        id: 'acc-1',
        name: 'Checking Account',
        accountType: 'Bank',
        balance: 5000,
        currency: 'BDT',
        icon: '💳',
        provider: 'BRAC Bank',
        color: '#6366f1',
        isClosed: false,
        createdAt: '2026-01-01',
    },
];

const mockTransactions: Transaction[] = [
    {
        id: 'tx-1',
        title: 'Supermarket',
        amount: 250,
        type: CategoryType.Expense,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        timeZoneOffsetInMinutes: 0,
        userId: 'u1',
    },
    {
        id: 'tx-2',
        title: 'Gas Refill',
        amount: 80,
        type: CategoryType.Expense,
        categoryId: 'cat-2',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        timeZoneOffsetInMinutes: 0,
        userId: 'u1',
    },
    {
        id: 'tx-3',
        title: 'Salary Deposit',
        amount: 3000,
        type: CategoryType.Income,
        categoryId: 'cat-3',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        timeZoneOffsetInMinutes: 0,
        userId: 'u1',
    },
    {
        id: 'tx-4',
        title: 'Fine Dining',
        amount: 450,
        type: CategoryType.Expense,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: new Date().toISOString(),
        timeZoneOffsetInMinutes: 0,
        userId: 'u1',
    },
];

describe('MobileTopExpensesComponent', () => {
    let component: MobileTopExpensesComponent;
    let fixture: ComponentFixture<MobileTopExpensesComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MobileTopExpensesComponent],
            providers: [provideRouter([]), CurrencyStore],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        fixture = TestBed.createComponent(MobileTopExpensesComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('transactions', mockTransactions);
        fixture.componentRef.setInput('categories', mockCategories);
        fixture.componentRef.setInput('accounts', mockAccounts);
        fixture.componentRef.setInput('activeTimeframe', 'This Month');
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should filter only expense transactions and sort by amount descending', () => {
        const topExpenses = component.topExpenses();
        // tx-3 (Salary) should be excluded
        expect(topExpenses.length).toBe(3);
        // Order: Fine Dining (450), Supermarket (250), Gas Refill (80)
        expect(topExpenses[0].transaction.title).toBe('Fine Dining');
        expect(topExpenses[0].transaction.amount).toBe(450);
        expect(topExpenses[1].transaction.title).toBe('Supermarket');
        expect(topExpenses[2].transaction.title).toBe('Gas Refill');
    });

    it('should navigate to transaction details on row click', () => {
        const row = fixture.nativeElement.querySelector('.expense-row-card') as HTMLElement;
        expect(row).toBeTruthy();
        row.click();

        expect(router.navigate).toHaveBeenCalledWith(['/transactions/details', 'tx-4']);
    });

    it('should display empty state when no expense transactions exist', () => {
        fixture.componentRef.setInput('transactions', [mockTransactions[2]]); // only income
        fixture.detectChanges();

        expect(component.hasExpenses()).toBeFalse();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });
});
