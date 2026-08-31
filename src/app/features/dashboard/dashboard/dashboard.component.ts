import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timeframe } from '../../../core/models/dashboard.model';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PlanService } from '../../../core/services/plan.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../core/models/transaction.model';
import {
    CashflowChartComponent,
    CustomRange,
} from '../../../shared/components/cashflow-chart/cashflow-chart.component';
import { CustomDateRange } from '../../../shared/components/timeframe-selector/timeframe-selector.component';
import { timeframeToDateRange } from '../../../shared/utils/date-range';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ExpenseAllocationComponent } from './components/expense-allocation/expense-allocation.component';
import { NetBalanceHubComponent } from './components/net-balance-hub/net-balance-hub.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { SavingsTargetsComponent } from './components/savings-targets/savings-targets.component';
import { MobileBalanceCardComponent } from './components/mobile-balance-card/mobile-balance-card.component';
import { MobileExpenseDonutComponent } from './components/mobile-expense-donut/mobile-expense-donut.component';
import { MobileTopExpensesComponent } from './components/mobile-top-expenses/mobile-top-expenses.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        AppCurrencyPipe,
        CashflowChartComponent,
        StatCardComponent,
        NetBalanceHubComponent,
        ExpenseAllocationComponent,
        SavingsTargetsComponent,
        RecentActivityComponent,
        MobileBalanceCardComponent,
        MobileExpenseDonutComponent,
        MobileTopExpensesComponent,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
    private readonly dashboardService = inject(DashboardService);
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly planService = inject(PlanService);
    private readonly transactionService = inject(TransactionService);
    private readonly destroyRef = inject(DestroyRef);

    readonly timeframe = signal<Timeframe>('This Month');
    readonly expenseTimeframe = signal<Timeframe>('This Month');
    readonly netBalanceTimeframe = signal<Timeframe>('This Month');
    readonly recentActivityTimeframe = signal<Timeframe>('This Month');
    readonly loadFailed = signal(false);

    readonly summary = this.dashboardService.summary;
    readonly cashflow = this.dashboardService.cashflow;
    readonly categories = this.categoryService.categories;
    readonly plans = this.planService.plans;
    readonly recentTransactionsList = signal<Transaction[]>([]);
    readonly isLoadingRecentTransactions = signal<boolean>(false);

    readonly isLoadingSummary = this.dashboardService.isLoadingSummary;
    readonly isLoadingCashflow = this.dashboardService.isLoadingCashflow;
    readonly isLoadingAccounts = this.accountService.isLoading;
    readonly isLoadingPlans = this.planService.isLoading;

    readonly accounts = this.accountService.accounts;
    readonly totalBalance = this.accountService.totalBalance;
    readonly totalIncome = computed(() => this.summary()?.totalIncome ?? 0);
    readonly totalExpense = computed(() => this.summary()?.totalExpense ?? 0);
    readonly netSavings = computed(() => this.summary()?.netSavings ?? 0);
    readonly categorySpent = computed(() => this.summary()?.categorySpent ?? []);
    readonly recentTransactions = computed(() => this.summary()?.recentTransactions ?? []);

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.loadFailed.set(false);

        this.loadExpenseSummary(this.expenseTimeframe());
        this.loadRecentTransactions(this.recentActivityTimeframe());

        this.accountService
            .getAccounts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.planService
            .getPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });

        this.loadCashflow();
    }

    onExpenseTimeframeChange(tf: Timeframe): void {
        this.expenseTimeframe.set(tf);
        this.loadExpenseSummary(tf);
    }

    onNetBalanceTimeframeChange(tf: Timeframe): void {
        this.netBalanceTimeframe.set(tf);
        this.accountService.getAccounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    onTimeframeChange(timeframe: Timeframe): void {
        this.timeframe.set(timeframe);
        if (timeframe !== 'Custom') {
            this.loadCashflow();
        }
    }

    onCustomRange(range: CustomRange): void {
        this.loadCashflow(range);
    }

    onRecentActivityTimeframeChange(tf: Timeframe): void {
        this.recentActivityTimeframe.set(tf);
        this.loadRecentTransactions(tf);
    }

    onRecentActivityCustomRange(range: CustomDateRange): void {
        this.recentActivityTimeframe.set('Custom');
        this.loadRecentTransactions('Custom', range);
    }

    onMobileTimeframeChange(tf: Timeframe): void {
        this.expenseTimeframe.set(tf);
        this.recentActivityTimeframe.set(tf);
        this.timeframe.set(tf);
        this.loadExpenseSummary(tf);
        this.loadRecentTransactions(tf);
        if (tf !== 'Custom') {
            this.loadCashflow();
        }
    }

    onMobileCustomRange(range: CustomDateRange): void {
        this.expenseTimeframe.set('Custom');
        this.recentActivityTimeframe.set('Custom');
        this.timeframe.set('Custom');
        this.loadExpenseSummary('Custom');
        this.loadRecentTransactions('Custom', range);
        this.loadCashflow({ from: range.from, to: range.to });
    }

    private loadExpenseSummary(tf: Timeframe): void {
        const range = timeframeToDateRange(tf);
        this.dashboardService
            .getSummary({
                timeframe: tf,
                from: range.from || undefined,
                to: range.to || undefined,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                error: () => this.loadFailed.set(true),
            });
    }

    private loadRecentTransactions(tf: Timeframe, customRange?: CustomDateRange): void {
        this.isLoadingRecentTransactions.set(true);
        const range = timeframeToDateRange(tf, customRange ? { from: customRange.from, to: customRange.to } : undefined);
        this.transactionService
            .queryTransactions(1, 20, undefined, undefined, undefined, {
                fromDate: range.from || undefined,
                toDate: range.to || undefined,
                sortBy: 'date-desc',
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.recentTransactionsList.set(res.items);
                    this.isLoadingRecentTransactions.set(false);
                },
                error: () => {
                    // Fallback to summary transactions if query fails
                    this.recentTransactionsList.set(this.recentTransactions());
                    this.isLoadingRecentTransactions.set(false);
                },
            });
    }

    private loadCashflow(range?: CustomRange): void {
        this.dashboardService
            .getCashflow(this.timeframe(), range ? { from: range.from, to: range.to } : {})
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }
}
