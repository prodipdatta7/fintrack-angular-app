import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [AppCurrencyPipe, FormsModule, CategoryFormDialogComponent],
    templateUrl: './category-list.component.html',
    styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
    readonly categoryService = inject(CategoryService);
    private readonly dashboardService = inject(DashboardService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);

    readonly CategoryType = CategoryType;

    showDialog = false;
    editingCategory: Category | null = null;

    readonly searchText = signal('');

    readonly cards = computed(() => {
        const search = this.searchText().toLowerCase().trim();
        const spentByCategory = new Map(
            (this.dashboardService.summary()?.categorySpent ?? []).map((entry) => [entry.categoryId, entry.spent]),
        );

        return this.categoryService
            .categories()
            .filter((category) => !search || category.name.toLowerCase().includes(search))
            .map((category) => {
                const spent = spentByCategory.get(category.id) ?? 0;
                const limit = category.budgetLimit;
                return {
                    category,
                    spent,
                    limit,
                    // Here the bar reads spend against this category's own cap —
                    // the dashboard bar reads spend against total expenses.
                    percent: limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0,
                    isOverBudget: limit > 0 && spent > limit,
                    showBudget: category.type === CategoryType.Expense,
                };
            });
    });

    ngOnInit(): void {
        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.dashboardService
            .getSummary()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
    }

    openCategory(category: Category): void {
        this.router.navigate(['/categories', category.id]);
    }

    openCreate(): void {
        this.editingCategory = null;
        this.showDialog = true;
    }

    openEdit(category: Category, event: Event): void {
        event.stopPropagation();
        this.editingCategory = category;
        this.showDialog = true;
    }

    onDialogClosed(): void {
        this.editingCategory = null;
    }
}
