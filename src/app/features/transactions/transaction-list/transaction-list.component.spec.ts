import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';

const transaction: Transaction = {
    id: 'tx-1',
    title: 'Apple Store - M3 Pro Upgrade',
    amount: 549,
    type: CategoryType.Expense,
    categoryId: 'cat-3',
    accountId: 'acc-1',
    date: '2026-08-06T00:00:00Z',
    note: 'Purchased accessories & trade-in balance.',
    timeZoneOffsetInMinutes: 0,
    userId: 'u-1',
};

const emptyPage = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

import { provideNativeDateAdapter } from '@angular/material/core';

describe('TransactionListComponent', () => {
    let component: TransactionListComponent;
    let fixture: ComponentFixture<TransactionListComponent>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let confirmSpy: jasmine.SpyObj<ConfirmDialogService>;
    let toastService: ToastService;

    /** Filters passed to the last getTransactions() call. */
    const lastCall = () => transactionServiceSpy.getTransactions.calls.mostRecent().args;

    beforeEach(async () => {
        transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactions', 'deleteTransaction'], {
            transactions: signal([transaction]),
            totalCount: signal(1),
            listTotalCount: signal(1),
            isLoading: signal(false),
        });
        transactionServiceSpy.getTransactions.and.returnValue(of({ ...emptyPage, items: [transaction] }));
        transactionServiceSpy.deleteTransaction.and.returnValue(of(void 0));

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal([
                {
                    id: 'cat-3',
                    name: 'Tech & Gadgets',
                    icon: '💻',
                    color: '#3b82f6',
                    type: CategoryType.Expense,
                    budgetLimit: 600,
                    userId: 'u-1',
                },
            ]),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts'], {
            accounts: signal([
                {
                    id: 'acc-1',
                    name: 'Bank Account',
                    accountType: 'Bank',
                    balance: 5420,
                    currency: 'USD',
                    icon: '🏦',
                    provider: 'City Bank',
                    color: '#6366f1',
                    isClosed: false,
                    createdAt: '2026-01-10T00:00:00Z',
                },
            ]),
        });
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        confirmSpy = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete', 'open']);
        confirmSpy.confirmDelete.and.returnValue(of(true));

        await TestBed.configureTestingModule({
            imports: [TransactionListComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                provideNativeDateAdapter(),
                ToastService,
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: ConfirmDialogService, useValue: confirmSpy },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(TransactionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should load transactions, categories and accounts on init', () => {
        expect(transactionServiceSpy.getTransactions).toHaveBeenCalled();
        expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    it('should render the account source column', () => {
        const chip = fixture.nativeElement.querySelector('.chip-mono') as HTMLElement;
        expect(chip.textContent).toContain('Bank Account');
    });

    it('should render the note under the title', () => {
        expect(fixture.nativeElement.querySelector('.tx-note').textContent.trim()).toBe(
            'Purchased accessories & trade-in balance.',
        );
    });

    it('should start with no active filters', () => {
        expect(component.activeFiltersCount()).toBe(0);
        expect(fixture.nativeElement.querySelector('.filter-clear')).toBeNull();
    });

    it('should count every non-default filter', () => {
        component.selectedCategoryId.set('cat-3');
        component.selectedAccountId.set('acc-1');
        component.typeFilter.set(CategoryType.Expense);
        component.startDate.set('2026-08-01');
        fixture.detectChanges();

        expect(component.activeFiltersCount()).toBe(4);
        expect(fixture.nativeElement.querySelector('.filter-clear').textContent.trim()).toBe('Clear Filters (4)');
    });

    it('should count a non-default sort as an active filter', () => {
        component.sortBy.set('amount-desc');
        expect(component.activeFiltersCount()).toBe(1);
    });

    it('should not query API for draft filters until applyFilters is called', () => {
        transactionServiceSpy.getTransactions.calls.reset();
        component.onFiltersOpenChange(true);
        component.draftCategoryId.set('cat-3');
        component.draftMinAmount.set('100');
        fixture.detectChanges();

        expect(transactionServiceSpy.getTransactions).not.toHaveBeenCalled();

        component.applyFilters();
        expect(transactionServiceSpy.getTransactions).toHaveBeenCalledTimes(1);
    });

    it('should send every filter to the API and reset to page 1', () => {
        component.draftCategoryId.set('cat-3');
        component.draftAccountId.set('acc-1');
        component.draftTypeFilter.set(CategoryType.Expense);
        component.draftStartDate.set('2026-08-01');
        component.draftEndDate.set('2026-08-31');
        component.draftMinAmount.set('10');
        component.draftMaxAmount.set('900');
        component.draftSortBy.set('amount-desc');
        component.applyFilters();

        const [page, pageSize, categoryId, type, search, filters] = lastCall();
        expect(page).toBe(1);
        expect(pageSize).toBe(10);
        expect(categoryId).toBe('cat-3');
        expect(type).toBe(CategoryType.Expense);
        expect(search).toBeUndefined();
        expect(filters).toEqual({
            accountId: 'acc-1',
            fromDate: '2026-08-01',
            toDate: '2026-08-31',
            minAmount: 10,
            maxAmount: 900,
            sortBy: 'amount-desc',
        });
    });

    it('should debounce the search before querying', fakeAsync(() => {
        transactionServiceSpy.getTransactions.calls.reset();

        component.onSearchTextChange('app');
        component.onSearchTextChange('apple');
        tick(299);
        expect(transactionServiceSpy.getTransactions).not.toHaveBeenCalled();

        tick(1);
        expect(transactionServiceSpy.getTransactions).toHaveBeenCalledTimes(1);
        expect(lastCall()[4]).toBe('apple');
    }));

    it('should clear every filter including the search', () => {
        component.searchText.set('apple');
        component.selectedCategoryId.set('cat-3');
        component.sortBy.set('title-asc');

        component.resetAllFilters();

        expect(component.activeFiltersCount()).toBe(0);
        expect(component.searchText()).toBe('');
        expect(lastCall()[4]).toBeUndefined();
        expect(lastCall()[5].sortBy).toBe('date-desc');
    });

    it('should page through results server-side', () => {
        component.onPageChange({ pageIndex: 2, pageSize: 25 });
        expect(lastCall()[0]).toBe(3);
        expect(lastCall()[1]).toBe(25);
    });

    it('should delete behind the confirm dialog and report via toast', () => {
        component.deleteTransaction(transaction);

        expect(confirmSpy.confirmDelete).toHaveBeenCalled();
        expect(transactionServiceSpy.deleteTransaction).toHaveBeenCalledWith('tx-1');
        expect(toastService.toasts()[0].message).toBe('Transaction removed');
    });

    it('should not delete when the dialog is dismissed', () => {
        confirmSpy.confirmDelete.and.returnValue(of(false));
        component.deleteTransaction(transaction);
        expect(transactionServiceSpy.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should open the audit drawer for a row', () => {
        component.openHistoryDrawer('tx-99');
        expect(component.historyTransactionId).toBe('tx-99');
        expect(component.showHistoryDrawer).toBeTrue();
    });

    it('should open the detail page on row click', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        (fixture.nativeElement.querySelector('tbody tr') as HTMLElement).click();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/details', 'tx-1']);
    });

    it('should open the detail page on mobile card click', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        (fixture.nativeElement.querySelector('.tx-mobile-card') as HTMLElement).click();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/details', 'tx-1']);
    });

    it('should update dates and load transactions when timeframe changes', () => {
        transactionServiceSpy.getTransactions.calls.reset();
        component.onTimeframeChange('7D');
        expect(component.timeframe()).toBe('7D');
        expect(component.startDate()).toBeTruthy();
        expect(component.endDate()).toBeTruthy();
        expect(transactionServiceSpy.getTransactions).toHaveBeenCalled();
    });

    it('should clear dates when timeframe is set to All', () => {
        component.onTimeframeChange('7D');
        expect(component.startDate()).toBeTruthy();

        component.onTimeframeChange('All');
        expect(component.timeframe()).toBe('All');
        expect(component.startDate()).toBe('');
        expect(component.endDate()).toBe('');
    });

    it('should handle custom range selection', () => {
        component.onCustomRangeChange({ from: '2026-08-01', to: '2026-08-15' });
        expect(component.timeframe()).toBe('Custom');
        expect(component.startDate()).toBe('2026-08-01');
        expect(component.endDate()).toBe('2026-08-15');
    });
});
