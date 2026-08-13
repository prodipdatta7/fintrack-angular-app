import { Component, computed, input, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { CategorySpend } from '../../../../../core/models/dashboard.model';
import {
    PIE_CX,
    PIE_CY,
    PIE_INNER_R,
    PIE_SIZE,
    buildPieSlices,
    pieTooltipAnchor,
} from '../../../../../shared/utils/pie-geometry';

export interface AllocationRow {
    category: Category;
    spent: number;
    percent: number;
    isOverBudget: boolean;
    color: string;
}

@Component({
    selector: 'app-expense-allocation',
    standalone: true,
    imports: [AppCurrencyPipe],
    templateUrl: './expense-allocation.component.html',
    styleUrl: './expense-allocation.component.scss',
})
export class ExpenseAllocationComponent {
    readonly categories = input.required<Category[]>();
    readonly categorySpent = input.required<CategorySpend[]>();
    readonly totalExpense = input(0);
    readonly isLoading = input(false);

    readonly hoveredId = signal<string | null>(null);

    readonly pieViewBox = `0 0 ${PIE_SIZE} ${PIE_SIZE}`;
    readonly holeRadius = PIE_INNER_R - 1;
    readonly centerX = PIE_CX;
    readonly centerY = PIE_CY;

    /**
     * Share of total spending, not of the category's own cap — the per-cap
     * reading lives on the categories page.
     */
    readonly rows = computed((): AllocationRow[] => {
        const spentByCategory = new Map(this.categorySpent().map((entry) => [entry.categoryId, entry.spent]));
        const total = this.totalExpense() || 1;

        return this.categories()
            .filter((category) => category.type === CategoryType.Expense)
            .map((category) => {
                const spent = spentByCategory.get(category.id) ?? 0;
                const isOverBudget = category.budgetLimit > 0 && spent > category.budgetLimit;
                return {
                    category,
                    spent,
                    percent: Math.min(Math.round((spent / total) * 100), 100),
                    isOverBudget,
                    color: isOverBudget ? 'var(--over-budget)' : category.color,
                };
            });
    });

    /** Donut slices for categories with spend — colors match each category (or over-budget). */
    readonly slices = computed(() => {
        const byId = new Map(this.rows().map((row) => [row.category.id, row]));
        return buildPieSlices(
            this.rows()
                .filter((row) => row.spent > 0)
                .map((row) => ({
                    id: row.category.id,
                    value: row.spent,
                    color: row.color,
                })),
        ).map((slice) => {
            const row = byId.get(slice.id);
            return {
                ...slice,
                name: row?.category.name ?? slice.id,
                icon: row?.category.icon ?? '',
            };
        });
    });

    readonly hovered = computed(() => {
        const id = this.hoveredId();
        if (!id) return null;
        const slice = this.slices().find((entry) => entry.id === id);
        if (!slice) return null;
        const anchor = pieTooltipAnchor(slice.midAngle);
        return {
            name: slice.name,
            icon: slice.icon,
            spent: slice.value,
            percent: slice.percent,
            color: slice.color,
            left: anchor.left,
            top: anchor.top,
        };
    });

    readonly summaryLabel = computed(() => {
        const slices = this.slices();
        if (!slices.length) return 'No category expenses for this period';
        return `Expense allocation: ${slices.map((slice) => `${slice.name} ${slice.percent}%`).join(', ')}`;
    });

    onSliceEnter(id: string): void {
        this.hoveredId.set(id);
    }

    onSliceLeave(): void {
        this.hoveredId.set(null);
    }

    onLegendEnter(id: string): void {
        if (this.slices().some((slice) => slice.id === id)) {
            this.hoveredId.set(id);
        }
    }
}
