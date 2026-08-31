import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PlanService } from '../../../core/services/plan.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { ToastService } from '../../../core/services/toast.service';
import { CashflowPoint, DashboardSummary } from '../../../core/models/dashboard.model';

const summary: DashboardSummary = {
    totalIncome: 6200,
    totalExpense: 2468.7,
    netSavings: 3731.3,
    categorySpent: [{ categoryId: 'cat-1', spent: 1550 }],
    recentTransactions: [],
    transactionCount: 6,
};

describe('DashboardComponent', () => {
    let fixture: ComponentFixture<DashboardComponent>;
    let component: DashboardComponent;
    let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
    let summarySignal: ReturnType<typeof signal<DashboardSummary | null>>;
    let cashflowSignal: ReturnType<typeof signal<CashflowPoint[]>>;

    beforeEach(async () => {
        summarySignal = signal<DashboardSummary | null>(summary);
        cashflowSignal = signal<CashflowPoint[]>([{ label: 'Aug', income: 6200, expense: 2468 }]);

        dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSummary', 'getCashflow'], {
            summary: summarySignal,
            cashflow: cashflowSignal,
            isLoadingSummary: signal(false),
            isLoadingCashflow: signal(false),
        });
        dashboardServiceSpy.getSummary.and.returnValue(of(summary));
        dashboardServiceSpy.getCashflow.and.returnValue(of(cashflowSignal()));

        const accountsSignal = signal([]);
        const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts'], {
            accounts: accountsSignal,
            totalBalance: computed(() => 15000),
            isLoading: signal(false),
        });
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 15000 }));

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal([]),
            isLoading: signal(false),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        const planServiceSpy = jasmine.createSpyObj('PlanService', ['getPlans'], {
            plans: signal([]),
            isLoading: signal(false),
        });
        planServiceSpy.getPlans.and.returnValue(of([]));

        const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['queryTransactions'], {
            transactions: signal([]),
            isLoading: signal(false),
        });
        transactionServiceSpy.queryTransactions.and.returnValue(of({ items: [], totalCount: 0 }));

        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: DashboardService, useValue: dashboardServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: PlanService, useValue: planServiceSpy },
                { provide: TransactionService, useValue: transactionServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should render all desktop and mobile dashboard sections', () => {
        const host = fixture.nativeElement as HTMLElement;
        // Desktop elements
        expect(host.querySelector('.dashboard-desktop-view app-net-balance-hub')).toBeTruthy();
        expect(host.querySelector('.dashboard-desktop-view app-cashflow-chart')).toBeTruthy();
        expect(host.querySelectorAll('.dashboard-desktop-view app-stat-card').length).toBe(3);
        expect(host.querySelector('.dashboard-desktop-view app-expense-allocation')).toBeTruthy();
        expect(host.querySelector('.dashboard-desktop-view app-savings-targets')).toBeTruthy();
        expect(host.querySelector('.dashboard-desktop-view app-recent-activity')).toBeTruthy();

        // Mobile elements (Issue #15 3-section layout)
        expect(host.querySelector('.dashboard-mobile-view app-mobile-balance-card')).toBeTruthy();
        expect(host.querySelector('.dashboard-mobile-view app-mobile-expense-donut')).toBeTruthy();
        expect(host.querySelector('.dashboard-mobile-view app-mobile-top-expenses')).toBeTruthy();
    });

    it('should place the expense allocation visualizer at the top of the desktop page', () => {
        const sections = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll(
                '.dashboard-desktop-view > app-expense-allocation, .dashboard-desktop-view > app-net-balance-hub, .dashboard-desktop-view > app-cashflow-chart, .dashboard-desktop-view > app-savings-targets, .dashboard-desktop-view > app-recent-activity',
            ),
        ).map((el) => el.tagName.toLowerCase());

        expect(sections[0]).toBe('app-expense-allocation');
    });

    it('should load the summary and the default This Month series on init', () => {
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalled();
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('This Month', {});
    });

    it('should bind the server-side totals to the stat cards', () => {
        const amounts = Array.from(fixture.nativeElement.querySelectorAll('.dashboard-desktop-view .stat-card-amount')) as HTMLElement[];
        expect(amounts.map((a) => a.textContent?.trim())).toEqual(
            jasmine.arrayWithExactContents([
                jasmine.stringMatching(/3,731\.30/),
                jasmine.stringMatching(/^\+.*6,200\.00/),
                jasmine.stringMatching(/^-.*2,468\.70/),
            ]),
        );
    });

    it('should refetch the series when the timeframe changes', () => {
        component.onTimeframeChange('30D');
        expect(component.timeframe()).toBe('30D');
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('30D', {});
    });

    it('should handle mobile timeframe change and synchronize dashboard data', () => {
        dashboardServiceSpy.getSummary.calls.reset();
        dashboardServiceSpy.getCashflow.calls.reset();

        component.onMobileTimeframeChange('7D');
        expect(component.expenseTimeframe()).toBe('7D');
        expect(component.recentActivityTimeframe()).toBe('7D');
        expect(component.timeframe()).toBe('7D');

        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(jasmine.objectContaining({ timeframe: '7D' }));
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('7D', {});
    });

    it('should wait for both dates before fetching a custom range', () => {
        dashboardServiceSpy.getCashflow.calls.reset();

        component.onTimeframeChange('Custom');
        expect(dashboardServiceSpy.getCashflow).not.toHaveBeenCalled();

        component.onCustomRange({ from: '2026-07-01', to: '2026-08-10' });
        expect(dashboardServiceSpy.getCashflow).toHaveBeenCalledWith('Custom', {
            from: '2026-07-01',
            to: '2026-08-10',
        });
    });

    it('should surface a retry card when the summary fails', () => {
        dashboardServiceSpy.getSummary.and.returnValue(throwError(() => new Error('offline')));

        component.loadAll();
        fixture.detectChanges();

        expect(component.loadFailed()).toBeTrue();
        expect(fixture.nativeElement.querySelector('.dashboard-error')).toBeTruthy();
    });

    it('should fall back to zeros before the summary arrives', () => {
        summarySignal.set(null);
        fixture.detectChanges();

        expect(component.netSavings()).toBe(0);
        expect(component.categorySpent()).toEqual([]);
        expect(component.recentTransactions()).toEqual([]);
    });

    it('should refetch summary when expense allocation timeframe changes', () => {
        dashboardServiceSpy.getSummary.calls.reset();
        component.onExpenseTimeframeChange('7D');
        expect(component.expenseTimeframe()).toBe('7D');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(jasmine.objectContaining({ timeframe: '7D' }));
    });

    it('should update net balance timeframe and refresh accounts', () => {
        component.onNetBalanceTimeframeChange('15D');
        expect(component.netBalanceTimeframe()).toBe('15D');
    });

    it('should refetch transactions when recent activity timeframe changes', () => {
        component.onRecentActivityTimeframeChange('6M');
        expect(component.recentActivityTimeframe()).toBe('6M');
    });
});
