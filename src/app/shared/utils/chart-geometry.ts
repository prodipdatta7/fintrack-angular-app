import { CashflowPoint } from '../../core/models/dashboard.model';

/**
 * Geometry for the cashflow line chart. Kept as pure functions so the maths is
 * testable without mounting a component.
 *
 * The viewBox is fixed; the SVG scales responsively via CSS.
 */
export const CHART_WIDTH = 1000;
export const CHART_HEIGHT = 220;
export const CHART_PADDING = 25;

/** Headroom above the tallest series so the peak never touches the top edge. */
const HEADROOM = 1.15;

export type SeriesKey = 'income' | 'expense';

export interface ChartScale {
    maxValue: number;
    pointCount: number;
    getX(index: number): number;
    getY(value: number): number;
}

export function createScale(points: readonly CashflowPoint[], floor = 1000): ChartScale {
    const peak = points.reduce((max, point) => Math.max(max, point.income, point.expense), floor);
    const maxValue = peak * HEADROOM;
    const pointCount = points.length;
    const span = CHART_WIDTH - CHART_PADDING * 2;
    const plotHeight = CHART_HEIGHT - CHART_PADDING * 2;

    return {
        maxValue,
        pointCount,
        getX: (index: number) => CHART_PADDING + (index * span) / Math.max(pointCount - 1, 1),
        getY: (value: number) => CHART_HEIGHT - CHART_PADDING - (value / maxValue) * plotHeight,
    };
}

/** Smooth cubic-bezier line through every point of one series. */
export function smoothPath(points: readonly CashflowPoint[], key: SeriesKey, scale: ChartScale): string {
    return points.reduce((path, point, index) => {
        const x = scale.getX(index);
        const y = scale.getY(point[key]);
        if (index === 0) return `M ${x},${y}`;

        const previousX = scale.getX(index - 1);
        const previousY = scale.getY(points[index - 1][key]);
        const controlX = previousX + (x - previousX) / 2;
        return `${path} C ${controlX},${previousY} ${controlX},${y} ${x},${y}`;
    }, '');
}

/** Closes a line path down to the baseline so it can be filled with a gradient. */
export function areaPath(linePath: string, scale: ChartScale): string {
    if (!linePath) return '';
    const baseline = CHART_HEIGHT - CHART_PADDING;
    const lastX = scale.getX(Math.max(scale.pointCount - 1, 0));
    const firstX = scale.getX(0);
    return `${linePath} L ${lastX},${baseline} L ${firstX},${baseline} Z`;
}

/** Y positions of the four dashed horizontal gridlines. */
export function gridLines(scale: ChartScale): number[] {
    return [0, scale.maxValue * 0.33, scale.maxValue * 0.66, scale.maxValue].map((value) => scale.getY(value));
}

/**
 * Horizontal placement of the hover tooltip, as a percentage of the plot width,
 * clamped so it never overflows either edge.
 */
export function tooltipLeftPercent(index: number, pointCount: number): number {
    const ratio = index / Math.max(pointCount - 1, 1);
    return Math.min(Math.max(ratio * 80 + 5, 5), 75);
}

/**
 * Calculates which data point indices should display an X-axis label so labels never
 * collide or squish horizontally across the chart width.
 * Returns a Set of 0-based indices that should render tick labels.
 */
export function getVisibleTickIndices(pointCount: number, maxTicks = 7): Set<number> {
    if (pointCount <= 0) return new Set();
    if (pointCount <= maxTicks) {
        return new Set(Array.from({ length: pointCount }, (_, i) => i));
    }
    const indices = new Set<number>();
    const count = maxTicks - 1;
    for (let i = 0; i <= count; i++) {
        const index = Math.round((i * (pointCount - 1)) / count);
        indices.add(index);
    }
    return indices;
}

