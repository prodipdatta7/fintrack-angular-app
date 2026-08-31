import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { CategorySpend, Timeframe } from '../../../../../core/models/dashboard.model';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import {
    PIE_CX,
    PIE_CY,
    PIE_INNER_R,
    PIE_OUTER_R,
    PIE_SIZE,
    PieSlice,
    buildPieSlices,
} from '../../../../../shared/utils/pie-geometry';
import { formatTimeframeLabel } from '../../../../../shared/utils/date-range';

export interface MobileDonutSlice extends PieSlice {
    categoryName: string;
    icon?: string;
    isOverBudget?: boolean;
    labelX: number;
    labelY: number;
    showFullLabel: boolean;
    showPercentLabel: boolean;
}

const DONUT_SIZE = 280;
const DONUT_CX = DONUT_SIZE / 2;
const DONUT_CY = DONUT_SIZE / 2;
const DONUT_OUTER_R = 130;
const DONUT_INNER_R = 0;

const FALLBACK_DISTINCT_COLORS = [
    '#6366F1', // Indigo
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#E11D48', // Rose
    '#84CC16', // Lime
    '#A855F7', // Violet
];

function toPolar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
    };
}

@Component({
    selector: 'app-mobile-expense-donut',
    standalone: true,
    imports: [CommonModule, AppCurrencyPipe],
    templateUrl: './mobile-expense-donut.component.html',
    styleUrl: './mobile-expense-donut.component.scss',
})
export class MobileExpenseDonutComponent {
    readonly categories = input.required<Category[]>();
    readonly categorySpent = input.required<CategorySpend[]>();
    readonly totalExpense = input.required<number>();
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly isLoading = input<boolean>(false);

    readonly hoveredId = signal<string | null>(null);

    readonly pieSize = DONUT_SIZE;
    readonly viewBox = `0 0 ${DONUT_SIZE} ${DONUT_SIZE}`;
    readonly centerX = DONUT_CX;
    readonly centerY = DONUT_CY;
    readonly holeRadius = DONUT_INNER_R;
    readonly outerRadius = DONUT_OUTER_R;

    readonly activeLabel = computed(() => formatTimeframeLabel(this.activeTimeframe()));

    /** Computed pie slices with category metadata and distinct on-chart colors */
    readonly slices = computed<MobileDonutSlice[]>(() => {
        const spentMap = new Map(this.categorySpent().map((entry) => [entry.categoryId, entry.spent]));
        const total = this.totalExpense();

        const expenseCategories = this.categories().filter((cat) => cat.type === CategoryType.Expense);
        const usedColors = new Set<string>();

        const activeItems = expenseCategories
            .map((cat, idx) => {
                const spent = spentMap.get(cat.id) ?? 0;
                const isOverBudget = Boolean(cat.budgetLimit && cat.budgetLimit > 0 && spent > cat.budgetLimit);

                // Preserve original distinct category color; fallback to distinct palette if duplicate/missing
                let color = (cat.color || '').trim();
                if (!color || usedColors.has(color.toLowerCase())) {
                    const available = FALLBACK_DISTINCT_COLORS.find((c) => !usedColors.has(c.toLowerCase()));
                    color = available ?? FALLBACK_DISTINCT_COLORS[idx % FALLBACK_DISTINCT_COLORS.length];
                }
                usedColors.add(color.toLowerCase());

                return {
                    id: cat.id,
                    value: spent,
                    color,
                    categoryName: cat.name,
                    icon: cat.icon,
                    isOverBudget,
                };
            })
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);

        if (!activeItems.length || total <= 0) return [];

        const pieSlices = buildPieSlices(
            activeItems.map((item) => ({ id: item.id, value: item.value, color: item.color })),
            total,
            { cx: DONUT_CX, cy: DONUT_CY, outerR: DONUT_OUTER_R, innerR: DONUT_INNER_R },
        );

        const activeMap = new Map(activeItems.map((item) => [item.id, item]));
        const labelRadius = DONUT_OUTER_R * 0.64;

        return pieSlices.map((ps) => {
            const meta = activeMap.get(ps.id);
            const pt = toPolar(DONUT_CX, DONUT_CY, labelRadius, ps.midAngle);
            const showFullLabel = ps.percent >= 12;
            const showPercentLabel = ps.percent >= 5;

            return {
                ...ps,
                categoryName: meta?.categoryName ?? 'Category',
                icon: meta?.icon,
                isOverBudget: meta?.isOverBudget,
                labelX: Math.round(pt.x),
                labelY: Math.round(pt.y),
                showFullLabel,
                showPercentLabel,
            };
        });
    });

    readonly hasExpenses = computed(() => this.totalExpense() > 0 && this.slices().length > 0);

    /** Active slice selected or hovered */
    readonly activeSlice = computed(() => {
        const id = this.hoveredId();
        if (!id) return null;
        return this.slices().find((s) => s.id === id) ?? null;
    });

    onSliceTouch(id: string): void {
        if (this.hoveredId() === id) {
            this.hoveredId.set(null);
        } else {
            this.hoveredId.set(id);
        }
    }

    clearHover(): void {
        this.hoveredId.set(null);
    }
}
