import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { SavingsPlan } from '../../../core/models/plan.model';

@Component({
    selector: 'app-plan-form-dialog',
    standalone: true,
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
    templateUrl: './plan-form-dialog.component.html',
    styleUrl: './plan-form-dialog.component.scss',
})
export class PlanFormDialogComponent implements OnChanges {
    @Input() visible = false;
    /** Non-null puts the dialog into edit mode. */
    @Input() plan: SavingsPlan | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private planService = inject(PlanService);
    private toast = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    errorMessage = '';
    isSubmitting = false;

    form = this.fb.group({
        title: ['', Validators.required],
        targetAmount: [1000, [Validators.required, Validators.min(0.01)]],
        currentAmount: [0, [Validators.min(0)]],
        color: ['#3b82f6', Validators.required],
        deadline: ['', Validators.required],
    });

    get isEditMode(): boolean {
        return !!this.plan;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['visible'] && !changes['plan']) return;
        if (!this.visible) return;

        this.errorMessage = '';
        if (this.plan) {
            this.form.patchValue({
                title: this.plan.title,
                targetAmount: this.plan.targetAmount,
                currentAmount: this.plan.currentAmount,
                color: this.plan.color || '#3b82f6',
                deadline: (this.plan.deadline || '').substring(0, 10),
            });
        } else {
            this.form.reset({
                title: '',
                targetAmount: 1000,
                currentAmount: 0,
                color: '#3b82f6',
                deadline: '',
            });
        }
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.closed.emit();
    }

    submit(): void {
        if (this.form.invalid) return;

        this.errorMessage = '';
        this.isSubmitting = true;
        const value = this.form.getRawValue();
        const payload = {
            title: value.title!,
            targetAmount: Number(value.targetAmount),
            currentAmount: Number(value.currentAmount) || 0,
            color: value.color!,
            deadline: value.deadline!,
        };

        const request: Observable<unknown> = this.plan
            ? this.planService.updatePlan({ ...payload, id: this.plan.id })
            : this.planService.createPlan(payload);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.toast.show(this.plan ? 'Savings plan updated' : 'New savings plan created');
                this.saved.emit();
                this.close();
            },
            error: (err) => {
                this.isSubmitting = false;
                this.errorMessage = err.error?.error || 'Failed to save the plan.';
            },
        });
    }
}
