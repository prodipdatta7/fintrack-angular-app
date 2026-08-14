import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
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

    private readonly router = inject(Router);

    readonly hoveredId = signal<string | null>(null);
    readonly isExpanded = signal(false);

    readonly INITIAL_LIMIT = 4;
    readonly MAX_EXPANDED_LIMIT = 10;

    readonly pieViewBox = `0 0 ${PIE_SIZE} ${PIE_SIZE}`;
    readonly holeRadius = PIE_INNER_R - 1;
    readonly centerX = PIE_CX;
    readonly centerY = PIE_CY;

    /**
     * Share of total spending, sorted descending by spent amount so largest
     * allocations are prioritized.
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
            })
            .sort((a, b) => b.spent - a.spent);
    });

    /**
     * Shows 4 items initially. When expanded, shows up to a maximum of 10 items.
     */
    readonly visibleRows = computed(() => {
        const all = this.rows();
        if (!this.isExpanded()) {
            return all.slice(0, this.INITIAL_LIMIT);
        }
        return all.slice(0, this.MAX_EXPANDED_LIMIT);
    });

    /** True if there are more than 4 items to expand. */
    readonly hasExpandableRows = computed(() => this.rows().length > this.INITIAL_LIMIT);

    /** True if there are more than 10 total items that exceed the visualizer max cap. */
    readonly hasExcessBeyondMax = computed(() => this.rows().length > this.MAX_EXPANDED_LIMIT);

    /** Count of items revealed when expanding from 4 to max 10. */
    readonly expandableCount = computed(() => {
        return Math.min(this.rows().length, this.MAX_EXPANDED_LIMIT) - this.INITIAL_LIMIT;
    });

    /** Total remaining count beyond the 10 shown in the visualizer. */
    readonly excessCount = computed(() => {
        return Math.max(0, this.rows().length - this.MAX_EXPANDED_LIMIT);
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
        const row = this.rows().find((entry) => entry.category.id === id);
        if (!slice && !row) return null;
        const anchor = slice ? pieTooltipAnchor(slice.midAngle) : null;
        return {
            id,
            name: row?.category.name ?? slice?.name ?? '',
            icon: row?.category.icon ?? slice?.icon ?? '',
            spent: row?.spent ?? slice?.value ?? 0,
            percent: row?.percent ?? slice?.percent ?? 0,
            color: row?.color ?? slice?.color ?? 'var(--primary)',
            isOverBudget: row?.isOverBudget ?? false,
            budgetLimit: row?.category.budgetLimit ?? 0,
            left: anchor ? anchor.left : 50,
            top: anchor ? anchor.top : 50,
        };
    });

    readonly summaryLabel = computed(() => {
        const slices = this.slices();
        if (!slices.length) return 'No category expenses for this period';
        return `Expense allocation: ${slices.map((slice) => `${slice.name} ${slice.percent}%`).join(', ')}`;
    });

    toggleExpanded(): void {
        this.isExpanded.update((v) => !v);
    }

    goToCategories(): void {
        this.router.navigate(['/categories']);
    }

    goToTransactions(): void {
        this.router.navigate(['/transactions']);
    }

    onSliceEnter(id: string): void {
        this.hoveredId.set(id);
    }

    onSliceLeave(): void {
        this.hoveredId.set(null);
    }

    onLegendEnter(id: string): void {
        this.hoveredId.set(id);
    }

    isEmoji(icon: string | null | undefined): boolean {
        if (!icon) return false;
        return !/[a-zA-Z]/.test(icon);
    }

    getCategoryIcon(icon: string | null | undefined): string {
        if (!icon) return 'label';
        const normalized = icon.toLowerCase().trim();
        const map: Record<string, string> = {
            film: 'movie',
            movie: 'movie',
            utensils: 'restaurant',
            food: 'restaurant',
            dining: 'restaurant',
            home: 'home',
            housing: 'home',
            car: 'directions_car',
            auto: 'directions_car',
            transport: 'directions_car',
            transportation: 'directions_car',
            shopping: 'shopping_bag',
            'shopping-bag': 'shopping_bag',
            groceries: 'local_grocery_store',
            health: 'medical_services',
            medical: 'medical_services',
            fitness: 'fitness_center',
            travel: 'flight',
            flight: 'flight',
            plane: 'flight',
            education: 'school',
            school: 'school',
            bills: 'receipt_long',
            utilities: 'electric_bolt',
            entertainment: 'sports_esports',
            salary: 'payments',
            investment: 'trending_up',
            gift: 'card_giftcard',
        };
        return map[normalized] || normalized || 'label';
    }
}
