import {
    PIE_CX,
    PIE_CY,
    PIE_INNER_R,
    PIE_OUTER_R,
    buildPieSlices,
    donutPath,
    pieTooltipAnchor,
} from './pie-geometry';

describe('pie-geometry', () => {
    describe('donutPath', () => {
        it('should return an empty path for a non-positive sweep', () => {
            expect(donutPath(PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R, 0, 0)).toBe('');
            expect(donutPath(PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R, 10, 5)).toBe('');
        });

        it('should emit a closed path with outer and inner arcs', () => {
            const path = donutPath(PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R, -90, 0);
            expect(path.startsWith('M ')).toBeTrue();
            expect(path).toContain(' A ');
            expect(path.endsWith('Z')).toBeTrue();
        });

        it('should split a full circle into two half-rings', () => {
            const path = donutPath(PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R, -90, 270);
            expect(path.split('M ').length - 1).toBe(2);
        });
    });

    describe('buildPieSlices', () => {
        it('should skip zero and negative values', () => {
            const slices = buildPieSlices([
                { id: 'a', value: 100, color: '#111' },
                { id: 'b', value: 0, color: '#222' },
                { id: 'c', value: -5, color: '#333' },
            ]);
            expect(slices.map((s) => s.id)).toEqual(['a']);
            expect(slices[0].percent).toBe(100);
        });

        it('should allocate percentage shares of the total', () => {
            const slices = buildPieSlices(
                [
                    { id: 'a', value: 1550, color: '#6366f1' },
                    { id: 'b', value: 900, color: '#22c55e' },
                ],
                2450,
            );
            expect(slices[0].percent).toBe(63);
            expect(slices[1].percent).toBe(37);
            expect(slices[0].color).toBe('#6366f1');
            expect(slices[1].color).toBe('#22c55e');
        });

        it('should return an empty list when nothing was spent', () => {
            expect(buildPieSlices([{ id: 'a', value: 0, color: '#111' }])).toEqual([]);
            expect(buildPieSlices([], 0)).toEqual([]);
        });

        it('should close the ring so the last slice ends at the start offset + 360', () => {
            const slices = buildPieSlices([
                { id: 'a', value: 1, color: '#111' },
                { id: 'b', value: 1, color: '#222' },
                { id: 'c', value: 1, color: '#333' },
            ]);
            expect(slices[0].startAngle).toBe(-90);
            expect(slices[slices.length - 1].endAngle).toBe(270);
        });
    });

    describe('pieTooltipAnchor', () => {
        it('should place the tooltip near the top for a 12 o\'clock mid-angle', () => {
            const anchor = pieTooltipAnchor(-90);
            expect(anchor.left).toBeCloseTo(50, 0);
            expect(anchor.top).toBeLessThan(50);
        });
    });
});
