import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';

@Component({
    selector: 'app-category-form-dialog',
    standalone: true,
    imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
    templateUrl: './category-form-dialog.component.html',
    styleUrl: './category-form-dialog.component.scss',
})
export class CategoryFormDialogComponent implements OnChanges {
    @Input() visible = false;
    /** Non-null puts the dialog into edit mode. */
    @Input() category: Category | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() closed = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService);
    private toast = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    CategoryType = CategoryType;
    errorMessage = '';
    isSubmitting = false;

    typeOptions = [
        { label: 'Income', value: CategoryType.Income },
        { label: 'Expense', value: CategoryType.Expense },
    ];

    form = this.fb.group({
        name: ['', Validators.required],
        type: [CategoryType.Expense, Validators.required],
        icon: ['📁', Validators.required],
        color: ['#6366f1', Validators.required],
        budgetLimit: [0, [Validators.min(0)]],
    });

    get isEditMode(): boolean {
        return !!this.category;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['visible'] && !changes['category']) return;
        if (!this.visible) return;

        this.errorMessage = '';
        if (this.category) {
            this.form.patchValue({
                name: this.category.name,
                type: this.category.type,
                icon: this.category.icon || '📁',
                color: this.category.color || '#6366f1',
                budgetLimit: this.category.budgetLimit ?? 0,
            });
        } else {
            this.resetForm();
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
            name: value.name!,
            type: Number(value.type),
            icon: value.icon!,
            color: value.color!,
            // Blank means "no cap", which the API stores as 0.
            budgetLimit: Number(value.budgetLimit) || 0,
        };

        const request: Observable<unknown> = this.category
            ? this.categoryService.updateCategory({ ...payload, id: this.category.id })
            : this.categoryService.createCategory(payload);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.toast.show(this.category ? 'Category updated' : 'New category created');
                this.categoryService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
                this.resetForm();
                this.close();
            },
            error: (err) => {
                this.isSubmitting = false;
                this.errorMessage = err.error?.error || 'Failed to save category.';
            },
        });
    }

    private resetForm(): void {
        this.form.reset({
            name: '',
            type: CategoryType.Expense,
            icon: '📁',
            color: '#6366f1',
            budgetLimit: 0,
        });
    }
}
