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
} from './chart-geometry';
import { CashflowPoint } from '../../core/models/dashboard.model';

const points: CashflowPoint[] = [
    { label: 'Mar', income: 5800, expense: 2300 },
    { label: 'Apr', income: 6100, expense: 2850 },
    { label: 'May', income: 5900, expense: 2100 },
];

describe('chart-geometry', () => {
    describe('createScale', () => {
        it('should scale to the tallest series with 15% headroom', () => {
            const scale = createScale(points);
            expect(scale.maxValue).toBeCloseTo(6100 * 1.15, 5);
        });

        it('should never scale below the floor', () => {
            const scale = createScale([{ label: 'Jan', income: 10, expense: 5 }], 500);
            expect(scale.maxValue).toBeCloseTo(500 * 1.15, 5);
        });

        it('should fall back to the floor for an empty series', () => {
            const scale = createScale([], 1000);
            expect(scale.maxValue).toBeCloseTo(1150, 5);
            expect(scale.pointCount).toBe(0);
        });

        it('should spread x across the padded plot width', () => {
            const scale = createScale(points);
            expect(scale.getX(0)).toBe(CHART_PADDING);
            expect(scale.getX(2)).toBe(CHART_WIDTH - CHART_PADDING);
            expect(scale.getX(1)).toBe(CHART_WIDTH / 2);
        });

        it('should not divide by zero with a single point', () => {
            const scale = createScale([points[0]]);
            expect(scale.getX(0)).toBe(CHART_PADDING);
            expect(Number.isFinite(scale.getX(0))).toBeTrue();
        });

        it('should put zero on the baseline and the max at the top padding', () => {
            const scale = createScale(points);
            expect(scale.getY(0)).toBe(CHART_HEIGHT - CHART_PADDING);
            expect(scale.getY(scale.maxValue)).toBe(CHART_PADDING);
        });
    });

    describe('smoothPath', () => {
        it('should start with a move command at the first point', () => {
            const scale = createScale(points);
            const path = smoothPath(points, 'income', scale);
            expect(path.startsWith(`M ${scale.getX(0)},${scale.getY(points[0].income)}`)).toBeTrue();
        });

        it('should emit one cubic segment per subsequent point with a mid-point control x', () => {
            const scale = createScale(points);
            const path = smoothPath(points, 'expense', scale);
            const segments = path.split('C').length - 1;
            expect(segments).toBe(points.length - 1);

            const controlX = scale.getX(0) + (scale.getX(1) - scale.getX(0)) / 2;
            expect(path).toContain(`C ${controlX},${scale.getY(points[0].expense)} ${controlX},`);
        });

        it('should produce an empty path for an empty series', () => {
            expect(smoothPath([], 'income', createScale([]))).toBe('');
        });
    });

    describe('areaPath', () => {
        it('should close the line down to the baseline', () => {
            const scale = createScale(points);
            const line = smoothPath(points, 'income', scale);
            const baseline = CHART_HEIGHT - CHART_PADDING;
            expect(areaPath(line, scale)).toBe(
                `${line} L ${scale.getX(2)},${baseline} L ${scale.getX(0)},${baseline} Z`,
            );
        });

        it('should return an empty string when there is no line', () => {
            expect(areaPath('', createScale([]))).toBe('');
        });
    });

    it('should place four gridlines between the baseline and the top', () => {
        const scale = createScale(points);
        const lines = gridLines(scale);
        expect(lines.length).toBe(4);
        expect(lines[0]).toBe(CHART_HEIGHT - CHART_PADDING);
        expect(lines[3]).toBe(CHART_PADDING);
    });

    describe('tooltipLeftPercent', () => {
        it('should clamp to 5% at the left edge', () => {
            expect(tooltipLeftPercent(0, 6)).toBe(5);
        });

        it('should clamp to 75% at the right edge', () => {
            expect(tooltipLeftPercent(5, 6)).toBe(75);
        });

        it('should interpolate in between', () => {
            expect(tooltipLeftPercent(3, 6)).toBeCloseTo(53, 5);
        });

        it('should not divide by zero for a single point', () => {
            expect(tooltipLeftPercent(0, 1)).toBe(5);
        });
    });

    describe('getVisibleTickIndices', () => {
        it('should return an empty set for 0 points', () => {
            expect(getVisibleTickIndices(0).size).toBe(0);
        });

        it('should return all indices when pointCount <= maxTicks', () => {
            const set = getVisibleTickIndices(5, 7);
            expect(set.size).toBe(5);
            expect(Array.from(set)).toEqual([0, 1, 2, 3, 4]);
        });

        it('should return exactly maxTicks evenly distributed indices for 30 points', () => {
            const set = getVisibleTickIndices(30, 7);
            expect(set.size).toBe(7);
            expect(set.has(0)).toBeTrue();
            expect(set.has(29)).toBeTrue();
        });

        it('should return exactly maxTicks evenly distributed indices for 60 points', () => {
            const set = getVisibleTickIndices(60, 7);
            expect(set.size).toBe(7);
            expect(set.has(0)).toBeTrue();
            expect(set.has(59)).toBeTrue();
        });
    });
});
