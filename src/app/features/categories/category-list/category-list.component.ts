import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';
import { CategorySubnavComponent } from '../category-subnav/category-subnav.component';

export type CategorySortOption = 'name-asc' | 'name-desc' | 'spent-desc' | 'limit-desc' | 'percent-desc';
export type CategoryTypeScope = 'all' | 'expense' | 'income';
export type BudgetStatusScope = 'all' | 'capped' | 'over' | 'safe' | 'uncapped';

export interface CategoryCardItem {
    category: Category;
    spent: number;
    limit: number;
    percent: number;
    isOverBudget: boolean;
    showBudget: boolean;
}

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [AppCurrencyPipe, FormsModule, CategoryFormDialogComponent, CategorySubnavComponent],
    templateUrl: './category-list.component.html',
    styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
    readonly categoryService = inject(CategoryService);
    readonly dashboardService = inject(DashboardService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);

    readonly CategoryType = CategoryType;

    showDialog = false;
    editingCategory: Category | null = null;

    // Filter & Sort State Signals
    readonly searchText = signal('');
    readonly typeFilter = signal<CategoryTypeScope>('all');
    readonly budgetStatusFilter = signal<BudgetStatusScope>('all');
    readonly sortOption = signal<CategorySortOption>('name-asc');

    // KPI & Scope Counts
    readonly totalCount = computed(() => this.categoryService.categories().length);
    readonly expenseCount = computed(
        () => this.categoryService.categories().filter((c) => c.type === CategoryType.Expense).length,
    );
    readonly incomeCount = computed(
        () => this.categoryService.categories().filter((c) => c.type === CategoryType.Income).length,
    );

    readonly isFilterActive = computed(() => {
        return (
            !!this.searchText().trim() ||
            this.typeFilter() !== 'all' ||
            this.budgetStatusFilter() !== 'all' ||
            this.sortOption() !== 'name-asc'
        );
    });

    readonly cards = computed(() => {
        const search = this.searchText().toLowerCase().trim();
        const type = this.typeFilter();
        const budgetStatus = this.budgetStatusFilter();
        const sort = this.sortOption();

        const spentByCategory = new Map(
            (this.dashboardService.summary()?.categorySpent ?? []).map((entry) => [entry.categoryId, entry.spent]),
        );

        let items: CategoryCardItem[] = this.categoryService
            .categories()
            .map((category) => {
                const spent = spentByCategory.get(category.id) ?? 0;
                const limit = category.budgetLimit;
                return {
                    category,
                    spent,
                    limit,
                    percent: limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0,
                    isOverBudget: limit > 0 && spent > limit,
                    showBudget: category.type === CategoryType.Expense,
                };
            });

        // 1. Filter by search query
        if (search) {
            items = items.filter((item) => item.category.name.toLowerCase().includes(search));
        }

        // 2. Filter by category type
        if (type === 'expense') {
            items = items.filter((item) => item.category.type === CategoryType.Expense);
        } else if (type === 'income') {
            items = items.filter((item) => item.category.type === CategoryType.Income);
        }

        // 3. Filter by budget status
        if (budgetStatus === 'capped') {
            items = items.filter((item) => item.limit > 0);
        } else if (budgetStatus === 'over') {
            items = items.filter((item) => item.isOverBudget);
        } else if (budgetStatus === 'safe') {
            items = items.filter((item) => item.limit > 0 && !item.isOverBudget);
        } else if (budgetStatus === 'uncapped') {
            items = items.filter((item) => item.limit === 0 && item.category.type === CategoryType.Expense);
        }

        // 4. Sort
        items.sort((a, b) => {
            switch (sort) {
                case 'name-desc':
                    return b.category.name.localeCompare(a.category.name);
                case 'spent-desc':
                    return b.spent - a.spent;
                case 'limit-desc':
                    return b.limit - a.limit;
                case 'percent-desc':
                    return b.percent - a.percent;
                case 'name-asc':
                default:
                    return a.category.name.localeCompare(b.category.name);
            }
        });

        return items;
    });

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
        this.dashboardService
            .getSummary()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    refreshData(): void {
        this.loadData();
        this.toast.show('Categories and budget metrics refreshed');
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
    }

    setTypeFilter(type: CategoryTypeScope): void {
        this.typeFilter.set(type);
    }

    resetFilters(): void {
        this.searchText.set('');
        this.typeFilter.set('all');
        this.budgetStatusFilter.set('all');
        this.sortOption.set('name-asc');
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
