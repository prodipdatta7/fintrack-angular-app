import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { CategorySpend, Timeframe } from '../../../../../core/models/dashboard.model';
import { TimeframeSelectorComponent } from '../../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { DonutChartComponent } from '../../../../../shared/components/charts/donut-chart/donut-chart.component';
import { FlowChartComponent } from '../../../../../shared/components/charts/flow-chart/flow-chart.component';
import { GaugeChartComponent } from '../../../../../shared/components/charts/gauge-chart/gauge-chart.component';
import { DonutSlice, FlowStream } from '../../../../../shared/components/charts/chart.types';
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
    isActive: boolean;
    color: string;
}

@Component({
    selector: 'app-expense-allocation',
    standalone: true,
    imports: [
        FormsModule,
        AppCurrencyPipe,
        TimeframeSelectorComponent,
        DonutChartComponent,
        FlowChartComponent,
        GaugeChartComponent,
    ],
    templateUrl: './expense-allocation.component.html',
    styleUrl: './expense-allocation.component.scss',
})
export class ExpenseAllocationComponent {
    readonly categories = input.required<Category[]>();
    readonly categorySpent = input.required<CategorySpend[]>();
    readonly totalExpense = input(0);
    readonly isLoading = input(false);

    readonly title = input('Expense Allocation');
    readonly kickerTitle = input('LIVE OUTFLOW');
    readonly kickerSubtitle = input('Allocation & Analytics');
    readonly tagLabel = input('Active Visualizer');
    readonly timeframes = input<Timeframe[]>(['7D', '15D', '30D', 'This Month', '6M', 'This Year']);
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly showTimeframeSwitch = input(true);
    readonly showCategoriesNav = input(true);
    readonly sourceName = input('TOTAL SPEND');
    readonly sourceSub = input('BURN ORIGIN');
    readonly emptyStateTitle = input('No expense categories tracked');
    readonly emptyStateHint = input('Create expense categories to visualize your spending channels.');

    readonly timeframeChange = output<Timeframe>();

    private readonly router = inject(Router);

    readonly visualMode = signal<'donut' | 'flow' | 'gauge'>('donut');
    readonly filterTab = signal<'all' | 'active'>('all');
    readonly searchQuery = signal('');
    readonly hoveredId = signal<string | null>(null);
    readonly isExpanded = signal(false);

    readonly INITIAL_LIMIT = 4;
    readonly pieSize = PIE_SIZE;
    readonly pieViewBox = `0 0 ${PIE_SIZE} ${PIE_SIZE}`;
    readonly centerX = PIE_CX;
    readonly centerY = PIE_CY;
    readonly holeRadius = PIE_INNER_R;

    /** Only expense categories, sorted by highest spent descending. */
    readonly rows = computed<AllocationRow[]>(() => {
        const spentMap = new Map(this.categorySpent().map((entry) => [entry.categoryId, entry.spent]));
        const total = this.totalExpense();

        return this.categories()
            .filter((cat) => cat.type === CategoryType.Expense)
            .map((cat) => {
                const spent = spentMap.get(cat.id) ?? 0;
                const percent = total > 0 ? Math.round((spent / total) * 100) : 0;
                const isOverBudget = Boolean(cat.budgetLimit && cat.budgetLimit > 0 && spent > cat.budgetLimit);
                const isActive = spent > 0;
                const color = isOverBudget ? 'var(--over-budget)' : cat.color;
                return { category: cat, spent, percent, isOverBudget, isActive, color };
            })
            .sort((a, b) => b.spent - a.spent);
    });

    /** Top spending category. */
    readonly topCategory = computed(() => {
        const list = this.rows();
        return list.length && list[0].spent > 0 ? list[0] : null;
    });

    /** Number of active categories with spend > 0. */
    readonly activeChannelCount = computed(() => {
        return this.rows().filter((r) => r.spent > 0).length;
    });

    /** Total count of over-budget categories. */
    readonly overBudgetCount = computed(() => {
        return this.rows().filter((r) => r.isOverBudget).length;
    });

    /** Active channel ratio as percentage. */
    readonly activeRatioPercent = computed(() => {
        const total = this.rows().length;
        if (total === 0) return 0;
        return Math.round((this.activeChannelCount() / total) * 100);
    });

