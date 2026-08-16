import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminDataGeneratorService } from '../../../core/services/admin-data-generator.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { PlanService } from '../../../core/services/plan.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
    readonly generator = inject(AdminDataGeneratorService);
    readonly authService = inject(AuthService);
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly transactionService = inject(TransactionService);
    private readonly planService = inject(PlanService);
    private readonly destroyRef = inject(DestroyRef);

    readonly adminEmail = computed(() => this.authService.currentUser()?.email || 'Authorized Administrator');
    readonly accountCount = computed(() => this.accountService.accounts().length);
    readonly categoryCount = computed(() => this.categoryService.categories().length);
    readonly transactionCount = computed(() => this.transactionService.totalCount());
    readonly planCount = computed(() => this.planService.plans().length);

    readonly isGenerating = this.generator.isGenerating;
    readonly progressPercentage = this.generator.progressPercentage;
    readonly currentStep = this.generator.currentStep;
    readonly logs = this.generator.logs;

    ngOnInit(): void {
        this.refreshStats();
    }

    refreshStats(): void {
        this.accountService.getAccounts(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
        this.categoryService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
        this.transactionService.refreshTotalCount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
        this.planService.getPlans().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
    }

    seedAll(): void {
        void this.generator.seedAll();
    }

    seedAccounts(): void {
        void this.generator.seedAccountsOnly();
    }

    seedCategories(): void {
        void this.generator.seedCategoriesOnly();
    }

    seedTransactions(): void {
        void this.generator.seedTransactionsOnly();
    }

    seedPlans(): void {
        void this.generator.seedPlansOnly();
    }

    clearLogs(): void {
        this.generator.clearLogs();
    }
}
