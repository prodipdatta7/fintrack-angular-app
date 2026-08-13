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
import { TransactionService, TransactionSort } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FilterPopoverComponent } from '../../../shared/components/filter-popover/filter-popover.component';
import { SignedCurrencyPipe } from '../../../shared/pipes/signed-currency.pipe';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';

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
        FilterPopoverComponent,
        SignedCurrencyPipe,
        TransactionHistoryDrawerComponent,
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

    readonly CategoryType = CategoryType;

    showHistoryDrawer = false;
    historyTransactionId: string | null = null;
    filtersOpen = false;

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

    applyFilters(): void {
        this.loadTransactions(1);
    }

    resetAllFilters(): void {
        this.searchText.set('');
        this.selectedCategoryId.set(undefined);
        this.selectedAccountId.set(undefined);
        this.typeFilter.set(undefined);
        this.startDate.set('');
        this.endDate.set('');
        this.minAmount.set('');
        this.maxAmount.set('');
        this.sortBy.set(DEFAULT_SORT);
        this.loadTransactions(1);
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