    /** Days elapsed or span of active timeframe. */
    readonly daysInTimeframe = computed(() => {
        const tf = this.activeTimeframe();
        const now = new Date();
        switch (tf) {
            case '7D':
                return 7;
            case '15D':
                return 15;
            case '30D':
                return 30;
            case 'This Month':
                return Math.max(1, now.getDate());
            case '6M':
                return 180;
            case 'This Year': {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                const diffTime = Math.abs(now.getTime() - startOfYear.getTime());
                return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
            default:
                return 30;
        }
    });

    /** Daily burn pace based on active timeframe. */
    readonly dailyPace = computed(() => {
        const days = this.daysInTimeframe();
        return days > 0 ? this.totalExpense() / days : 0;
    });

    /** Average outflow per active category channel. */
    readonly avgBurnPerChannel = computed(() => {
        const count = this.activeChannelCount();
        return count > 0 ? this.totalExpense() / count : 0;
    });

    /** Aggregated budget limit across all categories. */
    readonly totalBudgetCap = computed(() => {
        return this.rows().reduce((sum, r) => sum + (r.category.budgetLimit || 0), 0);
    });

    /** Percentage of total budget cap consumed. */
    readonly budgetCapPercent = computed(() => {
        const cap = this.totalBudgetCap();
        if (cap > 0) {
            return Math.min(Math.round((this.totalExpense() / cap) * 100), 100);
        }
        return this.totalExpense() > 0 ? 64 : 0;
    });

    /** Velocity pacing status indicator. */
    readonly velocityStatus = computed((): { label: string; type: 'optimal' | 'high' | 'inactive' } => {
        if (this.totalExpense() <= 0) {
            return { label: 'Inactive', type: 'inactive' };
        }
        if (this.budgetCapPercent() > 80 || this.overBudgetCount() > 0) {
            return { label: 'High Burn', type: 'high' };
        }
        return { label: 'Optimal', type: 'optimal' };
    });

    /** Sparkline pacing micro-bars (7 normalized values). */
    readonly sparklineHeights = computed(() => {
        const total = this.totalExpense();
        if (total <= 0) return [2, 2, 2, 2, 2, 2, 2];
        const base = [0.4, 0.65, 0.9, 0.55, 0.8, 1.0, 0.75];
        return base.map((factor) => Math.max(2, Math.round(factor * 16)));
    });

    /** Filtered rows by search text and active/all toggle tab. */
    readonly filteredRows = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const tab = this.filterTab();
        return this.rows().filter((r) => {
            const matchesQuery = !query || r.category.name.toLowerCase().includes(query);
            if (tab === 'active') {
                return matchesQuery && r.isActive;
            }
            return matchesQuery;
        });
    });

    /** Rows displayed in the matrix list. */
    readonly visibleRows = computed(() => {
        const list = this.filteredRows();
        if (!this.isExpanded()) {
            return list.slice(0, this.INITIAL_LIMIT);
        }
        return list;
    });

    readonly hasExpandableRows = computed(() => this.filteredRows().length > this.INITIAL_LIMIT);

    readonly expandableCount = computed(() => {
        return Math.max(0, this.filteredRows().length - this.INITIAL_LIMIT);
    });

    /** Standardized Donut slices. */
    readonly donutSlices = computed<DonutSlice[]>(() => {
        return this.rows().map((row) => ({
            id: row.category.id,
            name: row.category.name,
            value: row.spent,
            percent: row.percent,
            color: row.color,
            icon: row.category.icon,
            isOverBudget: row.isOverBudget,
        }));
    });

    /** Flow streams. */
    readonly flowStreams = computed<FlowStream[]>(() => {
        return this.rows()
            .filter((r) => r.spent > 0)
            .map((r) => ({
                id: r.category.id,
                name: r.category.name,
                percent: r.percent,
                color: r.category.color,
                value: r.spent,
                icon: r.category.icon,
            }));
    });

    /** Legacy accessor for existing slice references. */
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

    setVisualMode(mode: 'donut' | 'flow' | 'gauge'): void {
        this.visualMode.set(mode);
    }

    setFilterTab(tab: 'all' | 'active'): void {
        this.filterTab.set(tab);
    }

    onSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchQuery.set(target.value);
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    toggleExpanded(): void {
        this.isExpanded.update((v) => !v);
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

    goToCategories(): void {
        this.router.navigate(['/categories']);
    }

    isEmoji(icon?: string): boolean {
        if (!icon) return false;
        return /\p{Extended_Pictographic}/u.test(icon);
    }

    getCategoryIcon(icon?: string): string {
        if (!icon || this.isEmoji(icon)) return 'category';
        return icon;
    }
}
