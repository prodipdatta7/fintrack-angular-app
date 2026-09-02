import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { IconStoreMenuComponent } from '../../../shared/components/icon-store-menu/icon-store-menu.component';
import { isMaterialIconName } from '../../../shared/data/icon-store';

const DEFAULT_CATEGORY_ICON = 'label';

@Component({
    selector: 'app-category-form-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        AppCurrencyPipe,
        IconStoreMenuComponent,
    ],
    templateUrl: './category-form-dialog.component.html',
    styleUrl: './category-form-dialog.component.scss',
})
export class CategoryFormDialogComponent implements OnChanges {
    @Input() visible = false;
    /** Non-null puts the dialog into edit mode. */
    @Input() category: Category | null = null;
    /** Default category type when creating a new category. */
    @Input() defaultType: CategoryType = CategoryType.Expense;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() closed = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService);
    private toast = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    CategoryType = CategoryType;
    errorMessage = '';
    isSubmitting = false;

    readonly typeCards: { value: CategoryType; label: string; icon: string; hint: string }[] = [
        { value: CategoryType.Income, label: 'Income', icon: 'trending_up', hint: 'Money coming in' },
        { value: CategoryType.Expense, label: 'Expense', icon: 'trending_down', hint: 'Money going out' },
    ];

    readonly colorPresets = [
        '#6366F1',
        '#06B6D4',
        '#10B981',
        '#EF4444',
        '#F59E0B',
        '#8B5CF6',
        '#EC4899',
        '#64748B',
    ];

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(60)]],
        type: [CategoryType.Expense, Validators.required],
        icon: [DEFAULT_CATEGORY_ICON, Validators.required],
        color: ['#6366F1', Validators.required],
        budgetLimit: [0, [Validators.min(0)]],
    });

    get isEditMode(): boolean {
        return !!this.category;
    }

    get previewName(): string {
        return this.form.value.name?.trim() || '';
    }

    get previewIcon(): string {
        return this.form.value.icon?.trim() || DEFAULT_CATEGORY_ICON;
    }

    get previewColor(): string {
        return this.form.value.color || '#6366F1';
    }

    get previewTypeLabel(): string {
        return Number(this.form.value.type) === CategoryType.Income ? 'Income' : 'Expense';
    }

    get previewBudget(): number {
        return Number(this.form.value.budgetLimit) || 0;
    }

    get usesMaterialIcon(): boolean {
        return isMaterialIconName(this.previewIcon);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['visible'] && !changes['category'] && !changes['defaultType']) return;
        if (!this.visible) return;

        this.errorMessage = '';
        if (this.category) {
            this.form.patchValue({
                name: this.category.name,
                type: this.category.type,
                icon: this.category.icon || DEFAULT_CATEGORY_ICON,
                color: this.category.color || '#6366F1',
                budgetLimit: this.category.budgetLimit ?? 0,
            });
        } else {
            this.resetForm();
        }
    }

    onOverlayClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    selectType(type: CategoryType): void {
        this.form.patchValue({ type });
    }

    selectIcon(icon: string): void {
        this.form.patchValue({ icon });
    }

    setAccentColor(color: string): void {
        this.form.patchValue({ color });
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
            name: value.name!.trim(),
            type: Number(value.type),
            icon: value.icon!.trim(),
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
            type: this.defaultType ?? CategoryType.Expense,
            icon: DEFAULT_CATEGORY_ICON,
            color: '#6366F1',
            budgetLimit: 0,
        });
    }
}
