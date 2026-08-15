import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AccountDetailComponent } from './account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Account } from '../../../core/models/account.model';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';

const account: Account = {
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
};

const transaction: Transaction = {
    id: 'tx-1',
    title: 'Whole Foods Market',
    amount: 184.5,
    type: CategoryType.Expense,
    categoryId: 'cat-2',
    accountId: 'acc-1',
    date: '2026-08-04T00:00:00Z',
    note: 'Weekly groceries',
    timeZoneOffsetInMinutes: 0,
    userId: 'u-1',
};

const paged = (items: Transaction[]) => ({
    items,
    totalCount: items.length,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
});

describe('AccountDetailComponent', () => {
    let fixture: ComponentFixture<AccountDetailComponent>;
    let component: AccountDetailComponent;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
    let confirmSpy: jasmine.SpyObj<ConfirmDialogService>;
    let toastService: ToastService;

    beforeEach(async () => {
        accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccountById', 'updateBalance']);
        accountServiceSpy.getAccountById.and.returnValue(of(account));
        accountServiceSpy.updateBalance.and.returnValue(of(void 0));

        transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['queryTransactions', 'deleteTransaction']);
        transactionServiceSpy.queryTransactions.and.returnValue(of(paged([transaction])));
        transactionServiceSpy.deleteTransaction.and.returnValue(of(void 0));

        dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSummary', 'getCashflow']);
        dashboardServiceSpy.getSummary.and.returnValue(
            of({
                totalIncome: 6200,
                totalExpense: 1734.5,
                netSavings: 4465.5,
                categorySpent: [
                    { categoryId: 'cat-2', spent: 184.5 },
                ],
                recentTransactions: [],
                transactionCount: 4,
            }),
        );
        dashboardServiceSpy.getCashflow.and.returnValue(of([{ label: 'Aug', income: 6200, expense: 1734.5 }]));

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal([
                {
                    id: 'cat-2',
                    name: 'Groceries & Dining',
                    icon: '🍔',
                    color: '#10b981',
                    type: CategoryType.Expense,
                    budgetLimit: 850,
                    userId: 'u-1',
                },
            ]),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        confirmSpy = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete', 'open']);
        confirmSpy.confirmDelete.and.returnValue(of(true));

        await TestBed.configureTestingModule({
            imports: [AccountDetailComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: DashboardService, useValue: dashboardServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: ConfirmDialogService, useValue: confirmSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { paramMap: of(convertToParamMap({ id: 'acc-1' })) },
                },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(AccountDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should load the account named in the route', () => {
        expect(accountServiceSpy.getAccountById).toHaveBeenCalledWith('acc-1');
        expect(fixture.nativeElement.querySelector('.account-title').textContent.trim()).toBe('bKash Wallet');
    });

    it('should take the stat tiles from the aggregate endpoint, not the ledger page', () => {
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith({ accountId: 'acc-1' });
        expect(component.totalInflow()).toBe(6200);
        expect(component.totalOutflow()).toBe(1734.5);
        expect(component.netMovement()).toBe(4465.5);
        expect(component.ledgerCount()).toBe(4);
    });

    it('should load burn allocation with default This Month timeframe and render after hero section', () => {
        expect(component.burnTimeframe()).toBe('This Month');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
            jasmine.objectContaining({
                accountId: 'acc-1',
                timeframe: 'This Month',
            }),
        );
        expect(component.burnCategorySpent().length).toBe(1);
        expect(component.burnTotalExpense()).toBe(1734.5);

        // Verify that app-expense-allocation is in the template
        const expenseAllocEl = fixture.nativeElement.querySelector('app-expense-allocation');
        expect(expenseAllocEl).toBeTruthy();
    });

    it('should refetch burn allocation when burn timeframe changes', () => {
        dashboardServiceSpy.getSummary.calls.reset();
        component.onBurnTimeframeChange('7D');

        expect(component.burnTimeframe()).toBe('7D');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
            jasmine.objectContaining({
                accountId: 'acc-1',
                timeframe: '7D',
            }),
        );
    });

    it('should request only this account cashflow with the account chart defaults', () => {
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('This Month', { accountId: 'acc-1' });
    });

    it('should query the ledger scoped to the account without touching shared list state', () => {
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledWith(
            1,
            25,
            undefined,
            undefined,
            undefined,
            jasmine.objectContaining({
                accountId: 'acc-1',
                fromDate: jasmine.any(String),
                toDate: jasmine.any(String),
            }),
        );
        expect(fixture.nativeElement.querySelectorAll('.ledger tbody tr').length).toBe(1);
    });

    it('should filter ledger by timeframe when ledger timeframe changes', () => {
        transactionServiceSpy.queryTransactions.calls.reset();
        component.onLedgerTimeframeChange('7D');

        expect(component.ledgerTimeframe()).toBe('7D');
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledWith(
            1,
            25,
            undefined,
            undefined,
            undefined,
            jasmine.objectContaining({
                accountId: 'acc-1',
                fromDate: jasmine.any(String),
                toDate: jasmine.any(String),
            }),
        );
    });

    it('should debounce the search and send it to the API', fakeAsync(() => {
        transactionServiceSpy.queryTransactions.calls.reset();

        component.onSearchChange('who');
        component.onSearchChange('whole');
        tick(299);
        expect(transactionServiceSpy.queryTransactions).not.toHaveBeenCalled();

        tick(1);
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledTimes(1);
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledWith(
            1,
            25,
            undefined,
            undefined,
            'whole',
            jasmine.objectContaining({
                accountId: 'acc-1',
                fromDate: jasmine.any(String),
                toDate: jasmine.any(String),
            }),
        );
    }));

    it('should send the type filter to the API', () => {
        transactionServiceSpy.queryTransactions.calls.reset();
        component.onTypeChange(CategoryType.Income);

        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledWith(
            1,
            25,
            undefined,
            CategoryType.Income,
            undefined,
            jasmine.objectContaining({
                accountId: 'acc-1',
                fromDate: jasmine.any(String),
                toDate: jasmine.any(String),
            }),
        );
    });

    it('should refetch the chart when the timeframe changes', () => {
        component.onTimeframeChange('30D');
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('30D', { accountId: 'acc-1' });
    });

    it('should save an inline balance edit', () => {
        component.startEditBalance();
        component.draftBalance.set('1600');
        component.saveBalance();

        expect(accountServiceSpy.updateBalance).toHaveBeenCalledWith('acc-1', 1600);
        expect(component.account()?.balance).toBe(1600);
        expect(toastService.toasts()[0].message).toBe('Account balance adjusted');
    });

    it('should reject an invalid balance', () => {
        component.startEditBalance();
        component.draftBalance.set('abc');
        component.saveBalance();

        expect(accountServiceSpy.updateBalance).not.toHaveBeenCalled();
        expect(toastService.toasts()[0].type).toBe('error');
    });

    it('should delete a transaction behind the confirm dialog and refresh all sections', () => {
        dashboardServiceSpy.getSummary.calls.reset();
        transactionServiceSpy.queryTransactions.calls.reset();
        dashboardServiceSpy.getCashflow.calls.reset();

        component.deleteTransaction(transaction, new MouseEvent('click'));

        expect(confirmSpy.confirmDelete).toHaveBeenCalled();
        expect(transactionServiceSpy.deleteTransaction).toHaveBeenCalledWith('tx-1');
        expect(toastService.toasts()[0].message).toBe('Transaction removed');
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalled();
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalled();
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalled();
    });

    it('should not delete when the dialog is dismissed', () => {
        confirmSpy.confirmDelete.and.returnValue(of(false));
        component.deleteTransaction(transaction, new MouseEvent('click'));
        expect(transactionServiceSpy.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should navigate to the editor prefilled with this account', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.recordEntry();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/new'], { queryParams: { accountId: 'acc-1' } });
    });

    it('should show a not-found card for an unknown account', () => {
        accountServiceSpy.getAccountById.and.returnValue(throwError(() => new Error('404')));

        const second = TestBed.createComponent(AccountDetailComponent);
        second.detectChanges();

        expect(second.componentInstance.notFound()).toBeTrue();
        expect(second.nativeElement.querySelector('.account-missing')).toBeTruthy();
    });
});
