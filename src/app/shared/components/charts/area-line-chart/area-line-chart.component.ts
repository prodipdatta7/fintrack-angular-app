import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartPointData, ChartSeries } from '../chart.types';
import { AppCurrencyPipe } from '../../../pipes/app-currency.pipe';
import {
    CHART_HEIGHT,
    CHART_PADDING,
    CHART_WIDTH,
    getVisibleTickIndices,
    tooltipLeftPercent,
} from '../../../utils/chart-geometry';

let instanceCounter = 0;

interface PlottedPoint {
    index: number;
    label: string;
    showAxisLabel: boolean;
    x: number;
    values: Record<string, number>;
    yPositions: Record<string, number>;
}

interface PlottedSeries extends ChartSeries {
    linePath: string;
    areaPath: string;
}

@Component({
    selector: 'app-area-line-chart',
    standalone: true,
    imports: [CommonModule, AppCurrencyPipe],
    templateUrl: './area-line-chart.component.html',
    styleUrl: './area-line-chart.component.scss',
})
export class AreaLineChartComponent {
    readonly points = input.required<ChartPointData[]>();
    readonly series = input.required<ChartSeries[]>();
    readonly floor = input<number>(500);
    readonly showLegend = input<boolean>(true);
    readonly showCrosshair = input<boolean>(true);
    readonly showTooltip = input<boolean>(true);
    readonly emptyMessage = input<string>('No activity recorded in this period');

    readonly pointHover = output<number | null>();
    readonly pointSelect = output<ChartPointData>();

    readonly uid = `chart-area-${++instanceCounter}`;
    readonly hoveredIndex = signal<number | null>(null);

    readonly viewBox = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
    readonly labelY = CHART_HEIGHT - 8;
    readonly plotTop = CHART_PADDING;
    readonly plotBottom = CHART_HEIGHT - CHART_PADDING;
    readonly plotLeft = CHART_PADDING;
    readonly plotRight = CHART_WIDTH - CHART_PADDING;

    readonly maxValue = computed(() => {
        const pts = this.points();
        const sKeys = this.series().map((s) => s.key);
        let peak = this.floor();

        for (const pt of pts) {
            for (const k of sKeys) {
                const val = pt.values[k] || 0;
                if (val > peak) peak = val;
            }
        }
        return peak * 1.15;
    });

    readonly scaleX = computed(() => {
        const count = this.points().length;
        const span = CHART_WIDTH - CHART_PADDING * 2;
        return (index: number) => CHART_PADDING + (index * span) / Math.max(count - 1, 1);
    });

    readonly scaleY = computed(() => {
        const max = this.maxValue();
        const plotHeight = CHART_HEIGHT - CHART_PADDING * 2;
        return (val: number) => CHART_HEIGHT - CHART_PADDING - (val / max) * plotHeight;
    });

    readonly gridY = computed(() => {
        const max = this.maxValue();
        const sy = this.scaleY();
        return [0, max * 0.33, max * 0.66, max].map((v) => sy(v));
    });

    readonly plottedPoints = computed<PlottedPoint[]>(() => {
        const pts = this.points();
        const sx = this.scaleX();
        const sy = this.scaleY();
        const sKeys = this.series().map((s) => s.key);
        const visibleTicks = getVisibleTickIndices(pts.length, 7);

        return pts.map((pt, index) => {
            const x = sx(index);
            const yPositions: Record<string, number> = {};
            for (const k of sKeys) {
                yPositions[k] = sy(pt.values[k] || 0);
            }

            return {
                index,
                label: pt.label,
                showAxisLabel: visibleTicks.has(index),
                x,
                values: pt.values,
                yPositions,
            };
        });
    });

    readonly plottedSeries = computed<PlottedSeries[]>(() => {
        const pts = this.points();
        const sx = this.scaleX();
        const sy = this.scaleY();
        const sList = this.series();
        if (!pts.length) return [];

        const baseline = CHART_HEIGHT - CHART_PADDING;
        const firstX = sx(0);
        const lastX = sx(pts.length - 1);

        return sList.map((s) => {
            // Build smooth bezier line
            const linePath = pts.reduce((path, pt, index) => {
                const x = sx(index);
                const y = sy(pt.values[s.key] || 0);
                if (index === 0) return `M ${x},${y}`;

                const previousX = sx(index - 1);
                const previousY = sy(pts[index - 1].values[s.key] || 0);
                const controlX = previousX + (x - previousX) / 2;
                return `${path} C ${controlX},${previousY} ${controlX},${y} ${x},${y}`;
            }, '');

            const areaPath = linePath ? `${linePath} L ${lastX},${baseline} L ${firstX},${baseline} Z` : '';

            return {
                ...s,
                linePath,
                areaPath,
            };
        });
    });

    readonly hoveredData = computed(() => {
        const idx = this.hoveredIndex();
        if (idx === null || idx < 0 || idx >= this.points().length) return null;

        const pt = this.points()[idx];
        const left = tooltipLeftPercent(idx, this.points().length);

        return {
            point: pt,
            index: idx,
            left,
        };
    });

    setHovered(index: number | null): void {
        this.hoveredIndex.set(index);
        this.pointHover.emit(index);
    }

    onPointClick(index: number): void {
        const pt = this.points()[index];
        if (pt) this.pointSelect.emit(pt);
    }
}
