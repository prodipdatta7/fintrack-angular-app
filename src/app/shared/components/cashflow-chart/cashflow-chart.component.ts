import { Component, computed, input, output, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { FormsModule } from '@angular/forms';
import { CashflowPoint, Timeframe } from '../../../core/models/dashboard.model';
import {
    CHART_HEIGHT,
    CHART_PADDING,
    CHART_WIDTH,
    areaPath,
    createScale,
    getVisibleTickIndices,
    gridLines,
    smoothPath,
    tooltipLeftPercent,
} from '../../utils/chart-geometry';

export interface CustomRange {
    from: string;
    to: string;
}

/** Gradient ids must be unique per instance — two charts can share a page. */
let instanceCounter = 0;

@Component({
    selector: 'app-cashflow-chart',
    standalone: true,
    imports: [AppCurrencyPipe, FormsModule],
    templateUrl: './cashflow-chart.component.html',
    styleUrl: './cashflow-chart.component.scss',
})
export class CashflowChartComponent {
    readonly points = input.required<CashflowPoint[]>();
    readonly title = input('Cashflow Dynamics (Income vs Expense)');
    readonly subtitle = input('Real-time revenue inflows compared against expenditure');
    readonly timeframes = input<Timeframe[]>(['7D', '15D', '30D', '60D', '6M', '1Y']);
    readonly activeTimeframe = input<Timeframe>('6M');
    readonly showLegend = input(true);
    readonly showNetRow = input(true);
    readonly incomeLabel = input('Income');
    readonly expenseLabel = input('Expenses');
    readonly floor = input(1000);
    readonly isLoading = input(false);

    readonly timeframeChange = output<Timeframe>();
    readonly customRangeChange = output<CustomRange>();

    readonly uid = `cashflow-${++instanceCounter}`;
    readonly viewBox = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
    readonly labelY = CHART_HEIGHT - 8;
    readonly plotTop = CHART_PADDING;
    readonly plotBottom = CHART_HEIGHT - CHART_PADDING;
    readonly plotLeft = CHART_PADDING;
    readonly plotRight = CHART_WIDTH - CHART_PADDING;

    readonly hoveredIndex = signal<number | null>(null);
    customStart = '';
    customEnd = '';

    private readonly scale = computed(() => createScale(this.points(), this.floor()));

    readonly gridY = computed(() => gridLines(this.scale()));

    readonly incomeLine = computed(() => smoothPath(this.points(), 'income', this.scale()));
    readonly expenseLine = computed(() => smoothPath(this.points(), 'expense', this.scale()));
    readonly incomeArea = computed(() => areaPath(this.incomeLine(), this.scale()));
    readonly expenseArea = computed(() => areaPath(this.expenseLine(), this.scale()));

    readonly visibleTickIndices = computed(() => getVisibleTickIndices(this.points().length));

    readonly plotted = computed(() => {
        const scale = this.scale();
        const tickIndices = this.visibleTickIndices();
        const total = this.points().length;
        const dense = total > 15;

        return this.points().map((point, index) => ({
            index,
            label: point.label,
            income: point.income,
            expense: point.expense,
            x: scale.getX(index),
            incomeY: scale.getY(point.income),
            expenseY: scale.getY(point.expense),
            showAxisLabel: tickIndices.has(index),
            dotRadius: dense ? 2.5 : 4,
        }));
    });

    readonly hovered = computed(() => {
        const index = this.hoveredIndex();
        if (index === null) return null;
        const point = this.points()[index];
        if (!point) return null;
        return {
            ...point,
            net: point.income - point.expense,
            left: tooltipLeftPercent(index, this.points().length),
        };
    });

    /** Text alternative for the series — the visual chart is hover-only. */
    readonly summaryLabel = computed(() => {
        const points = this.points();
        if (!points.length) return 'No cashflow data for this period';
        const income = points.reduce((sum, p) => sum + p.income, 0);
        const expense = points.reduce((sum, p) => sum + p.expense, 0);
        return `${this.title()}: ${points.length} periods, total income ${income.toFixed(2)}, total expense ${expense.toFixed(2)}`;
    });

    selectTimeframe(timeframe: Timeframe): void {
        if (timeframe === this.activeTimeframe()) return;
        this.timeframeChange.emit(timeframe);
    }

    emitCustomRange(): void {
        if (!this.customStart || !this.customEnd) return;
        this.customRangeChange.emit({ from: this.customStart, to: this.customEnd });
    }

    setHovered(index: number | null): void {
        this.hoveredIndex.set(index);
    }
}
