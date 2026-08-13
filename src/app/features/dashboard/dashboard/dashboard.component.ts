import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timeframe } from '../../../core/models/dashboard.model';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PlanService } from '../../../core/services/plan.service';
import {
    CashflowChartComponent,
    CustomRange,
} from '../../../shared/components/cashflow-chart/cashflow-chart.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ExpenseAllocationComponent } from './components/expense-allocation/expense-allocation.component';
import { NetBalanceHubComponent } from './components/net-balance-hub/net-balance-hub.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { SavingsTargetsComponent } from './components/savings-targets/savings-targets.component';

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
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
    private readonly dashboardService = inject(DashboardService);
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly planService = inject(PlanService);
    private readonly destroyRef = inject(DestroyRef);

    readonly timeframe = signal<Timeframe>('6M');
    readonly loadFailed = signal(false);

    readonly summary = this.dashboardService.summary;
    readonly cashflow = this.dashboardService.cashflow;
    readonly categories = this.categoryService.categories;
    readonly plans = this.planService.plans;

    readonly isLoadingSummary = this.dashboardService.isLoadingSummary;
    readonly isLoadingCashflow = this.dashboardService.isLoadingCashflow;
    readonly isLoadingAccounts = this.accountService.isLoading;
    readonly isLoadingPlans = this.planService.isLoading;

    readonly accounts = this.accountService.accounts;
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

        this.dashboardService
            .getSummary()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => this.loadFailed.set(true) });

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

    onTimeframeChange(timeframe: Timeframe): void {
        this.timeframe.set(timeframe);
        if (timeframe !== 'Custom') {
            this.loadCashflow();
        }
    }

    onCustomRange(range: CustomRange): void {
        this.loadCashflow(range);
    }

    private loadCashflow(range?: CustomRange): void {
        this.dashboardService
            .getCashflow(this.timeframe(), range ? { from: range.from, to: range.to } : {})
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }
}
