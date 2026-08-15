import { timeframeToDateRange, formatTimeframeLabel } from './date-range';

describe('date-range utility', () => {
    // Fixed base date: August 15, 2026 14:00:00 UTC
    const baseDate = new Date(Date.UTC(2026, 7, 15, 14, 0, 0, 0));

    it('should compute 7D interval correctly', () => {
        const range = timeframeToDateRange('7D', undefined, baseDate);
        expect(range.to).toBe(baseDate.toISOString());
        expect(range.from).toBe(new Date(Date.UTC(2026, 7, 8, 14, 0, 0, 0)).toISOString());
    });

    it('should compute 15D interval correctly', () => {
        const range = timeframeToDateRange('15D', undefined, baseDate);
        expect(range.to).toBe(baseDate.toISOString());
        expect(range.from).toBe(new Date(Date.UTC(2026, 6, 31, 14, 0, 0, 0)).toISOString());
    });

    it('should compute 30D interval correctly', () => {
        const range = timeframeToDateRange('30D', undefined, baseDate);
        expect(range.to).toBe(baseDate.toISOString());
        expect(range.from).toBe(new Date(Date.UTC(2026, 6, 16, 14, 0, 0, 0)).toISOString());
    });

    it('should compute This Month from the 1st of current month', () => {
        const range = timeframeToDateRange('This Month', undefined, baseDate);
        expect(range.to).toBe(baseDate.toISOString());
        const expectedFrom = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0).toISOString();
        expect(range.from).toBe(expectedFrom);
    });

    it('should compute This Year from Jan 1st of current year', () => {
        const range = timeframeToDateRange('This Year', undefined, baseDate);
        expect(range.to).toBe(baseDate.toISOString());
        const expectedFrom = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0, 0).toISOString();
        expect(range.from).toBe(expectedFrom);
    });

    it('should return empty range for All', () => {
        const range = timeframeToDateRange('All', undefined, baseDate);
        expect(range).toEqual({});
    });

    it('should return custom range when Custom is specified', () => {
        const custom = { from: '2026-01-01T00:00:00Z', to: '2026-06-30T23:59:59Z' };
        const range = timeframeToDateRange('Custom', custom, baseDate);
        expect(range).toEqual(custom);
    });

    it('should format timeframe labels accurately', () => {
        expect(formatTimeframeLabel('7D')).toBe('7 Days');
        expect(formatTimeframeLabel('This Month')).toBe('This Month');
        expect(formatTimeframeLabel('This Year')).toBe('This Year');
        expect(formatTimeframeLabel('All')).toBe('All Time');
    });
});
