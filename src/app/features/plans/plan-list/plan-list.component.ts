import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SavingsPlan } from '../../../core/models/plan.model';
import { PlanFormDialogComponent } from '../plan-form-dialog/plan-form-dialog.component';

@Component({
    selector: 'app-plan-list',
    standalone: true,
    imports: [AppCurrencyPipe, DatePipe, FormsModule, PlanFormDialogComponent],
    templateUrl: './plan-list.component.html',
    styleUrl: './plan-list.component.scss',
})
export class PlanListComponent implements OnInit {
    readonly planService = inject(PlanService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);

    showDialog = false;
    editingPlan: SavingsPlan | null = null;

    /** Only one card may be in deposit mode at a time. */
    readonly depositingId = signal<string | null>(null);
    readonly depositAmount = signal('');
    readonly depositError = signal('');
    readonly isDepositing = signal(false);

    readonly cards = computed(() =>
        this.planService.plans().map((plan) => {
            const percent =
                plan.targetAmount > 0 ? Math.min(Math.round((plan.currentAmount / plan.targetAmount) * 100), 100) : 0;
            const deadline = plan.deadline ? new Date(plan.deadline) : null;
            const isComplete = plan.targetAmount > 0 && plan.currentAmount >= plan.targetAmount;

            return {
                plan,
                percent,
                hasTarget: plan.targetAmount > 0,
                isComplete,
                isOverdue: !isComplete && !!deadline && deadline.getTime() < Date.now(),
            };
        }),
    );

    ngOnInit(): void {
        this.planService
            .getPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    openCreate(): void {
        this.editingPlan = null;
        this.showDialog = true;
    }

    openEdit(plan: SavingsPlan): void {
        this.editingPlan = plan;
        this.showDialog = true;
    }

    onDialogClosed(): void {
        this.editingPlan = null;
    }

    reloadPlans(): void {
        this.planService
            .getPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    startDeposit(plan: SavingsPlan): void {
        this.depositingId.set(plan.id);
        this.depositAmount.set('');
        this.depositError.set('');
    }

    cancelDeposit(): void {
        this.depositingId.set(null);
        this.depositAmount.set('');
        this.depositError.set('');
    }

    deposit(plan: SavingsPlan): void {
        const amount = Number(this.depositAmount());
        if (!this.depositAmount() || !Number.isFinite(amount) || amount <= 0) {
            this.depositError.set('Enter an amount greater than zero');
            return;
        }

        this.isDepositing.set(true);
        this.planService
            .deposit(plan.id, amount)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isDepositing.set(false);
                    this.toast.show(`Added $${amount} contribution to plan!`);
                    this.cancelDeposit();
                },
                error: () => {
                    this.isDepositing.set(false);
                    this.depositError.set('Could not record the contribution');
                },
            });
    }

    deletePlan(plan: SavingsPlan): void {
        this.confirmDialog
            .confirmDelete(`"${plan.title}" and its progress will be removed.`, 'Delete savings plan')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.planService
                    .deletePlan(plan.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => this.toast.show('Savings plan removed'),
                        error: () => this.toast.error('Could not delete the plan'),
                    });
            });
    }
}
