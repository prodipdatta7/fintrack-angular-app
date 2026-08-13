/**
 * Geometry for the expense-allocation pie/donut chart.
 * Pure functions so slice maths are testable without mounting a component.
 */

export const PIE_SIZE = 220;
export const PIE_CX = PIE_SIZE / 2;
export const PIE_CY = PIE_SIZE / 2;
export const PIE_OUTER_R = 96;
export const PIE_INNER_R = 58;

/** Start at 12 o'clock and sweep clockwise. */
const START_OFFSET_DEG = -90;

export interface PieSliceInput {
    id: string;
    value: number;
    color: string;
}

export interface PieSlice {
    id: string;
    value: number;
    color: string;
    /** Share of the pie total, 0–100 (rounded). */
    percent: number;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    /** SVG path for a donut segment. */
    path: string;
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function polar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
    const radians = toRadians(angleDeg);
    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians),
    };
}

/**
 * Donut segment from `startAngle` to `endAngle` (degrees).
 * Full-circle (≈360°) is drawn as two half-rings so the arc commands stay valid.
 */
export function donutPath(
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    startAngle: number,
    endAngle: number,
): string {
    const sweep = endAngle - startAngle;
    if (sweep <= 0) return '';

    if (sweep >= 359.999) {
        const mid = startAngle + 180;
        return `${donutPath(cx, cy, outerR, innerR, startAngle, mid)} ${donutPath(cx, cy, outerR, innerR, mid, startAngle + 360)}`;
    }

    const largeArc = sweep > 180 ? 1 : 0;
    const outerStart = polar(cx, cy, outerR, startAngle);
    const outerEnd = polar(cx, cy, outerR, endAngle);
    const innerEnd = polar(cx, cy, innerR, endAngle);
    const innerStart = polar(cx, cy, innerR, startAngle);

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
    ].join(' ');
}

/** Build ordered donut slices; zero/negative values are skipped. */
export function buildPieSlices(
    items: readonly PieSliceInput[],
    totalOverride?: number,
    options: {
        cx?: number;
        cy?: number;
        outerR?: number;
        innerR?: number;
    } = {},
): PieSlice[] {
    const positive = items.filter((item) => item.value > 0);
    const total = totalOverride && totalOverride > 0
        ? totalOverride
        : positive.reduce((sum, item) => sum + item.value, 0);

    if (!positive.length || total <= 0) return [];

    const cx = options.cx ?? PIE_CX;
    const cy = options.cy ?? PIE_CY;
    const outerR = options.outerR ?? PIE_OUTER_R;
    const innerR = options.innerR ?? PIE_INNER_R;

    let cursor = START_OFFSET_DEG;
    return positive.map((item, index) => {
        const ratio = item.value / total;
        // Last slice absorbs leftover degrees so the ring always closes.
        const sweep =
            index === positive.length - 1
                ? START_OFFSET_DEG + 360 - cursor
                : ratio * 360;
        const startAngle = cursor;
        const endAngle = cursor + sweep;
        cursor = endAngle;

        return {
            id: item.id,
            value: item.value,
            color: item.color,
            percent: Math.min(Math.round(ratio * 100), 100),
            startAngle,
            endAngle,
            midAngle: startAngle + sweep / 2,
            path: donutPath(cx, cy, outerR, innerR, startAngle, endAngle),
        };
    });
}

/** Tooltip anchor as % of the plot box, near the slice midpoint. */
export function pieTooltipAnchor(
    midAngle: number,
    radius = (PIE_OUTER_R + PIE_INNER_R) / 2,
    cx = PIE_CX,
    cy = PIE_CY,
    size = PIE_SIZE,
): { left: number; top: number } {
    const point = polar(cx, cy, radius, midAngle);
    return {
        left: (point.x / size) * 100,
        top: (point.y / size) * 100,
    };
}
