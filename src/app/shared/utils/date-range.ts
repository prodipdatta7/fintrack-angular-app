import { Timeframe } from '../../core/models/dashboard.model';

export interface DateRange {
    from?: string;
    to?: string;
}

/**
 * Computes exact ISO start and end timestamps for a given Timeframe.
 * Supports rolling intervals (7D, 15D, 30D, 60D, 6M, 1Y),
 * calendar periods (This Month, This Year), and open-ended (All).
 *
 * @param timeframe The selected timeframe preset.
 * @param customRange Optional start and end dates when timeframe is 'Custom'.
 * @param baseDate Optional reference date (defaults to new Date()). Useful for deterministic testing.
 */
export function timeframeToDateRange(
    timeframe: Timeframe,
    customRange?: DateRange,
    baseDate: Date = new Date(),
): DateRange {
    if (timeframe === 'All') {
        return {};
    }

    if (timeframe === 'Custom') {
        return {
            from: customRange?.from || undefined,
            to: customRange?.to || undefined,
        };
    }

    const to = baseDate.toISOString();
    const fromDate = new Date(baseDate);

    switch (timeframe) {
        case '7D':
            fromDate.setDate(baseDate.getDate() - 7);
            return { from: fromDate.toISOString(), to };

        case '15D':
            fromDate.setDate(baseDate.getDate() - 15);
            return { from: fromDate.toISOString(), to };

        case '30D':
            fromDate.setDate(baseDate.getDate() - 30);
            return { from: fromDate.toISOString(), to };

        case '60D':
            fromDate.setDate(baseDate.getDate() - 60);
            return { from: fromDate.toISOString(), to };

        case '6M':
            fromDate.setMonth(baseDate.getMonth() - 6);
            return { from: fromDate.toISOString(), to };

        case '1Y':
            fromDate.setFullYear(baseDate.getFullYear() - 1);
            return { from: fromDate.toISOString(), to };

        case 'This Month': {
            const startOfMonth = new Date(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                1,
                0,
                0,
                0,
                0,
            );
            return { from: startOfMonth.toISOString(), to };
        }

        case 'This Year': {
            const startOfYear = new Date(
                baseDate.getFullYear(),
                0,
                1,
                0,
                0,
                0,
                0,
            );
            return { from: startOfYear.toISOString(), to };
        }

        default:
            return {};
    }
}

/**
 * Returns a human-friendly label for any Timeframe value.
 */
export function formatTimeframeLabel(timeframe: Timeframe): string {
    switch (timeframe) {
        case '7D':
            return '7 Days';
        case '15D':
            return '15 Days';
        case '30D':
            return '30 Days';
        case '60D':
            return '60 Days';
        case '6M':
            return '6 Months';
        case '1Y':
            return '1 Year';
        case 'This Month':
            return 'This Month';
        case 'This Year':
            return 'This Year';
        case 'All':
            return 'All Time';
        case 'Custom':
            return 'Custom Range';
        default:
            return timeframe;
    }
}
