import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Account } from '../../../core/models/account.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { DashboardSummary, Timeframe } from '../../../core/models/dashboard.model';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { CashflowChartComponent } from '../../../shared/components/cashflow-chart/cashflow-chart.component';
import { ExpenseAllocationComponent } from '../../dashboard/dashboard/components/expense-allocation/expense-allocation.component';
import { TimeframeSelectorComponent } from '../../../shared/components/timeframe-selector/timeframe-selector.component';
import { SignedCurrencyPipe } from '../../../shared/pipes/signed-currency.pipe';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';
import { CashflowPoint } from '../../../core/models/dashboard.model';
import { timeframeToDateRange } from '../../../shared/utils/date-range';

const BURN_TIMEFRAMES: Timeframe[] = ['7D', '15D', '30D', 'This Month', '6M', 'This Year'];
const CASHFLOW_TIMEFRAMES: Timeframe[] = ['7D', '15D', '30D', 'This Month', '6M', 'This Year'];
const LEDGER_TIMEFRAMES: Timeframe[] = ['All', '7D', '15D', '30D', 'This Month', '6M', 'This Year'];

import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-account-detail',
    standalone: true,
    imports: [
        AppCurrencyPipe,
        DatePipe,
        FormsModule,
        RouterLink,
        CashflowChartComponent,
        ExpenseAllocationComponent,
        TimeframeSelectorComponent,
        SignedCurrencyPipe,
        AccountIconComponent,
        MatMenuModule,
    ],
    templateUrl: './account-detail.component.html',
    styleUrl: './account-detail.component.scss',
})
export class AccountDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly accountService = inject(AccountService);
    private readonly transactionService = inject(TransactionService);
    private readonly categoryService = inject(CategoryService);
    private readonly dashboardService = inject(DashboardService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);

    readonly burnTimeframes = BURN_TIMEFRAMES;
    readonly cashflowTimeframes = CASHFLOW_TIMEFRAMES;
    readonly ledgerTimeframes = LEDGER_TIMEFRAMES;
    readonly timeframes = CASHFLOW_TIMEFRAMES;
    readonly CategoryType = CategoryType;

    readonly accountId = signal('');
    readonly account = signal<Account | null>(null);
    readonly notFound = signal(false);
    readonly isLoadingAccount = signal(true);
    readonly isLoadingLedger = signal(false);
    readonly isLoadingChart = signal(false);
    readonly isLoadingBurn = signal(false);

    readonly transactions = signal<Transaction[]>([]);
    readonly cashflow = signal<CashflowPoint[]>([]);
    readonly timeframe = signal<Timeframe>('This Month');

    // Burn Allocation: defaults to 'This Month'
    readonly burnTimeframe = signal<Timeframe>('This Month');
    readonly burnSummary = signal<DashboardSummary | null>(null);
    readonly burnCategorySpent = computed(() => this.burnSummary()?.categorySpent ?? []);
    readonly burnTotalExpense = computed(() => this.burnSummary()?.totalExpense ?? 0);

    // Ledger filters
    readonly search = signal('');
    readonly typeFilter = signal<CategoryType | undefined>(undefined);
    readonly ledgerTimeframe = signal<Timeframe>('This Month');

    readonly isEditingBalance = signal(false);
    readonly draftBalance = signal('');

    readonly totalInflow = signal(0);
    readonly totalOutflow = signal(0);
    readonly ledgerCount = signal(0);
    readonly netMovement = computed(() => this.totalInflow() - this.totalOutflow());

    private readonly searchInput = new Subject<string>();

    readonly categories = this.categoryService.categories;

    readonly rows = computed(() => {
        const categoryById = new Map(this.categoryService.categories().map((category) => [category.id, category]));
        return this.transactions().map((transaction) => ({
            transaction,
            category: categoryById.get(transaction.categoryId),
        }));
    });

    constructor() {
        this.searchInput
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.search.set(value);
                this.loadLedger();
            });
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = params.get('id') ?? '';
            this.accountId.set(id);
            this.loadAccount(id);
            this.loadSummary();
            this.loadBurnAllocation();
            this.loadLedger();
            this.loadCashflow();
        });

        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    onSearchChange(value: string): void {
        this.searchInput.next(value);
    }

    onTypeChange(value: CategoryType | undefined): void {
        this.typeFilter.set(value);
        this.loadLedger();
    }

    getTypeFilterLabel(): string {
        const type = this.typeFilter();
        if (type === CategoryType.Expense) return 'Expenses Only';
        if (type === CategoryType.Income) return 'Income Only';
        return 'All Types';
    }

    getTypeFilterIcon(): string {
        const type = this.typeFilter();
        if (type === CategoryType.Expense) return 'arrow_downward';
        if (type === CategoryType.Income) return 'arrow_upward';
        return 'tune';
    }

    onTimeframeChange(timeframe: Timeframe): void {
        this.timeframe.set(timeframe);
        this.loadCashflow();
    }

    onBurnTimeframeChange(timeframe: Timeframe): void {
        this.burnTimeframe.set(timeframe);
        this.loadBurnAllocation();
    }

    onLedgerTimeframeChange(timeframe: Timeframe): void {
        this.ledgerTimeframe.set(timeframe);
        this.loadLedger();
    }

    startEditBalance(): void {
        this.draftBalance.set(String(this.account()?.balance ?? 0));
        this.isEditingBalance.set(true);
    }

    cancelEditBalance(): void {
        this.isEditingBalance.set(false);
    }

    saveBalance(): void {
        const account = this.account();
        if (!account) return;

        const parsed = Number(this.draftBalance());
        if (!Number.isFinite(parsed) || parsed < 0) {
            this.toast.error('Enter a valid balance');
            return;
        }

        this.accountService
            .updateBalance(account.id, parsed)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.account.set({ ...account, balance: parsed });
                    this.isEditingBalance.set(false);
                    this.toast.show('Account balance adjusted');
                },
                error: () => this.toast.error('Could not update the balance'),
            });
    }

    recordEntry(): void {
        this.router.navigate(['/transactions/new'], { queryParams: { accountId: this.accountId() } });
    }

    openTransaction(id: string): void {
        this.router.navigate(['/transactions/details', id]);
    }

    deleteTransaction(transaction: Transaction, event: Event): void {
        event.stopPropagation();
        this.confirmDialog
            .confirmDelete(
                `"${transaction.title}" will be removed from this account's ledger. A TransactionDeleted event will be recorded.`,
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
                            this.loadLedger();
                            this.loadSummary();
                            this.loadBurnAllocation();
                            this.loadCashflow();
                        },
                        error: () => this.toast.error('Could not delete the transaction'),
                    });
            });
    }

    private loadAccount(id: string): void {
        this.isLoadingAccount.set(true);
        this.notFound.set(false);
        this.accountService
            .getAccountById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (account) => {
                    this.account.set(account);
                    this.isLoadingAccount.set(false);
                },
                error: () => {
                    this.account.set(null);
                    this.notFound.set(true);
                    this.isLoadingAccount.set(false);
                },
            });
    }

    /** Lifetime totals come from the aggregate endpoint — the ledger below is paginated. */
    private loadSummary(): void {
        this.dashboardService
            .getSummary({ accountId: this.accountId() })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (summary) => {
                    this.totalInflow.set(summary.totalIncome);
                    this.totalOutflow.set(summary.totalExpense);
                    this.ledgerCount.set(summary.transactionCount);
                },
                error: () => {},
            });
    }

    /** Burn allocation queries money burnt by category for the selected timeframe (default 7D). */
    private loadBurnAllocation(): void {
        if (!this.accountId()) return;
        this.isLoadingBurn.set(true);
        const range = timeframeToDateRange(this.burnTimeframe());
        this.dashboardService
            .getSummary({
                accountId: this.accountId(),
                timeframe: this.burnTimeframe(),
                from: range.from,
                to: range.to,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (summary) => {
                    this.burnSummary.set(summary);
                    this.isLoadingBurn.set(false);
                },
                error: () => {
                    this.burnSummary.set(null);
                    this.isLoadingBurn.set(false);
                },
            });
    }

    private loadLedger(): void {
        if (!this.accountId()) return;
        this.isLoadingLedger.set(true);
        const range = timeframeToDateRange(this.ledgerTimeframe());
        this.transactionService
            .queryTransactions(1, 25, undefined, this.typeFilter(), this.search() || undefined, {
                accountId: this.accountId(),
                fromDate: range.from,
                toDate: range.to,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.transactions.set(result.items);
                    this.isLoadingLedger.set(false);
                },
                error: () => {
                    this.transactions.set([]);
                    this.isLoadingLedger.set(false);
                },
            });
    }

    private loadCashflow(): void {
        this.isLoadingChart.set(true);
        this.dashboardService
            .getCashflow(this.timeframe(), { accountId: this.accountId() })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (points) => {
                    this.cashflow.set(points);
                    this.isLoadingChart.set(false);
                },
                error: () => {
                    this.cashflow.set([]);
                    this.isLoadingChart.set(false);
                },
            });
    }
}
