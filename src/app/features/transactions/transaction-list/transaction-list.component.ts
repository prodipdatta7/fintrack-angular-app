import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { TransactionService, TransactionSort } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FilterPopoverComponent } from '../../../shared/components/filter-popover/filter-popover.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { TimeframeSelectorComponent, CustomDateRange } from '../../../shared/components/timeframe-selector/timeframe-selector.component';
import { SignedCurrencyPipe } from '../../../shared/pipes/signed-currency.pipe';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { Timeframe } from '../../../core/models/dashboard.model';
import { timeframeToDateRange } from '../../../shared/utils/date-range';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';
import { Account } from '../../../core/models/account.model';

const DEFAULT_SORT: TransactionSort = 'date-desc';

@Component({
    selector: 'app-transaction-list',
    standalone: true,
    imports: [
        DatePipe,
        FormsModule,
        RouterLink,
        MatPaginatorModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatSelectModule,
        FilterPopoverComponent,
        DatePickerComponent,
        TimeframeSelectorComponent,
        SignedCurrencyPipe,
        TransactionHistoryDrawerComponent,
        AccountIconComponent,
    ],
    templateUrl: './transaction-list.component.html',
    styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent implements OnInit {
    readonly transactionService = inject(TransactionService);
    readonly categoryService = inject(CategoryService);
    readonly accountService = inject(AccountService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    getSelectedAccount(id: string | undefined): Account | undefined {
        if (!id) return undefined;
        return this.accountService.accounts().find((a) => a.id === id);
    }

    readonly timeframes = ['7D', '15D', '30D', 'This Month', '6M', 'This Year', 'All'] as Timeframe[];
    readonly timeframe = signal<Timeframe>('This Month');

    readonly CategoryType = CategoryType;

    showHistoryDrawer = false;
    historyTransactionId: string | null = null;
    filtersOpen = false;

    // Applied filter signals
    readonly searchText = signal('');
    readonly selectedCategoryId = signal<string | undefined>(undefined);
    readonly selectedAccountId = signal<string | undefined>(undefined);
    readonly typeFilter = signal<CategoryType | undefined>(undefined);
    readonly startDate = signal('');
    readonly endDate = signal('');
    readonly minAmount = signal('');
    readonly maxAmount = signal('');
    readonly sortBy = signal<TransactionSort>(DEFAULT_SORT);
    readonly rowsPerPage = signal(10);

    // Draft filter signals (bound inside popover until Apply is clicked)
    readonly draftCategoryId = signal<string | undefined>(undefined);
    readonly draftAccountId = signal<string | undefined>(undefined);
    readonly draftTypeFilter = signal<CategoryType | undefined>(undefined);
    readonly draftStartDate = signal('');
    readonly draftEndDate = signal('');
    readonly draftMinAmount = signal('');
    readonly draftMaxAmount = signal('');
    readonly draftSortBy = signal<TransactionSort>(DEFAULT_SORT);

    readonly sortOptions: { label: string; value: TransactionSort }[] = [
        { label: 'Date: Newest First', value: 'date-desc' },
        { label: 'Date: Oldest First', value: 'date-asc' },
        { label: 'Amount: High to Low', value: 'amount-desc' },
        { label: 'Amount: Low to High', value: 'amount-asc' },
        { label: 'Title: A - Z', value: 'title-asc' },
    ];

    /** Mirrors the design's filter badge: every non-default rule counts once. */
    readonly activeFiltersCount = computed(() => {
        let count = 0;
        if (this.selectedCategoryId()) count++;
        if (this.selectedAccountId()) count++;
        if (this.typeFilter() !== undefined) count++;
        if (this.startDate()) count++;
        if (this.endDate()) count++;
        if (this.minAmount()) count++;
        if (this.maxAmount()) count++;
        if (this.sortBy() !== DEFAULT_SORT) count++;
        return count;
    });

    readonly rows = computed(() => {
        const categoryById = new Map(this.categoryService.categories().map((category) => [category.id, category]));
        const accountById = new Map(this.accountService.accounts().map((account) => [account.id, account]));

        return this.transactionService.transactions().map((transaction) => ({
            transaction,
            category: categoryById.get(transaction.categoryId),
            account: accountById.get(transaction.accountId),
        }));
    });

    private readonly searchInput = new Subject<string>();

    constructor() {
        this.searchInput
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.searchText.set(value);
                this.loadTransactions(1);
            });
    }

    ngOnInit(): void {
        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.accountService
            .getAccounts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.loadTransactions(1);
    }

    onSearchTextChange(value: string): void {
        this.searchInput.next(value);
    }

    clearSearch(): void {
        this.searchText.set('');
        this.loadTransactions(1);
    }

    onTimeframeChange(tf: Timeframe): void {
        this.timeframe.set(tf);
        if (tf === 'All') {
            this.startDate.set('');
            this.endDate.set('');
        } else {
            const range = timeframeToDateRange(tf);
            this.startDate.set(range.from);
            this.endDate.set(range.to);
        }
        this.loadTransactions(1);
    }

    onCustomRangeChange(range: CustomDateRange): void {
        this.timeframe.set('Custom');
        this.startDate.set(range.from);
        this.endDate.set(range.to);
        this.loadTransactions(1);
    }

    onFiltersOpenChange(open: boolean): void {
        this.filtersOpen = open;
        if (open) {
            this.syncDraftsFromApplied();
        }
    }

    syncDraftsFromApplied(): void {
        this.draftCategoryId.set(this.selectedCategoryId());
        this.draftAccountId.set(this.selectedAccountId());
        this.draftTypeFilter.set(this.typeFilter());
        this.draftStartDate.set(this.startDate());
        this.draftEndDate.set(this.endDate());
        this.draftMinAmount.set(this.minAmount());
        this.draftMaxAmount.set(this.maxAmount());
        this.draftSortBy.set(this.sortBy());
    }

    applyFilters(): void {
        this.selectedCategoryId.set(this.draftCategoryId());
        this.selectedAccountId.set(this.draftAccountId());
        this.typeFilter.set(this.draftTypeFilter());
        this.startDate.set(this.draftStartDate());
        this.endDate.set(this.draftEndDate());
        this.minAmount.set(this.draftMinAmount());
        this.maxAmount.set(this.draftMaxAmount());
        this.sortBy.set(this.draftSortBy());
        this.loadTransactions(1);
    }

    resetAllFilters(): void {
        this.searchText.set('');
        this.draftCategoryId.set(undefined);
        this.draftAccountId.set(undefined);
        this.draftTypeFilter.set(undefined);
        this.draftStartDate.set('');
        this.draftEndDate.set('');
        this.draftMinAmount.set('');
        this.draftMaxAmount.set('');
        this.draftSortBy.set(DEFAULT_SORT);
        this.applyFilters();
    }

    onPageChange(event: { pageIndex: number; pageSize: number }): void {
        this.rowsPerPage.set(event.pageSize);
        this.loadTransactions(event.pageIndex + 1);
    }

    openHistoryDrawer(txId: string): void {
        this.historyTransactionId = txId;
        this.showHistoryDrawer = true;
    }

    openDetails(txId: string): void {
        this.router.navigate(['/transactions/details', txId]);
    }

    deleteTransaction(transaction: Transaction): void {
        this.confirmDialog
            .confirmDelete(
                `"${transaction.title}" will be removed. A TransactionDeleted event will be recorded.`,
                'Delete transaction',
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.transactionService
                    .deleteTransaction(transaction.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.toast.show('Transaction removed');
                            this.accountService.getAccounts().subscribe({ error: () => undefined });
                            this.loadTransactions(1);
                        },
                        error: () => this.toast.error('Could not delete the transaction'),
                    });
            });
    }

    private loadTransactions(page: number): void {
        this.transactionService
            .getTransactions(
                page,
                this.rowsPerPage(),
                this.selectedCategoryId(),
                this.typeFilter(),
                this.searchText() || undefined,
                {
                    accountId: this.selectedAccountId(),
                    fromDate: this.startDate() || undefined,
                    toDate: this.endDate() || undefined,
                    minAmount: this.minAmount() ? Number(this.minAmount()) : undefined,
                    maxAmount: this.maxAmount() ? Number(this.maxAmount()) : undefined,
                    sortBy: this.sortBy(),
                },
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: (err) => console.error('Failed to load transactions:', err) });
    }
}
